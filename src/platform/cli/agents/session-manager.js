// Copyright (c) 2026 Ultra-Dex

/**
 * Agent Session Manager
 * Handles persistent agent sessions with checkpoint/resume capabilities
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { uuidv4 } from '../../../utils/uuid.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import chalk from '../../../utils/chalk.js';
import { AppError } from '../utils/errors.js';

// Session storage directory
const SESSION_DIR = path.join(os.homedir(), '.ultra-dex', 'sessions');

// Database file for session tracking
const SESSION_DB = path.join(SESSION_DIR, 'sessions.db');

// Maximum number of checkpoints to keep (full backups)
const MAX_FULL_CHECKPOINTS = 5;

// Interval for automatic checkpointing (in ms)
const CHECKPOINT_INTERVAL = 30000; // 30 seconds

export class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.checkpointTimers = new Map();
    this.daemonProcesses = new Map();
    this.queue = [];
    this.running = false;
  }

  /**
   * Initialize the session manager
   */
  async initialize() {
    // Create session directory if it doesn't exist
    await fs.mkdir(SESSION_DIR, { recursive: true });

    // Initialize database file if it doesn't exist
    if (!(await this.fileExists(SESSION_DB))) {
      await this.initializeDatabase();
    }

    printInfo(chalk.cyan('🔄 Initializing Agent Session Manager...'));

    // Load existing sessions
    await this.loadSessions();

    printSuccess(chalk.green('✅ Agent Session Manager Initialized'));
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Initialize the session database
   */
  async initializeDatabase() {
    // Create a simple JSON-based database structure
    const dbStructure = {
      sessions: [],
      checkpoints: [],
      createdAt: new Date().toISOString(),
    };

    await fs.writeFile(SESSION_DB, JSON.stringify(dbStructure, null, 2));
  }

  /**
   * Check if a file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load existing sessions from database
   */
  async loadSessions() {
    try {
      const dbContent = await fs.readFile(SESSION_DB, 'utf8');
      const db = JSON.parse(dbContent);

      for (const sessionData of db.sessions) {
        if (sessionData.status === 'running' || sessionData.status === 'paused') {
          this.sessions.set(sessionData.id, sessionData);
        }
      }

      printInfo(chalk.blue(`📋 Loaded ${this.sessions.size} active sessions`));
    } catch (error) {
      printWarning(chalk.yellow(`⚠️  Could not load sessions: ${error.message}`));
    }
  }

  /**
   * Create a new agent session
   */
  async createSession(task, options = {}) {
    await this.ensureInitialized();
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      name: options.name || `session-${Date.now()}`,
      task,
      status: 'running',
      agent: options.agent || 'default',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      checkpointCount: 0,
      error: null,
      priority: options.priority || 'p2', // p0, p1, p2, p3
      dependencies: options.dependencies || [],
      progress: 0,
      totalSteps: options.totalSteps || 10,
      currentStep: 0,
      state: {
        context: options.context || {},
        history: [],
        currentTask: task,
      },
    };

    // Save to database
    await this.saveSession(session);

    // Add to active sessions
    this.sessions.set(sessionId, session);

    // Start checkpoint timer
    this.startCheckpointTimer(sessionId);

    printSuccess(chalk.green(`✅ Created session: ${session.name} (${sessionId})`));

    return session;
  }

  /**
   * Save session to database
   */
  async saveSession(session) {
    try {
      let db;
      if (await this.fileExists(SESSION_DB)) {
        const dbContent = await fs.readFile(SESSION_DB, 'utf8');
        db = JSON.parse(dbContent);
      } else {
        db = { sessions: [], checkpoints: [], createdAt: new Date().toISOString() };
      }

      // Update or add session
      const existingIndex = db.sessions.findIndex((s) => s.id === session.id);
      if (existingIndex !== -1) {
        db.sessions[existingIndex] = session;
      } else {
        db.sessions.push(session);
      }

      await fs.writeFile(SESSION_DB, JSON.stringify(db, null, 2));
    } catch (error) {
      printError(chalk.red(`❌ Failed to save session: ${error.message}`));
    }
  }

  /**
   * Start checkpoint timer for a session
   */
  startCheckpointTimer(sessionId) {
    if (this.checkpointTimers.has(sessionId)) {
      clearInterval(this.checkpointTimers.get(sessionId));
    }

    const timer = setInterval(async () => {
      try {
        await this.createCheckpoint(sessionId);
      } catch (error) {
        printWarning(chalk.yellow(`⚠️  Checkpoint failed for ${sessionId}: ${error.message}`));
      }
    }, CHECKPOINT_INTERVAL);

    this.checkpointTimers.set(sessionId, timer);
  }

  /**
   * Create a checkpoint for a session
   */
  async createCheckpoint(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new AppError(`Session not found: ${sessionId}`, { code: 'SESSION_NOT_FOUND' });
    }

    const checkpoint = {
      id: uuidv4(),
      sessionId,
      step: session.currentStep,
      state: JSON.parse(JSON.stringify(session.state)), // Deep clone
      createdAt: new Date().toISOString(),
    };

    // Save checkpoint to database
    try {
      let db;
      if (await this.fileExists(SESSION_DB)) {
        const dbContent = await fs.readFile(SESSION_DB, 'utf8');
        db = JSON.parse(dbContent);
      } else {
        db = { sessions: [], checkpoints: [], createdAt: new Date().toISOString() };
      }

      // Add checkpoint
      db.checkpoints.push(checkpoint);

      // Keep only the last MAX_FULL_CHECKPOINTS full checkpoints, plus differential from the rest
      if (db.checkpoints.length > MAX_FULL_CHECKPOINTS * 2) {
        // Keep some buffer
        // For now, just keep the last MAX_FULL_CHECKPOINTS
        db.checkpoints = db.checkpoints.slice(-MAX_FULL_CHECKPOINTS);
      }

      await fs.writeFile(SESSION_DB, JSON.stringify(db, null, 2));

      // Update session checkpoint count
      session.checkpointCount++;
      session.updatedAt = new Date().toISOString();
      await this.saveSession(session);

      printInfo(chalk.blue(`📍 Checkpoint created for ${sessionId} (Step ${session.currentStep})`));
    } catch (error) {
      printError(chalk.red(`❌ Failed to create checkpoint: ${error.message}`));
      throw error;
    }
  }

  /**
   * Resume a session from the latest checkpoint
   */
  async resumeSession(sessionId) {
    await this.ensureInitialized();
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new AppError(`Session not found: ${sessionId}`, { code: 'SESSION_NOT_FOUND' });
    }

    // Load latest checkpoint
    try {
      const dbContent = await fs.readFile(SESSION_DB, 'utf8');
      const db = JSON.parse(dbContent);

      const checkpoints = db.checkpoints
        .filter((cp) => cp.sessionId === sessionId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (checkpoints.length > 0) {
        const latestCheckpoint = checkpoints[0];
        session.state = latestCheckpoint.state;
        session.currentStep = latestCheckpoint.step;
      }
    } catch (error) {
      printWarning(chalk.yellow(`⚠️  Could not load checkpoint: ${error.message}`));
    }

    session.status = 'running';
    session.updatedAt = new Date().toISOString();

    await this.saveSession(session);

    printSuccess(chalk.green(`✅ Resumed session: ${sessionId}`));

    return session;
  }

  /**
   * Pause a session
   */
  async pauseSession(sessionId) {
    await this.ensureInitialized();
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new AppError(`Session not found: ${sessionId}`, { code: 'SESSION_NOT_FOUND' });
    }

    session.status = 'paused';
    session.updatedAt = new Date().toISOString();

    await this.saveSession(session);

    // Clear checkpoint timer
    if (this.checkpointTimers.has(sessionId)) {
      clearInterval(this.checkpointTimers.get(sessionId));
      this.checkpointTimers.delete(sessionId);
    }

    printSuccess(chalk.yellow(`⏸️  Paused session: ${sessionId}`));

    return session;
  }

  /**
   * Stop a session
   */
  async stopSession(sessionId) {
    await this.ensureInitialized();
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new AppError(`Session not found: ${sessionId}`, { code: 'SESSION_NOT_FOUND' });
    }

    session.status = 'stopped';
    session.completedAt = new Date().toISOString();
    session.updatedAt = new Date().toISOString();

    await this.saveSession(session);

    // Clear checkpoint timer
    if (this.checkpointTimers.has(sessionId)) {
      clearInterval(this.checkpointTimers.get(sessionId));
      this.checkpointTimers.delete(sessionId);
    }

    // Remove from active sessions
    this.sessions.delete(sessionId);

    printSuccess(chalk.red(`⏹️  Stopped session: ${sessionId}`));

    return session;
  }

  /**
   * Complete a session
   */
  async completeSession(sessionId, result) {
    await this.ensureInitialized();
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new AppError(`Session not found: ${sessionId}`, { code: 'SESSION_NOT_FOUND' });
    }

    session.status = 'completed';
    session.completedAt = new Date().toISOString();
    session.updatedAt = new Date().toISOString();
    session.result = result;

    await this.saveSession(session);

    // Clear checkpoint timer
    if (this.checkpointTimers.has(sessionId)) {
      clearInterval(this.checkpointTimers.get(sessionId));
      this.checkpointTimers.delete(sessionId);
    }

    // Remove from active sessions
    this.sessions.delete(sessionId);

    printSuccess(chalk.green(`✅ Completed session: ${sessionId}`));

    return session;
  }

  /**
   * Fail a session
   */
  async failSession(sessionId, error) {
    await this.ensureInitialized();
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new AppError(`Session not found: ${sessionId}`, { code: 'SESSION_NOT_FOUND' });
    }

    session.status = 'failed';
    session.completedAt = new Date().toISOString();
    session.updatedAt = new Date().toISOString();
    session.error = error.message || error;

    await this.saveSession(session);

    // Clear checkpoint timer
    if (this.checkpointTimers.has(sessionId)) {
      clearInterval(this.checkpointTimers.get(sessionId));
      this.checkpointTimers.delete(sessionId);
    }

    // Remove from active sessions
    this.sessions.delete(sessionId);

    printError(chalk.red(`❌ Failed session: ${sessionId} - ${error.message || error}`));

    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions
   */
  getSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * Get sessions by status
   */
  getSessionsByStatus(status) {
    return this.getSessions().filter((session) => session.status === status);
  }

  /**
   * Update session progress
   */
  async updateSessionProgress(sessionId, progress, stepInfo) {
    await this.ensureInitialized();
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new AppError(`Session not found: ${sessionId}`, { code: 'SESSION_NOT_FOUND' });
    }

    session.progress = progress;
    session.currentStep = stepInfo?.step || session.currentStep + 1;
    session.updatedAt = new Date().toISOString();

    if (stepInfo) {
      session.state.history.push(stepInfo);
    }

    await this.saveSession(session);

    return session;
  }

  /**
   * Update session state
   */
  async updateSessionState(sessionId, newState) {
    await this.ensureInitialized();
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new AppError(`Session not found: ${sessionId}`, { code: 'SESSION_NOT_FOUND' });
    }

    session.state = { ...session.state, ...newState };
    session.updatedAt = new Date().toISOString();

    await this.saveSession(session);

    return session;
  }

  /**
   * List all sessions with details
   */
  async listSessions() {
    await this.ensureInitialized();
    const sessions = this.getSessions();

    if (sessions.length === 0) {
      printInfo(chalk.gray('No active sessions'));
      return [];
    }

    printInfo(chalk.cyan.bold('\n📋 Active Sessions:\n'));

    for (const session of sessions) {
      const statusColors = {
        running: chalk.green,
        paused: chalk.yellow,
        completed: chalk.blue,
        failed: chalk.red,
        stopped: chalk.gray,
      };

      const color = statusColors[session.status] || chalk.white;

      printInfo(`${color(`● ${session.name}`)} (${session.id})`);
      printInfo(chalk.gray(`  Status: ${session.status}`));
      printInfo(chalk.gray(`  Agent: ${session.agent}`));
      printInfo(
        chalk.gray(
          `  Progress: ${session.progress}% (${session.currentStep}/${session.totalSteps})`
        )
      );
      printInfo(chalk.gray(`  Started: ${new Date(session.startedAt).toLocaleTimeString()}`));
      printInfo(''); // Empty line
    }

    return sessions;
  }

  /**
   * Get session logs
   */
  async getSessionLogs(sessionId) {
    await this.ensureInitialized();
    const session = this.getSession(sessionId);
    if (!session) {
      throw new AppError(`Session not found: ${sessionId}`, { code: 'SESSION_NOT_FOUND' });
    }

    return session.state.history || [];
  }

  /**
   * Cleanup method
   */
  async cleanup() {
    await this.ensureInitialized();
    // Clear all timers
    for (const [sessionId, timer] of this.checkpointTimers) {
      clearInterval(timer);
    }
    this.checkpointTimers.clear();

    // Stop all daemon processes
    for (const [sessionId, process] of this.daemonProcesses) {
      if (process.kill) {
        process.kill();
      }
    }
    this.daemonProcesses.clear();
  }
}

// Create singleton instance
export const sessionManager = new SessionManager();

export default sessionManager;
