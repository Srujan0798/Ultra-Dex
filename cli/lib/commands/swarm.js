// cli/lib/commands/swarm.js
import { getProvider } from '../providers/index.js';
import { readFile, writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename } from 'path';
import { glob } from 'glob';
import { projectGraph } from '../mcp/graph.js';
import { updateStateFile, loadState, saveState } from './state.js';
import { agents } from '../utils/agents.js';
import { isDoomsdayMode } from '../utils/theme-state.js';
import { showSwarmAssemble as showDoomsdaySwarm } from '../themes/doomsday.js';
import { renderer } from '../ui/renderer.js'; // Import the Pro Renderer
import { theme } from '../ui/theme.js';

export const AGENT_PIPELINE = [
  { name: 'planner', description: 'Break down task into steps', tier: '1-planning' },
  { name: 'cto', description: 'Define architecture', tier: '1-planning' },
  { name: 'auth', description: 'Security & authentication review', tier: '3-security' },
  { name: 'database', description: 'Design schema', tier: '2-implementation' },
  { name: 'backend', description: 'Implement API', tier: '2-implementation' },
  { name: 'frontend', description: 'Build UI', tier: '2-implementation' },
  { name: 'testing', description: 'Write tests', tier: '4-quality' },
  { name: 'reviewer', description: 'Code review', tier: '4-quality' }
];

async function withStateLock(callback) {
  const lockFile = join(process.cwd(), '.ultra-dex', 'state.lock');
  let retries = 0;
  while (existsSync(lockFile) && retries < 50) {
    await new Promise(r => setTimeout(r, 100));
    retries++;
  }

  try {
    await writeFile(lockFile, String(Date.now()));
    return await callback();
  } finally {
    if (existsSync(lockFile)) {
      await unlink(lockFile).catch(() => {});
    }
  }
}

export function showSwarmAssemble(activeAgents) {
  if (isDoomsdayMode()) {
    return showDoomsdaySwarm(activeAgents);
  }

  renderer.text(`**⚡ AGENT PIPELINE INITIALIZED**`, true);

  activeAgents.forEach((agentInfo) => {
    const agent = agents[agentInfo.name];
    if (agent) {
      console.log(`  ${agent.emoji} ${theme.accent(agent.name.toUpperCase())}`);
      console.log(`     ${theme.dim('"' + agent.tagline + '"')}`);
      console.log('');
    }
  });
}

async function runAgent(agent, task, context, previousOutput, provider) {
  if (!provider) {
    throw new Error('No AI provider configured.');
  }

  const agentPrompt = await loadAgentPrompt(agent.name);
  const prompt = `
${agentPrompt}

## Context
${context}

## Previous Agent Output
${previousOutput}

## Task
${task}

Provide your output for the next agent in the pipeline.
`;

  let response;
  try {
    if (provider.complete) {
      response = await provider.complete(prompt);
    } else if (provider.generate) {
      response = await provider.generate('', prompt);
    } else {
      throw new Error('Provider does not support complete or generate methods');
    }

    if (!response) {
      throw new Error('Received empty response from provider');
    }
  } catch (error) {
    throw new Error(`Provider Error: ${error.message}`);
  }

  return typeof response === 'string'
    ? response
    : (response.content || response.text || JSON.stringify(response));
}

async function ensureLogDirectory() {
  const logDir = join(process.cwd(), '.ultra-dex', 'swarm-logs');
  await mkdir(logDir, { recursive: true });
  return logDir;
}

async function writeSwarmLog(logDir, task, results, stats) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = join(logDir, `swarm-${timestamp}.json`);
  const logData = { task, timestamp: new Date().toISOString(), stats, results };
  await writeFile(logPath, JSON.stringify(logData, null, 2));
  return logPath;
}

export async function swarmCommand(task, options) {
  renderer.clearScreen();
  await renderer.text(`**🐝 Ultra-Dex Swarm Mode**\nTask: "${task}"`);

  const startTime = Date.now();

  if (options.dryRun) {
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
          '  8. @reviewer - Code review'
        ].join('\n')
      : AGENT_PIPELINE.map((a, i) => `${i + 1}. @${a.name} - ${a.description}`).join('\n');

    renderer.box(
      pipelineInfo,
      options.parallel ? 'Dry Run Pipeline (Parallel Mode)' : 'Dry Run Pipeline',
      'info'
    );
    return;
  }

  // Load context & Graph
  const contextPath = join(process.cwd(), 'CONTEXT.md');
  const planPath = join(process.cwd(), 'IMPLEMENTATION-PLAN.md');

  let context = '';
  if (existsSync(contextPath)) context += await readFile(contextPath, 'utf-8');
  if (existsSync(planPath)) context += '\n\n' + await readFile(planPath, 'utf-8');

  // Inject Code Graph
  renderer.startSpinner('Scanning Codebase Graph...');
  try {
    const graphSummary = await projectGraph.scan();
    context += `\n\n## Codebase Graph Summary\n- Total Files: ${graphSummary.nodeCount}\n- Total Dependencies: ${graphSummary.edgeCount}\n`;
    renderer.succeed(`Codebase mapped: ${graphSummary.nodeCount} nodes`);
  } catch (e) {
    renderer.fail('Graph scan failed, using limited context.');
  }

  // Get AI provider
  const provider = getProvider();
  if (!provider) {
    renderer.fail('No AI provider configured.');
    renderer.box(
      `export ANTHROPIC_API_KEY=sk-ant-...\nexport OPENAI_API_KEY=sk-...\nollama serve`,
      'Configuration Required',
      'error'
    );
    return;
  }

  const logDir = await ensureLogDirectory();

  await withStateLock(async () => {
    const state = await loadState() || { project: { mode: 'ULTRA_MODE' }, agents: { active: [] } };
    state.agents = state.agents || { active: [] };
    state.updatedAt = new Date().toISOString();
    await saveState(state);
  });

  let previousOutput = '';
  const agentResults = [];
  const agentTimings = {};

  const executionTiers = options.parallel
    ? [
        { name: '1-Planning', agents: AGENT_PIPELINE.filter(a => a.tier === '1-planning'), parallel: false },
        { name: '2-Implementation', agents: AGENT_PIPELINE.filter(a => a.tier === '2-implementation'), parallel: true },
        { name: '3-Security', agents: AGENT_PIPELINE.filter(a => a.tier === '3-security'), parallel: false },
        { name: '4-Quality', agents: AGENT_PIPELINE.filter(a => a.tier === '4-quality'), parallel: false }
      ]
    : [{ name: 'All', agents: AGENT_PIPELINE, parallel: false }];

  for (const tier of executionTiers) {
    if (tier.agents.length === 0) continue;

    console.log(theme.dim(`\n📦 Tier: ${tier.name}`));

    if (tier.parallel) {
      // Parallel Execution
      const promises = tier.agents.map(async (agent) => {
        const agentStart = Date.now();
        // Use a generic spinner since parallel spinners are messy in terminal
        console.log(theme.accent(`  ⟳ Running @${agent.name}...`));

        try {
          const result = await runAgent(agent, task, context, previousOutput, provider);
          const duration = Date.now() - agentStart;
          agentTimings[agent.name] = duration;
          console.log(theme.success(`  ✓ @${agent.name} complete (${duration}ms)`));
          return { agent: agent.name, result, success: true };
        } catch (error) {
          console.log(theme.error(`  ✖ @${agent.name} failed: ${error.message}`));
          return { agent: agent.name, error: error.message, success: false };
        }
      });

      const results = await Promise.all(promises);
      agentResults.push(...results);
      previousOutput += '\n\n' + results.filter(r => r.success).map(r => r.result).join('\n\n');

    } else {
      // Serial Execution
      for (const agent of tier.agents) {
        const agentStart = Date.now();
        renderer.startSpinner(`Agent @${agent.name} is working...`);

        try {
          const result = await runAgent(agent, task, context, previousOutput, provider);
          const duration = Date.now() - agentStart;
          agentTimings[agent.name] = duration;
          previousOutput = result;
          renderer.succeed(`@${agent.name} complete (${duration}ms)`);

          // Stream a preview of the output
          const preview = result.slice(0, 150).replace(/\n/g, ' ') + '...';
          console.log(theme.dim(`    › ${preview}`));

          agentResults.push({ agent: agent.name, result, success: true });

        } catch (error) {
          renderer.fail(`@${agent.name} failed: ${error.message}`);
          agentResults.push({ agent: agent.name, error: error.message, success: false });
          break;
        }
      }
    }
  }

  const totalDuration = Date.now() - startTime;
  const successCount = agentResults.filter(r => r.success).length;
  const failCount = agentResults.filter(r => !r.success).length;

  await updateStateFile();

  const stats = { totalDuration, agentTimings, successCount, failCount, parallel: options.parallel || false };
  const logPath = await writeSwarmLog(logDir, task, agentResults, stats);

  renderer.divider();
  await renderer.text(`**Execution Complete**\nTotal time: ${totalDuration}ms`);
  renderer.box(
    `Succeeded: ${successCount}  Failed: ${failCount}\nLog saved: ${logPath}`,
    'Stats',
    failCount > 0 ? 'error' : 'success'
  );
}

let agentPathsCache = null;

async function getAgentPaths() {
  if (agentPathsCache) return agentPathsCache;
  agentPathsCache = new Map();

  try {
    const files = await glob('agents/**/*.md', { ignore: 'node_modules/**' });
    for (const file of files) {
      const name = basename(file, '.md');
      // Store the first occurrence found. The glob order is generally stable.
      if (!agentPathsCache.has(name)) {
        agentPathsCache.set(name, file);
      }
    }
  } catch (error) {
    // If glob fails, we'll just have an empty map and fall back to direct checks if possible,
    // though the direct check logic below also relies on file existence.
    console.warn('Warning: Failed to scan agent prompts:', error.message);
  }

  return agentPathsCache;
}

async function loadAgentPrompt(name) {
  const paths = await getAgentPaths();
  const file = paths.get(name);

  if (file) {
    return await readFile(file, 'utf-8');
  }

  // Fallback to direct check
  const directPath = join(process.cwd(), 'agents', `${name}.md`);
  if (existsSync(directPath)) return await readFile(directPath, 'utf-8');

  return `You are the @${name} agent.`;
}