/**
 * Rate limiting middleware
 * Implements different rate limits for different operation types
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../config/redis.js';
import config from '../config/index.js';

/**
 * Key generator for rate limiter
 * Uses user ID if available, otherwise IP address
 * @param {Object} req - Express request
 * @returns {string} Rate limit key
 */
function keyGenerator(req) {
  return req.user?.id || req.ip;
}

/**
 * Handler when rate limit is exceeded
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
function rateLimitHandler(req, res) {
  return res.status(429).json({
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: req.rateLimit?.resetTime
      ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
      : 60,
  });
}

/**
 * Create a Redis store for rate limiting with fallback to memory store
 * @param {string} prefix - Redis key prefix
 * @returns {Object|undefined} RedisStore instance or undefined (uses memory)
 */
function createStore(prefix) {
  try {
    return new RedisStore({
      client: redis,
      prefix,
    });
  } catch (err) {
    console.warn(`Rate limiter: Redis store failed for ${prefix}, falling back to memory store:`, err.message);
    return undefined; // express-rate-limit will use memory store
  }
}

/**
 * General rate limiter - 200 requests per minute
 * Applied to most endpoints
 */
export const generalLimiter = rateLimit({
  store: createStore('rate-limit:general:'),
  windowMs: 60 * 1000, // 1 minute
  max: config.RATE_LIMITS.general, // 200 requests
  message: 'Too many requests',
  standardHeaders: false, // Don't return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

/**
 * Write operation rate limiter - 50 requests per minute
 * Applied to POST, PUT, DELETE endpoints
 */
export const writeLimiter = rateLimit({
  store: createStore('rate-limit:write:'),
  windowMs: 60 * 1000, // 1 minute
  max: config.RATE_LIMITS.write, // 50 requests
  message: 'Too many write requests',
  standardHeaders: false,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
});

/**
 * ProjectFlow sync rate limiter - 20 requests per minute
 * Applied to ProjectFlow sync operations
 */
export const projectflowSyncLimiter = rateLimit({
  store: createStore('rate-limit:pf-sync:'),
  windowMs: 60 * 1000, // 1 minute
  max: config.RATE_LIMITS.projectflow_sync, // 20 requests
  message: 'ProjectFlow sync rate limit exceeded',
  standardHeaders: false,
  legacyHeaders: false,
  keyGenerator,
  handler: (req, res) => {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'ProjectFlow sync rate limit exceeded. Please try again in a minute.',
      retryAfter: 60,
    });
  },
});

/**
 * Authentication rate limiter - stricter for security
 * Applied to login/auth endpoints - 10 requests per minute
 */
export const authLimiter = rateLimit({
  store: createStore('rate-limit:auth:'),
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests
  message: 'Too many authentication attempts',
  standardHeaders: false,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip, // Use IP only for auth endpoints
  handler: (req, res) => {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many login attempts. Please try again in a few minutes.',
      retryAfter: 300,
    });
  },
  skip: (req) => {
    // Skip if using valid auth header
    return req.headers.authorization && req.headers.authorization.startsWith('Bearer ');
  },
});

/**
 * Composite middleware for standard endpoint protection
 * Applies general rate limit + write limit if applicable
 */
export function standardLimiter(req, res, next) {
  // Check if it's a write operation
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return writeLimiter(req, res, next);
  }
  return generalLimiter(req, res, next);
}

export default generalLimiter;
