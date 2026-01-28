// cli/lib/commands/swarm.js
import chalk from 'chalk';
import ora from 'ora';
import { getProvider } from '../providers/index.js';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';
import { projectGraph } from '../mcp/graph.js';
import { updateState, loadState, saveState } from './state.js';

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

async function runAgent(agent, task, context, previousOutput, provider) {
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
  const response = provider.complete 
    ? await provider.complete(prompt) 
    : await provider.generate('', prompt);
    
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
  console.log(chalk.cyan.bold('\n🐝 Ultra-Dex Swarm Mode v3.0\n'));
  console.log(chalk.white(`Task: "${task}"\n`));

  const startTime = Date.now();

  if (options.dryRun) {
    console.log(chalk.yellow('Dry run - showing pipeline:\n'));
    AGENT_PIPELINE.forEach((agent, i) => {
      console.log(`  ${i + 1}. @${agent.name} - ${agent.description} [${agent.tier}]`);
    });
    if (options.parallel) {
      console.log(chalk.blue('\nℹ️  Parallel execution enabled for 2-implementation tier'));
    }
    return;
  }

  // Load context & Graph (God Mode)
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
    console.log(chalk.red('No AI provider configured. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_AI_KEY'));
    return;
  }

  // Ensure log directory exists
  const logDir = await ensureLogDirectory();

  // Update State to indicate Swarm is running
  const state = await loadState() || { project: { mode: 'GOD_MODE' }, agents: { active: [] } };
  state.agents = state.agents || { active: [] };
  state.updatedAt = new Date().toISOString();
  await saveState(state);

  // Run pipeline
  let previousOutput = '';
  const agentResults = [];
  const agentTimings = {};
  
  // Define execution tiers (sorted by tier number)
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
      // Parallel Execution for implementation tier
      const tierStart = Date.now();
      const promises = tier.agents.map(async (agent) => {
        const agentStart = Date.now();
        const spinner = ora(`Running @${agent.name}...`).start();
        
        // Update state with active agent
        const currentState = await loadState();
        if (currentState) {
          currentState.agents.active.push(agent.name);
          await saveState(currentState);
        }

        try {
          const result = await runAgent(agent, task, context, previousOutput, provider);
          const duration = Date.now() - agentStart;
          agentTimings[agent.name] = duration;
          spinner.succeed(chalk.green(` @${agent.name} complete`) + chalk.gray(` (${duration}ms)`));
          
          // Remove active agent from state
          const stateDone = await loadState();
          if (stateDone) {
            stateDone.agents.active = stateDone.agents.active.filter(a => a !== agent.name);
            await saveState(stateDone);
          }

          return { agent: agent.name, result, success: true };
        } catch (error) {
          const duration = Date.now() - agentStart;
          agentTimings[agent.name] = duration;
          spinner.fail(chalk.red(` @${agent.name} failed: ${error.message}`) + chalk.gray(` (${duration}ms)`));
          
          const stateFail = await loadState();
          if (stateFail) {
            stateFail.agents.active = stateFail.agents.active.filter(a => a !== agent.name);
            await saveState(stateFail);
          }

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
        const currentState = await loadState();
        if (currentState) {
          currentState.agents.active.push(agent.name);
          await saveState(currentState);
        }

        try {
          const result = await runAgent(agent, task, context, previousOutput, provider);
          const duration = Date.now() - agentStart;
          agentTimings[agent.name] = duration;
          previousOutput = result;
          spinner.succeed(chalk.green(` @${agent.name} complete`) + chalk.gray(` (${duration}ms)`));
          console.log(chalk.gray(`  → ${result.slice(0, 100).replace(/\n/g, ' ')}...`));
          agentResults.push({ agent: agent.name, result, success: true });

          // Remove active agent
          const stateDone = await loadState();
          if (stateDone) {
            stateDone.agents.active = stateDone.agents.active.filter(a => a !== agent.name);
            await saveState(stateDone);
          }

        } catch (error) {
          const duration = Date.now() - agentStart;
          agentTimings[agent.name] = duration;
          spinner.fail(chalk.red(` @${agent.name} failed: ${error.message}`) + chalk.gray(` (${duration}ms)`));
          agentResults.push({ agent: agent.name, error: error.message, success: false });
          
          const stateFail = await loadState();
          if (stateFail) {
            stateFail.agents.active = stateFail.agents.active.filter(a => a !== agent.name);
            await saveState(stateFail);
          }
          break;
        }
      }
    }
  }

  const totalDuration = Date.now() - startTime;
  const successCount = agentResults.filter(r => r.success).length;
  const failCount = agentResults.filter(r => !r.success).length;

  // Final state update
  await updateState();

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

  console.log(chalk.green.bold('\n✅ Swarm complete!\n'));
}

async function loadAgentPrompt(name) {
  // Use glob to find agent file recursively
  const files = await glob(`agents/**/${name}.md`, { ignore: 'node_modules/**' });
  
  if (files.length > 0) {
    return await readFile(files[0], 'utf-8');
  }

  // Fallback to direct check
  const directPath = join(process.cwd(), 'agents', `${name}.md`);
  if (existsSync(directPath)) {
    return await readFile(directPath, 'utf-8');
  }

  return `You are the @${name} agent.`;
}