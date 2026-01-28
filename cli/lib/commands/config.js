// cli/lib/commands/config.js
import chalk from 'chalk';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export function configCommand(options) {
  if (options.mcp) {
    generateMCPConfig();
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
