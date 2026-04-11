import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { UnifiedMemory } from '../memory/unified-api.ts';
import { GovernanceManager } from '../governance/governance-manager.ts';
import { TeamMembership } from './membership.ts';

interface SharedMemoryRecord {
  key: string;
  namespaceKey: string;
  value: unknown;
  updatedBy: string;
  updatedAt: string;
}

interface ConflictRecord {
  key: string;
  previousUpdatedBy: string;
  nextUpdatedBy: string;
  previousUpdatedAt: string;
  nextUpdatedAt: string;
}

export class SharedMemoryPool extends UnifiedMemory {
  private readonly workspaceId: string;
  private readonly membership: TeamMembership;
  private readonly governance: GovernanceManager;
  private readonly memoryPath: string;
  private readonly conflictLogPath: string;

  constructor(
    workspaceId: string,
    membership: TeamMembership,
    governance = new GovernanceManager(),
    baseDir = path.join(os.homedir(), '.ultra-dex', 'teams')
  ) {
    super();
    this.workspaceId = workspaceId;
    this.membership = membership;
    this.governance = governance;
    this.memoryPath = path.join(baseDir, workspaceId, 'memory', 'shared-memory.json');
    this.conflictLogPath = path.join(baseDir, workspaceId, 'memory', 'conflicts.jsonl');
  }

  private namespaceKey(key: string): string {
    return `team/${this.workspaceId}/memory/${key}`;
  }

  private async ensureStorage(): Promise<void> {
    await fs.mkdir(path.dirname(this.memoryPath), { recursive: true });
    try {
      await fs.access(this.memoryPath);
    } catch {
      await fs.writeFile(this.memoryPath, JSON.stringify([], null, 2), 'utf8');
    }
  }

  private async readRecords(): Promise<SharedMemoryRecord[]> {
    await this.ensureStorage();
    const raw = await fs.readFile(this.memoryPath, 'utf8');
    return JSON.parse(raw) as SharedMemoryRecord[];
  }

  private async writeRecords(records: SharedMemoryRecord[]): Promise<void> {
    await fs.writeFile(this.memoryPath, JSON.stringify(records, null, 2), 'utf8');
  }

  private async appendConflict(record: ConflictRecord): Promise<void> {
    await fs.mkdir(path.dirname(this.conflictLogPath), { recursive: true });
    await fs.appendFile(this.conflictLogPath, `${JSON.stringify(record)}\n`, 'utf8');
  }

  async writeMemory(userId: string, key: string, value: unknown): Promise<SharedMemoryRecord> {
    if (!this.membership.checkPermission(userId, 'memory.write')) {
      throw new Error('Write permission denied');
    }

    await this.governance.gate({
      action: 'memory.write',
      agentId: userId,
      resource: this.namespaceKey(key),
      details: { workspaceId: this.workspaceId },
    });

    const namespaceKey = this.namespaceKey(key);
    const now = new Date().toISOString();
    const records = await this.readRecords();
    const index = records.findIndex((entry) => entry.key === key);
    if (index > -1) {
      const previous = records[index];
      records[index] = {
        ...previous,
        value,
        updatedBy: userId,
        updatedAt: now,
      };
      await this.appendConflict({
        key,
        previousUpdatedBy: previous.updatedBy,
        nextUpdatedBy: userId,
        previousUpdatedAt: previous.updatedAt,
        nextUpdatedAt: now,
      });
    } else {
      records.push({
        key,
        namespaceKey,
        value,
        updatedBy: userId,
        updatedAt: now,
      });
    }
    await this.writeRecords(records);
    return records.find((entry) => entry.key === key)!;
  }

  async readMemory(userId: string, key: string): Promise<SharedMemoryRecord | null> {
    if (!this.membership.checkPermission(userId, 'memory.read')) {
      throw new Error('Read permission denied');
    }
    await this.governance.gate({
      action: 'memory.read',
      agentId: userId,
      resource: this.namespaceKey(key),
      details: { workspaceId: this.workspaceId },
    });
    const records = await this.readRecords();
    return records.find((entry) => entry.key === key) ?? null;
  }

  async search(query: string, userId: string, limit = 10): Promise<SharedMemoryRecord[]> {
    if (!this.membership.checkPermission(userId, 'memory.read')) {
      throw new Error('Search permission denied');
    }
    const records = await this.readRecords();
    const normalized = query.toLowerCase();
    return records
      .filter((entry) => JSON.stringify(entry.value).toLowerCase().includes(normalized))
      .slice(0, limit);
  }

  async listConflicts(): Promise<ConflictRecord[]> {
    try {
      const raw = await fs.readFile(this.conflictLogPath, 'utf8');
      return raw
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line) as ConflictRecord);
    } catch {
      return [];
    }
  }
}

