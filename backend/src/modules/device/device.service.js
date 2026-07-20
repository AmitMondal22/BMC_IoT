const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const { Device, DeviceCalibration, Route, Region, User, AlertConfig } = require('../../db/models');
const { NotFoundError, ConflictError, BadRequestError, UnauthorizedError } = require('../../utils/errors');
const { getPagination, getPaginationMeta } = require('../../utils/pagination');
const { getRedis } = require('../../config/redis');
const { CACHE_KEYS, ALERT_TYPES } = require('../../utils/constants');

class DeviceService {
  async list(query, userId = null, userRole = null) {
    const { page, limit, offset } = getPagination(query);
    const where = {};

    if (query.search) {
      where[Op.or] = [
        { deviceCode: { [Op.iLike]: `%${query.search}%` } },
        { deviceName: { [Op.iLike]: `%${query.search}%` } },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.connectionStatus) where.connectionStatus = query.connectionStatus;
    if (query.routeId) where.routeId = query.routeId;

    const includeOpts = [
      {
        model: Route,
        as: 'route',
        attributes: ['id', 'name', 'code', 'regionId'],
        include: [{ model: Region, as: 'region', attributes: ['id', 'name', 'organizationId'] }],
      },
    ];

    if (userRole === 'admin' && userId) {
      const user = await User.findByPk(userId);
      if (user) {
        // Enforce organization scoping by requiring Region to belong to this organization
        includeOpts[0].required = true;
        includeOpts[0].include = [{
          model: Region,
          as: 'region',
          attributes: ['id', 'name', 'organizationId'],
          where: { organizationId: user.organizationId },
          required: true
        }];
      }
    }

    // If user role is 'user', only show devices scoped to their assigned Route or Region
    let queryOptions = { where, include: includeOpts, order: [['createdAt', 'DESC']], limit, offset };

    if (userRole === 'user' && userId) {
      const user = await User.findByPk(userId);
      if (user) {
        if (user.routeId) {
          where.routeId = user.routeId;
        } else if (user.regionId) {
          where.regionId = user.regionId;
        } else {
          where.id = null; // No assignments -> returns empty list
        }
      } else {
        where.id = null;
      }
    }

    const { count, rows } = await Device.findAndCountAll(queryOptions);

    // Enrich with live cache data
    const redis = getRedis();
    const enriched = await Promise.all(rows.map(async (device) => {
      const d = device.toJSON();
      try {
        const cached = await redis.get(CACHE_KEYS.DEVICE_TELEMETRY(device.id));
        if (cached) {
          d.liveTelemetry = JSON.parse(cached);
        }
      } catch (e) {
        // Cache miss is OK
      }
      return d;
    }));

    return { devices: enriched, pagination: getPaginationMeta(count, page, limit) };
  }

  async getById(id) {
    const device = await Device.findByPk(id, {
      include: [
        {
          model: Route, as: 'route',
          include: [{ model: Region, as: 'region' }],
        },
        { model: DeviceCalibration, as: 'calibrations', order: [['calibratedAt', 'DESC']], limit: 10 },
        { model: User, as: 'users', attributes: ['id', 'name', 'email'] },
      ],
    });
    if (!device) throw new NotFoundError('Device not found');

    // Enrich with live data
    const redis = getRedis();
    const result = device.toJSON();
    try {
      const cached = await redis.get(CACHE_KEYS.DEVICE_TELEMETRY(device.id));
      if (cached) result.liveTelemetry = JSON.parse(cached);
    } catch (e) { /* ok */ }

    return result;
  }

  async create(data) {
    const existing = await Device.findOne({ where: { deviceCode: data.deviceCode } });
    if (existing) throw new ConflictError('Device code already exists');

    // If routeId is provided but regionId is not, copy regionId from Route
    if (data.routeId && !data.regionId) {
      const route = await Route.findByPk(data.routeId);
      if (route) {
        data.regionId = route.regionId;
      }
    }

    const device = await Device.create(data);
    if (data.userIds && Array.isArray(data.userIds)) {
      await device.setUsers(data.userIds);
    }
    return device;
  }

  async update(id, data) {
    const device = await Device.findByPk(id);
    if (!device) throw new NotFoundError('Device not found');

    // If routeId is changed/supplied, update regionId accordingly if not explicitly supplied
    if (data.routeId && data.routeId !== device.routeId && !data.regionId) {
      const route = await Route.findByPk(data.routeId);
      if (route) {
        data.regionId = route.regionId;
      }
    }

    await device.update(data);
    if (data.userIds && Array.isArray(data.userIds)) {
      await device.setUsers(data.userIds);
    }
    return device;
  }

  async delete(id) {
    const device = await Device.findByPk(id);
    if (!device) throw new NotFoundError('Device not found');
    await device.destroy();
    return { message: 'Device deleted' };
  }

  async calibrate(id, data, userId) {
    const device = await Device.findByPk(id);
    if (!device) throw new NotFoundError('Device not found');

    const calibration = await DeviceCalibration.create({
      deviceId: id,
      type: data.type,
      parameters: data.parameters,
      calibratedBy: userId,
      calibratedAt: new Date(),
      notes: data.notes,
    });

    return calibration;
  }

  async getCalibrations(id) {
    const device = await Device.findByPk(id);
    if (!device) throw new NotFoundError('Device not found');

    return DeviceCalibration.findAll({
      where: { deviceId: id },
      include: [{ model: User, as: 'calibrator', attributes: ['id', 'name'] }],
      order: [['calibratedAt', 'DESC']],
    });
  }

  async getAlertConfigs(deviceId) {
    const device = await Device.findByPk(deviceId);
    if (!device) throw new NotFoundError('Device not found');

    let configs = await AlertConfig.findAll({ where: { deviceId } });

    const existingTypes = new Set(configs.map(c => c.alertType));
    const missingTypes = Object.values(ALERT_TYPES).filter(t => !existingTypes.has(t));

    if (missingTypes.length > 0) {
      const newConfigs = missingTypes.map(type => {
        let threshold = null;
        if (type === ALERT_TYPES.MILK_TEMPERATURE_CRITICAL) threshold = device.setTemperature + 8;
        if (type === ALERT_TYPES.MILK_UNDER_TEMPERATURE) threshold = 2.0; // 2°C default threshold

        return {
          deviceId,
          alertType: type,
          threshold,
          enabled: true,
          cooldownMinutes: 15,
          notifyEmail: true,
          notifyPush: true,
          notifySms: false,
        };
      });

      await AlertConfig.bulkCreate(newConfigs, { ignoreDuplicates: true });
      configs = await AlertConfig.findAll({ where: { deviceId } });
    }

    return configs;
  }

  async updateAlertConfigs(deviceId, data, userId) {
    const { password, configs } = data;
    if (!password) {
      throw new BadRequestError('Password is required to configure alerts');
    }

    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError('User not found');
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid password');
    }

    for (const conf of configs) {
      await AlertConfig.update(
        {
          enabled: conf.enabled,
          threshold: conf.threshold,
          cooldownMinutes: conf.cooldownMinutes,
          notifyEmail: conf.notifyEmail,
          notifyPush: conf.notifyPush,
          notifySms: conf.notifySms,
        },
        { where: { deviceId, alertType: conf.alertType } }
      );
    }

    return { message: 'Alert configurations updated successfully' };
  }

  async saveSnapshot(id, fileBuffer, filename, snapshotMeta) {
    const fs = require('fs');
    const path = require('path');

    const device = await Device.findByPk(id);
    if (!device) throw new NotFoundError('Device not found');

    const uploadDir = path.join(__dirname, '../../../public/uploads/snapshots');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, fileBuffer);

    const photoUrl = `/public/uploads/snapshots/${filename}`;
    const newSnapshot = {
      id: require('uuid').v4(),
      photoUrl,
      remarks: snapshotMeta.remarks,
      latitude: snapshotMeta.latitude,
      longitude: snapshotMeta.longitude,
      capturedAt: snapshotMeta.capturedAt,
      uploadedAt: new Date().toISOString(),
    };

    const currentMeta = device.metadata || {};
    const currentSnapshots = currentMeta.snapshots || [];
    currentMeta.snapshots = [newSnapshot, ...currentSnapshots];

    // Force updates to metadata field to ensure Sequelize detects changes
    await device.update({
      metadata: { ...currentMeta }
    });

    const redis = getRedis();
    await redis.del(CACHE_KEYS.DEVICE_TELEMETRY(id));

    return newSnapshot;
  }

  async sendCommand(deviceCode, command) {
    const { getMQTT } = require('../../config/mqtt');
    const client = getMQTT();
    const topic = `/MPDSUB/${deviceCode}`;
    
    return new Promise((resolve, reject) => {
      client.publish(topic, command, { qos: 1 }, (err) => {
        if (err) {
          console.error(`❌ Failed to publish command to ${topic}:`, err.message);
          reject(err);
        } else {
          console.log(`📤 Command published to ${topic}: ${command}`);
          resolve();
        }
      });
    });
  }
}

module.exports = new DeviceService();
