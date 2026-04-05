// Copyright (c) 2026 Ultra-Dex

/**
 * ultra-dex doctor & config commands
 * Diagnose setup issues and manage configuration
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { checkConfiguredProviders } from '../providers/index.js';
import { icons, header, statusLine } from '../utils/status.js';
import { createSpinner } from '../utils/spinners.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';

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

/**
 * Load configuration from multiple sources (project, global, default)
 * @returns {Promise<Object>} Configuration object
 */
async function loadConfig() {
  // Check project-level config first
  try {
    const content = await fs.readFile(path.resolve(process.cwd(), '.ultra-dex.json'), 'utf8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(content), source: 'project' };
  } catch {
    /* no project config */
  }

  // Check home directory config
  try {
    const homePath = path.join(process.env.HOME || process.env.USERPROFILE, '.ultra-dex.json');
    const content = await fs.readFile(homePath, 'utf8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(content), source: 'global' };
  } catch {
    /* no global config */
  }

  return { ...DEFAULT_CONFIG, source: 'default' };
}

/**
 * Save configuration to disk
 * @param {Object} config - Configuration object
 * @param {boolean} [global=false] - Save to global config file
 * @returns {Promise<string>} Path to saved config file
 */
async function saveConfig(config, global = false) {
  const configPath = global
    ? path.join(process.env.HOME || process.env.USERPROFILE, '.ultra-dex.json')
    : path.resolve(process.cwd(), '.ultra-dex.json');

  const { source: _source, ...configData } = config;
  await fs.writeFile(configPath, JSON.stringify(configData, null, 2));
  return configPath;
}

/**
 * Register the doctor command with Commander
 * @param {Command} program - Commander program instance
 * @returns {void}
 */
export function registerDoctorCommand(program) {
  const doctorCmd = program
    .command('doctor')
    .description('System Diagnostics - Check System Health')
    .option('--fix', 'Attempt to fix issues automatically')
    .addHelpText('after', '\nExamples:\n  ultra-dex doctor\n  ultra-dex doctor --fix\n')
    /**
     * Doctor command action
     * @param {Object} options - Doctor options
     */
    .action(async (options) => {
      try {
        if (options.fix) {
          printWarning(
            chalk.yellow('Auto-fix mode is limited in this release. Running diagnostics only.\n')
          );
        }
        header('System Health Diagnostics');
        printInfo(chalk.gray('  Analyzing system components...\n'));

        const checks = [];
        let hasErrors = false;

        // Check 1: Node.js version
        const nodeSpinner = createSpinner('Scanning Node.js environment...');
        nodeSpinner.start();
        try {
          const nodeVersion = process.version;
          const major = parseInt(nodeVersion.slice(1).split('.')[0]);
          if (major >= 18) {
            nodeSpinner.succeed(`Node.js ${nodeVersion} ✓`);
            checks.push({ name: 'Node.js', status: 'ok', detail: nodeVersion });
          } else {
            nodeSpinner.warn(`Node.js ${nodeVersion} (recommend >= 18)`);
            checks.push({
              name: 'Node.js',
              status: 'warn',
              detail: `${nodeVersion} - upgrade recommended`,
            });
          }
        } catch (e) {
          nodeSpinner.fail('Node.js check failed');
          checks.push({ name: 'Node.js', status: 'error', detail: e.message });
          hasErrors = true;
        }

        // Check 2: Git
        const gitSpinner = createSpinner('Checking Git repository...');
        gitSpinner.start();
        try {
          const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
          gitSpinner.succeed(`${gitVersion} ✓`);
          checks.push({ name: 'Git', status: 'ok', detail: gitVersion });
        } catch {
          gitSpinner.fail('Git not found');
          checks.push({ name: 'Git', status: 'error', detail: 'Not installed' });
          hasErrors = true;
        }

        // Check 2b: npm / package.json
        const npmSpinner = createSpinner('Checking npm + package.json...');
        npmSpinner.start();
        try {
          const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
          const pkgPath = path.resolve(process.cwd(), 'package.json');
          await fs.access(pkgPath);
          npmSpinner.succeed(`npm ${npmVersion} ✓`);
          checks.push({
            name: 'npm',
            status: 'ok',
            detail: `npm ${npmVersion} + package.json found`,
          });
        } catch (e) {
          npmSpinner.warn('npm or package.json missing');
          checks.push({
            name: 'npm',
            status: 'warn',
            detail: 'Install npm and ensure package.json exists',
          });
        }

        // Check 3: AI Providers
        const providerSpinner = createSpinner('Locating AI Providers...');
        providerSpinner.start();
        const providers = checkConfiguredProviders();
        const configuredProviders = providers.filter((p) => p.configured);

        if (configuredProviders.length > 0) {
          providerSpinner.succeed(
            `Providers found: ${configuredProviders.map((p) => p.name).join(', ')} ✓`
          );
          checks.push({
            name: 'AI Providers',
            status: 'ok',
            detail: configuredProviders.map((p) => p.name).join(', '),
          });
        } else {
          providerSpinner.warn('No AI Providers found');
          checks.push({
            name: 'AI Providers',
            status: 'warn',
            detail: 'Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY',
          });
        }

        // Check 4: Project structure
        const structureSpinner = createSpinner('Verifying Project Structure...');
        structureSpinner.start();
        const requiredFiles = ['CONTEXT.md', 'IMPLEMENTATION-PLAN.md'];
        const optionalFiles = ['CHECKLIST.md', 'QUICK-START.md', '.ultra/state.json'];
        const foundRequired = [];
        const foundOptional = [];

        for (const file of requiredFiles) {
          try {
            await fs.access(path.resolve(process.cwd(), file));
            foundRequired.push(file);
          } catch {
            /* not found */
          }
        }

        for (const file of optionalFiles) {
          try {
            await fs.access(path.resolve(process.cwd(), file));
            foundOptional.push(file);
          } catch {
            /* not found */
          }
        }

        if (foundRequired.length === requiredFiles.length) {
          structureSpinner.succeed(
            `Structure valid: ${foundRequired.length}/${requiredFiles.length} required artifacts ✓`
          );
          checks.push({
            name: 'Project Structure',
            status: 'ok',
            detail: `${foundRequired.join(', ')}`,
          });
        } else if (foundRequired.length > 0) {
          structureSpinner.warn(
            `Structure incomplete: ${foundRequired.length}/${requiredFiles.length} required artifacts`
          );
          checks.push({
            name: 'Project Structure',
            status: 'warn',
            detail: `Missing: ${requiredFiles.filter((f) => !foundRequired.includes(f)).join(', ')}`,
          });
        } else {
          structureSpinner.info('No Ultra-Dex project found');
          checks.push({
            name: 'Project Structure',
            status: 'info',
            detail: 'Run `ultra-dex init` to create a new project',
          });
        }

        // Check 5: Git hooks
        const hooksSpinner = createSpinner('Checking Git hooks...');
        hooksSpinner.start();
        try {
          const hookPath = path.resolve(process.cwd(), '.git/hooks/pre-commit');
          const hookContent = await fs.readFile(hookPath, 'utf8');
          if (hookContent.includes('ultra-dex')) {
            hooksSpinner.succeed('Pre-commit active ✓');
            checks.push({ name: 'Git Hooks', status: 'ok', detail: 'Pre-commit active' });
          } else {
            hooksSpinner.info('Pre-commit active but not Ultra-Dex');
            checks.push({ name: 'Git Hooks', status: 'info', detail: 'Custom hook present' });
          }
        } catch {
          hooksSpinner.info('No pre-commit hook');
          checks.push({
            name: 'Git Hooks',
            status: 'info',
            detail: 'Run `ultra-dex pre-commit --install`',
          });
        }

        // Check 6: Configuration
        const configSpinner = createSpinner('Reading Configuration...');
        configSpinner.start();
        const config = await loadConfig();
        configSpinner.succeed(`Configuration loaded from: ${config.source}`);
        checks.push({ name: 'Configuration', status: 'ok', detail: `Source: ${config.source}` });

        // Check 7: MCP Server port
        const portSpinner = createSpinner('Checking MCP Port...');
        portSpinner.start();
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
          portSpinner.succeed(`Port ${config.mcpPort} open ✓`);
          checks.push({ name: 'MCP Port', status: 'ok', detail: `Port ${config.mcpPort} free` });
        } catch {
          portSpinner.warn(`Portal ${config.mcpPort} blocked`);
          checks.push({
            name: 'MCP Port',
            status: 'warn',
            detail: `Port ${config.mcpPort} busy - change with config`,
          });
        }

        // Check 8: Disk space
        const diskSpinner = createSpinner('Checking Disk Space...');
        diskSpinner.start();
        try {
          const dfRaw = execSync('df -k . | tail -1', { encoding: 'utf8' }).trim();
          const parts = dfRaw.split(/\s+/);
          const availableKb = Number(parts[3] || 0);
          const availableGb = (availableKb / (1024 * 1024)).toFixed(1);
          if (availableKb > 1024 * 1024) {
            diskSpinner.succeed(`Disk Space ${availableGb}GB available ✓`);
            checks.push({ name: 'Disk Space', status: 'ok', detail: `${availableGb}GB available` });
          } else {
            diskSpinner.warn(`Disk Space low (${availableGb}GB)`);
            checks.push({ name: 'Disk Space', status: 'warn', detail: `${availableGb}GB available` });
          }
        } catch {
          diskSpinner.info('Disk Space check unavailable');
          checks.push({ name: 'Disk Space', status: 'info', detail: 'Unable to read disk stats' });
        }

        // Check 9: Ultra-Dex runtime
        const ultraSpinner = createSpinner('Checking Ultra-Dex runtime...');
        ultraSpinner.start();
        try {
          await fs.access(path.resolve(process.cwd(), 'cli', 'bin', 'ultra-dex.js'));
          ultraSpinner.succeed('Ultra-Dex runtime detected ✓');
          checks.push({ name: 'Ultra-Dex', status: 'ok', detail: 'CLI runtime present' });
        } catch {
          ultraSpinner.warn('Ultra-Dex runtime files not found');
          checks.push({ name: 'Ultra-Dex', status: 'warn', detail: 'Run from repository root' });
        }

        // Check 10: Package manager
        const pmSpinner = createSpinner('Checking Package Manager...');
        pmSpinner.start();
        try {
          const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
          pmSpinner.succeed(`Package Manager npm ${npmVersion} ✓`);
          checks.push({ name: 'Package Manager', status: 'ok', detail: `npm ${npmVersion}` });
        } catch {
          pmSpinner.warn('Package manager unavailable');
          checks.push({ name: 'Package Manager', status: 'warn', detail: 'npm not available' });
        }

        // Check 11: Docker
        const dockerSpinner = createSpinner('Checking Docker...');
        dockerSpinner.start();
        try {
          const dockerVersion = execSync('docker --version', { encoding: 'utf8' }).trim();
          dockerSpinner.succeed(`${dockerVersion} ✓`);
          checks.push({ name: 'Docker', status: 'ok', detail: dockerVersion });
        } catch {
          dockerSpinner.info('Docker not installed');
          checks.push({ name: 'Docker', status: 'info', detail: 'Optional for container workflows' });
        }

        // Check 12: IDE
        const ideSpinner = createSpinner('Checking IDE config...');
        ideSpinner.start();
        try {
          const hasVSCode = await fs
            .access(path.resolve(process.cwd(), '.vscode'))
            .then(() => true)
            .catch(() => false);
          const hasJetBrains = await fs
            .access(path.resolve(process.cwd(), '.idea'))
            .then(() => true)
            .catch(() => false);
          if (hasVSCode || hasJetBrains) {
            const ideName = hasVSCode ? 'VS Code' : 'JetBrains';
            ideSpinner.succeed(`IDE config detected (${ideName}) ✓`);
            checks.push({ name: 'IDE', status: 'ok', detail: `${ideName} settings present` });
          } else {
            ideSpinner.info('No IDE config found');
            checks.push({ name: 'IDE', status: 'info', detail: 'Optional IDE config missing' });
          }
        } catch {
          ideSpinner.info('IDE check unavailable');
          checks.push({ name: 'IDE', status: 'info', detail: 'Unable to inspect IDE config' });
        }

        // Check 13: Memory
        const memSpinner = createSpinner('Checking Memory...');
        memSpinner.start();
        const totalMemGb = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(1);
        if (Number(totalMemGb) >= 4) {
          memSpinner.succeed(`Memory ${totalMemGb}GB ✓`);
          checks.push({ name: 'Memory', status: 'ok', detail: `${totalMemGb}GB total` });
        } else {
          memSpinner.warn(`Memory ${totalMemGb}GB (low)`);
          checks.push({ name: 'Memory', status: 'warn', detail: `${totalMemGb}GB total` });
        }

        // Check 14: Network
        const networkSpinner = createSpinner('Checking Network...');
        networkSpinner.start();
        try {
          const dns = await import('dns/promises');
          await dns.lookup('github.com');
          networkSpinner.succeed('Network DNS resolution ✓');
          checks.push({ name: 'Network', status: 'ok', detail: 'DNS reachable' });
        } catch {
          networkSpinner.warn('Network lookup failed');
          checks.push({ name: 'Network', status: 'warn', detail: 'Check internet/DNS access' });
        }

        // Check 15: TypeScript
        const tsSpinner = createSpinner('Checking TypeScript...');
        tsSpinner.start();
        const hasTsConfig = await fs
          .access(path.resolve(process.cwd(), 'tsconfig.json'))
          .then(() => true)
          .catch(() => false);
        if (hasTsConfig) {
          tsSpinner.succeed('TypeScript config detected ✓');
          checks.push({ name: 'TypeScript', status: 'ok', detail: 'tsconfig.json present' });
        } else {
          tsSpinner.info('TypeScript config not found');
          checks.push({ name: 'TypeScript', status: 'info', detail: 'tsconfig.json not found' });
        }

        // Check 16: Environment
        const envSpinner = createSpinner('Checking Environment...');
        envSpinner.start();
        const envKeys = ['NODE_ENV', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GOOGLE_AI_KEY'];
        const setCount = envKeys.filter((key) => Boolean(process.env[key])).length;
        envSpinner.succeed(`Environment variables checked (${setCount}/${envKeys.length} set)`);
        checks.push({
          name: 'Environment',
          status: setCount > 0 ? 'ok' : 'warn',
          detail: `${setCount}/${envKeys.length} key vars configured`,
        });

        // Check 17: Linting
        const lintSpinner = createSpinner('Checking Linting...');
        lintSpinner.start();
        try {
          const pkgContent = await fs.readFile(path.resolve(process.cwd(), 'package.json'), 'utf8');
          const pkg = JSON.parse(pkgContent);
          const hasLint =
            Boolean(pkg?.scripts?.lint) ||
            Boolean(pkg?.devDependencies?.eslint) ||
            Boolean(pkg?.dependencies?.eslint);
          if (hasLint) {
            lintSpinner.succeed('Linting configuration detected ✓');
            checks.push({ name: 'Linting', status: 'ok', detail: 'eslint/lint script available' });
          } else {
            lintSpinner.info('Linting config not found');
            checks.push({ name: 'Linting', status: 'info', detail: 'No lint script detected' });
          }
        } catch {
          lintSpinner.info('Linting check unavailable');
          checks.push({ name: 'Linting', status: 'info', detail: 'Unable to read package.json' });
        }

        // Summary
        header('Diagnostics Report');

        const okCount = checks.filter((c) => c.status === 'ok').length;
        const warnCount = checks.filter((c) => c.status === 'warn').length;
        const errorCount = checks.filter((c) => c.status === 'error').length;

        checks.forEach((check) => {
          let icon;
          if (check.status === 'ok') icon = icons.success;
          else if (check.status === 'warn') icon = icons.warning;
          else if (check.status === 'error') icon = icons.error;
          else icon = icons.info;

          statusLine(icon, `${check.name.padEnd(18)} ${chalk.gray(check.detail)}`);
        });

        process.stdout.write(chalk.gray('  ' + '─'.repeat(50)) + '\n');
        process.stdout.write(
          `  ${chalk.green(okCount + ' passed')}  ${chalk.yellow(warnCount + ' warnings')}  ${chalk.red(errorCount + ' errors')}\n`
        );

        if (hasErrors) {
          printError(chalk.red('\n❌ System check failed. Fix issues above.\n'));
          process.exitCode = 1;
          process.exit(process.exitCode);
        } else if (warnCount > 0) {
          printWarning(chalk.yellow('\n⚠️  System operational but has warnings.\n'));
        } else {
          printSuccess(chalk.green('\n✅ All systems operational.\n'));
        }

        // Suggestions
        if (configuredProviders.length === 0) {
          printInfo(chalk.cyan('💡 To configure AI providers, set an API key:'));
          printInfo(chalk.gray('   export ANTHROPIC_API_KEY=sk-ant-...'));
          printInfo(chalk.gray('   export OPENAI_API_KEY=sk-...'));
          printInfo(chalk.gray('   export GEMINI_API_KEY=...\n'));
        }

        if (foundRequired.length === 0) {
          printInfo(chalk.cyan('💡 To initialize a new project:'));
          printInfo(chalk.gray('   ultra-dex init\n'));
        }
      } catch (error) {
        await handleError(error, { command: 'doctor', options });
        process.exitCode = error.exitCode || 1;
        process.exit(process.exitCode);
      }
    });

  doctorCmd._examples = [
    { command: 'ultra-dex doctor', description: 'Run full diagnostics' },
    { command: 'ultra-dex doctor --fix', description: 'Attempt auto-fix where supported' },
  ];
}

/**
 * Register the config command with Commander
 * @param {Command} program - Commander program instance
 * @returns {void}
 */
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
    /**
     * Config command action
     * @param {Object} options - Config options
     */
    .action(async (options) => {
      try {
        const config = await loadConfig();

        if (options.mcp) {
          // Generate MCP config for Claude Desktop
          printInfo(chalk.cyan('\n🔌 MCP Configuration for Claude Desktop\n'));

          const mcpConfig = {
            'ultra-dex': {
              command: 'npx',
              args: ['ultra-dex', 'serve', '--port', String(config.mcpPort)],
              env: {},
            },
          };

          printInfo(chalk.white('Add this to your Claude Desktop config:\n'));
          process.stdout.write(chalk.gray('─'.repeat(50)) + '\n');
          process.stdout.write(JSON.stringify({ mcpServers: mcpConfig }, null, 2) + '\n');
          process.stdout.write(chalk.gray('─'.repeat(50)) + '\n');

          printInfo(chalk.cyan('\n📍 Config file locations:'));
          printInfo(
            chalk.gray('   macOS: ~/Library/Application Support/Claude/claude_desktop_config.json')
          );
          printInfo(chalk.gray('   Windows: %APPDATA%\\Claude\\claude_desktop_config.json'));
          printInfo(chalk.gray('   Linux: ~/.config/Claude/claude_desktop_config.json\n'));
          return;
        }

        if (options.init) {
          const configPath = await saveConfig(DEFAULT_CONFIG, options.global);
          printSuccess(chalk.green(`✅ Config created: ${configPath}`));
          return;
        }

        if (options.list) {
          printInfo(chalk.cyan('\n⚙️  Ultra-Dex Configuration\n'));
          printInfo(chalk.gray(`Source: ${config.source}`));
          process.stdout.write(chalk.gray('─'.repeat(40)) + '\n');

          const { source: _source, ...displayConfig } = config;
          Object.entries(displayConfig).forEach(([key, value]) => {
            const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
            process.stdout.write(`  ${chalk.cyan(key.padEnd(15))} ${valueStr}\n`);
          });
          process.stdout.write('\n');
          return;
        }

        if (options.get) {
          const value = config[options.get];
          if (value !== undefined) {
            process.stdout.write(
              typeof value === 'object' ? JSON.stringify(value, null, 2) + '\n' : value + '\n'
            );
          } else {
            printWarning(chalk.yellow(`Key not found: ${options.get}`));
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
          printSuccess(chalk.green(`✅ Set ${key}=${value} in ${configPath}`));
          return;
        }

        // Interactive mode
        printInfo(chalk.cyan('\n⚙️  Ultra-Dex Configuration\n'));

        const { action } = await inquirer.prompt([
          {
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
            ],
          },
        ]);

        switch (action) {
          case 'view':
            process.stdout.write(chalk.gray('\n' + JSON.stringify(config, null, 2) + '\n') + '\n');
            break;

          case 'provider': {
            const { provider } = await inquirer.prompt([
              {
                type: 'list',
                name: 'provider',
                message: 'Select default AI provider:',
                choices: ['claude', 'openai', 'gemini'],
                default: config.provider,
              },
            ]);
            config.provider = provider;
            await saveConfig(config, options.global);
            printSuccess(chalk.green(`\n✅ Default provider set to: ${provider}\n`));
            break;
          }

          case 'minScore': {
            const { minScore } = await inquirer.prompt([
              {
                type: 'number',
                name: 'minScore',
                message: 'Minimum alignment score (0-100):',
                default: config.minScore,
                validate: (n) => (n >= 0 && n <= 100) || 'Must be 0-100',
              },
            ]);
            config.minScore = minScore;
            await saveConfig(config, options.global);
            printSuccess(chalk.green(`\n✅ Minimum score set to: ${minScore}\n`));
            break;
          }

          case 'mcpPort': {
            const { mcpPort } = await inquirer.prompt([
              {
                type: 'number',
                name: 'mcpPort',
                message: 'MCP server port:',
                default: config.mcpPort,
                validate: (n) => (n > 0 && n < 65536) || 'Invalid port',
              },
            ]);
            config.mcpPort = mcpPort;
            await saveConfig(config, options.global);
            printSuccess(chalk.green(`\n✅ MCP port set to: ${mcpPort}\n`));
            break;
          }

          case 'mcp':
            // Call the MCP generation
            options.mcp = true;
            await program.commands.find((c) => c.name() === 'config').action(options);
            break;

          case 'init': {
            const { scope } = await inquirer.prompt([
              {
                type: 'list',
                name: 'scope',
                message: 'Create config in:',
                choices: [
                  { name: 'This project (.ultra-dex.json)', value: 'project' },
                  { name: 'Global (~/.ultra-dex.json)', value: 'global' },
                ],
              },
            ]);
            const configPath = await saveConfig(DEFAULT_CONFIG, scope === 'global');
            printSuccess(chalk.green(`\n✅ Config created: ${configPath}\n`));
            break;
          }
        }
      } catch (error) {
        await handleError(error, { command: 'config', options });
        process.exitCode = error.exitCode || 1;
        process.exit(process.exitCode);
      }
    });
}

export default { registerDoctorCommand, registerConfigCommand };
