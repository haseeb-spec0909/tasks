/**
 * Google Chat bot service
 * Handles chat messages, cards, and notifications
 */

import axios from 'axios';
import config from '../config/index.js';
import * as TaskModel from '../models/Task.js';
import * as UserModel from '../models/User.js';

/**
 * Send message to Google Chat via webhook
 * @param {string} message - Message text or card JSON
 * @returns {Promise<Object>}
 */
async function sendViaWebhook(message) {
  try {
    const response = await axios.post(config.GOOGLE_CHAT_WEBHOOK_URL, message);
    return response.data;
  } catch (err) {
    console.error('Error sending to Google Chat:', err.message);
    throw err;
  }
}

/**
 * Handle incoming message
 * @param {Object} event - Chat event
 * @returns {Promise<Object>} Response
 */
export async function handleMessage(event) {
  try {
    const { message, user, space } = event;
    const text = message?.text || '';

    // Parse message for commands
    if (text.startsWith('/')) {
      return await handleCommand(text, user, space);
    }

    // Respond to mention or general message
    return {
      text: 'I\'m TimeIntel, your work intelligence assistant. Try: /tasks, /schedule, /help',
    };
  } catch (err) {
    console.error('Error handling message:', err.message);
    return {
      text: 'Sorry, I encountered an error processing your message.',
    };
  }
}

/**
 * Handle command
 * @param {string} command - Command text
 * @param {Object} user - User info
 * @param {Object} space - Space info
 * @returns {Promise<Object>}
 */
async function handleCommand(command, user, space) {
  const parts = command.split(' ');
  const cmd = parts[0].substring(1).toLowerCase(); // Remove /

  switch (cmd) {
    case 'tasks':
      return await getTasksCommand(user);

    case 'schedule':
      return await getScheduleCommand(user);

    case 'overdue':
      return await getOverdueCommand(user);

    case 'next':
      return await getNextCommand(user);

    case 'help':
      return await getHelpCommand();

    default:
      return { text: 'Unknown command. Type /help for available commands.' };
  }
}

/**
 * /tasks command - list user tasks
 * @param {Object} user - User info
 * @returns {Promise<Object>}
 */
async function getTasksCommand(user) {
  try {
    const dbUser = await UserModel.findByEmail(user.email);
    if (!dbUser) {
      return { text: 'User not found. Please authenticate first.' };
    }

    const tasks = await TaskModel.findByUserId(dbUser.id, { limit: 10 });
    return formatTaskListCard(tasks);
  } catch (err) {
    return { text: 'Error fetching tasks.' };
  }
}

/**
 * /schedule command - show schedule
 * @param {Object} user - User info
 * @returns {Promise<Object>}
 */
async function getScheduleCommand(user) {
  try {
    return formatScheduleCard({
      date: new Date().toISOString().split('T')[0],
      blocks: [],
      freeTime: '4 hours',
    });
  } catch (err) {
    return { text: 'Error fetching schedule.' };
  }
}

/**
 * /overdue command - show overdue tasks
 * @param {Object} user - User info
 * @returns {Promise<Object>}
 */
async function getOverdueCommand(user) {
  try {
    const dbUser = await UserModel.findByEmail(user.email);
    if (!dbUser) {
      return { text: 'User not found.' };
    }

    const tasks = await TaskModel.getOverdue(dbUser.id);
    if (tasks.length === 0) {
      return { text: 'No overdue tasks! Great job.' };
    }

    return formatTaskListCard(tasks, 'Overdue Tasks');
  } catch (err) {
    return { text: 'Error fetching overdue tasks.' };
  }
}

/**
 * /next command - show next tasks
 * @param {Object} user - User info
 * @returns {Promise<Object>}
 */
async function getNextCommand(user) {
  try {
    const dbUser = await UserModel.findByEmail(user.email);
    if (!dbUser) {
      return { text: 'User not found.' };
    }

    const tasks = await TaskModel.getUpNext(dbUser.id, 5);
    return formatTaskListCard(tasks, 'Up Next');
  } catch (err) {
    return { text: 'Error fetching next tasks.' };
  }
}

/**
 * /help command
 * @returns {Promise<Object>}
 */
async function getHelpCommand() {
  return {
    text: `TimeIntel Commands:
/tasks - List your tasks
/schedule - Show today's schedule
/overdue - Show overdue tasks
/next - Show up-next tasks
/help - Show this help message`,
  };
}

/**
 * Format schedule as Card v2
 * @param {Object} schedule - Schedule data
 * @returns {Object} Card message
 */
export function formatScheduleCard(schedule) {
  return {
    cardsV2: [
      {
        cardId: 'schedule-card',
        card: {
          header: {
            title: 'Your Schedule',
            subtitle: schedule.date,
          },
          sections: [
            {
              widgets: [
                {
                  textParagraph: {
                    text: `Free time: <b>${schedule.freeTime}</b>`,
                  },
                },
                {
                  divider: {},
                },
                {
                  textParagraph: {
                    text: schedule.blocks.length > 0
                      ? `${schedule.blocks.length} scheduled blocks`
                      : 'No scheduled blocks yet',
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };
}

/**
 * Format task list as Card v2
 * @param {Object[]} tasks - Array of tasks
 * @param {string} title - Card title
 * @returns {Object} Card message
 */
export function formatTaskListCard(tasks, title = 'Your Tasks') {
  const widgets = [];

  for (const task of tasks.slice(0, 10)) {
    const dueDate = task.due_date
      ? new Date(task.due_date).toLocaleDateString()
      : 'No due date';

    widgets.push({
      textParagraph: {
        text: `<b>${task.title}</b><br/>Due: ${dueDate} | Priority: ${task.priority}`,
      },
    });

    widgets.push({ divider: {} });
  }

  if (widgets.length > 0) {
    widgets.pop(); // Remove last divider
  }

  return {
    cardsV2: [
      {
        cardId: 'task-list-card',
        card: {
          header: {
            title,
            subtitle: `${tasks.length} tasks`,
          },
          sections: [
            {
              widgets: widgets.length > 0
                ? widgets
                : [{ textParagraph: { text: 'No tasks' } }],
            },
          ],
        },
      },
    ],
  };
}

/**
 * Format task notification card
 * @param {Object} task - Task data
 * @param {string} notificationType - Type: new, deadline, overdue, etc.
 * @returns {Object} Card message
 */
export function formatTaskNotificationCard(task, notificationType) {
  const messages = {
    new: 'New task assigned',
    deadline: 'Task due soon',
    overdue: 'Task is overdue',
    progress: 'Progress update needed',
    completed: 'Task completed',
  };

  const colors = {
    new: '#4285F4',
    deadline: '#FB8500',
    overdue: '#D32F2F',
    progress: '#1E88E5',
    completed: '#43A047',
  };

  return {
    cardsV2: [
      {
        cardId: `notification-${task.id}`,
        card: {
          header: {
            title: messages[notificationType] || 'Task Update',
            subtitle: task.title,
            imageUrl: 'https://www.gstatic.com/images/branding/product/1x/tasks_2020q4_48dp.png',
          },
          sections: [
            {
              widgets: [
                {
                  textParagraph: {
                    text: task.description || 'No description',
                  },
                },
                {
                  divider: {},
                },
                {
                  buttonList: {
                    buttons: [
                      {
                        text: 'Mark Complete',
                        onClick: {
                          action: {
                            actionMethodName: 'TASK_ACTION',
                            parameters: [
                              { key: 'action', value: 'complete' },
                              { key: 'taskId', value: task.id },
                            ],
                          },
                        },
                      },
                      {
                        text: 'View Details',
                        onClick: {
                          openLink: {
                            url: `https://timeintel.tmcltd.ai/tasks/${task.id}`,
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };
}

/**
 * Handle card button action
 * @param {Object} event - Card action event
 * @returns {Promise<Object>}
 */
export async function handleCardAction(event) {
  try {
    const { action, user } = event;
    const parameters = action.parameters || {};

    // Handle action
    const actionType = parameters.find(p => p.key === 'action')?.value;

    switch (actionType) {
      case 'complete': {
        const taskId = parameters.find(p => p.key === 'taskId')?.value;
        const dbUser = await UserModel.findByEmail(user.email);
        await TaskModel.markComplete(taskId, dbUser.id);
        return { text: 'Task marked as complete!' };
      }

      default:
        return { text: 'Action processed.' };
    }
  } catch (err) {
    console.error('Error handling card action:', err.message);
    return { text: 'Error processing action.' };
  }
}

/**
 * Send proactive message
 * @param {string} userId - User ID
 * @param {Object} message - Message object
 * @returns {Promise<void>}
 */
export async function sendProactiveMessage(userId, message) {
  try {
    // In production, would look up user's Google Chat space
    // and send proactive message via API
    console.log('Sending proactive message:', { userId, message });
  } catch (err) {
    console.error('Error sending proactive message:', err.message);
  }
}

/**
 * Send daily digest
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function sendDailyDigest(userId) {
  try {
    const user = await UserModel.findById(userId);
    const tasks = await TaskModel.findByUserId(userId, { limit: 5 });

    const card = formatTaskListCard(tasks, 'Your Daily Summary');
    await sendViaWebhook(card);
  } catch (err) {
    console.error('Error sending daily digest:', err.message);
  }
}

/**
 * Send weekly digest
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function sendWeeklyDigest(userId) {
  try {
    const user = await UserModel.findById(userId);
    const tasks = await TaskModel.findByUserId(userId, { limit: 10 });

    const card = formatTaskListCard(tasks, 'Weekly Summary');
    await sendViaWebhook(card);
  } catch (err) {
    console.error('Error sending weekly digest:', err.message);
  }
}

/**
 * Send task notification
 * @param {string} userId - User ID
 * @param {Object} task - Task data
 * @param {string} notificationType - Notification type
 * @returns {Promise<void>}
 */
export async function sendTaskNotification(userId, task, notificationType) {
  try {
    const card = formatTaskNotificationCard(task, notificationType);
    await sendViaWebhook(card);
  } catch (err) {
    console.error('Error sending task notification:', err.message);
  }
}

export default {
  handleMessage,
  handleCardAction,
  sendProactiveMessage,
  sendDailyDigest,
  sendWeeklyDigest,
  sendTaskNotification,
  formatScheduleCard,
  formatTaskListCard,
  formatTaskNotificationCard,
};
