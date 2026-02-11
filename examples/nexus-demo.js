// Copyright (c) 2026 Ultra-Dex
/**
 * Ultra-Dex Nexus Autonomous Mode Demo
 * This script demonstrates the autonomous "Think-Act-Verify" loop
 */

import { nexus } from '../src/core/orchestration/index.js';
import chalk from 'chalk';

async function runDemo() {
  console.log(chalk.bold.magenta(`
🌌 Ultra-Dex Nexus: Autonomous Demo
`));
  
  const objective = "Create a simple Express server with a single GET /health endpoint that returns { status: 'ok' }. Save it to health-server.js and verify it works.";
  
  console.log(chalk.cyan(`Objective: ${objective}
`));
  
  try {
    const result = await nexus.execute(objective);
    
    console.log(chalk.bold.green(`
✅ Autonomous Objective Completed!`));
    console.log(chalk.gray('Final Result State:'), JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(chalk.bold.red(`
❌ Demo Failed:`), error.message);
    process.exit(1);
  }
}

runDemo();
