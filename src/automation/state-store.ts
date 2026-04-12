/**
 * State Store
 * Persistent state management with atomic writes
 */

import fs from 'fs';
import path from 'path';

export interface StateValue {
  value: unknown;
  timestamp: string;
  version: number;
}

export interface StoredState {
  version: number;
  lastModified: string;
  data: Record<string, StateValue>;
}

export class AutoCEOState {
  private statePath: string;
  private tempPath: string;
  private data: Map<string, StateValue> = new Map();
  private version: number = 0;
  private loaded: boolean = false;

  constructor(statePath = '.ultra-dex/automation/state.json') {
    this.statePath = statePath;
    this.tempPath = `${statePath}.tmp`;
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    const dir = path.dirname(this.statePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async load(): Promise<void> {
    try {
      if (fs.existsSync(this.statePath)) {
        const content = fs.readFileSync(this.statePath, 'utf-8');
        const stored: StoredState = JSON.parse(content);

        this.version = stored.version || 0;
        this.data = new Map();

        for (const [key, value] of Object.entries(stored.data)) {
          this.data.set(key, value);
        }

        this.loaded = true;
      } else {
        this.version = 0;
        this.data = new Map();
        this.loaded = true;
      }
    } catch (error) {
      console.error('[StateStore] Failed to load state:', error);
      this.version = 0;
      this.data = new Map();
      this.loaded = true;
      throw error;
    }
  }

  async save(): Promise<void> {
    if (!this.loaded) {
      throw new Error('State not loaded. Call load() first.');
    }

    this.version++;

    const stored: StoredState = {
      version: this.version,
      lastModified: new Date().toISOString(),
      data: Object.fromEntries(this.data),
    };

    const content = JSON.stringify(stored, null, 2);

    try {
      fs.writeFileSync(this.tempPath, content, { flag: 'w' });
      fs.renameSync(this.tempPath, this.statePath);
    } catch (error) {
      console.error('[StateStore] Failed to save state:', error);
      throw error;
    }
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    if (!this.loaded) {
      throw new Error('State not loaded. Call load() first.');
    }

    const entry = this.data.get(key);
    if (entry === undefined) {
      return defaultValue;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    if (!this.loaded) {
      throw new Error('State not loaded. Call load() first.');
    }

    const entry: StateValue = {
      value,
      timestamp: new Date().toISOString(),
      version: this.version + 1,
    };

    this.data.set(key, entry);
  }

  has(key: string): boolean {
    if (!this.loaded) {
      throw new Error('State not loaded. Call load() first.');
    }
    return this.data.has(key);
  }

  delete(key: string): boolean {
    if (!this.loaded) {
      throw new Error('State not loaded. Call load() first.');
    }
    return this.data.delete(key);
  }

  keys(): string[] {
    if (!this.loaded) {
      throw new Error('State not loaded. Call load() first.');
    }
    return Array.from(this.data.keys());
  }

  getAll(): Record<string, unknown> {
    if (!this.loaded) {
      throw new Error('State not loaded. Call load() first.');
    }

    const result: Record<string, unknown> = {};
    for (const [key, entry] of this.data) {
      result[key] = entry.value;
    }
    return result;
  }

  getWithMetadata(key: string): StateValue | undefined {
    if (!this.loaded) {
      throw new Error('State not loaded. Call load() first.');
    }
    return this.data.get(key);
  }

  clear(): void {
    if (!this.loaded) {
      throw new Error('State not loaded. Call load() first.');
    }
    this.data.clear();
    this.version = 0;
  }

  getVersion(): number {
    return this.version;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  async backup(backupPath?: string): Promise<string> {
    if (!this.loaded) {
      throw new Error('State not loaded. Call load() first.');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = backupPath || `${this.statePath}.backup-${timestamp}`;

    const stored: StoredState = {
      version: this.version,
      lastModified: new Date().toISOString(),
      data: Object.fromEntries(this.data),
    };

    fs.writeFileSync(backupFile, JSON.stringify(stored, null, 2));
    return backupFile;
  }

  async restore(backupPath: string): Promise<void> {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    const content = fs.readFileSync(backupPath, 'utf-8');
    const stored: StoredState = JSON.parse(content);

    this.version = stored.version || 0;
    this.data = new Map();

    for (const [key, value] of Object.entries(stored.data)) {
      this.data.set(key, value);
    }

    this.loaded = true;
    await this.save();
  }

  getKeysByPrefix(prefix: string): string[] {
    if (!this.loaded) {
      throw new Error('State not loaded. Call load() first.');
    }
    return Array.from(this.data.keys()).filter((k) => k.startsWith(prefix));
  }

  getKeysByPattern(pattern: RegExp): string[] {
    if (!this.loaded) {
      throw new Error('State not loaded. Call load() first.');
    }
    return Array.from(this.data.keys()).filter((k) => pattern.test(k));
  }

  exportToString(): string {
    if (!this.loaded) {
      throw new Error('State not loaded. Call load() first.');
    }

    const stored: StoredState = {
      version: this.version,
      lastModified: new Date().toISOString(),
      data: Object.fromEntries(this.data),
    };

    return JSON.stringify(stored, null, 2);
  }

  importFromString(content: string): void {
    const stored: StoredState = JSON.parse(content);

    this.version = stored.version || 0;
    this.data = new Map();

    for (const [key, value] of Object.entries(stored.data)) {
      this.data.set(key, value);
    }

    this.loaded = true;
  }
}

export default AutoCEOState;
