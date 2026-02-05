import fs from 'fs/promises';
import path from 'path';

const CHROME_AGENT_PATH = path.resolve(process.cwd(), '.ultra-dex', 'chrome-agents.json');

export class ChromeAgentsClient {
  constructor(options = {}) {
    this.endpoint = options.endpoint || process.env.CHROME_AGENTS_URL || 'https://api.chrome-agents.local';
    this.apiKey = options.apiKey || process.env.CHROME_AGENTS_KEY || '';
  }

  async submitTask(task, options = {}) {
    const payload = {
      task,
      type: options.type || 'general',
      createdAt: new Date().toISOString()
    };
    await this.saveTask(payload);
    return { ok: true, id: `ca-${Date.now()}`, payload };
  }

  async saveTask(payload) {
    await fs.mkdir(path.dirname(CHROME_AGENT_PATH), { recursive: true });
    let data = { tasks: [] };
    try {
      data = JSON.parse(await fs.readFile(CHROME_AGENT_PATH, 'utf8'));
    } catch {
      // ignore
    }
    data.tasks.push(payload);
    await fs.writeFile(CHROME_AGENT_PATH, JSON.stringify(data, null, 2));
  }
}

export default ChromeAgentsClient;
