/**
 * Task model
 * Handles task data access for both Google Tasks and ProjectFlow
 */

import { query } from '../config/database.js';
import { invalidatePattern } from '../config/redis.js';

/**
 * Find task by ID
 * @param {string} taskId - Task ID
 * @returns {Promise<Object|null>}
 */
export async function findById(taskId) {
  const result = await query(
    `SELECT t.*, tm.pf_task_id, tm.pf_status_id, tm.wp_code, tm.wbs_path, tm.estimated_effort
     FROM tasks t
     LEFT JOIN pf_task_meta tm ON t.id = tm.task_id
     WHERE t.id = $1`,
    [taskId]
  );
  return result.rows[0] || null;
}

/**
 * Find task by external ID
 * @param {string} source - Task source (google_tasks, projectflow)
 * @param {string} externalId - External task ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>}
 */
export async function findByExternalId(source, externalId, userId) {
  const result = await query(
    `SELECT t.*, tm.pf_task_id, tm.pf_status_id, tm.wp_code, tm.wbs_path, tm.estimated_effort
     FROM tasks t
     LEFT JOIN pf_task_meta tm ON t.id = tm.task_id
     WHERE t.source = $1 AND t.external_id = $2 AND t.user_id = $3`,
    [source, externalId, userId]
  );
  return result.rows[0] || null;
}

/**
 * Find tasks by user with filters
 * @param {string} userId - User ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object[]>}
 */
export async function findByUserId(userId, filters = {}) {
  const {
    source,
    status,
    priority,
    dueWithinDays,
    search,
    limit = 50,
    offset = 0,
  } = filters;

  let sql = `SELECT t.*, tm.pf_task_id, tm.pf_status_id, tm.wp_code, tm.wbs_path
             FROM tasks t
             LEFT JOIN pf_task_meta tm ON t.id = tm.task_id
             WHERE t.user_id = $1`;

  const params = [userId];
  let paramCount = 2;

  if (source) {
    sql += ` AND t.source = $${paramCount}`;
    params.push(source);
    paramCount += 1;
  }

  if (status) {
    sql += ` AND t.status = $${paramCount}`;
    params.push(status);
    paramCount += 1;
  }

  if (priority) {
    sql += ` AND t.priority = $${paramCount}`;
    params.push(priority);
    paramCount += 1;
  }

  if (dueWithinDays) {
    sql += ` AND t.due_date <= NOW() + INTERVAL '1 day' * $${paramCount}`;
    params.push(dueWithinDays);
    paramCount += 1;
  }

  if (search) {
    sql += ` AND (t.title ILIKE $${paramCount} OR t.notes ILIKE $${paramCount})`;
    params.push(`%${search}%`);
    paramCount += 1;
  }

  sql += ` ORDER BY t.due_date ASC, t.priority DESC
           LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Create task
 * @param {Object} taskData - Task data
 * @returns {Promise<Object>}
 */
export async function create(taskData) {
  const {
    user_id,
    source,
    external_id,
    title,
    description,
    due_date,
    status,
    priority,
    notes,
    estimated_effort,
  } = taskData;

  const result = await query(
    `INSERT INTO tasks (user_id, source, external_id, title, description, due_date, 
                        status, priority, notes, estimated_effort, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
     RETURNING *`,
    [user_id, source, external_id, title, description, due_date, status, priority, notes, estimated_effort]
  );

  // Invalidate user tasks cache
  await invalidatePattern(`user:${user_id}:tasks:*`);

  return result.rows[0];
}

/**
 * Update task
 * @param {string} taskId - Task ID
 * @param {Object} data - Data to update
 * @returns {Promise<Object>}
 */
export async function update(taskId, data) {
  const fields = [];
  const values = [taskId];
  let paramCount = 2;

  const allowedFields = ['title', 'description', 'due_date', 'status', 'priority', 'notes', 'progress_pct', 'estimated_effort'];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount += 1;
    }
  }

  if (fields.length === 0) {
    return findById(taskId);
  }

  fields.push(`updated_at = NOW()`);

  const result = await query(
    `UPDATE tasks SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );

  const task = result.rows[0];
  if (task) {
    await invalidatePattern(`user:${task.user_id}:tasks:*`);
  }

  return task;
}

/**
 * Mark task as complete
 * @param {string} taskId - Task ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export async function markComplete(taskId, userId) {
  const result = await query(
    `UPDATE tasks SET status = 'completed', progress_pct = 100, completed_at = NOW(), updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [taskId]
  );

  await invalidatePattern(`user:${userId}:tasks:*`);
  return result.rows[0];
}

/**
 * Update task progress percentage
 * @param {string} taskId - Task ID
 * @param {number} progressPct - Progress percentage (0-100)
 * @returns {Promise<Object>}
 */
export async function updateProgress(taskId, progressPct) {
  const result = await query(
    `UPDATE tasks SET progress_pct = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [Math.min(100, Math.max(0, progressPct)), taskId]
  );

  const task = result.rows[0];
  if (task) {
    await invalidatePattern(`user:${task.user_id}:tasks:*`);
  }

  return task;
}

/**
 * Archive task
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>}
 */
export async function archive(taskId) {
  const result = await query(
    `UPDATE tasks SET status = 'archived', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [taskId]
  );

  const task = result.rows[0];
  if (task) {
    await invalidatePattern(`user:${task.user_id}:tasks:*`);
  }

  return task;
}

/**
 * Get up-next tasks (highest priority, due soonest)
 * @param {string} userId - User ID
 * @param {number} limit - Limit results
 * @returns {Promise<Object[]>}
 */
export async function getUpNext(userId, limit = 5) {
  const result = await query(
    `SELECT t.*, tm.pf_task_id, tm.pf_status_id, tm.wp_code, tm.wbs_path
     FROM tasks t
     LEFT JOIN pf_task_meta tm ON t.id = tm.task_id
     WHERE t.user_id = $1 AND t.status NOT IN ('completed', 'archived')
     ORDER BY t.due_date ASC, t.priority DESC
     LIMIT $2`,
    [userId, limit]
  );

  return result.rows;
}

/**
 * Get overdue tasks
 * @param {string} userId - User ID
 * @returns {Promise<Object[]>}
 */
export async function getOverdue(userId) {
  const result = await query(
    `SELECT t.*, tm.pf_task_id, tm.pf_status_id, tm.wp_code, tm.wbs_path
     FROM tasks t
     LEFT JOIN pf_task_meta tm ON t.id = tm.task_id
     WHERE t.user_id = $1 AND t.due_date < NOW() AND t.status != 'completed'
     ORDER BY t.due_date ASC`,
    [userId]
  );

  return result.rows;
}

/**
 * Get at-risk tasks (due within threshold days)
 * @param {string} userId - User ID
 * @param {number} daysThreshold - Days threshold
 * @returns {Promise<Object[]>}
 */
export async function getAtRisk(userId, daysThreshold = 3) {
  const result = await query(
    `SELECT t.*, tm.pf_task_id, tm.pf_status_id, tm.wp_code, tm.wbs_path
     FROM tasks t
     LEFT JOIN pf_task_meta tm ON t.id = tm.task_id
     WHERE t.user_id = $1
       AND t.status NOT IN ('completed', 'archived')
       AND t.due_date <= NOW() + INTERVAL '1 day' * $2
       AND t.due_date > NOW()
     ORDER BY t.due_date ASC`,
    [userId, daysThreshold]
  );

  return result.rows;
}

/**
 * Get ProjectFlow task metadata
 * @param {string} taskId - Task ID
 * @returns {Promise<Object|null>}
 */
export async function getPfTaskMeta(taskId) {
  const result = await query(
    `SELECT * FROM pf_task_meta WHERE task_id = $1`,
    [taskId]
  );

  return result.rows[0] || null;
}

/**
 * Upsert ProjectFlow task metadata
 * @param {string} taskId - Task ID
 * @param {Object} metaData - Metadata
 * @returns {Promise<Object>}
 */
export async function upsertPfTaskMeta(taskId, metaData) {
  const {
    pf_task_id,
    pf_status_id,
    wp_code,
    wbs_path,
    estimated_effort,
    last_synced_at,
  } = metaData;

  const result = await query(
    `INSERT INTO pf_task_meta (task_id, pf_task_id, pf_status_id, wp_code, wbs_path, estimated_effort, last_synced_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     ON CONFLICT (task_id) DO UPDATE SET
       pf_task_id = COALESCE($2, pf_task_meta.pf_task_id),
       pf_status_id = COALESCE($3, pf_task_meta.pf_status_id),
       wp_code = COALESCE($4, pf_task_meta.wp_code),
       wbs_path = COALESCE($5, pf_task_meta.wbs_path),
       estimated_effort = COALESCE($6, pf_task_meta.estimated_effort),
       last_synced_at = NOW(),
       updated_at = NOW()
     RETURNING *`,
    [taskId, pf_task_id, pf_status_id, wp_code, wbs_path, estimated_effort, last_synced_at || new Date()]
  );

  return result.rows[0];
}

/**
 * Get tasks by ProjectFlow project
 * @param {string} projectId - ProjectFlow project ID
 * @returns {Promise<Object[]>}
 */
export async function getTasksByPfProject(projectId) {
  const result = await query(
    `SELECT t.*, tm.pf_task_id, tm.pf_status_id, tm.wp_code, tm.wbs_path
     FROM tasks t
     INNER JOIN pf_task_meta tm ON t.id = tm.task_id
     WHERE tm.wbs_path LIKE $1
     ORDER BY tm.wbs_path ASC`,
    [`${projectId}%`]
  );

  return result.rows;
}

/**
 * Get team tasks (for managers)
 * @param {string} managerUserId - Manager user ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object[]>}
 */
export async function getTeamTasks(managerUserId, filters = {}) {
  const { status, priority, overdue_only } = filters;

  let sql = `SELECT t.*, tm.pf_task_id, tm.pf_status_id, tm.wp_code, tm.wbs_path, u.email, u.name
             FROM tasks t
             INNER JOIN users u ON t.user_id = u.id
             LEFT JOIN pf_task_meta tm ON t.id = tm.task_id
             INNER JOIN team_members tm2 ON u.id = tm2.user_id
             WHERE tm2.manager_id = $1`;

  const params = [managerUserId];
  let paramCount = 2;

  if (status) {
    sql += ` AND t.status = $${paramCount}`;
    params.push(status);
    paramCount += 1;
  }

  if (priority) {
    sql += ` AND t.priority >= $${paramCount}`;
    params.push(priority);
    paramCount += 1;
  }

  if (overdue_only) {
    sql += ` AND t.due_date < NOW() AND t.status != 'completed'`;
  }

  sql += ` ORDER BY t.due_date ASC, t.priority DESC`;

  const result = await query(sql, params);
  return result.rows;
}

export default {
  findById,
  findByExternalId,
  findByUserId,
  create,
  update,
  markComplete,
  updateProgress,
  archive,
  getUpNext,
  getOverdue,
  getAtRisk,
  getPfTaskMeta,
  upsertPfTaskMeta,
  getTasksByPfProject,
  getTeamTasks,
};
