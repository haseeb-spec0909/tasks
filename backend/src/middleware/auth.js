/**
 * Firebase Authentication middleware
 * Verifies JWT tokens and validates user identity
 */

import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * Verify Firebase ID token and extract user info
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
export async function verifyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header',
      });
    }

    const token = authHeader.substring(7);

    // Verify JWT signature - FIREBASE_PRIVATE_KEY must be set
    if (!process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error('FIREBASE_PRIVATE_KEY is not configured');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.FIREBASE_PRIVATE_KEY, {
        algorithms: ['RS256', 'HS256'],
      });
    } catch (err) {
      throw err;
    }

    // Extract user identity
    const email = decoded.email || decoded.user_email;
    const googleId = decoded.sub || decoded.google_id;

    if (!email || !googleId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token missing required claims',
      });
    }

    // Verify email domain
    const domain = email.split('@')[1];
    if (domain !== config.ALLOWED_DOMAIN) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Email domain must be @${config.ALLOWED_DOMAIN}`,
      });
    }

    // Attach user to request
    req.user = {
      id: decoded.user_id || decoded.sub,
      google_id: googleId,
      email,
      name: decoded.name,
      picture: decoded.picture,
      token,
    };

    next();
  } catch (err) {
    console.error('Auth verification error:', err.message);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Failed to verify token',
    });
  }
}

/**
 * Require specific role(s) for endpoint access
 * @param {string|string[]} requiredRole - Role(s) required
 * @returns {Function} Middleware function
 */
export function requireRole(requiredRole) {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      // Check if user has required role
      // For now, simple check - can be expanded with database lookup
      const userRole = req.user.role || 'user';
      if (!roles.includes(userRole)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `This resource requires one of: ${roles.join(', ')}`,
        });
      }

      next();
    } catch (err) {
      console.error('Role check error:', err.message);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to check user role',
      });
    }
  };
}

/**
 * Optional auth middleware - doesn't require authentication but provides user if available
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.decode(token);
      
      if (decoded) {
        req.user = {
          id: decoded.user_id || decoded.sub,
          google_id: decoded.sub || decoded.google_id,
          email: decoded.email || decoded.user_email,
          name: decoded.name,
          picture: decoded.picture,
          token,
        };
      }
    }

    next();
  } catch (err) {
    // Silently continue on optional auth failure
    next();
  }
}

export { verifyAuth as default };
