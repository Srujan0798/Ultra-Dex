import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authService } from '../auth/auth-service.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/health/ready', async (req, res) => {
  res.json({
    status: 'ready',
    checks: {
      server: 'pass',
      memory: process.memoryUsage().heapUsed < 500 * 1024 * 1024 ? 'pass' : 'warn'
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/health/deep', async (req, res) => {
  const checks = {
    system: { status: 'pass', latencyMs: 0 },
    memory: { 
      status: process.memoryUsage().heapUsed < 512 * 1024 * 1024 ? 'pass' : 'warn',
      latencyMs: 0
    }
  };
  
  res.json({
    status: 'healthy',
    checks,
    timestamp: new Date().toISOString()
  });
});

// API status
app.get('/api/status', (req, res) => {
  res.json({
    name: 'Ultra-Dex',
    version: '3.0.0',
    status: 'operational',
    features: [
      'ai_providers',
      'agent_orchestration',
      'memory_system',
      'mcp_ecosystem',
      'distributed_mesh',
      'user_authentication'
    ]
  });
});

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const { user, session } = await authService.register(email, password, name);
    
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        apiKey: user.apiKey
      },
      session: {
        token: session.token,
        expiresAt: session.expiresAt
      }
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
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        apiKey: user.apiKey
      },
      session: {
        token: session.token,
        expiresAt: session.expiresAt
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    await authService.logout(token);
  }
  res.json({ status: 'logged_out' });
});

app.get('/api/user/profile', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const user = await authService.validateSession(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    tier: user.tier,
    apiKey: user.apiKey,
    usage: user.usage,
    preferences: user.preferences
  });
});

// Analytics endpoint
app.post('/api/analytics/event', async (req, res) => {
  const { event, properties } = req.body;
  
  // Log analytics event
  console.log('[Analytics]', {
    event,
    properties,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });
  
  res.json({ status: 'recorded' });
});

app.get('/api/analytics/dashboard', async (req, res) => {
  // Return analytics summary
  res.json({
    totalUsers: 0,
    activeUsers: 0,
    totalRequests: 0,
    averageResponseTime: 0
  });
});

// Static dashboard
app.use(express.static('apps/dashboard/dist'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Ultra-Dex v3.0.0 on port ${PORT}`);
});

export default app;
