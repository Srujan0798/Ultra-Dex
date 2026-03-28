import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

// Get inputs from environment variables
const task = process.env.INPUT_TASK || '';
const provider = process.env.INPUT_PROVIDER || '';
const model = process.env.INPUT_MODEL || '';
const agents = process.env.INPUT_AGENTS || '';
const configPath = process.env.INPUT_CONFIG_PATH || '.ultra-dex.json';
const autoApprove = process.env.INPUT_AUTO_APPROVE === 'true';

// ... (rest of the logic)

console.log('Ultra-Dex Action started');
console.log(`Task: ${task}`);
console.log(`Provider: ${provider}`);
console.log(`Model: ${model}`);
console.log(`Agents: ${agents}`);

try {
  // Construct the command
  let command = `npx ultra-dex`;
  
  if (task) command += ` --task "${task}"`;
  if (provider) command += ` --provider "${provider}"`;
  if (model) command += ` --model "${model}"`;
  if (agents) command += ` --agents "${agents}"`;
  if (configPath) command += ` --config "${configPath}"`;
  if (autoApprove) command += ` --yes`;

  console.log(`Executing: ${command}`);
  
  execSync(command, { stdio: 'inherit' });
} catch (error) {
  console.error('Error executing Ultra-Dex:', error);
  process.exit(1);
}
