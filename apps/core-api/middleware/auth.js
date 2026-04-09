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

  jwt.verify(
    token,
    process.env.JWT_SECRET || 'default-secret-change-in-production',
    (err, user) => {
      if (err) {
        return res.status(403).json({
          error: 'Invalid or expired token',
          code: 'TOKEN_INVALID',
        });
      }

      req.user = user;
      next();
    }
  );
};
