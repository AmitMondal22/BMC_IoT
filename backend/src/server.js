const buildApp = require('./app');
const env = require('./config/env');
const { sequelize } = require('./db/models');
const { initRedis, closeRedis } = require('./config/redis');
const { initInfluxDB, closeInfluxDB } = require('./config/influxdb');
const { initMQTT, closeMQTT } = require('./config/mqtt');
const mqttService = require('./services/mqtt.service');

async function start() {
  const app = buildApp();

  try {
    // 1. Connect to PostgreSQL
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');

    // Sync models in dev (use migrations in production)
    if (env.isDev) {
      await sequelize.sync({ alter: true });
      console.log('✅ Database synced');
    }

    // 2. Connect to DragonflyDB/Redis
    const redis = initRedis();
    await redis.connect();
    console.log('✅ DragonflyDB connected');

    // 3. Connect to InfluxDB
    initInfluxDB();
    console.log('✅ InfluxDB initialized');

    // 4. Connect to MQTT and start consumer
    initMQTT();
    mqttService.start();
    console.log('✅ MQTT consumer started');

    // 5. Start background report scheduler
    const reportScheduler = require('./modules/report/report.scheduler');
    reportScheduler.start();

    // 6. Start Fastify server
    await app.listen({ port: env.port, host: env.host });
    console.log(`\n🚀 BMC IoT Platform API running at http://${env.host}:${env.port}`);
    console.log(`📚 API Docs: http://localhost:${env.port}/docs\n`);

  } catch (err) {
    console.error('❌ Startup failed:', err);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down...`);
    await app.close();
    await sequelize.close();
    await closeRedis();
    await closeInfluxDB();
    await closeMQTT();
    const reportScheduler = require('./modules/report/report.scheduler');
    reportScheduler.stop();
    console.log('👋 Server stopped');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
