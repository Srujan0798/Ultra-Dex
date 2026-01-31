// cli/lib/commands/swarm.js
import chalk from 'chalk';
import ora from 'ora';
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

const AGENT_PIPELINE = [
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
  // Simple spin lock with 5s timeout
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

  console.log('');
  console.log(chalk.hex('#8b5cf6').bold('  ⚡ AGENT PIPELINE INITIALIZED'));
  console.log('');
  
  activeAgents.forEach((agentInfo) => {
    const agent = agents[agentInfo.name];
    if (agent) {
      console.log(`  ${agent.emoji} ${chalk.hex('#6366f1').bold(agent.name)}`);
      console.log(`     ${chalk.dim('"' + agent.tagline + '"')}`);
      console.log('');
    }
  });
}

async function runAgent(agent, task, context, previousOutput, provider) {
  // Check if provider is null/undefined
  if (!provider) {
    throw new Error('No AI provider configured. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY environment variable.');
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

  // Standardize provider call
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
  const logData = {
    task,
    timestamp: new Date().toISOString(),
    stats,
    results
  };
  await writeFile(logPath, JSON.stringify(logData, null, 2));
  return logPath;
}

export async function swarmCommand(task, options) {
  console.log(chalk.cyan.bold('\n🐝 Ultra-Dex Swarm Mode\n'));
  console.log(chalk.white(`Task: "${task}"\n`));

  const startTime = Date.now();

  if (options.dryRun) {
    console.log(chalk.yellow('Dry run - showing pipeline:\n'));
    AGENT_PIPELINE.forEach((agent, i) => {
      console.log(`  ${i + 1}. @${agent.name} - ${agent.description} [${agent.tier}]`);
    });
    if (options.parallel) {
      console.log(chalk.blue('\nℹ️  Parallel execution enabled for implementation tier'));
    }
    return;
  }

  // Load context & Graph
  const contextPath = join(process.cwd(), 'CONTEXT.md');
  const planPath = join(process.cwd(), 'IMPLEMENTATION-PLAN.md');
  
  let context = '';
  if (existsSync(contextPath)) {
    context += await readFile(contextPath, 'utf-8');
  }
  if (existsSync(planPath)) {
    context += '\n\n' + await readFile(planPath, 'utf-8');
  }

  // Inject Code Graph into Context
  const spinnerGraph = ora('🧠 Scanning Codebase Graph...').start();
  try {
    const graphSummary = await projectGraph.scan();
    context += `\n\n## Codebase Graph Summary\n- Total Files: ${graphSummary.nodeCount}\n- Total Dependencies: ${graphSummary.edgeCount}\n- Files Analyzed: ${graphSummary.files.join(', ')}\n`;
    spinnerGraph.succeed('Codebase Graph integrated into context.');
  } catch (e) {
    spinnerGraph.warn('Codebase Graph scan failed, proceeding with limited context.');
  }

  // Get AI provider
  const provider = getProvider();
  if (!provider) {
    console.log(chalk.red('\n❌ No AI provider configured.\n'));
    console.log(chalk.white('The swarm needs an AI provider to coordinate agents.'));
    console.log(chalk.white('Configure one of these:\n'));
    console.log(chalk.gray('  export ANTHROPIC_API_KEY=sk-ant-...  # Claude (recommended)'));
    console.log(chalk.gray('  export OPENAI_API_KEY=sk-...         # OpenAI'));
    console.log(chalk.gray('  export GOOGLE_AI_KEY=...             # Gemini'));
    console.log(chalk.white('\nOr run Ollama locally (no API key needed):'));
    console.log(chalk.gray('  ollama serve  # Start Ollama'));
    console.log(chalk.gray('  export ULTRA_DEX_DEFAULT_PROVIDER=ollama\n'));
    return;
  }

  // Ensure log directory exists
  const logDir = await ensureLogDirectory();

  // Update State to indicate Swarm is running with locking to prevent race conditions
  await withStateLock(async () => {
    const state = await loadState() || { project: { mode: 'ULTRA_MODE' }, agents: { active: [] } };
    state.agents = state.agents || { active: [] };
    state.updatedAt = new Date().toISOString();
    await saveState(state);
  });

  // Run pipeline
  let previousOutput = '';
  const agentResults = [];
  const agentTimings = {};
  
  // Define execution tiers
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
    
    if (options.parallel) {
      console.log(chalk.blue.bold(`\n📦 Tier: ${tier.name}`));
    }

    if (tier.parallel) {
      // Parallel Execution
      const tierStart = Date.now();
      const promises = tier.agents.map(async (agent) => {
        const agentStart = Date.now();
        const spinner = ora(`Running @${agent.name}...`).start();
        
        // Update state with active agent
        await withStateLock(async () => {
          const currentState = await loadState();
          if (currentState) {
            currentState.agents.active.push(agent.name);
            await saveState(currentState);
          }
        });

        try {
          const result = await runAgent(agent, task, context, previousOutput, provider);
          const duration = Date.now() - agentStart;
          agentTimings[agent.name] = duration;
          spinner.succeed(chalk.green(` @${agent.name} complete`) + chalk.gray(` (${duration}ms)`));
          
          // Remove active agent from state
          await withStateLock(async () => {
            const stateDone = await loadState();
            if (stateDone) {
              stateDone.agents.active = stateDone.agents.active.filter(a => a !== agent.name);
              await saveState(stateDone);
            }
          });

          return { agent: agent.name, result, success: true };
        } catch (error) {
          const duration = Date.now() - agentStart;
          agentTimings[agent.name] = duration;
          spinner.fail(chalk.red(` @${agent.name} failed: ${error.message}`) + chalk.gray(` (${duration}ms)`));
          
          await withStateLock(async () => {
            const stateFail = await loadState();
            if (stateFail) {
              stateFail.agents.active = stateFail.agents.active.filter(a => a !== agent.name);
              await saveState(stateFail);
            }
          });

          return { agent: agent.name, error: error.message, success: false };
        }
      });

      const results = await Promise.all(promises);
      agentResults.push(...results);
      previousOutput += '\n\n' + results.filter(r => r.success).map(r => r.result).join('\n\n');
      console.log(chalk.gray(`  Tier completed in ${Date.now() - tierStart}ms`));
      
    } else {
      // Serial Execution
      for (const agent of tier.agents) {
        const agentStart = Date.now();
        const spinner = ora(`Running @${agent.name}...`).start();

        // Update state
        await withStateLock(async () => {
          const currentState = await loadState();
          if (currentState) {
            currentState.agents.active.push(agent.name);
            await saveState(currentState);
          }
        });

        try {
          const result = await runAgent(agent, task, context, previousOutput, provider);
          const duration = Date.now() - agentStart;
          agentTimings[agent.name] = duration;
          previousOutput = result;
          spinner.succeed(chalk.green(` @${agent.name} complete`) + chalk.gray(` (${duration}ms)`));
          console.log(chalk.gray(`  → ${result.slice(0, 100).replace(/\n/g, ' ')}...`));
          agentResults.push({ agent: agent.name, result, success: true });

          // Remove active agent
          await withStateLock(async () => {
            const stateDone = await loadState();
            if (stateDone) {
              stateDone.agents.active = stateDone.agents.active.filter(a => a !== agent.name);
              await saveState(stateDone);
            }
          });

        } catch (error) {
          const duration = Date.now() - agentStart;
          agentTimings[agent.name] = duration;
          spinner.fail(chalk.red(` @${agent.name} failed: ${error.message}`) + chalk.gray(` (${duration}ms)`));
          agentResults.push({ agent: agent.name, error: error.message, success: false });
          
          await withStateLock(async () => {
            const stateFail = await loadState();
            if (stateFail) {
              stateFail.agents.active = stateFail.agents.active.filter(a => a !== agent.name);
              await saveState(stateFail);
            }
          });
          break;
        }
      }
    }
  }

  const totalDuration = Date.now() - startTime;
  const successCount = agentResults.filter(r => r.success).length;
  const failCount = agentResults.filter(r => !r.success).length;

  // Final state update
  await updateStateFile();

  // Write log
  const stats = {
    totalDuration,
    agentTimings,
    successCount,
    failCount,
    parallel: options.parallel || false
  };
  const logPath = await writeSwarmLog(logDir, task, agentResults, stats);

  // Summary
  console.log(chalk.cyan.bold('\n📊 Execution Stats:'));
  console.log(chalk.white(`  Total time: ${totalDuration}ms`));
  console.log(chalk.green(`  Succeeded: ${successCount}`) + chalk.red(` Failed: ${failCount}`));
  Object.entries(agentTimings).forEach(([agent, time]) => {
    console.log(chalk.gray(`  • @${agent}: ${time}ms`));
  });
  console.log(chalk.gray(`\n  Log saved: ${logPath}`));

  console.log(chalk.green.bold('\n✅ Swarm execution complete!\n'));
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
  if (existsSync(directPath)) {
    return await readFile(directPath, 'utf-8');
  }

  return `You are the @${name} agent.`;
}
