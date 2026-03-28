import { execSync } from 'node:child_process';
import { getInput, setFailed } from '@actions/core';

async function run() {
  try {
    const task = getInput('task') || 'Review code changes';
    const provider = getInput('provider') || 'openai';
    const model = getInput('model') || 'gpt-4o';
    const agents = getInput('agents') || 'code-reviewer';
    const configPath = getInput('config-path') || '.ultra-dex.json';
    const autoApprove = getInput('auto-approve') === 'true';
    const apiKey = getInput('api-key') || process.env.ULTRA_DEX_API_KEY;

    console.log(`🚀 Starting Ultra-Dex Action`);
    console.log(`📝 Task: ${task}`);
    console.log(`🤖 Agents: ${agents}`);
    console.log(`🧠 Provider: ${provider} (${model})`);

    // Construct the CLI command
    // Note: We're assuming 'ultra-dex' is available in the path or we use npx
    // In a real action, we might need to install it first or use a local path
    
    // We'll try to run it via npx to ensure we get the latest or local version
    let command = `npx -y @ultra-dex/cli run "${task}" --provider ${provider} --model ${model} --agents ${agents}`;
    
    if (configPath) {
      command += ` --config ${configPath}`;
    }
    
    if (autoApprove) {
      command += ` --yes`;
    }

    if (apiKey) {
      // Pass API key via env var to avoid logging it
      process.env.ULTRA_DEX_API_KEY = apiKey;
    }

    console.log(`Running: ${command}`);
    
    // Execute the command
    execSync(command, { 
      stdio: 'inherit',
      env: process.env 
    });

    console.log('✅ Ultra-Dex execution completed successfully');
  } catch (error) {
    setFailed(`Ultra-Dex execution failed: ${error.message}`);
  }
}

run();
