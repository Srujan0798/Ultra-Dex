import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

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
      'distributed_mesh'
    ]
  });
});

// Static dashboard
app.use(express.static('apps/dashboard/dist'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Ultra-Dex v3.0.0 on port ${PORT}`);
});

export default app;
