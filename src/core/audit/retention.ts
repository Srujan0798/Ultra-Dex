import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { AuditTrail } from './audit-trail.ts';

export interface RetentionPolicy {
  retainDays: number;
  archiveAfterDays: number;
  deleteAfterDays: number;
}

export class AuditRetentionManager {
  private readonly baseDir: string;
  private readonly archiveDir: string;
  private readonly policy: RetentionPolicy;
  private readonly auditTrail: AuditTrail;

  constructor(
    baseDir = path.join(os.homedir(), '.ultra-dex', 'audit'),
    policy: RetentionPolicy = {
      retainDays: 90,
      archiveAfterDays: 365,
      deleteAfterDays: 730,
    }
  ) {
    this.baseDir = baseDir;
    this.archiveDir = path.join(baseDir, 'archive');
    this.policy = policy;
    this.auditTrail = new AuditTrail(baseDir);
  }

  async enforceRetention(): Promise<{ compressed: number; archived: number; deleted: number }> {
    await fs.mkdir(this.baseDir, { recursive: true });
    await fs.mkdir(this.archiveDir, { recursive: true });

    const compressed = await this.auditTrail.compressOlderThan(this.policy.retainDays);
    const files = await fs.readdir(this.baseDir);
    const now = Date.now();
    let archived = 0;
    let deleted = 0;

    for (const file of files) {
      const absolute = path.join(this.baseDir, file);
      const stat = await fs.stat(absolute);
      const ageDays = (now - stat.mtimeMs) / (24 * 60 * 60 * 1000);

      if (file.endsWith('.jsonl.gz') && ageDays >= this.policy.archiveAfterDays) {
        const target = path.join(this.archiveDir, file);
        await fs.rename(absolute, target);
        archived += 1;
        continue;
      }
    }

    const archivedFiles = await fs.readdir(this.archiveDir);
    for (const file of archivedFiles) {
      const absolute = path.join(this.archiveDir, file);
      const stat = await fs.stat(absolute);
      const ageDays = (now - stat.mtimeMs) / (24 * 60 * 60 * 1000);
      if (ageDays >= this.policy.deleteAfterDays) {
        await fs.unlink(absolute);
        deleted += 1;
      }
    }

    return { compressed, archived, deleted };
  }
}

