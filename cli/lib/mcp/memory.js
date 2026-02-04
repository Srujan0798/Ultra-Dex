import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import crypto from 'crypto';
import { AppError, ValidationError } from '../utils/errors.js';
import { logger } from '../ui/logger.js';

const MEMORY_DIR = '.ultra';
const MEMORY_FILE = 'memory.json';
const MEMORY_PATH = path.resolve(process.cwd(), MEMORY_DIR, MEMORY_FILE);

/**
 * Ultra-Dex Persistent Memory System
 * Stores facts, snippets, and context across sessions.
 */
export class UltraMemory {
  constructor() {
    this.memory = [];
    this.initialized = false;
    this.initializing = null;
    this.isSaving = false;
  }

  async init() {
    if (this.initialized) return;
    if (this.initializing) return this.initializing;

    this.initializing = (async () => {
      try {
        if (!existsSync(path.dirname(MEMORY_PATH))) {
          await fs.mkdir(path.dirname(MEMORY_PATH), { recursive: true });
        }

        if (existsSync(MEMORY_PATH)) {
          const data = await fs.readFile(MEMORY_PATH, 'utf-8');
          this.memory = JSON.parse(data);
        } else {
          this.memory = [];
          await this.saveToFile();
        }
        this.initialized = true;
      } catch (error) {
        logger.error('Failed to initialize memory', error);
        this.memory = [];
        this.initializing = null;
      }
    })();

    return this.initializing;
  }

  async saveToFile() {
    if (this.isSaving) {
      // Basic lock to prevent concurrent writes
      // Could be improved with a queue if needed
      return;
    }

    this.isSaving = true;
    try {
      await fs.writeFile(MEMORY_PATH, JSON.stringify(this.memory, null, 2));
    } catch (error) {
      logger.error('Failed to save memory to file', error);
      throw new AppError(`Failed to save memory: ${error.message}`, { cause: error });
    } finally {
      this.isSaving = false;
    }
  }

  async remember(text, tags = [], source = 'manual') {
    if (!text || typeof text !== 'string') {
      throw new ValidationError('Memory text must be a non-empty string');
    }

    await this.init();
    const entry = {
      id: crypto.randomUUID(),
      text,
      tags: Array.isArray(tags) ? tags : [tags],
      source,
      timestamp: new Date().toISOString()
    };
    this.memory.push(entry);
    await this.saveToFile();
    return entry;
  }

  async search(query, limit = 5) {
    if (!query || typeof query !== 'string') {
      throw new ValidationError('Search query must be a non-empty string');
    }

    await this.init();
    const lowerQuery = query.toLowerCase();
    
    // Simple keyword search for now
    // Future: Vector search / Semantic search
    return this.memory
      .filter(entry => 
        entry.text.toLowerCase().includes(lowerQuery) || 
        entry.tags.some(t => t.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  async clear(beforeDate = null) {
    await this.init();
    if (beforeDate) {
      const date = new Date(beforeDate);
      this.memory = this.memory.filter(entry => new Date(entry.timestamp) >= date);
    } else {
      this.memory = [];
    }
    await this.saveToFile();
  }

  async pruneAfter(timestamp) {
    await this.init();
    if (!timestamp) return;
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return;
    this.memory = this.memory.filter(entry => new Date(entry.timestamp) < date);
    await this.saveToFile();
  }

  async getAll() {
    await this.init();
    return this.memory;
  }
}

export const ultraMemory = new UltraMemory();
