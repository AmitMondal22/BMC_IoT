const Redis = require('ioredis');
const env = require('./env');

let redisClient = null;

/**
 * Initialize DragonflyDB/Redis connection
 */
function initRedis() {
  redisClient = new Redis({
    host: env.redis.host,
    port: env.redis.port,
    password: env.redis.password,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true,
    keepAlive: 30000,
  });

  redisClient.on('connect', () => {
    console.log('✅ DragonflyDB/Redis connected');
  });

  redisClient.on('error', (err) => {
    console.error('❌ DragonflyDB/Redis error:', err.message);
  });

  return redisClient;
}

function getRedis() {
  if (!redisClient) {
    initRedis();
  }
  return redisClient;
}

async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
  }
}

module.exports = {
  initRedis,
  getRedis,
  closeRedis,
};
