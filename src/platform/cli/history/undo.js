// Copyright (c) 2026 Ultra-Dex

/**
 * Universal Undo / History Manager
 * Tracks file operations and can revert recent changes.
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { existsSync } from 'fs';
import { AppError, ValidationError } from '../utils/errors.js';
import { ultraMemory } from '../mcp/memory.js';
import { memex } from '../memory/memex.js';
import { SENSITIVE_PATH_PATTERNS } from '../governance/rules.js';

const HISTORY_DIR = path.resolve(process.cwd(), '.ultra', 'history');
const HISTORY_FILE = path.join(HISTORY_DIR, 'operations.json');

function nowIso() {
  return new Date().toISOString();
}

function toRelative(projectRoot, filePath) {
  const resolved = path.resolve(projectRoot, filePath);
  return path.relative(projectRoot, resolved) || path.basename(resolved);
}

export class HistoryManager {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = path.resolve(projectRoot);
    this.history = [];
    this.initialized = false;
    this.isSaving = false;
    this.trackingSuspended = false;
  }

  async init() {
    if (this.initialized) return;

    if (!existsSync(HISTORY_DIR)) {
      await fs.mkdir(HISTORY_DIR, { recursive: true });
    }

    if (existsSync(HISTORY_FILE)) {
      try {
        const raw = await fs.readFile(HISTORY_FILE, 'utf8');
        this.history = JSON.parse(raw) || [];
      } catch {
        this.history = [];
      }
    } else {
      this.history = [];
      await this.save();
    }

    this.initialized = true;
  }

  async save() {
    if (this.isSaving) return;
    this.isSaving = true;
    try {
      await fs.writeFile(HISTORY_FILE, JSON.stringify(this.history, null, 2), 'utf8');
    } finally {
      this.isSaving = false;
    }
  }

  suspendTracking() {
    this.trackingSuspended = true;
  }

  resumeTracking() {
    this.trackingSuspended = false;
  }

  shouldTrack(filePath) {
    if (this.trackingSuspended) return false;
    if (!filePath || typeof filePath !== 'string') return false;
    const resolved = path.resolve(this.projectRoot, filePath);
    const rel = path.relative(this.projectRoot, resolved);
    if (!rel || rel.startsWith('..')) return false;
    if (rel.startsWith('.ultra' + path.sep) || rel.startsWith('.ultra-dex' + path.sep))
      return false;
    if (rel.includes(`${path.sep}node_modules${path.sep}`)) return false;
    if (resolved === HISTORY_FILE) return false;
    if (SENSITIVE_PATH_PATTERNS.some((pattern) => pattern.test(rel) || pattern.test('/' + rel)))
      return false;
    return true;
  }

  async recordOperation(entry) {
    await this.init();
    const record = {
      id: crypto.randomUUID(),
      timestamp: nowIso(),
      ...entry,
    };
    this.history.push(record);
    await this.save();
    return record;
  }

  async recordWrite({ filePath, before, after, actor, reason, metadata }) {
    const relativePath = toRelative(this.projectRoot, filePath);
    return await this.recordOperation({
      type: before == null ? 'create' : 'write',
      filePath: relativePath,
      before: before ?? null,
      after: after ?? '',
      actor: actor || 'system',
      reason: reason || 'write',
      metadata: metadata || {},
    });
  }

  async recordDelete({ filePath, before, actor, reason, metadata }) {
    const relativePath = toRelative(this.projectRoot, filePath);
    return await this.recordOperation({
      type: 'delete',
      filePath: relativePath,
      before: before ?? null,
      after: null,
      actor: actor || 'system',
      reason: reason || 'delete',
      metadata: metadata || {},
    });
  }

  async undo(steps = 1) {
    await this.init();

    const count = Number.parseInt(steps, 10);
    if (Number.isNaN(count) || count < 1) {
      throw new ValidationError('Steps must be a positive integer');
    }

    if (this.history.length === 0) {
      return { reverted: [], cutoff: null };
    }

    const actualSteps = Math.min(count, this.history.length);
    const targetOps = this.history.slice(-actualSteps);
    const cutoff = targetOps[0]?.timestamp || null;

    this.suspendTracking();
    try {
      for (const op of [...targetOps].reverse()) {
        const fullPath = path.resolve(this.projectRoot, op.filePath);
        if (op.type === 'create') {
          // File was created, delete it
          await fs.unlink(fullPath).catch(() => {});
        } else if (op.type === 'write') {
          if (op.before == null) {
            await fs.unlink(fullPath).catch(() => {});
          } else {
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            const payload = decodeContent(op.before, op.metadata, 'before');
            if (Buffer.isBuffer(payload)) {
              await fs.writeFile(fullPath, payload);
            } else {
              await fs.writeFile(fullPath, payload, 'utf8');
            }
          }
        } else if (op.type === 'delete') {
          if (op.before != null) {
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            const payload = decodeContent(op.before, op.metadata, 'before');
            if (Buffer.isBuffer(payload)) {
              await fs.writeFile(fullPath, payload);
            } else {
              await fs.writeFile(fullPath, payload, 'utf8');
            }
          }
        }
      }
    } finally {
      this.resumeTracking();
    }

    this.history = this.history.slice(0, -actualSteps);
    await this.save();

    if (cutoff) {
      try {
        await ultraMemory.pruneAfter(cutoff);
      } catch (error) {
        throw new AppError(`Failed to prune memory: ${error.message}`, { cause: error });
      }

      try {
        await memex.deleteAfter(cutoff);
      } catch (error) {
        throw new AppError(`Failed to prune memex: ${error.message}`, { cause: error });
      }
    }

    return { reverted: targetOps, cutoff };
  }

  async list(limit = 20) {
    await this.init();
    if (!limit || Number.isNaN(Number(limit))) return [...this.history];
    return this.history.slice(-Number(limit));
  }

  async undoTo({ id, timestamp, index } = {}) {
    await this.init();
    if (!this.history.length) return { reverted: [], cutoff: null };

    let targetIndex = -1;

    if (id) {
      targetIndex = this.history.findIndex((op) => op.id === id);
    } else if (timestamp) {
      const ts = new Date(timestamp).getTime();
      if (!Number.isNaN(ts)) {
        targetIndex = this.history.findIndex((op) => new Date(op.timestamp).getTime() >= ts);
      }
    } else if (typeof index === 'number' && index >= 0) {
      targetIndex = index;
    }

    if (targetIndex < 0) {
      return { reverted: [], cutoff: null };
    }

    const steps = this.history.length - targetIndex - 1;
    if (steps <= 0) return { reverted: [], cutoff: null };
    return await this.undo(steps);
  }
}

export const historyManager = new HistoryManager();

function decodeContent(content, metadata, key) {
  if (content == null) return content;
  const isBinary = metadata?.[`${key}Binary`];
  if (isBinary) {
    return Buffer.from(content, 'base64');
  }
  return content;
}
