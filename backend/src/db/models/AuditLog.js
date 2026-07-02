'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.',
    },
    entity: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Table/entity name (users, devices, etc.)',
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    oldValues: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    newValues: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'audit_logs',
    paranoid: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['entity'] },
      { fields: ['action'] },
      { fields: ['created_at'] },
    ],
  });

  return AuditLog;
};
