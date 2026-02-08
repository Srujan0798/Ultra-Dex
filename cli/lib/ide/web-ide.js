// File: cli/lib/ide/web-ide.js
import express from 'express';
import { Server } from 'socket.io';
import fs from 'fs/promises';
import path from 'path';

export class WebIDE {
  constructor(options = {}) {
    this.app = express();
    this.server = null;
    this.io = null;
    this.projectDir = options.projectDir || process.cwd();
    this.port = options.port || 3006;
  }

  async initialize() {
    // Serve static files
    this.app.use(express.static(path.join(process.cwd(), 'cli/assets/ide')));
    this.app.use('/api', this.createAPIRoutes());
    
    this.server = this.app.listen(this.port, () => {
      console.log(`Web IDE running on http://localhost:${this.port}`);
    });
    
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    this.setupSocketHandlers();
  }

  createAPIRoutes() {
    const router = express.Router();
    
    // File operations
    router.get('/files', async (req, res) => {
      try {
        const files = await this.getProjectFiles();
        res.json(files);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    router.get('/file/:path(*)', async (req, res) => {
      try {
        const filePath = path.join(this.projectDir, req.params.path);
        const content = await fs.readFile(filePath, 'utf8');
        res.json({ content });
      } catch (error) {
        res.status(404).json({ error: 'File not found' });
      }
    });

    router.post('/file/:path(*)', async (req, res) => {
      try {
        const filePath = path.join(this.projectDir, req.params.path);
        await fs.writeFile(filePath, req.body.content);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    return router;
  }

  async getProjectFiles(dir = this.projectDir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(this.projectDir, fullPath);
      
      if (entry.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
          files.push(...await this.getProjectFiles(fullPath));
        }
      } else {
        files.push({
          path: relPath,
          name: entry.name,
          size: (await fs.stat(fullPath)).size
        });
      }
    }
    
    return files;
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('IDE client connected');
      
      socket.on('file-change', async (data) => {
        try {
          await fs.writeFile(path.join(this.projectDir, data.path), data.content);
          socket.broadcast.emit('file-updated', data);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('run-command', async (data) => {
        try {
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execAsync = promisify(exec);
          
          const result = await execAsync(data.command, { cwd: this.projectDir });
          socket.emit('command-result', {
            stdout: result.stdout,
            stderr: result.stderr
          });
        } catch (error) {
          socket.emit('command-error', { error: error.message });
        }
      });
    });
  }
}