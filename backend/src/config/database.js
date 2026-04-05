/**
 * PostgreSQL database connection pool configuration
 * Uses pg (node-postgres) for connection pooling
 */

import pkg from 'pg';
import config from './index.js';

const { Pool } = pkg;

/**
 * PostgreSQL connection pool with optimized settings
 * Supports DATABASE_URL connection string or individual config values
 * @type {Pool}
 */
const poolConfig = config.DATABASE_URL
  ? {
      connectionString: config.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      statement_timeout: 10000,
      query_timeout: 10000,
    }
  : {
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      host: config.DB_HOST || config.CLOUD_SQL_CONNECTION.split(':')[0],
      port: config.DB_PORT || parseInt(config.CLOUD_SQL_CONNECTION.split(':')[1] || '5432', 10),
      database: config.DB_NAME,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      statement_timeout: 10000,
      query_timeout: 10000,
    };

const pool = new Pool(poolConfig);

/**
 * Handle pool errors
 */
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  if (config.DEBUG) {
    console.log('Database pool connection created');
  }
});

/**
 * Execute a parameterized query
 * @param {string} text - SQL query text with $1, $2 placeholders
 * @param {Array} values - Query parameters
 * @returns {Promise<Object>} Query result
 */
export async function query(text, values = []) {
  const start = Date.now();
  try {
    const result = await pool.query(text, values);
    const duration = Date.now() - start;
    if (config.DEBUG && duration > 1000) {
      console.log('Slow query detected:', {
        text: text.substring(0, 50),
        duration,
        rows: result.rowCount,
      });
    }
    return result;
  } catch (err) {
    console.error('Database query error:', { text, err: err.message });
    throw err;
  }
}

/**
 * Get a client from the pool for transactions
 * @returns {Promise<PoolClient>}
 */
export async function getClient() {
  return pool.connect();
}

/**
 * Close the pool (graceful shutdown)
 * @returns {Promise<void>}
 */
export async function closePool() {
  await pool.end();
}

export { pool };
