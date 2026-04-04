/**
 * Google Chat webhook routes
 */

import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import * as ChatBot from '../services/chatBot.js';

const router = express.Router();

/**
 * POST /api/chat/webhook
 * Receive Google Chat bot messages
 */
router.post('/webhook', optionalAuth, async (req, res, next) => {
  try {
    const event = req.body;

    // Verify webhook token
    const token = req.headers['x-goog-iap-jwt-assertion'];
    // In production, would validate JWT token

    if (event.type === 'MESSAGE') {
      const response = await ChatBot.handleMessage(event);
      return res.status(200).json(response);
    }

    if (event.type === 'CARD_CLICKED') {
      const response = await ChatBot.handleCardAction(event);
      return res.status(200).json(response);
    }

    // Handle URL verification
    if (event.token === 'IFRAME_REQUEST_TOKEN') {
      return res.status(200).json({
        token: event.token,
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error handling chat webhook:', err.message);
    return res.status(200).json({
      text: 'I encountered an error processing your request.',
    });
  }
});

/**
 * POST /api/chat/card-action
 * Receive card button clicks
 */
router.post('/card-action', optionalAuth, async (req, res, next) => {
  try {
    const event = req.body;

    const response = await ChatBot.handleCardAction(event);
    return res.status(200).json(response);
  } catch (err) {
    console.error('Error handling card action:', err.message);
    return res.status(200).json({
      text: 'Error processing action.',
    });
  }
});

export default router;
