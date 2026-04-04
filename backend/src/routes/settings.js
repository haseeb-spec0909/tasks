/**
 * Settings routes
 */

import express from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { standardLimiter, projectflowSyncLimiter } from '../middleware/rateLimiter.js';
import * as UserModel from '../models/User.js';
import * as ProjectFlowSync from '../services/projectflowSync.js';
import * as SyncLogModel from '../models/SyncLog.js';
import { validateSafe } from '../utils/validators.js';
import { updateSettingsSchema, onboardingSchema } from '../utils/validators.js';

const router = express.Router();

/**
 * GET /api/settings
 * Get user settings
 */
router.get('/', verifyAuth, async (req, res, next) => {
  try {
    const settings = await UserModel.getSettings(req.user.id);

    return res.status(200).json({ settings });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/settings
 * Update user settings
 */
router.put('/', verifyAuth, standardLimiter, async (req, res, next) => {
  try {
    const validation = validateSafe(updateSettingsSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid settings data',
        details: validation.error?.errors,
      });
    }

    const updated = await UserModel.updateSettings(req.user.id, validation.data);

    return res.status(200).json({ settings: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/settings/pf-connection
 * ProjectFlow connection status
 */
router.get('/pf-connection', verifyAuth, async (req, res, next) => {
  try {
    const syncState = await SyncLogModel.getPfSyncState(req.user.id);
    const recentErrors = await SyncLogModel.getRecentErrors(req.user.id);

    return res.status(200).json({
      connection: {
        status: syncState?.connection_status || 'unknown',
        sync_enabled: syncState?.sync_enabled ?? true,
        last_inbound_sync: syncState?.last_inbound_sync,
        last_outbound_sync: syncState?.last_outbound_sync,
        last_sync_error: syncState?.last_sync_error,
        recent_errors: recentErrors.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/settings/pf-sync
 * Trigger manual ProjectFlow sync
 */
router.post('/pf-sync', verifyAuth, projectflowSyncLimiter, async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user || !user.pf_user_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'ProjectFlow not configured for this user',
      });
    }

    // Trigger inbound sync
    const result = await ProjectFlowSync.syncInbound(req.user.id, user.pf_user_id);

    return res.status(200).json({
      sync_result: {
        success: result.success,
        items_processed: result.itemsProcessed,
        items_failed: result.itemsFailed,
        items_skipped: result.itemsSkipped,
        duration_ms: result.duration,
      },
    });
  } catch (err) {
    if (err.message.includes('401') || err.message.includes('403')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'ProjectFlow authentication failed',
      });
    }
    next(err);
  }
});

/**
 * POST /api/settings/pf-connect
 * Connect/disconnect ProjectFlow
 */
router.post('/pf-connect', verifyAuth, standardLimiter, async (req, res, next) => {
  try {
    const { pfUserId, connect } = req.body;

    if (connect && !pfUserId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'pfUserId is required to connect',
      });
    }

    if (connect) {
      // Test connection
      const isHealthy = await ProjectFlowSync.healthCheck();
      if (!isHealthy) {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'ProjectFlow API is not responding',
        });
      }

      // Update user with PF ID
      await UserModel.update(req.user.id, { pf_user_id: pfUserId });

      // Initialize sync state
      await SyncLogModel.updatePfSyncState(req.user.id, {
        sync_enabled: true,
        connection_status: 'connected',
      });

      return res.status(200).json({
        message: 'ProjectFlow connected successfully',
        connection_status: 'connected',
      });
    } else {
      // Disconnect
      await UserModel.update(req.user.id, { pf_user_id: null });

      await SyncLogModel.updatePfSyncState(req.user.id, {
        sync_enabled: false,
        connection_status: 'disconnected',
      });

      return res.status(200).json({
        message: 'ProjectFlow disconnected',
        connection_status: 'disconnected',
      });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/settings/onboarding
 * Complete onboarding wizard
 */
router.post('/onboarding', verifyAuth, standardLimiter, async (req, res, next) => {
  try {
    const validation = validateSafe(onboardingSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid onboarding data',
        details: validation.error?.errors,
      });
    }

    const {
      timezone,
      work_hours_start,
      work_hours_end,
      work_days,
      notification_enabled,
      connect_projectflow,
      pf_user_id,
    } = validation.data;

    // Update settings
    const settingsData = {
      timezone,
      work_hours: {
        start: work_hours_start,
        end: work_hours_end,
        days: work_days,
      },
      notification_preferences: {
        enabled: notification_enabled ?? true,
        quiet_hours: { start: 18, end: 9 },
        channels: ['google_chat'],
      },
    };

    await UserModel.updateSettings(req.user.id, settingsData);

    // Connect ProjectFlow if requested
    if (connect_projectflow && pf_user_id) {
      await UserModel.update(req.user.id, { pf_user_id });

      await SyncLogModel.updatePfSyncState(req.user.id, {
        sync_enabled: true,
        connection_status: 'connected',
      });
    }

    return res.status(200).json({
      message: 'Onboarding completed successfully',
      settings: settingsData,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
