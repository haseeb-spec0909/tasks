/**
 * Central configuration loader for TMC TimeIntel backend
 * Loads environment variables and exports normalized config
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * @typedef {Object} Config
 * @property {string} NODE_ENV - Environment (development, production, test)
 * @property {number} PORT - Server port
 * @property {string} GCP_PROJECT_ID - Google Cloud Project ID
 * @property {string} CLOUD_SQL_CONNECTION - Cloud SQL connection string
 * @property {string} REDIS_HOST - Redis host
 * @property {number} REDIS_PORT - Redis port
 * @property {string} REDIS_PASSWORD - Redis password (optional)
 * @property {string} PROJECTFLOW_API_URL - ProjectFlow API base URL
 * @property {string} PROJECTFLOW_API_KEY - ProjectFlow API key
 * @property {string} VERTEX_AI_LOCATION - Vertex AI location (e.g., us-central1)
 * @property {string} GEMINI_MODEL - Gemini model name (e.g., gemini-1.5-pro)
 * @property {string} FIREBASE_PROJECT_ID - Firebase project ID
 * @property {string} GOOGLE_CHAT_WEBHOOK_URL - Google Chat incoming webhook
 * @property {string} ALLOWED_DOMAIN - Allowed email domain
 * @property {Object} OAUTH_SCOPES - Google OAuth scopes
 * @property {boolean} DEBUG - Debug mode flag
 */

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '8080', 10),
  DEBUG: process.env.DEBUG === 'true',

  // Google Cloud Configuration
  GCP_PROJECT_ID: process.env.GCP_PROJECT_ID,
  CLOUD_SQL_CONNECTION: process.env.CLOUD_SQL_CONNECTION || 'localhost:5432',
  
  // Database
  DB_USER: process.env.DB_USER || 'timeintel',
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME || 'timeintel',
  
  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,

  // External APIs
  PROJECTFLOW_API_URL: process.env.PROJECTFLOW_API_URL,
  PROJECTFLOW_API_KEY: process.env.PROJECTFLOW_API_KEY,

  // Vertex AI
  VERTEX_AI_LOCATION: process.env.VERTEX_AI_LOCATION || 'us-central1',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-pro',

  // Firebase
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,

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
 * @throws {Error} If critical config is missing
 */
function validateConfig() {
  const required = [
    'GCP_PROJECT_ID',
    'FIREBASE_PROJECT_ID',
    'PROJECTFLOW_API_URL',
    'PROJECTFLOW_API_KEY',
  ];

  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    if (config.NODE_ENV === 'production') {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`
      );
    }
    console.warn(
      `Warning: Missing environment variables in development: ${missing.join(', ')}`
    );
  }
}

validateConfig();

export default config;
