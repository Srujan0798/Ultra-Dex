// Copyright (c) 2026 Ultra-Dex

/**
 * Session Persistence with Vector Store
 * Stores agent decisions and context for long-term memory
 */

import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { createHash } from 'crypto';

class SessionPersistence {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.dbPath = join(projectRoot, '.ultra', 'memory', 'sessions.db');
    this.db = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    // Ensure directory exists
    const dbDir = join(this.projectRoot, '.ultra', 'memory');
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }

    // Open database
    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database,
    });

    // Create tables
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS decisions (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        agent TEXT NOT NULL,
        task TEXT NOT NULL,
        decision TEXT NOT NULL,
        context TEXT,
        embedding TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );

      CREATE TABLE IF NOT EXISTS memory_index (
        id TEXT PRIMARY KEY,
        decision_id TEXT NOT NULL,
        keyword TEXT NOT NULL,
        score REAL DEFAULT 1.0,
        FOREIGN KEY (decision_id) REFERENCES decisions(id)
      );

      CREATE INDEX IF NOT EXISTS idx_decisions_session ON decisions(session_id);
      CREATE INDEX IF NOT EXISTS idx_decisions_agent ON decisions(agent);
      CREATE INDEX IF NOT EXISTS idx_decisions_created ON decisions(created_at);
      CREATE INDEX IF NOT EXISTS idx_memory_keyword ON memory_index(keyword);
    `);

    this.initialized = true;
    logger.log('[SessionPersistence] Database initialized at', this.dbPath);
  }

  async createSession(name, metadata = {}) {
    await this.init();

    const id = this.generateId();
    await this.db.run('INSERT INTO sessions (id, name, metadata) VALUES (?, ?, ?)', [
      id,
      name,
      JSON.stringify(metadata),
    ]);

    return { id, name, metadata };
  }

  async saveDecision(sessionId, agent, task, decision, context = {}) {
    await this.init();

    const id = this.generateId();
    const embedding = this.generateSimpleEmbedding(decision + ' ' + task);

    await this.db.run(
      'INSERT INTO decisions (id, session_id, agent, task, decision, context, embedding) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, sessionId, agent, task, decision, JSON.stringify(context), JSON.stringify(embedding)]
    );

    // Index keywords for search
    const keywords = this.extractKeywords(decision + ' ' + task);
    if (keywords.length > 0) {
      const placeholders = keywords.map(() => '(?, ?, ?)').join(', ');
      const values = [];
      for (const keyword of keywords) {
        values.push(this.generateId(), id, keyword);
      }
      await this.db.run(`INSERT INTO memory_index (id, decision_id, keyword) VALUES ${placeholders}`, values);
    }

    return id;
  }

  async searchDecisions(query, limit = 10) {
    await this.init();

    const keywords = this.extractKeywords(query);
    if (keywords.length === 0) return [];

    // Search by keywords
    const placeholders = keywords.map(() => '?').join(',');
    const decisions = await this.db.all(
      `SELECT DISTINCT d.*, s.name as session_name
       FROM decisions d
       JOIN sessions s ON d.session_id = s.id
       JOIN memory_index mi ON d.id = mi.decision_id
       WHERE mi.keyword IN (${placeholders})
       ORDER BY d.created_at DESC
       LIMIT ?`,
      [...keywords, limit]
    );

    return decisions.map((d) => ({
      ...d,
      context: JSON.parse(d.context || '{}'),
      embedding: JSON.parse(d.embedding || '[]'),
    }));
  }

  async getRecentDecisions(sessionId, limit = 20) {
    await this.init();

    const decisions = await this.db.all(
      `SELECT d.*, s.name as session_name
       FROM decisions d
       JOIN sessions s ON d.session_id = s.id
       WHERE d.session_id = ?
       ORDER BY d.created_at DESC
       LIMIT ?`,
      [sessionId, limit]
    );

    return decisions.map((d) => ({
      ...d,
      context: JSON.parse(d.context || '{}'),
      embedding: JSON.parse(d.embedding || '[]'),
    }));
  }

  async getDecisionStats(sessionId) {
    await this.init();

    const stats = await this.db.get(
      `SELECT 
        COUNT(*) as total_decisions,
        COUNT(DISTINCT agent) as unique_agents,
        MIN(created_at) as first_decision,
        MAX(created_at) as last_decision
       FROM decisions
       WHERE session_id = ?`,
      [sessionId]
    );

    return stats;
  }

  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }

  generateId() {
    return createHash('sha256')
      .update(Date.now() + Math.random().toString())
      .digest('hex')
      .substring(0, 16);
  }

  extractKeywords(text) {
    // Simple keyword extraction
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'must',
      'shall',
      'can',
      'need',
      'dare',
      'ought',
      'used',
      'to',
      'of',
      'in',
      'for',
      'on',
      'with',
      'at',
      'by',
      'from',
      'as',
      'into',
      'through',
      'during',
      'before',
      'after',
      'above',
      'below',
      'between',
      'under',
      'again',
      'further',
      'then',
      'once',
      'here',
      'there',
      'when',
      'where',
      'why',
      'how',
      'all',
      'each',
      'few',
      'more',
      'most',
      'other',
      'some',
      'such',
      'no',
      'nor',
      'not',
      'only',
      'own',
      'same',
      'so',
      'than',
      'too',
      'very',
      'just',
      'and',
      'but',
      'if',
      'or',
      'because',
      'until',
      'while',
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word))
      .slice(0, 10);
  }

  generateSimpleEmbedding(text) {
    // Create a simple bag-of-words embedding
    // In production, you'd use a real embedding model like OpenAI's text-embedding-3-small
    const words = this.extractKeywords(text);
    const embedding = new Array(50).fill(0);

    words.forEach((word, _i) => {
      const hash = word.split('').reduce((acc, char) => {
        return acc + char.charCodeAt(0);
      }, 0);
      embedding[hash % 50] = 1;
    });

    return embedding;
  }
}

// Export singleton instance creator
export function createSessionPersistence(projectRoot) {
  return new SessionPersistence(projectRoot);
}

export default SessionPersistence;

/**
 * Safe execution wrapper with error handling for sessionPersistence
 * @param {Function} fn - Async function to execute
 * @param {string} [context='sessionPersistence'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'sessionPersistence') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
    return null;
  }
}
