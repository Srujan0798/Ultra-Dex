// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { spawnSync } from 'child_process';
import chalk from 'chalk';
import { printError, printSuccess } from '../utils/output.js';

const DEFAULT_ROLES = [
  'planner',
  'backend',
  'frontend',
  'cto',
  'reviewer',
  'database',
  'auth',
  'devops',
  'debugger',
];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function parseCsv(value) {
  if (!value || typeof value !== 'string') return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

async function buildWizardAnswers(pluginName) {
  const basic = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Plugin name:',
      default: pluginName,
      validate: (v) => (v && v.trim().length > 0 ? true : 'Plugin name is required'),
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description:',
      default: 'Ultra-Dex plugin',
    },
    {
      type: 'input',
      name: 'author',
      message: 'Author:',
      default: process.env.USER || process.env.USERNAME || 'unknown',
    },
  ]);

  const rolesAnswer = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'roles',
      message: 'Select agent roles this plugin supports:',
      choices: DEFAULT_ROLES,
      loop: false,
    },
    {
      type: 'input',
      name: 'customRoles',
      message: 'Custom roles (comma-separated, optional):',
    },
  ]);

  const roles = [...rolesAnswer.roles, ...parseCsv(rolesAnswer.customRoles)];
  const modelPreferences = {};
  for (const role of roles) {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'model',
        message: `Preferred model for role "${role}" (optional):`,
      },
    ]);
    if (answer.model?.trim()) {
      modelPreferences[role] = answer.model.trim();
    }
  }

  const toolsPrompt = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'addTools',
      message: 'Add tool definitions now?',
      default: false,
    },
    {
      type: 'input',
      name: 'tools',
      message: 'Tool names (comma-separated):',
      when: (answers) => answers.addTools,
    },
  ]);

  return {
    ...basic,
    roles,
    modelPreferences,
    tools: parseCsv(toolsPrompt.tools),
  };
}

export async function createPluginScaffold(name, options = {}) {
  const targetDir = path.resolve(options.dir || process.cwd(), name);
  await ensureDir(targetDir);
  await ensureDir(path.join(targetDir, 'tools'));
  await ensureDir(path.join(targetDir, 'tests'));

  const answers = options.yes
    ? {
        name,
        description: options.description || 'Ultra-Dex plugin',
        author: options.author || process.env.USER || process.env.USERNAME || 'unknown',
        roles: DEFAULT_ROLES.slice(0, 1),
        modelPreferences: {},
        tools: [],
      }
    : await buildWizardAnswers(name);

  const manifest = {
    name: answers.name,
    description: answers.description,
    author: answers.author,
    roles: answers.roles,
    modelPreferences: answers.modelPreferences,
    tools: answers.tools,
    version: '0.1.0',
  };

  const promptContent = `# ${answers.name}\n\n${answers.description}\n`;

  await fs.writeFile(path.join(targetDir, 'agent.json'), JSON.stringify(manifest, null, 2), 'utf8');
  await fs.writeFile(path.join(targetDir, 'prompt.md'), promptContent, 'utf8');
  await fs.writeFile(path.join(targetDir, 'tools', '.gitkeep'), '', 'utf8');
  await fs.writeFile(path.join(targetDir, 'tests', '.gitkeep'), '', 'utf8');

  printSuccess(`Created plugin scaffold at ${targetDir}`);
  return { targetDir, manifest };
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Invalid manifest: expected JSON object');
  }
  if (!manifest.name || !manifest.description) {
    throw new Error('Invalid manifest: "name" and "description" are required');
  }
}

export async function publishPlugin(dir, options = {}) {
  const absDir = path.resolve(dir);
  const manifestPath = path.join(absDir, 'agent.json');
  const raw = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);
  validateManifest(manifest);

  if (options.githubRelease) {
    const tag = options.tag || `v${manifest.version || '0.1.0'}`;
    const title = `${manifest.name} ${tag}`;
    const release = spawnSync('gh', ['release', 'create', tag, '--title', title, '--notes', manifest.description], {
      cwd: absDir,
      encoding: 'utf8',
    });
    if (release.status !== 0) {
      throw new Error(release.stderr || release.stdout || 'GitHub release failed');
    }
    printSuccess(`Published plugin release ${tag} via GitHub`);
    return { mode: 'github', tag };
  }

  const publish = spawnSync('npm', ['publish'], {
    cwd: absDir,
    encoding: 'utf8',
  });
  if (publish.status !== 0) {
    throw new Error(publish.stderr || publish.stdout || 'npm publish failed');
  }
  printSuccess(`Published plugin "${manifest.name}" to npm`);
  return { mode: 'npm', name: manifest.name };
}

export function attachPluginCreateCommands(pluginCommand) {
  pluginCommand
    .command('create <name>')
    .description('Create a new Ultra-Dex plugin scaffold')
    .option('--dir <directory>', 'Output directory (default: current working directory)')
    .option('-y, --yes', 'Use defaults and skip interactive prompts')
    .option('--description <description>', 'Plugin description (used with --yes)')
    .option('--author <author>', 'Plugin author (used with --yes)')
    .action(async (name, options) => {
      try {
        await createPluginScaffold(name, options);
      } catch (error) {
        printError(chalk.red(`Failed to create plugin scaffold: ${error.message}`), error);
        process.exitCode = 1;
      }
    });

  pluginCommand
    .command('publish <dir>')
    .description('Publish plugin (npm publish by default)')
    .option('--github-release', 'Publish as a GitHub release instead of npm')
    .option('--tag <tag>', 'Release tag when publishing via GitHub')
    .action(async (dir, options) => {
      try {
        await publishPlugin(dir, options);
      } catch (error) {
        printError(chalk.red(`Failed to publish plugin: ${error.message}`), error);
        process.exitCode = 1;
      }
    });
}
