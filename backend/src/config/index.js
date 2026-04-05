/**
 * Central configuration loader for TMC TimeIntel backend
 * Loads environment variables and exports normalized config
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * Parse DATABASE_URL connection string into components
 * Supports: postgresql://user:password@host:port/dbname
 */
function parseDatabaseUrl(url) {
  if (!url) return { host: 'localhost', port: 5432, user: 'timeintel', password: '', database: 'timeintel' };
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '5432', 10),
      user: parsed.username || 'timeintel',
      password: decodeURIComponent(parsed.password || ''),
      database: parsed.pathname.replace('/', '') || 'timeintel',
    };
  } catch (err) {
    console.warn('Failed to parse DATABASE_URL, using defaults:', err.message);
    return { host: 'localhost', port: 5432, user: 'timeintel', password: '', database: 'timeintel' };
  }
}

/**
 * Parse REDIS_URL connection string into components
 * Supports: redis://:password@host:port or redis://host:port
 * Uses manual parsing to handle passwords with special chars (%, {, etc.)
 */
function parseRedisUrl(url) {
  if (!url) return { host: 'localhost', port: 6379, password: undefined };
  try {
    // Strip scheme (redis:// or rediss://)
    let rest = url.replace(/^rediss?:\/\//, '');
    let password = undefined;
    let hostPort;

    // Check for @ separator (credentials present)
    const atIndex = rest.lastIndexOf('@');
    if (atIndex !== -1) {
      const authPart = rest.substring(0, atIndex);
      hostPort = rest.substring(atIndex + 1);
      // Auth can be ":password" or "user:password"
      const colonIndex = authPart.indexOf(':');
      if (colonIndex !== -1) {
        password = authPart.substring(colonIndex + 1);
      } else if (authPart) {
        password = authPart;
      }
    } else {
      hostPort = rest;
    }

    // Strip any path/query (e.g., /0?timeout=5)
    hostPort = hostPort.split('/')[0].split('?')[0];

    const [host, portStr] = hostPort.split(':');
    return {
      host: host || 'localhost',
      port: parseInt(portStr || '6379', 10),
      password: password || undefined,
    };
  } catch (err) {
    console.warn('Failed to parse REDIS_URL, using defaults:', err.message);
    return { host: 'localhost', port: 6379, password: undefined };
  }
}

const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
const redisConfig = parseRedisUrl(process.env.REDIS_URL);

const config = {
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: parseInt(process.env.PORT || '8080', 10),
  DEBUG: process.env.DEBUG === 'true',

  // Google Cloud Configuration
  GCP_PROJECT_ID: process.env.GCP_PROJECT_ID,
  CLOUD_SQL_CONNECTION: `${dbConfig.host}:${dbConfig.port}`,

  // Database (parsed from DATABASE_URL or individual env vars)
  DATABASE_URL: process.env.DATABASE_URL,
  DB_USER: process.env.DB_USER || dbConfig.user,
  DB_PASSWORD: process.env.DB_PASSWORD || dbConfig.password,
  DB_NAME: process.env.DB_NAME || dbConfig.database,
  DB_HOST: dbConfig.host,
  DB_PORT: dbConfig.port,

  // Redis (parsed from REDIS_URL or individual env vars)
  REDIS_URL: process.env.REDIS_URL,
  REDIS_HOST: process.env.REDIS_HOST || redisConfig.host,
  REDIS_PORT: parseInt(process.env.REDIS_PORT || String(redisConfig.port), 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || redisConfig.password,

  // External APIs
  PROJECTFLOW_API_URL: process.env.PROJECTFLOW_API_URL || 'https://projectflow.tmcltd.ai/api',
  PROJECTFLOW_API_KEY: process.env.PROJECTFLOW_API_KEY || '',

  // Vertex AI
  VERTEX_AI_LOCATION: process.env.VERTEX_AI_LOCATION || 'asia-south1',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-pro',

  // Firebase
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT_ID || 'tmcltd-timeintel',

  // Google Chat
  GOOGLE_CHAT_WEBHOOK_URL: process.env.GOOGLE_CHAT_WEBHOOK_URL,

  // Application Settings
  ALLOWED_DOMAIN: process.env.ALLOWED_DOMAIN || 'tmcltd.ai',
  ADMIN_EMAIL: 'haseeb@tmcltd.ai',

  // OAuth Scopes
  OAUTH_SCOPES: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/tasks',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],

  // Rate Limiting (requests per minute)
  RATE_LIMITS: {
    general: 200,
    write: 50,
    projectflow_sync: 20,
  },

  // Caching TTLs (seconds)
  CACHE_TTL: {
    user_settings: 3600,
    task_list: 300,
    calendar_events: 600,
    team_stats: 1800,
  },

  // Timeouts (milliseconds)
  TIMEOUTS: {
    google_api: 10000,
    projectflow_api: 15000,
    database: 5000,
    redis: 3000,
  },

  // Notification Settings
  NOTIFICATION_SETTINGS: {
    max_per_day: 20,
    quiet_hours_start: 18,
    quiet_hours_end: 9,
  },
};

/**
 * Validate required configuration values
 * Logs warnings for missing non-critical config; only throws for truly essential vars
 */
function validateConfig() {
  // Critical: server cannot function without these
  const critical = ['GCP_PROJECT_ID'];
  // Important but non-fatal: features degrade gracefully without these
  const recommended = ['FIREBASE_PROJECT_ID', 'PROJECTFLOW_API_URL', 'PROJECTFLOW_API_KEY'];

  const missingCritical = critical.filter(key => !config[key]);
  const missingRecommended = recommended.filter(key => !config[key]);

  if (missingCritical.length > 0) {
    throw new Error(
      `Missing critical environment variables: ${missingCritical.join(', ')}`
    );
  }

  if (missingRecommended.length > 0) {
    console.warn(
      `Warning: Missing recommended environment variables (some features may be limited): ${missingRecommended.join(', ')}`
    );
  }
}

validateConfig();

export default config;
