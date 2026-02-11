// Copyright (c) 2026 Ultra-Dex

/**
 * Enterprise Authentication Middleware
 * Express middleware for auth, RBAC, rate limiting, and audit logging
 */

import { hasPermission } from '../../auth/rbac.js';
import { rateLimiter } from './rate-limit.js';
import { auditLogger } from '../../auth/audit.js';
import { apiKeyManager } from '../../auth/api-keys.js';

/**
 * Authentication middleware
 * Validates JWT tokens or API keys
 */
export function authMiddleware(options = {}) {
  return async (req, res, next) => {
    try {
      // Check for API key
      const apiKey =
        req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

      if (apiKey) {
        const validation = apiKeyManager.validateKey(apiKey);

        if (validation.valid) {
          // Check rate limit
          const rateCheck = apiKeyManager.checkRateLimit(validation.keyId);
          if (!rateCheck.allowed) {
            res.status(429).json({ error: 'Rate limit exceeded' });
            return;
          }

          req.user = {
            id: validation.keyId,
            name: validation.name,
            type: 'api_key',
            permissions: validation.permissions,
          };

          next();
          return;
        }
      }

      // Check for JWT token
      const token = req.headers['authorization']?.replace('Bearer ', '');

      if (!token && !options.optional) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // For now, basic token validation
      // In production, verify JWT properly
      if (token) {
        req.user = {
          id: 'user_id',
          role: 'member',
          type: 'jwt',
        };
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Authentication error' });
    }
  };
}

/**
 * Authorization middleware
 * Checks if user has required permission
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userRole = req.user.role || 'viewer';

    if (!hasPermission(userRole, permission)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Required permission: ${permission}`,
      });
      return;
    }

    next();
  };
}

/**
 * Role middleware
 * Checks if user has required role
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userRole = req.user.role || 'viewer';

    if (!roles.includes(userRole)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Required role: ${roles.join(' or ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Combined enterprise middleware
 * Applies auth, rate limiting, and audit logging
 */
export function enterpriseMiddleware(options = {}) {
  const {
    requireAuth = true,
    permission = null,
    rateLimit = true,
    audit = true,
    rateLimitOptions = {},
  } = options;

  return [
    // Authentication
    ...(requireAuth ? [authMiddleware({ optional: !requireAuth })] : []),

    // Rate limiting
    ...(rateLimit ? [createRateLimitMiddleware(rateLimitOptions)] : []),

    // Authorization
    ...(permission ? [requirePermission(permission)] : []),

    // Audit logging
    ...(audit ? [createAuditMiddleware()] : []),
  ];
}

/**
 * Create rate limit middleware
 */
function createRateLimitMiddleware(options) {
  return async (req, res, next) => {
    const key = req.user?.id || req.ip || 'anonymous';
    const result = await rateLimiter.check(key);

    res.setHeader('X-RateLimit-Limit', result.limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);

    if (!result.allowed) {
      res.status(429).json({
        error: 'Too Many Requests',
        retryAfter: result.retryAfter,
      });
      return;
    }

    next();
  };
}

/**
 * Create audit middleware
 */
function createAuditMiddleware() {
  return (req, res, next) => {
    const startTime = Date.now();
    const originalEnd = res.end;

    res.end = function (...args) {
      const duration = Date.now() - startTime;

      auditLogger.log({
        type: 'http_request',
        method: req.method,
        resource: req.originalUrl,
        resourceType: 'endpoint',
        user: req.user?.name || req.user?.id,
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        status: res.statusCode >= 400 ? 'error' : 'success',
        details: {
          statusCode: res.statusCode,
          params: req.params,
          query: req.query,
        },
        duration,
      });

      originalEnd.apply(this, args);
    };

    next();
  };
}

export default {
  authMiddleware,
  requirePermission,
  requireRole,
  enterpriseMiddleware,
};
