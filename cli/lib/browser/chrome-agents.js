// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';
import { printWarning } from '../utils/output.js';

const CHROME_AGENT_PATH = path.resolve(process.cwd(), '.ultra-dex', 'chrome-agents.json');

export class ChromeAgentsClient {
  constructor(options = {}) {
    this.endpoint =
      options.endpoint || process.env.CHROME_AGENTS_URL || 'https://api.chrome-agents.local';
    this.apiKey = options.apiKey || process.env.CHROME_AGENTS_KEY || '';
  }

  async submitTask(task, options = {}) {
    const payload = {
      task,
      type: options.type || 'general',
      createdAt: new Date().toISOString(),
      metadata: options.metadata || {},
    };

    try {
      const response = await fetch(`${this.endpoint.replace(/\/$/, '')}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Chrome Agents API Error: ${response.status} ${errorBody}`);
      }

      const result = await response.json();
      return { ok: true, id: result.id || `ca-${Date.now()}`, payload: result };
    } catch (error) {
      if (options.localFallback === false) {
        throw error;
      }

      printWarning(
        `Chrome Agents API unavailable (${error.message}). Falling back to local queue.`
      );
      await this.saveTask(payload);
      return { ok: true, id: `ca-local-${Date.now()}`, payload, fallback: true };
    }
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
