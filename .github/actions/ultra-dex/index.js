import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Get inputs from environment variables (set by GitHub Actions)
const inputs = {
  task: process.env.INPUT_TASK || '',
  provider: process.env.INPUT_PROVIDER || 'openai',
  model: process.env.INPUT_MODEL || 'gpt-4o',
  agents: process.env.INPUT_AGENTS || 'code-reviewer',
  configPath: process.env['INPUT_CONFIG-PATH'] || '.ultra-dex.json',
  autoApprove: process.env['INPUT_AUTO-APPROVE'] === 'true',
  githubToken: process.env['INPUT_GITHUB-TOKEN'],
  apiKey: process.env['INPUT_API-KEY']
};

console.log('Ultra-Dex Action Started');
console.log('Inputs:', { ...inputs, apiKey: '***', githubToken: '***' });

try {
  // Construct the command
  let command = `npx ultra-dex generate "${inputs.task}" --provider ${inputs.provider} --model ${inputs.model}`;

  if (inputs.agents) {
    command += ` --agents ${inputs.agents}`;
  }

  if (inputs.autoApprove) {
    command += ' --yes';
  }

  // Set environment variables for the child process
  const env = {
    ...process.env,
    GITHUB_TOKEN: inputs.githubToken,
    OPENAI_API_KEY: inputs.apiKey
  };

  console.log(`Executing: ${command}`);

  // Execute the command
  execSync(command, {
    stdio: 'inherit',
    env
  });

  console.log('Ultra-Dex Action Completed Successfully');
} catch (error) {
  console.error('Ultra-Dex Action Failed:', error.message);
  process.exit(1);
}
