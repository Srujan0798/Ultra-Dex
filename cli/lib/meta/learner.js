import fs from 'fs/promises';
import path from 'path';

const META_DIR = path.resolve(process.cwd(), '.ultra-dex', 'meta');
const LOG_PATH = path.join(META_DIR, 'learning-log.jsonl');

async function ensureDir() {
  await fs.mkdir(META_DIR, { recursive: true });
}

export async function recordOutcome(entry) {
  await ensureDir();
  const payload = {
    id: entry.id || `${Date.now()}`,
    agent: entry.agent || 'unknown',
    task: entry.task || 'unknown',
    outcome: entry.outcome || 'unknown',
    rating: entry.rating ?? null,
    createdAt: new Date().toISOString()
  };
  await fs.appendFile(LOG_PATH, JSON.stringify(payload) + '\n', 'utf8');
  return payload;
}

export async function loadOutcomes() {
  try {
    const raw = await fs.readFile(LOG_PATH, 'utf8');
    return raw
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}
