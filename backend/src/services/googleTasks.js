/**
 * Google Tasks service
 * Handles task list and task management via Google Tasks API
 */

import { google } from 'googleapis';
import config from '../config/index.js';

const tasks = google.tasks('v1');

/**
 * Initialize OAuth2 client with user tokens
 * @param {Object} userTokens - User's OAuth tokens
 * @returns {Object} Authenticated OAuth2 client
 */
export function initClient(userTokens) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI
  );

  oauth2Client.setCredentials(userTokens);
  return oauth2Client;
}

/**
 * Get all task lists
 * @param {Object} client - Authenticated OAuth2 client
 * @returns {Promise<Object[]>} Task lists
 */
export async function getTaskLists(client) {
  try {
    const response = await tasks.tasklists.list({
      auth: client,
      maxResults: 100,
    });

    return response.data.items || [];
  } catch (err) {
    console.error('Error fetching task lists:', err.message);
    throw err;
  }
}

/**
 * Get all tasks from a list
 * @param {Object} client - Authenticated OAuth2 client
 * @param {string} taskListId - Task list ID
 * @returns {Promise<Object[]>} Tasks
 */
export async function getTasks(client, taskListId) {
  try {
    const response = await tasks.tasks.list({
      auth: client,
      tasklist: taskListId,
      maxResults: 100,
      showDeleted: false,
      showHidden: false,
    });

    return response.data.items || [];
  } catch (err) {
    console.error('Error fetching tasks:', err.message);
    throw err;
  }
}

/**
 * Get single task
 * @param {Object} client - Authenticated OAuth2 client
 * @param {string} taskListId - Task list ID
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Task
 */
export async function getTask(client, taskListId, taskId) {
  try {
    const response = await tasks.tasks.get({
      auth: client,
      tasklist: taskListId,
      task: taskId,
    });

    return response.data;
  } catch (err) {
    console.error('Error fetching task:', err.message);
    throw err;
  }
}

/**
 * Create task
 * @param {Object} client - Authenticated OAuth2 client
 * @param {string} taskListId - Task list ID
 * @param {Object} taskData - Task data
 * @returns {Promise<Object>} Created task
 */
export async function createTask(client, taskListId, taskData) {
  try {
    const { title, notes, due, parent } = taskData;

    const task = {
      title,
      notes,
      due,
    };

    if (parent) {
      task.parent = parent;
    }

    const response = await tasks.tasks.insert({
      auth: client,
      tasklist: taskListId,
      resource: task,
    });

    return response.data;
  } catch (err) {
    console.error('Error creating task:', err.message);
    throw err;
  }
}

/**
 * Update task
 * @param {Object} client - Authenticated OAuth2 client
 * @param {string} taskListId - Task list ID
 * @param {string} taskId - Task ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated task
 */
export async function updateTask(client, taskListId, taskId, updates) {
  try {
    const response = await tasks.tasks.update({
      auth: client,
      tasklist: taskListId,
      task: taskId,
      resource: updates,
    });

    return response.data;
  } catch (err) {
    console.error('Error updating task:', err.message);
    throw err;
  }
}

/**
 * Mark task as completed
 * @param {Object} client - Authenticated OAuth2 client
 * @param {string} taskListId - Task list ID
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Updated task
 */
export async function completeTask(client, taskListId, taskId) {
  try {
    const response = await tasks.tasks.update({
      auth: client,
      tasklist: taskListId,
      task: taskId,
      resource: { status: 'completed' },
    });

    return response.data;
  } catch (err) {
    console.error('Error completing task:', err.message);
    throw err;
  }
}

/**
 * Parse command syntax from task notes
 * Extracts duration, notbefore, due, priority, type, split, minblock
 * @param {string} notes - Task notes
 * @returns {Object} Parsed commands
 */
export function parseCommandSyntax(notes) {
  const commands = {};

  if (!notes) return commands;

  // Parse duration: "2h 30m" or "150m"
  const durationMatch = notes.match(/duration:\s*([\dhms\s]+)/i);
  if (durationMatch) {
    commands.duration = durationMatch[1].trim();
  }

  // Parse notbefore: "2024-01-15" or "tomorrow" or "next Monday"
  const notbeforeMatch = notes.match(/notbefore:\s*([^\n,]+)/i);
  if (notbeforeMatch) {
    commands.notbefore = notbeforeMatch[1].trim();
  }

  // Parse due: date
  const dueMatch = notes.match(/due:\s*([^\n,]+)/i);
  if (dueMatch) {
    commands.due = dueMatch[1].trim();
  }

  // Parse priority: high, medium, low
  const priorityMatch = notes.match(/priority:\s*(high|medium|low)/i);
  if (priorityMatch) {
    commands.priority = priorityMatch[1].toLowerCase();
  }

  // Parse type: focus, meeting, admin, etc.
  const typeMatch = notes.match(/type:\s*([^\n,]+)/i);
  if (typeMatch) {
    commands.type = typeMatch[1].trim();
  }

  // Parse split: number of subtasks
  const splitMatch = notes.match(/split:\s*(\d+)/i);
  if (splitMatch) {
    commands.split = parseInt(splitMatch[1], 10);
  }

  // Parse minblock: minimum block duration in minutes
  const minblockMatch = notes.match(/minblock:\s*(\d+)/i);
  if (minblockMatch) {
    commands.minblock = parseInt(minblockMatch[1], 10);
  }

  return commands;
}

/**
 * Poll for changes since last sync
 * @param {Object} client - Authenticated OAuth2 client
 * @param {string} userId - User ID
 * @returns {Promise<Object[]>} Changed tasks
 */
export async function pollForChanges(client, userId) {
  try {
    const taskLists = await getTaskLists(client);
    const allTasks = [];

    for (const list of taskLists) {
      const listTasks = await getTasks(client, list.id);
      allTasks.push(...listTasks.map(t => ({ ...t, taskListId: list.id })));
    }

    return allTasks;
  } catch (err) {
    console.error('Error polling for changes:', err.message);
    throw err;
  }
}

export default {
  initClient,
  getTaskLists,
  getTasks,
  getTask,
  createTask,
  updateTask,
  completeTask,
  parseCommandSyntax,
  pollForChanges,
};
