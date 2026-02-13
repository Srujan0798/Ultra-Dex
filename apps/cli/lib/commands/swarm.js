// Copyright (c) 2026 Ultra-Dex

// cli/lib/commands/swarm.js
import { getProvider } from '../providers/index.js';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename, dirname } from 'path';
import { glob } from 'glob';
import { projectGraph } from '../mcp/graph.js';
import { updateStateFile, loadState, saveState } from './state.js';
import { agents } from '../utils/agents.js';
import { isDoomsdayMode } from '../utils/theme-state.js';
import { showSwarmAssemble as showDoomsdaySwarm } from '../themes/doomsday.js';
import { renderer } from '../ui/renderer.js';
import { theme } from '../ui/theme.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { AppError, ValidationError, NetworkError } from '../utils/errors.js';
import { filterAgentsByAccess } from '../enterprise/agent-access.js';
import { AgentStateMachine } from '../graph/state-machine.js';
import { OptimizedSwarmExecutor } from '../performance/swarm-optimizer.js';

// Maximum context size limit (100KB)
const MAX_CONTEXT_SIZE = 100 * 1024; // 100KB in bytes

export const AGENT_PIPELINE = [
  { name: 'planner', description: 'Break down task into steps', tier: '1-planning' },
  { name: 'cto', description: 'Define architecture', tier: '1-planning' },
  { name: 'auth', description: 'Security & authentication review', tier: '3-security' },
  { name: 'database', description: 'Design schema', tier: '2-implementation' },
  { name: 'backend', description: 'Implement API', tier: '2-implementation' },
  { name: 'frontend', description: 'Build UI', tier: '2-implementation' },
  { name: 'testing', description: 'Write tests', tier: '4-quality' },
  { name: 'reviewer', description: 'Code review', tier: '4-quality' },
];

/**
 * Atomic write function to prevent partial writes
 */
async function atomicWrite(filePath, data) {
  const dir = dirname(filePath);
  const tempPath = join(
    dir,
    `.tmp-${basename(filePath)}-${process.pid}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(tempPath, data);
    await fs.writeFile(filePath, data); // This is the atomic operation on most systems
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(tempPath).catch(() => {});
    } catch (unlinkError) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Handle state locking for safe updates using exclusive file creation
 */
async function withStateLock(callback) {
  const lockFile = join(process.cwd(), '.ultra-dex', 'state.lock');
  const ultraDir = join(process.cwd(), '.ultra-dex');

  if (!existsSync(ultraDir)) {
    await fs.mkdir(ultraDir, { recursive: true });
  }

  let fileHandle = null;
  let retries = 0;
  const maxRetries = 50;
  const retryDelay = 100;

  while (!fileHandle && retries < maxRetries) {
    try {
      // 'wx' flag ensures atomic exclusive creation. Fails if file exists.
      fileHandle = await fs.open(lockFile, 'wx');
    } catch (error) {
      if (error.code === 'EEXIST') {
        // Lock exists, wait and retry
        await new Promise((r) => setTimeout(r, retryDelay));
        retries++;
      } else {
        throw error; // Unexpected error
      }
    }
  }

  if (!fileHandle) {
    throw new AppError('Could not acquire state lock. Is another process running?', {
      code: 'LOCK_TIMEOUT',
    });
  }

  try {
    // Write timestamp for debugging purposes
    await fileHandle.write(String(Date.now()));
    await fileHandle.close(); // Close handle but keep file as lock

    return await callback();
  } finally {
    // Always release lock
    await fs.unlink(lockFile).catch(() => {});
  }
}

/**
 * Save checkpoint for pipeline recovery
 */
const CHECKPOINT_FILE = join(process.cwd(), '.ultra-dex', 'swarm-checkpoint.json');

async function saveCheckpoint(task, agentResults, previousOutput, completedAgents, options) {
  const checkpoint = {
    timestamp: new Date().toISOString(),
    task,
    agentResults,
    previousOutput,
    completedAgents,
    options,
    version: '1.0',
  };

  try {
    await atomicWrite(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
  } catch (error) {
    printWarning(`Warning: Failed to save checkpoint: ${error.message}`);
  }
}

async function loadCheckpoint() {
  try {
    if (existsSync(CHECKPOINT_FILE)) {
      const data = await fs.readFile(CHECKPOINT_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    printWarning(`Warning: Failed to load checkpoint: ${error.message}`);
  }
  return null;
}

async function clearCheckpoint() {
  try {
    if (existsSync(CHECKPOINT_FILE)) {
      await fs.unlink(CHECKPOINT_FILE);
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

/**
 * Register swarm command with Commander
 */
import { agentOrchestrator as nexus } from '../../../../src/core/orchestration/index.js';

export function registerSwarmCommand(program) {
  const swarm = program
    .command('swarm [task]')
    .description('Deploy an autonomous agent swarm for a task')
    .option('--nexus', 'Use the Nexus autonomous reasoning orchestrator', true)
    .option('-p, --parallel', 'Run implementation tier agents in parallel', false)
    .option('--workers <count>', 'Parallel worker count', '4')
    .option('--dry-run', 'Preview the swarm pipeline', false)
    .option('--resume', 'Resume from last checkpoint after a failure', false)
    .option('--clean', 'Clear checkpoint and start fresh', false)
    .option('--checkpoint <id>', 'Resume from specific checkpoint ID')
    .option('--cost-tracking', 'Enable detailed cost tracking', false)
    .option('--save-checkpoints', 'Save checkpoints for resume capability', true)
    .action(async (task, options) => {
      try {
        if (options.nexus && task) {
          await nexus.execute(task);
          return;
        }

        if (options.clean) {
          await clearCheckpoint();
          printSuccess('Checkpoint cleared. Starting fresh.');
        }
        await swarmCommand(task, options);
      } catch (error) {
        await handleError(error, { command: 'swarm', task, options });
        process.exit(error.exitCode || 1);
      }
    });

  // Add swarm subcommands for advanced features
  swarm
    .command('status [swarmId]')
    .description('Show swarm status and checkpoints')
    .action(async (swarmId) => {
      try {
        const { showSwarmStatus } = await import('./swarm-advanced.js');
        await showSwarmStatus(swarmId);
      } catch (error) {
        await handleError(error, { command: 'swarm:status' });
      }
    });

  swarm
    .command('resume <checkpointId>')
    .description('Resume swarm from a specific checkpoint')
    .action(async (checkpointId) => {
      try {
        const { resumeSwarm } = await import('./swarm-advanced.js');
        await resumeSwarm(checkpointId);
      } catch (error) {
        await handleError(error, { command: 'swarm:resume', checkpointId });
      }
    });

  swarm
    .command('checkpoints')
    .description('List all saved checkpoints')
    .action(async () => {
      try {
        const { listCheckpoints } = await import('./swarm-advanced.js');
        await listCheckpoints();
      } catch (error) {
        await handleError(error, { command: 'swarm:checkpoints' });
      }
    });
}

export function showSwarmAssemble(activeAgents) {
  if (isDoomsdayMode()) {
    return showDoomsdaySwarm(activeAgents);
  }

  renderer.text(`**⚡ AGENT PIPELINE INITIALIZED**`, true);

  activeAgents.forEach((agentInfo) => {
    const agent = agents[agentInfo.name];
    if (agent) {
      printInfo(`  ${agent.emoji} ${theme.accent(agent.name.toUpperCase())}`);
      printInfo(`     ${theme.dim('"' + agent.tagline + '"')}`);
      printInfo('');
    }
  });
}

/**
 * Run a single agent with retry logic
 */
async function runAgent(agent, task, context, previousOutput, provider) {
  if (!provider) {
    throw new ValidationError('No AI provider configured. Set your API keys first.');
  }

  const agentPrompt = await loadAgentPrompt(agent.name);

  // Build the full prompt first
  const fullPrompt = `
${agentPrompt}

## Context
${context}

## Previous Agent Output
${previousOutput}

## Task
${task}

Provide your output for the next agent in the pipeline.
`;

  // Enforce prompt size limit
  let prompt = fullPrompt;
  if (Buffer.byteLength(fullPrompt, 'utf-8') > MAX_CONTEXT_SIZE) {
    printWarning(`Prompt size exceeds limit (${MAX_CONTEXT_SIZE / 1024}KB), truncating...`);

    // Truncate the context portion specifically
    const contextStart = fullPrompt.indexOf('## Context');
    const contextEnd = fullPrompt.indexOf('## Previous Agent Output');

    if (contextStart !== -1 && contextEnd !== -1) {
      const prefix = fullPrompt.substring(0, contextStart);
      const suffix = fullPrompt.substring(contextEnd);

      // Calculate how much context we can fit
      const overhead = Buffer.byteLength(prefix + suffix, 'utf-8');
      const availableForContext = MAX_CONTEXT_SIZE - overhead - 1000; // Leave 1KB buffer

      if (availableForContext > 0) {
        const fullContext = fullPrompt.substring(contextStart + 11, contextEnd); // +11 to skip "## Context"
        const contextBytes = Buffer.from(fullContext, 'utf-8');
        const truncatedContext = contextBytes.subarray(0, availableForContext);
        const truncatedContextString = new TextDecoder().decode(truncatedContext);

        prompt =
          prefix +
          '## Context\n' +
          truncatedContextString +
          `\n\n[Context was truncated due to size limits.]\n` +
          suffix;
      } else {
        // If there's not enough room even for minimal context, truncate the whole prompt
        const promptBytes = Buffer.from(fullPrompt, 'utf-8');
        const truncatedPrompt = promptBytes.subarray(0, MAX_CONTEXT_SIZE - 1000);
        prompt =
          new TextDecoder().decode(truncatedPrompt) +
          `\n\n[Prompt was truncated due to size limits.]`;
      }
    } else {
      // If we can't find the expected structure, just truncate the full prompt
      const promptBytes = Buffer.from(fullPrompt, 'utf-8');
      const truncatedPrompt = promptBytes.subarray(0, MAX_CONTEXT_SIZE - 1000);
      prompt =
        new TextDecoder().decode(truncatedPrompt) +
        `\n\n[Prompt was truncated due to size limits.]`;
    }
  }

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      let response;
      if (provider.complete) {
        response = await provider.complete(prompt);
      } else if (provider.generate) {
        response = await provider.generate('', prompt);
      } else {
        throw new AppError('Provider does not support complete or generate methods', {
          code: 'PROVIDER_INCOMPATIBLE',
        });
      }

      if (!response) {
        throw new NetworkError('Received empty response from provider');
      }

      return typeof response === 'string'
        ? response
        : response.content || response.text || JSON.stringify(response);
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        const delay = attempt * 2000;
        printWarning(`  ⚠️ @${agent.name} attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw new AppError(`Agent @${agent.name} failed after 3 attempts`, {
    cause: lastError,
    code: 'AGENT_MAX_RETRIES',
    suggestions: [
      'Check your internet connection',
      'Verify your API key has sufficient quota',
      'Try a different model or provider',
    ],
  });
}

async function ensureLogDirectory() {
  const logDir = join(process.cwd(), '.ultra-dex', 'swarm-logs');
  await fs.mkdir(logDir, { recursive: true });
  return logDir;
}

async function cleanupOldSwarmLogs(logDir, maxLogs = 50) {
  try {
    const files = await fs.readdir(logDir);
    const logFiles = files.filter((f) => f.startsWith('swarm-') && f.endsWith('.json'));

    if (logFiles.length >= maxLogs) {
      // Sort by modification time (oldest first)
      const sortedFiles = await Promise.all(
        logFiles.map(async (filename) => {
          const filepath = join(logDir, filename);
          const stat = await fs.stat(filepath);
          return { filename, filepath, mtime: stat.mtime };
        })
      );

      sortedFiles.sort((a, b) => a.mtime - b.mtime);

      // Delete oldest files to keep only maxLogs - 1 (to make room for new log)
      const filesToDelete = sortedFiles.slice(0, sortedFiles.length - maxLogs + 1);
      for (const file of filesToDelete) {
        await fs.unlink(file.filepath).catch(() => {});
      }
    }
  } catch (error) {
    // Silently fail cleanup - don't block swarm execution
    printWarning(`Warning: Failed to cleanup old swarm logs: ${error.message}`);
  }
}

async function writeSwarmLog(logDir, task, results, stats) {
  // Cleanup old logs before writing new one to prevent memory leak
  await cleanupOldSwarmLogs(logDir, 50);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = join(logDir, `swarm-${timestamp}.json`);
  const logData = { task, timestamp: new Date().toISOString(), stats, results };

  let logContent = JSON.stringify(logData, null, 2);

  // Enforce log size limit
  if (Buffer.byteLength(logContent, 'utf-8') > MAX_CONTEXT_SIZE) {
    printWarning(`Log size exceeds limit (${MAX_CONTEXT_SIZE / 1024}KB), truncating...`);

    // Truncate results array to reduce size
    const truncatedResults = [...results];
    while (
      truncatedResults.length > 0 &&
      Buffer.byteLength(JSON.stringify({ ...logData, results: truncatedResults }), 'utf-8') >
        MAX_CONTEXT_SIZE
    ) {
      truncatedResults.pop(); // Remove the last result
    }

    logContent = JSON.stringify({ ...logData, results: truncatedResults }, null, 2);

    // If still too big, truncate individual results
    if (Buffer.byteLength(logContent, 'utf-8') > MAX_CONTEXT_SIZE) {
      for (let i = 0; i < truncatedResults.length; i++) {
        if ('result' in truncatedResults[i] && typeof truncatedResults[i].result === 'string') {
          const originalResult = truncatedResults[i].result;
          truncatedResults[i].result = originalResult.substring(0, originalResult.length / 2);

          logContent = JSON.stringify({ ...logData, results: truncatedResults }, null, 2);
          if (Buffer.byteLength(logContent, 'utf-8') <= MAX_CONTEXT_SIZE) {
            break;
          }
        }
      }
    }
  }

  await fs.writeFile(logPath, logContent);
  return logPath;
}

export async function swarmCommand(task, options) {
  renderer.clearScreen();
  await renderer.text(`**🐝 Ultra-Dex Swarm Mode**
Task: "${task}"`);

  const startTime = Date.now();
  const stateMachine = await AgentStateMachine.load();
  stateMachine.setState('init', { task });
  await stateMachine.save();

  if (options.dryRun) {
    handleDryRun(options);
    return;
  }

  // Check for checkpoint if resuming
  let checkpoint = null;
  let completedAgents = new Set();

  if (options.resume) {
    checkpoint = await loadCheckpoint();
    if (checkpoint && checkpoint.task === task) {
      printInfo(
        `📋 Resuming from checkpoint (last updated: ${new Date(checkpoint.timestamp).toLocaleString()})`
      );
      printInfo(`✓ Already completed: ${checkpoint.completedAgents.join(', ')}`);
      completedAgents = new Set(checkpoint.completedAgents);
    } else if (checkpoint) {
      printWarning(`⚠️  Checkpoint found for different task. Starting fresh.`);
      checkpoint = null;
    } else {
      printInfo(`No checkpoint found. Starting fresh.`);
    }
  }

  // Load context & Graph
  const context = await gatherSwarmContext();

  // Get AI provider
  const provider = getProvider();
  if (!provider) {
    throw new ValidationError('No AI provider configured.', [
      'export ANTHROPIC_API_KEY=sk-ant-...',
      'export OPENAI_API_KEY=sk-...',
      'npx ultra-dex setup',
    ]);
  }

  const logDir = await ensureLogDirectory();

  await withStateLock(async () => {
    const state = (await loadState()) || {
      project: { mode: 'ULTRA_MODE' },
      agents: { active: [] },
    };
    state.agents = state.agents || { active: [] };
    state.updatedAt = new Date().toISOString();
    await saveState(state);
  });

  // Resume from checkpoint or start fresh
  let previousOutput = checkpoint ? checkpoint.previousOutput : '';
  const agentResults = checkpoint ? [...checkpoint.agentResults] : [];
  const agentTimings = {};

  const { role, allowedAgents, restrictedAgents } = await filterAgentsByAccess(
    AGENT_PIPELINE.map((agent) => agent.name)
  );

  const allowedSet = new Set(allowedAgents.map((name) => name.toLowerCase()));
  const allowedPipeline = AGENT_PIPELINE.filter((agent) =>
    allowedSet.has(agent.name.toLowerCase())
  );

  if (restrictedAgents.length > 0) {
    printWarning(
      `🔒 Role-based access (${role}) skipped ${restrictedAgents.length} agent(s) in swarm pipeline.`
    );
  }

  // Filter out already completed agents from pipeline
  const remainingPipeline = allowedPipeline.filter((a) => !completedAgents.has(a.name));

  if (remainingPipeline.length === 0) {
    printSuccess('✓ All agents already completed!');
    await clearCheckpoint();
    return;
  }

  // Use optimized executor for better performance
  const executor = new OptimizedSwarmExecutor();
  const executionResult = await executor.executeSwarm(remainingPipeline, task, context, provider, {
    parallel: options.parallel,
  });

  // Merge results with any previously completed agents
  const allResults = [...agentResults, ...executionResult.results];
  const totalDuration = executionResult.totalTime;
  const successCount = allResults.filter((r) => r.success).length;
  const failCount = allResults.filter((r) => !r.success).length;

  await updateStateFile();

  const stats = {
    totalDuration,
    agentTimings: executionResult.stats,
    successCount,
    failCount,
    parallel: options.parallel || false,
    performance: executionResult.stats,
  };
  const logPath = await writeSwarmLog(logDir, task, allResults, stats);

  renderer.divider();
  await renderer.text(`**Execution Complete**
Total time: ${totalDuration}ms`);
  renderer.box(
    `Succeeded: ${successCount}  Failed: ${failCount}\nLog saved: ${logPath}`,
    'Stats',
    failCount > 0 ? 'error' : 'success'
  );

  // Clear checkpoint on successful completion
  if (failCount === 0) {
    await clearCheckpoint();
    printSuccess('✓ Checkpoint cleared - all agents completed successfully');
    try {
      stateMachine.transition('complete', { duration: totalDuration });
      await stateMachine.save();
    } catch {
      stateMachine.setState('complete', { duration: totalDuration });
      await stateMachine.save();
    }
  } else {
    try {
      stateMachine.setState('failed', { failed: failCount });
      await stateMachine.save();
    } catch {
      // ignore
    }
  }
}

function handleDryRun(options) {
  const pipelineInfo = options.parallel
    ? [
        '📦 Tier: 1-Planning (sequential)',
        '  1. @planner - Break down task into steps',
        '  2. @cto - Define architecture',
        '',
        '📦 Tier: 2-Implementation (PARALLEL)',
        '  3. @database - Design schema',
        '  4. @backend - Implement API',
        '  5. @frontend - Build UI',
        '',
        '📦 Tier: 3-Security (sequential)',
        '  6. @auth - Security & authentication review',
        '',
        '📦 Tier: 4-Quality (sequential)',
        '  7. @testing - Write tests',
        '  8. @reviewer - Code review',
      ].join('\n')
    : AGENT_PIPELINE.map((a, i) => `${i + 1}. @${a.name} - ${a.description}`).join('\n');

  renderer.box(
    pipelineInfo,
    options.parallel ? 'Dry Run Pipeline (Parallel Mode)' : 'Dry Run Pipeline',
    'info'
  );
}

async function gatherSwarmContext() {
  const contextPath = join(process.cwd(), 'CONTEXT.md');
  const planPath = join(process.cwd(), 'IMPLEMENTATION-PLAN.md');

  let context = '';
  if (existsSync(contextPath)) context += await fs.readFile(contextPath, 'utf-8');
  if (existsSync(planPath)) context += '\n\n' + (await fs.readFile(planPath, 'utf-8'));

  renderer.startSpinner('Scanning Codebase Graph...');
  try {
    const graphSummary = await projectGraph.scan();
    context += `\n\n## Codebase Graph Summary\n- Total Files: ${graphSummary.nodeCount}\n- Total Dependencies: ${graphSummary.edgeCount}\n`;
    renderer.succeed(`Codebase mapped: ${graphSummary.nodeCount} nodes`);
  } catch (e) {
    renderer.fail('Graph scan failed, using limited context.');
  }

  // Enforce context size limit
  if (Buffer.byteLength(context, 'utf-8') > MAX_CONTEXT_SIZE) {
    printWarning(`Context size exceeds limit (${MAX_CONTEXT_SIZE / 1024}KB), truncating...`);

    // Truncate context while preserving important information
    const contextBytes = Buffer.from(context, 'utf-8');
    const truncatedContext = contextBytes.subarray(0, MAX_CONTEXT_SIZE - 1000); // Leave 1KB for summary

    // Add a summary of what was removed
    const truncatedString = new TextDecoder().decode(truncatedContext);
    const remainingChars = context.length - truncatedString.length;

    context =
      truncatedString +
      `\n\n[Context was truncated due to size limits. ${remainingChars} characters removed.]`;
  }

  return context;
}

let agentPathsCache = null;

async function getAgentPaths() {
  if (agentPathsCache) return agentPathsCache;
  agentPathsCache = new Map();

  try {
    const files = await glob('agents/**/*.md', { ignore: 'node_modules/**' });
    for (const file of files) {
      const name = basename(file, '.md');
      if (!agentPathsCache.has(name)) {
        agentPathsCache.set(name, file);
      }
    }
  } catch (error) {
    printWarning('Warning: Failed to scan agent prompts: ' + error.message);
  }

  return agentPathsCache;
}

async function loadAgentPrompt(name) {
  const paths = await getAgentPaths();
  const file = paths.get(name);

  if (file) {
    return await fs.readFile(file, 'utf-8');
  }

  const directPath = join(process.cwd(), 'agents', `${name}.md`);
  if (existsSync(directPath)) return await fs.readFile(directPath, 'utf-8');

  return `You are the @${name} agent.`;
}
