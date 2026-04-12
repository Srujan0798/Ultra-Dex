// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Web IDE module with security hardening
 * @module ide/web-ide
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import fs from 'fs/promises';
import path from 'path';

// Whitelist of allowed commands for security
const ALLOWED_COMMANDS = ['npm', 'node', 'npx', 'git', 'eslint', 'prettier'];

// Maximum command length
const MAX_COMMAND_LENGTH = 500;

// Allowed file extensions for write operations
const ALLOWED_EXTENSIONS = [
  '.js',
  '.ts',
  '.jsx',
  '.tsx',
  '.json',
  '.md',
  '.css',
  '.html',
  '.txt',
  '.yml',
  '.yaml',
];

export class WebIDE {
  constructor(options = {}) {
    this.app = express();
    this.server = null;
    this.wss = null;
    this.projectDir = options.projectDir || process.cwd();
    this.port = options.port || 3006;
    this.commandRateLimiter = new Map(); // Track command execution rate
  }

  async initialize() {
    // Serve static files
    this.app.use(express.static(path.join(process.cwd(), 'cli/assets/ide')));
    this.app.use('/api', this.createAPIRoutes());

    this.server = this.app.listen(this.port, () => {
      console.log(`Web IDE running on http://localhost:${this.port}`);
    });

    // WebSocket server with security
    this.wss = new WebSocketServer({
      server: this.server,
      verifyClient: (info) => {
        // Only allow connections from localhost in development
        const remoteAddress = info.req.socket.remoteAddress;
        return (
          remoteAddress === '127.0.0.1' ||
          remoteAddress === '::1' ||
          remoteAddress === '::ffff:127.0.0.1'
        );
      },
    });

    this.wss.on('connection', (ws) => {
      // Rate limiting: max 10 commands per minute per connection
      let commandCount = 0;
      const rateLimitReset = setInterval(() => {
        commandCount = 0;
      }, 60000);

      ws.on('close', () => {
        clearInterval(rateLimitReset);
      });

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());

          // Validate message structure
          if (!data.type || typeof data.type !== 'string') {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
            return;
          }

          if (data.type === 'file-change') {
            await this.handleFileChange(ws, data);
          } else if (data.type === 'run-command') {
            if (commandCount >= 10) {
              ws.send(JSON.stringify({ type: 'error', message: 'Rate limit exceeded' }));
              return;
            }
            commandCount++;
            await this.handleCommand(ws, data);
          }
        } catch (e) {
          console.error('Failed to parse message', e);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
        }
      });
    });
  }

  /**
   * Handle file change with path validation
   */
  async handleFileChange(ws, data) {
    try {
      // Validate path
      if (!data.path || typeof data.path !== 'string') {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid path' }));
        return;
      }

      // Prevent path traversal
      const sanitizedPath = path.normalize(data.path).replace(/^(\.\.\/)+/, '');
      if (sanitizedPath.includes('..') || sanitizedPath.startsWith('/')) {
        ws.send(
          JSON.stringify({ type: 'error', message: 'Invalid path: directory traversal detected' })
        );
        return;
      }

      // Check file extension
      const ext = path.extname(sanitizedPath).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        ws.send(JSON.stringify({ type: 'error', message: `File type not allowed: ${ext}` }));
        return;
      }

      const filePath = path.join(this.projectDir, sanitizedPath);

      // Ensure file is within project directory
      if (!filePath.startsWith(this.projectDir)) {
        ws.send(JSON.stringify({ type: 'error', message: 'Path outside project directory' }));
        return;
      }

      await fs.writeFile(filePath, data.content);

      // Broadcast to other clients
      this.wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) {
          client.send(JSON.stringify({ type: 'file-updated', path: sanitizedPath }));
        }
      });
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: error.message }));
    }
  }

  /**
   * Handle command execution with strict validation
   */
  async handleCommand(ws, data) {
    try {
      // Validate command
      if (!data.command || typeof data.command !== 'string') {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid command' }));
        return;
      }

      // Check command length
      if (data.command.length > MAX_COMMAND_LENGTH) {
        ws.send(JSON.stringify({ type: 'error', message: 'Command too long' }));
        return;
      }

      // Parse command
      const commandParts = data.command.trim().split(/\s+/);
      const baseCommand = commandParts[0];

      // Check if command is in whitelist
      if (!ALLOWED_COMMANDS.includes(baseCommand)) {
        ws.send(JSON.stringify({ type: 'error', message: `Command not allowed: ${baseCommand}` }));
        return;
      }

      // Additional safety: block dangerous characters
      const dangerousChars = /[;&|`$(){}\[\]\\]/;
      if (dangerousChars.test(data.command)) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid characters in command' }));
        return;
      }

      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      // Execute with timeout
      const result = await execAsync(data.command, {
        cwd: this.projectDir,
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024, // 1MB output limit
      });

      ws.send(
        JSON.stringify({
          type: 'command-result',
          stdout: result.stdout,
          stderr: result.stderr,
        })
      );
    } catch (error) {
      ws.send(JSON.stringify({ type: 'command-error', error: error.message }));
    }
  }

  createAPIRoutes() {
    const router = express.Router();

    router.use(express.json({ limit: '1mb' }));

    // Health check
    router.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Get file content
    router.get('/files/*', async (req, res) => {
      try {
        const filePath = path.join(this.projectDir, req.params[0]);
        // Security: ensure path is within project
        if (!filePath.startsWith(this.projectDir)) {
          return res.status(403).json({ error: 'Access denied' });
        }
        const content = await fs.readFile(filePath, 'utf-8');
        res.json({ content });
      } catch (error) {
        res.status(404).json({ error: 'File not found' });
      }
    });

    return router;
  }

  async stop() {
    if (this.wss) {
      this.wss.close();
    }
    if (this.server) {
      this.server.close();
    }
  }
}

export default WebIDE;
