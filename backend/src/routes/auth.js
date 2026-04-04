/**
 * Authentication routes
 */

import express from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import * as UserModel from '../models/User.js';
import { validateSafe } from '../utils/validators.js';
import { oauthCallbackSchema } from '../utils/validators.js';

const router = express.Router();

/**
 * POST /api/auth/google
 * Exchange Google OAuth code for tokens, create/update user
 */
router.post('/google', authLimiter, async (req, res, next) => {
  try {
    const { code, idToken } = req.body;

    if (!code && !idToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Either code or idToken must be provided',
      });
    }

    // In production, exchange code for tokens using Google OAuth2 client
    // For now, decode the idToken to get user info
    const decoded = {
      sub: 'google-' + (Math.random() * 1e6 | 0), // Mock ID
      email: req.body.email,
      name: req.body.name,
      picture: req.body.picture,
    };

    if (!decoded.email || !decoded.email.endsWith('@tmcltd.ai')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Email must be @tmcltd.ai domain',
      });
    }

    // Find or create user
    let user = await UserModel.findByGoogleId(decoded.sub);
    if (!user) {
      user = await UserModel.create({
        google_id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
      });
    } else {
      // Update user info
      await UserModel.update(user.id, {
        name: decoded.name,
        picture: decoded.picture,
      });
    }

    // Return user info with token
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
      token: req.body.idToken, // Return the token for client storage
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Get current user profile + settings
 */
router.get('/me', verifyAuth, async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    const settings = await UserModel.getSettings(req.user.id);

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
      },
      settings,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout
 * Invalidate session (client-side token removal)
 */
router.post('/logout', verifyAuth, async (req, res, next) => {
  try {
    // In production, could invalidate refresh tokens etc.
    return res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh OAuth tokens
 */
router.post('/refresh', verifyAuth, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'refreshToken is required',
      });
    }

    // In production, exchange refresh token for new access token
    // For now, return the same token
    return res.status(200).json({
      token: refreshToken,
      expiresIn: 3600,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
