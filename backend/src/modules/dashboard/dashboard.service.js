const { Op, fn, col, literal } = require('sequelize');
const { Device, Alert } = require('../../db/models');
const { getRedis } = require('../../config/redis');
const { CACHE_KEYS, CACHE_TTL } = require('../../utils/constants');

class DashboardService {
  async getSummary() {
    const redis = getRedis();

    // Try cache first
    try {
      const cached = await redis.get(CACHE_KEYS.DASHBOARD_SUMMARY);
      if (cached) return JSON.parse(cached);
    } catch (e) { /* proceed */ }

    // Calculate from DB
    const totalDevices = await Device.count({ where: { status: 'active' } });
    const onlineDevices = await Device.count({ where: { connectionStatus: 'online', status: 'active' } });
    const offlineDevices = totalDevices - onlineDevices;

    const activeAlerts = await Alert.count({ where: { acknowledged: false } });

    // Aggregate from last telemetry data
    const devicesWithTelemetry = await Device.findAll({
      where: { status: 'active', lastTelemetry: { [Op.ne]: null } },
      attributes: ['id', 'lastTelemetry', 'connectionStatus'],
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
      const t = d.lastTelemetry;
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

    // Cache for 30 seconds
    try {
      await redis.setex(CACHE_KEYS.DASHBOARD_SUMMARY, CACHE_TTL.DASHBOARD_SUMMARY, JSON.stringify(summary));
    } catch (e) { /* ok */ }

    return summary;
  }

  async getDeviceStatusGrid() {
    const devices = await Device.findAll({
      where: { status: 'active' },
      attributes: ['id', 'deviceCode', 'deviceName', 'connectionStatus', 'lastSeen', 'lastTelemetry', 'tankCapacity', 'setTemperature'],
      order: [['deviceName', 'ASC']],
    });

    return devices;
  }

  async getRecentAlerts(limit = 20) {
    const alerts = await Alert.findAll({
      where: { acknowledged: false },
      include: [{ model: Device, as: 'device', attributes: ['id', 'deviceCode', 'deviceName'] }],
      order: [['createdAt', 'DESC']],
      limit,
    });

    return alerts;
  }
}

module.exports = new DashboardService();
