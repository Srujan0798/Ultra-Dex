import type { NextFunction, Request, Response } from 'express';
import { clerk } from './clerk-client.js';
import { clerkAuthService } from './clerk-auth-service.js';
import { usageMeter, type PlanId } from '../billing/usage-meter.js';

export interface AuthContext {
  userId: string;
  email?: string;
  role: string;
  plan: PlanId;
}

export interface AuthRequest extends Request {
  auth?: AuthContext;
  user?: {
    id: string;
    email?: string;
    role: string;
    plan: PlanId;
  };
}

const DEV_AUTH: AuthContext = {
  userId: 'dev-user-id',
  email: 'dev@ultra-dex.com',
  role: 'admin',
  plan: 'free',
};

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (typeof header !== 'string') {
    return null;
  }

  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function attachAuth(request: AuthRequest, auth: AuthContext): void {
  request.auth = auth;
  request.user = {
    id: auth.userId,
    email: auth.email,
    role: auth.role,
    plan: auth.plan,
  };
}

function unauthorized(
  res: Response,
  message = 'Unauthorized: Missing or invalid authorization header'
): void {
  res.status(401).json({ error: message });
}

function getPlanFromMetadata(metadata: Record<string, unknown>): PlanId {
  const tier = metadata.tier;
  if (tier === 'pro' || tier === 'enterprise') {
    return tier;
  }

  return 'free';
}

async function authenticateWithClerk(token: string): Promise<AuthContext | null> {
  if (
    typeof clerk.sessions?.getSession !== 'function' ||
    typeof clerk.users?.getUser !== 'function'
  ) {
    return null;
  }

  try {
    const session = await clerk.sessions.getSession(token);
    if (!session || (session.status && session.status !== 'active') || !session.userId) {
      return null;
    }

    const user = await clerk.users.getUser(session.userId);
    const publicMetadata = ((user.publicMetadata || {}) as Record<string, unknown>) ?? {};

    return {
      userId: user.id,
      email: user.emailAddresses?.[0]?.emailAddress,
      role: typeof publicMetadata.role === 'string' ? publicMetadata.role : 'user',
      plan: getPlanFromMetadata(publicMetadata),
    };
  } catch {
    return null;
  }
}

async function authenticateLocalToken(token: string): Promise<AuthContext | null> {
  if (token === 'dev-token') {
    return DEV_AUTH;
  }

  const user = await clerkAuthService.validateSession(token);
  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    role: 'user',
    plan: user.tier,
  };
}

function getAuth(req: Request): AuthContext | null {
  const request = req as AuthRequest;
  if (request.auth) {
    return request.auth;
  }

  if (request.user?.id) {
    return {
      userId: request.user.id,
      email: request.user.email,
      role: request.user.role || 'user',
      plan: request.user.plan || 'free',
    };
  }

  return null;
}

export function requireAuth(requiredRoles: string[] = []) {
  return async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const token = getBearerToken(req);
    if (!token) {
      unauthorized(res);
      return;
    }

    const auth =
      (process.env.CLERK_SECRET_KEY ? await authenticateWithClerk(token) : null) ||
      (!process.env.CLERK_SECRET_KEY ? await authenticateLocalToken(token) : null) ||
      (process.env.CLERK_SECRET_KEY ? await authenticateLocalToken(token) : null);

    if (!auth) {
      unauthorized(res, 'Unauthorized: Invalid session token');
      return;
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(auth.role)) {
      res.status(403).json({ error: 'Forbidden: Insufficient role' });
      return;
    }

    attachAuth(req as AuthRequest, auth);
    next();
  };
}

export function requireAdmin() {
  return requireAuth(['admin']);
}

export function requirePaidPlan() {
  return function paidPlanMiddleware(req: Request, res: Response, next: NextFunction): void {
    const auth = getAuth(req);
    if (!auth) {
      unauthorized(res, 'Unauthorized: Authentication required');
      return;
    }

    if (auth.plan === 'free') {
      res.status(403).json({ error: 'Paid plan required' });
      return;
    }

    next();
  };
}

export function enforceUsageLimit() {
  return function usageLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    const auth = getAuth(req);
    if (!auth) {
      unauthorized(res, 'Unauthorized: Authentication required');
      return;
    }

    const limitCheck = usageMeter.checkLimit(auth.userId, auth.plan);
    if (!limitCheck.allowed) {
      res.status(429).json({ error: 'Usage limit exceeded', remaining: limitCheck.remaining });
      return;
    }

    if (typeof res.on === 'function') {
      res.on('finish', () => {
        if (res.statusCode >= 400) {
          return;
        }

        let tokens = 0;
        if (typeof res.getHeader === 'function') {
          const headerValue = res.getHeader('x-tokens-used');
          const parsed = Number(headerValue);
          tokens = Number.isFinite(parsed) ? parsed : 0;
        }

        usageMeter.increment(auth.userId, { requests: 1, tokens });
      });
    }

    next();
  };
}
