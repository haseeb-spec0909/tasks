/**
 * User model
 * Handles user data access and persistence
 */

import { query } from '../config/database.js';
import { invalidatePattern } from '../config/redis.js';

/**
 * Find user by Google ID
 * @param {string} googleId - Google user ID
 * @returns {Promise<Object|null>}
 */
export async function findByGoogleId(googleId) {
  const result = await query(
    'SELECT * FROM users WHERE google_id = $1',
    [googleId]
  );
  return result.rows[0] || null;
}

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>}
 */
export async function findByEmail(email) {
  const result = await query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  return result.rows[0] || null;
}

/**
 * Find user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>}
 */
export async function findById(userId) {
  const result = await query(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Find user by ProjectFlow user ID
 * @param {string} pfUserId - ProjectFlow user ID
 * @returns {Promise<Object|null>}
 */
export async function findByPfUserId(pfUserId) {
  const result = await query(
    'SELECT * FROM users WHERE pf_user_id = $1',
    [pfUserId]
  );
  return result.rows[0] || null;
}

/**
 * Create new user
 * @param {Object} userData - User data
 * @param {string} userData.google_id - Google ID
 * @param {string} userData.email - Email
 * @param {string} userData.name - Full name
 * @param {string} userData.picture - Profile picture URL
 * @param {string} userData.pf_user_id - ProjectFlow user ID (optional)
 * @returns {Promise<Object>} Created user
 */
export async function create(userData) {
  const { google_id, email, name, picture, pf_user_id } = userData;

  const result = await query(
    `INSERT INTO users (google_id, email, name, picture, pf_user_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING *`,
    [google_id, email.toLowerCase(), name, picture, pf_user_id || null]
  );

  return result.rows[0];
}

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} data - Data to update
 * @returns {Promise<Object>} Updated user
 */
export async function update(userId, data) {
  const fields = [];
  const values = [userId];
  let paramCount = 2;

  const allowedFields = ['name', 'picture', 'pf_user_id', 'role', 'is_active'];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount += 1;
    }
  }

  if (fields.length === 0) {
    return findById(userId);
  }

  fields.push(`updated_at = NOW()`);

  const result = await query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );

  // Invalidate cache
  await invalidatePattern(`user:${userId}:*`);

  return result.rows[0];
}

/**
 * Get user settings
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export async function getSettings(userId) {
  const result = await query(
    `SELECT id, user_id, timezone, notification_preferences, 
            scheduling_preferences, work_hours, created_at, updated_at
     FROM user_settings WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    // Return default settings if not found
    return {
      timezone: 'America/New_York',
      notification_preferences: {
        enabled: true,
        quiet_hours: { start: 18, end: 9 },
        channels: ['google_chat'],
      },
      scheduling_preferences: {
        min_block_duration: 30,
        allow_back_to_back: false,
        prefer_morning: true,
      },
      work_hours: {
        start: 9,
        end: 17,
        days: [1, 2, 3, 4, 5],
      },
    };
  }

  return result.rows[0];
}

/**
 * Update user settings
 * @param {string} userId - User ID
 * @param {Object} settingsData - Settings data
 * @returns {Promise<Object>}
 */
export async function updateSettings(userId, settingsData) {
  const result = await query(
    `INSERT INTO user_settings (user_id, timezone, notification_preferences, 
                               scheduling_preferences, work_hours, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       timezone = COALESCE($2, user_settings.timezone),
       notification_preferences = COALESCE($3, user_settings.notification_preferences),
       scheduling_preferences = COALESCE($4, user_settings.scheduling_preferences),
       work_hours = COALESCE($5, user_settings.work_hours),
       updated_at = NOW()
     RETURNING *`,
    [
      userId,
      settingsData.timezone || null,
      settingsData.notification_preferences ? JSON.stringify(settingsData.notification_preferences) : null,
      settingsData.scheduling_preferences ? JSON.stringify(settingsData.scheduling_preferences) : null,
      settingsData.work_hours ? JSON.stringify(settingsData.work_hours) : null,
    ]
  );

  // Invalidate cache
  await invalidatePattern(`user:${userId}:settings`);

  return result.rows[0];
}

/**
 * Get team members for a manager
 * @param {string} managerUserId - Manager user ID
 * @returns {Promise<Object[]>}
 */
export async function getTeamMembers(managerUserId) {
  const result = await query(
    `SELECT u.id, u.email, u.name, u.picture, u.pf_user_id, u.role
     FROM users u
     INNER JOIN team_members tm ON u.id = tm.user_id
     WHERE tm.manager_id = $1 AND u.is_active = true
     ORDER BY u.name ASC`,
    [managerUserId]
  );

  return result.rows;
}

export default {
  findByGoogleId,
  findByEmail,
  findById,
  findByPfUserId,
  create,
  update,
  getSettings,
  updateSettings,
  getTeamMembers,
};
