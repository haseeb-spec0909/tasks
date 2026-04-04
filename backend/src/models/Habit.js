/**
 * Habit model
 * Handles habit tracking and management
 */

import { query } from '../config/database.js';
import { invalidatePattern } from '../config/redis.js';

/**
 * Find habits by user
 * @param {string} userId - User ID
 * @returns {Promise<Object[]>}
 */
export async function findByUserId(userId) {
  const result = await query(
    `SELECT * FROM habits 
     WHERE user_id = $1 AND is_active = true
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
}

/**
 * Find habit templates
 * @returns {Promise<Object[]>}
 */
export async function findTemplates() {
  const result = await query(
    `SELECT * FROM habit_templates 
     WHERE is_active = true
     ORDER BY category ASC, name ASC`
  );

  return result.rows;
}

/**
 * Create habit
 * @param {Object} habitData - Habit data
 * @returns {Promise<Object>}
 */
export async function create(habitData) {
  const {
    user_id,
    name,
    description,
    category,
    frequency,
    target_count,
    target_unit,
    start_date,
    end_date,
  } = habitData;

  const result = await query(
    `INSERT INTO habits (user_id, name, description, category, frequency, 
                         target_count, target_unit, start_date, end_date, 
                         is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
     RETURNING *`,
    [user_id, name, description, category, frequency, target_count, target_unit, start_date, end_date]
  );

  await invalidatePattern(`user:${user_id}:habits:*`);
  return result.rows[0];
}

/**
 * Update habit
 * @param {string} habitId - Habit ID
 * @param {Object} data - Data to update
 * @returns {Promise<Object>}
 */
export async function update(habitId, data) {
  const fields = [];
  const values = [habitId];
  let paramCount = 2;

  const allowedFields = ['name', 'description', 'frequency', 'target_count', 'target_unit', 'end_date'];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount += 1;
    }
  }

  if (fields.length === 0) {
    // Get updated habit to return
    const result = await query('SELECT * FROM habits WHERE id = $1', [habitId]);
    return result.rows[0];
  }

  fields.push(`updated_at = NOW()`);

  const result = await query(
    `UPDATE habits SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );

  return result.rows[0];
}

/**
 * Deactivate habit
 * @param {string} habitId - Habit ID
 * @returns {Promise<Object>}
 */
export async function deactivate(habitId) {
  const result = await query(
    `UPDATE habits SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [habitId]
  );

  return result.rows[0];
}

/**
 * Clone template for user
 * @param {string} templateId - Template ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export async function cloneTemplateForUser(templateId, userId) {
  // Get template
  const templateResult = await query(
    `SELECT * FROM habit_templates WHERE id = $1`,
    [templateId]
  );

  if (templateResult.rows.length === 0) {
    throw new Error('Template not found');
  }

  const template = templateResult.rows[0];

  // Create habit from template
  const result = await query(
    `INSERT INTO habits (user_id, name, description, category, frequency, 
                         target_count, target_unit, start_date, end_date, 
                         is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NULL, true, NOW(), NOW())
     RETURNING *`,
    [
      userId,
      template.name,
      template.description,
      template.category,
      template.frequency,
      template.target_count,
      template.target_unit,
    ]
  );

  await invalidatePattern(`user:${userId}:habits:*`);
  return result.rows[0];
}

/**
 * Record habit completion
 * @param {string} habitId - Habit ID
 * @param {number} count - Count completed
 * @returns {Promise<Object>}
 */
export async function recordCompletion(habitId, count = 1) {
  const result = await query(
    `INSERT INTO habit_logs (habit_id, count, logged_at, created_at)
     VALUES ($1, $2, NOW(), NOW())
     RETURNING *`,
    [habitId, count]
  );

  return result.rows[0];
}

/**
 * Get habit statistics
 * @param {string} habitId - Habit ID
 * @param {number} days - Number of days to look back
 * @returns {Promise<Object>}
 */
export async function getStats(habitId, days = 30) {
  const result = await query(
    `SELECT 
       COUNT(*) as total_completions,
       SUM(count) as total_count,
       MAX(logged_at) as last_completion
     FROM habit_logs 
     WHERE habit_id = $1 
       AND logged_at >= NOW() - INTERVAL '${days} days'`,
    [habitId]
  );

  return result.rows[0] || {
    total_completions: 0,
    total_count: 0,
    last_completion: null,
  };
}

export default {
  findByUserId,
  findTemplates,
  create,
  update,
  deactivate,
  cloneTemplateForUser,
  recordCompletion,
  getStats,
};
