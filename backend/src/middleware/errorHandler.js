/**
 * Global error handling middleware
 * Logs errors to Cloud Logging and returns structured JSON responses
 */

import { Logging } from '@google-cloud/logging';
import config from '../config/index.js';

const logging = config.GCP_PROJECT_ID 
  ? new Logging({ projectId: config.GCP_PROJECT_ID })
  : null;

/**
 * Get severity level based on HTTP status code
 * @param {number} statusCode - HTTP status code
 * @returns {string} Cloud Logging severity
 */
function getSeverity(statusCode) {
  if (statusCode >= 500) return 'ERROR';
  if (statusCode >= 400) return 'WARNING';
  return 'INFO';
}

/**
 * Log error to Cloud Logging
 * @param {Error} err - Error object
 * @param {Object} context - Additional context
 */
async function logToCloud(err, context) {
  if (!logging) return;

  try {
    const log = logging.log('timeintel-backend');
    const severity = getSeverity(context.statusCode || 500);
    
    await log.write(
      log.entry(
        {
          severity,
          timestamp: new Date().toISOString(),
          labels: {
            environment: config.NODE_ENV,
            service: 'timeintel-api',
          },
        },
        {
          message: err.message,
          stack: err.stack,
          code: err.code,
          context,
        }
      )
    );
  } catch (logErr) {
    console.error('Failed to log to Cloud Logging:', logErr.message);
  }
}

/**
 * Format error for response
 * @param {Error} err - Error object
 * @returns {Object} Formatted error response
 */
function formatError(err) {
  // Zod validation errors
  if (err.name === 'ZodError') {
    return {
      statusCode: 400,
      error: 'Validation Error',
      message: 'Invalid request parameters',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    };
  }

  // Custom application errors
  if (err.statusCode) {
    return {
      statusCode: err.statusCode,
      error: err.error || 'Error',
      message: err.message,
      details: err.details || undefined,
    };
  }

  // Database errors
  if (err.code === 'ECONNREFUSED') {
    return {
      statusCode: 503,
      error: 'Service Unavailable',
      message: 'Database connection failed',
    };
  }

  // Rate limit errors
  if (err.message && err.message.includes('rate limit')) {
    return {
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
    };
  }

  // Default error
  return {
    statusCode: 500,
    error: 'Internal Server Error',
    message: config.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
  };
}

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next (required for error handlers)
 */
export async function errorHandler(err, req, res, next) {
  const errorInfo = formatError(err);
  const { statusCode, error, message, details } = errorInfo;

  // Log error
  const context = {
    statusCode,
    method: req.method,
    path: req.path,
    query: req.query,
    userId: req.user?.id,
    ip: req.ip,
  };

  await logToCloud(err, context);

  // Log to console in development
  if (config.DEBUG) {
    console.error('Error:', {
      ...context,
      message,
      stack: err.stack,
    });
  }

  // Return error response
  const response = {
    error,
    message,
  };

  if (details) {
    response.details = details;
  }

  // Include trace ID for production debugging
  if (config.NODE_ENV === 'production' && req.id) {
    response.traceId = req.id;
  }

  return res.status(statusCode).json(response);
}

/**
 * 404 Not Found handler
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export function notFoundHandler(req, res) {
  return res.status(404).json({
    error: 'Not Found',
    message: `Resource not found: ${req.method} ${req.path}`,
  });
}

export { errorHandler as default };
