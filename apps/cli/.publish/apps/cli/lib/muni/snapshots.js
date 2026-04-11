// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview MUNI snapshot system - Git-based context snapshots for rollback
 * @module muni/snapshots
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const SNAPSHOTS_DIR = path.resolve(process.cwd(), '.ultra', 'snapshots');

class ContextSnapshots {
  constructor(snapshotsDir = SNAPSHOTS_DIR) {
    this.snapshotsDir = snapshotsDir;
  }

  async initialize() {
    if (!fs.existsSync(this.snapshotsDir)) {
      fs.mkdirSync(this.snapshotsDir, { recursive: true });
    }
  }

  async create(label, metadata = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotName = `snapshot-${timestamp}-${label.replace(/\s+/g, '-').toLowerCase()}`;
    const snapshotPath = path.join(this.snapshotsDir, snapshotName);

    // Create snapshot directory
    fs.mkdirSync(snapshotPath, { recursive: true });

    // Save metadata
    const meta = {
      label,
      timestamp,
      ...metadata,
      createdAt: new Date().toISOString(),
    };
    fs.writeFileSync(path.join(snapshotPath, 'metadata.json'), JSON.stringify(meta, null, 2));

    // If in a git repo, save current commit hash
    try {
      const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      meta.gitCommit = commitHash;
      fs.writeFileSync(path.join(snapshotPath, 'metadata.json'), JSON.stringify(meta, null, 2));
    } catch {
      // Not a git repo, skip
    }

    return { name: snapshotName, path: snapshotPath, metadata: meta };
  }

  async list() {
    if (!fs.existsSync(this.snapshotsDir)) return [];

    const snapshots = fs
      .readdirSync(this.snapshotsDir)
      .map((name) => {
        const metaPath = path.join(this.snapshotsDir, name, 'metadata.json');
        if (!fs.existsSync(metaPath)) return null;

        try {
          const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          return { name, ...metadata };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return snapshots.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async get(name) {
    const metaPath = path.join(this.snapshotsDir, name, 'metadata.json');
    if (!fs.existsSync(metaPath)) return null;

    try {
      const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      return { name, ...metadata };
    } catch {
      return null;
    }
  }

  async rollback(name) {
    const snapshot = await this.get(name);
    if (!snapshot) {
      throw new Error(`Snapshot '${name}' not found`);
    }

    if (snapshot.gitCommit) {
      try {
        execSync(`git checkout ${snapshot.gitCommit}`, { stdio: 'inherit' });
        return { success: true, commit: snapshot.gitCommit };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: false, error: 'No git commit associated with snapshot' };
  }

  async delete(name) {
    const snapshotPath = path.join(this.snapshotsDir, name);
    if (!fs.existsSync(snapshotPath)) return false;

    fs.rmSync(snapshotPath, { recursive: true, force: true });
    return true;
  }

  async prune(keepLast = 10) {
    const snapshots = await this.list();
    if (snapshots.length <= keepLast) return 0;

    const toDelete = snapshots.slice(keepLast);
    let deleted = 0;

    for (const snapshot of toDelete) {
      if (await this.delete(snapshot.name)) {
        deleted++;
      }
    }

    return deleted;
  }
}

export const snapshots = new ContextSnapshots();

export { ContextSnapshots };
export default ContextSnapshots;
