/**
 * Calendar routes
 */

import express from 'express';
import { verifyAuth, optionalAuth } from '../middleware/auth.js';
import { standardLimiter } from '../middleware/rateLimiter.js';
import * as GoogleCalendar from '../services/googleCalendar.js';
import { validateSafe } from '../utils/validators.js';
import { calendarEventQuerySchema, rescheduleSchema } from '../utils/validators.js';

const router = express.Router();

/**
 * GET /api/calendar/events
 * Get calendar events for date range
 */
router.get('/events', verifyAuth, standardLimiter, async (req, res, next) => {
  try {
    const validation = validateSafe(calendarEventQuerySchema, req.query);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid query parameters',
        details: validation.error?.errors,
      });
    }

    const { timeMin, timeMax } = validation.data;
    const syncToken = req.query.syncToken || null;

    // Initialize client with user's tokens
    // In production, retrieve stored tokens from database
    const client = GoogleCalendar.initClient({
      access_token: req.user.token,
      refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
    });

    const result = await GoogleCalendar.getEvents(client, timeMin, timeMax, syncToken);

    return res.status(200).json({
      events: result.events,
      syncToken: result.nextSyncToken,
      nextPageToken: result.nextPageToken,
    });
  } catch (err) {
    if (err.message.includes('401') || err.message.includes('invalid_grant')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Calendar access token expired. Please re-authenticate.',
      });
    }
    next(err);
  }
});

/**
 * POST /api/calendar/webhook
 * Receive Google Calendar push notifications
 */
router.post('/webhook', optionalAuth, async (req, res, next) => {
  try {
    const { resourceId, resourceState, expiration } = req.headers;
    const { channelId } = req.body;

    // Verify webhook token
    const token = req.headers['x-goog-channel-token'];
    if (token !== process.env.CALENDAR_WEBHOOK_TOKEN) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid webhook token',
      });
    }

    // Log notification received
    console.log('Calendar webhook received:', {
      resourceId,
      resourceState,
      expiration,
    });

    // In production, would trigger sync for affected user
    // resourceId is linked to user in database

    return res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/calendar/free-busy
 * Get free/busy information
 */
router.get('/free-busy', verifyAuth, standardLimiter, async (req, res, next) => {
  try {
    const { timeMin, timeMax } = req.query;

    if (!timeMin || !timeMax) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'timeMin and timeMax are required',
      });
    }

    // Initialize client
    const client = GoogleCalendar.initClient({
      access_token: req.user.token,
    });

    const freeBusy = await GoogleCalendar.getFreeBusy(
      client,
      timeMin,
      timeMax,
      ['primary']
    );

    return res.status(200).json({
      calendar: freeBusy.primary || {},
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/calendar/reschedule
 * Trigger AI reschedule for a task
 */
router.post('/reschedule', verifyAuth, standardLimiter, async (req, res, next) => {
  try {
    const validation = validateSafe(rescheduleSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid reschedule data',
        details: validation.error?.errors,
      });
    }

    const { taskId, newDate, newTime } = validation.data;

    // In production, would trigger scheduling engine
    return res.status(200).json({
      message: 'Reschedule initiated',
      taskId,
      newDate,
      newTime,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/calendar/pause
 * Pause/resume AI scheduling
 */
router.put('/pause', verifyAuth, standardLimiter, async (req, res, next) => {
  try {
    const { pause } = req.body;

    if (typeof pause !== 'boolean') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'pause must be a boolean',
      });
    }

    // In production, update user scheduling preference
    return res.status(200).json({
      message: pause ? 'Scheduling paused' : 'Scheduling resumed',
      paused: pause,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
