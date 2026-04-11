// Copyright (c) 2026 Ultra-Dex

// Ultra-Dex Kernel — Session Manager
// Manages conversational history and short-term memory for the Agent

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ContextCompactor } from '../context/compactor.js';

const DEFAULT_MAX_TOKENS = 200000;
const DEFAULT_THRESHOLD = 0.95;

export class SessionManager {
  constructor() {
    this.sessionId = uuidv4();
    this.history = [];
    this.projectRoot = process.cwd();
    this.sessionDir = path.join(this.projectRoot, '.ultra-dex', 'sessions');
    this.compactor = new ContextCompactor({
      maxTokens: Number.parseInt(process.env.ULTRA_DEX_CONTEXT_TOKENS || DEFAULT_MAX_TOKENS, 10),
      tokenThreshold: Number.parseFloat(
        process.env.ULTRA_DEX_CONTEXT_THRESHOLD || DEFAULT_THRESHOLD
      ),
    });
  }

  async initialize() {
    await fs.mkdir(this.sessionDir, { recursive: true });
  }

  /**
   * Add a user message to history
   */
  addUserMessage(content) {
    // Prevent memory leaks by limiting history size
    if (this.history.length > 1000) {
      // Keep only the most recent 500 messages
      this.history = this.history.slice(-500);
    }

    this.history.push({ role: 'user', content, timestamp: Date.now() });
    void this.compactHistory();
    this.save();
  }

  /**
   * Add an agent response to history
   */
  addAgentMessage(content) {
    // Prevent memory leaks by limiting history size
    if (this.history.length > 1000) {
      // Keep only the most recent 500 messages
      this.history = this.history.slice(-500);
    }

    this.history.push({ role: 'assistant', content, timestamp: Date.now() });
    void this.compactHistory();
    this.save();
  }

  /**
   * Get the recent conversation context for the LLM
   * @param {number} limit - Number of recent turns to return
   */
  getContext(limit = 10) {
    return this.history.slice(-limit);
  }

  /**
   * Persist session to disk
   */
  async save() {
    const filePath = path.join(this.sessionDir, `${this.sessionId}.json`);
    try {
      await fs.writeFile(filePath, JSON.stringify(this.history, null, 2));
    } catch (e) {
      // Silently fail if we can't save history (non-critical)
      // But log for debugging purposes
      process.stderr.write(`Session save error: ${e.message}\n`);
    }
  }

  /**
   * Clear current session history
   */
  clear() {
    this.history = [];
  }

  async compactHistory() {
    try {
      const result = await this.compactor.compact(this.history);
      if (result.compressed) {
        this.history = result.compressedContext;
      }
    } catch (_error) {
      // Compaction should never break session tracking
    }
  }
}

export const session = new SessionManager();
session.initialize();
