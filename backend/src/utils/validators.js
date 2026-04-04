/**
 * Request validation schemas using Zod
 */

import { z } from 'zod';

/**
 * Create task validation schema
 */
export const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  due_date: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  estimated_effort: z.number().min(0).max(480).optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * Update task validation schema
 */
export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  due_date: z.string().datetime().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  progress_pct: z.number().min(0).max(100).optional(),
  estimated_effort: z.number().min(0).max(480).optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * Update user settings validation schema
 */
export const updateSettingsSchema = z.object({
  timezone: z.string().optional(),
  notification_preferences: z.object({
    enabled: z.boolean().optional(),
    quiet_hours: z.object({
      start: z.number().min(0).max(23),
      end: z.number().min(0).max(23),
    }).optional(),
    channels: z.array(z.string()).optional(),
  }).optional(),
  scheduling_preferences: z.object({
    min_block_duration: z.number().min(15).max(240).optional(),
    allow_back_to_back: z.boolean().optional(),
    prefer_morning: z.boolean().optional(),
  }).optional(),
  work_hours: z.object({
    start: z.number().min(0).max(23),
    end: z.number().min(0).max(23),
    days: z.array(z.number().min(0).max(6)),
  }).optional(),
});

/**
 * Create habit validation schema
 */
export const createHabitSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().min(1).max(50),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  target_count: z.number().min(1),
  target_unit: z.string().min(1).max(50),
  end_date: z.string().datetime().optional(),
});

/**
 * Update habit validation schema
 */
export const updateHabitSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  target_count: z.number().min(1).optional(),
  target_unit: z.string().min(1).max(50).optional(),
  end_date: z.string().datetime().optional(),
});

/**
 * OAuth callback validation schema
 */
export const oauthCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().optional(),
});

/**
 * List tasks query validation schema
 */
export const listTasksQuerySchema = z.object({
  source: z.enum(['google_tasks', 'projectflow']).optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueWithinDays: z.number().min(0).optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(['due_date', 'priority', 'created']).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

/**
 * Update progress validation schema
 */
export const updateProgressSchema = z.object({
  progress_pct: z.number().min(0).max(100),
});

/**
 * Update priority validation schema
 */
export const updatePrioritySchema = z.object({
  priority: z.enum(['low', 'medium', 'high']),
});

/**
 * Calendar event query validation schema
 */
export const calendarEventQuerySchema = z.object({
  timeMin: z.string().datetime(),
  timeMax: z.string().datetime(),
});

/**
 * Reschedule validation schema
 */
export const rescheduleSchema = z.object({
  newDate: z.string().datetime().optional(),
  newTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format').optional(),
  taskId: z.string().min(1),
});

/**
 * Onboarding validation schema
 */
export const onboardingSchema = z.object({
  timezone: z.string(),
  work_hours_start: z.number().min(0).max(23),
  work_hours_end: z.number().min(0).max(23),
  work_days: z.array(z.number().min(0).max(6)),
  notification_enabled: z.boolean().optional(),
  connect_projectflow: z.boolean().optional(),
  pf_user_id: z.string().optional(),
});

/**
 * Validate request with schema
 * @param {Object} schema - Zod schema
 * @param {Object} data - Data to validate
 * @returns {Object} Validated data or throw error
 */
export function validate(schema, data) {
  return schema.parse(data);
}

/**
 * Validate request with schema (safe version)
 * @param {Object} schema - Zod schema
 * @param {Object} data - Data to validate
 * @returns {Object} { success, data, error }
 */
export function validateSafe(schema, data) {
  const result = schema.safeParse(data);
  return {
    success: result.success,
    data: result.data,
    error: result.error,
  };
}

export default {
  createTaskSchema,
  updateTaskSchema,
  updateSettingsSchema,
  createHabitSchema,
  updateHabitSchema,
  oauthCallbackSchema,
  listTasksQuerySchema,
  updateProgressSchema,
  updatePrioritySchema,
  calendarEventQuerySchema,
  rescheduleSchema,
  onboardingSchema,
  validate,
  validateSafe,
};
