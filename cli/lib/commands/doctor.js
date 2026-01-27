/**
 * ultra-dex doctor & config commands
 * Diagnose setup issues and manage configuration
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { checkConfiguredProviders } from '../providers/index.js';

// Default configuration
const DEFAULT_CONFIG = {
  version: '2.4.0',
  provider: 'claude',
  model: null, // Use provider default
  minScore: 70,
  autoWatch: false,
  mcpPort: 3001,
  hooks: {
    preCommit: true,
    prePush: false,
  },
};

async function loadConfig() {
  // Check project-level config first
  try {
    const content = await fs.readFile(path.resolve(process.cwd(), '.ultra-dex.json'), 'utf8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(content), source: 'project' };
  } catch { /* no project config */ }

  // Check home directory config
  try {
    const homePath = path.join(process.env.HOME || process.env.USERPROFILE, '.ultra-dex.json');
    const content = await fs.readFile(homePath, 'utf8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(content), source: 'global' };
  } catch { /* no global config */ }

  return { ...DEFAULT_CONFIG, source: 'default' };
}

async function saveConfig(config, global = false) {
  const configPath = global 
    ? path.join(process.env.HOME || process.env.USERPROFILE, '.ultra-dex.json')
    : path.resolve(process.cwd(), '.ultra-dex.json');
  
  const { source, ...configData } = config;
  await fs.writeFile(configPath, JSON.stringify(configData, null, 2));
  return configPath;
}

export function registerDoctorCommand(program) {
  program
    .command('doctor')
    .description('Diagnose Ultra-Dex setup and configuration')
    .option('--fix', 'Attempt to fix issues automatically')
    .action(async (options) => {
      console.log(chalk.cyan('\n🩺 Ultra-Dex Doctor\n'));
      console.log(chalk.gray('Checking your setup...\n'));

      const checks = [];
      let hasErrors = false;

      // Check 1: Node.js version
      const nodeSpinner = ora('Checking Node.js version...').start();
      try {
        const nodeVersion = process.version;
        const major = parseInt(nodeVersion.slice(1).split('.')[0]);
        if (major >= 18) {
          nodeSpinner.succeed(`Node.js ${nodeVersion} ✓`);
          checks.push({ name: 'Node.js', status: 'ok', detail: nodeVersion });
        } else {
          nodeSpinner.warn(`Node.js ${nodeVersion} (recommend >= 18)`);
          checks.push({ name: 'Node.js', status: 'warn', detail: `${nodeVersion} - upgrade recommended` });
        }
      } catch (e) {
        nodeSpinner.fail('Node.js check failed');
        checks.push({ name: 'Node.js', status: 'error', detail: e.message });
        hasErrors = true;
      }

      // Check 2: Git
      const gitSpinner = ora('Checking Git...').start();
      try {
        const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
        gitSpinner.succeed(`${gitVersion} ✓`);
        checks.push({ name: 'Git', status: 'ok', detail: gitVersion });
      } catch {
        gitSpinner.fail('Git not found');
        checks.push({ name: 'Git', status: 'error', detail: 'Not installed' });
        hasErrors = true;
      }

      // Check 3: AI Providers
      const providerSpinner = ora('Checking AI providers...').start();
      const providers = checkConfiguredProviders();
      const configuredProviders = providers.filter(p => p.configured);
      
      if (configuredProviders.length > 0) {
        providerSpinner.succeed(`AI providers: ${configuredProviders.map(p => p.name).join(', ')} ✓`);
        checks.push({ name: 'AI Providers', status: 'ok', detail: configuredProviders.map(p => p.name).join(', ') });
      } else {
        providerSpinner.warn('No AI providers configured');
        checks.push({ name: 'AI Providers', status: 'warn', detail: 'Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY' });
      }

      // Check 4: Project structure
      const structureSpinner = ora('Checking project structure...').start();
      const requiredFiles = ['CONTEXT.md', 'IMPLEMENTATION-PLAN.md'];
      const optionalFiles = ['CHECKLIST.md', 'QUICK-START.md', '.ultra/state.json'];
      const foundRequired = [];
      const foundOptional = [];

      for (const file of requiredFiles) {
        try {
          await fs.access(path.resolve(process.cwd(), file));
          foundRequired.push(file);
        } catch { /* not found */ }
      }

      for (const file of optionalFiles) {
        try {
          await fs.access(path.resolve(process.cwd(), file));
          foundOptional.push(file);
        } catch { /* not found */ }
      }

      if (foundRequired.length === requiredFiles.length) {
        structureSpinner.succeed(`Project structure: ${foundRequired.length}/${requiredFiles.length} required files ✓`);
        checks.push({ name: 'Project Structure', status: 'ok', detail: `${foundRequired.join(', ')}` });
      } else if (foundRequired.length > 0) {
        structureSpinner.warn(`Project structure: ${foundRequired.length}/${requiredFiles.length} required files`);
        checks.push({ name: 'Project Structure', status: 'warn', detail: `Missing: ${requiredFiles.filter(f => !foundRequired.includes(f)).join(', ')}` });
      } else {
        structureSpinner.info('No Ultra-Dex project found');
        checks.push({ name: 'Project Structure', status: 'info', detail: 'Run `ultra-dex init` to create a project' });
      }

      // Check 5: Git hooks
      const hooksSpinner = ora('Checking git hooks...').start();
      try {
        const hookPath = path.resolve(process.cwd(), '.git/hooks/pre-commit');
        const hookContent = await fs.readFile(hookPath, 'utf8');
        if (hookContent.includes('ultra-dex')) {
          hooksSpinner.succeed('Pre-commit hook installed ✓');
          checks.push({ name: 'Git Hooks', status: 'ok', detail: 'Pre-commit active' });
        } else {
          hooksSpinner.info('Pre-commit hook exists but not Ultra-Dex');
          checks.push({ name: 'Git Hooks', status: 'info', detail: 'Custom hook present' });
        }
      } catch {
        hooksSpinner.info('No pre-commit hook');
        checks.push({ name: 'Git Hooks', status: 'info', detail: 'Run `ultra-dex pre-commit --install`' });
      }

      // Check 6: Configuration
      const configSpinner = ora('Checking configuration...').start();
      const config = await loadConfig();
      configSpinner.succeed(`Config loaded from: ${config.source}`);
      checks.push({ name: 'Configuration', status: 'ok', detail: `Source: ${config.source}` });

      // Check 7: MCP Server port
      const portSpinner = ora('Checking MCP server port...').start();
      try {
        const net = await import('net');
        const server = net.createServer();
        await new Promise((resolve, reject) => {
          server.once('error', reject);
          server.once('listening', () => {
            server.close();
            resolve();
          });
          server.listen(config.mcpPort);
        });
        portSpinner.succeed(`Port ${config.mcpPort} available ✓`);
        checks.push({ name: 'MCP Port', status: 'ok', detail: `Port ${config.mcpPort} free` });
      } catch {
        portSpinner.warn(`Port ${config.mcpPort} in use`);
        checks.push({ name: 'MCP Port', status: 'warn', detail: `Port ${config.mcpPort} busy - change with config` });
      }

      // Summary
      console.log(chalk.bold('\n📋 Summary\n'));
      console.log(chalk.gray('─'.repeat(50)));
      
      const okCount = checks.filter(c => c.status === 'ok').length;
      const warnCount = checks.filter(c => c.status === 'warn').length;
      const errorCount = checks.filter(c => c.status === 'error').length;

      checks.forEach(check => {
        const icon = check.status === 'ok' ? chalk.green('✓') :
                     check.status === 'warn' ? chalk.yellow('⚠') :
                     check.status === 'error' ? chalk.red('✗') :
                     chalk.blue('ℹ');
        console.log(`  ${icon} ${check.name.padEnd(18)} ${chalk.gray(check.detail)}`);
      });

      console.log(chalk.gray('─'.repeat(50)));
      console.log(`  ${chalk.green(okCount + ' passed')}  ${chalk.yellow(warnCount + ' warnings')}  ${chalk.red(errorCount + ' errors')}`);

      if (hasErrors) {
        console.log(chalk.red('\n❌ Some checks failed. Fix issues above.\n'));
        process.exit(1);
      } else if (warnCount > 0) {
        console.log(chalk.yellow('\n⚠️  Some warnings. Setup works but could be improved.\n'));
      } else {
        console.log(chalk.green('\n✅ All checks passed! Ultra-Dex is ready.\n'));
      }

      // Suggestions
      if (configuredProviders.length === 0) {
        console.log(chalk.cyan('💡 To enable AI features, set an API key:'));
        console.log(chalk.gray('   export ANTHROPIC_API_KEY=sk-ant-...'));
        console.log(chalk.gray('   export OPENAI_API_KEY=sk-...'));
        console.log(chalk.gray('   export GEMINI_API_KEY=...\n'));
      }

      if (foundRequired.length === 0) {
        console.log(chalk.cyan('💡 To start a new project:'));
        console.log(chalk.gray('   ultra-dex init\n'));
      }
    });
}

export function registerConfigCommand(program) {
  program
    .command('config')
    .description('Manage Ultra-Dex configuration')
    .option('--get <key>', 'Get a config value')
    .option('--set <key=value>', 'Set a config value')
    .option('--list', 'List all config values')
    .option('--global', 'Use global config (~/.ultra-dex.json)')
    .option('--init', 'Create a new config file')
    .option('--mcp', 'Generate MCP config for Claude Desktop')
    .action(async (options) => {
      const config = await loadConfig();

      if (options.mcp) {
        // Generate MCP config for Claude Desktop
        console.log(chalk.cyan('\n🔌 MCP Configuration for Claude Desktop\n'));
        
        const mcpConfig = {
          "ultra-dex": {
            "command": "npx",
            "args": ["ultra-dex", "serve", "--port", String(config.mcpPort)],
            "env": {}
          }
        };

        console.log(chalk.white('Add this to your Claude Desktop config:\n'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(JSON.stringify({ mcpServers: mcpConfig }, null, 2));
        console.log(chalk.gray('─'.repeat(50)));
        
        console.log(chalk.cyan('\n📍 Config file locations:'));
        console.log(chalk.gray('   macOS: ~/Library/Application Support/Claude/claude_desktop_config.json'));
        console.log(chalk.gray('   Windows: %APPDATA%\\Claude\\claude_desktop_config.json'));
        console.log(chalk.gray('   Linux: ~/.config/Claude/claude_desktop_config.json\n'));
        return;
      }

      if (options.init) {
        const configPath = await saveConfig(DEFAULT_CONFIG, options.global);
        console.log(chalk.green(`✅ Config created: ${configPath}`));
        return;
      }

      if (options.list) {
        console.log(chalk.cyan('\n⚙️  Ultra-Dex Configuration\n'));
        console.log(chalk.gray(`Source: ${config.source}`));
        console.log(chalk.gray('─'.repeat(40)));
        
        const { source, ...displayConfig } = config;
        Object.entries(displayConfig).forEach(([key, value]) => {
          const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
          console.log(`  ${chalk.cyan(key.padEnd(15))} ${valueStr}`);
        });
        console.log('');
        return;
      }

      if (options.get) {
        const value = config[options.get];
        if (value !== undefined) {
          console.log(typeof value === 'object' ? JSON.stringify(value, null, 2) : value);
        } else {
          console.log(chalk.yellow(`Key not found: ${options.get}`));
        }
        return;
      }

      if (options.set) {
        const [key, ...valueParts] = options.set.split('=');
        const value = valueParts.join('=');
        
        // Parse value
        let parsedValue;
        try {
          parsedValue = JSON.parse(value);
        } catch {
          parsedValue = value;
        }

        config[key] = parsedValue;
        const configPath = await saveConfig(config, options.global);
        console.log(chalk.green(`✅ Set ${key}=${value} in ${configPath}`));
        return;
      }

      // Interactive mode
      console.log(chalk.cyan('\n⚙️  Ultra-Dex Configuration\n'));
      
      const { action } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'View current config', value: 'view' },
          { name: 'Set default AI provider', value: 'provider' },
          { name: 'Set minimum alignment score', value: 'minScore' },
          { name: 'Set MCP server port', value: 'mcpPort' },
          { name: 'Generate MCP config for Claude', value: 'mcp' },
          { name: 'Create new config file', value: 'init' },
        ]
      }]);

      switch (action) {
        case 'view':
          console.log(chalk.gray('\n' + JSON.stringify(config, null, 2) + '\n'));
          break;

        case 'provider':
          const { provider } = await inquirer.prompt([{
            type: 'list',
            name: 'provider',
            message: 'Select default AI provider:',
            choices: ['claude', 'openai', 'gemini'],
            default: config.provider
          }]);
          config.provider = provider;
          await saveConfig(config, options.global);
          console.log(chalk.green(`\n✅ Default provider set to: ${provider}\n`));
          break;

        case 'minScore':
          const { minScore } = await inquirer.prompt([{
            type: 'number',
            name: 'minScore',
            message: 'Minimum alignment score (0-100):',
            default: config.minScore,
            validate: n => n >= 0 && n <= 100 || 'Must be 0-100'
          }]);
          config.minScore = minScore;
          await saveConfig(config, options.global);
          console.log(chalk.green(`\n✅ Minimum score set to: ${minScore}\n`));
          break;

        case 'mcpPort':
          const { mcpPort } = await inquirer.prompt([{
            type: 'number',
            name: 'mcpPort',
            message: 'MCP server port:',
            default: config.mcpPort,
            validate: n => n > 0 && n < 65536 || 'Invalid port'
          }]);
          config.mcpPort = mcpPort;
          await saveConfig(config, options.global);
          console.log(chalk.green(`\n✅ MCP port set to: ${mcpPort}\n`));
          break;

        case 'mcp':
          // Call the MCP generation
          options.mcp = true;
          await program.commands.find(c => c.name() === 'config').action(options);
          break;

        case 'init':
          const { scope } = await inquirer.prompt([{
            type: 'list',
            name: 'scope',
            message: 'Create config in:',
            choices: [
              { name: 'This project (.ultra-dex.json)', value: 'project' },
              { name: 'Global (~/.ultra-dex.json)', value: 'global' },
            ]
          }]);
          const configPath = await saveConfig(DEFAULT_CONFIG, scope === 'global');
          console.log(chalk.green(`\n✅ Config created: ${configPath}\n`));
          break;
      }
    });
}

export default { registerDoctorCommand, registerConfigCommand };
