// Copyright (c) 2026 Ultra-Dex

/**
 * REPL Session Management
 * Handles saving, loading, and managing REPL sessions
 */

import fs from 'fs/promises';
import path from 'path';
import { homedir } from 'os';
import { printInfo, printSuccess, printError, printWarning } from '../utils/output.js';
import chalk from 'chalk';

export class SessionManager {
  constructor() {
    this.sessionsDir = path.join(homedir(), '.ultra-dex', 'sessions');
    this.currentSession = null;
    this.sessionHistory = [];
  }

  /**
   * Initialize session manager
   */
  async initialize() {
    try {
      await fs.mkdir(this.sessionsDir, { recursive: true });
    } catch (error) {
      printError(chalk.red(`❌ Failed to create sessions directory: ${error.message}`));
      throw error;
    }
  }

  /**
   * Create a new session
   */
  async createSession(name, data = {}) {
    const sessionId = `${name}_${Date.now()}`;
    const sessionPath = path.join(this.sessionsDir, `${sessionId}.json`);

    const sessionData = {
      id: sessionId,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: {
        ...data,
        history: data.history || [],
        context: data.context || {},
        variables: data.variables || {},
      },
    };

    try {
      await fs.writeFile(sessionPath, JSON.stringify(sessionData, null, 2));
      this.currentSession = sessionData;
      this.sessionHistory.push(sessionId);

      printSuccess(chalk.green(`✅ Created session: ${name}`));
      return sessionId;
    } catch (error) {
      printError(chalk.red(`❌ Failed to create session: ${error.message}`));
      throw error;
    }
  }

  /**
   * Load a session by name
   */
  async loadSession(name) {
    // Look for the most recent session with this name or exact match
    let sessionPath;

    // First, try exact match
    const exactPath = path.join(this.sessionsDir, `${name}.json`);
    try {
      await fs.access(exactPath);
      sessionPath = exactPath;
    } catch {
      // If exact match doesn't exist, try to find by name prefix
      const files = await fs.readdir(this.sessionsDir);
      const sessionFiles = files.filter((f) => f.endsWith('.json'));

      // Find the most recent session with the given name
      const matchingFiles = sessionFiles
        .filter((f) => f.startsWith(`${name}_`) || f === `${name}.json`)
        .sort((a, b) => {
          // Sort by timestamp in filename (assuming format name_timestamp.json)
          const timeA = parseInt(a.match(/\d+/)?.[0] || 0);
          const timeB = parseInt(b.match(/\d+/)?.[0] || 0);
          return timeB - timeA; // Descending order (most recent first)
        });

      if (matchingFiles.length > 0) {
        sessionPath = path.join(this.sessionsDir, matchingFiles[0]);
      }
    }

    if (!sessionPath) {
      throw new Error(`Session not found: ${name}`);
    }

    try {
      const sessionData = JSON.parse(await fs.readFile(sessionPath, 'utf8'));
      this.currentSession = sessionData;
      this.sessionHistory.push(sessionData.id);

      printSuccess(chalk.green(`✅ Loaded session: ${sessionData.name}`));
      printInfo(chalk.gray(`   Created: ${new Date(sessionData.createdAt).toLocaleString()}`));
      printInfo(chalk.gray(`   Updated: ${new Date(sessionData.updatedAt).toLocaleString()}`));

      return sessionData;
    } catch (error) {
      printError(chalk.red(`❌ Failed to load session: ${error.message}`));
      throw error;
    }
  }

  /**
   * Save current session
   */
  async saveCurrentSession() {
    if (!this.currentSession) {
      throw new Error('No active session to save');
    }

    this.currentSession.updatedAt = new Date().toISOString();

    const sessionPath = path.join(this.sessionsDir, `${this.currentSession.id}.json`);

    try {
      await fs.writeFile(sessionPath, JSON.stringify(this.currentSession, null, 2));
      printSuccess(chalk.green(`✅ Session saved: ${this.currentSession.name}`));
      return this.currentSession.id;
    } catch (error) {
      printError(chalk.red(`❌ Failed to save session: ${error.message}`));
      throw error;
    }
  }

  /**
   * List all available sessions
   */
  async listSessions() {
    try {
      const files = await fs.readdir(this.sessionsDir);
      const sessionFiles = files.filter((f) => f.endsWith('.json'));

      if (sessionFiles.length === 0) {
        printInfo(chalk.gray('No saved sessions'));
        return [];
      }

      // Parse session info from filenames and content
      const sessions = [];

      for (const file of sessionFiles) {
        const filePath = path.join(this.sessionsDir, file);
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const session = JSON.parse(content);

          sessions.push({
            id: session.id,
            name: session.name,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            path: filePath,
          });
        } catch (error) {
          // Skip corrupted session files
          printWarning(chalk.yellow(`⚠️  Skipping corrupted session file: ${file}`));
        }
      }

      // Sort by most recently updated
      sessions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      printInfo(chalk.cyan.bold('\n💾 Available Sessions:\n'));

      for (const session of sessions) {
        const isActive = this.currentSession?.id === session.id;
        const status = isActive ? chalk.green('●') : chalk.gray('○');
        const name = isActive ? chalk.bold(session.name) : session.name;

        printInfo(
          `${status} ${name} ` +
            chalk.gray(
              `- Updated: ${new Date(session.updatedAt).toLocaleDateString()} ` +
                `(${Math.floor((Date.now() - new Date(session.updatedAt)) / (1000 * 60 * 60))}h ago)`
            )
        );
      }

      return sessions;
    } catch (error) {
      printError(chalk.red(`❌ Failed to list sessions: ${error.message}`));
      return [];
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(name) {
    try {
      const files = await fs.readdir(this.sessionsDir);
      const sessionFiles = files.filter((f) => f.endsWith('.json'));

      // Find session file by name
      let sessionFile = null;
      for (const file of sessionFiles) {
        if (file.startsWith(`${name}_`) || file === `${name}.json`) {
          sessionFile = file;
          break;
        }
      }

      if (!sessionFile) {
        throw new Error(`Session not found: ${name}`);
      }

      const sessionPath = path.join(this.sessionsDir, sessionFile);
      await fs.unlink(sessionPath);

      // If this was the current session, clear it
      if (this.currentSession?.id === sessionFile.replace('.json', '')) {
        this.currentSession = null;
      }

      printSuccess(chalk.green(`✅ Deleted session: ${name}`));
    } catch (error) {
      if (error.message.includes('not found')) {
        printError(chalk.red(`❌ Session not found: ${name}`));
      } else {
        printError(chalk.red(`❌ Failed to delete session: ${error.message}`));
      }
      throw error;
    }
  }

  /**
   * Get current session data
   */
  getCurrentSession() {
    return this.currentSession;
  }

  /**
   * Update current session data
   */
  updateSessionData(newData) {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    this.currentSession.data = {
      ...this.currentSession.data,
      ...newData,
    };
    this.currentSession.updatedAt = new Date().toISOString();
  }

  /**
   * Clear current session
   */
  clearSession() {
    this.currentSession = null;
  }

  /**
   * Get session directory path
   */
  getSessionsDir() {
    return this.sessionsDir;
  }
}

export default SessionManager;
