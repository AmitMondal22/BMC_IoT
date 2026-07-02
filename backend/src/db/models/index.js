'use strict';

const { Sequelize } = require('sequelize');
const env = require('../../config/env');

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: env.db.dialect,
  logging: env.isDev ? false : false,
  define: {
    timestamps: true,
    underscored: true,
    paranoid: true,
  },
  pool: {
    max: env.isDev ? 20 : 50,
    min: env.isDev ? 5 : 10,
    acquire: 30000,
    idle: 10000,
  },
});

const db = {};

// Import models
db.User = require('./User')(sequelize);
db.Organization = require('./Organization')(sequelize);
db.Region = require('./Region')(sequelize);
db.SubRegion = require('./SubRegion')(sequelize);
db.Route = require('./Route')(sequelize);
db.Device = require('./Device')(sequelize);
db.DeviceCalibration = require('./DeviceCalibration')(sequelize);
db.UserDevice = require('./UserDevice')(sequelize);
db.Alert = require('./Alert')(sequelize);
db.AlertConfig = require('./AlertConfig')(sequelize);
db.AuditLog = require('./AuditLog')(sequelize);
db.Setting = require('./Setting')(sequelize);

// ===================== ASSOCIATIONS =====================

// Organization → Region
db.Organization.hasMany(db.Region, { foreignKey: 'organizationId', as: 'regions' });
db.Region.belongsTo(db.Organization, { foreignKey: 'organizationId', as: 'organization' });

// Region → SubRegion
db.Region.hasMany(db.SubRegion, { foreignKey: 'regionId', as: 'subRegions' });
db.SubRegion.belongsTo(db.Region, { foreignKey: 'regionId', as: 'region' });

// SubRegion → Route
db.SubRegion.hasMany(db.Route, { foreignKey: 'subRegionId', as: 'routes' });
db.Route.belongsTo(db.SubRegion, { foreignKey: 'subRegionId', as: 'subRegion' });

// Route → Device
db.Route.hasMany(db.Device, { foreignKey: 'routeId', as: 'devices' });
db.Device.belongsTo(db.Route, { foreignKey: 'routeId', as: 'route' });

// Organization → User
db.Organization.hasMany(db.User, { foreignKey: 'organizationId', as: 'users' });
db.User.belongsTo(db.Organization, { foreignKey: 'organizationId', as: 'organization' });

// User ↔ Device (Many-to-Many through UserDevice)
db.User.belongsToMany(db.Device, { through: db.UserDevice, foreignKey: 'userId', as: 'devices' });
db.Device.belongsToMany(db.User, { through: db.UserDevice, foreignKey: 'deviceId', as: 'users' });

// Device → DeviceCalibration
db.Device.hasMany(db.DeviceCalibration, { foreignKey: 'deviceId', as: 'calibrations' });
db.DeviceCalibration.belongsTo(db.Device, { foreignKey: 'deviceId', as: 'device' });

// Device → Alert
db.Device.hasMany(db.Alert, { foreignKey: 'deviceId', as: 'alerts' });
db.Alert.belongsTo(db.Device, { foreignKey: 'deviceId', as: 'device' });

// Device → AlertConfig
db.Device.hasMany(db.AlertConfig, { foreignKey: 'deviceId', as: 'alertConfigs' });
db.AlertConfig.belongsTo(db.Device, { foreignKey: 'deviceId', as: 'device' });

// User → AuditLog
db.User.hasMany(db.AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
db.AuditLog.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

// User → Alert (acknowledgedBy)
db.User.hasMany(db.Alert, { foreignKey: 'acknowledgedBy', as: 'acknowledgedAlerts' });
db.Alert.belongsTo(db.User, { foreignKey: 'acknowledgedBy', as: 'acknowledger' });

// DeviceCalibration → User (calibratedBy)
db.User.hasMany(db.DeviceCalibration, { foreignKey: 'calibratedBy', as: 'calibrations' });
db.DeviceCalibration.belongsTo(db.User, { foreignKey: 'calibratedBy', as: 'calibrator' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
