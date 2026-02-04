// cli/lib/commands/config.js
import chalk from 'chalk';
import fs from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { AppError, ValidationError } from '../utils/errors.js';

const CONFIG_DIR = '.ultra-dex';
const CONFIG_FILE = 'config.json';

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
    } catch (e) {
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
    "mcpServers": {
      "ultra-dex": {
        "command": "npx",
        "args": ["ultra-dex", "serve"],
        "cwd": projectPath
      }
    }
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
            "editor.defaultFormatter": "esbenp.prettier-vscode",
            "editor.formatOnSave": true,
            "ultra-dex.contextPath": "CONTEXT.md"
        };
        fs.writeFileSync(join(vscodeDir, 'settings.json'), JSON.stringify(settings, null, 2));
        printSuccess(`✅ Created VS Code settings in .vscode/settings.json`);
    } catch (e) {
        throw new AppError('Failed to create VS Code config', { cause: e });
    }
}

function showConfig() {
  printInfo(chalk.cyan.bold('\n⚙️  Ultra-Dex Configuration\n'));
  const envVars = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GOOGLE_AI_KEY'];
  envVars.forEach(key => {
    const value = process.env[key];
    const status = value ? chalk.green('✓ Set') : chalk.gray('Not set');
    process.stdout.write(`  ${key}: ${status}\n`);
  });
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
    process.stdout.write(`${key}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}\n`);
  }
}
