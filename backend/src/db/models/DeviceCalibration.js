'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DeviceCalibration = sequelize.define('DeviceCalibration', {
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
      type: DataTypes.ENUM('temperature', 'volume', 'offset', 'sensor'),
      allowNull: false,
    },
    parameters: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'Calibration parameters (offset, scale, lookup table, etc.)',
    },
    calibratedBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    calibratedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'device_calibrations',
    indexes: [
      { fields: ['device_id'] },
      { fields: ['type'] },
      { fields: ['calibrated_at'] },
    ],
  });

  return DeviceCalibration;
};
