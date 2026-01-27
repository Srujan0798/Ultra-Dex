import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { fileURLToPath } from 'url';
import { AGENTS, findBuiltInAgent, listCustomAgents, readCustomAgent, getCustomAgentPath, readAgentPrompt } from './agents.js';
import { validateProjectName } from '../utils/validation.js';

const CUSTOM_AGENTS_DIR = path.join(process.cwd(), '.ultra-dex', 'custom-agents');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_PATH = path.join(__dirname, '../templates/custom-agent.md');

const TIERS = [
  { name: '0 - Orchestration', value: '0' },
  { name: '1 - Leadership', value: '1' },
  { name: '2 - Development', value: '2' },
  { name: '3 - Security', value: '3' },
  { name: '4 - DevOps', value: '4' },
  { name: '5 - Quality', value: '5' },
  { name: '6 - Specialist', value: '6' },
];

function validateKebabCase(name) {
  const result = validateProjectName(name);
  if (result !== true) return result;
  if (name !== name.toLowerCase()) {
    return 'Agent name must be kebab-case (lowercase letters, numbers, dashes)';
  }
  return true;
}

async function readTemplate() {
  return fs.readFile(TEMPLATE_PATH, 'utf-8');
}

function renderTemplate(template, data) {
  return template
    .replace(/{{name}}/g, data.name)
    .replace(/{{tier}}/g, data.tier)
    .replace(/{{role}}/g, data.role)
    .replace(/{{expertise}}/g, data.expertise)
    .replace(/{{prompt}}/g, data.prompt);
}

async function ensureCustomDir() {
  await fs.mkdir(CUSTOM_AGENTS_DIR, { recursive: true });
}

async function listBuiltinAgents() {
  return AGENTS.map(agent => ({
    name: agent.name,
    description: agent.description,
    tier: agent.tier,
  }));
}

export function registerAgentBuilderCommand(program) {
  const agentCommand = program
    .command('agent')
    .description('Manage AI agents');

  agentCommand
    .command('create <name>')
    .description('Create a custom agent with an interactive wizard')
    .action(async (name) => {
      const validation = validateKebabCase(name);
      if (validation !== true) {
        console.log(chalk.red(`\n❌ ${validation}\n`));
        process.exit(1);
      }

      if (findBuiltInAgent(name)) {
        console.log(chalk.red(`\n❌ "${name}" conflicts with a built-in agent.\n`));
        process.exit(1);
      }

      await ensureCustomDir();
      const existing = await getCustomAgentPath(name);
      if (existing) {
        console.log(chalk.red(`\n❌ Custom agent "${name}" already exists.\n`));
        process.exit(1);
      }

      const answers = await inquirer.prompt([
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
          validate: input => input.trim().length > 0 || 'System prompt is required',
        },
      ]);

      const template = await readTemplate();
      const content = renderTemplate(template, {
        name,
        tier: answers.tier,
        role: answers.role.trim(),
        expertise: answers.expertise.trim(),
        prompt: answers.prompt.trim(),
      });

      const outputPath = path.join(CUSTOM_AGENTS_DIR, `${name}.md`);
      await fs.writeFile(outputPath, content);
      console.log(chalk.green(`\n✅ Custom agent created: ${outputPath}\n`));
    });

  agentCommand
    .command('list')
    .description('List built-in and custom agents')
    .option('--all', 'Show built-in and custom agents')
    .option('--custom', 'Show custom agents only')
    .option('--builtin', 'Show built-in agents only')
    .action(async (options) => {
      const showCustom = options.custom || options.all || (!options.custom && !options.builtin);
      const showBuiltin = options.builtin || options.all || (!options.custom && !options.builtin);

      if (showBuiltin) {
        console.log(chalk.bold('\n🤖 Built-in Agents\n'));
        const builtinAgents = await listBuiltinAgents();
        let currentTier = '';
        builtinAgents.forEach((agent) => {
          if (agent.tier !== currentTier) {
            currentTier = agent.tier;
            console.log(chalk.bold(`  ${currentTier} Tier:`));
          }
          console.log(chalk.cyan(`    ${agent.name}`) + chalk.gray(` - ${agent.description}`));
        });
      }

      if (showCustom) {
        const customAgents = await listCustomAgents();
        console.log(chalk.bold('\n✨ Custom Agents\n'));
        if (customAgents.length === 0) {
          console.log(chalk.gray('  (none found)'));
        } else {
          customAgents.forEach((name) => console.log(chalk.cyan(`  ${name}`)));
        }
      }
      console.log('');
    });

  agentCommand
    .command('show <name>')
    .description('Show a specific agent prompt')
    .action(async (name) => {
      const agent = findBuiltInAgent(name);
      if (agent) {
        try {
          const content = await readAgentPrompt(agent);
          console.log(chalk.bold(`\n🤖 ${agent.name.toUpperCase()} Agent\n`));
          console.log(chalk.gray('─'.repeat(60)));
          console.log(content);
          console.log(chalk.gray('─'.repeat(60)));
          console.log(chalk.bold('\n📋 Copy the above prompt and paste into your AI tool.\n'));
        } catch {
          console.log(chalk.bold(`\n🤖 ${agent.name.toUpperCase()} Agent\n`));
          console.log(chalk.gray('View full prompt on GitHub:'));
          console.log(chalk.blue(`  https://github.com/Srujan0798/Ultra-Dex/blob/main/agents/${agent.file}\n`));
        }
        return;
      }

      try {
        const content = await readCustomAgent(name);
        console.log(chalk.bold(`\n✨ ${name.toUpperCase()} Custom Agent\n`));
        console.log(chalk.gray('─'.repeat(60)));
        console.log(content);
        console.log(chalk.gray('─'.repeat(60)));
      } catch {
        console.log(chalk.red(`\n❌ Agent "${name}" not found.\n`));
        process.exit(1);
      }
    });

  agentCommand
    .command('delete <name>')
    .description('Delete a custom agent')
    .action(async (name) => {
      if (findBuiltInAgent(name)) {
        console.log(chalk.red(`\n❌ Cannot delete built-in agent "${name}".\n`));
        process.exit(1);
      }

      const filePath = await getCustomAgentPath(name);
      if (!filePath) {
        console.log(chalk.red(`\n❌ Custom agent "${name}" not found.\n`));
        process.exit(1);
      }

      const { confirmDelete } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmDelete',
          message: `Delete custom agent "${name}"?`,
          default: false,
        },
      ]);

      if (!confirmDelete) {
        console.log(chalk.gray('\nAborted.\n'));
        return;
      }

      await fs.unlink(filePath);
      console.log(chalk.green(`\n✅ Deleted custom agent "${name}".\n`));
    });
}
