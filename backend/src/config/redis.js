/**
 * Redis client configuration using ioredis
 * Provides caching layer for performance optimization
 */

import Redis from 'ioredis';
import config from './index.js';

/**
 * Redis client instance
 * Supports REDIS_URL connection string or individual host/port/password config
 * @type {Redis}
 */
const redisOptions = {
  retryStrategy: (times) => {
    if (times > 10) {
      console.error('Redis: max retries reached, stopping reconnect');
      return null; // Stop retrying after 10 attempts
    }
    const delay = Math.min(times * 200, 5000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  commandTimeout: config.TIMEOUTS.redis,
  lazyConnect: true, // Don't connect immediately - let the app start first
};

// Always use parsed host/port/password instead of raw URL
// (REDIS_URL may contain special chars that break URL parsing in ioredis)
const redis = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD || undefined,
  ...redisOptions,
});

// Connect asynchronously (non-blocking)
redis.connect().catch((err) => {
  console.error('Redis initial connection failed (will retry):', err.message);
});

redis.on('error', (err) => {
  console.error('Redis client error:', err);
});

redis.on('connect', () => {
  if (config.DEBUG) {
    console.log('Redis connected');
  }
});

/**
 * Get a JSON value from cache
 * @param {string} key - Cache key
 * @returns {Promise<Object|null>} Parsed JSON or null
 */
export async function getJSON(key) {
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.error('Redis getJSON error:', { key, err: err.message });
    return null;
  }
}

/**
 * Set a JSON value in cache with TTL
 * @param {string} key - Cache key
 * @param {Object} value - Value to cache
 * @param {number} ttl - Time to live in seconds (default: 3600)
 * @returns {Promise<void>}
 */
export async function setJSON(key, value, ttl = 3600) {
  try {
    const jsonString = JSON.stringify(value);
    if (ttl > 0) {
      await redis.setex(key, ttl, jsonString);
    } else {
      await redis.set(key, jsonString);
    }
  } catch (err) {
    console.error('Redis setJSON error:', { key, err: err.message });
  }
}

/**
 * Delete a cache key
 * @param {string} key - Cache key
 * @returns {Promise<number>} Number of keys deleted
 */
export async function deleteKey(key) {
  try {
    return await redis.del(key);
  } catch (err) {
    console.error('Redis deleteKey error:', { key, err: err.message });
    return 0;
  }
}

/**
 * Cache-through pattern: get from cache or fetch using provided function
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch value if not cached
 * @param {number} ttl - Cache TTL in seconds
 * @returns {Promise<Object>}
 */
export async function getOrSet(key, fetchFn, ttl = 3600) {
  try {
    // Try to get from cache
    const cached = await getJSON(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch using provided function
    const value = await fetchFn();
    
    // Store in cache
    if (value !== null && value !== undefined) {
      await setJSON(key, value, ttl);
    }

    return value;
  } catch (err) {
    console.error('Redis getOrSet error:', { key, err: err.message });
    // Fall back to calling the fetch function directly on error
    return fetchFn();
  }
}

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Redis key pattern (e.g., 'user:123:*')
 * @returns {Promise<number>} Number of keys deleted
 */
export async function invalidatePattern(pattern) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      return await redis.del(...keys);
    }
    return 0;
  } catch (err) {
    console.error('Redis invalidatePattern error:', { pattern, err: err.message });
    return 0;
  }
}

/**
 * Close Redis connection
 * @returns {Promise<void>}
 */
export async function closeRedis() {
  await redis.quit();
}

export default redis;
