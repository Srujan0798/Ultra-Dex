// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';

const DEFAULT_DIR = path.join(process.cwd(), '.ultra-dex', 'checkpoints');

export async function saveCheckpoint(id, state, dir = DEFAULT_DIR) {
  if (!id) throw new Error('checkpoint id is required');
  await fs.mkdir(dir, { recursive: true });
  const payload = {
    id,
    savedAt: new Date().toISOString(),
    state,
  };
  const filePath = path.join(dir, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2));
  return filePath;
}

export async function loadCheckpoint(id, dir = DEFAULT_DIR) {
  const filePath = path.join(dir, `${id}.json`);
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

export async function listCheckpoints(dir = DEFAULT_DIR) {
  try {
    const entries = await fs.readdir(dir);
    return entries
      .filter((name) => name.endsWith('.json'))
      .map((name) => name.replace(/\.json$/, ''));
  } catch {
    return [];
  }
}
