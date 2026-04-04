/**
 * ProjectFlow synchronization service
 * Handles bi-directional sync with ProjectFlow API
 */

import axios from 'axios';
import config from '../config/index.js';
import * as TaskModel from '../models/Task.js';
import * as SyncLogModel from '../models/SyncLog.js';

/**
 * Status ID mappings from ProjectFlow
 */
const PF_STATUS_MAP = {
  17: 'not_started',
  19: 'in_progress',
  20: 'under_review',
  21: 'completed',
  22: 'on_hold',
  23: 'completed',
  11: 'completed',
};

const STATUS_TO_PF = {
  not_started: 17,
  in_progress: 19,
  under_review: 20,
  completed: 21,
  on_hold: 22,
};

/**
 * Initialize ProjectFlow API client
 * @returns {Object} Axios instance
 */
function getClient() {
  return axios.create({
    baseURL: config.PROJECTFLOW_API_URL,
    headers: {
      Authorization: `Bearer ${config.PROJECTFLOW_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: config.TIMEOUTS.projectflow_api,
  });
}

/**
 * Health check ProjectFlow API
 * @returns {Promise<boolean>}
 */
export async function healthCheck() {
  try {
    const client = getClient();
    const response = await client.get('/webServices/healthcheck.php');
    return response.data.status === 'ok';
  } catch (err) {
    console.error('ProjectFlow health check failed:', err.message);
    return false;
  }
}

/**
 * Get user's tasks from ProjectFlow
 * @param {string} userId - ProjectFlow user ID
 * @param {string} updatedSince - ISO timestamp for incremental sync
 * @returns {Promise<Object[]>}
 */
export async function getMyTasks(userId, updatedSince = null) {
  try {
    const client = getClient();
    const params = { userId };

    if (updatedSince) {
      params.updatedSince = updatedSince;
    }

    const response = await client.get('/webServices/getMyTasks.php', { params });
    return response.data.tasks || [];
  } catch (err) {
    console.error('Error fetching ProjectFlow tasks:', err.message);
    throw err;
  }
}

/**
 * Get work packages for user
 * @param {string} userId - ProjectFlow user ID
 * @param {string} projectId - Optional project filter
 * @returns {Promise<Object[]>}
 */
export async function getMyWorkpackages(userId, projectId = null) {
  try {
    const client = getClient();
    const params = { userId };

    if (projectId) {
      params.projectId = projectId;
    }

    const response = await client.get('/webServices/getMyWorkpackages.php', { params });
    return response.data.workpackages || [];
  } catch (err) {
    console.error('Error fetching workpackages:', err.message);
    throw err;
  }
}

/**
 * Update task status in ProjectFlow
 * @param {string} wpTaskId - WorkPackage task ID
 * @param {number} newStatusId - New status ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export async function updateTaskStatus(wpTaskId, newStatusId, userId) {
  try {
    const client = getClient();
    const response = await client.post('/webServices/updateTaskStatus.php', {
      wpTaskId,
      statusId: newStatusId,
      userId,
    });

    return response.data;
  } catch (err) {
    console.error('Error updating ProjectFlow task status:', err.message);
    throw err;
  }
}

/**
 * Update task progress in ProjectFlow
 * @param {string} wpTaskId - WorkPackage task ID
 * @param {number} progressPct - Progress percentage (0-100)
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export async function updateTaskProgress(wpTaskId, progressPct, userId) {
  try {
    const client = getClient();
    const response = await client.post('/webServices/updateTaskProgress.php', {
      wpTaskId,
      progress: Math.min(100, Math.max(0, progressPct)),
      userId,
    });

    return response.data;
  } catch (err) {
    console.error('Error updating ProjectFlow task progress:', err.message);
    throw err;
  }
}

/**
 * Initiate task in ProjectFlow
 * @param {string} wpTaskId - WorkPackage task ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export async function initiateTask(wpTaskId, userId) {
  try {
    const client = getClient();
    const response = await client.post('/webServices/initiateTask.php', {
      wpTaskId,
      userId,
    });

    return response.data;
  } catch (err) {
    console.error('Error initiating ProjectFlow task:', err.message);
    throw err;
  }
}

/**
 * Map ProjectFlow status ID to internal status
 * @param {number} pfStatusId - ProjectFlow status ID
 * @returns {string}
 */
export function mapPfStatusToInternal(pfStatusId) {
  return PF_STATUS_MAP[pfStatusId] || 'not_started';
}

/**
 * Map internal status to ProjectFlow status ID
 * @param {string} internalStatus - Internal status
 * @returns {number}
 */
export function mapInternalStatusToPf(internalStatus) {
  return STATUS_TO_PF[internalStatus] || 17;
}

/**
 * Resolve conflict between local and remote task
 * ProjectFlow takes precedence for project-controlled fields
 * @param {Object} localTask - Local task
 * @param {Object} remoteTask - Remote ProjectFlow task
 * @returns {Object} Resolved task
 */
export function resolveConflict(localTask, remoteTask) {
  return {
    id: localTask.id,
    title: remoteTask.title || localTask.title,
    description: remoteTask.description || localTask.description,
    due_date: remoteTask.due_date || localTask.due_date,
    status: mapPfStatusToInternal(remoteTask.status_id),
    priority: localTask.priority, // Local takes precedence for priority
    progress_pct: remoteTask.progress || localTask.progress_pct,
    estimated_effort: remoteTask.estimated_effort || localTask.estimated_effort,
  };
}

/**
 * Perform inbound sync from ProjectFlow
 * @param {string} userId - User ID
 * @param {string} pfUserId - ProjectFlow user ID
 * @returns {Promise<Object>} Sync result
 */
export async function syncInbound(userId, pfUserId) {
  const startTime = Date.now();
  let itemsProcessed = 0;
  let itemsFailed = 0;
  let itemsSkipped = 0;
  let errorMessage = null;

  try {
    // Get sync state
    const syncState = await SyncLogModel.getPfSyncState(userId);
    const lastSync = syncState?.last_inbound_sync;

    // Fetch tasks from ProjectFlow
    const pfTasks = await getMyTasks(pfUserId, lastSync);

    // Process each task
    for (const pfTask of pfTasks) {
      try {
        // Check if task already exists in our database
        const existingTask = await TaskModel.findByExternalId(
          'projectflow',
          pfTask.id,
          userId
        );

        if (existingTask) {
          // Update existing task
          await TaskModel.update(existingTask.id, {
            title: pfTask.title,
            description: pfTask.description,
            due_date: pfTask.due_date,
            status: mapPfStatusToInternal(pfTask.status_id),
            progress_pct: pfTask.progress || 0,
            estimated_effort: pfTask.estimated_effort,
          });

          // Update ProjectFlow metadata
          await TaskModel.upsertPfTaskMeta(existingTask.id, {
            pf_task_id: pfTask.id,
            pf_status_id: pfTask.status_id,
            wp_code: pfTask.wp_code,
            wbs_path: pfTask.wbs_path,
            estimated_effort: pfTask.estimated_effort,
          });
        } else {
          // Create new task
          const newTask = await TaskModel.create({
            user_id: userId,
            source: 'projectflow',
            external_id: pfTask.id,
            title: pfTask.title,
            description: pfTask.description,
            due_date: pfTask.due_date,
            status: mapPfStatusToInternal(pfTask.status_id),
            progress_pct: pfTask.progress || 0,
            estimated_effort: pfTask.estimated_effort,
          });

          // Add ProjectFlow metadata
          await TaskModel.upsertPfTaskMeta(newTask.id, {
            pf_task_id: pfTask.id,
            pf_status_id: pfTask.status_id,
            wp_code: pfTask.wp_code,
            wbs_path: pfTask.wbs_path,
            estimated_effort: pfTask.estimated_effort,
          });
        }

        itemsProcessed += 1;
      } catch (err) {
        console.error('Error syncing task:', { taskId: pfTask.id, error: err.message });
        itemsFailed += 1;
      }
    }

    // Update sync state
    await SyncLogModel.updatePfSyncState(userId, {
      last_inbound_sync: new Date(),
      connection_status: 'connected',
    });

    // Log sync
    await SyncLogModel.create({
      user_id: userId,
      source: 'projectflow',
      direction: 'inbound',
      status: itemsFailed === 0 ? 'success' : 'partial',
      items_processed: itemsProcessed,
      items_failed: itemsFailed,
      items_skipped: itemsSkipped,
      error_message: errorMessage,
    });

    return {
      success: true,
      itemsProcessed,
      itemsFailed,
      itemsSkipped,
      duration: Date.now() - startTime,
    };
  } catch (err) {
    errorMessage = err.message;

    // Update sync state with error
    await SyncLogModel.updatePfSyncState(userId, {
      last_sync_error: new Date(),
      connection_status: 'error',
    });

    // Log error
    await SyncLogModel.create({
      user_id: userId,
      source: 'projectflow',
      direction: 'inbound',
      status: 'error',
      items_processed: itemsProcessed,
      items_failed: itemsFailed,
      error_message: errorMessage,
    });

    throw err;
  }
}

/**
 * Perform outbound sync to ProjectFlow
 * @param {string} taskId - Task ID
 * @param {string} action - Action (update_status, update_progress, etc.)
 * @param {Object} data - Action data
 * @returns {Promise<Object>}
 */
export async function syncOutbound(taskId, action, data) {
  try {
    const task = await TaskModel.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const pfMeta = await TaskModel.getPfTaskMeta(taskId);
    if (!pfMeta || !pfMeta.pf_task_id) {
      throw new Error('Task is not linked to ProjectFlow');
    }

    let result;
    switch (action) {
      case 'update_status':
        result = await updateTaskStatus(
          pfMeta.pf_task_id,
          mapInternalStatusToPf(data.status),
          data.userId
        );
        break;

      case 'update_progress':
        result = await updateTaskProgress(
          pfMeta.pf_task_id,
          data.progress,
          data.userId
        );
        break;

      case 'initiate':
        result = await initiateTask(pfMeta.pf_task_id, data.userId);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Log successful outbound sync
    await SyncLogModel.create({
      user_id: data.userId,
      source: 'projectflow',
      direction: 'outbound',
      status: 'success',
      items_processed: 1,
    });

    return result;
  } catch (err) {
    console.error('Error in outbound sync:', err.message);
    throw err;
  }
}

export default {
  healthCheck,
  getMyTasks,
  getMyWorkpackages,
  updateTaskStatus,
  updateTaskProgress,
  initiateTask,
  mapPfStatusToInternal,
  mapInternalStatusToPf,
  resolveConflict,
  syncInbound,
  syncOutbound,
};
