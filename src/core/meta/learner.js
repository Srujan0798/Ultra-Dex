// Copyright (c) 2026 Ultra-Dex
import { ppmManager } from '../memory/manager.js';
import { aiMetaLayer } from '../ai/ai-meta-layer.js';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

/**
 * Learner Agent
 * Analyzes failed execution patterns to optimize the system.
 */
export class Learner {
  async selfOptimize() {
    console.log(chalk.magenta('🧠 Learner: Initiating Self-Optimization Cycle...'));
    
    // 1. Fetch failed observations from Cold Memory
    const failures = await ppmManager.search('failed', 10);
    if (failures.length === 0) return 'No failure patterns detected.';

    // 2. Generate Optimization Proposal
    const analysis = await aiMetaLayer.call(null, [
      { role: 'system', content: 'You are the Meta-Optimizer. Analyze these execution failures and suggest a prompt improvement for the specialized agents.' },
      { role: 'user', content: JSON.stringify(failures) }
    ]);

    // 3. Log to Decision Ledger
    await ppmManager.add({
      content: `Self-Optimization Proposal: ${analysis.text}`,
      type: 'decision',
      importance: 9
    });

    console.log(chalk.green('✅ Optimization proposal secured in Cold Memory.'));
    return analysis.text;
  }
}

export const learner = new Learner();

