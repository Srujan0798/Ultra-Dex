/**
 * ultra-dex run command
 * Execute agent tasks automatically (the "swarm" approach)
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createProvider, getDefaultProvider, checkConfiguredProviders } from '../providers/index.js';
import { projectGraph } from '../mcp/graph.js';
import { errorRecovery } from '../utils/error-recovery.js';
import { dashboardNotifier } from '../utils/dashboard-notifier.js';

const execAsync = promisify(exec);

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
  debugger: {
    name: '@Debugger',
    role: 'Bug Fixing Specialist',
    systemPrompt: `You are @Debugger. Analyze logs and code to identify and fix bugs.
Available commands:
>> READ_CODE: "path"
>> SEARCH_CODE: "query"
>> WRITE_CODE: "path" "content"`,
  },
  devops: {
    name: '@DevOps',
    role: 'CI/CD & Infrastructure Specialist',
    systemPrompt: `You are @DevOps. Manage deployment, infrastructure, and git operations.
Available commands:
>> RUN_SHELL: "command"
>> READ_CODE: "path"
>> WRITE_CODE: "path" "content"
>> SEARCH_CODE: "query"`,
  },
};

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
    graphPromise
  ]);

  context.plan = plan;
  context.context = ctx;
  context.state = state;
  context.graph = graph;

  return context;
}

export async function runAgentLoop(agentName, task, provider, projectContext, depth = 0) {
  if (depth > 5) return `[System]: Max delegation depth reached.`;

  const agent = AGENTS[agentName.toLowerCase()];
  if (!agent) return `[System]: Unknown agent @${agentName}`;

  const spinner = ora(`\${agent.name} is working...`).start();
  
  // Notify Dashboard
  await dashboardNotifier.sendAgentStatus(agentName, 'working', task.substring(0, 50));

  const graphInfo = projectContext.graph 
    ? `## Codebase Graph\n- Files: ${projectContext.graph.nodeCount}\n- Dependencies: ${projectContext.graph.edgeCount}\n` 
    : '';

  const historySection = projectContext.history ? `## Execution History\n${projectContext.history}\n\n` : '';
  const contextSection = projectContext.context ? `## Context\n${projectContext.context.slice(0, 3000)}\n\n${graphInfo}${historySection}` : '';
  const prompt = `${contextSection}## Task\n${task}\n\nYou can use tools by outputting:
>> READ_CODE: "filePath"
>> WRITE_CODE: "filePath" "fullContent"
>> SEARCH_CODE: "query"
>> RUN_SHELL: "command"
>> DELEGATE: @AgentName "Task"`;

  try {
    const result = await errorRecovery.executeWithRecovery('ai-provider', async () => {
        return await provider.generate(agent.systemPrompt, prompt);
    }, {
        maxRetries: 2,
        retryDelay: 2000
    });
    
    spinner.succeed(`\${agent.name} completed.`);
    await dashboardNotifier.sendAgentStatus(agentName, 'completed', 'Task finished');

    let content = result.content;

    // Tool Execution Logic (God Mode)
    const readMatch = content.match(/>>\s*READ_CODE:\s*["'](.+?)["']/);
    const writeMatch = content.match(/>>\s*WRITE_CODE:\s*["'](.+?)["']\s*["']([\s\S]+?)["']/);
    const _searchMatch = content.match(/>>\s*SEARCH_CODE:\s*["'](.+?)["']/);
    const runShellMatch = content.match(/>>\s*RUN_SHELL:\s*["'](.+?)["']/);
    const delegateMatch = content.match(/>>\s*DELEGATE:\s*@(\w+)\s*["'](.+?)["']/);

    if (readMatch) {
      let filePath = readMatch[1];
      // Sanitize file path to prevent directory traversal
      filePath = path.normalize(filePath);
      if (filePath.includes('../') || filePath.includes('..\\')) {
        return await runAgentLoop(agentName, `${task}\n\nError reading ${filePath}: Path traversal detected`, provider, projectContext, depth + 1);
      }

      console.log(chalk.cyan(`\n🔍 \${agent.name} is reading \${filePath}...`));
      await dashboardNotifier.sendLog(`@\${agentName} is reading \${filePath}`, 'info');
      try {
        const fullPath = path.resolve(process.cwd(), filePath);
        // Additional check to ensure path is within project directory
        if (!fullPath.startsWith(process.cwd())) {
          return await runAgentLoop(agentName, `${task}\n\nError reading ${filePath}: Path outside project root`, provider, projectContext, depth + 1);
        }

        const fileContent = await fs.readFile(fullPath, 'utf8');
        const nextPrompt = `Output of READ_CODE "${filePath}":\n\`\`\`\n${fileContent}\n\`\`\`\n\nPlease proceed with your task.`;
        return await runAgentLoop(agentName, `${task}\n\n${nextPrompt}`, provider, projectContext, depth + 1);
      } catch (e) {
        return await runAgentLoop(agentName, `${task}\n\nError reading ${filePath}: ${e.message}`, provider, projectContext, depth + 1);
      }
    }

    if (writeMatch) {
      let filePath = writeMatch[1];
      const newContent = writeMatch[2];

      // Sanitize file path to prevent directory traversal
      filePath = path.normalize(filePath);
      if (filePath.includes('../') || filePath.includes('..\\')) {
        return await runAgentLoop(agentName, `${task}\n\nError writing ${filePath}: Path traversal detected`, provider, projectContext, depth + 1);
      }

      console.log(chalk.green(`\n💾 \${agent.name} is writing to \${filePath}...`));
      await dashboardNotifier.sendLog(`@\${agentName} is writing to \${filePath}`, 'success');
      try {
        const fullPath = path.resolve(process.cwd(), filePath);
        // Additional check to ensure path is within project directory
        if (!fullPath.startsWith(process.cwd())) {
          return await runAgentLoop(agentName, `${task}\n\nError writing ${filePath}: Path outside project root`, provider, projectContext, depth + 1);
        }

        // Prevent writing to sensitive files
        const forbiddenPaths = ['.git', 'node_modules', '.env', 'package-lock.json'];
        const pathParts = fullPath.split(path.sep);
        if (pathParts.some(part => forbiddenPaths.includes(part))) {
          return await runAgentLoop(agentName, `${task}\n\nError writing ${filePath}: Cannot write to sensitive file`, provider, projectContext, depth + 1);
        }

        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, newContent, 'utf8');
        const nextPrompt = `Successfully wrote ${filePath}. Please proceed or delegate verification.`;
        return await runAgentLoop(agentName, `${task}\n\n${nextPrompt}`, provider, projectContext, depth + 1);
      } catch (e) {
        return await runAgentLoop(agentName, `${task}\n\nError writing ${filePath}: ${e.message}`, provider, projectContext, depth + 1);
      }
    }

    if (runShellMatch) {
      const command = runShellMatch[1];
      console.log(chalk.yellow(`\n⚡ ${agent.name} is executing shell command: ${command}...`));

      try {
        const { stdout, stderr } = await execAsync(command);
        const output = stdout + (stderr ? `\nSTDERR:\n${stderr}` : '');
        const nextPrompt = `Output of RUN_SHELL "${command}":\n\`\`\`\n${output}\n\`\`\`\n\nPlease proceed with your task.`;
        return await runAgentLoop(agentName, `${task}\n\n${nextPrompt}`, provider, projectContext, depth + 1);
      } catch (e) {
        return await runAgentLoop(agentName, `${task}\n\nError executing ${command}: ${e.message}`, provider, projectContext, depth + 1);
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
    .option('--stream', 'Stream output in real-time')
    .option('--no-stream', 'Disable streaming')
    .action(async (agentName, options) => {
      const configured = checkConfiguredProviders();
      const hasProvider = configured.some(p => p.configured) || options.key;

      if (!hasProvider) {
        console.log(chalk.yellow('\n⚠️  No AI provider configured.\n'));
        console.log(chalk.white('To use AI agents, configure one of these:'));
        console.log(chalk.gray('  export ANTHROPIC_API_KEY=sk-ant-...  # Claude'));
        console.log(chalk.gray('  export OPENAI_API_KEY=sk-...         # OpenAI'));
        console.log(chalk.gray('  export GOOGLE_AI_KEY=...             # Gemini'));
        console.log(chalk.white('\nOr use local AI with Ollama (no key needed):'));
        console.log(chalk.gray('  ultra-dex run planner -t "task" --provider ollama\n'));
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