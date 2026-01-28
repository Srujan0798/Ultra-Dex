import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

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
  }

  async init() {
    if (this.initialized) return;
    
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
      console.error('Failed to initialize memory:', error);
      this.memory = [];
    }
  }

  async saveToFile() {
    try {
      await fs.writeFile(MEMORY_PATH, JSON.stringify(this.memory, null, 2));
    } catch (error) {
      console.error('Failed to save memory to file:', error);
    }
  }

  async remember(text, tags = [], source = 'manual') {
    await this.init();
    const entry = {
      id: crypto.randomUUID(),
      text,
      tags,
      source,
      timestamp: new Date().toISOString()
    };
    this.memory.push(entry);
    await this.saveToFile();
    return entry;
  }

  async search(query, limit = 5) {
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

  async getAll() {
    await this.init();
    return this.memory;
  }
}

export const ultraMemory = new UltraMemory();
