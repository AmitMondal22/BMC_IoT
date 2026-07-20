'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('super_admin', 'admin', 'user'),
      defaultValue: 'user',
      allowNull: false,
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    regionId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    routeId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active',
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    passwordResetToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    passwordResetExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    otpCode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    otpExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fcmToken: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  }, {
    tableName: 'users',
    indexes: [
      { fields: ['email'], unique: true },
      { fields: ['role'] },
      { fields: ['organization_id'] },
      { fields: ['region_id'] },
      { fields: ['route_id'] },
      { fields: ['status'] },
    ],
  });

  return User;
};
