// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Sync module
 * @module remote/sync
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const SYNC_STATE_PATH = path.resolve(process.cwd(), '.ultra-dex', 'remote-sync.json');

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export async function loadSyncState() {
  try {
    const data = await fs.readFile(SYNC_STATE_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
    return { lastHash: null, lastSync: null };
  }
}

export async function saveSyncState(state) {
  await fs.mkdir(path.dirname(SYNC_STATE_PATH), { recursive: true });
  await fs.writeFile(SYNC_STATE_PATH, JSON.stringify(state, null, 2));
}

export async function readContextFile(projectDir = process.cwd()) {
  const contextPath = path.join(projectDir, 'CONTEXT.md');
  const content = await fs.readFile(contextPath, 'utf8');
  return { content, hash: hashContent(content) };
}

export async function writeContextFile(content, projectDir = process.cwd()) {
  const contextPath = path.join(projectDir, 'CONTEXT.md');
  await fs.writeFile(contextPath, content);
  return true;
}

export async function determineSyncDirection(localContent, remoteContent) {
  const localHash = hashContent(localContent);
  const remoteHash = hashContent(remoteContent);
  if (localHash === remoteHash) return 'in-sync';
  return 'conflict';
}
