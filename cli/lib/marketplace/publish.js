import fs from 'fs/promises';
import path from 'path';
import { marketplaceClient } from './client.js';

export async function publishAgent(agentPath) {
  const content = await fs.readFile(agentPath, 'utf8');
  const payload = {
    name: path.basename(agentPath, path.extname(agentPath)),
    version: '1.0.0',
    systemPrompt: content
  };

  return marketplaceClient.submitAgent(payload);
}
