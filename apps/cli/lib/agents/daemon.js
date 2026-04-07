// Copyright (c) 2026 Ultra-Dex

/**
 * Agent Daemon System
 * Runs agents in the background with persistent state
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import chalk from 'chalk';
import { AppError } from '../utils/errors.js';

// Directory for daemon processes
const DAEMON_DIR = path.join(os.homedir(), '.ultra-dex', 'daemons');
const DAEMON_LOG_DIR = path.join(DAEMON_DIR, 'logs');

export class AgentDaemon {
  constructor() {
    this.daemons = new Map();
    this.events = new EventEmitter();
    this.heartbeatInterval = null;
    this.initialized = false;
  }

  /**
   * Initialize the daemon system
   */
  async initialize() {
    if (this.initialized) return;

    try {
      await fs.mkdir(DAEMON_DIR, { recursive: true });
      await fs.mkdir(DAEMON_LOG_DIR, { recursive: true });

      this.initialized = true;
      printInfo(chalk.cyan('🔄 Initializing Agent Daemon System...'));

      // Start heartbeat monitor
      this.startHeartbeatMonitor();

      printSuccess(chalk.green('✅ Agent Daemon System Initialized'));
    } catch (error) {
      printError(chalk.red(`❌ Failed to initialize daemon system: ${error.message}`));
      throw error;
    }
  }

  /**
   * Start a daemon process for an agent
   */
  async startDaemon(sessionId, task, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Check if daemon already exists
    if (this.daemons.has(sessionId)) {
      printWarning(chalk.yellow(`⚠️  Daemon already running for session: ${sessionId}`));
      return this.daemons.get(sessionId);
    }

    try {
      // Create daemon process
      const daemonProcess = spawn(
        process.execPath,
        [
          path.join(process.cwd(), 'bin', 'ultra-dex.js'),
          'run',
          task,
          '--session-id',
          sessionId,
          ...(options.parallel ? ['--parallel'] : []),
          ...(options.verbose ? ['--verbose'] : []),
        ],
        {
          detached: true,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: { ...process.env, ULTRA_DEX_DAEMON: 'true' },
        }
      );

      // Set up logging
      const logPath = path.join(DAEMON_LOG_DIR, `${sessionId}.log`);
      const logStream = fs.createWriteStream(logPath, { flags: 'a' });

      daemonProcess.stdout.pipe(logStream, { end: false });
      daemonProcess.stderr.pipe(logStream, { end: false });

      // Create daemon info
      const daemonInfo = {
        id: sessionId,
        process: daemonProcess,
        logPath,
        startedAt: new Date().toISOString(),
        status: 'running',
        task,
        options,
        lastHeartbeat: new Date().toISOString(),
        pid: daemonProcess.pid,
      };

      // Store daemon
      this.daemons.set(sessionId, daemonInfo);

      // Handle process exit
      daemonProcess.on('exit', (code, signal) => {
        daemonInfo.status = 'stopped';
        daemonInfo.stoppedAt = new Date().toISOString();
        daemonInfo.exitCode = code;
        daemonInfo.exitSignal = signal;

        printInfo(chalk.gray(`⏹️  Daemon ${sessionId} exited (code: ${code}, signal: ${signal})`));

        // Emit event
        this.events.emit('daemon:exit', { sessionId, code, signal });
      });

      // Handle process error
      daemonProcess.on('error', (error) => {
        printError(chalk.red(`❌ Daemon ${sessionId} error: ${error.message}`));
        this.events.emit('daemon:error', { sessionId, error });
      });

      printSuccess(chalk.green(`🚀 Started daemon for session: ${sessionId}`));

      return daemonInfo;
    } catch (error) {
      printError(chalk.red(`❌ Failed to start daemon: ${error.message}`));
      throw new AppError(`Failed to start daemon: ${error.message}`, {
        code: 'DAEMON_START_FAILED',
      });
    }
  }

  /**
   * Stop a daemon process
   */
  async stopDaemon(sessionId) {
    if (!this.initialized) {
      await this.initialize();
    }

    const daemon = this.daemons.get(sessionId);
    if (!daemon) {
      throw new AppError(`Daemon not found: ${sessionId}`, { code: 'DAEMON_NOT_FOUND' });
    }

    try {
      // Kill the process
      process.kill(daemon.pid, 'SIGTERM');

      // Wait a bit for graceful shutdown
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Force kill if still running
      try {
        process.kill(daemon.pid, 'SIGKILL');
      } catch (_error) {
        // Process already terminated
      }

      daemon.status = 'stopped';
      daemon.stoppedAt = new Date().toISOString();

      printSuccess(chalk.red(`⏹️  Stopped daemon: ${sessionId}`));

      // Remove from active daemons
      this.daemons.delete(sessionId);

      return daemon;
    } catch (error) {
      printError(chalk.red(`❌ Failed to stop daemon: ${error.message}`));
      throw new AppError(`Failed to stop daemon: ${error.message}`, {
        code: 'DAEMON_STOP_FAILED',
      });
    }
  }

  /**
   * Get daemon status
   */
  getDaemonStatus(sessionId) {
    if (!this.initialized) {
      throw new AppError('Daemon system not initialized', {
        code: 'DAEMON_SYSTEM_NOT_INITIALIZED',
      });
    }

    const daemon = this.daemons.get(sessionId);
    if (!daemon) {
      return { id: sessionId, status: 'not_found' };
    }

    // Check if process is still alive
    try {
      process.kill(daemon.pid, 0); // Check if process exists
      daemon.status = 'running';
    } catch {
      daemon.status = 'stopped';
    }

    return {
      id: daemon.id,
      status: daemon.status,
      pid: daemon.pid,
      startedAt: daemon.startedAt,
      task: daemon.task,
      lastHeartbeat: daemon.lastHeartbeat,
    };
  }

  /**
   * Get all daemon statuses
   */
  getAllDaemonStatuses() {
    if (!this.initialized) {
      throw new AppError('Daemon system not initialized', {
        code: 'DAEMON_SYSTEM_NOT_INITIALIZED',
      });
    }

    const statuses = [];

    for (const [sessionId, daemon] of this.daemons) {
      statuses.push(this.getDaemonStatus(sessionId));
    }

    return statuses;
  }

  /**
   * Start heartbeat monitoring
   */
  startHeartbeatMonitor() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      for (const [sessionId, daemon] of this.daemons) {
        try {
          // Check if process is still alive
          process.kill(daemon.pid, 0);
          daemon.lastHeartbeat = new Date().toISOString();
        } catch (error) {
          // Process died unexpectedly
          daemon.status = 'stopped';
          printWarning(chalk.yellow(`⚠️  Daemon ${sessionId} died unexpectedly`));
          this.events.emit('daemon:died', { sessionId, error });

          // Remove from active daemons
          this.daemons.delete(sessionId);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Restart a daemon
   */
  async restartDaemon(sessionId) {
    if (!this.initialized) {
      await this.initialize();
    }

    const daemon = this.daemons.get(sessionId);
    if (!daemon) {
      throw new AppError(`Daemon not found: ${sessionId}`, { code: 'DAEMON_NOT_FOUND' });
    }

    // Stop current daemon
    await this.stopDaemon(sessionId);

    // Wait a bit before restarting
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Start new daemon with same parameters
    return await this.startDaemon(sessionId, daemon.task, daemon.options);
  }

  /**
   * List all running daemons
   */
  listDaemons() {
    if (!this.initialized) {
      throw new AppError('Daemon system not initialized', {
        code: 'DAEMON_SYSTEM_NOT_INITIALIZED',
      });
    }

    const daemonList = [];

    for (const [sessionId, daemon] of this.daemons) {
      daemonList.push({
        id: sessionId,
        status: daemon.status,
        pid: daemon.pid,
        task: daemon.task,
        startedAt: daemon.startedAt,
        lastHeartbeat: daemon.lastHeartbeat,
      });
    }

    return daemonList;
  }

  /**
   * Get daemon logs
   */
  async getDaemonLogs(sessionId, lines = 50) {
    if (!this.initialized) {
      await this.initialize();
    }

    const daemon = this.daemons.get(sessionId);
    if (!daemon) {
      throw new AppError(`Daemon not found: ${sessionId}`, { code: 'DAEMON_NOT_FOUND' });
    }

    try {
      const logContent = await fs.readFile(daemon.logPath, 'utf8');
      const logLines = logContent.split('\n');

      // Return last N lines
      const recentLines = logLines.slice(-lines);

      return recentLines.join('\n');
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new AppError(`Log file not found: ${daemon.logPath}`, {
          code: 'LOG_FILE_NOT_FOUND',
        });
      }
      throw new AppError(`Failed to read logs: ${error.message}`, {
        code: 'LOG_READ_FAILED',
      });
    }
  }

  /**
   * Cleanup method
   */
  async cleanup() {
    // Stop all daemons
    for (const [sessionId, daemon] of this.daemons) {
      try {
        await this.stopDaemon(sessionId);
      } catch (error) {
        printWarning(chalk.yellow(`⚠️  Failed to stop daemon ${sessionId}: ${error.message}`));
      }
    }

    // Clear heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    printInfo(chalk.blue('🧹 Daemon system cleaned up'));
  }

  /**
   * Subscribe to daemon events
   */
  on(event, listener) {
    this.events.on(event, listener);
  }

  /**
   * Unsubscribe from daemon events
   */
  off(event, listener) {
    this.events.off(event, listener);
  }
}

// Create singleton instance
export const agentDaemon = new AgentDaemon();

// Handle process exit to clean up daemons
process.on('exit', () => {
  agentDaemon.cleanup().catch((error) => {
    printError(chalk.red(`❌ Error cleaning up daemons: ${error.message}`));
  });
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  printInfo(chalk.yellow('\n⚠️  Shutting down daemon system...'));
  await agentDaemon.cleanup();
  process.exit(0);
});

// Handle SIGTERM
process.on('SIGTERM', async () => {
  printInfo(chalk.yellow('⚠️  Received SIGTERM, shutting down daemon system...'));
  await agentDaemon.cleanup();
  process.exit(0);
});

export default agentDaemon;
