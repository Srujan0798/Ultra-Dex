const { execSync } = require('node:child_process');
const fs = require('fs');
const path = require('path');

try {
  // 1. Get Inputs
  const task = process.env.INPUT_TASK || 'Review the code';
  const provider = process.env.INPUT_PROVIDER || 'openai';
  const model = process.env.INPUT_MODEL || 'gpt-4o';
  const agents = process.env.INPUT_AGENTS || 'code-reviewer';
  const configPath = process.env['INPUT_CONFIG-PATH'] || '.ultra-dex.json';
  const apiKey = process.env['INPUT_API-KEY'];

  console.log('--- Ultra-Dex Action Started ---');
  console.log(`Task: ${task}`);
  console.log(`Provider: ${provider}`);
  console.log(`Agents: ${agents}`);

  // 2. Install CLI if not present
  // In a real action, we might use a pre-built docker image or install from npm
  // For this monorepo context, we assume we can run the local CLI or install it
  
  // Checking if we are in the repo
  if (fs.existsSync('package.json')) {
      console.log('Repo detected. Installing dependencies...');
      execSync('npm install --production', { stdio: 'inherit' });
  }

  // 3. Construct Command
  // Assuming 'ultra-dex' bin is available or we run via node
  // If we are in the monorepo, the CLI might be at apps/cli
  
  let cliPath = 'ultra-dex'; // Default if installed globally
  
  if (fs.existsSync('apps/cli/bin/ultra-dex.js')) {
      cliPath = 'node apps/cli/bin/ultra-dex.js';
  }

  const cmd = `${cliPath} run --provider ${provider} --model ${model} --agents ${agents} "${task}"`;
  
  console.log(`Executing: ${cmd}`);
  
  // 4. Run Command
  // We pass env vars through
  execSync(cmd, { 
      stdio: 'inherit',
      env: { ...process.env, OPENAI_API_KEY: apiKey || process.env.OPENAI_API_KEY }
  });

  console.log('--- Ultra-Dex Action Completed ---');

} catch (error) {
  console.error('Action failed:', error.message);
  process.exit(1);
}
