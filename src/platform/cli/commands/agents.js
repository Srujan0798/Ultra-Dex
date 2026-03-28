// Copyright (c) 2026 Ultra-Dex

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
import { marketplaceClient } from '../marketplace/client.js';
import { authorizeAgentAccess, filterAgentsByAccess } from '../enterprise/agent-access.js';
import { printError, printInfo, printWarning } from '../utils/output.js';
import { registerAgentGenerator } from './agent-gen.js';

export const AGENTS = [
  {
    name: 'architect',
    description: 'Manifest reality from a raw idea',
    file: '0-orchestration/architect.md',
    tier: 'Orchestration',
  },
  {
    name: 'meta-orchestrator',
    description: 'High-level system coordination & strategy',
    file: '0-orchestration/meta-orchestrator.md',
    tier: 'Orchestration',
  },
  {
    name: 'orchestrator',
    description: 'Multi-agent coordination',
    file: '0-orchestration/orchestrator.md',
    tier: 'Orchestration',
  },
  {
    name: 'cto',
    description: 'Architecture & tech decisions',
    file: '1-leadership/cto.md',
    tier: 'Leadership',
  },
  {
    name: 'planner',
    description: 'Task breakdown & planning',
    file: '1-leadership/planner.md',
    tier: 'Leadership',
  },
  {
    name: 'research',
    description: 'Technology evaluation & comparison',
    file: '1-leadership/research.md',
    tier: 'Leadership',
  },
  {
    name: 'backend',
    description: 'API & server logic',
    file: '2-development/backend.md',
    tier: 'Development',
  },
  {
    name: 'database',
    description: 'Schema design & queries',
    file: '2-development/database.md',
    tier: 'Development',
  },
  {
    name: 'frontend',
    description: 'UI & components',
    file: '2-development/frontend.md',
    tier: 'Development',
  },
  {
    name: 'auth',
    description: 'Authentication & authorization',
    file: '3-security/auth.md',
    tier: 'Security',
  },
  {
    name: 'security',
    description: 'Security audits & vulnerability fixes',
    file: '3-security/security.md',
    tier: 'Security',
  },
  {
    name: 'devops',
    description: 'Deployment & infrastructure',
    file: '4-devops/devops.md',
    tier: 'DevOps',
  },
  {
    name: 'debugger',
    description: 'Bug fixing & troubleshooting',
    file: '5-quality/debugger.md',
    tier: 'Quality',
  },
  {
    name: 'documentation',
    description: 'Technical writing & docs maintenance',
    file: '5-quality/documentation.md',
    tier: 'Quality',
  },
  {
    name: 'reviewer',
    description: 'Code review & quality check',
    file: '5-quality/reviewer.md',
    tier: 'Quality',
  },
  {
    name: 'testing',
    description: 'QA & test automation',
    file: '5-quality/testing.md',
    tier: 'Quality',
  },
  {
    name: 'performance',
    description: 'Performance optimization',
    file: '6-specialist/performance.md',
    tier: 'Specialist',
  },
  {
    name: 'refactoring',
    description: 'Code quality & design patterns',
    file: '6-specialist/refactoring.md',
    tier: 'Specialist',
  },
];

// Pre-compute searchable agents for performance optimization
const SEARCHABLE_AGENTS = [
  ...AGENTS.map((a) => ({
    ...a,
    source: 'builtin',
    searchStr: `${a.name} ${a.description}`.toLowerCase(),
  })),
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

const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_SEARCH_PAGE_SIZE = 10;

/**
 * Safely parse a positive integer
 * @param {any} value - Value to parse
 * @param {number} fallback - Fallback if invalid
 * @returns {number} Parsed integer
 */
function parsePositiveInt(value, fallback) {
  if (value === undefined || value === null) return fallback;
  const parsed = parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
}

/**
 * Paginate an array of items
 * @param {Array} items - Items to paginate
 * @param {number} page - Current page (1-based)
 * @param {number} limit - Items per page
 * @returns {Object} Pagination result {total, totalPages, page, limit, start, end, items}
 */
function paginate(items, page, limit) {
  const safeLimit = Math.max(1, limit);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIdx = (safePage - 1) * safeLimit;
  const endIdx = Math.min(startIdx + safeLimit, total);
  return {
    total,
    totalPages,
    page: safePage,
    limit: safeLimit,
    start: total === 0 ? 0 : startIdx + 1,
    end: endIdx,
    items: items.slice(startIdx, endIdx),
  };
}

function printPaginationSummary({ total, totalPages, page, start, end }) {
  if (totalPages <= 1) return;
  printInfo(
    chalk.gray(
      `Showing ${start}-${end} of ${total} (page ${page}/${totalPages}). Use --page/--limit to navigate.`
    )
  );
}

/**
 * Find a built-in agent by name
 * @param {string} name - Agent name
 * @returns {Object|undefined} Agent definition or undefined
 */
export function findBuiltInAgent(name) {
  return AGENTS.find((a) => a.name.toLowerCase() === name.toLowerCase());
}

/**
 * List all custom agents in the local .ultra-dex/custom-agents directory
 * @returns {Promise<string[]>} List of agent names
 */
export async function listCustomAgents() {
  try {
    const entries = await fs.readdir(CUSTOM_AGENTS_DIR, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name.replace(/\.md$/, ''));
  } catch {
    return [];
  }
}

/**
 * Get the file path for a custom agent
 * @param {string} name - Agent name
 * @returns {Promise<string|null>} Absolute file path or null if not found
 */
export async function getCustomAgentPath(name) {
  // Rigorous validation of agent name
  const validation = validateSafePath(name, 'Agent name');
  if (validation !== true || name.includes('/') || name.includes('\\')) {
    return null;
  }

  const filePath = path.join(CUSTOM_AGENTS_DIR, `${name.toLowerCase()}.md`);

  // Final safety check: ensure the resulting path is still inside CUSTOM_AGENTS_DIR
  if (!filePath.startsWith(CUSTOM_AGENTS_DIR)) {
    return null;
  }

  if (await pathExists(filePath)) {
    return filePath;
  }
  return null;
}

export async function readCustomAgent(name) {
  const filePath = await getCustomAgentPath(name);
  if (!filePath) {
    throw new Error(`Custom agent "${name}" not found or invalid name.`);
  }
  return fs.readFile(filePath, 'utf-8');
}

/**
 * Read the prompt content for a given agent
 * @param {Object} agent - Agent definition object
 * @returns {Promise<string>} The agent's system prompt
 * @throws {Error} If path is invalid or file is not found
 */
export async function readAgentPrompt(agent) {
  // Validate built-in agent file reference
  if (agent.file.includes('..') || path.isAbsolute(agent.file)) {
    throw new Error(`Security breach: Malformed built-in agent file path for @${agent.name}`);
  }

  const agentPath = path.join(ASSETS_ROOT, 'agents', agent.file);
  const fallbackPath = path.join(ROOT_FALLBACK, 'agents', agent.file);

  // Double-check paths are still within bounds
  if (!agentPath.startsWith(ASSETS_ROOT) && !agentPath.startsWith(ROOT_FALLBACK)) {
    throw new Error(`Access denied: Agent prompt path out of bounds for @${agent.name}`);
  }

  return readWithFallback(agentPath, fallbackPath, 'utf-8');
}

/**
 * Extract metadata from an agent markdown file
 * @param {string} content - Markdown content
 * @returns {Object} Metadata {name, description, version, prompt, tags}
 */
function extractAgentMetadata(content) {
  const nameMatch = content.match(/^#\\s*@?([^\\n]+)/m);
  const roleMatch = content.match(/##\\s+Role\\s*\\n([\\s\\S]*?)(\\n##|$)/i);
  const versionMatch = content.match(/##\\s+Version\\s*\\n([\\s\\S]*?)(\\n##|$)/i);
  const promptMatch = content.match(/##\\s+System Prompt\\s*\\n([\\s\\S]*?)(\\n##|$)/i);
  const expertiseMatch = content.match(/##\\s+Expertise\\s*\\n([\\s\\S]*?)(\\n##|$)/i);

  const name = nameMatch ? nameMatch[1].trim() : null;
  const description = roleMatch ? roleMatch[1].trim().replace(/\\n+/g, ' ') : null;
  const version = versionMatch ? versionMatch[1].trim().split(/\\s+/)[0] : null;
  const prompt = promptMatch ? promptMatch[1].trim() : null;
  const tags = expertiseMatch
    ? expertiseMatch[1]
      .split(/[,\\n]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
    : [];

  return { name, description, version, prompt, tags };
}

/**
 * Check health status of all built-in agents
 * @returns {Promise<Array<{agent: string, status: string, error: string|null}>>} Health report
 */
export async function checkAgentsHealth() {
  const healthResults = [];

  for (const agent of AGENTS) {
    try {
      const prompt = await readAgentPrompt(agent);
      const isHealthy = prompt && prompt.length > 50;
      healthResults.push({
        agent: agent.name,
        status: isHealthy ? 'healthy' : 'malformed',
        error: isHealthy ? null : 'Prompt content too short or empty',
      });
    } catch (err) {
      healthResults.push({
        agent: agent.name,
        status: 'error',
        error: err.message,
      });
    }
  }

  return healthResults;
}

/**
 * Register agents command with Commander
 * @param {Command} program - Commander program instance
 */
export function registerAgentsCommand(program) {
  const agentsCmd = program
    .command('agents')
    .alias('agent')
    .description('Agent Management - list, create, and manage agents')
    .option('--page <number>', 'Page number for list output', String(1))
    .option('--limit <number>', 'Items per page for list output', String(DEFAULT_PAGE_SIZE))
    .option('--json', 'Output list as JSON');

  agentsCmd._examples = [
    { command: 'ultra-dex agents', description: 'List all built-in and custom agents' },
    { command: 'ultra-dex agents list --page 2 --limit 10', description: 'Paginate agents list' },
    { command: 'ultra-dex agents show frontend', description: 'Show a specific agent prompt' },
    {
      command: 'ultra-dex agent generate --domain fintech',
      description: 'Generate a domain agent template',
    },
  ];

  // Default action: list agents
  agentsCmd.action(async (options) => {
    try {
      const page = parsePositiveInt(options.page, 1);
      const limit = parsePositiveInt(options.limit, DEFAULT_PAGE_SIZE);
      await listAgents({ builtinOnly: false, page, limit, json: !!options.json });
    } catch (error) {
      printError(chalk.red(`Agents listing failed: ${error.message}`));
      process.exitCode = 1;
    }
  });

  // agents health
  agentsCmd
    .command('health')
    .description('Check health of all built-in agents')
    .action(async () => {
      const spinner = ora('Checking agent health...').start();
      try {
        const results = await checkAgentsHealth();

        const errors = results.filter((r) => r.status !== 'healthy');
        if (errors.length === 0) {
          spinner.succeed(
            chalk.green(`All ${results.length} built-in agents are healthy and readable.`)
          );
        } else {
          spinner.fail(chalk.red(`${errors.length} agents have issues:`));
          errors.forEach((e) => {
            logger.log(`  ${chalk.yellow('@' + e.agent)}: ${chalk.gray(e.error)}`);
          });
        }
      } catch (error) {
        spinner.fail('Health check failed');
        printError(chalk.red(error.message));
      }
    });

  // agents list
  agentsCmd
    .command('list')
    .alias('ls')
    .description('List all available agents')
    .option('--marketplace', 'Show marketplace agents')
    .option('--builtin', 'Show built-in agents only')
    .option(
      '--tier <tier>',
      'Filter by tier (Orchestration, Leadership, Development, Security, DevOps, Quality, Specialist)'
    )
    .option(
      '--category <category>',
      'Filter by category (orchestration, leadership, development, security, devops, quality, specialist)'
    )
    .option('--page <number>', 'Page number', String(1))
    .option('--limit <number>', 'Items per page', String(DEFAULT_PAGE_SIZE))
    .option('--json', 'Output list as JSON')
    .action(async (options) => {
      try {
        const page = parsePositiveInt(options.page, 1);
        const limit = parsePositiveInt(options.limit, DEFAULT_PAGE_SIZE);
        if (options.marketplace) {
          await showMarketplace({ page, limit, json: !!options.json });
        } else if (options.builtin) {
          await listAgents({
            builtinOnly: true,
            page,
            limit,
            json: !!options.json,
            tier: options.tier,
            category: options.category,
          });
        } else {
          await listAgents({
            builtinOnly: false,
            page,
            limit,
            json: !!options.json,
            tier: options.tier,
            category: options.category,
          });
        }
      } catch (error) {
        printError(chalk.red(`Failed to list agents: ${error.message}`));
      }
    });

  // agents show <name>
  agentsCmd
    .command('show <name>')
    .description('Show agent prompt and details')
    .action(async (name) => {
      try {
        await showAgent(name);
      } catch (error) {
        printError(chalk.red(`Failed to show agent: ${error.message}`));
      }
    });

  // agents validate <name>
  agentsCmd
    .command('validate <name>')
    .description('Validate agent configuration')
    .action(async (name) => {
      try {
        const agent = findBuiltInAgent(name);
        if (agent) {
          logger.log(chalk.green(`✅ Agent @${name} is valid (built-in).`));
        } else {
          logger.log(chalk.yellow(`⚠️ Agent @${name} is not a built-in agent.`));
        }
      } catch (error) {
        printError(chalk.red(`Validation failed: ${error.message}`));
      }
    });

  // agents search <query>
  agentsCmd
    .command('search <query>')
    .description('Search for agents in the marketplace')
    .option('--page <number>', 'Page number', String(1))
    .option('--limit <number>', 'Items per page', String(DEFAULT_SEARCH_PAGE_SIZE))
    .option('--json', 'Output search results as JSON')
    .action(async (query, options) => {
      try {
        logger.log(chalk.cyan(`\n🔍 Searching for "${query}"...\n`));

        const lowerQuery = query.toLowerCase();
        const builtinResults = SEARCHABLE_AGENTS.filter((a) => a.searchStr.includes(lowerQuery));

        let marketplaceResults = [];
        try {
          marketplaceResults = await marketplaceClient.searchAgents(query);
        } catch (error) {
          printWarning(chalk.yellow('Marketplace search failed. Showing built-in results only.'));
        }

        const results = [
          ...builtinResults.map((result) => ({ ...result, source: 'builtin' })),
          ...marketplaceResults.map((result) => ({ ...result, source: 'marketplace' })),
        ];

        const page = parsePositiveInt(options.page, 1);
        const limit = parsePositiveInt(options.limit, DEFAULT_SEARCH_PAGE_SIZE);
        const pageData = paginate(results, page, limit);

        if (options.json) {
          process.stdout.write(
            JSON.stringify(
              {
                query,
                total: pageData.total,
                page: pageData.page,
                totalPages: pageData.totalPages,
                results: pageData.items,
              },
              null,
              2
            ) + '\n'
          );
          return;
        }

        if (results.length === 0) {
          logger.log(chalk.yellow('No agents found matching your query.'));
        } else {
          logger.log(chalk.bold(`Found ${results.length} agent(s):\n`));
          pageData.items.forEach((a) => {
            const badge =
              a.source === 'builtin' ? chalk.blue('[built-in]') : chalk.yellow('[marketplace]');
            const name = a.name.startsWith('@') ? a.name : `@${a.name}`;
            logger.log(`  ${chalk.green(name)} ${badge}`);
            if (a.version) logger.log(`    ${chalk.gray(`v${a.version}`)}`);
            if (a.rating) logger.log(`    ${chalk.gray(`Rating: ${a.rating}`)}`);
            logger.log(`    ${chalk.gray(a.description)}\n`);
          });
          printPaginationSummary(pageData);
        }
      } catch (error) {
        printError(chalk.red(`Search failed: ${error.message}`));
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
      try {
        const validation = validateSafePath(name, 'Agent name');
        if (validation !== true) {
          logger.log(chalk.red(validation));
          return;
        }

        if (findBuiltInAgent(name)) {
          logger.log(chalk.red(`\n❌ "${name}" conflicts with a built-in agent.\n`));
          return;
        }

        let answers;
        if (options.description || options.tier || options.expertise || options.prompt) {
          // Non-interactive mode
          answers = {
            role: options.description || 'Custom AI Agent',
            tier: options.tier || 'Specialist',
            expertise: options.expertise || 'General',
            prompt: options.prompt || `You are @${name}, an AI assistant.`,
          };
        } else {
          // Interactive mode
          answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'role',
              message: 'Role description (1 sentence):',
              validate: (input) => input.trim().length > 0 || 'Role description is required',
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
              validate: (input) => input.trim().length > 0 || 'Expertise is required',
            },
            {
              type: 'editor',
              name: 'prompt',
              message: 'Base system prompt:',
              default: `# @${name.charAt(0).toUpperCase() + name.slice(1)} Agent\n\nYou are an expert in...`,
              validate: (input) => input.trim().length > 0 || 'System prompt is required',
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

        logger.log(chalk.green(`\n✅ Custom agent created: ${name.toLowerCase()}\n`));
      } catch (error) {
        printError(chalk.red(`Failed to create agent: ${error.message}`));
      }
    });

  // agents delete <name>
  agentsCmd
    .command('delete <name>')
    .description('Delete a custom agent')
    .action(async (name) => {
      try {
        const filePath = await getCustomAgentPath(name);
        if (!filePath) {
          logger.log(chalk.red(`\n❌ Custom agent "${name}" not found.\n`));
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
          logger.log(chalk.green(`\n✅ Deleted custom agent "${name}".\n`));
        }
      } catch (error) {
        printError(chalk.red(`Failed to delete agent: ${error.message}`));
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
        logger.log(chalk.green(`\n✅ Uninstalled agent: ${name}\n`));
      } catch {
        logger.log(chalk.red(`\n❌ Agent "${name}" not found in marketplace installs.\n`));
      }
    });

  // agents publish <name>
  agentsCmd
    .command('publish <name>')
    .description('Publish an agent to the marketplace')
    .action(async (name) => {
      try {
        logger.log(chalk.cyan(`\n🚀 Preparing to publish agent: ${name}...`));
        const agentPath = await getCustomAgentPath(name);
        if (!agentPath) {
          logger.log(
            chalk.yellow(
              `\n⚠️ Custom agent "${name}" not found. Create it first with: ultra-dex agents create ${name}\n`
            )
          );
          return;
        }

        const content = await fs.readFile(agentPath, 'utf-8');
        const metadata = extractAgentMetadata(content);

        const payload = {
          id: name.toLowerCase(),
          name: metadata.name || `@${name}`,
          description: metadata.description || 'Custom Ultra-Dex agent',
          version: metadata.version || '1.0.0',
          systemPrompt: metadata.prompt || content,
          tags: metadata.tags || [],
        };

        const spinner = ora('Publishing to marketplace...').start();
        const result = await marketplaceClient.submitAgent(payload);
        if (result?.success === false) {
          spinner.fail(result.message || 'Marketplace submission failed');
          return;
        }
        spinner.succeed(`Published ${payload.name} v${payload.version}`);
      } catch (error) {
        printError(chalk.red(`Publish failed: ${error.message}`));
      }
    });

  // agents install <name>
  agentsCmd
    .command('install <name>')
    .alias('i')
    .description('Install an agent from the marketplace')
    .action(async (name) => {
      const spinner = ora(`Installing ${name}...`).start();
      try {
        const agent = await marketplaceClient.getAgent(name.toLowerCase());
        if (!agent) {
          spinner.fail(`Agent "${name}" not found in marketplace`);
          logger.log(
            chalk.gray('\nUse `ultra-dex agents list --marketplace` to see available agents')
          );
          return;
        }
        const agentsDir = path.join(process.cwd(), '.ultra-dex', 'marketplace-agents');
        await fs.mkdir(agentsDir, { recursive: true });
        const agentConfig = {
          id: agent.id || name.toLowerCase(),
          name: agent.name,
          description: agent.description,
          version: agent.version,
          rating: agent.rating || null,
          installedAt: new Date().toISOString(),
          systemPrompt: agent.systemPrompt || `You are ${agent.name}, ${agent.description}`,
        };
        await fs.writeFile(
          path.join(agentsDir, `${name.toLowerCase()}.json`),
          JSON.stringify(agentConfig, null, 2)
        );
        spinner.succeed(`Installed ${chalk.green(agent.name)} v${agent.version}`);
      } catch (error) {
        spinner.fail(`Install failed: ${error.message}`);
      }
    });

  registerAgentGenerator(agentsCmd);
}

async function showMarketplace({ page = 1, limit = DEFAULT_PAGE_SIZE, json = false } = {}) {
  try {
    logger.log(chalk.cyan('\n🏪 Ultra-Dex Agent Marketplace\n'));
    logger.log(chalk.bold('Available Community Agents:'));
    logger.log(chalk.gray('─'.repeat(50)));
    const agents = await marketplaceClient.listAgents();
    const pageData = paginate(agents, page, limit);

    if (json) {
      process.stdout.write(
        JSON.stringify(
          {
            total: pageData.total,
            page: pageData.page,
            totalPages: pageData.totalPages,
            agents: pageData.items,
          },
          null,
          2
        ) + '\n'
      );
      return;
    }

    for (const agent of pageData.items) {
      const name = agent.name.startsWith('@') ? agent.name : `@${agent.name}`;
      logger.log(`  ${chalk.yellow(name)} ${chalk.gray(`v${agent.version}`)}`);
      logger.log(`    ${chalk.white(agent.description)}`);
      if (agent.rating) logger.log(`    ${chalk.gray(`★ ${agent.rating}`)}`);
      logger.log(`    ${chalk.gray(`↓ ${agent.downloads || 0} downloads`)}\n`);
    }
    printPaginationSummary(pageData);
    logger.log(chalk.gray('Install with: ultra-dex agents install <name>\n'));
  } catch (error) {
    printError(chalk.red(`Marketplace listing failed: ${error.message}`));
  }
}

function mapTierToCategory(tier) {
  const map = {
    Orchestration: 'orchestration',
    Leadership: 'leadership',
    Development: 'development',
    Security: 'security',
    DevOps: 'devops',
    Quality: 'quality',
    Specialist: 'specialist',
  };
  return map[tier] || 'general';
}

/**
 * List all available agents (built-in and custom)
 * @param {Object} options - Filter and pagination options
 * @param {boolean} [options.builtinOnly] - Show only built-in agents
 * @param {number} [options.page] - Page number
 * @param {number} [options.limit] - Page size
 * @param {boolean} [options.json] - Return JSON output
 * @param {string} [options.tier] - Filter by tier
 * @param {string} [options.category] - Filter by category
 * @returns {Promise<void>}
 */
async function listAgents({
  builtinOnly = false,
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
  json = false,
  tier,
  category,
} = {}) {
  try {
    const customAgents = builtinOnly ? [] : await listCustomAgents();
    const totalAgents = AGENTS.length + customAgents.length;
    const header = builtinOnly ? 'Built-in Agents' : `Ultra-Dex AI Agents (${totalAgents} Total)`;
    logger.log(chalk.bold(`\n🤖 ${header}\n`));

    const candidateNames = [...AGENTS.map((agent) => agent.name), ...customAgents];

    let role = 'default';
    let allowedAgents = candidateNames;
    let restrictedAgents = [];
    try {
      const access = await filterAgentsByAccess(candidateNames);
      role = access.role;
      allowedAgents = access.allowedAgents;
      restrictedAgents = access.restrictedAgents;
    } catch (error) {
      printWarning(chalk.yellow('Role-based access checks failed. Showing all agents.'));
    }

    const allowedSet = new Set(allowedAgents.map((name) => name.toLowerCase()));

    const agentsForTable = AGENTS.filter((agent) => allowedSet.has(agent.name.toLowerCase()))
      .map((agent) => ({
        tier: agent.tier,
        name: agent.name,
        status: 'ready',
        category: mapTierToCategory(agent.tier),
        file: agent.file,
      }))
      .filter((agent) => !tier || agent.tier.toLowerCase() === tier.toLowerCase())
      .filter((agent) => !category || agent.category.toLowerCase() === category.toLowerCase());

    if (customAgents.length > 0) {
      customAgents
        .filter((name) => allowedSet.has(name.toLowerCase()))
        .forEach((name) => {
          agentsForTable.push({
            tier: 'Custom',
            name: name,
            status: 'ready',
            category: 'custom',
            file: `custom-agents/${name}.md`,
          });
        });
    }

    const pageData = paginate(agentsForTable, page, limit);

    if (json) {
      process.stdout.write(
        JSON.stringify(
          {
            total: pageData.total,
            page: pageData.page,
            totalPages: pageData.totalPages,
            restrictedAgents,
            agents: pageData.items,
          },
          null,
          2
        ) + '\n'
      );
      return;
    }

    if (pageData.items.length === 0) {
      printWarning(chalk.yellow('No agents found for this page.'));
      return;
    }

    showAgentsTable(
      pageData.items.map((item) => ({
        tier: item.tier,
        name: item.name,
        status: item.status,
        capabilities: item.category,
      }))
    );
    printPaginationSummary(pageData);

    if (restrictedAgents.length > 0) {
      logger.log(
        chalk.yellow(`\n🔒 Role-based access (${role}) hides ${restrictedAgents.length} agent(s).`)
      );
    }

    logger.log(chalk.gray('\nAgent paths:'));
    pageData.items.forEach((item) => {
      const filePath = item.file ? `agents/${item.file}` : 'custom';
      logger.log(chalk.gray(`  @${item.name}: ${filePath}`));
    });

    logger.log('\n' + chalk.bold('Usage:'));
    logger.log(chalk.gray('  ultra-dex agent show <name>     Show agent prompt'));
    logger.log(chalk.gray('  ultra-dex pack <name>           Package agent + context'));

    logger.log(`\n${chalk.gray(`Agent Index: ${githubBlobUrl('agents/00-AGENT_INDEX.md')}\n`)}`);
  } catch (error) {
    printError(chalk.red(`Failed to list agents: ${error.message}`));
  }
}

async function showAgent(name) {
  const access = await authorizeAgentAccess(name);
  if (!access.allowed) {
    logger.log(chalk.red(`\n❌ Access denied: Role "${access.role}" cannot use @${name}.`));
    return;
  }

  const agent = AGENTS.find((a) => a.name.toLowerCase() === name.toLowerCase());
  if (!agent) {
    const custom = await getCustomAgentPath(name);
    if (custom) {
      const content = await fs.readFile(custom, 'utf-8');
      logger.log(chalk.bold(`\n🤖 Custom Agent: ${name}\n`));
      logger.log(content);
      return;
    }
    logger.log(chalk.red(`\n❌ Agent "${name}" not found.`));
    return;
  }

  try {
    const prompt = await readAgentPrompt(agent);
    logger.log(chalk.bold(`\n🤖 ${agent.name.toUpperCase()} Agent (${agent.tier})\n`));
    logger.log(chalk.gray(agent.description) + '\n');
    logger.log(chalk.gray('─'.repeat(60)));
    logger.log(prompt);
    logger.log(chalk.gray('─'.repeat(60)));
  } catch (err) {
    logger.log(chalk.red(`\n❌ Could not read prompt for ${agent.name}`));
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
        fallback.on('close', (code) => (code === 0 ? resolve() : reject(err)));
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
      const agent = AGENTS.find((a) => a.name.toLowerCase() === agentName.toLowerCase());
      if (!agent) {
        logger.log(chalk.red(`\n❌ Agent "${agentName}" not found.\n`));
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

      logger.log(chalk.bold(`\n📦 Packed context for @${agent.name}\n`));
      logger.log(output);

      if (options.clipboard) {
        try {
          await copyToClipboard(output);
          logger.log(chalk.green('\n✅ Copied to clipboard!\n'));
        } catch (err) {
          logger.log(
            chalk.yellow(
              '\n⚠️  Could not copy to clipboard. Ensure pbcopy, xclip, or xsel is installed.'
            )
          );
        }
      }
    });
}
