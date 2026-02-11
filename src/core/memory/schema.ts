// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Schema module
 * @module memory/schema
 */

export type MemoryEntryType = 'decision' | 'pattern' | 'constraint' | 'error' | 'note';

export interface MemoryEntry {
  id: string;
  content: string;
  type: MemoryEntryType;
  timestamp: string;
  source: {
    agent: string;
    file?: string;
    commit?: string;
  };
  embedding?: number[];
  supersedes?: string[];
  relates_to?: string[];
}

export interface MemoryStore {
  add(entry: MemoryEntry): Promise<void>;
  get(id: string): Promise<MemoryEntry | null>;
  update(id: string, patch: Partial<MemoryEntry>): Promise<void>;
  remove(id: string): Promise<void>;
  query(query: string, limit?: number): Promise<MemoryEntry[]>;
}
