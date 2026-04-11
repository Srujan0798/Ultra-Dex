/**
 * @fileoverview Auth Middleware module
 * @module snippets/auth-middleware
 */

export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    // verifyToken function needs to be implemented based on your JWT library (e.g., jsonwebtoken)
    // Example: const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const decoded = verifyToken(token); // eslint-disable-line no-undef
    req.user = decoded;
    next();
  } catch (_error) {
    res.status(403).json({ error: 'Forbidden' });
  }
}
