/**
 * Team routes (manager only)
 */

import express from 'express';
import { verifyAuth, requireRole } from '../middleware/auth.js';
import { standardLimiter } from '../middleware/rateLimiter.js';
import * as UserModel from '../models/User.js';
import * as TaskModel from '../models/Task.js';

const router = express.Router();

// Apply manager role requirement to all routes
router.use(verifyAuth);
router.use(requireRole('manager'));

/**
 * GET /api/team/members
 * List team members
 */
router.get('/members', standardLimiter, async (req, res, next) => {
  try {
    const members = await UserModel.getTeamMembers(req.user.id);

    return res.status(200).json({
      members,
      count: members.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/team/workload
 * Team workload heatmap data
 */
router.get('/workload', standardLimiter, async (req, res, next) => {
  try {
    const members = await UserModel.getTeamMembers(req.user.id);
    const teamTasks = await TaskModel.getTeamTasks(req.user.id);

    // Group by member
    const workload = {};
    for (const member of members) {
      const memberTasks = teamTasks.filter(t => t.user_id === member.id);
      const totalEffort = memberTasks.reduce((sum, t) => sum + (t.estimated_effort || 0), 0);
      
      workload[member.id] = {
        name: member.name,
        email: member.email,
        task_count: memberTasks.length,
        total_effort_minutes: totalEffort,
        completion_rate: memberTasks.length > 0
          ? (memberTasks.filter(t => t.status === 'completed').length / memberTasks.length * 100).toFixed(1)
          : 0,
        overdue_count: memberTasks.filter(t => t.due_date < new Date() && t.status !== 'completed').length,
      };
    }

    return res.status(200).json({ workload });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/team/at-risk
 * At-risk tasks across team
 */
router.get('/at-risk', standardLimiter, async (req, res, next) => {
  try {
    const teamTasks = await TaskModel.getTeamTasks(req.user.id, { overdue_only: false });

    // Filter at-risk (due within 3 days)
    const atRisk = teamTasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      const daysUntilDue = (new Date(t.due_date) - new Date()) / (1000 * 60 * 60 * 24);
      return daysUntilDue > -1 && daysUntilDue <= 3;
    });

    return res.status(200).json({
      at_risk_tasks: atRisk,
      count: atRisk.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/team/wbs-tracker
 * ProjectFlow WBS tree
 */
router.get('/wbs-tracker', standardLimiter, async (req, res, next) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'projectId is required',
      });
    }

    // Get all tasks for project
    const tasks = await TaskModel.getTasksByPfProject(projectId);

    // Build WBS tree
    const tree = {};
    for (const task of tasks) {
      const wbsParts = task.wbs_path.split('.');
      let current = tree;

      for (let i = 0; i < wbsParts.length; i++) {
        const part = wbsParts[i];
        if (!current[part]) {
          current[part] = {
            code: part,
            children: {},
            tasks: [],
          };
        }

        if (i === wbsParts.length - 1) {
          // Leaf node - add task
          current[part].tasks.push({
            id: task.id,
            title: task.title,
            status: task.status,
            progress: task.progress_pct,
            assignee: task.name,
          });
        }

        current = current[part].children;
      }
    }

    return res.status(200).json({ wbs_tree: tree });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/team/capacity
 * Capacity vs allocation per member
 */
router.get('/capacity', standardLimiter, async (req, res, next) => {
  try {
    const members = await UserModel.getTeamMembers(req.user.id);
    const capacity = {};

    for (const member of members) {
      const memberSettings = await UserModel.getSettings(member.id);
      const memberTasks = await TaskModel.findByUserId(member.id, { limit: 1000 });

      const workHoursPerDay = memberSettings.work_hours.end - memberSettings.work_hours.start;
      const workDaysThisWeek = memberSettings.work_hours.days.length;
      const totalCapacityMinutes = workHoursPerDay * workDaysThisWeek * 60;

      const assignedMinutes = memberTasks.reduce((sum, t) => sum + (t.estimated_effort || 0), 0);
      const utilizationRate = totalCapacityMinutes > 0
        ? (assignedMinutes / totalCapacityMinutes * 100).toFixed(1)
        : 0;

      capacity[member.id] = {
        name: member.name,
        email: member.email,
        available_minutes: totalCapacityMinutes,
        assigned_minutes: assignedMinutes,
        utilization_rate: parseFloat(utilizationRate),
        status: utilizationRate > 100 ? 'overallocated' : utilizationRate > 80 ? 'high' : 'healthy',
      };
    }

    return res.status(200).json({ capacity });
  } catch (err) {
    next(err);
  }
});

export default router;
