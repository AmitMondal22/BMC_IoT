const env = require('./env');

module.exports = {
  development: {
    username: env.db.user,
    password: env.db.password,
    database: env.db.name,
    host: env.db.host,
    port: env.db.port,
    dialect: env.db.dialect,
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true,
    },
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
    },
  },
  production: {
    username: env.db.user,
    password: env.db.password,
    database: env.db.name,
    host: env.db.host,
    port: env.db.port,
    dialect: env.db.dialect,
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true,
    },
    pool: {
      max: 50,
      min: 10,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: process.env.DB_SSL === 'true' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    } : {},
  },
};
