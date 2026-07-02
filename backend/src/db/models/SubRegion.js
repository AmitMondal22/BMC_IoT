'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SubRegion = sequelize.define('SubRegion', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    regionId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
  }, {
    tableName: 'sub_regions',
    indexes: [
      { fields: ['code'], unique: true },
      { fields: ['region_id'] },
      { fields: ['status'] },
    ],
  });

  return SubRegion;
};
