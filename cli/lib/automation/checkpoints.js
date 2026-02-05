import fs from 'fs/promises';
import path from 'path';

const CHECKPOINT_DIR = path.resolve(process.cwd(), '.ultra-dex', 'automation', 'checkpoints');

export class CheckpointManager {
  async saveCheckpoint(stage, data = {}) {
    await fs.mkdir(CHECKPOINT_DIR, { recursive: true });
    const id = `cp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const payload = {
      id,
      stage,
      createdAt: new Date().toISOString(),
      data
    };
    await fs.writeFile(path.join(CHECKPOINT_DIR, `${id}.json`), JSON.stringify(payload, null, 2));
    return payload;
  }

  async loadCheckpoint(id) {
    const content = await fs.readFile(path.join(CHECKPOINT_DIR, `${id}.json`), 'utf8');
    return JSON.parse(content);
  }

  async listCheckpoints() {
    try {
      const entries = await fs.readdir(CHECKPOINT_DIR);
      return entries.filter(e => e.endsWith('.json')).map(e => e.replace('.json', ''));
    } catch {
      return [];
    }
  }
}

export default CheckpointManager;
