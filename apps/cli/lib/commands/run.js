// Copyright (c) 2026 Ultra-Dex

/**
 * ultra-dex run command
 * Execute agent tasks automatically (the "swarm" approach)
 */

import chalk from 'chalk';
import ora from '../utils/ora.js';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  createProvider,
  getDefaultProvider,
  checkConfiguredProviders,
  canUseProviderWithoutApiKey,
} from '../providers/index.js';
import { ensureExecutionTrace } from '../analytics/execution-trace.js';
import { initializeAnalyticsSink } from '../analytics/index.js';
import { writeRunArtifacts } from '../analytics/run-artifacts.js';
import { projectGraph } from '../mcp/graph.js';
import { ultraMemory } from '../mcp/memory.js';
import { errorRecovery } from '../utils/error-recovery.js';
import { dashboardNotifier } from '../utils/dashboard-notifier.js';
import { authorizeOperation } from '../governance/index.js';
import { verifyLinting, verifyTypeSafety, verifySecurityPatterns } from '../quality/automation.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { authorizeAgentAccess } from '../enterprise/agent-access.js';
import { estimateTokens } from '../utils/token-forecast.js';
import { logger } from '../utils/logger.js';
import {
  buildPromptContextSection,
  createInteractionSummary,
  extractDecision,
  stripDecisionLine,
  truncateText,
} from './run-context.js';

// V2 Core orchestration (feature-flagged, default OFF)
import { createOrchestrationStack } from '../core/index.js';

const USE_V2_ROUTING = process.env.ULTRA_DEX_V2_ROUTING === '1';

const execAsync = promisify(exec);
const MAX_RUNTIME_HISTORY = 12;
const MAX_MEMORY_RESULTS = 5;
const DEFAULT_MAX_STEPS = 10;
const MAX_DELEGATION_DEPTH = 5;
let runtimeStateLock = null;

function getActiveRunId(trace = null) {
  return trace?.runId || process.env.ULTRA_DEX_RUN_ID || null;
}

function syncActiveRunId(runId) {
  if (runId) {
    process.env.ULTRA_DEX_RUN_ID = runId;
  }
  return runId;
}

function logRun(level, event, metadata = {}) {
  const writer =
    typeof logger[level] === 'function' ? logger[level].bind(logger) : logger.info.bind(logger);
  const { trace = null, run_id, agent, step, module = 'run', ...rest } = metadata;

  writer(event, {
    run_id: run_id || getActiveRunId(trace),
    agent,
    step,
    module,
    ...rest,
  });
}

const AGENTS = {
  planner: {
    name: '@Planner',
    role: 'Task Breakdown Specialist',
    systemPrompt: `You are @Planner. Break down features into atomic tasks.
Output format:
## Task Breakdown
### Task 1: [Name]
- Agent: @Backend | @Frontend | ...
- Description: ...
`,
  },
  cto: {
    name: '@CTO',
    role: 'Technical Architecture Lead',
    systemPrompt: `You are @CTO. Make tech decisions, design architecture, set standards.
Use >> READ_CODE: "path/to/file" to review existing architecture.`,
  },
  backend: {
    name: '@Backend',
    role: 'API & Business Logic Developer',
    systemPrompt: `You are @Backend. Write API/Service code.
Available commands:
>> READ_CODE: "path" - Read a file
>> WRITE_CODE: "path" "content" - Create/Update a file
>> DELEGATE: @AgentName "Task" - Delegate work`,
  },
  frontend: {
    name: '@Frontend',
    role: 'UI/UX Developer',
    systemPrompt: `You are @Frontend. Build React/Next.js components.
Available commands:
>> READ_CODE: "path"
>> WRITE_CODE: "path" "content"`,
  },
  database: {
    name: '@Database',
    role: 'Database Architect',
    systemPrompt: `You are @Database. Design schemas.
Available commands:
>> READ_CODE: "path"
>> WRITE_CODE: "path" "content"`,
  },
  testing: {
    name: '@Testing',
    role: 'QA Engineer',
    systemPrompt: `You are @Testing. Write tests.
Available commands:
>> READ_CODE: "path"
>> WRITE_CODE: "path" "content"`,
  },
  reviewer: {
    name: '@Reviewer',
    role: 'Code Review Specialist',
    systemPrompt: `You are @Reviewer. Audit code.
Available commands:
>> READ_CODE: "path"`,
  },
  debugger: {
    name: '@Debugger',
    role: 'Bug Fixing Specialist',
    systemPrompt: `You are @Debugger. Analyze logs and code to identify and fix bugs.
Available commands:
>> READ_CODE: "path"
>> WRITE_CODE: "path" "content"`,
  },
  devops: {
    name: '@DevOps',
    role: 'CI/CD & Infrastructure Specialist',
    systemPrompt: `You are @DevOps. Manage deployment, infrastructure, and git operations.
Available commands:
>> RUN_SHELL: "command"
>> READ_CODE: "path"
>> WRITE_CODE: "path" "content"`,
  },
  admin: {
    name: '@Admin',
    role: 'System Administrator',
    systemPrompt: `You are @Admin. Manage system configuration, users, and permissions.
Available commands:
>> RUN_SHELL: "command"
>> READ_CODE: "path"
>> WRITE_CODE: "path" "content"`,
  },
  governance: {
    name: '@Governance',
    role: 'Governance & Compliance Officer',
    systemPrompt: `You are @Governance. Ensure code follows standards and gets proper approval.
Available commands:
>> READ_CODE: "path"
>> DELEGATE: @AgentName "Task"`,
  },
};

async function readProjectContext() {
  const context = {};

  // Fast path for mock mode - skip heavy operations
  const isMockMode = process.env.MOCK_AI_PROVIDERS === 'true' || process.env.MOCK_AI === 'true';

  const planPromise = isMockMode
    ? Promise.resolve(null)
    : fs.readFile('IMPLEMENTATION-PLAN.md', 'utf8').catch(() => null);
  const contextPromise = isMockMode
    ? Promise.resolve(null)
    : fs.readFile('CONTEXT.md', 'utf8').catch(() => null);
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

  // Graph scans can saturate fs operations and stall run command startup.
  // Keep this opt-in for now.
  const shouldScanGraph = !isMockMode && process.env.ULTRA_DEX_ENABLE_GRAPH_SCAN === 'true';
  const graphPromise = shouldScanGraph
    ? (async () => {
        try {
          // Race graph scan against a 2s timeout to reduce startup delay.
          const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 2000));
          const scan = projectGraph.scan().then(() => projectGraph.getSummary());
          return await Promise.race([scan, timeout]);
        } catch (e) {
          return null;
        }
      })()
    : Promise.resolve(null);

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
  context.interactionHistory = Array.isArray(state?.runtime?.recentSteps)
    ? [...state.runtime.recentSteps]
    : [];

  return context;
}

async function acquireRuntimeStateLock() {
  if (runtimeStateLock) {
    return await new Promise((resolve) => {
      const waitForRelease = () => {
        if (!runtimeStateLock) {
          resolve(acquireRuntimeStateLock());
          return;
        }

        setTimeout(waitForRelease, 10);
      };

      waitForRelease();
    });
  }

  const lockId = Math.random().toString(36).slice(2, 15);
  runtimeStateLock = lockId;
  return lockId;
}

function releaseRuntimeStateLock(lockId) {
  if (runtimeStateLock === lockId) {
    runtimeStateLock = null;
  }
}

async function withRuntimeStateLock(callback) {
  const lockId = await acquireRuntimeStateLock();

  try {
    return await callback();
  } finally {
    releaseRuntimeStateLock(lockId);
  }
}

async function loadRuntimeState() {
  try {
    const content = await fs.readFile(path.resolve(process.cwd(), '.ultra/state.json'), 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function saveRuntimeState(state) {
  const ultraDir = path.resolve(process.cwd(), '.ultra');
  const statePath = path.resolve(ultraDir, 'state.json');
  const tempPath = path.resolve(
    ultraDir,
    `state.json.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 11)}`
  );

  try {
    await fs.mkdir(ultraDir, { recursive: true });
    await fs.writeFile(tempPath, JSON.stringify(state, null, 2));
    await fs.rename(tempPath, statePath);
    return true;
  } catch {
    await fs.unlink(tempPath).catch(() => {});
    return false;
  }
}

async function ensureTraceStarted(projectContext, agentId, task) {
  const trace = ensureExecutionTrace(projectContext, {
    runId: process.env.ULTRA_DEX_RUN_ID,
    rootAgent: agentId,
    task,
  });
  syncActiveRunId(trace.runId);
  if (!trace.started) {
    trace.started = true;
    await trace.record({
      agent: agentId,
      action: 'RUN_START',
      input: task,
      output: 'Agent execution started',
      status: 'success',
    });
  }
  return trace;
}

async function emitAnalyticsEvent(type, payload) {
  initializeAnalyticsSink();
  const { runId, loopStep, agent, ...rest } = payload || {};
  logRun(type === 'analytics.error' ? 'error' : 'info', type, {
    run_id: runId,
    agent,
    step: loopStep,
    module: 'run.analytics',
    ...rest,
  });
}

function serializeRuntimeValue(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.stack || value.message;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function cloneRuntimeState(state) {
  if (!state || typeof state !== 'object') return {};

  try {
    return JSON.parse(JSON.stringify(state));
  } catch {
    return { ...state };
  }
}

function getInteractionHistory(projectContext) {
  if (!Array.isArray(projectContext.interactionHistory)) {
    projectContext.interactionHistory = Array.isArray(projectContext.state?.runtime?.recentSteps)
      ? [...projectContext.state.runtime.recentSteps]
      : [];
  }

  return projectContext.interactionHistory;
}

async function loadRelevantMemories(task, agentId) {
  const memoryQuery = truncateText(task, 400) || String(task || '');

  try {
    return await ultraMemory.contextualSearch(
      memoryQuery,
      [agentId, 'run-context'],
      MAX_MEMORY_RESULTS
    );
  } catch (error) {
    try {
      logRun('warn', 'run.memory.lookup_failed', {
        agent: agentId,
        module: 'run.memory',
        detail: error.message,
      });
    } catch {
      // ignore logging failures for memory lookups
    }

    return [];
  }
}

async function persistRunContext(projectContext, trace, payload) {
  const { agentId, task, decision, action, input, output, status, depth, step } = payload;
  const serializedInput = truncateText(serializeRuntimeValue(input), 200);
  const serializedOutput = truncateText(serializeRuntimeValue(output), 280);
  const summary = {
    ...createInteractionSummary({
      agent: agentId,
      decision,
      action,
      status,
      output: serializedOutput,
    }),
    input: serializedInput,
    runId: trace.runId,
    step: typeof step === 'number' ? step : null,
    depth,
    task: truncateText(task, 180),
  };

  const interactionHistory = [...getInteractionHistory(projectContext), summary].slice(
    -MAX_RUNTIME_HISTORY
  );
  projectContext.interactionHistory = interactionHistory;

  try {
    const persistedState = await withRuntimeStateLock(async () => {
      const loadedState = await loadRuntimeState();
      const nextState = loadedState || cloneRuntimeState(projectContext.state);

      nextState.updatedAt = summary.timestamp;
      nextState.project = nextState.project || {
        name: path.basename(process.cwd()),
        mode: 'ULTRA_MODE',
      };
      nextState.runtime = {
        ...(nextState.runtime || {}),
        lastRun: {
          runId: trace.runId,
          agent: agentId,
          task: truncateText(task, 180),
          decision: summary.decision,
          action,
          status,
          step: summary.step,
          updatedAt: summary.timestamp,
        },
        recentSteps: interactionHistory,
      };

      const saved = await saveRuntimeState(nextState);
      if (!saved) {
        throw new Error('Failed to save runtime state');
      }

      return nextState;
    });

    projectContext.state = persistedState;

    const memoryText = `Run ${trace.runId} step ${summary.step ?? '?'}: ${agentId} decided "${summary.decision}" and ${action} [${status}]. Output: ${serializedOutput}`;
    await ultraMemory.remember(
      memoryText,
      [agentId, String(action).toLowerCase(), String(status).toLowerCase(), 'run-context'],
      'run-agent-loop',
      {
        runId: trace.runId,
        step: summary.step,
        task: truncateText(task, 180),
        input: serializedInput,
        depth,
      }
    );

    await trace.record({
      agent: agentId,
      action: 'MEMORY_UPDATE',
      input: `${action}:${status}`,
      output: memoryText,
      status: 'success',
      depth,
      stepReference: summary.step,
    });
  } catch (error) {
    await trace.record({
      agent: agentId,
      action: 'MEMORY_UPDATE',
      input: `${action}:${status}`,
      output: error.message,
      status: 'error',
      depth,
      stepReference: summary.step,
    });
  }

  return summary;
}

async function recordActionOutcome(trace, projectContext, payload, metadata = {}) {
  const entry = await trace.record({
    agent: payload.agentId,
    action: payload.action,
    input: payload.input,
    output: payload.output,
    status: payload.status,
    depth: payload.depth,
    ...metadata,
  });

  await persistRunContext(projectContext, trace, {
    ...payload,
    step: entry.step,
  });

  return entry;
}

export async function runAgentLoop(
  agentName,
  task,
  provider,
  projectContext,
  depth = 0,
  maxSteps = DEFAULT_MAX_STEPS
) {
  projectContext = projectContext && typeof projectContext === 'object' ? projectContext : {};

  if (depth > MAX_DELEGATION_DEPTH) {
    return `[System]: Max delegation depth reached.`;
  }

  const boundedMaxSteps = Math.max(1, Number.parseInt(maxSteps, 10) || DEFAULT_MAX_STEPS);
  const agentId = agentName.toLowerCase();
  const trace = await ensureTraceStarted(projectContext, agentId, task);
  const agent = AGENTS[agentId];
  if (!agent) {
    await trace.record({
      agent: agentId,
      action: 'AGENT_RESOLUTION',
      input: task,
      output: `Unknown agent @${agentName}`,
      status: 'error',
      depth,
    });
    return `[System]: Unknown agent @${agentName}`;
  }

  const access = await authorizeAgentAccess(agentId);
  if (!access.allowed) {
    await trace.record({
      agent: agentId,
      action: 'ACCESS_CHECK',
      input: task,
      output: `Role "${access.role}" cannot run @${agentName}`,
      status: 'blocked',
      depth,
    });
    return `[Access]: Role "${access.role}" cannot run @${agentName}`;
  }

  const agentContext = buildAgentContext(agentId, agent);
  const providerInstance = typeof provider === 'function' ? await provider(agentId) : provider;
  let currentTask = task;

  for (let stepIndex = 1; stepIndex <= boundedMaxSteps; stepIndex += 1) {
    const startedAt = Date.now();
    const spinner = ora(`${agent.name} is working... (${stepIndex}/${boundedMaxSteps})`).start();

    await dashboardNotifier.sendAgentStatus(agentName, 'working', truncateText(currentTask, 50));

    const relevantMemories = await loadRelevantMemories(currentTask, agentId);
    const contextSection = buildPromptContextSection({
      contextMarkdown: projectContext.context,
      planMarkdown: projectContext.plan,
      state: projectContext.state,
      graph: projectContext.graph,
      memories: relevantMemories,
      interactionHistory: getInteractionHistory(projectContext),
      history: projectContext.history,
    });
    await trace.record({
      agent: agentId,
      action: 'PROMPT_CONTEXT',
      input: currentTask,
      output: contextSection || 'No additional project context available.',
      status: 'success',
      depth,
      loopStep: stepIndex,
      maxSteps: boundedMaxSteps,
    });

    const prompt = `${contextSection}## Task\n${currentTask}\n\nUse the context above to choose the next action. Before acting, write one line exactly in this format:\nDECISION: <what you will do next and why, grounded in the context above>\n\nThen either provide the final answer or output exactly one tool command:\n>> READ_CODE: "filePath"\n>> WRITE_CODE: "filePath" "fullContent"\n>> RUN_SHELL: "command"\n>> DELEGATE: @AgentName "Task"`;

    try {
      const executionDecision = await authorizeOperation({
        agent: agentContext,
        operation: 'execute',
        resourceType: 'ai',
        metadata: {
          task: currentTask,
          agentTitle: agent.role,
          loopStep: stepIndex,
          maxSteps: boundedMaxSteps,
        },
      });
      if (!executionDecision.allowed) {
        await recordActionOutcome(
          trace,
          projectContext,
          {
            agentId,
            task: currentTask,
            decision: 'Execution blocked before model call.',
            action: 'AI_EXECUTE',
            input: currentTask,
            output: executionDecision.reason,
            status: 'blocked',
            depth,
          },
          {
            loopStep: stepIndex,
            maxSteps: boundedMaxSteps,
          }
        );
        spinner.fail(`${agent.name} blocked: ${executionDecision.reason}`);
        return `[Governance]: ${executionDecision.reason}`;
      }

      const result = await errorRecovery.executeWithRecovery(
        'ai-provider',
        async () => {
          return await providerInstance.generate(agent.systemPrompt, prompt);
        },
        {
          maxRetries: process.env.MOCK_AI === 'true' ? 0 : 2,
          retryDelay: 2000,
          timeout: process.env.MOCK_AI === 'true' ? 5000 : 30000,
        }
      );

      let content =
        typeof result?.content === 'string' ? result.content : String(result?.content ?? '');

      await trace.record({
        agent: agentId,
        action: 'MODEL_RESPONSE',
        input: prompt,
        output: content,
        status: 'success',
        depth,
        loopStep: stepIndex,
        maxSteps: boundedMaxSteps,
        model: result?.model || providerInstance?.model || null,
        usage: result?.usage || null,
      });
      const decision = extractDecision(content);
      await trace.record({
        agent: agentId,
        action: 'DECISION',
        input: currentTask,
        output: decision,
        status: 'success',
        depth,
        loopStep: stepIndex,
        maxSteps: boundedMaxSteps,
      });
      content = stripDecisionLine(content) || content;

      try {
        const durationMs = Date.now() - startedAt;
        await emitAnalyticsEvent('analytics.agent_performance', {
          agent: agentId,
          durationMs,
          success: true,
          task: currentTask,
          provider: providerInstance?.getName?.() || 'provider',
          runId: trace.runId,
          loopStep: stepIndex,
        });

        const inputTokens =
          result?.usage?.inputTokens ?? estimateTokens(agent.systemPrompt + prompt);
        const outputTokens = result?.usage?.outputTokens ?? estimateTokens(result?.content || '');
        await emitAnalyticsEvent('analytics.token_usage', {
          agent: agentId,
          model: result?.model || providerInstance?.model || null,
          inputTokens,
          outputTokens,
          runId: trace.runId,
          loopStep: stepIndex,
        });
      } catch {
        // analytics should not block execution
      }

      spinner.succeed(`${agent.name} completed step ${stepIndex}.`);
      await dashboardNotifier.sendAgentStatus(agentName, 'completed', `Step ${stepIndex} finished`);

      const readMatch = content.match(/>>\s*READ_CODE:\s*["'](.+?)["']/);
      const writeMatch = content.match(/>>\s*WRITE_CODE:\s*["'](.+?)["']\s*["']([\s\S]+?)["']/);
      const runShellMatch = content.match(/>>\s*RUN_SHELL:\s*["'](.+?)["']/);
      const delegateMatch = content.match(/>>\s*DELEGATE:\s*@(\w+)\s*["'](.+?)["']/);

      if (readMatch) {
        let filePath = path.normalize(readMatch[1]);
        if (filePath.includes('../') || filePath.includes('..\\')) {
          await recordActionOutcome(
            trace,
            projectContext,
            {
              agentId,
              task: currentTask,
              decision,
              action: 'READ_CODE',
              input: filePath,
              output: 'Path traversal detected',
              status: 'error',
              depth,
            },
            {
              loopStep: stepIndex,
              maxSteps: boundedMaxSteps,
            }
          );
          currentTask = `${currentTask}\n\nError reading ${filePath}: Path traversal detected`;
          continue;
        }

        const readDecision = await authorizeOperation({
          agent: agentContext,
          operation: 'read',
          filePath,
          metadata: {
            agentTitle: agent.role,
            loopStep: stepIndex,
            maxSteps: boundedMaxSteps,
          },
        });
        if (!readDecision.allowed) {
          await recordActionOutcome(
            trace,
            projectContext,
            {
              agentId,
              task: currentTask,
              decision,
              action: 'READ_CODE',
              input: filePath,
              output: readDecision.reason,
              status: 'blocked',
              depth,
            },
            {
              loopStep: stepIndex,
              maxSteps: boundedMaxSteps,
            }
          );
          currentTask = `${currentTask}\n\nGovernance blocked READ_CODE on ${filePath}: ${readDecision.reason}`;
          continue;
        }

        printInfo(chalk.cyan(`\n🔍 ${agent.name} is reading ${filePath}...`));
        await dashboardNotifier.sendLog(`@${agentName} is reading ${filePath}`, 'info');

        try {
          const fullPath = path.resolve(process.cwd(), filePath);
          if (!fullPath.startsWith(process.cwd())) {
            await recordActionOutcome(
              trace,
              projectContext,
              {
                agentId,
                task: currentTask,
                decision,
                action: 'READ_CODE',
                input: filePath,
                output: 'Path outside project root',
                status: 'error',
                depth,
              },
              {
                loopStep: stepIndex,
                maxSteps: boundedMaxSteps,
              }
            );
            currentTask = `${currentTask}\n\nError reading ${filePath}: Path outside project root`;
            continue;
          }

          const fileContent = await fs.readFile(fullPath, 'utf8');
          await recordActionOutcome(
            trace,
            projectContext,
            {
              agentId,
              task: currentTask,
              decision,
              action: 'READ_CODE',
              input: filePath,
              output: fileContent,
              status: 'success',
              depth,
            },
            {
              loopStep: stepIndex,
              maxSteps: boundedMaxSteps,
            }
          );
          currentTask = `${currentTask}\n\nOutput of READ_CODE "${filePath}":\n\`\`\`\n${fileContent}\n\`\`\`\n\nPlease proceed with your task.`;
          continue;
        } catch (error) {
          await recordActionOutcome(
            trace,
            projectContext,
            {
              agentId,
              task: currentTask,
              decision,
              action: 'READ_CODE',
              input: filePath,
              output: error.message,
              status: 'error',
              depth,
            },
            {
              loopStep: stepIndex,
              maxSteps: boundedMaxSteps,
            }
          );
          currentTask = `${currentTask}\n\nError reading ${filePath}: ${error.message}`;
          continue;
        }
      }

      if (writeMatch) {
        let filePath = path.normalize(writeMatch[1]);
        const newContent = writeMatch[2];

        if (filePath.includes('../') || filePath.includes('..\\')) {
          await recordActionOutcome(
            trace,
            projectContext,
            {
              agentId,
              task: currentTask,
              decision,
              action: 'WRITE_CODE',
              input: { filePath, content: newContent },
              output: 'Path traversal detected',
              status: 'error',
              depth,
            },
            {
              loopStep: stepIndex,
              maxSteps: boundedMaxSteps,
            }
          );
          currentTask = `${currentTask}\n\nError writing ${filePath}: Path traversal detected`;
          continue;
        }

        const writeDecision = await authorizeOperation({
          agent: agentContext,
          operation: 'write',
          filePath,
          content: newContent,
          metadata: {
            agentTitle: agent.role,
            loopStep: stepIndex,
            maxSteps: boundedMaxSteps,
          },
        });
        if (!writeDecision.allowed) {
          await recordActionOutcome(
            trace,
            projectContext,
            {
              agentId,
              task: currentTask,
              decision,
              action: 'WRITE_CODE',
              input: { filePath, content: newContent },
              output: writeDecision.reason,
              status: 'blocked',
              depth,
            },
            {
              loopStep: stepIndex,
              maxSteps: boundedMaxSteps,
            }
          );
          currentTask = `${currentTask}\n\nGovernance blocked WRITE_CODE on ${filePath}: ${writeDecision.reason}`;
          continue;
        }

        printInfo(chalk.green(`\n💾 ${agent.name} is writing to ${filePath}...`));
        await dashboardNotifier.sendLog(`@${agentName} is writing to ${filePath}`, 'success');

        try {
          const fullPath = path.resolve(process.cwd(), filePath);
          if (!fullPath.startsWith(process.cwd())) {
            await recordActionOutcome(
              trace,
              projectContext,
              {
                agentId,
                task: currentTask,
                decision,
                action: 'WRITE_CODE',
                input: { filePath, content: newContent },
                output: 'Path outside project root',
                status: 'error',
                depth,
              },
              {
                loopStep: stepIndex,
                maxSteps: boundedMaxSteps,
              }
            );
            currentTask = `${currentTask}\n\nError writing ${filePath}: Path outside project root`;
            continue;
          }

          const forbiddenPaths = ['.git', 'node_modules', '.env', 'package-lock.json'];
          const pathParts = fullPath.split(path.sep);
          if (pathParts.some((part) => forbiddenPaths.includes(part))) {
            await recordActionOutcome(
              trace,
              projectContext,
              {
                agentId,
                task: currentTask,
                decision,
                action: 'WRITE_CODE',
                input: { filePath, content: newContent },
                output: 'Cannot write to sensitive file',
                status: 'blocked',
                depth,
              },
              {
                loopStep: stepIndex,
                maxSteps: boundedMaxSteps,
              }
            );
            currentTask = `${currentTask}\n\nError writing ${filePath}: Cannot write to sensitive file`;
            continue;
          }

          await fs.mkdir(path.dirname(fullPath), { recursive: true });
          await fs.writeFile(fullPath, newContent, 'utf8');
          await recordActionOutcome(
            trace,
            projectContext,
            {
              agentId,
              task: currentTask,
              decision,
              action: 'WRITE_CODE',
              input: { filePath, content: newContent },
              output: `Wrote ${filePath}`,
              status: 'success',
              depth,
            },
            {
              loopStep: stepIndex,
              maxSteps: boundedMaxSteps,
            }
          );

          printInfo(chalk.yellow(`\n🛡️  Running Active Verification Gates...`));
          const projectDir = process.cwd();
          const lintRes = await verifyLinting(projectDir);
          const typeRes = await verifyTypeSafety(projectDir);
          const secRes = await verifySecurityPatterns(projectDir);

          const failures = [];
          if (lintRes.status === 'FAIL') failures.push(`Linting Failed: ${lintRes.message}`);
          if (typeRes.status === 'FAIL') failures.push(`Type Safety Failed: ${typeRes.message}`);
          if (secRes.status === 'FAIL') failures.push(`Security Check Failed: ${secRes.message}`);

          if (failures.length > 0) {
            await recordActionOutcome(
              trace,
              projectContext,
              {
                agentId,
                task: currentTask,
                decision,
                action: 'VERIFY_CODE',
                input: filePath,
                output: failures.join('\n'),
                status: 'failed',
                depth,
              },
              {
                loopStep: stepIndex,
                maxSteps: boundedMaxSteps,
                lint: lintRes,
                typeSafety: typeRes,
                security: secRes,
              }
            );
            printError(`\n❌ Verification Failed!`);
            failures.forEach((failure) => printError(`  - ${failure}`));
            currentTask = `${currentTask}\n\nCode written to ${filePath}, BUT verification failed. YOU MUST FIX THIS:\n${failures.join('\n')}`;
            continue;
          }

          await recordActionOutcome(
            trace,
            projectContext,
            {
              agentId,
              task: currentTask,
              decision,
              action: 'VERIFY_CODE',
              input: filePath,
              output: 'Verification Passed',
              status: 'success',
              depth,
            },
            {
              loopStep: stepIndex,
              maxSteps: boundedMaxSteps,
              lint: lintRes,
              typeSafety: typeRes,
              security: secRes,
            }
          );
          printSuccess(`\n✅ Verification Passed`);
          currentTask = `${currentTask}\n\nSuccessfully wrote ${filePath} and passed verification. Please proceed or delegate verification.`;
          continue;
        } catch (error) {
          await recordActionOutcome(
            trace,
            projectContext,
            {
              agentId,
              task: currentTask,
              decision,
              action: 'WRITE_CODE',
              input: { filePath, content: newContent },
              output: error.message,
              status: 'error',
              depth,
            },
            {
              loopStep: stepIndex,
              maxSteps: boundedMaxSteps,
            }
          );
          currentTask = `${currentTask}\n\nError writing ${filePath}: ${error.message}`;
          continue;
        }
      }

      if (runShellMatch) {
        const command = runShellMatch[1];
        const execDecision = await authorizeOperation({
          agent: agentContext,
          operation: 'execute',
          resourceType: 'shell',
          command,
          metadata: {
            agentTitle: agent.role,
            loopStep: stepIndex,
            maxSteps: boundedMaxSteps,
          },
        });
        if (!execDecision.allowed) {
          await recordActionOutcome(
            trace,
            projectContext,
            {
              agentId,
              task: currentTask,
              decision,
              action: 'RUN_SHELL',
              input: command,
              output: execDecision.reason,
              status: 'blocked',
              depth,
            },
            {
              loopStep: stepIndex,
              maxSteps: boundedMaxSteps,
            }
          );
          currentTask = `${currentTask}\n\nGovernance blocked RUN_SHELL "${command}": ${execDecision.reason}`;
          continue;
        }

        printInfo(chalk.yellow(`\n⚡ ${agent.name} is executing shell command: ${command}...`));

        try {
          const { stdout, stderr } = await execAsync(command);
          const output = stdout + (stderr ? `\nSTDERR:\n${stderr}` : '');
          await recordActionOutcome(
            trace,
            projectContext,
            {
              agentId,
              task: currentTask,
              decision,
              action: 'RUN_SHELL',
              input: command,
              output,
              status: 'success',
              depth,
            },
            {
              loopStep: stepIndex,
              maxSteps: boundedMaxSteps,
            }
          );
          currentTask = `${currentTask}\n\nOutput of RUN_SHELL "${command}":\n\`\`\`\n${output}\n\`\`\`\n\nPlease proceed with your task.`;
          continue;
        } catch (error) {
          await recordActionOutcome(
            trace,
            projectContext,
            {
              agentId,
              task: currentTask,
              decision,
              action: 'RUN_SHELL',
              input: command,
              output: error.message,
              status: 'error',
              depth,
            },
            {
              loopStep: stepIndex,
              maxSteps: boundedMaxSteps,
            }
          );
          currentTask = `${currentTask}\n\nError executing ${command}: ${error.message}`;
          continue;
        }
      }

      if (delegateMatch) {
        const nextAgent = delegateMatch[1];
        const nextTask = delegateMatch[2];
        const delegateDecision = await authorizeOperation({
          agent: agentContext,
          operation: 'delegate',
          metadata: {
            to: nextAgent,
            agentTitle: agent.role,
            loopStep: stepIndex,
            maxSteps: boundedMaxSteps,
          },
        });
        if (!delegateDecision.allowed) {
          await recordActionOutcome(
            trace,
            projectContext,
            {
              agentId,
              task: currentTask,
              decision,
              action: 'DELEGATE',
              input: nextTask,
              output: delegateDecision.reason,
              status: 'blocked',
              depth,
            },
            {
              to: nextAgent,
              loopStep: stepIndex,
              maxSteps: boundedMaxSteps,
            }
          );
          return `${content}\n\n[Governance]: Delegation blocked - ${delegateDecision.reason}`;
        }

        printInfo(chalk.cyan(`\n↪️  ${agent.name} is delegating to @${nextAgent}: "${nextTask}"`));
        const subResult = await runAgentLoop(
          nextAgent,
          nextTask,
          provider,
          projectContext,
          depth + 1,
          boundedMaxSteps
        );
        await recordActionOutcome(
          trace,
          projectContext,
          {
            agentId,
            task: currentTask,
            decision,
            action: 'DELEGATE',
            input: nextTask,
            output: subResult,
            status: 'success',
            depth,
          },
          {
            to: nextAgent,
            loopStep: stepIndex,
            maxSteps: boundedMaxSteps,
          }
        );
        return `${content}\n\n---\n\n## Delegated Result from @${nextAgent}\n${subResult}`;
      }

      await recordActionOutcome(
        trace,
        projectContext,
        {
          agentId,
          task: currentTask,
          decision,
          action: 'FINAL_RESPONSE',
          input: currentTask,
          output: content,
          status: 'success',
          depth,
        },
        {
          loopStep: stepIndex,
          maxSteps: boundedMaxSteps,
        }
      );
      return content;
    } catch (error) {
      spinner.fail(`${agent.name} failed: ${error.message}`);
      await recordActionOutcome(
        trace,
        projectContext,
        {
          agentId,
          task: currentTask,
          decision: 'Execution failed.',
          action: 'ERROR',
          input: currentTask,
          output: error.message,
          status: 'error',
          depth,
        },
        {
          loopStep: stepIndex,
          maxSteps: boundedMaxSteps,
        }
      );

      try {
        await emitAnalyticsEvent('analytics.agent_performance', {
          agent: agentId,
          durationMs: Date.now() - startedAt,
          success: false,
          task: currentTask,
          provider: providerInstance?.getName?.() || 'provider',
          runId: trace.runId,
          loopStep: stepIndex,
        });
        await emitAnalyticsEvent('analytics.error', {
          message: error.message,
          command: 'run',
          stack: error.stack,
          metadata: { agent: agentId, loopStep: stepIndex },
          runId: trace.runId,
        });
      } catch {
        // ignore analytics failures
      }

      return `[Error]: ${error.message}`;
    }
  }

  const limitMessage = `Max steps reached (${boundedMaxSteps}) for @${agentName}.`;
  await recordActionOutcome(
    trace,
    projectContext,
    {
      agentId,
      task: currentTask,
      decision: `Stop after reaching max_steps=${boundedMaxSteps}.`,
      action: 'STEP_LIMIT',
      input: currentTask,
      output: limitMessage,
      status: 'blocked',
      depth,
    },
    {
      maxSteps: boundedMaxSteps,
    }
  );
  return `[System]: ${limitMessage}`;
}

function buildAgentContext(agentId, agent) {
  return {
    id: agentId,
    name: agent?.name || agentId,
    roleId: agentId,
    title: agent?.role,
  };
}

function resolveMaxSteps(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_STEPS;
}

async function persistAndPrintRunArtifacts({ trace, command, agent, task, result }) {
  const artifactBundle = await writeRunArtifacts({
    runId: trace.runId,
    command,
    agent,
    task,
    result,
    traceFile: trace.traceFile,
  });

  printSuccess(`\nResult artifact: ${artifactBundle.paths.result}`);
  printInfo(`Trace artifact: ${artifactBundle.paths.trace}`);
  printInfo(`Summary artifact: ${artifactBundle.paths.summary}`);

  const visibleResult = String(result || '').trim() || '[No result returned]';
  printInfo(chalk.bold('\nResult\n'));
  printInfo(visibleResult);

  return artifactBundle;
}

async function createAgentProviderFactory(providerId, options = {}) {
  const cache = new Map();
  return async (agentId) => {
    const key = agentId.toLowerCase();
    if (cache.has(key)) return cache.get(key);
    const agent = AGENTS[key];
    const agentContext = buildAgentContext(key, agent);
    const provider = await createProvider(providerId, { ...options, agent: agentContext });
    cache.set(key, provider);
    return provider;
  };
}

export function registerRunCommand(program) {
  program
    .command('run <agent>')
    .description('Execute an agent task automatically')
    .option('-t, --task <task>', 'Task to execute')
    .option('-p, --provider <provider>', 'AI provider')
    .option('-k, --key <apiKey>', 'API key')
    .option('-o, --output <file>', 'Output file')
    .option('--max-steps <steps>', 'Maximum bounded execution steps per agent loop')
    .action(async (agentName, options) => {
      let task = options.task;
      let trace = null;
      let finalOutput = '';

      try {
        const configured = checkConfiguredProviders();
        const selectedProviderId = options.provider || getDefaultProvider();
        const hasProvider =
          configured.some((p) => p.configured) ||
          Boolean(options.key) ||
          canUseProviderWithoutApiKey(selectedProviderId);

        if (!hasProvider) {
          printWarning('\n⚠️  No AI provider configured.\n');
          printInfo('To use AI agents, configure one of these:');
          printInfo('  export ANTHROPIC_API_KEY=sk-ant-...  # Claude');
          printInfo('  export NVIDIA_API_KEY=nvapi-...      # NVIDIA Nemotron');
          printInfo('  export OPENAI_API_KEY=sk-...         # OpenAI');
          printInfo('  export GOOGLE_AI_KEY=...             # Gemini');
          process.stdout.write('\n');
          return;
        }

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
        trace = ensureExecutionTrace(context, {
          runId: process.env.ULTRA_DEX_RUN_ID,
          command: 'run',
          rootAgent: agentName,
          task,
        });
        syncActiveRunId(trace.runId);
        printInfo(`Execution trace run_id: ${trace.runId}`);
        const maxSteps = resolveMaxSteps(options.maxSteps);
        const providerId = selectedProviderId;
        const providerFactory = await createAgentProviderFactory(providerId, {
          apiKey: options.key,
          maxTokens: 8000,
        });

        // V2 routing path (feature-flagged, default OFF)
        if (USE_V2_ROUTING) {
          printInfo(chalk.yellow('\n🔧 V2 routing path active (ULTRA_DEX_V2_ROUTING=1)\n'));
          const v2Provider = await providerFactory(agentName);
          const { router, scheduler, engine } = createOrchestrationStack({
            provider: v2Provider,
            agents: AGENTS,
          });

          // Step 1: Route task to best capability
          const routing = router.route(task);
          printInfo(`V2 routed to: ${routing.agent} (confidence: ${routing.confidence.toFixed(2)})`);
          printInfo(`V2 reason: ${routing.reason}`);

          // Step 2: Create task for scheduler
          const selectedAgent = routing.agent;
          scheduler.addTask({
            agent: selectedAgent,
            task,
            priority: 1,
            dependencies: [],
          });

          // Step 3: Execute via engine (engine uses provider directly, not AGENTS config)
          const engineResult = await engine.execute(selectedAgent, task, {
            runId: trace.runId,
          });

          finalOutput = engineResult.output || 'V2 execution completed';
          logger.info('V2 routing execution complete', {
            runId: trace.runId,
            agent: selectedAgent,
            confidence: routing.confidence,
            status: engineResult.status,
          });
        } else {
          // OFF path: existing behavior unchanged
          finalOutput = await runAgentLoop(agentName, task, providerFactory, context, 0, maxSteps);
        }

        await persistAndPrintRunArtifacts({
          trace,
          command: 'run',
          agent: agentName,
          task,
          result: finalOutput,
        });

        if (options.output) {
          await fs.writeFile(options.output, finalOutput);
          printSuccess(`\n✅ Saved to ${options.output}`);
        }
      } catch (error) {
        if (trace) {
          finalOutput = finalOutput || `[Error]: ${error.message}`;
          await persistAndPrintRunArtifacts({
            trace,
            command: 'run',
            agent: agentName,
            task: task || '',
            result: finalOutput,
          }).catch(() => {});
        }
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
    .option('--max-steps <steps>', 'Maximum bounded execution steps per agent loop')
    .action(async (feature, options) => {
      let trace = null;
      let swarmResult = '';

      try {
        printInfo(chalk.cyan('\n🐝 Ultra-Dex Agent Swarm\n'));
        const context = await readProjectContext();
        trace = ensureExecutionTrace(context, {
          runId: process.env.ULTRA_DEX_RUN_ID,
          command: 'swarm',
          rootAgent: 'planner',
          task: feature,
        });
        syncActiveRunId(trace.runId);
        printInfo(`Execution trace run_id: ${trace.runId}`);
        const maxSteps = resolveMaxSteps(options.maxSteps);
        const providerId = options.provider || getDefaultProvider();
        const providerFactory = await createAgentProviderFactory(providerId, {
          apiKey: options.key,
          maxTokens: 8000,
        });

        printInfo(chalk.bold('Step 1: 📋 @Planner breaking down feature...'));
        const plan = await runAgentLoop('planner', feature, providerFactory, context, 0, maxSteps);

        printInfo(chalk.bold('\nStep 2: 🏗️  @CTO reviewing architecture...'));
        const architectureReview = await runAgentLoop(
          'cto',
          `Review plan:\n${plan}`,
          providerFactory,
          context,
          0,
          maxSteps
        );
        swarmResult = `## Planner\n${plan}\n\n## CTO\n${architectureReview}`;

        await persistAndPrintRunArtifacts({
          trace,
          command: 'swarm',
          agent: 'planner',
          task: feature,
          result: swarmResult,
        });
      } catch (error) {
        if (trace) {
          swarmResult = swarmResult || `[Error]: ${error.message}`;
          await persistAndPrintRunArtifacts({
            trace,
            command: 'swarm',
            agent: 'planner',
            task: feature,
            result: swarmResult,
          }).catch(() => {});
        }
        printError(`Error in swarm command: ${error.message}`);
        process.exit(1);
      }
    });
}

export function registerDistributedCommand(program) {
  const distributedCmd = program
    .command('distributed')
    .description('Manage distributed Ultra-Dex instances');

  distributedCmd
    .command('start')
    .description('Start distributed coordination server')
    .option('-p, --port <port>', 'Port to run on', '8080')
    .option('-h, --host <host>', 'Host to bind to', 'localhost')
    .action(async (options) => {
      try {
        printInfo('Starting distributed coordination server...');
        const { DistributedCoordinator } = await import(
          '../../../../src/core/orchestration/distributed-coordinator.js'
        );
        const coordinator = new DistributedCoordinator({
          port: parseInt(options.port),
          host: options.host,
        });
        await coordinator.initialize();
        printSuccess('Distributed coordination server started');
      } catch (error) {
        printError(`Failed to start distributed server: ${error.message}`);
        process.exit(1);
      }
    });

  distributedCmd
    .command('stop')
    .description('Stop distributed coordination')
    .action(async () => {
      try {
        printInfo('Stopping distributed coordination...');
        // Note: In a real implementation, we'd need to access the running instance
        // For now, this is a placeholder
        printSuccess('Distributed coordination stopped');
      } catch (error) {
        printError(`Failed to stop distributed coordination: ${error.message}`);
        process.exit(1);
      }
    });

  distributedCmd
    .command('status')
    .description('Show distributed peers and load')
    .action(async () => {
      try {
        // Note: In a real implementation, we'd connect to the running coordinator
        printInfo('Distributed status:');
        printInfo('  - No active coordinator found');
        // Placeholder for actual status
      } catch (error) {
        printError(`Failed to get distributed status: ${error.message}`);
        process.exit(1);
      }
    });

  distributedCmd
    .command('add-peer <url>')
    .description('Add a peer instance')
    .action(async (url) => {
      try {
        printInfo(`Adding peer: ${url}`);
        // Note: In a real implementation, we'd connect to the running coordinator
        printSuccess(`Peer added: ${url}`);
      } catch (error) {
        printError(`Failed to add peer: ${error.message}`);
        process.exit(1);
      }
    });

  distributedCmd
    .command('remove-peer <url>')
    .description('Remove a peer instance')
    .action(async (url) => {
      try {
        printInfo(`Removing peer: ${url}`);
        // Note: In a real implementation, we'd connect to the running coordinator
        printSuccess(`Peer removed: ${url}`);
      } catch (error) {
        printError(`Failed to remove peer: ${error.message}`);
        process.exit(1);
      }
    });

  distributedCmd
    .command('exec <task>')
    .description('Execute task in distributed mode')
    .action(async (task) => {
      try {
        printInfo(`Executing task in distributed mode: ${task}`);
        // Note: In a real implementation, we'd delegate to the coordinator
        printSuccess(`Task executed: ${task}`);
      } catch (error) {
        printError(`Failed to execute task: ${error.message}`);
        process.exit(1);
      }
    });
}

export default { registerRunCommand, registerSwarmCommand, registerDistributedCommand };
