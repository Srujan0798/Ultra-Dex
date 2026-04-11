var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { promisify } from 'util';
import { deflate, inflate } from 'zlib';
import { logger } from '../../utils/logging.js';
const deflateAsync = promisify(deflate);
const inflateAsync = promisify(inflate);
let MCPContextBusV2 = class {
  constructor(options = {}) {
    this.port = options.port || 3001;
    this.secret = options.secret || 'ultra-dex-secret-key';
    this.maxContextSize = options.maxContextSize || 10 * 1024 * 1024;
    this.encryptionEnabled = options.encryptionEnabled ?? true;
    this.compressionEnabled = options.compressionEnabled ?? true;
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
    this.contexts = /* @__PURE__ */ new Map();
    this.clients = /* @__PURE__ */ new Map();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
  }
  setupMiddleware() {
    this.app.use(helmet());
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1e3,
      max: 1e3,
    });
    this.app.use(limiter);
    if (this.compressionEnabled) this.app.use(compression());
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
  }
  setupRoutes() {
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: /* @__PURE__ */ new Date().toISOString(),
        clients: this.io.engine.clientsCount,
      });
    });
    this.app.get('/contexts/:projectId', async (req, res) => {
      const { projectId } = req.params;
      if (!this.contexts.has(projectId)) {
        return res.status(404).json({ error: 'Context not found' });
      }
      res.json(this.contexts.get(projectId));
    });
  }
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      socket.on('join', (projectId) => {
        socket.join(`project:${projectId}`);
        if (this.contexts.has(projectId)) {
          socket.emit('sync', this.contexts.get(projectId));
        }
      });
      socket.on('update', async (data) => {
        const { projectId, context } = data;
        this.contexts.set(projectId, {
          ...context,
          updatedAt: /* @__PURE__ */ new Date().toISOString(),
        });
        socket.to(`project:${projectId}`).emit('sync', context);
      });
    });
  }
  async start() {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        logger.log(`[MCP V2] Context Bus active on port ${this.port}`);
        resolve();
      });
    });
  }
};
MCPContextBusV2 = __decorateClass([singleton()], MCPContextBusV2);
export { MCPContextBusV2 };
