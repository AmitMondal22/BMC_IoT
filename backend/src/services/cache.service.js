const { getRedis } = require('../config/redis');

class CacheService {
  /**
   * Get value from cache
   */
  async get(key) {
    const redis = getRedis();
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Set value in cache with TTL
   */
  async set(key, value, ttl = 300) {
    const redis = getRedis();
    await redis.setex(key, ttl, JSON.stringify(value));
  }

  /**
   * Delete key from cache
   */
  async del(key) {
    const redis = getRedis();
    await redis.del(key);
  }

  /**
   * Delete keys by pattern
   */
  async delPattern(pattern) {
    const redis = getRedis();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    const redis = getRedis();
    return redis.exists(key);
  }
}

module.exports = new CacheService();
