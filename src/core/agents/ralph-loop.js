// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Ralph Loop module
 * @module agents/ralph-loop
 */

import chalk from 'chalk';
import { printInfo, printWarning, printSuccess } from '../utils/output.js';
import { aiMetaLayer } from '../ai/ai-meta-layer.js';
import { verifyTask } from '../../../apps/cli/lib/quality/protocol-21.js';
import { createDockerSandbox } from '../../../apps/cli/lib/sandbox/docker.js';
import { ppmManager } from '../memory/manager.js';
import { codeValidator } from '../../services/security/validators.js';

const STATES = ['PLAN', 'ACT', 'VERIFY', 'RECOVER', 'COMMIT'];

export async function runAutonomousTask(objective, options = {}) {
  const sandbox = await createDockerSandbox({ enabled: options.sandbox !== false });
  
  const plan = async (ctx) => {
    printInfo(chalk.blue('🤖 Strategic Planning Phase'));
    
    const response = await aiMetaLayer.generateObject(
      options.model || 'claude-3-5-sonnet-20241022',
      [
        { role: 'system', content: 'You are an expert Architect. Break down the user objective into a sequence of atomic, actionable steps. Each step should be clear and implementable.' },
        { role: 'user', content: `Objective: ${objective}` }
      ],
      {
        steps: [
          { id: 'string', task: 'string', description: 'string' }
        ]
      }
    );

    ctx.objective = objective;
    ctx.steps = response.object.steps.map(s => ({ ...s, status: 'pending' }));
    
    await ppmManager.add({
      content: `Generated plan for: ${objective}`,
      type: 'decision',
      importance: 7,
      metadata: { steps: ctx.steps }
    });

    return ctx;
  };

  const act = async (ctx) => {
    const currentStep = ctx.steps.find(s => s.status === 'pending');
    if (!currentStep) return ctx;
    
    printInfo(chalk.blue(`🚀 Executing: ${currentStep.task}`));
    
    const response = await aiMetaLayer.call(
      options.model || 'gpt-4o-2024-11-20',
      [
        { role: 'system', content: 'You are an expert Backend Engineer. Generate the code required to complete the following step of the objective.' },
        { role: 'user', content: `Objective: ${ctx.objective}\nCurrent Step: ${currentStep.task}\nDescription: ${currentStep.description}` }
      ]
    );

    const generatedCode = response.text;
    
    // Security Validation
    const validation = codeValidator.validate(generatedCode);
    if (!validation.safe) {
      throw new Error(`Security violation in generated code: ${validation.reason}`);
    }

    const sandboxResult = await sandbox.execute(generatedCode, { runtime: 'node' });
    
    if (sandboxResult.success) {
      currentStep.status = 'completed';
      currentStep.result = sandboxResult.output;
      printSuccess(chalk.green(`✓ Step completed: ${currentStep.task}`));
    } else {
      currentStep.status = 'failed';
      currentStep.error = sandboxResult.error;
      printWarning(chalk.red(`✗ Step failed: ${currentStep.task} - ${sandboxResult.error}`));
      throw new Error(`Step failed: ${currentStep.error}`);
    }

    return ctx;
  };

  const verify = async (ctx) => {
    printInfo(chalk.blue('🔍 Verifying results with Protocol 21'));
    const p21Result = await verifyTask(ctx.objective);
    
    // Log the decision to cold memory
    await ppmManager.add({
      content: `Verified task: ${ctx.objective}`,
      type: 'decision',
      importance: 8,
      metadata: p21Result
    });
    
    return { ok: p21Result.passed, error: p21Result.passed ? null : 'Protocol 21 verification failed' };
  };

  const recover = async (ctx) => {
    printWarning(chalk.yellow('🛠️ Attempting autonomous recovery'));
    // Use an LLM to analyze the failure and adjust the plan
    const currentStep = ctx.steps.find(s => s.status === 'failed');
    
    const response = await aiMetaLayer.call(
      options.model || 'gpt-4o-2024-11-20',
      [
        { role: 'system', content: 'You are a Senior Debugger. Analyze the failure and provide a strategy to fix it.' },
        { role: 'user', content: `Objective: ${ctx.objective}\nFailed Step: ${currentStep?.task}\nError: ${currentStep?.error}` }
      ]
    );

    printInfo(chalk.cyan(`Recovery Strategy: ${response.text}`));
    if (currentStep) currentStep.status = 'pending'; // Reset for retry
    
    return ctx;
  };

  return await runRalphLoop({ plan, act, verify, recover, ...options });
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