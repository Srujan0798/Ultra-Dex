import jwt from 'jsonwebtoken';

/**
 * Authentication middleware for API routes
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      code: 'TOKEN_REQUIRED',
    });
  }

  // SECURITY: JWT_SECRET must be set in production
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        error: 'Server configuration error',
        code: 'CONFIG_ERROR',
      });
    }
    // Development only - log warning
    console.warn('WARNING: JWT_SECRET not set, using insecure default');
  }

  jwt.verify(token, jwtSecret || 'development-only-insecure-secret', (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID',
      });
    }

    req.user = user;
    next();
  });
};
