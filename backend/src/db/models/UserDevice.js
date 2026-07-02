'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserDevice = sequelize.define('UserDevice', {
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    deviceId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    assignedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'user_devices',
    timestamps: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['device_id'] },
    ],
  });

  return UserDevice;
};
