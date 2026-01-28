/**
 * ultra-dex run command
 * Execute agent tasks automatically (the "swarm" approach)
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { createProvider, getDefaultProvider, checkConfiguredProviders } from '../providers/index.js';
import { validateSafePath } from '../utils/validation.js';
import { projectGraph } from '../mcp/graph.js';

const AGENTS = {
  planner: {
    name: '@Planner',
    role: 'Task Breakdown Specialist',
    systemPrompt: `You are @Planner. Break down features into atomic tasks.
Use >> SEARCH_CODE: "query" to find existing patterns.
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
>> SEARCH_CODE: "query" - Search codebase
>> DELEGATE: @AgentName "Task" - Delegate work`,
  },
  frontend: {
    name: '@Frontend',
    role: 'UI/UX Developer',
    systemPrompt: `You are @Frontend. Build React/Next.js components.
Available commands:
>> READ_CODE: "path"
>> WRITE_CODE: "path" "content"
>> SEARCH_CODE: "query"`,
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
>> READ_CODE: "path"
>> SEARCH_CODE: "query"`,
  },
};

async function readProjectContext() {
  const context = {};
  try { context.plan = await fs.readFile('IMPLEMENTATION-PLAN.md', 'utf8'); } catch { context.plan = null; }
  try { context.context = await fs.readFile('CONTEXT.md', 'utf8'); } catch { context.context = null; }
  try { 
    context.state = JSON.parse(await fs.readFile('.ultra/state.json', 'utf8')); 
  } catch { 
    try {
        context.state = JSON.parse(await fs.readFile('.ultra-dex/state.json', 'utf8'));
    } catch {
        context.state = null; 
    }
  }
  
  // Graph Scan (God Mode)
  try {
    await projectGraph.scan();
    context.graph = projectGraph.getSummary();
  } catch (e) {
    context.graph = null;
  }
  
  return context;
}

export async function runAgentLoop(agentName, task, provider, projectContext, depth = 0) {
  if (depth > 5) return `[System]: Max delegation depth reached.`;

  const agent = AGENTS[agentName.toLowerCase()];
  if (!agent) return `[System]: Unknown agent @${agentName}`;

  const spinner = ora(`${agent.name} is working...`).start();
  
  const graphInfo = projectContext.graph 
    ? `## Codebase Graph\n- Files: ${projectContext.graph.nodeCount}\n- Dependencies: ${projectContext.graph.edgeCount}\n` 
    : '';

  const historySection = projectContext.history ? `## Execution History\n${projectContext.history}\n\n` : '';
  const contextSection = projectContext.context ? `## Context\n${projectContext.context.slice(0, 3000)}\n\n${graphInfo}${historySection}` : '';
  const prompt = `${contextSection}## Task\n${task}\n\nYou can use tools by outputting:
>> READ_CODE: "filePath"
>> WRITE_CODE: "filePath" "fullContent"
>> SEARCH_CODE: "query"
>> DELEGATE: @AgentName "Task"`;

  try {
    const result = await provider.generate(agent.systemPrompt, prompt);
    spinner.succeed(`${agent.name} completed.`);
    
    let content = result.content;

    // Tool Execution Logic (God Mode)
    const readMatch = content.match(/>>\s*READ_CODE:\s*["'](.+?)["']/);
    const writeMatch = content.match(/>>\s*WRITE_CODE:\s*["'](.+?)["']\s*["']([\s\S]+?)["']/);
    const searchMatch = content.match(/>>\s*SEARCH_CODE:\s*["'](.+?)["']/);
    const delegateMatch = content.match(/>>\s*DELEGATE:\s*@(\w+)\s*["'](.+?)["']/);

    if (readMatch) {
      const filePath = readMatch[1];
      console.log(chalk.cyan(`\n🔍 ${agent.name} is reading ${filePath}...`));
      try {
        const fileContent = await fs.readFile(path.resolve(process.cwd(), filePath), 'utf8');
        const nextPrompt = `Output of READ_CODE "${filePath}":\n\`\`\`\n${fileContent}\n\`\`\`\n\nPlease proceed with your task.`;
        return await runAgentLoop(agentName, `${task}\n\n${nextPrompt}`, provider, projectContext, depth + 1);
      } catch (e) {
        return await runAgentLoop(agentName, `${task}\n\nError reading ${filePath}: ${e.message}`, provider, projectContext, depth + 1);
      }
    }

    if (writeMatch) {
      const filePath = writeMatch[1];
      const newContent = writeMatch[2];
      console.log(chalk.green(`\n💾 ${agent.name} is writing to ${filePath}...`));
      try {
        await fs.mkdir(path.dirname(path.resolve(process.cwd(), filePath)), { recursive: true });
        await fs.writeFile(path.resolve(process.cwd(), filePath), newContent, 'utf8');
        const nextPrompt = `Successfully wrote ${filePath}. Please proceed or delegate verification.`;
        return await runAgentLoop(agentName, `${task}\n\n${nextPrompt}`, provider, projectContext, depth + 1);
      } catch (e) {
        return await runAgentLoop(agentName, `${task}\n\nError writing ${filePath}: ${e.message}`, provider, projectContext, depth + 1);
      }
    }

    if (delegateMatch) {
      const nextAgent = delegateMatch[1];
      const nextTask = delegateMatch[2];
      console.log(chalk.cyan(`\n↪️  ${agent.name} is delegating to @${nextAgent}: "${nextTask}"`));
      const subResult = await runAgentLoop(nextAgent, nextTask, provider, projectContext, depth + 1);
      return `${content}\n\n---\n\n## Delegated Result from @${nextAgent}\n${subResult}`;
    }

    return content;
  } catch (err) {
    spinner.fail(`${agent.name} failed: ${err.message}`);
    return `[Error]: ${err.message}`;
  }
}

export function registerRunCommand(program) {
  program.command('run <agent>')
    .description('Execute an agent task automatically')
    .option('-t, --task <task>', 'Task to execute')
    .option('-p, --provider <provider>', 'AI provider')
    .option('-k, --key <apiKey>', 'API key')
    .option('-o, --output <file>', 'Output file')
    .action(async (agentName, options) => {
      const configured = checkConfiguredProviders();
      const hasProvider = configured.some(p => p.configured) || options.key;

      if (!hasProvider) {
        console.log(chalk.yellow('⚠️  No AI provider configured.'));
        return;
      }

      let task = options.task;
      if (!task) {
        const { taskInput } = await inquirer.prompt([{ 
          type: 'input', name: 'taskInput', message: `Task for ${agentName}?`
        }]);
        task = taskInput;
      }

      const context = await readProjectContext();
      const providerId = options.provider || getDefaultProvider();
      const provider = createProvider(providerId, { apiKey: options.key, maxTokens: 8000 });

      const finalOutput = await runAgentLoop(agentName, task, provider, context);
      
      if (options.output) {
        await fs.writeFile(options.output, finalOutput);
        console.log(chalk.green(`\n✅ Saved to ${options.output}`));
      }
    });
}

export function registerSwarmCommand(program) {
  program.command('swarm <feature>')
    .description('Run a full agent swarm for a feature')
    .option('-p, --provider <provider>', 'AI provider')
    .option('-k, --key <apiKey>', 'API key')
    .action(async (feature, options) => {
      console.log(chalk.cyan('\n🐝 Ultra-Dex Agent Swarm\n'));
      const context = await readProjectContext();
      const providerId = options.provider || getDefaultProvider();
      const provider = createProvider(providerId, { apiKey: options.key, maxTokens: 8000 });

      console.log(chalk.bold('Step 1: 📋 @Planner breaking down feature...'));
      const plan = await runAgentLoop('planner', feature, provider, context);
      
      console.log(chalk.bold('\nStep 2: 🏗️  @CTO reviewing architecture...'));
      await runAgentLoop('cto', `Review plan:\n${plan}`, provider, context);
    });
}

export default { registerRunCommand, registerSwarmCommand };