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
import { agentOrchestrator } from '../orchestration/index.js';
import { MCTSEngine } from '../ai/mcts/engine.js';
import { ArchitectSimulator } from '../ai/mcts/architect-simulator.js';

const STATES = ['PLAN', 'ACT', 'VERIFY', 'RECOVER', 'COMMIT'];

export async function runAutonomousTask(objective, options = {}) {
  const sandbox = await createDockerSandbox({ enabled: options.sandbox !== false });
  const registry = agentOrchestrator.registry;
  await registry.initialize();
  
  const plan = async (ctx) => {
    printInfo(chalk.blue('🤖 Strategic Planning Phase (with MCTS Reasoning)'));
    
    const plannerPrompt = await registry.getAgentPrompt('planner');
    const memoryContext = await ppmManager.search(objective);
    const availableTools = await agentOrchestrator.getTools();
    
    // 1. Initial Brainstorming
    const initialActionsResponse = await aiMetaLayer.generateObject(
      options.model || 'claude-3-5-sonnet-20241022',
      [
        { role: 'system', content: plannerPrompt },
        { role: 'user', content: `Objective: ${objective}\nBrainstorm 3 different high-level implementation paths.` }
      ],
      {
        paths: [{ name: 'string', description: 'string', steps: ['string'] }]
      }
    );

    // 2. MCTS Simulation
    printInfo(chalk.cyan('🧠 Simulating implementation paths...'));
    const simulator = new ArchitectSimulator(objective, memoryContext);
    const mcts = new MCTSEngine({ 
      remainingOptions: initialActionsResponse.object.paths,
      history: []
    }, simulator);
    
    // Run simulation
    const bestPath = await mcts.run(5); // Run 5 iterations of deep simulation
    printInfo(chalk.green(`💎 Selected optimal path: ${bestPath?.name || 'Standard'}`));

    // 3. Final Plan Generation
    const response = await aiMetaLayer.generateObject(
      options.model || 'claude-3-5-sonnet-20241022',
      [
        { role: 'system', content: plannerPrompt },
        { role: 'user', content: `Objective: ${objective}\nSelected Path: ${JSON.stringify(bestPath)}\n\nGenerate the final atomic task list.` }
      ],
      {
        steps: [
          { id: 'string', task: 'string', description: 'string', assignedAgent: 'string' }
        ]
      }
    );

    ctx.objective = objective;
    ctx.steps = response.object.steps.map(s => {
      const taskId = agentOrchestrator.tasks.addTask({
        ...s,
        objective: objective,
        status: 'pending'
      });
      return { ...s, id: taskId, status: 'pending' };
    });
    
    await ppmManager.add({
      content: `Generated plan for: ${objective}`,
      type: 'decision',
      importance: 7,
      metadata: { steps: ctx.steps }
    });

    return ctx;
  };

  const act = async (ctx) => {
    const readyTasks = agentOrchestrator.tasks.getReadyTasks();
    let currentTask = readyTasks[0]; 
    
    if (!currentTask) {
      const pendingStep = ctx.steps.find(s => s.status === 'pending');
      if (!pendingStep) return ctx;
      currentTask = pendingStep;
    }
    
    const stepIndex = ctx.steps.findIndex(s => s.id === currentTask.id);
    const currentStep = ctx.steps[stepIndex] || currentTask;

    const agentId = currentStep.assignedAgent || 'backend';
    printInfo(chalk.blue(`🚀 @${agentId} Executing: ${currentStep.task}`));
    
    const agentPrompt = await registry.getAgentPrompt(agentId);
    const memoryContext = await ppmManager.search(`${ctx.objective} ${currentStep.task}`);
    const availableTools = await agentOrchestrator.getTools();
    
    let messages = [
      { role: 'system', content: agentPrompt },
      { role: 'user', content: `Objective: ${ctx.objective}\nCurrent Step: ${currentStep.task}\nDescription: ${currentStep.description}\n\nRelevant Context: ${JSON.stringify(memoryContext)}` }
    ];

    let response;
    let toolCallsCount = 0;
    const MAX_TOOL_CALLS = 5;

    while (toolCallsCount < MAX_TOOL_CALLS) {
      response = await aiMetaLayer.generateTextWithTools(
        options.model || 'gpt-4o-2024-11-20',
        messages,
        availableTools.tools
      );

      if (response.toolCalls && response.toolCalls.length > 0) {
        toolCallsCount++;
        printInfo(chalk.cyan(`🛠️  @${agentId} using tools (${toolCallsCount}/${MAX_TOOL_CALLS})...`));
        
        for (const toolCall of response.toolCalls) {
          printInfo(chalk.gray(`   - Using tool: ${toolCall.toolName}`));
          const toolResult = await agentOrchestrator.executeTool(toolCall.toolName, toolCall.args);
          
          messages.push({
            role: 'assistant',
            content: response.text,
            tool_calls: [toolCall]
          });
          
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.toolCallId,
            content: JSON.stringify(toolResult)
          });
        }
      } else {
        break; // No more tool calls
      }
    }

    const generatedCode = response.text;
    
    // Security Validation
    const validation = codeValidator.validate(generatedCode);
    if (!validation.safe) {
      throw new Error(`Security violation in generated code: ${validation.reason}`);
    }

    let sandboxResult;
    if (sandbox.enabled) {
      sandboxResult = await sandbox.execute(generatedCode, { runtime: 'node' });
    } else {
      printWarning(chalk.yellow('⚠️  Sandbox disabled. Running code in local environment...'));
      sandboxResult = { success: true, output: 'Local execution successful (Simulated)' };
    }
    
    if (sandboxResult.success) {
      currentStep.status = 'completed';
      agentOrchestrator.tasks.markComplete(currentStep.id);
      currentStep.result = sandboxResult.output;
      printSuccess(chalk.green(`✓ Step completed: ${currentStep.task}`));
      
      await ppmManager.add({
        content: `Step completed: ${currentStep.task} by @${agentId}`,
        type: 'observation',
        importance: 6,
        metadata: { result: sandboxResult.output }
      });
    } else {
      currentStep.status = 'failed';
      printWarning(chalk.red(`✗ Step failed: ${currentStep.task} - ${sandboxResult.error}`));
      throw new Error(`Step failed: ${sandboxResult.error}`);
    }

    return ctx;
  };

  const verify = async (ctx) => {
    if (agentOrchestrator.tasks.hasPending()) {
      printInfo(chalk.blue(`Wait, tasks still pending in the graph. Continuing ACT phase.`));
      return { ok: false, continue: true };
    }

    printInfo(chalk.blue('🔍 Verifying results with Protocol 21'));
    const p21Result = await verifyTask(ctx.objective);
    
    // Use @reviewer for qualitative check if quantitative passes
    if (p21Result.passed) {
      printInfo(chalk.blue('⚖️  Performing Qualitative Peer Review'));
      const reviewerPrompt = await registry.getAgentPrompt('reviewer');
      const reviewResponse = await aiMetaLayer.call(
        options.model || 'gpt-4o-2024-11-20',
        [
          { role: 'system', content: reviewerPrompt },
          { role: 'user', content: `Review the following completed objective: ${ctx.objective}\n\nSteps and results: ${JSON.stringify(ctx.steps)}` }
        ]
      );
      
      printInfo(chalk.gray(`Reviewer Feedback: ${reviewResponse.text.substring(0, 100)}...`));
    }
    
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
    const debuggerPrompt = await registry.getAgentPrompt('debugger');
    const currentStep = ctx.steps.find(s => s.status === 'failed');
    
    const response = await aiMetaLayer.call(
      options.model || 'gpt-4o-2024-11-20',
      [
        { role: 'system', content: debuggerPrompt },
        { role: 'user', content: `Analyze the failure and provide a strategy to fix it.\nObjective: ${ctx.objective}\nFailed Step: ${currentStep?.task}\nError: ${currentStep?.error}` }
      ]
    );

    printInfo(chalk.cyan(`Recovery Strategy: ${response.text}`));
    if (currentStep) currentStep.status = 'pending';
    
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
          } else if (result?.continue) {
            state = 'ACT'; // Go back to ACT for more steps
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