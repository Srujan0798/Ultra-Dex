import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { ASSETS_ROOT, ROOT_FALLBACK } from '../config/paths.js';
import { githubBlobUrl } from '../config/urls.js';
import { readWithFallback } from '../utils/fallback.js';
import { pathExists } from '../utils/files.js';
import { showAgentsTable } from '../utils/tables.js';
import { validateSafePath } from '../utils/validation.js';

// Community agents available in the marketplace
const COMMUNITY_AGENTS = {
  'security-auditor': {
    name: '@SecurityAuditor',
    description: 'Security vulnerability scanner and auditor',
    version: '1.0.0',
    downloads: 1250,
  },
  'accessibility': {
    name: '@Accessibility',
    description: 'A11y expert - ensures WCAG compliance',
    version: '1.0.0',
    downloads: 421,
  },
  'api-designer': {
    name: '@APIDesigner',
    description: 'REST/GraphQL API design specialist',
    version: '1.0.0',
    downloads: 892,
  },
  'ml-engineer': {
    name: '@MLEngineer',
    description: 'Machine learning model integration',
    version: '1.0.0',
    downloads: 654,
  },
};

export const AGENTS = [
  { name: 'architect', description: 'Manifest reality from a raw idea', file: '0-orchestration/architect.md', tier: 'Orchestration' },
  { name: 'meta-orchestrator', description: 'High-level system coordination & strategy', file: '0-orchestration/meta-orchestrator.md', tier: 'Orchestration' },
  { name: 'orchestrator', description: 'Multi-agent coordination', file: '0-orchestration/orchestrator.md', tier: 'Orchestration' },
  { name: 'cto', description: 'Architecture & tech decisions', file: '1-leadership/cto.md', tier: 'Leadership' },
  { name: 'planner', description: 'Task breakdown & planning', file: '1-leadership/planner.md', tier: 'Leadership' },
  { name: 'research', description: 'Technology evaluation & comparison', file: '1-leadership/research.md', tier: 'Leadership' },
  { name: 'backend', description: 'API & server logic', file: '2-development/backend.md', tier: 'Development' },
  { name: 'database', description: 'Schema design & queries', file: '2-development/database.md', tier: 'Development' },
  { name: 'frontend', description: 'UI & components', file: '2-development/frontend.md', tier: 'Development' },
  { name: 'auth', description: 'Authentication & authorization', file: '3-security/auth.md', tier: 'Security' },
  { name: 'security', description: 'Security audits & vulnerability fixes', file: '3-security/security.md', tier: 'Security' },
  { name: 'devops', description: 'Deployment & infrastructure', file: '4-devops/devops.md', tier: 'DevOps' },
  { name: 'debugger', description: 'Bug fixing & troubleshooting', file: '5-quality/debugger.md', tier: 'Quality' },
  { name: 'documentation', description: 'Technical writing & docs maintenance', file: '5-quality/documentation.md', tier: 'Quality' },
  { name: 'reviewer', description: 'Code review & quality check', file: '5-quality/reviewer.md', tier: 'Quality' },
  { name: 'testing', description: 'QA & test automation', file: '5-quality/testing.md', tier: 'Quality' },
  { name: 'performance', description: 'Performance optimization', file: '6-specialist/performance.md', tier: 'Specialist' },
  { name: 'refactoring', description: 'Code quality & design patterns', file: '6-specialist/refactoring.md', tier: 'Specialist' },
];

// Pre-compute searchable agents for performance optimization
const SEARCHABLE_AGENTS = [
  ...AGENTS.map(a => ({ ...a, source: 'builtin', searchStr: `${a.name} ${a.description}`.toLowerCase() })),
  ...Object.entries(COMMUNITY_AGENTS).map(([id, a]) => ({ id, ...a, source: 'community', searchStr: `${a.name} ${a.description}`.toLowerCase() }))
];

const CUSTOM_AGENTS_DIR = path.join(process.cwd(), '.ultra-dex', 'custom-agents');

const TIERS = [
  { name: '0 - Orchestration', value: 'Orchestration' },
  { name: '1 - Leadership', value: 'Leadership' },
  { name: '2 - Development', value: 'Development' },
  { name: '3 - Security', value: 'Security' },
  { name: '4 - DevOps', value: 'DevOps' },
  { name: '5 - Quality', value: 'Quality' },
  { name: '6 - Specialist', value: 'Specialist' },
];

export function findBuiltInAgent(name) {
  return AGENTS.find(a => a.name.toLowerCase() === name.toLowerCase());
}

export async function listCustomAgents() {
  try {
    const entries = await fs.readdir(CUSTOM_AGENTS_DIR, { withFileTypes: true });
    return entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
      .map(entry => entry.name.replace(/\.md$/, ''));
  } catch {
    return [];
  }
}

export async function getCustomAgentPath(name) {
  const filePath = path.join(CUSTOM_AGENTS_DIR, `${name}.md`);
  if (await pathExists(filePath)) {
    return filePath;
  }
  return null;
}

export async function readCustomAgent(name) {
  const filePath = await getCustomAgentPath(name);
  if (!filePath) {
    throw new Error(`Custom agent "${name}" not found.`);
  }
  return fs.readFile(filePath, 'utf-8');
}

export async function readAgentPrompt(agent) {
  const agentPath = path.join(ASSETS_ROOT, 'agents', agent.file);
  const fallbackPath = path.join(ROOT_FALLBACK, 'agents', agent.file);
  return readWithFallback(agentPath, fallbackPath, 'utf-8');
}

export function registerAgentsCommand(program) {
  const agentsCmd = program
    .command('agents')
    .alias('agent')
    .description('Agent Management - list, create, and manage agents');

  // Default action: list agents
  agentsCmd.action(async () => {
    await listAgents();
  });

  // agents list
  agentsCmd
    .command('list')
    .alias('ls')
    .description('List all available agents')
    .option('--marketplace', 'Show marketplace agents')
    .option('--builtin', 'Show built-in agents only')
    .action(async (options) => {
      if (options.marketplace) {
        await showMarketplace();
      } else if (options.builtin) {
        await listAgents(true);
      } else {
        await listAgents();
      }
    });

  // agents show <name>
  agentsCmd
    .command('show <name>')
    .description('Show agent prompt and details')
    .action(async (name) => {
      await showAgent(name);
    });

  // agents validate <name>
  agentsCmd
    .command('validate <name>')
    .description('Validate agent configuration')
    .action(async (name) => {
      const agent = findBuiltInAgent(name);
      if (agent) {
        console.log(chalk.green(`✅ Agent @${name} is valid (built-in).`));
      } else {
        console.log(chalk.yellow(`⚠️ Agent @${name} is not a built-in agent.`));
      }
    });

  // agents search <query>
  agentsCmd
    .command('search <query>')
    .description('Search for agents in the marketplace')
    .action(async (query) => {
      console.log(chalk.cyan(`\n🔍 Searching for "${query}"...\n`));

      const lowerQuery = query.toLowerCase();
      const results = SEARCHABLE_AGENTS.filter(a =>
        a.searchStr.includes(lowerQuery)
      );

      if (results.length === 0) {
        console.log(chalk.yellow('No agents found matching your query.'));
      } else {
        console.log(chalk.bold(`Found ${results.length} agent(s):\n`));
        results.forEach(a => {
          const badge = a.source === 'builtin' ? chalk.blue('[built-in]') : chalk.yellow('[marketplace]');
          console.log(`  ${chalk.green('@' + a.name)} ${badge}`);
          console.log(`    ${chalk.gray(a.description)}\n`);
        });
      }
    });

  // agents create <name>
  agentsCmd
    .command('create <name>')
    .description('Create a custom agent')
    .option('-d, --description <desc>', 'Agent description')
    .option('-t, --tier <tier>', 'Agent tier')
    .option('-e, --expertise <expertise>', 'Expertise (comma-separated)')
    .option('-p, --prompt <prompt>', 'Base system prompt')
    .action(async (name, options) => {
      const validation = validateSafePath(name, 'Agent name');
      if (validation !== true) {
        console.log(chalk.red(validation));
        return;
      }

      if (findBuiltInAgent(name)) {
        console.log(chalk.red(`\n❌ "${name}" conflicts with a built-in agent.\n`));
        return;
      }

      let answers;
      if (options.description || options.tier || options.expertise || options.prompt) {
          // Non-interactive mode
          answers = {
              role: options.description || 'Custom AI Agent',
              tier: options.tier || 'Specialist',
              expertise: options.expertise || 'General',
              prompt: options.prompt || `You are @${name}, an AI assistant.`
          };
      } else {
          // Interactive mode
          answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'role',
              message: 'Role description (1 sentence):',
              validate: input => input.trim().length > 0 || 'Role description is required',
            },
            {
              type: 'list',
              name: 'tier',
              message: 'Select tier:',
              choices: TIERS,
            },
            {
              type: 'input',
              name: 'expertise',
              message: 'Expertise areas (comma-separated):',
              validate: input => input.trim().length > 0 || 'Expertise is required',
            },
            {
              type: 'editor',
              name: 'prompt',
              message: 'Base system prompt:',
              default: `# @${name.charAt(0).toUpperCase() + name.slice(1)} Agent\n\nYou are an expert in...`,
              validate: input => input.trim().length > 0 || 'System prompt is required',
            },
          ]);
      }

      const agentContent = `# @${name.charAt(0).toUpperCase() + name.slice(1)} Agent

## Role
${answers.role}

## Tier
${answers.tier}

## Expertise
${answers.expertise}

## System Prompt
${answers.prompt}

## Available Commands
- >> READ_CODE: "filePath"
- >> WRITE_CODE: "filePath" "content"
- >> SEARCH_CODE: "query"
- >> DELEGATE: @AgentName "Task"
`;
      
      await fs.mkdir(CUSTOM_AGENTS_DIR, { recursive: true });
      const outputPath = path.join(CUSTOM_AGENTS_DIR, `${name.toLowerCase()}.md`);
      await fs.writeFile(outputPath, agentContent);
      
      console.log(chalk.green(`\n✅ Custom agent created: ${name.toLowerCase()}\n`));
    });

  // agents delete <name>
  agentsCmd
    .command('delete <name>')
    .description('Delete a custom agent')
    .action(async (name) => {
      const filePath = await getCustomAgentPath(name);
      if (!filePath) {
        console.log(chalk.red(`\n❌ Custom agent "${name}" not found.\n`));
        return;
      }

      const { confirmDelete } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmDelete',
          message: `Delete custom agent "${name}"?`,
          default: false,
        },
      ]);

      if (confirmDelete) {
        await fs.unlink(filePath);
        console.log(chalk.green(`\n✅ Deleted custom agent "${name}".\n`));
      }
    });

  // agents uninstall <name>
  agentsCmd
    .command('uninstall <name>')
    .description('Uninstall an agent from the marketplace')
    .action(async (name) => {
      const agentsDir = path.join(process.cwd(), '.ultra-dex', 'marketplace-agents');
      const agentFile = path.join(agentsDir, `${name.toLowerCase()}.json`);
      
      try {
        await fs.unlink(agentFile);
        console.log(chalk.green(`\n✅ Uninstalled agent: ${name}\n`));
      } catch {
        console.log(chalk.red(`\n❌ Agent "${name}" not found in marketplace installs.\n`));
      }
    });

  // agents publish <name>
  agentsCmd
    .command('publish <name>')
    .description('Publish an agent to the marketplace')
    .action(async (name) => {
      console.log(chalk.cyan(`\n🚀 Preparing to publish agent: ${name}...`));
      console.log(chalk.yellow('   (This feature is coming soon to the Ultra-Dex Marketplace)\n'));
    });

  // agents install <name>
  agentsCmd
    .command('install <name>')
    .alias('i')
    .description('Install an agent from the marketplace')
    .action(async (name) => {
      const spinner = ora(`Installing ${name}...`).start();
      const agent = COMMUNITY_AGENTS[name.toLowerCase()];
      if (!agent) {
        spinner.fail(`Agent "${name}" not found in marketplace`);
        console.log(chalk.gray('\nUse `ultra-dex agents list --marketplace` to see available agents'));
        return;
      }
      const agentsDir = path.join(process.cwd(), '.ultra-dex', 'marketplace-agents');
      await fs.mkdir(agentsDir, { recursive: true });
      const agentConfig = {
        id: name.toLowerCase(),
        name: agent.name,
        description: agent.description,
        version: agent.version,
        installedAt: new Date().toISOString(),
        systemPrompt: `You are ${agent.name}, ${agent.description}`,
      };
      await fs.writeFile(path.join(agentsDir, `${name.toLowerCase()}.json`), JSON.stringify(agentConfig, null, 2));
      spinner.succeed(`Installed ${chalk.green(agent.name)} v${agent.version}`);
    });

}

async function showMarketplace() {
  console.log(chalk.cyan('\n🏪 Ultra-Dex Agent Marketplace\n'));
  console.log(chalk.bold('Available Community Agents:'));
  console.log(chalk.gray('─'.repeat(50)));
  for (const [, agent] of Object.entries(COMMUNITY_AGENTS)) {
    console.log(`  ${chalk.yellow(agent.name)} ${chalk.gray(`v${agent.version}`)}`);
    console.log(`    ${chalk.white(agent.description)}`);
    console.log(`    ${chalk.gray(`↓ ${agent.downloads} downloads`)}\n`);
  }
  console.log(chalk.gray('Install with: ultra-dex agents install <name>\n'));
}

async function listAgents(builtinOnly = false) {
  const customAgents = builtinOnly ? [] : await listCustomAgents();
  const totalAgents = AGENTS.length + customAgents.length;
  const header = builtinOnly ? 'Built-in Agents' : `Ultra-Dex AI Agents (${totalAgents} Total)`;
  console.log(chalk.bold(`\n🤖 ${header}\n`));
  
  const agentsForTable = AGENTS.map(agent => ({
    tier: agent.tier,
    name: agent.name,
    status: 'ready'
  }));

  if (customAgents.length > 0) {
    customAgents.forEach(name => {
      agentsForTable.push({
        tier: 'Custom',
        name: name,
        status: 'ready'
      });
    });
  }

  showAgentsTable(agentsForTable);

  console.log('\n' + chalk.bold('Usage:'));
  console.log(chalk.gray('  ultra-dex agent show <name>     Show agent prompt'));
  console.log(chalk.gray('  ultra-dex pack <name>           Package agent + context'));

  console.log(`\n${chalk.gray(`Agent Index: ${githubBlobUrl('agents/00-AGENT_INDEX.md')}\n`)}`);
}

async function showAgent(name) {
  const agent = AGENTS.find(a => a.name.toLowerCase() === name.toLowerCase());
  if (!agent) {
    const custom = await getCustomAgentPath(name);
    if (custom) {
      const content = await fs.readFile(custom, 'utf-8');
      console.log(chalk.bold(`\n🤖 Custom Agent: ${name}\n`));
      console.log(content);
      return;
    }
    console.log(chalk.red(`\n❌ Agent "${name}" not found.`));
    return;
  }

  try {
    const prompt = await readAgentPrompt(agent);
    console.log(chalk.bold(`\n🤖 Agent: ${agent.name} (${agent.tier})\n`));
    console.log(chalk.gray(agent.description) + '\n');
    console.log(chalk.gray('─'.repeat(60)));
    console.log(prompt);
    console.log(chalk.gray('─'.repeat(60)));
  } catch (err) {
    console.log(chalk.red(`\n❌ Could not read prompt for ${agent.name}`));
  }
}

import { spawn } from 'child_process';

/**
 * Secure cross-platform clipboard copy
 */
async function copyToClipboard(text) {
  const platform = process.platform;
  let command, args;

  if (platform === 'darwin') {
    command = 'pbcopy';
    args = [];
  } else if (platform === 'win32') {
    command = 'powershell.exe';
    args = ['-command', 'Set-Clipboard', '-Value', text];
  } else {
    // Linux/Unix fallback
    command = 'xclip';
    args = ['-selection', 'clipboard'];
  }

  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    
    child.on('error', (err) => {
      // Fallback for xclip if not installed
      if (platform !== 'darwin' && platform !== 'win32') {
          const fallback = spawn('xsel', ['--clipboard', '--input']);
          fallback.stdin.write(text);
          fallback.stdin.end();
          fallback.on('close', (code) => code === 0 ? resolve() : reject(err));
          return;
      }
      reject(err);
    });

    if (platform !== 'win32') {
        child.stdin.write(text);
        child.stdin.end();
    }

    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Clipboard command failed with code ${code}`));
    });
  });
}

export function registerPackCommand(program) {
  program
    .command('pack <agent>')
    .description('Package project context + agent prompt for any AI tool')
    .option('-c, --clipboard', 'Copy to clipboard (requires pbcopy/xclip)')
    .action(async (agentName, options) => {
      const agent = AGENTS.find(a => a.name.toLowerCase() === agentName.toLowerCase());
      if (!agent) {
        console.log(chalk.red(`\n❌ Agent "${agentName}" not found.\n`));
        return;
      }

      let output = '';
      try {
        const agentPrompt = await readAgentPrompt(agent);
        output += agentPrompt + '\n\n';
      } catch (err) {
        output += `# ${agent.name.toUpperCase()} Agent\n\n`;
      }

      output += '---\n\n';
      try {
        const context = await fs.readFile('CONTEXT.md', 'utf-8');
        output += '# PROJECT CONTEXT\n\n' + context + '\n\n';
      } catch (err) {
        output += '# PROJECT CONTEXT\n\n*No CONTEXT.md found.*\n\n';
      }

      output += '---\n\n';
      try {
        const plan = await fs.readFile('IMPLEMENTATION-PLAN.md', 'utf-8');
        output += '# IMPLEMENTATION PLAN\n\n' + plan + '\n';
      } catch (err) {
        output += '# IMPLEMENTATION PLAN\n\n*No IMPLEMENTATION-PLAN.md found.*\n';
      }

      console.log(chalk.bold(`\n📦 Packed context for @${agent.name}\n`));
      console.log(output);

      if (options.clipboard) {
        try {
          await copyToClipboard(output);
          console.log(chalk.green('\n✅ Copied to clipboard!\n'));
        } catch (err) {
          console.log(chalk.yellow('\n⚠️  Could not copy to clipboard. Ensure pbcopy, xclip, or xsel is installed.'));
        }
      }
    });
}

