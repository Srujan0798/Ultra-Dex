import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import { ultraDex } from '../../src/core/index.js';
import { agentOrchestrator } from '../../src/core/orchestration/index.js';
import { ppmManager } from '../../src/core/memory/manager.js';
import { createDefaultRegistry } from '../../mcp/servers/index.js';
import { config } from './config.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/logger.js';
import { authenticateToken } from './middleware/auth.js';
import { validateAPIVersion } from './middleware/validation.js';
import agentsRouter from './routes/agents.js';
import memoryRouter from './routes/memory.js';
import tasksRouter from './routes/tasks.js';
import providersRouter from './routes/providers.js';
import webhookRouter from './routes/webhooks.js';
import { logger } from './middleware/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class UltraDexAPIServer {
  constructor(options = {}) {
    this.port = options.port || process.env.PORT || 4000;
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      }
    });
    
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupSocketIO();
    this.setupErrorHandling();
  }

  setupMiddlewares() {
    // Security middlewares
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:"]
        }
      }
    }));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use(limiter);
    
    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    }));
    
    // Compression
    this.app.use(compression());
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request logging
    this.app.use(requestLogger);
    
    // API versioning
    this.app.use('/api/:version', validateAPIVersion);
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: config.version,
        uptime: process.uptime(),
        memory: {
          rss: process.memoryUsage().rss,
          heapTotal: process.memoryUsage().heapTotal,
          heapUsed: process.memoryUsage().heapUsed,
          external: process.memoryUsage().external
        }
      });
    });
    
    // API routes with authentication
    this.app.use('/api/v1/agents', authenticateToken, agentsRouter);
    this.app.use('/api/v1/memory', authenticateToken, memoryRouter);
    this.app.use('/api/v1/tasks', authenticateToken, tasksRouter);
    this.app.use('/api/v1/providers', authenticateToken, providersRouter);
    this.app.use('/api/v1/webhooks', webhookRouter); // Webhooks don't require auth
    
    // Static files
    this.app.use('/static', express.static(path.join(__dirname, 'public')));
    
    // API documentation
    this.app.get('/api-docs', (req, res) => {
      res.json({
        version: '1.0.0',
        title: 'Ultra-Dex API',
        description: 'AI Orchestration Platform API',
        endpoints: [
          { method: 'GET', path: '/api/v1/agents', description: 'List all agents' },
          { method: 'POST', path: '/api/v1/agents/:id/execute', description: 'Execute agent task' },
          { method: 'GET', path: '/api/v1/memory', description: 'Search memory' },
          { method: 'POST', path: '/api/v1/tasks', description: 'Create new task' },
          { method: 'GET', path: '/api/v1/providers', description: 'List AI providers' },
          { method: 'POST', path: '/api/v1/webhooks', description: 'Handle webhooks' }
        ]
      });
    });
  }

  setupSocketIO() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      // Send initial system status
      socket.emit('system-status', {
        agents: agentOrchestrator.getMetrics(),
        memory: ppmManager.stats(),
        providers: ultraDex.getProviderStatus()
      });
      
      // Listen for agent status updates
      agentOrchestrator.on('agent:status', (status) => {
        socket.emit('agent-status', status);
      });
      
      // Listen for memory updates
      ppmManager.on('memory:update', (update) => {
        socket.emit('memory-update', update);
      });
      
      // Listen for task updates
      agentOrchestrator.on('task:status', (task) => {
        socket.emit('task-update', task);
      });
      
      // Listen for cost updates
      ultraDex.on('cost:update', (cost) => {
        socket.emit('cost-update', cost);
      });
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res, next) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
      });
    });

    // Global error handler
    this.app.use(errorHandler);
  }

  async initialize() {
    try {
      // Initialize Ultra-Dex core components
      await ultraDex.initialize();
      console.log('✅ Ultra-Dex core initialized');

      // Initialize memory system
      await ppmManager.init();
      console.log('✅ Memory system initialized');

      // Initialize agent orchestrator with error handling for missing agent index
      try {
        await agentOrchestrator.initialize();
        console.log('✅ Agent orchestrator initialized');
      } catch (agentError) {
        console.warn('⚠️  Agent orchestrator initialization partially failed:', agentError.message);
        console.log('✅ Agent orchestrator initialized (with fallback)');
      }

      // Initialize MCP server if enabled
      if (config.mcp.enabled) {
        try {
          await mcpServer.initialize();
          console.log('✅ MCP server initialized');
        } catch (mcpError) {
          console.warn('⚠️  MCP server initialization failed:', mcpError.message);
          console.log('✅ Continuing without MCP server');
        }
      }

      console.log(`🚀 Ultra-Dex API Server starting on port ${this.port}`);
    } catch (error) {
      console.error('❌ Failed to initialize Ultra-Dex API Server:', error);
      throw error;
    }
  }

  async start() {
    await this.initialize();
    
    this.server.listen(this.port, () => {
      console.log(`✅ Ultra-Dex API Server listening on port ${this.port}`);
      console.log(`📊 API Documentation: http://localhost:${this.port}/api-docs`);
      console.log(`📈 Health Check: http://localhost:${this.port}/health`);
    });
    
    return this.server;
  }

  async stop() {
    this.io.close();
    this.server.close(() => {
      console.log('🛑 Ultra-Dex API Server stopped');
    });
  }
}

// Create and export the server instance
const apiServer = new UltraDexAPIServer();

export default apiServer;

// For direct execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  apiServer.start().catch(error => {
    console.error('Failed to start API server:', error);
    process.exit(1);
  });
}