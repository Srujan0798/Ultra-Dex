import { randomUUID } from 'node:crypto';
import { MemoryEntry, globalStore } from '../state/store.js';

export interface SessionMetadata {
  userId?: string;
  startTime: string;
  lastActive: string;
}

export class Session {
  readonly id: string;
  private metadata: SessionMetadata;
  private entries: string[] = []; // List of memory entry IDs

  constructor(id?: string, metadata: Partial<SessionMetadata> = {}) {
    this.id = id || `sess_${randomUUID()}`;
    this.metadata = {
      startTime: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      ...metadata,
    };
  }

  async addEntry(content: any, options: { priority?: MemoryEntry['priority']; tags?: string[] } = {}): Promise<string> {
    const tags = [...(options.tags || []), `session:${this.id}`];
    const entryId = await globalStore.store(content, { ...options, tags });
    this.entries.push(entryId);
    this.metadata.lastActive = new Date().toISOString();
    return entryId;
  }

  async getEntries(): Promise<MemoryEntry[]> {
    const results = await Promise.all(this.entries.map(id => globalStore.retrieve(id)));
    return results.filter((e: MemoryEntry | null): e is MemoryEntry => e !== null);
  }

  getMetadata(): SessionMetadata {
    return { ...this.metadata };
  }
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();

  createSession(metadata: Partial<SessionMetadata> = {}): Session {
    const session = new Session(undefined, metadata);
    this.sessions.set(session.id, session);
    return session;
  }

  getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  deleteSession(id: string): boolean {
    return this.sessions.delete(id);
  }
}

export const globalSessionManager = new SessionManager();
