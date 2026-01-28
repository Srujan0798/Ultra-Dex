// cli/lib/commands/swarm.js
import chalk from 'chalk';
import ora from 'ora';
import { getProvider } from '../providers/index.js';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

const AGENT_PIPELINE = [
  { name: 'planner', description: 'Break down task into steps', group: 'planning' },
  { name: 'cto', description: 'Define architecture', group: 'planning' },
  { name: 'database', description: 'Design schema', group: 'implementation' },
  { name: 'backend', description: 'Implement API', group: 'implementation' },
  { name: 'frontend', description: 'Build UI', group: 'implementation' },
  { name: 'testing', description: 'Write tests', group: 'quality' },
  { name: 'reviewer', description: 'Code review', group: 'quality' }
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

export async function swarmCommand(task, options) {
  console.log(chalk.cyan.bold('\n🐝 Ultra-Dex Swarm Mode\n'));
  console.log(chalk.white(`Task: "${task}"\n`));

  if (options.dryRun) {
    console.log(chalk.yellow('Dry run - showing pipeline:\n'));
    AGENT_PIPELINE.forEach((agent, i) => {
      console.log(`  ${i + 1}. @${agent.name} - ${agent.description} [${agent.group}]`);
    });
    if (options.parallel) {
      console.log(chalk.blue('\nℹ️  Parallel execution enabled for implementation group'));
    }
    return;
  }

  // Load context
  const contextPath = join(process.cwd(), 'CONTEXT.md');
  const planPath = join(process.cwd(), 'IMPLEMENTATION-PLAN.md');
  
  let context = '';
  if (existsSync(contextPath)) {
    context += await readFile(contextPath, 'utf-8');
  }
  if (existsSync(planPath)) {
    context += '\n\n' + await readFile(planPath, 'utf-8');
  }

  // Get AI provider
  const provider = getProvider();
  if (!provider) {
    console.log(chalk.red('No AI provider configured. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_AI_KEY'));
    return;
  }

  // Run pipeline
  let previousOutput = '';
  
  // Define execution groups
  const executionGroups = options.parallel 
    ? [
        { name: 'Planning', agents: AGENT_PIPELINE.filter(a => a.group === 'planning'), parallel: false },
        { name: 'Implementation', agents: AGENT_PIPELINE.filter(a => a.group === 'implementation'), parallel: true },
        { name: 'Quality', agents: AGENT_PIPELINE.filter(a => a.group === 'quality'), parallel: false }
      ]
    : [{ name: 'All', agents: AGENT_PIPELINE, parallel: false }];

  for (const group of executionGroups) {
    if (options.parallel && group.agents.length > 0) {
      console.log(chalk.blue.bold(`\nPhase: ${group.name}`));
    }

    if (group.parallel) {
      // Parallel Execution
      const promises = group.agents.map(async (agent) => {
        const spinner = ora(`Running @${agent.name}...`).start();
        try {
          const result = await runAgent(agent, task, context, previousOutput, provider);
          spinner.succeed(` @${agent.name} complete`);
          return result;
        } catch (error) {
          spinner.fail(` @${agent.name} failed: ${error.message}`);
          throw error;
        }
      });

      const results = await Promise.all(promises);
      previousOutput += '\n\n' + results.join('\n\n');
      
    } else {
      // Serial Execution
      for (const agent of group.agents) {
        const spinner = ora(`Running @${agent.name}...`).start();
        try {
          const result = await runAgent(agent, task, context, previousOutput, provider);
          previousOutput = result; // In serial, pass output to next
          spinner.succeed(` @${agent.name} complete`);
          console.log(chalk.gray(`  → ${result.slice(0, 100).replace(/\n/g, ' ')}...`));
        } catch (error) {
          spinner.fail(` @${agent.name} failed: ${error.message}`);
          break;
        }
      }
    }
  }

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