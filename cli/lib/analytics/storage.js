/**
 * JSONL storage helpers for analytics events.
 */

import fs from 'fs/promises';
import path from 'path';

export async function appendJsonl(filePath, payload) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.appendFile(filePath, JSON.stringify(payload) + '\n', 'utf8');
}

export async function readJsonl(filePath, { since, limit } = {}) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    let events = data
      .split('\n')
      .filter(Boolean)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    if (since) {
      const sinceTs = new Date(since).getTime();
      if (!Number.isNaN(sinceTs)) {
        events = events.filter(event => new Date(event.timestamp || event.receivedAt).getTime() >= sinceTs);
      }
    }

    if (limit && events.length > limit) {
      events = events.slice(events.length - limit);
    }

    return events;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    return [];
  }
}
