// Copyright (c) 2026 Ultra-Dex

// cli/lib/commands/config.js
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { AppError, ValidationError } from '../utils/errors.js';

const CONFIG_DIR = '.ultra-dex';
const CONFIG_FILE = 'config.json';

export const CONFIG_EXAMPLES = [
  { command: 'ultra-dex config --show', description: 'Display current project configuration' },
  {
    command: 'ultra-dex config --set providers.default=claude',
    description: 'Set a config key/value pair',
  },
  { command: 'ultra-dex config --mcp', description: 'Generate MCP config for Claude Desktop' },
  { command: 'ultra-dex config --wizard', description: 'Run interactive configuration wizard' },
];

function getConfigPath() {
  return join(process.cwd(), CONFIG_DIR, CONFIG_FILE);
}

/**
 * Load project configuration
 */
export function loadConfig() {
  const configPath = getConfigPath();
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (_e) {
      return {};
    }
  }
  return {};
}

/**
 * Save project configuration
 */
function saveConfig(config) {
  const configDir = join(process.cwd(), CONFIG_DIR);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  try {
    fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
  } catch (error) {
    throw new AppError('Failed to save configuration', { cause: error });
  }
}

/**
 * Register the config command with Commander
 */
export function registerConfigCommand(program) {
  program
    .command('config')
    .description('Show or generate configuration')
    .option('--mcp', 'Generate MCP config for Claude Desktop')
    .option('--cursor', 'Generate Cursor IDE rules')
    .option('--vscode', 'Generate VS Code settings.json')
    .option('--show', 'Display current Ultra-Dex config')
    .option('--set <key=value>', 'Set a config value')
    .option('--get <key>', 'Get a specific config value')
    .option('--theme <name>', 'Set UI theme (default, doomsday, cyberpunk, ocean, forest)')
    .option('--wizard', 'Run interactive configuration wizard')
    .addHelpText(
      'after',
      '\nExamples:\n  ultra-dex config --show\n  ultra-dex config --set providers.default=claude\n  ultra-dex config --wizard\n'
    )
    .action(async (options) => {
      try {
        await configCommand(options);
      } catch (error) {
        await handleError(error, { command: 'config', options });
        process.exitCode = error.exitCode || 1;
        process.exit(process.exitCode);
      }
    });
}

export async function configCommand(options) {
  if (options.mcp) {
    return generateMCPConfig();
  } else if (options.cursor) {
    return generateCursorConfig();
  } else if (options.vscode) {
    return generateVSCodeConfig();
  } else if (options.show) {
    return showUltraDexConfig();
  } else if (options.wizard) {
    return runConfigWizard();
  } else if (options.theme) {
    return setThemeValue(options.theme);
  } else if (options.set) {
    return setConfigValue(options.set);
  } else if (options.get) {
    return getConfigValue(options.get);
  } else {
    showConfig();
  }
}

function generateMCPConfig() {
  printInfo(chalk.cyan.bold('\n🔌 Generating MCP Config for Claude Desktop\n'));

  const projectPath = process.cwd();
  const config = {
    mcpServers: {
      'ultra-dex': {
        command: 'npx',
        args: ['ultra-dex', 'serve'],
        cwd: projectPath,
      },
    },
  };

  const isWin = process.platform === 'win32';
  const claudeConfigPath = isWin
    ? join(process.env.APPDATA, 'Claude', 'claude_desktop_config.json')
    : join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');

  printInfo('Add this to your Claude Desktop config:\n');
  process.stdout.write(chalk.gray(claudeConfigPath) + '\n');
  process.stdout.write('\n');
  process.stdout.write(JSON.stringify(config, null, 2) + '\n');

  try {
    fs.writeFileSync('mcp-config.json', JSON.stringify(config, null, 2));
    printSuccess('\n✅ Saved to mcp-config.json');
  } catch (e) {
    throw new AppError('Failed to save mcp-config.json', { cause: e });
  }
}

function generateCursorConfig() {
  printInfo(chalk.cyan.bold('\n🖱️  Generating Cursor Rules\n'));
  const rulesDir = join(process.cwd(), '.cursor', 'rules');

  try {
    fs.mkdirSync(rulesDir, { recursive: true });
    const ruleContent = `
---
description: Ultra-Dex Standards
globs: **/*.{js,ts,md}
---
# Ultra-Dex Project Standards

- Follow the implementation plan in IMPLEMENTATION-PLAN.md
- Use the 'agents' directory for role-specific prompts
- Maintain valid JSON in all .json files
`;
    fs.writeFileSync(join(rulesDir, 'ultra-dex.mdc'), ruleContent.trim());
    printSuccess(`✅ Created Cursor rules in .cursor/rules/ultra-dex.mdc`);
  } catch (e) {
    throw new AppError('Failed to create Cursor config', { cause: e });
  }
}

function generateVSCodeConfig() {
  printInfo(chalk.cyan.bold('\n🆚 Generating VS Code Config\n'));
  const vscodeDir = join(process.cwd(), '.vscode');

  try {
    fs.mkdirSync(vscodeDir, { recursive: true });
    const settings = {
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
      'editor.formatOnSave': true,
      'ultra-dex.contextPath': 'CONTEXT.md',
    };
    fs.writeFileSync(join(vscodeDir, 'settings.json'), JSON.stringify(settings, null, 2));
    printSuccess(`✅ Created VS Code settings in .vscode/settings.json`);
  } catch (e) {
    throw new AppError('Failed to create VS Code config', { cause: e });
  }
}

function showConfig() {
  printInfo(chalk.cyan.bold('\n⚙️  Ultra-Dex Configuration\n'));
  const envVars = ['ANTHROPIC_API_KEY', 'NVIDIA_API_KEY', 'OPENAI_API_KEY', 'GOOGLE_AI_KEY'];
  envVars.forEach((key) => {
    const value = process.env[key];
    const status = value ? chalk.green('✓ Set') : chalk.gray('Not set');
    process.stdout.write(`  ${key}: ${status}\n`);
  });
}

async function runConfigWizard() {
  printInfo(chalk.cyan.bold('\n🧭 Ultra-Dex Configuration Wizard\n'));
  const existing = loadConfig();

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'provider',
      message: 'Default AI provider:',
      choices: [
        { name: 'Claude (Anthropic)', value: 'claude' },
        { name: 'NVIDIA (Nemotron)', value: 'nvidia' },
        { name: 'OpenAI', value: 'openai' },
        { name: 'Google Gemini', value: 'google' },
        { name: 'Local (Ollama)', value: 'ollama' },
      ],
      default: existing?.providers?.default || existing?.provider || 'claude',
    },
    {
      type: 'input',
      name: 'model',
      message: 'Default model (optional):',
      default: existing?.model || '',
    },
    {
      type: 'number',
      name: 'mcpPort',
      message: 'MCP server port:',
      default: existing?.mcpPort || 3001,
      validate: (value) =>
        Number.isInteger(value) && value > 0 ? true : 'Enter a valid port number',
    },
    {
      type: 'list',
      name: 'theme',
      message: 'CLI theme:',
      choices: ['default', 'doomsday', 'cyberpunk', 'ocean', 'forest'],
      default: existing?.ui?.theme || 'default',
    },
    {
      type: 'confirm',
      name: 'autoWatch',
      message: 'Auto-watch for file changes?',
      default: existing?.autoWatch ?? false,
    },
    {
      type: 'confirm',
      name: 'preCommit',
      message: 'Enable pre-commit hooks?',
      default: existing?.hooks?.preCommit ?? true,
    },
    {
      type: 'confirm',
      name: 'prePush',
      message: 'Enable pre-push hooks?',
      default: existing?.hooks?.prePush ?? false,
    },
  ]);

  const updated = {
    ...existing,
    providers: {
      ...(existing.providers || {}),
      default: answers.provider,
    },
    model: answers.model || null,
    mcpPort: answers.mcpPort,
    autoWatch: answers.autoWatch,
    ui: {
      ...(existing.ui || {}),
      theme: answers.theme,
    },
    hooks: {
      preCommit: answers.preCommit,
      prePush: answers.prePush,
    },
  };

  saveConfig(updated);
  printSuccess('✅ Configuration saved.');
  showUltraDexConfig();
}

function showUltraDexConfig() {
  printInfo(chalk.cyan.bold('\n📁 Ultra-Dex Project Configuration\n'));
  const config = loadConfig();
  if (Object.keys(config).length === 0) {
    printWarning('  No configuration found in .ultra-dex/config.json');
    return;
  }
  process.stdout.write(JSON.stringify(config, null, 2) + '\n');
}

function setConfigValue(keyValue) {
  const [key, ...valueParts] = keyValue.split('=');
  const value = valueParts.join('=');

  if (!key || value === undefined) {
    throw new ValidationError('Invalid format. Use: --set key=value');
  }
  if (!key.trim()) {
    throw new ValidationError('Config key is required.');
  }

  const config = loadConfig();
  const keys = key.split('.');
  let current = config;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }

  try {
    current[keys[keys.length - 1]] = JSON.parse(value);
  } catch {
    current[keys[keys.length - 1]] = value;
  }

  saveConfig(config);
  printSuccess(`✅ Set ${key} = ${value}`);
}

function getConfigValue(key) {
  if (!key || !key.trim()) {
    throw new ValidationError('Config key is required.');
  }
  const config = loadConfig();
  const keys = key.split('.');
  let value = config;
  for (const k of keys) {
    if (value === undefined || value === null) break;
    value = value[k];
  }

  if (value === undefined) {
    printWarning(`${key}: (not set)`);
  } else {
    process.stdout.write(
      `${key}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}\n`
    );
  }
}

function setThemeValue(themeName) {
  const allowed = ['default', 'doomsday', 'cyberpunk', 'ocean', 'forest'];
  if (!allowed.includes(themeName)) {
    throw new ValidationError(`Unknown theme: ${themeName}`);
  }

  const config = loadConfig();
  config.ui = { ...(config.ui || {}), theme: themeName };
  saveConfig(config);
  printSuccess(`✅ Theme set to ${themeName}`);
}
