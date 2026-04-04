/**
 * Notifications service
 * Handles notification dispatch and reminder scheduling
 */

import dayjs from 'dayjs';
import { query } from '../config/database.js';
import * as ChatBot from './chatBot.js';
import * as TaskModel from '../models/Task.js';
import * as UserModel from '../models/User.js';
import config from '../config/index.js';

/**
 * Send notification to user
 * @param {string} userId - User ID
 * @param {string} type - Notification type
 * @param {Object} data - Notification data
 * @returns {Promise<boolean>}
 */
export async function sendNotification(userId, type, data) {
  try {
    // Check if user wants this type of notification
    if (!await shouldSendNotification(userId, type)) {
      return false;
    }

    // Send based on user's notification preferences
    const user = await UserModel.findById(userId);
    const settings = await UserModel.getSettings(userId);

    // Default: send via Google Chat
    if (settings.notification_preferences.channels.includes('google_chat')) {
      switch (type) {
        case 'task_assigned':
          await ChatBot.sendTaskNotification(userId, data.task, 'new');
          break;

        case 'deadline_approaching':
          await ChatBot.sendTaskNotification(userId, data.task, 'deadline');
          break;

        case 'task_overdue':
          await ChatBot.sendTaskNotification(userId, data.task, 'overdue');
          break;

        case 'focus_block_start':
          await ChatBot.sendProactiveMessage(userId, {
            text: `Focus time starting: ${data.title}`,
          });
          break;

        default:
          console.warn('Unknown notification type:', type);
          return false;
      }
    }

    // Log notification
    await query(
      `INSERT INTO notification_logs (user_id, type, data, sent_at, created_at)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [userId, type, JSON.stringify(data)]
    );

    return true;
  } catch (err) {
    console.error('Error sending notification:', err.message);
    return false;
  }
}

/**
 * Check if notification should be sent based on user preferences
 * and recent notification log (avoid duplicates)
 * @param {string} userId - User ID
 * @param {string} type - Notification type
 * @returns {Promise<boolean>}
 */
export async function shouldSendNotification(userId, type) {
  try {
    const user = await UserModel.findById(userId);
    if (!user) return false;

    const settings = await UserModel.getSettings(userId);

    // Check if notifications enabled
    if (!settings.notification_preferences.enabled) {
      return false;
    }

    // Check quiet hours
    const now = dayjs();
    const hour = now.hour();
    const quietStart = settings.notification_preferences.quiet_hours.start;
    const quietEnd = settings.notification_preferences.quiet_hours.end;

    if (quietStart < quietEnd) {
      // Normal case: 18:00 - 09:00 next day
      if (hour >= quietStart || hour < quietEnd) {
        return false;
      }
    } else {
      // Wrapping case
      if (hour >= quietStart || hour < quietEnd) {
        return false;
      }
    }

    // Check if same notification sent recently
    const result = await query(
      `SELECT COUNT(*) as count FROM notification_logs
       WHERE user_id = $1 AND type = $2
       AND sent_at > NOW() - INTERVAL '1 hour'`,
      [userId, type]
    );

    // Limit to max per day
    const dailyCount = await query(
      `SELECT COUNT(*) as count FROM notification_logs
       WHERE user_id = $1
       AND sent_at > NOW() - INTERVAL '1 day'`,
      [userId]
    );

    if (parseInt(dailyCount.rows[0].count, 10) >= config.NOTIFICATION_SETTINGS.max_per_day) {
      return false;
    }

    return parseInt(result.rows[0].count, 10) === 0;
  } catch (err) {
    console.error('Error checking notification preference:', err.message);
    return true; // Default: send if we can't check
  }
}

/**
 * Check for tasks due within 24 hours
 * @returns {Promise<void>}
 */
export async function checkDeadlines() {
  try {
    const result = await query(
      `SELECT t.*, u.id as user_id FROM tasks t
       INNER JOIN users u ON t.user_id = u.id
       WHERE t.due_date BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
       AND t.status NOT IN ('completed', 'archived')
       AND t.id NOT IN (
         SELECT task_id FROM notification_logs
         WHERE type = 'deadline_approaching'
         AND sent_at > NOW() - INTERVAL '1 hour'
       )`
    );

    for (const task of result.rows) {
      await sendNotification(task.user_id, 'deadline_approaching', { task });
    }
  } catch (err) {
    console.error('Error checking deadlines:', err.message);
  }
}

/**
 * Check for overdue tasks
 * @returns {Promise<void>}
 */
export async function checkOverdue() {
  try {
    const result = await query(
      `SELECT t.*, u.id as user_id FROM tasks t
       INNER JOIN users u ON t.user_id = u.id
       WHERE t.due_date < NOW()
       AND t.status NOT IN ('completed', 'archived')
       AND t.id NOT IN (
         SELECT task_id FROM notification_logs
         WHERE type = 'task_overdue'
         AND sent_at > NOW() - INTERVAL '4 hours'
       )`
    );

    for (const task of result.rows) {
      await sendNotification(task.user_id, 'task_overdue', { task });
    }
  } catch (err) {
    console.error('Error checking overdue tasks:', err.message);
  }
}

/**
 * Send meeting reminder
 * @param {string} userId - User ID
 * @param {Object} meetingData - Meeting data
 * @returns {Promise<void>}
 */
export async function sendMeetingReminder(userId, meetingData) {
  try {
    await sendNotification(userId, 'meeting_reminder', {
      title: meetingData.summary,
      time: meetingData.startTime,
      attendees: meetingData.attendees,
    });
  } catch (err) {
    console.error('Error sending meeting reminder:', err.message);
  }
}

/**
 * Send focus block start notification
 * @param {string} userId - User ID
 * @param {Object} focusData - Focus block data
 * @returns {Promise<void>}
 */
export async function sendFocusBlockStart(userId, focusData) {
  try {
    await sendNotification(userId, 'focus_block_start', {
      title: focusData.task_title,
      duration: focusData.duration_minutes,
      startTime: focusData.start_time,
    });
  } catch (err) {
    console.error('Error sending focus block start:', err.message);
  }
}

/**
 * Send ProjectFlow status change notification
 * @param {string} userId - User ID
 * @param {Object} task - Task data
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 * @returns {Promise<void>}
 */
export async function sendPfStatusChange(userId, task, oldStatus, newStatus) {
  try {
    await sendNotification(userId, 'pf_status_changed', {
      task,
      oldStatus,
      newStatus,
    });
  } catch (err) {
    console.error('Error sending ProjectFlow status change:', err.message);
  }
}

/**
 * Get notification history
 * @param {string} userId - User ID
 * @param {number} limit - Limit results
 * @returns {Promise<Object[]>}
 */
export async function getNotificationHistory(userId, limit = 50) {
  try {
    const result = await query(
      `SELECT id, type, data, sent_at, created_at FROM notification_logs
       WHERE user_id = $1
       ORDER BY sent_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  } catch (err) {
    console.error('Error fetching notification history:', err.message);
    return [];
  }
}

/**
 * Clear old notification logs
 * @param {number} daysOld - Clear logs older than this many days
 * @returns {Promise<number>} Number of deleted logs
 */
export async function clearOldLogs(daysOld = 30) {
  try {
    const result = await query(
      `DELETE FROM notification_logs
       WHERE created_at < NOW() - INTERVAL '${daysOld} days'`
    );

    return result.rowCount;
  } catch (err) {
    console.error('Error clearing old logs:', err.message);
    return 0;
  }
}

export default {
  sendNotification,
  shouldSendNotification,
  checkDeadlines,
  checkOverdue,
  sendMeetingReminder,
  sendFocusBlockStart,
  sendPfStatusChange,
  getNotificationHistory,
  clearOldLogs,
};
