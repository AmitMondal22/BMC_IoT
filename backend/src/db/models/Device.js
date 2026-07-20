'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Device = sequelize.define('Device', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    deviceCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    deviceName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    routeId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    regionId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    tankCapacity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Tank capacity in liters',
    },
    minTankVolume: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Minimum tank volume threshold in liters',
    },
    setTemperature: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 4.0,
      comment: 'Target milk temperature in celsius',
    },
    dieselConsumption: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
      comment: 'DG diesel consumption rate (liters/hour)',
    },
    alertMobileNumbers: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Phone numbers for SMS/push alerts',
    },
    firmwareVersion: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    hardwareVersion: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    mqttUsername: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    mqttPassword: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
      defaultValue: 'active',
    },
    connectionStatus: {
      type: DataTypes.ENUM('online', 'offline'),
      defaultValue: 'offline',
    },
    lastSeen: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastTelemetry: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Last received telemetry snapshot',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Additional device metadata',
    },
  }, {
    tableName: 'devices',
    indexes: [
      { fields: ['device_code'], unique: true },
      { fields: ['route_id'] },
      { fields: ['region_id'] },
      { fields: ['status'] },
      { fields: ['connection_status'] },
      { fields: ['last_seen'] },
    ],
  });

  return Device;
};
