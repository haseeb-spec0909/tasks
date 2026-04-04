/**
 * Helper utility functions
 */

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

/**
 * Parse duration string into minutes
 * Supports formats: "2h", "30m", "1h 30m", "90"
 * @param {string} str - Duration string
 * @returns {number} Duration in minutes
 */
export function parseDuration(str) {
  if (!str) return 0;

  let minutes = 0;

  // Match hours
  const hoursMatch = str.match(/(\d+)\s*h/i);
  if (hoursMatch) {
    minutes += parseInt(hoursMatch[1], 10) * 60;
  }

  // Match minutes
  const minutesMatch = str.match(/(\d+)\s*m(?!onth|ax)/i);
  if (minutesMatch) {
    minutes += parseInt(minutesMatch[1], 10);
  }

  // If no unit found, assume minutes
  if (!hoursMatch && !minutesMatch) {
    minutes = parseInt(str, 10) || 0;
  }

  return minutes;
}

/**
 * Format WBS path into readable format
 * "P001.W001.T005" -> "Project 001 > Workpackage 001 > Task 005"
 * @param {Object} meta - Task metadata
 * @returns {string} Formatted WBS path
 */
export function formatWbsPath(meta) {
  if (!meta || !meta.wbs_path) {
    return '';
  }

  const parts = meta.wbs_path.split('.');
  const formatted = parts.map(part => {
    const match = part.match(/([A-Z])(\d+)/);
    if (match) {
      const typeMap = {
        P: 'Project',
        W: 'Workpackage',
        T: 'Task',
      };
      const type = typeMap[match[1]] || 'Item';
      return `${type} ${match[2]}`;
    }
    return part;
  });

  return formatted.join(' > ');
}

/**
 * Calculate priority score (0-1) based on task properties
 * Higher score = higher priority
 * @param {Object} task - Task object
 * @returns {number} Priority score
 */
export function calculatePriority(task) {
  let score = 0;

  // Priority level (0-0.4)
  const priorityMap = {
    low: 0,
    medium: 0.2,
    high: 0.4,
  };
  score += priorityMap[task.priority] || 0;

  // Due date urgency (0-0.3)
  if (task.due_date) {
    const now = dayjs();
    const due = dayjs(task.due_date);
    const daysUntilDue = due.diff(now, 'days');

    if (daysUntilDue < 0) {
      score += 0.3; // Overdue
    } else if (daysUntilDue === 0) {
      score += 0.25; // Due today
    } else if (daysUntilDue <= 3) {
      score += 0.2; // Due within 3 days
    } else if (daysUntilDue <= 7) {
      score += 0.1; // Due within a week
    }
  }

  // Progress (0-0.15)
  if (task.progress_pct < 100) {
    score += 0.15;
  }

  // ProjectFlow tasks get boost (0-0.15)
  if (task.source === 'projectflow') {
    score += 0.15;
  }

  return Math.min(1, score);
}

/**
 * Check if time is within working hours
 * @param {string} time - ISO time string
 * @param {Object} settings - User settings with work_hours
 * @returns {boolean}
 */
export function isWithinWorkingHours(time, settings) {
  if (!time || !settings || !settings.work_hours) {
    return true;
  }

  const checkTime = dayjs(time);
  const dayOfWeek = checkTime.day();
  const hour = checkTime.hour();

  const { work_hours } = settings;

  // Check if day is working day
  if (!work_hours.days.includes(dayOfWeek)) {
    return false;
  }

  // Check if hour is within working hours
  if (work_hours.start < work_hours.end) {
    // Normal case: 9-17
    return hour >= work_hours.start && hour < work_hours.end;
  } else {
    // Wrapping case: 17-9 (not normal)
    return hour >= work_hours.start || hour < work_hours.end;
  }
}

/**
 * Get next working day after given date
 * @param {string} date - ISO date string
 * @param {Object} settings - User settings with work_hours
 * @returns {string} Next working day ISO date
 */
export function getNextWorkingDay(date, settings) {
  if (!settings || !settings.work_hours) {
    return dayjs(date).add(1, 'day').toISOString();
  }

  let current = dayjs(date).startOf('day').add(1, 'day');
  const maxIterations = 14; // Max 2 weeks forward
  let iterations = 0;

  while (iterations < maxIterations) {
    const dayOfWeek = current.day();
    if (settings.work_hours.days.includes(dayOfWeek)) {
      return current.toISOString();
    }
    current = current.add(1, 'day');
    iterations += 1;
  }

  return current.toISOString();
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export function formatDate(dateString) {
  if (!dateString) {
    return 'No date';
  }

  const date = dayjs(dateString);
  const now = dayjs();

  // Today
  if (date.isSame(now, 'day')) {
    return 'Today';
  }

  // Tomorrow
  if (date.isSame(now.add(1, 'day'), 'day')) {
    return 'Tomorrow';
  }

  // This week
  if (date.isSame(now, 'week') && date.isAfter(now)) {
    return date.format('dddd'); // Monday, Tuesday, etc.
  }

  // This year
  if (date.isSame(now, 'year')) {
    return date.format('MMM D'); // Jan 15
  }

  // Past
  if (date.isBefore(now)) {
    return date.format('MMM D, YYYY');
  }

  return date.format('MMM D, YYYY');
}

/**
 * Format time range
 * @param {string} startTime - ISO time string
 * @param {string} endTime - ISO time string
 * @returns {string} Formatted time range
 */
export function formatTimeRange(startTime, endTime) {
  const start = dayjs(startTime).format('h:mm A');
  const end = dayjs(endTime).format('h:mm A');
  return `${start} - ${end}`;
}

/**
 * Get business hours in a day (based on settings)
 * @param {Object} settings - User settings
 * @returns {number} Business hours
 */
export function getBusinessHours(settings) {
  if (!settings || !settings.work_hours) {
    return 8; // Default 8 hours
  }

  const { work_hours } = settings;
  if (work_hours.start < work_hours.end) {
    return work_hours.end - work_hours.start;
  }

  // Wrapping case
  return 24 - (work_hours.start - work_hours.end);
}

/**
 * Get available minutes in a day
 * @param {Object} settings - User settings
 * @returns {number} Available minutes
 */
export function getAvailableMinutes(settings) {
  return getBusinessHours(settings) * 60;
}

/**
 * Check if date is a working day
 * @param {string} date - ISO date string
 * @param {Object} settings - User settings
 * @returns {boolean}
 */
export function isWorkingDay(date, settings) {
  if (!settings || !settings.work_hours) {
    return true;
  }

  const dayOfWeek = dayjs(date).day();
  return settings.work_hours.days.includes(dayOfWeek);
}

export default {
  parseDuration,
  formatWbsPath,
  calculatePriority,
  isWithinWorkingHours,
  getNextWorkingDay,
  formatDate,
  formatTimeRange,
  getBusinessHours,
  getAvailableMinutes,
  isWorkingDay,
};
