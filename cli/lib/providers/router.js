import fs from 'fs/promises';
import path from 'path';

const ROUTER_CONFIG = path.join(process.cwd(), 'router.json');

export async function loadRouterConfig() {
  try {
    const data = await fs.readFile(ROUTER_CONFIG, 'utf8');
    return JSON.parse(data);
  } catch {
    return {
      routes: {
        planning: 'claude-sonnet',
        coding: 'gpt-4',
        review: 'claude-opus',
        simple: 'ollama'
      }
    };
  }
}

export async function routeTask(taskType) {
  const config = await loadRouterConfig();
  return config.routes?.[taskType] || config.routes?.default || 'claude-sonnet';
}

export default { loadRouterConfig, routeTask };
