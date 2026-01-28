// cli/lib/commands/config.js
import chalk from 'chalk';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = '.ultra-dex';
const CONFIG_FILE = 'config.json';

function getConfigPath() {
  return join(process.cwd(), CONFIG_DIR, CONFIG_FILE);
}

function loadConfig() {
  const configPath = getConfigPath();
  if (existsSync(configPath)) {
    try {
      return JSON.parse(readFileSync(configPath, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

function saveConfig(config) {
  const configDir = join(process.cwd(), CONFIG_DIR);
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
  writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
}

export function configCommand(options) {
  if (options.mcp) {
    generateMCPConfig();
  } else if (options.cursor) {
    generateCursorConfig();
  } else if (options.vscode) {
    generateVSCodeConfig();
  } else if (options.show) {
    showUltraDexConfig();
  } else if (options.set) {
    setConfigValue(options.set);
  } else if (options.get) {
    getConfigValue(options.get);
  } else {
    showConfig();
  }
}

function generateMCPConfig() {
  console.log(chalk.cyan.bold('\n🔌 Generating MCP Config for Claude Desktop\n'));
  
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
  
  console.log(chalk.white('Add this to your Claude Desktop config:\n'));
  console.log(chalk.gray(claudeConfigPath));
  console.log();
  console.log(JSON.stringify(config, null, 2));
  
  // Also save to project
  try {
    writeFileSync('mcp-config.json', JSON.stringify(config, null, 2));
    console.log(chalk.green('\n✅ Saved to mcp-config.json'));
  } catch (e) {
    console.log(chalk.red(`\n❌ Failed to save mcp-config.json: ${e.message}`));
  }
}

function generateCursorConfig() {
    console.log(chalk.cyan.bold('\n🖱️  Generating Cursor Rules\n'));
    const rulesDir = join(process.cwd(), '.cursor', 'rules');
    
    // Ensure directory exists
    try {
        mkdirSync(rulesDir, { recursive: true });
        
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
        writeFileSync(join(rulesDir, 'ultra-dex.mdc'), ruleContent.trim());
        console.log(chalk.green(`✅ Created Cursor rules in .cursor/rules/ultra-dex.mdc`));
    } catch (e) {
        console.log(chalk.red(`❌ Failed to create Cursor config: ${e.message}`));
    }
}

function generateVSCodeConfig() {
    console.log(chalk.cyan.bold('\n🆚 Generating VS Code Config\n'));
    const vscodeDir = join(process.cwd(), '.vscode');
    
    try {
        mkdirSync(vscodeDir, { recursive: true });
        
        const settings = {
            "editor.defaultFormatter": "esbenp.prettier-vscode",
            "editor.formatOnSave": true,
            "ultra-dex.contextPath": "CONTEXT.md"
        };
        
        writeFileSync(join(vscodeDir, 'settings.json'), JSON.stringify(settings, null, 2));
        console.log(chalk.green(`✅ Created VS Code settings in .vscode/settings.json`));
    } catch (e) {
        console.log(chalk.red(`❌ Failed to create VS Code config: ${e.message}`));
    }
}

function showConfig() {
  console.log(chalk.cyan.bold('\n⚙️  Ultra-Dex Configuration\n'));
  
  const envVars = [
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY', 
    'GOOGLE_AI_KEY'
  ];
  
  envVars.forEach(key => {
    const value = process.env[key];
    const status = value ? chalk.green('✓ Set') : chalk.gray('Not set');
    console.log(`  ${key}: ${status}`);
  });
}

function showUltraDexConfig() {
  console.log(chalk.cyan.bold('\n📁 Ultra-Dex Project Configuration\n'));
  
  const config = loadConfig();
  if (Object.keys(config).length === 0) {
    console.log(chalk.gray('  No configuration found in .ultra-dex/config.json'));
    console.log(chalk.gray('  Use --set key=value to set configuration values'));
    return;
  }
  
  console.log(JSON.stringify(config, null, 2));
}

function setConfigValue(keyValue) {
  const [key, ...valueParts] = keyValue.split('=');
  const value = valueParts.join('=');
  
  if (!key || value === undefined) {
    console.log(chalk.red('❌ Invalid format. Use: --set key=value'));
    return;
  }
  
  const config = loadConfig();
  
  // Handle nested keys (e.g., "server.port")
  const keys = key.split('.');
  let current = config;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  
  // Try to parse as JSON for complex values
  try {
    current[keys[keys.length - 1]] = JSON.parse(value);
  } catch {
    current[keys[keys.length - 1]] = value;
  }
  
  saveConfig(config);
  console.log(chalk.green(`✅ Set ${key} = ${value}`));
}

function getConfigValue(key) {
  const config = loadConfig();
  
  // Handle nested keys
  const keys = key.split('.');
  let value = config;
  for (const k of keys) {
    if (value === undefined || value === null) break;
    value = value[k];
  }
  
  if (value === undefined) {
    console.log(chalk.gray(`${key}: (not set)`));
  } else {
    console.log(`${key}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`);
  }
}
