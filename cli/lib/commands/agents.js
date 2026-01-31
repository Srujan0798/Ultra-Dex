import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
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

const CUSTOM_AGENTS_DIR = path.join(process.cwd(), '.ultra-dex', 'custom-agents');

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
    .description('Agent Marketplace - list, install, and manage agents');

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
    .action(async (options) => {
      if (options.marketplace) {
        await showMarketplace();
      } else {
        await listAgents();
      }
    });

  // agents search <query>
  agentsCmd
    .command('search <query>')
    .description('Search for agents in the marketplace')
    .action(async (query) => {
      console.log(chalk.cyan(`\n🔍 Searching for "${query}"...\n`));
      const allAgents = [...AGENTS.map(a => ({ ...a, source: 'builtin' })),
                        ...Object.entries(COMMUNITY_AGENTS).map(([id, a]) => ({ id, ...a, source: 'community' }))];
      const results = allAgents.filter(a =>
        `${a.name} ${a.description}`.toLowerCase().includes(query.toLowerCase())
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
        systemPrompt: generateCommunityAgentPrompt(name.toLowerCase()),
      };
      await fs.writeFile(path.join(agentsDir, `${name.toLowerCase()}.json`), JSON.stringify(agentConfig, null, 2));
      spinner.succeed(`Installed ${chalk.green(agent.name)} v${agent.version}`);
      console.log(chalk.gray(`\nUse with: ultra-dex run ${name.toLowerCase()} -t "your task"`));
    });

  // agents uninstall <name>
  agentsCmd
    .command('uninstall <name>')
    .alias('rm')
    .description('Uninstall a marketplace agent')
    .action(async (name) => {
      const spinner = ora(`Uninstalling ${name}...`).start();
      try {
        const agentPath = path.join(process.cwd(), '.ultra-dex', 'marketplace-agents', `${name.toLowerCase()}.json`);
        await fs.unlink(agentPath);
        spinner.succeed(`Uninstalled ${name}`);
      } catch {
        spinner.fail(`Agent "${name}" is not installed`);
      }
    });

  // agents create <name>
  agentsCmd
    .command('create <name>')
    .description('Create a custom agent')
    .option('-d, --description <desc>', 'Agent description')
    .action(async (name, options) => {
      const validation = validateSafePath(name, 'Agent name');
      if (validation !== true) {
        console.log(chalk.red(validation));
        return;
      }
      const customDir = path.join(process.cwd(), '.ultra-dex', 'custom-agents');
      await fs.mkdir(customDir, { recursive: true });
      const agentContent = `# @${name.charAt(0).toUpperCase() + name.slice(1)} Agent

## Role
${options.description || `Custom agent: ${name}`}

## Instructions
You are @${name.charAt(0).toUpperCase() + name.slice(1)}, a custom Ultra-Dex agent.
Follow user instructions carefully and provide helpful responses.

## Available Commands
- >> READ_CODE: "filePath" - Read a file
- >> WRITE_CODE: "filePath" "content" - Create/update a file
- >> SEARCH_CODE: "query" - Search the codebase
- >> DELEGATE: @AgentName "Task" - Delegate to another agent
`;
      await fs.writeFile(path.join(customDir, `${name.toLowerCase()}.md`), agentContent);
      console.log(chalk.green(`\n✅ Created custom agent: @${name}`));
      console.log(chalk.gray(`\nEdit: .ultra-dex/custom-agents/${name.toLowerCase()}.md`));
      console.log(chalk.gray(`Use with: ultra-dex agent ${name.toLowerCase()}\n`));
    });

  // agents publish <name>
  agentsCmd
    .command('publish <name>')
    .description('Publish a custom agent to the marketplace (coming soon)')
    .action(async (name) => {
      console.log(chalk.cyan('\n📤 Publishing Agent to Marketplace\n'));
      console.log(chalk.yellow('⚠️  Marketplace publishing is coming soon!'));
      console.log(chalk.gray('\nFor now, share your agent by copying:'));
      console.log(chalk.gray(`  .ultra-dex/custom-agents/${name.toLowerCase()}.md\n`));
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

function generateCommunityAgentPrompt(agentId) {
  const prompts = {
    'security-auditor': `You are @SecurityAuditor, a security specialist. Analyze code for OWASP Top 10 vulnerabilities, injection attacks, auth flaws, and sensitive data exposure.`,
    'accessibility': `You are @Accessibility, an A11y expert. Ensure WCAG compliance, proper ARIA labels, keyboard navigation, and screen reader compatibility.`,
    'api-designer': `You are @APIDesigner, an API design specialist. Design RESTful and GraphQL APIs with proper versioning, authentication, and documentation.`,
    'ml-engineer': `You are @MLEngineer, a machine learning specialist. Help integrate ML models, optimize inference, and implement AI features.`,
  };
  return prompts[agentId] || `You are a custom Ultra-Dex agent. Follow user instructions carefully.`;
}

async function listAgents() {
  const customAgents = await listCustomAgents();
  const totalAgents = AGENTS.length + customAgents.length;
  console.log(chalk.bold(`\n🤖 Ultra-Dex AI Agents (${totalAgents} Total)\n`));
  
  // Format agents for the table
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

export function registerPackCommand(program) {
  program
    .command('pack <agent>')
    .description('Package project context + agent prompt for any AI tool')
    .option('-c, --clipboard', 'Copy to clipboard (requires pbcopy/xclip)')
    .action(async (agentName, options) => {
      const agent = AGENTS.find(a => a.name.toLowerCase() === agentName.toLowerCase());
      if (!agent) {
        console.log(chalk.red(`\n❌ Agent "${agentName}" not found.\n`));
        console.log(chalk.gray('Available agents:'));
        AGENTS.forEach(a => console.log(chalk.cyan(`  - ${a.name}`)));
        process.exit(1);
      }

      let output = '';

      try {
        const agentPrompt = await readAgentPrompt(agent);
        output += agentPrompt + '\n\n';
      } catch (err) {
        output += `# ${agent.name.toUpperCase()} Agent\n\nSee: ${githubBlobUrl(`agents/${agent.file}`)}\n\n`;
      }

      output += '---\n\n';

      try {
        const context = await fs.readFile('CONTEXT.md', 'utf-8');
        output += '# PROJECT CONTEXT\n\n' + context + '\n\n';
      } catch (err) {
        output += '# PROJECT CONTEXT\n\n*No CONTEXT.md found. Run `ultra-dex init` first.*\n\n';
      }

      output += '---\n\n';

      try {
        const plan = await fs.readFile('IMPLEMENTATION-PLAN.md', 'utf-8');
        output += '# IMPLEMENTATION PLAN\n\n' + plan + '\n';
      } catch (err) {
        output += '# IMPLEMENTATION PLAN\n\n*No IMPLEMENTATION-PLAN.md found. Run `ultra-dex init` first.*\n';
      }

      console.log(chalk.bold(`\n📦 Packed context for @${agent.name}\n`));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(output);
      console.log(chalk.gray('─'.repeat(60)));

      if (options.clipboard) {
        try {
          const { execSync } = await import('child_process');
          const platform = process.platform;
          if (platform === 'darwin') {
            execSync('pbcopy', { input: output });
            console.log(chalk.green('\n✅ Copied to clipboard!\n'));
          } else if (platform === 'linux') {
            execSync('xclip -selection clipboard', { input: output });
            console.log(chalk.green('\n✅ Copied to clipboard!\n'));
          } else {
            console.log(chalk.yellow('\n⚠️  Clipboard not supported on this platform. Copy manually.\n'));
          }
        } catch (err) {
          console.log(chalk.yellow('\n⚠️  Could not copy to clipboard. Copy manually.\n'));
        }
      } else {
        console.log(chalk.cyan('\n💡 Tip: Use --clipboard flag to copy directly\n'));
      }
    });
}
