/**
 * Application constants and enums
 */

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  USER: 'user',
};

const DEVICE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
};

const CONNECTION_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
};

const ALERT_TYPES = {
  HIGH_TEMPERATURE: 'high_temperature',
  OFFLINE: 'offline',
  POWER_FAILURE: 'power_failure',
  DG_RUNNING: 'dg_running',
  MILK_TEMPERATURE_CRITICAL: 'milk_temperature_critical',
  VOLUME_LOW: 'volume_low',
  TANK_EMPTY: 'tank_empty',
  DISPATCH_STARTED: 'dispatch_started',
  DISPATCH_COMPLETED: 'dispatch_completed',
  CIP_STARTED: 'cip_started',
  CIP_COMPLETED: 'cip_completed',
  CIP_PENDING: 'cip_pending',
  COMPRESSOR_FAILURE: 'compressor_failure',
  AGITATOR_FAILURE: 'agitator_failure',
  SENSOR_FAILURE: 'sensor_failure',
};

const ALERT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
  EMERGENCY: 'emergency',
};

const CALIBRATION_TYPES = {
  TEMPERATURE: 'temperature',
  VOLUME: 'volume',
  OFFSET: 'offset',
  SENSOR: 'sensor',
};

const MQTT_TOPICS = {
  TELEMETRY: 'bmc/device/+/telemetry',
  STATUS: 'bmc/device/+/status',
  EVENT: 'bmc/device/+/event',
  ALERT: 'bmc/device/+/alert',
  HEARTBEAT: 'bmc/device/+/heartbeat',
  CONFIG: 'bmc/device/+/config',
  ACK: 'bmc/device/+/ack',
};

const CACHE_KEYS = {
  DEVICE_STATUS: (deviceId) => `device:status:${deviceId}`,
  DEVICE_TELEMETRY: (deviceId) => `device:telemetry:${deviceId}`,
  DASHBOARD_SUMMARY: 'dashboard:summary',
  USER_SESSION: (userId) => `session:${userId}`,
  OTP: (phone) => `otp:${phone}`,
};

const CACHE_TTL = {
  DEVICE_STATUS: 300,      // 5 minutes
  DEVICE_TELEMETRY: 120,   // 2 minutes
  DASHBOARD_SUMMARY: 30,   // 30 seconds
  USER_SESSION: 900,       // 15 minutes
  OTP: 300,                // 5 minutes
};

module.exports = {
  ROLES,
  DEVICE_STATUS,
  CONNECTION_STATUS,
  ALERT_TYPES,
  ALERT_SEVERITY,
  CALIBRATION_TYPES,
  MQTT_TOPICS,
  CACHE_KEYS,
  CACHE_TTL,
};
