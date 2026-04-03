// Copyright (c) 2026 Ultra-Dex

/**
 * ultra-dex run command
 * Execute agent tasks using v2.0 orchestration flow
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import {
  getDefaultProvider,
  checkConfiguredProviders,
  createProvider,
} from '../providers/index.js';
import { projectGraph } from '../mcp/graph.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { Orchestrator } from '../../../core/orchestration/orchestrator.js';
import { ExecutionEngine } from '../../../core/orchestration/execution-engine.js';
import { SmartAIRouter } from '../../../core/ai/router.js';
import { registerProvider } from '../../../core/ai/provider-registry.js';
import { AgentRegistry } from '../../../core/orchestration/registry.js';
import { ObservabilitySystem } from '../../../core/system/observability.js';
import { createMcpServer } from '../mcp/server.js';

async function readProjectContext() {
  const context = {};

  const planPromise = fs.readFile('IMPLEMENTATION-PLAN.md', 'utf8').catch(() => null);
  const contextPromise = fs.readFile('CONTEXT.md', 'utf8').catch(() => null);
  const statePromise = (async () => {
    try {
      return JSON.parse(await fs.readFile('.ultra/state.json', 'utf8'));
    } catch {
      try {
        return JSON.parse(await fs.readFile('.ultra-dex/state.json', 'utf8'));
      } catch {
        return null;
      }
    }
  })();

  // Graph Scan (God Mode)
  const graphPromise = (async () => {
    try {
      await projectGraph.scan();
      return projectGraph.getSummary();
    } catch (e) {
      return null;
    }
  })();

  const [plan, ctx, state, graph] = await Promise.all([
    planPromise,
    contextPromise,
    statePromise,
    graphPromise,
  ]);

  context.plan = plan;
  context.context = ctx;
  context.state = state;
  context.graph = graph;

  return context;
}

export function registerRunCommand(program) {
  program
    .command('run <agent>')
    .description('Execute an agent task automatically')
    .option('-t, --task <task>', 'Task to execute')
    .option('-p, --provider <provider>', 'AI provider')
    .option('-k, --key <apiKey>', 'API key')
    .option('-o, --output <file>', 'Output file')
    .option('--stream', 'Stream output in real-time')
    .option('--no-stream', 'Disable streaming')
    .option('--cache', 'Use response caching to reduce API costs')
    .action(async (agentName, options) => {
      try {
        const configured = checkConfiguredProviders();
        const hasProvider = configured.some((p) => p.configured) || options.key;

        if (!hasProvider) {
          printWarning('\n⚠️  No AI provider configured.\n');
          printInfo('To use AI agents, configure one of these:');
          printInfo('  export ANTHROPIC_API_KEY=sk-ant-...  # Claude');
          printInfo('  export OPENAI_API_KEY=sk-...         # OpenAI');
          printInfo('  export GOOGLE_AI_KEY=...             # Gemini');
          printInfo('  export NVIDIA_API_KEY=...            # NVIDIA (Free)');
          printInfo('\nOr use local AI with Ollama (no key needed):');
          printInfo('  ultra-dex run planner -t "task" --provider ollama\n');
          return;
        }

        let task = options.task;
        if (!task) {
          const { taskInput } = await inquirer.prompt([
            {
              type: 'input',
              name: 'taskInput',
              message: `Task for ${agentName}?`,
            },
          ]);
          task = taskInput;
        }

        const context = await readProjectContext();
        const providerId = options.provider || getDefaultProvider();

        // Initialize v2.0 components
        const provider = await createProvider(providerId, {
          apiKey: options.key,
          maxTokens: 8000,
        });

        // Register provider in the global registry
        registerProvider(providerId, provider);

        const aiRouter = new SmartAIRouter();

        const agentRegistry = new AgentRegistry();
        await agentRegistry.initialize();

        const observability = new ObservabilitySystem();
        await observability.initialize();

        const mcpServer = createMcpServer();

        const orchestrator = new Orchestrator({
          agentRegistry,
          traceCollector: observability,
        });

        const executionEngine = await new ExecutionEngine({
          aiRouter,
          agentRegistry,
          observability,
          mcpServer,
        }).initialize();

        // Phase 1: Orchestrate task into ExecutionTask
        printInfo(`Planning task execution with Orchestrator...`);
        let executionTask;
        try {
          executionTask = await orchestrator.orchestrate(task, 'simple', {
            agentId: agentName,
            context,
          });
        } catch (error) {
          printError(`Orchestration failed: ${error.message}`);
          throw error;
        }

        // Phase 2: Execute deterministically
        printInfo(`Executing task with ExecutionEngine...`);
        let result;
        try {
          result = await executionEngine.execute(executionTask);
        } catch (error) {
          printError(`Execution failed: ${error.message}`);
          throw error;
        }

        const finalOutput = result.results
          ? Object.values(result.results).join('\n\n')
          : 'Task completed successfully';

        if (options.output) {
          await fs.writeFile(options.output, finalOutput);
          printSuccess(`\n✅ Saved to ${options.output}`);
        }
      } catch (error) {
        printError(`Error in run command: ${error.message}`);
        process.exit(1);
      }
    });
}

export function registerSwarmCommand(program) {
  program
    .command('swarm <feature>')
    .description('Run a full agent swarm for a feature')
    .option('-p, --provider <provider>', 'AI provider')
    .option('-k, --key <apiKey>', 'API key')
    .action(async (feature, options) => {
      try {
        printInfo(chalk.cyan('\n🐝 Ultra-Dex Agent Swarm\n'));
        const context = await readProjectContext();
        const providerId = options.provider || getDefaultProvider();

        // Initialize v2.0 components for swarm
        const swarmProvider = await createProvider(providerId, {
          apiKey: options.key,
          maxTokens: 8000,
        });

        // Register provider in the global registry
        registerProvider(`${providerId}_swarm`, swarmProvider);

        const swarmAiRouter = new SmartAIRouter();

        const swarmAgentRegistry = new AgentRegistry();
        await swarmAgentRegistry.initialize();

        const swarmObservability = new ObservabilitySystem();
        await swarmObservability.initialize();

        const swarmMcpServer = createMcpServer();

        const swarmOrchestrator = new Orchestrator({
          agentRegistry: swarmAgentRegistry,
          traceCollector: swarmObservability,
        });

        const swarmExecutionEngine = await new ExecutionEngine({
          aiRouter: swarmAiRouter,
          agentRegistry: swarmAgentRegistry,
          observability: swarmObservability,
          mcpServer: swarmMcpServer,
        }).initialize();

        printInfo(chalk.bold('Step 1: 📋 @Planner breaking down feature...'));
        let planTask, planResult, plan;
        try {
          planTask = await swarmOrchestrator.orchestrate(feature, 'simple', {
            agentId: 'planner',
            context,
          });
          planResult = await swarmExecutionEngine.execute(planTask);
          plan = planResult.results ? Object.values(planResult.results).join('\n\n') : '';
        } catch (error) {
          printError(`Planning phase failed: ${error.message}`);
          throw error;
        }

        printInfo(chalk.bold('\nStep 2: 🏗️  @CTO reviewing architecture...'));
        try {
          const reviewTask = await swarmOrchestrator.orchestrate(
            `Review plan:\n${plan}`,
            'simple',
            {
              agentId: 'cto',
              context,
            }
          );
          await swarmExecutionEngine.execute(reviewTask);
        } catch (error) {
          printError(`Review phase failed: ${error.message}`);
          throw error;
        }
      } catch (error) {
        printError(`Error in swarm command: ${error.message}`);
        process.exit(1);
      }
    });
}

export default { registerRunCommand, registerSwarmCommand };
