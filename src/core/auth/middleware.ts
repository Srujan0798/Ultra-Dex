import type { Request, Response, NextFunction } from 'express';
import { clerk } from './clerk-client.js';
import { clerkAuthService } from './clerk-auth-service.js';
import { logger } from '../monitoring/better-stack-logger.js';
import { usageMeter } from '../billing/usage-meter.js';
import { billingService } from '../billing/billing-service.js';

export interface AuthRequest extends Request {
  auth?: {
    userId: string;
    orgId?: string;
    email: string;
    role: string;
    plan: 'free' | 'pro' | 'enterprise';
  };
}

/**
 * Express middleware that requires authentication and optionally specific roles
 * @param roles - Optional array of required roles (e.g., ['admin', 'enterprise'])
 */
export function requireAuth(roles?: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      const apiKeyHeader = req.headers['x-api-key'];
      if ((!authHeader || !authHeader.startsWith('Bearer ')) && typeof apiKeyHeader === 'string') {
        const user = clerkAuthService.getUserByApiKey(apiKeyHeader);
        if (!user) {
          res.status(401).json({ error: 'Unauthorized: Invalid API key' });
          return;
        }

        (req as AuthRequest).auth = {
          userId: user.id,
          orgId: user.organizationId,
          email: user.email,
          role: 'user',
          plan: user.tier
        };

        next();
        return;
      }

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
        return;
      }

      const token = authHeader.replace('Bearer ', '');
      
      // Dev mode fallback - accept 'dev-token' when CLERK_SECRET_KEY is not set
      if (!process.env.CLERK_SECRET_KEY && token === 'dev-token') {
        (req as AuthRequest).auth = {
          userId: 'dev-user-id',
          orgId: 'dev-org-id',
          email: 'dev@ultra-dex.com',
          role: 'user',
          plan: 'free'
        };
        next();
        return;
      }

      // Validate token with Clerk
      try {
        const session = await clerk.sessions.getSession(token);
        
        if (session.status !== 'active') {
          res.status(401).json({ error: 'Unauthorized: Session is not active' });
          return;
        }

        // Get user details
        const user = await clerk.users.getUser(session.userId);
        
        const metadata = user.publicMetadata as Record<string, unknown>;
        const userRole = (metadata.role as string) || 'user';
        const userPlan = (metadata.tier as 'free' | 'pro' | 'enterprise') || 'free';
        const orgId = (metadata.organizationId as string) || session.organizationId;

        // Check role requirements
        if (roles && roles.length > 0 && !roles.includes(userRole)) {
          logger.warn('Access denied - insufficient permissions', {
            userId: user.id,
            requiredRoles: roles,
            userRole
          });
          res.status(403).json({ 
            error: 'Forbidden: Insufficient permissions',
            required: roles,
            current: userRole
          });
          return;
        }

        // Attach auth info to request
        (req as AuthRequest).auth = {
          userId: user.id,
          orgId,
          email: user.emailAddresses[0]?.emailAddress || '',
          role: userRole,
          plan: userPlan
        };

        next();
      } catch (clerkError) {
        logger.error('Clerk authentication failed', { error: String(clerkError), token: token.substring(0, 10) + '...' });
        res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
        return;
      }
    } catch (error) {
      logger.error('Auth middleware error', { error: String(error) });
      res.status(500).json({ error: 'Internal server error during authentication' });
      return;
    }
  };
}

/**
 * Middleware to require a specific organization context
 */
export function requireOrg() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthRequest;
    
    if (!authReq.auth?.orgId) {
      res.status(403).json({ 
        error: 'Forbidden: Organization context required',
        message: 'This endpoint must be called within an organization context'
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireAuth(['admin']);

/**
 * Middleware to require pro or enterprise plan
 */
export function requirePaidPlan() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthRequest;
    
    if (!authReq.auth) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    if (authReq.auth.plan === 'free') {
      res.status(403).json({ 
        error: 'Forbidden: Paid plan required',
        upgrade: 'This feature requires a Pro or Enterprise plan'
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to enforce daily usage limits for AI endpoints
 * - Checks usage before processing the request
 * - If within limits, attaches a finish handler to record usage (requests, tokens)
 */
export function enforceUsageLimit() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;

    if (!authReq.auth) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    const userId = authReq.auth.userId;
    const plan = authReq.auth.plan;

    try {
      const limit = usageMeter.checkLimit(userId, plan);
      if (!limit.allowed) {
        res.status(429).json({
          error: 'LIMIT_EXCEEDED',
          plan,
          remaining: 0,
          reason: limit.reason || 'Usage limit exceeded',
          resetAt: limit.resetAt instanceof Date ? limit.resetAt.toISOString() : new Date(limit.resetAt).toISOString()
        });
        return;
      }

      // After response finishes, record usage (reads tokens from x-tokens-used header)
      res.on('finish', () => {
        try {
          // Only count successful requests.
          if (res.statusCode >= 400) return;

          let tokens = 0;
          const header = res.getHeader('x-tokens-used');
          if (typeof header === 'string') tokens = parseInt(header, 10) || 0;
          else if (typeof header === 'number') tokens = header;

          // Update in-memory counters
          usageMeter.increment(userId, { requests: 1, tokens });

          // Record usage asynchronously in billing service
          billingService.recordUsage(userId, 1, tokens).catch((err) => {
            logger.error('Failed to record usage in billing service', { error: String(err), userId });
          });
        } catch (err) {
          logger.error('Failed to increment usage after response', { error: String(err), userId });
        }
      });

      next();
    } catch (err) {
      logger.error('Usage limit check failed', { error: String(err), userId });
      res.status(500).json({ error: 'Internal server error during usage check' });
    }
  };
}
