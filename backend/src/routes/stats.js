/**
 * Statistics routes
 */

import express from 'express';
import { verifyAuth, requireRole } from '../middleware/auth.js';
import { standardLimiter } from '../middleware/rateLimiter.js';
import * as TaskModel from '../models/Task.js';
import * as UserModel from '../models/User.js';
import { query } from '../config/database.js';

const router = express.Router();

/**
 * GET /api/stats/personal
 * Personal time breakdown, task completion rate, focus achievement
 */
router.get('/personal', verifyAuth, standardLimiter, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all tasks
    const allTasks = await TaskModel.findByUserId(userId, { limit: 1000 });
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    const inProgressTasks = allTasks.filter(t => t.status === 'in_progress');
    const overdueTasks = await TaskModel.getOverdue(userId);

    // Calculate completion rate
    const completionRate = allTasks.length > 0
      ? (completedTasks.length / allTasks.length * 100).toFixed(1)
      : 0;

    // Get this week's stats
    const result = await query(
      `SELECT 
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_this_week,
        COUNT(*) as total_this_week,
        AVG(progress_pct) as avg_progress
      FROM tasks
      WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '7 days'`,
      [userId]
    );

    const weekStats = result.rows[0] || {};

    return res.status(200).json({
      personal_stats: {
        total_tasks: allTasks.length,
        completed_tasks: completedTasks.length,
        in_progress_tasks: inProgressTasks.length,
        overdue_tasks: overdueTasks.length,
        completion_rate: parseFloat(completionRate),
        this_week: {
          completed: parseInt(weekStats.completed_this_week || 0, 10),
          total: parseInt(weekStats.total_this_week || 0, 10),
          average_progress: weekStats.avg_progress
            ? parseFloat(weekStats.avg_progress).toFixed(1)
            : 0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/stats/team
 * Team statistics (manager only)
 */
router.get('/team', verifyAuth, requireRole('manager'), standardLimiter, async (req, res, next) => {
  try {
    const managerId = req.user.id;

    // Get team members
    const teamMembers = await UserModel.getTeamMembers(managerId);

    // Get team tasks
    const teamTasks = await TaskModel.getTeamTasks(managerId);
    const completedTeamTasks = teamTasks.filter(t => t.status === 'completed');
    const overdueTeamTasks = teamTasks.filter(t => t.due_date < new Date() && t.status !== 'completed');

    // Per-member stats
    const memberStats = {};
    for (const member of teamMembers) {
      const memberTasks = teamTasks.filter(t => t.user_id === member.id);
      memberStats[member.id] = {
        name: member.name,
        email: member.email,
        total_tasks: memberTasks.length,
        completed: memberTasks.filter(t => t.status === 'completed').length,
        in_progress: memberTasks.filter(t => t.status === 'in_progress').length,
        overdue: memberTasks.filter(t => t.due_date < new Date() && t.status !== 'completed').length,
        completion_rate: memberTasks.length > 0
          ? (memberTasks.filter(t => t.status === 'completed').length / memberTasks.length * 100).toFixed(1)
          : 0,
      };
    }

    return res.status(200).json({
      team_stats: {
        team_size: teamMembers.length,
        total_tasks: teamTasks.length,
        completed_tasks: completedTeamTasks.length,
        overdue_tasks: overdueTeamTasks.length,
        team_completion_rate: teamTasks.length > 0
          ? (completedTeamTasks.length / teamTasks.length * 100).toFixed(1)
          : 0,
        members: memberStats,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/stats/pf-delivery
 * ProjectFlow delivery health
 */
router.get('/pf-delivery', verifyAuth, standardLimiter, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get ProjectFlow tasks only
    const pfTasks = await TaskModel.findByUserId(userId, { source: 'projectflow' });
    const completed = pfTasks.filter(t => t.status === 'completed');
    const atRisk = await TaskModel.getAtRisk(userId, 3);
    const pfAtRisk = atRisk.filter(t => t.source === 'projectflow');

    return res.status(200).json({
      pf_delivery: {
        total_tasks: pfTasks.length,
        completed: completed.length,
        completion_rate: pfTasks.length > 0
          ? (completed.length / pfTasks.length * 100).toFixed(1)
          : 0,
        at_risk: pfAtRisk.length,
        avg_progress: pfTasks.length > 0
          ? (pfTasks.reduce((sum, t) => sum + (t.progress_pct || 0), 0) / pfTasks.length).toFixed(1)
          : 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/stats/capacity
 * Capacity vs assignment
 */
router.get('/capacity', verifyAuth, standardLimiter, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const settings = await UserModel.getSettings(userId);

    // Calculate available hours this week
    const workHoursPerDay = settings.work_hours.end - settings.work_hours.start;
    const workDaysThisWeek = settings.work_hours.days.length;
    const totalCapacityHours = workHoursPerDay * workDaysThisWeek;
    const totalCapacityMinutes = totalCapacityHours * 60;

    // Get this week's tasks
    const tasks = await TaskModel.findByUserId(userId, { limit: 1000 });
    const thisWeekTasks = tasks.filter(t => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      const now = new Date();
      const daysUntilDue = (dueDate - now) / (1000 * 60 * 60 * 24);
      return daysUntilDue >= 0 && daysUntilDue <= 7;
    });

    const assignedMinutes = thisWeekTasks.reduce((sum, t) => sum + (t.estimated_effort || 0), 0);
    const utilizationRate = totalCapacityMinutes > 0
      ? (assignedMinutes / totalCapacityMinutes * 100).toFixed(1)
      : 0;

    return res.status(200).json({
      capacity: {
        total_available_minutes: totalCapacityMinutes,
        assigned_minutes: assignedMinutes,
        utilization_rate: parseFloat(utilizationRate),
        status: utilizationRate > 100 ? 'overallocated' : utilizationRate > 80 ? 'high' : 'healthy',
        this_week_tasks: thisWeekTasks.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/stats/weekly-recap
 * Weekly summary
 */
router.get('/weekly-recap', verifyAuth, standardLimiter, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get this week's data
    const result = await query(
      `SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        AVG(progress_pct) as avg_progress,
        SUM(estimated_effort) as total_effort
      FROM tasks
      WHERE user_id = $1
        AND due_date >= NOW() - INTERVAL '7 days'`,
      [userId]
    );

    const weekData = result.rows[0] || {};

    return res.status(200).json({
      weekly_recap: {
        total_tasks: parseInt(weekData.total_tasks || 0, 10),
        completed_tasks: parseInt(weekData.completed || 0, 10),
        in_progress_tasks: parseInt(weekData.in_progress || 0, 10),
        average_progress: weekData.avg_progress ? parseFloat(weekData.avg_progress).toFixed(1) : 0,
        total_effort_minutes: weekData.total_effort || 0,
        period: 'Last 7 days',
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
