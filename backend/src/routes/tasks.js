/**
 * Task routes
 */

import express from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { standardLimiter } from '../middleware/rateLimiter.js';
import * as TaskModel from '../models/Task.js';
import { validateSafe } from '../utils/validators.js';
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
  updateProgressSchema,
  updatePrioritySchema,
} from '../utils/validators.js';
import { calculatePriority } from '../utils/helpers.js';

const router = express.Router();

/**
 * GET /api/tasks
 * List tasks with filters
 */
router.get('/', verifyAuth, standardLimiter, async (req, res, next) => {
  try {
    const validation = validateSafe(listTasksQuerySchema, req.query);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid query parameters',
        details: validation.error?.errors,
      });
    }

    const { source, status, priority, dueWithinDays, search, limit, offset, sort } = validation.data;

    const tasks = await TaskModel.findByUserId(req.user.id, {
      source,
      status,
      priority,
      dueWithinDays,
      search,
      limit,
      offset,
    });

    return res.status(200).json({
      tasks,
      count: tasks.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/tasks/up-next
 * Get AI-prioritized next tasks
 */
router.get('/up-next', verifyAuth, async (req, res, next) => {
  try {
    const tasks = await TaskModel.getUpNext(req.user.id, 10);

    // Calculate priority scores
    const scored = tasks.map(task => ({
      ...task,
      priority_score: calculatePriority(task),
    }));

    // Sort by priority score
    scored.sort((a, b) => b.priority_score - a.priority_score);

    return res.status(200).json({ tasks: scored });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/tasks/overdue
 * Get overdue tasks
 */
router.get('/overdue', verifyAuth, async (req, res, next) => {
  try {
    const tasks = await TaskModel.getOverdue(req.user.id);

    return res.status(200).json({
      tasks,
      count: tasks.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/tasks/stats
 * Task statistics
 */
router.get('/stats', verifyAuth, async (req, res, next) => {
  try {
    const allTasks = await TaskModel.findByUserId(req.user.id, { limit: 1000 });
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    const overdueTasks = await TaskModel.getOverdue(req.user.id);

    return res.status(200).json({
      total: allTasks.length,
      completed: completedTasks.length,
      completion_rate: allTasks.length > 0
        ? (completedTasks.length / allTasks.length * 100).toFixed(1)
        : 0,
      overdue: overdueTasks.length,
      in_progress: allTasks.filter(t => t.status === 'in_progress').length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/tasks/:taskId
 * Get single task with PF metadata
 */
router.get('/:taskId', verifyAuth, async (req, res, next) => {
  try {
    const task = await TaskModel.findById(req.params.taskId);

    if (!task || task.user_id !== req.user.id) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Task not found',
      });
    }

    return res.status(200).json({ task });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tasks
 * Create new task (personal/Google Tasks only)
 */
router.post('/', verifyAuth, standardLimiter, async (req, res, next) => {
  try {
    const validation = validateSafe(createTaskSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid task data',
        details: validation.error?.errors,
      });
    }

    const task = await TaskModel.create({
      user_id: req.user.id,
      source: 'google_tasks',
      ...validation.data,
      status: 'not_started',
    });

    return res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/tasks/:taskId
 * Update task
 */
router.put('/:taskId', verifyAuth, standardLimiter, async (req, res, next) => {
  try {
    const task = await TaskModel.findById(req.params.taskId);
    if (!task || task.user_id !== req.user.id) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Task not found',
      });
    }

    const validation = validateSafe(updateTaskSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid task data',
        details: validation.error?.errors,
      });
    }

    const updated = await TaskModel.update(req.params.taskId, validation.data);

    return res.status(200).json({ task: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/tasks/:taskId/complete
 * Mark task as complete
 */
router.put('/:taskId/complete', verifyAuth, standardLimiter, async (req, res, next) => {
  try {
    const task = await TaskModel.findById(req.params.taskId);
    if (!task || task.user_id !== req.user.id) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Task not found',
      });
    }

    const updated = await TaskModel.markComplete(req.params.taskId, req.user.id);

    return res.status(200).json({ task: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/tasks/:taskId/progress
 * Update progress percentage
 */
router.put('/:taskId/progress', verifyAuth, standardLimiter, async (req, res, next) => {
  try {
    const task = await TaskModel.findById(req.params.taskId);
    if (!task || task.user_id !== req.user.id) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Task not found',
      });
    }

    const validation = validateSafe(updateProgressSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid progress data',
      });
    }

    const updated = await TaskModel.updateProgress(
      req.params.taskId,
      validation.data.progress_pct
    );

    return res.status(200).json({ task: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/tasks/:taskId/priority
 * Update priority
 */
router.put('/:taskId/priority', verifyAuth, standardLimiter, async (req, res, next) => {
  try {
    const task = await TaskModel.findById(req.params.taskId);
    if (!task || task.user_id !== req.user.id) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Task not found',
      });
    }

    const validation = validateSafe(updatePrioritySchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid priority data',
      });
    }

    const updated = await TaskModel.update(req.params.taskId, {
      priority: validation.data.priority,
    });

    return res.status(200).json({ task: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
