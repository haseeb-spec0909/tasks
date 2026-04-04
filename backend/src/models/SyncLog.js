/**
 * SyncLog model
 * Tracks synchronization events and ProjectFlow sync state
 */

import { query } from '../config/database.js';

/**
 * Create sync log entry
 * @param {Object} logEntry - Log entry data
 * @returns {Promise<Object>}
 */
export async function create(logEntry) {
  const {
    user_id,
    source,
    direction,
    status,
    items_processed,
    items_failed,
    items_skipped,
    error_message,
    sync_timestamp,
  } = logEntry;

  const result = await query(
    `INSERT INTO sync_logs 
     (user_id, source, direction, status, items_processed, items_failed, items_skipped, 
      error_message, sync_timestamp, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
     RETURNING *`,
    [
      user_id,
      source,
      direction,
      status,
      items_processed || 0,
      items_failed || 0,
      items_skipped || 0,
      error_message,
      sync_timestamp || new Date(),
    ]
  );

  return result.rows[0];
}

/**
 * Find sync logs by user
 * @param {string} userId - User ID
 * @param {number} limit - Limit results
 * @returns {Promise<Object[]>}
 */
export async function findByUserId(userId, limit = 50) {
  const result = await query(
    `SELECT * FROM sync_logs
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return result.rows;
}

/**
 * Get recent errors for user
 * @param {string} userId - User ID
 * @returns {Promise<Object[]>}
 */
export async function getRecentErrors(userId) {
  const result = await query(
    `SELECT * FROM sync_logs
     WHERE user_id = $1 AND status = 'error'
     ORDER BY created_at DESC
     LIMIT 10`,
    [userId]
  );

  return result.rows;
}

/**
 * Get ProjectFlow sync state
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>}
 */
export async function getPfSyncState(userId) {
  const result = await query(
    `SELECT * FROM pf_sync_state WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0] || null;
}

/**
 * Update ProjectFlow sync state
 * @param {string} userId - User ID
 * @param {Object} stateData - State data
 * @returns {Promise<Object>}
 */
export async function updatePfSyncState(userId, stateData) {
  const {
    last_inbound_sync,
    last_outbound_sync,
    last_sync_error,
    sync_enabled,
    connection_status,
    next_sync_at,
  } = stateData;

  const result = await query(
    `INSERT INTO pf_sync_state 
     (user_id, last_inbound_sync, last_outbound_sync, last_sync_error, 
      sync_enabled, connection_status, next_sync_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       last_inbound_sync = COALESCE($2, pf_sync_state.last_inbound_sync),
       last_outbound_sync = COALESCE($3, pf_sync_state.last_outbound_sync),
       last_sync_error = COALESCE($4, pf_sync_state.last_sync_error),
       sync_enabled = COALESCE($5, pf_sync_state.sync_enabled),
       connection_status = COALESCE($6, pf_sync_state.connection_status),
       next_sync_at = COALESCE($7, pf_sync_state.next_sync_at),
       updated_at = NOW()
     RETURNING *`,
    [
      userId,
      last_inbound_sync,
      last_outbound_sync,
      last_sync_error,
      sync_enabled,
      connection_status,
      next_sync_at,
    ]
  );

  return result.rows[0];
}

/**
 * Get sync summary for user
 * @param {string} userId - User ID
 * @param {number} days - Look back days
 * @returns {Promise<Object>}
 */
export async function getSyncSummary(userId, days = 7) {
  const result = await query(
    `SELECT 
       COUNT(*) as total_syncs,
       SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_syncs,
       SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed_syncs,
       SUM(items_processed) as total_items_processed,
       SUM(items_failed) as total_items_failed,
       MAX(created_at) as last_sync_time,
       MIN(CASE WHEN status = 'error' THEN created_at END) as last_error_time
     FROM sync_logs
     WHERE user_id = $1
       AND created_at >= NOW() - INTERVAL '${days} days'`,
    [userId]
  );

  return result.rows[0] || {
    total_syncs: 0,
    successful_syncs: 0,
    failed_syncs: 0,
    total_items_processed: 0,
    total_items_failed: 0,
  };
}

export default {
  create,
  findByUserId,
  getRecentErrors,
  getPfSyncState,
  updatePfSyncState,
  getSyncSummary,
};
