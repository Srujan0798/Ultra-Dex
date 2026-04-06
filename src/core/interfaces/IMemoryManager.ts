export interface MemoryEntry {
  content: string;
  type?: string;
  source?: string;
  importance?: number;
  metadata?: Record<string, unknown>;
}

export interface MemorySearchResult {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
  score?: number;
}

export interface IMemoryManager {
  initialize(): Promise<void>;
  init(): Promise<void>;
  add(entry: MemoryEntry): Promise<unknown>;
  search(query: string, limit?: number): Promise<MemorySearchResult[]>;
  getTier(tier: string): Promise<MemorySearchResult[]>;
  stats(): Promise<Record<string, unknown>>;
}
