// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';

const SESSION_DIR = path.join(process.cwd(), '.ultra-dex', 'sessions');
const LAST_SESSION = path.join(SESSION_DIR, 'last-session.json');

export async function saveSession(snapshot) {
  await fs.mkdir(SESSION_DIR, { recursive: true });
  await fs.writeFile(LAST_SESSION, JSON.stringify(snapshot, null, 2));
  return LAST_SESSION;
}

export async function loadSession() {
  const content = await fs.readFile(LAST_SESSION, 'utf8');
  return JSON.parse(content);
}

export async function listSessions() {
  try {
    const files = await fs.readdir(SESSION_DIR);
    return files.filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
}
