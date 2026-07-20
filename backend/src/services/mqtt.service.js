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
  temperature: Joi.number().allow(null),
  milkVolume: Joi.number().allow(null),
  tankLevel: Joi.number().allow(null),
  compressor1: Joi.object({ status: Joi.boolean(), runningHours: Joi.number() }).unknown(true).allow(null),
  compressor2: Joi.object({ status: Joi.boolean(), runningHours: Joi.number() }).unknown(true).allow(null),
  compressor3: Joi.object({ status: Joi.boolean(), runningHours: Joi.number() }).unknown(true).allow(null),
  agitator1: Joi.object({ status: Joi.boolean(), runningHours: Joi.number() }).unknown(true).allow(null),
  agitator2: Joi.object({ status: Joi.boolean(), runningHours: Joi.number() }).unknown(true).allow(null),
  gridStatus: Joi.boolean().allow(null),
  gridHours: Joi.number().allow(null),
  dgStatus: Joi.boolean().allow(null),
  dgHours: Joi.number().allow(null),
  kwh: Joi.number().allow(null),
  cipStatus: Joi.boolean().allow(null),
  dispatchStatus: Joi.boolean().allow(null),
  milkMode: Joi.boolean().allow(null),
  waterMode: Joi.boolean().allow(null),
  mediaType: Joi.number().integer().min(0).max(2).allow(null),
  fat: Joi.number().allow(null),
  snf: Joi.number().allow(null),
  firmware: Joi.string().allow(null, ''),
  hardwareVersion: Joi.string().allow(null, ''),
  status: Joi.object().unknown(true).allow(null),
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

      // Subscribe to the new telemetry topic format
      client.subscribe(MQTT_TOPICS.NEW_TELEMETRY, { qos: 1 }, (err) => {
        if (err) console.error('❌ Failed to subscribe to new telemetry:', err);
        else console.log('✅ Subscribed to new telemetry topic');
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

        // Route new telemetry format: MPDSET/1/<UID>
        if (topic.includes('MPDDATA/1/') || topic.includes('MPDSET/1/')) {
          const deviceCode = topicParts[topicParts.length - 1];
          const device = await Device.findOne({ where: { deviceCode } });
          if (!device) {
            console.warn(`⚠️ Unknown device from new telemetry: ${deviceCode}`);
            return;
          }
          const transformed = this.transformNewTelemetry(payload, device);
          await this.handleTelemetry(deviceCode, transformed);
          return;
        }

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
   * Helper to transform the new device JSON structure to telemetrySchema format
   */
  transformNewTelemetry(payload, device) {
    const capacity = device ? device.tankCapacity : 5000;
    
    // Parse Date and Time (DT: "DDMMYY", TM: "HHMMSS")
    let timestamp = new Date();
    if (payload.DT && payload.TM) {
      const day = parseInt(payload.DT.substring(0, 2), 10);
      const month = parseInt(payload.DT.substring(2, 4), 10) - 1;
      const year = 2000 + parseInt(payload.DT.substring(4, 6), 10);
      const hours = parseInt(payload.TM.substring(0, 2), 10);
      const minutes = parseInt(payload.TM.substring(2, 4), 10);
      const seconds = parseInt(payload.TM.substring(4, 6), 10);
      
      const parsedDate = new Date(year, month, day, hours, minutes, seconds);
      if (!isNaN(parsedDate.getTime())) {
        timestamp = parsedDate;
      }
    }
    
    // Extract compressor status arrays
    // 1 = OFF, 2 = ON, 3 = TRIP
    const comp1Val = Array.isArray(payload.COMPRESSOR) && payload.COMPRESSOR[0] !== undefined ? payload.COMPRESSOR[0] : 1;
    const comp2Val = Array.isArray(payload.COMPRESSOR) && payload.COMPRESSOR[1] !== undefined ? payload.COMPRESSOR[1] : 1;
    const comp3Val = Array.isArray(payload.COMPRESSOR) && payload.COMPRESSOR[2] !== undefined ? payload.COMPRESSOR[2] : 1;

    const agitator1Val = Array.isArray(payload.AGITATOR) && payload.AGITATOR[0] !== undefined ? payload.AGITATOR[0] : false;
    const agitator2Val = Array.isArray(payload.AGITATOR) && payload.AGITATOR[1] !== undefined ? payload.AGITATOR[1] : false;

    // Track running hours dynamically by comparing time difference with previous database entry
    let compressor1Hours = 0;
    let compressor2Hours = 0;
    let compressor3Hours = 0;
    let agitator1Hours = 0;
    let agitator2Hours = 0;
    let gridHours = 0;
    let dgHours = 0;

    const lastTelemetry = device ? device.lastTelemetry : null;
    if (lastTelemetry) {
      compressor1Hours = lastTelemetry.compressor1?.runningHours || 0;
      compressor2Hours = lastTelemetry.compressor2?.runningHours || 0;
      compressor3Hours = lastTelemetry.compressor3?.runningHours || 0;
      agitator1Hours = lastTelemetry.agitator1?.runningHours || 0;
      agitator2Hours = lastTelemetry.agitator2?.runningHours || 0;
      gridHours = lastTelemetry.gridHours || 0;
      dgHours = lastTelemetry.dgHours || 0;

      const timeDiffHrs = (timestamp - new Date(lastTelemetry.timestamp)) / 3600000;
      if (timeDiffHrs > 0 && timeDiffHrs < 1.0) { // Limit interval to 1 hr to prevent runaway numbers
        if (comp1Val === 2) compressor1Hours += timeDiffHrs;
        if (comp2Val === 2) compressor2Hours += timeDiffHrs;
        if (comp3Val === 2) compressor3Hours += timeDiffHrs;
        if (agitator1Val) agitator1Hours += timeDiffHrs;
        if (agitator2Val) agitator2Hours += timeDiffHrs;
        if (payload.POWER?.GRID) gridHours += timeDiffHrs;
        if (payload.POWER?.DG) dgHours += timeDiffHrs;
      }
    }

    const getCompStateName = (val) => {
      if (val === 2) return 'ON';
      if (val === 3) return 'TRIP';
      return 'OFF';
    };

    const getProcessName = (val) => {
      const names = ['EMPTY', 'CIP', 'DISPATCH', 'CHILLING', 'IDLE'];
      return names[val] || 'UNKNOWN';
    };

    const getMediaName = (val) => {
      const names = ['EMPTY', 'WATER', 'MILK'];
      return names[val] || 'UNKNOWN';
    };

    const getTypeName = (val) => {
      if (val === 'N') return 'Normal';
      if (val === 'A') return 'Alarm';
      if (val === 'O') return 'On-demand/Event';
      return 'Unknown';
    };

    const getDiName = (index) => {
      const names = [
        'Power Grid Status',
        'Diesel Generator Status',
        'Agitator 1 Status',
        'Agitator 2 Status',
        'Compressor 1 Status',
        'Compressor 2 Status',
        'Compressor 3 Status',
        'RTD Fault Status'
      ];
      return names[index] || `DI Pin ${index}`;
    };

    const volume = payload.VOLUME_L !== undefined ? payload.VOLUME_L : 0;
    const tankLevel = capacity > 0 ? Math.round((volume / capacity) * 100) : 0;

    return {
      deviceId: payload.UID || device?.deviceCode || 'unknown',
      timestamp: timestamp.toISOString(),
      temperature: payload.TEMP_C !== undefined ? payload.TEMP_C : null,
      milkVolume: volume,
      tankLevel: Math.min(100, Math.max(0, tankLevel)),
      compressor1: { 
        status: comp1Val === 2, 
        runningHours: Math.round(compressor1Hours * 10) / 10,
        state: comp1Val,
        stateName: getCompStateName(comp1Val)
      },
      compressor2: { 
        status: comp2Val === 2, 
        runningHours: Math.round(compressor2Hours * 10) / 10,
        state: comp2Val,
        stateName: getCompStateName(comp2Val)
      },
      compressor3: { 
        status: comp3Val === 2, 
        runningHours: Math.round(compressor3Hours * 10) / 10,
        state: comp3Val,
        stateName: getCompStateName(comp3Val)
      },
      agitator1: { status: agitator1Val, runningHours: Math.round(agitator1Hours * 10) / 10 },
      agitator2: { status: agitator2Val, runningHours: Math.round(agitator2Hours * 10) / 10 },
      gridStatus: payload.POWER?.GRID || false,
      gridHours: Math.round(gridHours * 10) / 10,
      dgStatus: payload.POWER?.DG || false,
      dgHours: Math.round(dgHours * 10) / 10,
      kwh: payload.KWH !== undefined ? payload.KWH : null,
      cipStatus: payload.STATUS?.CIP || false,
      dispatchStatus: payload.STATUS?.DISPATCH || false,
      milkMode: payload.STATUS?.CHILLING || false,
      waterMode: payload.STATUS?.CIP || false,
      mediaType: payload.MEDIA !== undefined ? payload.MEDIA : 0,
      mediaName: getMediaName(payload.MEDIA),
      processType: payload.PROCESS !== undefined ? payload.PROCESS : 4,
      processName: getProcessName(payload.PROCESS),
      packetType: payload.TYPE || 'N',
      packetTypeName: getTypeName(payload.TYPE),
      fat: payload.MEDIA === 2 ? 4.2 : 0.0,
      snf: payload.MEDIA === 2 ? 8.5 : 0.0,
      firmware: "v1.2.5",
      hardwareVersion: "v2.0",
      levelMm: payload.LEVEL_MM !== undefined ? payload.LEVEL_MM : null,
      rtdFault: payload.RTD_FAULT || false,
      digitalInputs: Array.isArray(payload.DI) ? payload.DI.map((val, idx) => ({
        pin: idx,
        name: getDiName(idx),
        value: val,
        isActive: val === 0
      })) : [],
      rawDi: payload.DI || [],
      rawCtA: payload.CT_A || [],
      status: payload.STATUS || { CHILLING: false, DISPATCH: false, CIP: false, CIP_NEEDED: false },
    };
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

      if (data.temperature != null) point.floatField('temperature', data.temperature);
      if (data.milkVolume != null) point.floatField('milk_volume', data.milkVolume);
      if (data.tankLevel != null) point.floatField('tank_level', data.tankLevel);
      if (data.kwh != null) point.floatField('kwh', data.kwh);
      if (data.gridStatus != null) point.booleanField('grid_status', data.gridStatus);
      if (data.dgStatus != null) point.booleanField('dg_status', data.dgStatus);
      if (data.gridHours != null) point.floatField('grid_hours', data.gridHours);
      if (data.dgHours != null) point.floatField('dg_hours', data.dgHours);
      if (data.cipStatus != null) point.booleanField('cip_status', data.cipStatus);
      if (data.dispatchStatus != null) point.booleanField('dispatch_status', data.dispatchStatus);
      if (data.mediaType != null) point.intField('media_type', data.mediaType);
      if (data.fat != null) point.floatField('fat', data.fat);
      if (data.snf != null) point.floatField('snf', data.snf);

      // Compressors
      for (let i = 1; i <= 3; i++) {
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

      // Milk under temperature alert
      const underTempConfig = await getAlertConfig(ALERT_TYPES.MILK_UNDER_TEMPERATURE);
      if (underTempConfig?.enabled !== false && data.temperature != null) {
        const threshold = underTempConfig?.threshold ?? 2.0;
        if (data.temperature < threshold) {
          await this.createAlert(device, ALERT_TYPES.MILK_UNDER_TEMPERATURE, ALERT_SEVERITY.CRITICAL,
            `Milk temperature ${data.temperature}°C is below threshold ${threshold}°C`,
            data.temperature, threshold);
        }
      }

      // Milk temperature critical
      const critTempConfig = await getAlertConfig(ALERT_TYPES.MILK_TEMPERATURE_CRITICAL);
      if (critTempConfig?.enabled !== false && data.temperature != null) {
        const threshold = critTempConfig?.threshold ?? (device.setTemperature + 8);
        if (data.temperature > threshold) {
          await this.createAlert(device, ALERT_TYPES.MILK_TEMPERATURE_CRITICAL, ALERT_SEVERITY.EMERGENCY,
            `CRITICAL: Milk temperature ${data.temperature}°C is dangerously high`,
            data.temperature, threshold);
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
    const createdAlert = await Alert.create({
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

    // Send push notifications to users assigned to this route / region
    try {
      const notificationService = require('./notification.service');
      await notificationService.sendAlertNotifications(device, { type, severity, message });
    } catch (err) {
      console.error('❌ Push notification trigger error:', err.message);
    }
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
