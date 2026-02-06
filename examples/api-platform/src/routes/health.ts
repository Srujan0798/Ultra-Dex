import { Router } from 'express';
import { config } from '../config';
import { logger } from '../utils/logger';

const router = Router();

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Liveness probe - for Kubernetes
router.get('/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe - for Kubernetes
router.get('/ready', async (req, res) => {
  const checks: Record<string, boolean> = {
    api: true,
  };

  let ready = true;

  // Check database connectivity
  try {
    // Add database check here when Prisma is set up
    checks.database = true;
  } catch (error) {
    checks.database = false;
    ready = false;
    logger.error('Database health check failed');
  }

  // Check Redis connectivity
  try {
    // Add Redis check here when Redis is set up
    checks.redis = true;
  } catch (error) {
    checks.redis = false;
    ready = false;
    logger.error('Redis health check failed');
  }

  const statusCode = ready ? 200 : 503;

  res.status(statusCode).json({
    ready,
    checks,
    timestamp: new Date().toISOString(),
  });
});

export { router as healthRouter };
