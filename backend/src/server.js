/**
 * Express server setup and initialization
 * Main entry point for TMC TimeIntel backend
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import config from './config/index.js';
import { pool, closePool } from './config/database.js';
import redis, { closeRedis } from './config/redis.js';
import { generalLimiter, standardLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import calendarRoutes from './routes/calendar.js';
import habitRoutes from './routes/habits.js';
import statsRoutes from './routes/stats.js';
import teamRoutes from './routes/team.js';
import settingsRoutes from './routes/settings.js';
import chatRoutes from './routes/chat.js';

const app = express();

/**
 * Security middleware
 */
app.use(helmet());

/**
 * CORS configuration
 */
app.use(cors({
  origin: ['https://timeintel.tmcltd.ai', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/**
 * Body parsing
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

/**
 * Global rate limiter
 */
app.use(generalLimiter);

/**
 * Request logging (development)
 */
if (config.DEBUG) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

/**
 * Server-Sent Events endpoint for real-time updates
 */
app.get('/api/events/stream', (req, res) => {
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial connection message
  res.write('data: {"event":"connected"}\n\n');

  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    res.end();
  });
});

/**
 * Mount route modules
 */
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/chat', chatRoutes);

/**
 * 404 handler (must be after all routes)
 */
app.use(notFoundHandler);

/**
 * Global error handler (must be last)
 */
app.use(errorHandler);

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  try {
    await closePool();
    await closeRedis();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  
  try {
    await closePool();
    await closeRedis();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

/**
 * Start server
 */
const server = app.listen(config.PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║           TMC TimeIntel Backend Server                   ║
║  AI-powered work intelligence platform for management   ║
╚══════════════════════════════════════════════════════════╝

✓ Server listening on port ${config.PORT}
✓ Environment: ${config.NODE_ENV}
✓ Database: ${config.CLOUD_SQL_CONNECTION}
✓ Redis: ${config.REDIS_HOST}:${config.REDIS_PORT}
✓ GCP Project: ${config.GCP_PROJECT_ID}

Ready to handle requests.
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

export default app;
