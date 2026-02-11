// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Memory module
 * @module hive/memory
 */

import fs from 'fs/promises';
import path from 'path';

const HIVE_PATH = path.resolve(process.cwd(), '.ultra-dex', 'hive', 'memory.json');

async function ensureHiveDir() {
  await fs.mkdir(path.dirname(HIVE_PATH), { recursive: true });
}

export async function readHiveMemory() {
  try {
    const raw = await fs.readFile(HIVE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { entries: [], updatedAt: null };
  }
}

export async function writeHiveMemory(data) {
  await ensureHiveDir();
  const payload = { ...data, updatedAt: new Date().toISOString() };
  await fs.writeFile(HIVE_PATH, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

export async function addHiveEntry(entry) {
  const memory = await readHiveMemory();
  memory.entries.push({
    id: entry.id || `${Date.now()}`,
    agent: entry.agent || 'unknown',
    content: entry.content,
    createdAt: new Date().toISOString(),
  });
  return await writeHiveMemory(memory);
}

export async function listHiveEntries(limit = 50) {
  const memory = await readHiveMemory();
  return memory.entries.slice(-limit);
}
