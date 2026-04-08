import 'reflect-metadata';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { clerkAuthService } from '../auth/clerk-auth-service.js';
import { billingService } from '../billing/billing-service.js';
import { webhookHandler } from '../billing/webhook-handler.js';
import { usageMeter } from '../billing/usage-meter.js';
import { logAIRequest, logError, logEvent } from '../monitoring/better-stack-logger.js';
import { requireAuth, requireAdmin, enforceUsageLimit, type AuthRequest } from '../auth/middleware.js';
import { monitoring } from '../system/monitoring.js';
import { posthog } from '../analytics/posthog-client.js';
import { sentry } from '../analytics/sentry-client.js';

const app = express();
const sentryDsn = process.env.SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0)
  });
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function extractAiProvider(req: Request): string | undefined {
  const body = req.body as Record<string, unknown> | undefined;
  const provider = body?.provider ?? body?.aiProvider;
  return typeof provider === 'string' ? provider : undefined;
}

function extractUserId(req: Request): string | undefined {
  const requestWithUser = req as Request & { ultraDexUserId?: string };
  if (typeof requestWithUser.ultraDexUserId === 'string' && requestWithUser.ultraDexUserId.length > 0) {
    return requestWithUser.ultraDexUserId;
  }

  const headerUserId = req.headers['x-user-id'];
  if (typeof headerUserId === 'string' && headerUserId.trim().length > 0) {
    return headerUserId;
  }

  const body = req.body as Record<string, unknown> | undefined;
  return typeof body?.userId === 'string' ? body.userId : undefined;
}

function attachUserId(req: Request, userId: string): void {
  const requestWithUser = req as Request & { ultraDexUserId?: string };
  requestWithUser.ultraDexUserId = userId;
}

function captureExceptionWithContext(error: unknown, req: Request, context: Record<string, unknown> = {}): void {
  if (!sentryDsn) {
    return;
  }

  const normalizedError = normalizeError(error);
  const userId = extractUserId(req);
  const aiProvider = extractAiProvider(req);

  Sentry.withScope((scope) => {
    scope.setTag('path', req.path);
    if (aiProvider) scope.setTag('ai_provider', aiProvider);
    if (userId) scope.setUser({ id: userId });

    scope.setContext('request', {
      method: req.method,
      path: req.path
    });

    if (Object.keys(context).length > 0) {
      scope.setContext('context', context);
    }

    Sentry.captureException(normalizedError);
  });
}

app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  if (typeof signature !== 'string') {
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }

  if (!Buffer.isBuffer(req.body)) {
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }

  try {
    const event = webhookHandler.verifyWebhook(req.body, signature);
    await webhookHandler.handleEvent(event);
    res.json({ received: true });
  } catch (error) {
    captureExceptionWithContext(error, req);
    logError('Stripe webhook processing failed', error, { path: req.path });
    res.status(400).json({ error: 'Webhook signature verification failed' });
  }
});

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const latency = Date.now() - startTime;
    const userId = extractUserId(req);
    
    // Track in monitoring service
    monitoring.trackRequest(latency);
    if (res.statusCode >= 400) {
      monitoring.trackError();
    }
    
    // Track in PostHog
    posthog.track('http_request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      latency
    }, userId);
    
    // Log to Better Stack
    logEvent('request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      latency,
      userId
    });
  });

  next();
});

// Health endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '3.0.0', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.get('/health/ready', (req, res) => {
  res.json({
    status: 'ready',
    checks: { server: 'pass', memory: process.memoryUsage().heapUsed < 500 * 1024 * 1024 ? 'pass' : 'warn' },
    timestamp: new Date().toISOString()
  });
});

app.get('/health/deep', (req, res) => {
  res.json({
    status: 'ok',
    checks: {
      server: 'pass',
      memory: process.memoryUsage().heapUsed < 500 * 1024 * 1024 ? 'pass' : 'warn',
      stripe: Boolean(process.env.STRIPE_SECRET_KEY) ? 'configured' : 'missing',
      clerk: Boolean(process.env.CLERK_SECRET_KEY) ? 'configured' : 'missing',
      betterStack: Boolean(process.env.BETTER_STACK_SOURCE_TOKEN) ? 'configured' : 'missing'
    },
    timestamp: new Date().toISOString()
  });
});

// API status
app.get('/api/status', (req, res) => {
  res.json({
    name: 'Ultra-Dex',
    version: '3.0.0',
    status: 'operational',
    features: ['ai_providers', 'agent_orchestration', 'memory_system', 'mcp_ecosystem', 'user_authentication', 'billing']
  });
});

// Metrics endpoint (admin only)
app.get('/metrics', requireAdmin, (req, res) => {
  const metrics = monitoring.getMetrics();
  res.json(metrics);
});

// Auth endpoints (public - no middleware)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const { user, token } = await clerkAuthService.register(email, password, name);
    
    // Create free subscription
    await billingService.createSubscription(user.id, 'free', 'cus_test');
    
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, tier: user.tier, apiKey: user.apiKey },
      session: { token, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    });
  } catch (error) {
    captureExceptionWithContext(error, req);
    logError('User registration endpoint failed', error, { path: req.path });
    res.status(400).json({ error: String(error) });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }
    const loginResult = await clerkAuthService.login(email, password);
    const user = loginResult.user;
    const token = loginResult.token;
    
    if (!token) {
      return res.status(500).json({ error: 'Token generation failed' });
    }
    
    res.json({
      user: { id: user.id, email: user.email, name: user.name, tier: user.tier, apiKey: user.apiKey },
      session: { token, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    });
  } catch (error) {
    captureExceptionWithContext(error, req);
    logError('User login endpoint failed', error, { path: req.path });
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/apikey', requireAuth(), async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const apiKey = await clerkAuthService.rotateApiKey(authReq.auth!.userId);
    res.json({ apiKey });
  } catch (error) {
    captureExceptionWithContext(error, req);
    logError('API key rotation failed', error, { path: req.path });
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

app.get('/api/user/profile', requireAuth(), async (req, res) => {
  const authReq = req as AuthRequest;
  const userId = authReq.auth!.userId;
  
  // Get user data from Clerk
  const user = await clerkAuthService.validateSession(req.headers.authorization!.replace('Bearer ', ''));
  if (!user) return res.status(401).json({ error: 'Invalid session' });
  
  attachUserId(req, user.id);
  
  // Get subscription
  const subscription = await billingService.getSubscription(userId);
  
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    tier: user.tier,
    apiKey: user.apiKey,
    usage: user.usage,
    preferences: user.preferences,
    subscription: subscription ? {
      tierId: subscription.tierId,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd
    } : null
  });
});

// Billing endpoints
app.get('/api/billing/pricing', (req, res) => {
  res.json(billingService.getPricingTiers());
});

app.post('/api/billing/checkout', requireAuth(), async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const { tierId } = req.body as { tierId?: string };
    if (!tierId) {
      return res.status(400).json({ error: 'Missing tierId' });
    }

    const baseUrl = process.env.ULTRA_DEX_WEB_URL || 'https://ultra-dex.onrender.com';
    const successUrl = `${baseUrl}/billing?success=true`;
    const cancelUrl = `${baseUrl}/billing?canceled=true`;
    const email = authReq.auth!.email || 'unknown@ultra-dex.com';

    const session = await billingService.createCheckoutSession(
      authReq.auth!.userId,
      tierId,
      email,
      email,
      successUrl,
      cancelUrl
    );

    res.json(session);
  } catch (error) {
    captureExceptionWithContext(error, req);
    logError('Checkout session creation failed', error, { path: req.path });
    res.status(400).json({ error: String(error) });
  }
});

app.post('/api/billing/portal', requireAuth(), async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const baseUrl = process.env.ULTRA_DEX_WEB_URL || 'https://ultra-dex.onrender.com';
    const session = await billingService.createPortalSession(authReq.auth!.userId, `${baseUrl}/billing`);
    res.json(session);
  } catch (error) {
    captureExceptionWithContext(error, req);
    logError('Portal session creation failed', error, { path: req.path });
    res.status(400).json({ error: String(error) });
  }
});

app.get('/api/billing/invoices', requireAuth(), async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const invoices = await billingService.listInvoices(authReq.auth!.userId);
    res.json(invoices);
  } catch (error) {
    captureExceptionWithContext(error, req);
    logError('Invoice retrieval failed', error, { path: req.path });
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

app.post('/api/billing/subscribe', requireAuth(), async (req, res) => {
  const authReq = req as AuthRequest;
  const userId = authReq.auth!.userId;
  
  attachUserId(req, userId);
  
  const { tierId } = req.body;
  if (!tierId) return res.status(400).json({ error: 'Missing tierId' });
  
  try {
    const subscription = await billingService.createSubscription(userId, tierId, 'cus_test');
    res.json({ subscription });
  } catch (error) {
    captureExceptionWithContext(error, req, { userId, tierId });
    logError('Subscription creation failed', error, { userId, tierId });
    res.status(400).json({ error: String(error) });
  }
});

app.get('/api/billing/usage', requireAuth(), async (req, res) => {
  const authReq = req as AuthRequest;
  const userId = authReq.auth!.userId;
  
  attachUserId(req, userId);

  const usage = usageMeter.getUsage(userId);
  const monthlyUsage = await billingService.getCurrentMonthUsage(userId);
  const subscription = await billingService.getSubscription(userId);

  res.json({
    requests: usage.requestCount,
    tokens: usage.tokenCount,
    agents: usage.agentRunCount,
    resetAt: usage.resetAt,
    tier: monthlyUsage.tier,
    withinLimits: monthlyUsage.withinLimits,
    subscription: subscription
      ? {
          currentPeriodEnd: subscription.currentPeriodEnd,
          status: subscription.status
        }
      : null
  });
});

app.post('/api/billing/cancel', requireAuth(), async (req, res) => {
  const authReq = req as AuthRequest;
  const userId = authReq.auth!.userId;

  attachUserId(req, userId);

  await billingService.cancelSubscription(userId);
  res.json({ status: 'canceled' });
});

// Static dashboard
app.use(express.static('apps/dashboard/dist'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  logEvent('server_started', {
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    features: ['better_stack', 'clerk_auth', 'stripe_billing']
  });
});

export default app;

// Sprint 6: Marketplace endpoints
app.get('/api/marketplace/plugins', requireAuth(), async (req, res) => {
  const { marketplace } = await import('../marketplace/plugin-marketplace.js');
  const plugins = await marketplace.searchPlugins();
  res.json(plugins);
});

// Phase 7: Autonomous agent endpoints
app.post('/api/agents/autonomous/goal', requireAuth(), enforceUsageLimit(), async (req, res) => {
  const { autonomousAgent } = await import('../agents/autonomous-agent.js');
  const { description } = req.body;
  const result = await autonomousAgent.setGoal(description);
  res.json({ result });
});

// Phase 8: Multi-modal endpoints
app.post('/api/multimodal/process', requireAuth(), enforceUsageLimit(), async (req, res) => {
  const startTime = Date.now();
  const authReq = req as AuthRequest;
  const userId = authReq.auth?.userId;

  try {
    const { multimodalService } = await import('../multimodal/multimodal-service.js');
    const result = await multimodalService.process(req.body);
    const body = req.body as Record<string, unknown>;
    const provider = typeof body.provider === 'string' ? body.provider : 'unknown';
    const model = typeof body.model === 'string' ? body.model : 'unknown';
    const tokens = typeof body.tokens === 'number' ? body.tokens : 0;
    const cost = typeof body.cost === 'number' ? body.cost : 0;
    const latency = Date.now() - startTime;

    // Expose tokens to the enforceUsageLimit middleware via response header
    res.setHeader('x-tokens-used', tokens);

    logAIRequest({
      userId,
      provider,
      model,
      tokens,
      cost,
      latency,
      metadata: {
        path: req.path
      }
    });

    res.json({ result });
  } catch (error) {
    captureExceptionWithContext(error, req);
    logError('Multimodal processing failed', error, { path: req.path });
    res.status(500).json({ error: 'Failed to process multimodal request' });
  }
});

app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  monitoring.trackError();
  captureExceptionWithContext(error, req);
  sentry.captureException(error, { path: req.path });
  logError('Unhandled server error', error, { path: req.path });
  res.status(500).json({ error: 'Internal server error' });
});

process.on('uncaughtException', (error) => {
  monitoring.trackError();
  sentry.captureException(error);
  Sentry.captureException(normalizeError(error));
  logError('Uncaught exception', error);
});

process.on('unhandledRejection', (reason) => {
  monitoring.trackError();
  sentry.captureException(reason);
  Sentry.captureException(normalizeError(reason));
  logError('Unhandled rejection', reason);
});

// Graceful shutdown - flush analytics
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, flushing analytics...');
  await Promise.all([
    posthog.flush(),
    sentry.flush()
  ]);
  process.exit(0);
});
