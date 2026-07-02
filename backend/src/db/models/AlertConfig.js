'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AlertConfig = sequelize.define('AlertConfig', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    deviceId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    alertType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    threshold: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    cooldownMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 15,
      comment: 'Minimum interval between same type alerts',
    },
    notifyEmail: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    notifyPush: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    notifySms: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'alert_configs',
    indexes: [
      { fields: ['device_id'] },
      { fields: ['alert_type'] },
      { fields: ['device_id', 'alert_type'], unique: true },
    ],
  });

  return AlertConfig;
};
