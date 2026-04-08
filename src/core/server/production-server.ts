import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authService } from '../auth/auth-service.js';
import { billingService } from '../billing/billing-service.js';
import { getTierById } from '../billing/pricing-tiers.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
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

// API status
app.get('/api/status', (req, res) => {
  res.json({
    name: 'Ultra-Dex',
    version: '3.0.0',
    status: 'operational',
    features: ['ai_providers', 'agent_orchestration', 'memory_system', 'mcp_ecosystem', 'user_authentication', 'billing']
  });
});

// Auth endpoints (previous)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const { user, session } = await authService.register(email, password, name);
    
    // Create free subscription
    await billingService.createSubscription(user.id, 'free', 'cus_test');
    
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, tier: user.tier, apiKey: user.apiKey },
      session: { token: session.token, expiresAt: session.expiresAt }
    });
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }
    const { user, session } = await authService.login(email, password);
    res.json({
      user: { id: user.id, email: user.email, name: user.name, tier: user.tier, apiKey: user.apiKey },
      session: { token: session.token, expiresAt: session.expiresAt }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/user/profile', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  const user = await authService.validateSession(token);
  if (!user) return res.status(401).json({ error: 'Invalid session' });
  
  // Get subscription
  const subscription = await billingService.getSubscription(user.id);
  
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

app.post('/api/billing/subscribe', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  const user = await authService.validateSession(token);
  if (!user) return res.status(401).json({ error: 'Invalid session' });
  
  const { tierId } = req.body;
  if (!tierId) return res.status(400).json({ error: 'Missing tierId' });
  
  try {
    const subscription = await billingService.createSubscription(user.id, tierId, 'cus_test');
    res.json({ subscription });
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.get('/api/billing/usage', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  const user = await authService.validateSession(token);
  if (!user) return res.status(401).json({ error: 'Invalid session' });
  
  const usage = await billingService.getCurrentMonthUsage(user.id);
  res.json(usage);
});

app.post('/api/billing/cancel', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  const user = await authService.validateSession(token);
  if (!user) return res.status(401).json({ error: 'Invalid session' });
  
  await billingService.cancelSubscription(user.id);
  res.json({ status: 'canceled' });
});

// Static dashboard
app.use(express.static('apps/dashboard/dist'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Ultra-Dex v3.0.0 + Billing on port ${PORT}`);
});

export default app;
