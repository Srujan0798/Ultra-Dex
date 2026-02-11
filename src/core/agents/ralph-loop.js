// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Ralph Loop module
 * @module agents/ralph-loop
 */

import chalk from 'chalk';
import { printInfo, printWarning, printSuccess } from '../utils/output.js';

const STATES = ['PLAN', 'ACT', 'VERIFY', 'RECOVER', 'COMMIT'];

import { verifyTask } from '../../../apps/cli/lib/quality/protocol-21.js';
import { createDockerSandbox } from '../../../apps/cli/lib/sandbox/docker.js';
import { ppmManager } from '../memory/manager.js';

import { codeValidator } from '../../services/security/validators.js';

export async function runAutonomousTask(objective, options = {}) {
  const sandbox = await createDockerSandbox({ enabled: true });
  
  const plan = async (ctx) => {
    printInfo(chalk.blue('🤖 Strategic Planning Phase'));
    // Use CTO/Architect agents to generate sub-tasks
    ctx.objective = objective;
    ctx.steps = [
      { id: 'scaffold', task: 'Create file structure', status: 'pending' },
      { id: 'implement', task: 'Write core logic', status: 'pending' }
    ];
    return ctx;
  };

  const act = async (ctx) => {
    const currentStep = ctx.steps.find(s => s.status === 'pending');
    if (!currentStep) return ctx;
    
    printInfo(chalk.blue(`🚀 Executing: ${currentStep.task}`));
    
    // Simulate agent-generated code
    const generatedCode = 'console.log("Task executed")';
    
    // Security Validation
    const validation = codeValidator.validate(generatedCode);
    codeValidator.report(validation);
    
    if (!validation.safe) {
      throw new Error('Code execution blocked by security policy');
    }

    const sandboxResult = await sandbox.execute(generatedCode, { runtime: 'node' });
    currentStep.status = sandboxResult.success ? 'completed' : 'failed';
    return ctx;
  };

  const verify = async (ctx) => {
    const p21Result = await verifyTask(ctx.objective);
    // Log the decision to cold memory
    await ppmManager.add({
      content: `Verified task: ${ctx.objective}`,
      type: 'decision',
      importance: 8,
      metadata: p21Result
    });
    return { ok: p21Result.passed };
  };

  return await runRalphLoop({ plan, act, verify, ...options });
}

export async function runRalphLoop(options = {}) {
  const { plan, act, verify, recover, commit, maxRetries = 3 } = options;

  let state = 'PLAN';
  let retries = 0;
  let context = {};

  while (true) {
    switch (state) {
      case 'PLAN':
        printInfo(chalk.cyan('Ralph: Planning'));
        if (plan) context = await plan(context);
        state = 'ACT';
        break;
      case 'ACT':
        printInfo(chalk.cyan('Ralph: Acting'));
        if (act) context = await act(context);
        state = 'VERIFY';
        break;
      case 'VERIFY':
        printInfo(chalk.cyan('Ralph: Verifying'));
        if (verify) {
          const result = await verify(context);
          if (result?.ok) {
            state = 'COMMIT';
          } else {
            context.lastError = result?.error || 'Verification failed';
            state = 'RECOVER';
          }
        } else {
          state = 'COMMIT';
        }
        break;
      case 'RECOVER':
        retries += 1;
        printWarning(chalk.yellow(`Ralph: Recovering (attempt ${retries}/${maxRetries})`));
        if (recover) context = await recover(context);
        if (retries >= maxRetries) {
          throw new Error(
            `Ralph loop failed after ${maxRetries} retries: ${context.lastError || 'Unknown error'}`
          );
        }
        state = 'ACT';
        break;
      case 'COMMIT':
        printSuccess(chalk.green('Ralph: Committing'));
        if (commit) await commit(context);
        return context;
      default:
        throw new Error(`Unknown Ralph state: ${state}`);
    }
  }
}

export { STATES };