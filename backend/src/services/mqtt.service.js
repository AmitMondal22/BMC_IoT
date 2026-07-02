const { Point } = require('@influxdata/influxdb-client');
const Joi = require('joi');
const { getMQTT } = require('../config/mqtt');
const { getWriteApi } = require('../config/influxdb');
const { getRedis } = require('../config/redis');
const { Device, Alert, AlertConfig } = require('../db/models');
const { MQTT_TOPICS, CACHE_KEYS, CACHE_TTL, ALERT_TYPES, ALERT_SEVERITY } = require('../utils/constants');

// Telemetry payload validation schema
const telemetrySchema = Joi.object({
  deviceId: Joi.string().required(),
  timestamp: Joi.date().iso().default(() => new Date()),
  milkTemperature: Joi.number().allow(null),
  waterTemperature: Joi.number().allow(null),
  milkVolume: Joi.number().allow(null),
  tankLevel: Joi.number().allow(null),
  compressor1: Joi.object({ status: Joi.boolean(), runningHours: Joi.number() }).allow(null),
  compressor2: Joi.object({ status: Joi.boolean(), runningHours: Joi.number() }).allow(null),
  compressor3: Joi.object({ status: Joi.boolean(), runningHours: Joi.number() }).allow(null),
  compressor4: Joi.object({ status: Joi.boolean(), runningHours: Joi.number() }).allow(null),
  agitator1: Joi.object({ status: Joi.boolean(), runningHours: Joi.number() }).allow(null),
  agitator2: Joi.object({ status: Joi.boolean(), runningHours: Joi.number() }).allow(null),
  gridStatus: Joi.boolean().allow(null),
  gridHours: Joi.number().allow(null),
  dgStatus: Joi.boolean().allow(null),
  dgHours: Joi.number().allow(null),
  kwh: Joi.number().allow(null),
  cipStatus: Joi.boolean().allow(null),
  dispatchStatus: Joi.boolean().allow(null),
  milkMode: Joi.boolean().allow(null),
  waterMode: Joi.boolean().allow(null),
  firmware: Joi.string().allow(null, ''),
  hardwareVersion: Joi.string().allow(null, ''),
}).unknown(true);

class MQTTService {
  constructor() {
    this.wsClients = new Set();
  }

  /**
   * Initialize MQTT subscriptions and message handling
   */
  start() {
    const client = getMQTT();

    client.on('connect', () => {
      console.log('📡 MQTT Service: Subscribing to topics...');

      // Subscribe to all device telemetry
      client.subscribe(MQTT_TOPICS.TELEMETRY, { qos: 1 }, (err) => {
        if (err) console.error('❌ Failed to subscribe to telemetry:', err);
        else console.log('✅ Subscribed to telemetry topic');
      });

      client.subscribe(MQTT_TOPICS.HEARTBEAT, { qos: 0 }, (err) => {
        if (err) console.error('❌ Failed to subscribe to heartbeat:', err);
        else console.log('✅ Subscribed to heartbeat topic');
      });

      client.subscribe(MQTT_TOPICS.STATUS, { qos: 1 });
    });

    client.on('message', async (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        const topicParts = topic.split('/');
        const deviceCode = topicParts[2]; // bmc/device/{deviceCode}/...
        const messageType = topicParts[3]; // telemetry, heartbeat, status, etc.

        switch (messageType) {
          case 'telemetry':
            await this.handleTelemetry(deviceCode, payload);
            break;
          case 'heartbeat':
            await this.handleHeartbeat(deviceCode, payload);
            break;
          case 'status':
            await this.handleStatus(deviceCode, payload);
            break;
          default:
            console.log(`Unknown message type: ${messageType}`);
        }
      } catch (err) {
        console.error('❌ MQTT message processing error:', err.message);
      }
    });
  }

  /**
   * Process telemetry data
   */
  async handleTelemetry(deviceCode, payload) {
    // Validate payload
    const { error, value } = telemetrySchema.validate(payload, { stripUnknown: false });
    if (error) {
      console.warn(`⚠️ Invalid telemetry from ${deviceCode}:`, error.message);
      return;
    }

    // Find device in DB
    const device = await Device.findOne({ where: { deviceCode } });
    if (!device) {
      console.warn(`⚠️ Unknown device: ${deviceCode}`);
      return;
    }

    // 1. Write to InfluxDB (time-series)
    await this.writeToInflux(device.id, deviceCode, value);

    // 2. Update DragonflyDB cache (real-time state)
    await this.updateCache(device.id, value);

    // 3. Update device record
    await device.update({
      connectionStatus: 'online',
      lastSeen: new Date(),
      lastTelemetry: value,
    });

    // 4. Check alert rules
    await this.checkAlerts(device, value);

    // 5. Broadcast to WebSocket clients
    this.broadcastWebSocket({
      type: 'telemetry',
      deviceId: device.id,
      deviceCode,
      data: value,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Write telemetry to InfluxDB
   */
  async writeToInflux(deviceId, deviceCode, data) {
    try {
      const writeApi = getWriteApi();

      const point = new Point('device_telemetry')
        .tag('deviceId', deviceId)
        .tag('deviceCode', deviceCode);

      if (data.milkTemperature != null) point.floatField('milk_temperature', data.milkTemperature);
      if (data.waterTemperature != null) point.floatField('water_temperature', data.waterTemperature);
      if (data.milkVolume != null) point.floatField('milk_volume', data.milkVolume);
      if (data.tankLevel != null) point.floatField('tank_level', data.tankLevel);
      if (data.kwh != null) point.floatField('kwh', data.kwh);
      if (data.gridStatus != null) point.booleanField('grid_status', data.gridStatus);
      if (data.dgStatus != null) point.booleanField('dg_status', data.dgStatus);
      if (data.gridHours != null) point.floatField('grid_hours', data.gridHours);
      if (data.dgHours != null) point.floatField('dg_hours', data.dgHours);
      if (data.cipStatus != null) point.booleanField('cip_status', data.cipStatus);
      if (data.dispatchStatus != null) point.booleanField('dispatch_status', data.dispatchStatus);

      // Compressors
      for (let i = 1; i <= 4; i++) {
        const comp = data[`compressor${i}`];
        if (comp) {
          point.booleanField(`compressor${i}_status`, comp.status || false);
          point.floatField(`compressor${i}_hours`, comp.runningHours || 0);
        }
      }

      // Agitators
      for (let i = 1; i <= 2; i++) {
        const agi = data[`agitator${i}`];
        if (agi) {
          point.booleanField(`agitator${i}_status`, agi.status || false);
          point.floatField(`agitator${i}_hours`, agi.runningHours || 0);
        }
      }

      writeApi.writePoint(point);
    } catch (err) {
      console.error('❌ InfluxDB write error:', err.message);
    }
  }

  /**
   * Update device state in DragonflyDB
   */
  async updateCache(deviceId, data) {
    try {
      const redis = getRedis();
      await redis.setex(
        CACHE_KEYS.DEVICE_TELEMETRY(deviceId),
        CACHE_TTL.DEVICE_TELEMETRY,
        JSON.stringify(data)
      );
      await redis.setex(
        CACHE_KEYS.DEVICE_STATUS(deviceId),
        CACHE_TTL.DEVICE_STATUS,
        JSON.stringify({ status: 'online', lastSeen: new Date().toISOString() })
      );

      // Invalidate dashboard cache
      await redis.del(CACHE_KEYS.DASHBOARD_SUMMARY);
    } catch (err) {
      console.error('❌ Cache update error:', err.message);
    }
  }

  /**
   * Check alert rules against incoming telemetry
   */
  async checkAlerts(device, data) {
    try {
      const getAlertConfig = async (type) => {
        return await AlertConfig.findOne({ where: { deviceId: device.id, alertType: type } });
      };

      // High temperature alert
      const highTempConfig = await getAlertConfig(ALERT_TYPES.HIGH_TEMPERATURE);
      if (highTempConfig?.enabled !== false && data.milkTemperature != null) {
        const threshold = highTempConfig?.threshold ?? (device.setTemperature + 4);
        if (data.milkTemperature > threshold) {
          await this.createAlert(device, ALERT_TYPES.HIGH_TEMPERATURE, ALERT_SEVERITY.CRITICAL,
            `Milk temperature ${data.milkTemperature}°C exceeds threshold`,
            data.milkTemperature, threshold);
        }
      }

      // Milk temperature critical
      const critTempConfig = await getAlertConfig(ALERT_TYPES.MILK_TEMPERATURE_CRITICAL);
      if (critTempConfig?.enabled !== false && data.milkTemperature != null) {
        const threshold = critTempConfig?.threshold ?? (device.setTemperature + 8);
        if (data.milkTemperature > threshold) {
          await this.createAlert(device, ALERT_TYPES.MILK_TEMPERATURE_CRITICAL, ALERT_SEVERITY.EMERGENCY,
            `CRITICAL: Milk temperature ${data.milkTemperature}°C is dangerously high`,
            data.milkTemperature, threshold);
        }
      }

      // Volume low
      const volConfig = await getAlertConfig(ALERT_TYPES.VOLUME_LOW);
      if (volConfig?.enabled !== false && data.milkVolume != null && data.milkVolume > 0) {
        const threshold = volConfig?.threshold ?? device.minTankVolume;
        if (data.milkVolume < threshold) {
          await this.createAlert(device, ALERT_TYPES.VOLUME_LOW, ALERT_SEVERITY.WARNING,
            `Milk volume ${data.milkVolume}L is below minimum ${threshold}L`,
            data.milkVolume, threshold);
        }
      }

      // Power failure
      const powerConfig = await getAlertConfig(ALERT_TYPES.POWER_FAILURE);
      if (powerConfig?.enabled !== false && data.gridStatus === false) {
        await this.createAlert(device, ALERT_TYPES.POWER_FAILURE, ALERT_SEVERITY.WARNING,
          'Grid power failure detected', 0, 1);
      }

      // DG running
      const dgConfig = await getAlertConfig(ALERT_TYPES.DG_RUNNING);
      if (dgConfig?.enabled !== false && data.dgStatus === true) {
        await this.createAlert(device, ALERT_TYPES.DG_RUNNING, ALERT_SEVERITY.INFO,
          'DG generator is running', 1, 0);
      }

      // CIP status alerts
      const cipConfig = await getAlertConfig(ALERT_TYPES.CIP_STARTED);
      if (cipConfig?.enabled !== false && data.cipStatus === true) {
        await this.createAlert(device, ALERT_TYPES.CIP_STARTED, ALERT_SEVERITY.INFO,
          'CIP process started', 1, 0);
      }

      // Dispatch alerts
      const dispConfig = await getAlertConfig(ALERT_TYPES.DISPATCH_STARTED);
      if (dispConfig?.enabled !== false && data.dispatchStatus === true) {
        await this.createAlert(device, ALERT_TYPES.DISPATCH_STARTED, ALERT_SEVERITY.INFO,
          'Milk dispatch started', 1, 0);
      }
    } catch (err) {
      console.error('❌ Alert check error:', err.message);
    }
  }

  /**
   * Create alert with cooldown check
   */
  async createAlert(device, type, severity, message, value, threshold) {
    const redis = getRedis();
    const cooldownKey = `alert:cooldown:${device.id}:${type}`;

    // Check cooldown
    const inCooldown = await redis.get(cooldownKey);
    if (inCooldown) return;

    // Create alert
    await Alert.create({
      deviceId: device.id,
      type,
      severity,
      message,
      value,
      threshold,
    });

    // Set cooldown (15 minutes default)
    await redis.setex(cooldownKey, 900, '1');

    // Broadcast alert via WebSocket
    this.broadcastWebSocket({
      type: 'alert',
      deviceId: device.id,
      deviceCode: device.deviceCode,
      alertType: type,
      severity,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle heartbeat (just updates online status)
   */
  async handleHeartbeat(deviceCode, payload) {
    const device = await Device.findOne({ where: { deviceCode } });
    if (!device) return;

    await device.update({
      connectionStatus: 'online',
      lastSeen: new Date(),
    });

    const redis = getRedis();
    await redis.setex(
      CACHE_KEYS.DEVICE_STATUS(device.id),
      CACHE_TTL.DEVICE_STATUS,
      JSON.stringify({ status: 'online', lastSeen: new Date().toISOString() })
    );
  }

  /**
   * Handle device status changes
   */
  async handleStatus(deviceCode, payload) {
    const device = await Device.findOne({ where: { deviceCode } });
    if (!device) return;

    const status = payload.status || 'online';
    await device.update({
      connectionStatus: status,
      lastSeen: new Date(),
    });
  }

  /**
   * Register a WebSocket client for live updates
   */
  addWSClient(socket) {
    this.wsClients.add(socket);
    socket.on('close', () => this.wsClients.delete(socket));
  }

  /**
   * Broadcast data to all connected WebSocket clients
   */
  broadcastWebSocket(data) {
    const message = JSON.stringify(data);
    this.wsClients.forEach((client) => {
      try {
        client.send(message);
      } catch (e) {
        this.wsClients.delete(client);
      }
    });
  }
}

module.exports = new MQTTService();
