'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Alert = sequelize.define('Alert', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    deviceId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        'high_temperature',
        'offline',
        'power_failure',
        'dg_running',
        'milk_temperature_critical',
        'volume_low',
        'tank_empty',
        'dispatch_started',
        'dispatch_completed',
        'cip_started',
        'cip_completed',
        'cip_pending',
        'compressor_failure',
        'agitator_failure',
        'sensor_failure'
      ),
      allowNull: false,
    },
    severity: {
      type: DataTypes.ENUM('info', 'warning', 'critical', 'emergency'),
      defaultValue: 'warning',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    value: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'The actual value that triggered the alert',
    },
    threshold: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'The threshold that was exceeded',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    acknowledged: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    acknowledgedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    acknowledgedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'alerts',
    indexes: [
      { fields: ['device_id'] },
      { fields: ['type'] },
      { fields: ['severity'] },
      { fields: ['acknowledged'] },
      { fields: ['created_at'] },
    ],
  });

  return Alert;
};
