import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get current directory for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  // Get inputs from environment variables (GitHub Actions sets these)
  const task = process.env.INPUT_TASK || 'Analyze code';
  const provider = process.env.INPUT_PROVIDER || 'openai';
  const model = process.env.INPUT_MODEL || 'gpt-4o';
  const agents = process.env.INPUT_AGENTS || 'code-reviewer';
  const configPath = process.env['INPUT_CONFIG-PATH'] || '.ultra-dex.json';
  const autoApprove = process.env['INPUT_AUTO-APPROVE'] === 'true';
  const apiKey = process.env['INPUT_API-KEY'] || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn('::warning::No API key provided. Some features may not work.');
  }

  console.log(`Starting Ultra-Dex Action...`);
  console.log(`Task: ${task}`);
  console.log(`Provider: ${provider}`);
  console.log(`Model: ${model}`);
  console.log(`Agents: ${agents}`);

  // Construct the CLI command
  // We assume the CLI is available in the repo or installed
  // For this action, we'll try to use the local CLI in the repo
  const cliPath = path.resolve(__dirname, '../../../apps/cli/bin/ultra-dex.js');
  
  // Build the command
  let cmd = `node "${cliPath}" run --task "${task}" --provider "${provider}" --model "${model}" --agents "${agents}" --non-interactive`;
  
  if (configPath) {
    cmd += ` --config "${configPath}"`;
  }
  
  if (autoApprove) {
    cmd += ` --yes`;
  }

  // Set environment variables for the child process
  const env = { 
    ...process.env,
    // Ensure API keys are passed through
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN
  };

  console.log(`Executing: ${cmd}`);
  
  // Execute the command
  execSync(cmd, { 
    stdio: 'inherit',
    env
  });

  console.log('Ultra-Dex Action completed successfully.');

} catch (error) {
  console.error('::error::Action failed:', error.message);
  process.exit(1);
}
