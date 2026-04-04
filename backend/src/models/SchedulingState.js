/**
 * SchedulingState model
 * Manages AI scheduling states and task-to-calendar block mappings
 */

import { query } from '../config/database.js';
import { invalidatePattern } from '../config/redis.js';

/**
 * Find scheduling state by user and date range
 * @param {string} userId - User ID
 * @param {Object} dateRange - Date range {startDate, endDate}
 * @returns {Promise<Object[]>}
 */
export async function findByUserId(userId, dateRange = {}) {
  const { startDate, endDate } = dateRange;

  let sql = `SELECT * FROM scheduling_states WHERE user_id = $1`;
  const params = [userId];
  let paramCount = 2;

  if (startDate) {
    sql += ` AND scheduled_date >= $${paramCount}`;
    params.push(startDate);
    paramCount += 1;
  }

  if (endDate) {
    sql += ` AND scheduled_date <= $${paramCount}`;
    params.push(endDate);
    paramCount += 1;
  }

  sql += ` ORDER BY scheduled_date ASC`;

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Find scheduling state by task
 * @param {string} taskId - Task ID
 * @returns {Promise<Object|null>}
 */
export async function findByTaskId(taskId) {
  const result = await query(
    `SELECT * FROM scheduling_states WHERE task_id = $1`,
    [taskId]
  );

  return result.rows[0] || null;
}

/**
 * Create scheduling state
 * @param {Object} stateData - State data
 * @returns {Promise<Object>}
 */
export async function create(stateData) {
  const {
    user_id,
    task_id,
    scheduled_date,
    scheduled_start_time,
    scheduled_end_time,
    duration_minutes,
    calendar_event_id,
    confidence_score,
    conflict_flags,
    scheduling_reason,
  } = stateData;

  const result = await query(
    `INSERT INTO scheduling_states 
     (user_id, task_id, scheduled_date, scheduled_start_time, scheduled_end_time, 
      duration_minutes, calendar_event_id, confidence_score, conflict_flags, 
      scheduling_reason, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
     RETURNING *`,
    [
      user_id,
      task_id,
      scheduled_date,
      scheduled_start_time,
      scheduled_end_time,
      duration_minutes,
      calendar_event_id,
      confidence_score,
      conflict_flags ? JSON.stringify(conflict_flags) : null,
      scheduling_reason,
    ]
  );

  await invalidatePattern(`user:${user_id}:schedule:*`);
  return result.rows[0];
}

/**
 * Bulk create scheduling states
 * @param {Object[]} states - Array of state objects
 * @returns {Promise<Object[]>}
 */
export async function bulkCreate(states) {
  if (!states || states.length === 0) {
    return [];
  }

  const placeholders = [];
  const values = [];
  let paramCount = 1;

  for (const state of states) {
    placeholders.push(
      `($${paramCount}, $${paramCount + 1}, $${paramCount + 2}, $${paramCount + 3}, $${paramCount + 4}, ` +
      `$${paramCount + 5}, $${paramCount + 6}, $${paramCount + 7}, $${paramCount + 8}, $${paramCount + 9}, NOW(), NOW())`
    );

    values.push(
      state.user_id,
      state.task_id,
      state.scheduled_date,
      state.scheduled_start_time,
      state.scheduled_end_time,
      state.duration_minutes,
      state.calendar_event_id || null,
      state.confidence_score || null,
      state.conflict_flags ? JSON.stringify(state.conflict_flags) : null,
      state.scheduling_reason || null
    );

    paramCount += 10;
  }

  const sql = `INSERT INTO scheduling_states 
               (user_id, task_id, scheduled_date, scheduled_start_time, scheduled_end_time, 
                duration_minutes, calendar_event_id, confidence_score, conflict_flags, 
                scheduling_reason, created_at, updated_at)
               VALUES ${placeholders.join(', ')}
               RETURNING *`;

  const result = await query(sql, values);
  
  // Invalidate cache for all users
  const userIds = new Set(states.map(s => s.user_id));
  for (const userId of userIds) {
    await invalidatePattern(`user:${userId}:schedule:*`);
  }

  return result.rows;
}

/**
 * Delete scheduling states by task
 * @param {string} taskId - Task ID
 * @returns {Promise<number>}
 */
export async function deleteByTaskId(taskId) {
  const result = await query(
    `DELETE FROM scheduling_states WHERE task_id = $1 RETURNING user_id`,
    [taskId]
  );

  // Invalidate cache for user
  if (result.rows.length > 0) {
    const userId = result.rows[0].user_id;
    await invalidatePattern(`user:${userId}:schedule:*`);
  }

  return result.rowCount;
}

/**
 * Delete scheduling states by user and date range
 * @param {string} userId - User ID
 * @param {Object} dateRange - Date range {startDate, endDate}
 * @returns {Promise<number>}
 */
export async function deleteByUserId(userId, dateRange = {}) {
  const { startDate, endDate } = dateRange;

  let sql = `DELETE FROM scheduling_states WHERE user_id = $1`;
  const params = [userId];
  let paramCount = 2;

  if (startDate) {
    sql += ` AND scheduled_date >= $${paramCount}`;
    params.push(startDate);
    paramCount += 1;
  }

  if (endDate) {
    sql += ` AND scheduled_date <= $${paramCount}`;
    params.push(endDate);
    paramCount += 1;
  }

  const result = await query(sql, params);
  
  await invalidatePattern(`user:${userId}:schedule:*`);
  return result.rowCount;
}

/**
 * Get scheduled blocks for date range
 * @param {string} userId - User ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object[]>}
 */
export async function getScheduledBlocks(userId, startDate, endDate) {
  const result = await query(
    `SELECT ss.*, t.title as task_title, t.priority
     FROM scheduling_states ss
     INNER JOIN tasks t ON ss.task_id = t.id
     WHERE ss.user_id = $1
       AND ss.scheduled_date >= $2
       AND ss.scheduled_date <= $3
     ORDER BY ss.scheduled_date ASC, ss.scheduled_start_time ASC`,
    [userId, startDate, endDate]
  );

  return result.rows;
}

/**
 * Get scheduling state version (for conflict detection)
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export async function getVersion(userId) {
  const result = await query(
    `SELECT MAX(updated_at) as last_updated, COUNT(*) as total_states
     FROM scheduling_states
     WHERE user_id = $1`,
    [userId]
  );

  return {
    lastUpdated: result.rows[0]?.last_updated,
    totalStates: parseInt(result.rows[0]?.total_states || 0, 10),
  };
}

/**
 * Update scheduling state
 * @param {string} stateId - State ID
 * @param {Object} data - Data to update
 * @returns {Promise<Object>}
 */
export async function update(stateId, data) {
  const fields = [];
  const values = [stateId];
  let paramCount = 2;

  const allowedFields = [
    'scheduled_date',
    'scheduled_start_time',
    'scheduled_end_time',
    'duration_minutes',
    'calendar_event_id',
    'confidence_score',
    'conflict_flags',
    'scheduling_reason',
  ];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = $${paramCount}`);
      values.push(key === 'conflict_flags' ? JSON.stringify(value) : value);
      paramCount += 1;
    }
  }

  if (fields.length === 0) {
    return findByTaskId(data.task_id);
  }

  fields.push(`updated_at = NOW()`);

  const result = await query(
    `UPDATE scheduling_states SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );

  return result.rows[0];
}

export default {
  findByUserId,
  findByTaskId,
  create,
  bulkCreate,
  deleteByTaskId,
  deleteByUserId,
  getScheduledBlocks,
  getVersion,
  update,
};
