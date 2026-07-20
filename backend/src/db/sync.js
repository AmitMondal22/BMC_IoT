'use strict';

const { sequelize } = require('./models');

async function syncDatabase() {
  console.log('🔄 Starting database models synchronization...');
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    
    // Sync all models (creates tables if they do not exist, or updates them if alter: true)
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Unable to connect or sync the database:', error);
    process.exit(1);
  }
}

syncDatabase();
