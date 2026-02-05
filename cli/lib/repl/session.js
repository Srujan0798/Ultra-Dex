import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export const SESSION_DIR = path.join(os.homedir(), '.ultra-dex', 'sessions');

export async function createSession({ provider = null, model = null } = {}) {
  const session = {
    id: `session-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
    context: {},
    config: {
      provider,
      model
    }
  };
  await saveSession(session);
  return session;
}

export async function listSessions() {
  try {
    await fs.mkdir(SESSION_DIR, { recursive: true });
    const files = await fs.readdir(SESSION_DIR);
    const sessions = await Promise.all(
      files
        .filter((file) => file.endsWith('.json'))
        .map(async (file) => {
          const data = await fs.readFile(path.join(SESSION_DIR, file), 'utf8');
          return JSON.parse(data);
        })
    );
    return sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch {
    return [];
  }
}

export async function getSession(id) {
  if (id === 'latest') {
    const sessions = await listSessions();
    id = sessions[0]?.id;
  }
  if (!id) return null;

  const file = path.join(SESSION_DIR, `${id}.json`);
  try {
    const data = await fs.readFile(file, 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function saveSession(session) {
  await fs.mkdir(SESSION_DIR, { recursive: true });
  session.updatedAt = new Date().toISOString();
  const file = path.join(SESSION_DIR, `${session.id}.json`);
  await fs.writeFile(file, JSON.stringify(session, null, 2));
}
