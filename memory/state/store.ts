import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';

export interface MemoryEntry {
  id: string;
  content: any;
  metadata: Record<string, any>;
  timestamp: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  tags: string[];
}

export interface StoreConfig {
  cacheSize?: number;
  ttl?: number;
}

export class MemoryStore extends EventEmitter {
  private cache: Map<string, { entry: MemoryEntry; expiresAt: number | null }>;
  private config: Required<StoreConfig>;

  constructor(config: StoreConfig = {}) {
    super();
    this.config = {
      cacheSize: config.cacheSize || 1000,
      ttl: config.ttl || 300000, // 5 minutes
    };
    this.cache = new Map();
  }

  async store(content: any, options: { priority?: MemoryEntry['priority']; tags?: string[]; ttl?: number } = {}): Promise<string> {
    const id = `mem_${randomUUID()}`;
    const entry: MemoryEntry = {
      id,
      content,
      metadata: {},
      timestamp: new Date().toISOString(),
      priority: options.priority || 'normal',
      tags: options.tags || [],
    };

    const expiresAt = options.ttl ? Date.now() + options.ttl : Date.now() + this.config.ttl;
    this.cache.set(id, { entry, expiresAt });

    if (this.cache.size > this.config.cacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.emit('stored', entry);
    return id;
  }

  async retrieve(id: string): Promise<MemoryEntry | null> {
    const item = this.cache.get(id);
    if (!item) return null;

    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.cache.delete(id);
      return null;
    }

    return item.entry;
  }

  async delete(id: string): Promise<boolean> {
    return this.cache.delete(id);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

export const globalStore = new MemoryStore();
