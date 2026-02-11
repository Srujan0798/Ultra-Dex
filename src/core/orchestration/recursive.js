// Copyright (c) 2026 Ultra-Dex
import { agentOrchestrator } from './index.js';
import chalk from 'chalk';

/**
 * Recursive Orchestrator
 * Allows the Nexus to handle infinite complexity by spawning sub-swarms.
 */
export class RecursiveOrchestrator {
  async decomposeAndExecute(objective, depth = 0) {
    if (depth > 5) throw new Error('Maximum recursion depth reached');
    
    console.log(chalk.cyan(`  ${'  '.repeat(depth)}↳ Decomposing: ${objective}`));
    
    // 1. Identify if the task is atomic or complex
    const analysis = await agentOrchestrator.executeTask(
      `Analyze if this task is ATOMIC or COMPLEX: ${objective}. Output ONLY 'ATOMIC' or 'COMPLEX'.`,
      { requiredCapabilities: ['analysis'] }
    );

    if (analysis.output.includes('ATOMIC')) {
      return await agentOrchestrator.executeTask(objective);
    }

    // 2. Complex task: Decompose into sub-objectives
    const subTasksResult = await agentOrchestrator.executeTask(
      `Break down this complex objective into a JSON array of sub-objectives: ${objective}`,
      { requiredCapabilities: ['planning'] }
    );

    let subTasks = [];
    try {
      const match = subTasksResult.output.match(/\[.*\]/s);
      subTasks = JSON.parse(match[0]);
    } catch {
      subTasks = [objective]; // Fallback to single task
    }

    // 3. Recursively execute sub-tasks
    const results = [];
    for (const subTask of subTasks) {
      results.push(await this.decomposeAndExecute(subTask, depth + 1));
    }

    return results;
  }
}

export const recursiveOrchestrator = new RecursiveOrchestrator();

