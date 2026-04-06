// Type declarations for memory manager

export interface MemoryEntry {
  id: string;
  content: string;
  type: string;
  importance: number;
  metadata?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SearchResult {
  id: string;
  content: string;
  type: string;
  importance: number;
  metadata?: unknown;
  score: number;
}

export interface MemoryManager {
  init(): Promise<void>;
  add(entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<MemoryEntry>;
  update(id: string, updates: Partial<MemoryEntry>): Promise<MemoryEntry | null>;
  get(id: string): Promise<MemoryEntry | null>;
  delete(id: string): Promise<boolean>;
  remove(id: string): Promise<boolean>;
  search(query: string, limit?: number): Promise<SearchResult[]>;
  clear(): Promise<void>;
}

export const ppmManager: MemoryManager;
export default ppmManager;
