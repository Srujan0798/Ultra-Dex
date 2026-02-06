// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';

const MEMORY_PATH = path.resolve(process.cwd(), '.ultra-dex', 'tiered-memory.json');

export async function loadTieredMemory() {
  try {
    const data = await fs.readFile(MEMORY_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
    return { hot: [], warm: [], cold: [], updatedAt: null };
  }
}

export async function saveTieredMemory(state) {
  await fs.mkdir(path.dirname(MEMORY_PATH), { recursive: true });
  state.updatedAt = new Date().toISOString();
  await fs.writeFile(MEMORY_PATH, JSON.stringify(state, null, 2));
}

export function promoteEntry(state, entryId) {
  const promote = (from, to) => {
    const idx = state[from].findIndex((e) => e.id === entryId);
    if (idx === -1) return false;
    const [entry] = state[from].splice(idx, 1);
    state[to].unshift(entry);
    return true;
  };

  return promote('cold', 'warm') || promote('warm', 'hot');
}

export function demoteEntry(state, entryId) {
  const demote = (from, to) => {
    const idx = state[from].findIndex((e) => e.id === entryId);
    if (idx === -1) return false;
    const [entry] = state[from].splice(idx, 1);
    state[to].unshift(entry);
    return true;
  };
  return demote('hot', 'warm') || demote('warm', 'cold');
}

export const tieredMemoryPath = MEMORY_PATH;
