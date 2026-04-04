/**
 * Habit routes
 */

import express from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { standardLimiter } from '../middleware/rateLimiter.js';
import * as HabitModel from '../models/Habit.js';
import { validateSafe } from '../utils/validators.js';
import { createHabitSchema, updateHabitSchema } from '../utils/validators.js';

const router = express.Router();

/**
 * GET /api/habits
 * List user's active habits
 */
router.get('/', verifyAuth, async (req, res, next) => {
  try {
    const habits = await HabitModel.findByUserId(req.user.id);

    return res.status(200).json({
      habits,
      count: habits.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/habits/templates
 * List available habit templates
 */
router.get('/templates', verifyAuth, async (req, res, next) => {
  try {
    const templates = await HabitModel.findTemplates();

    return res.status(200).json({
      templates,
      count: templates.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/habits
 * Create new habit
 */
router.post('/', verifyAuth, standardLimiter, async (req, res, next) => {
  try {
    const validation = validateSafe(createHabitSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid habit data',
        details: validation.error?.errors,
      });
    }

    const habit = await HabitModel.create({
      user_id: req.user.id,
      ...validation.data,
      start_date: new Date(),
    });

    return res.status(201).json({ habit });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/habits/:habitId
 * Update habit
 */
router.put('/:habitId', verifyAuth, standardLimiter, async (req, res, next) => {
  try {
    const habitId = req.params.habitId;

    // Verify ownership
    const habit = await HabitModel.findByUserId(req.user.id);
    const ownsHabit = habit.some(h => h.id === habitId);

    if (!ownsHabit) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Habit not found',
      });
    }

    const validation = validateSafe(updateHabitSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid habit data',
        details: validation.error?.errors,
      });
    }

    const updated = await HabitModel.update(habitId, validation.data);

    return res.status(200).json({ habit: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/habits/:habitId
 * Deactivate habit
 */
router.delete('/:habitId', verifyAuth, standardLimiter, async (req, res, next) => {
  try {
    const habitId = req.params.habitId;

    // Verify ownership
    const habits = await HabitModel.findByUserId(req.user.id);
    const ownsHabit = habits.some(h => h.id === habitId);

    if (!ownsHabit) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Habit not found',
      });
    }

    const updated = await HabitModel.deactivate(habitId);

    return res.status(200).json({ 
      message: 'Habit deactivated',
      habit: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/habits/from-template
 * Clone a template for the user
 */
router.post('/from-template', verifyAuth, standardLimiter, async (req, res, next) => {
  try {
    const { templateId } = req.body;

    if (!templateId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'templateId is required',
      });
    }

    const habit = await HabitModel.cloneTemplateForUser(templateId, req.user.id);

    return res.status(201).json({ habit });
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Template not found',
      });
    }
    next(err);
  }
});

/**
 * POST /api/habits/:habitId/log
 * Record habit completion
 */
router.post('/:habitId/log', verifyAuth, standardLimiter, async (req, res, next) => {
  try {
    const habitId = req.params.habitId;
    const { count } = req.body;

    // Verify ownership
    const habits = await HabitModel.findByUserId(req.user.id);
    const ownsHabit = habits.some(h => h.id === habitId);

    if (!ownsHabit) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Habit not found',
      });
    }

    const log = await HabitModel.recordCompletion(habitId, count || 1);

    return res.status(201).json({ log });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/habits/:habitId/stats
 * Get habit statistics
 */
router.get('/:habitId/stats', verifyAuth, async (req, res, next) => {
  try {
    const habitId = req.params.habitId;
    const { days } = req.query;

    // Verify ownership
    const habits = await HabitModel.findByUserId(req.user.id);
    const ownsHabit = habits.some(h => h.id === habitId);

    if (!ownsHabit) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Habit not found',
      });
    }

    const stats = await HabitModel.getStats(habitId, parseInt(days || 30, 10));

    return res.status(200).json({ stats });
  } catch (err) {
    next(err);
  }
});

export default router;
