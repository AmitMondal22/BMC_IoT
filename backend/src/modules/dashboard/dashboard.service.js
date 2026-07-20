const { Op } = require('sequelize');
const { Device, Alert, User, Route, Region } = require('../../db/models');
const { getRedis } = require('../../config/redis');
const { CACHE_KEYS, CACHE_TTL } = require('../../utils/constants');

class DashboardService {
  async getSummary(userId, userRole) {
    const redis = getRedis();
    let orgFilter = null;
    if (userRole !== 'super_admin' && userId) {
      const user = await User.findByPk(userId);
      if (user && user.organizationId) {
        orgFilter = user.organizationId;
      }
    }

    const cacheKey = orgFilter ? `dashboard:summary:${orgFilter}` : CACHE_KEYS.DASHBOARD_SUMMARY;

    // Try cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (e) { /* proceed */ }

    const deviceInclude = [{
      model: Route,
      as: 'route',
      required: true,
      include: [{
        model: Region,
        as: 'region',
        required: true,
        where: { organizationId: orgFilter }
      }]
    }];

    // Calculate from DB
    const totalDevices = await Device.count(orgFilter ? { include: deviceInclude } : {});
    const activeDevices = await Device.count({
      where: { status: 'active' },
      ...(orgFilter ? { include: deviceInclude } : {})
    });
    const inactiveDevices = await Device.count({
      where: { status: 'inactive' },
      ...(orgFilter ? { include: deviceInclude } : {})
    });
    const onlineDevices = await Device.count({
      where: { connectionStatus: 'online', status: 'active' },
      ...(orgFilter ? { include: deviceInclude } : {})
    });
    const offlineDevices = Math.max(0, activeDevices - onlineDevices);

    const activeAlerts = await Alert.count({
      where: { acknowledged: false },
      ...(orgFilter ? {
        include: [{
          model: Device,
          as: 'device',
          required: true,
          include: deviceInclude
        }]
      } : {})
    });

    // Aggregate from last telemetry data
    const devicesWithTelemetry = await Device.findAll({
      where: { status: 'active', lastTelemetry: { [Op.ne]: null } },
      attributes: ['id', 'lastTelemetry', 'connectionStatus'],
      ...(orgFilter ? { include: deviceInclude } : {}),
      raw: true,
    });

    let totalVolume = 0;
    let totalTemperature = 0;
    let tempCount = 0;
    let runningCompressors = 0;
    let runningDG = 0;
    let powerFailure = 0;
    let cipDevices = 0;
    let dispatchDevices = 0;
    let highTempDevices = 0;

    devicesWithTelemetry.forEach((d) => {
      // In raw mode, fields will have flat names or nested names, but lastTelemetry is mapped as a property of device.
      // Wait, Sequelize raw query with dot notation maps it as lastTelemetry or 'lastTelemetry' depending on nest: true/false.
      // Since it's raw, it will be `lastTelemetry`.
      const t = d.lastTelemetry || d['lastTelemetry'];
      if (!t) return;

      if (t.milkVolume) totalVolume += parseFloat(t.milkVolume) || 0;
      if (t.temperature != null) {
        totalTemperature += parseFloat(t.temperature) || 0;
        tempCount++;
      }
      if (t.compressor1?.status || t.compressor2?.status || t.compressor3?.status) runningCompressors++;
      if (t.dgStatus) runningDG++;
      if (!t.gridStatus) powerFailure++;
      if (t.cipStatus) cipDevices++;
      if (t.dispatchStatus) dispatchDevices++;
      if (t.temperature > 8) highTempDevices++;
    });

    const summary = {
      totalDevices,
      activeDevices,
      inactiveDevices,
      onlineDevices,
      offlineDevices,
      activeAlerts,
      totalVolume: Math.round(totalVolume * 100) / 100,
      averageTemperature: tempCount > 0 ? Math.round((totalTemperature / tempCount) * 100) / 100 : 0,
      runningCompressors,
      runningDG,
      powerFailure,
      cipDevices,
      dispatchDevices,
      highTempDevices,
    };

    // Cache summary
    try {
      await redis.setex(cacheKey, CACHE_TTL.DASHBOARD_SUMMARY, JSON.stringify(summary));
    } catch (e) { /* ok */ }

    return summary;
  }

  async getDeviceStatusGrid(userId, userRole) {
    let orgFilter = null;
    if (userRole !== 'super_admin' && userId) {
      const user = await User.findByPk(userId);
      if (user && user.organizationId) {
        orgFilter = user.organizationId;
      }
    }

    const queryOptions = {
      where: { status: 'active' },
      attributes: ['id', 'deviceCode', 'deviceName', 'connectionStatus', 'lastSeen', 'lastTelemetry', 'tankCapacity', 'setTemperature'],
      order: [['deviceName', 'ASC']],
    };

    if (orgFilter) {
      queryOptions.include = [{
        model: Route,
        as: 'route',
        required: true,
        include: [{
          model: Region,
          as: 'region',
          required: true,
          where: { organizationId: orgFilter }
        }]
      }];
    }

    const devices = await Device.findAll(queryOptions);
    return devices;
  }

  async getRecentAlerts(limit = 20, userId, userRole) {
    let orgFilter = null;
    if (userRole !== 'super_admin' && userId) {
      const user = await User.findByPk(userId);
      if (user && user.organizationId) {
        orgFilter = user.organizationId;
      }
    }

    const queryOptions = {
      where: { acknowledged: false },
      include: [{
        model: Device,
        as: 'device',
        attributes: ['id', 'deviceCode', 'deviceName'],
        required: true,
        ...(orgFilter ? {
          include: [{
            model: Route,
            as: 'route',
            required: true,
            include: [{
              model: Region,
              as: 'region',
              required: true,
              where: { organizationId: orgFilter }
            }]
          }]
        } : {})
      }],
      order: [['createdAt', 'DESC']],
      limit,
    };

    const alerts = await Alert.findAll(queryOptions);
    return alerts;
  }
}

module.exports = new DashboardService();
