// Copyright (c) 2026 Ultra-Dex

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { promisify } from 'util';
import { deflate, inflate } from 'zlib';
import { Logger } from '../utils/logger.js';

const _deflateAsync = promisify(deflate);
const _inflateAsync = promisify(inflate);
const logger = new Logger({ prefix: 'MCP' });

/**
 * MCP Context Bus V2
 * Advanced real-time context synchronization server
 */
export class MCPContextBusV2 {
  constructor(options = {}) {
    this.port = options.port || 3001;
    this.secret = options.secret || 'ultra-dex-secret-key';
    this.maxContextSize = options.maxContextSize || 10 * 1024 * 1024; // 10MB
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

    this.contexts = new Map();
    this.clients = new Map();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
  }

  setupMiddleware() {
    this.app.use(helmet());
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
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
        timestamp: new Date().toISOString(),
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
          updatedAt: new Date().toISOString(),
        });
        socket.to(`project:${projectId}`).emit('sync', context);
      });
    });
  }

  async start() {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        logger.info(`[MCP V2] Context Bus active on port ${this.port}`);
        resolve();
      });
    });
  }
}
