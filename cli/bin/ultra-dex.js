#!/usr/bin/env node

process.env.FORCE_COLOR = '3';

import { Command } from 'commander';
import updateNotifier from 'update-notifier';
import boxen from 'boxen';
import chalk from 'chalk';
import { setDoomsdayMode } from '../lib/utils/theme-state.js';
import { VERSION, PACKAGE_NAME } from '../lib/utils/version.js';

// Initialize monitoring and configuration systems
import { monitoring } from '../lib/utils/monitoring.js';
import { configManager } from '../lib/utils/config-manager.js';
import { pluginManager } from '../lib/plugin-system.js';
import '../lib/utils/error-recovery.js';

// Wait for initialization
try {
  await Promise.all([
    monitoring.initialize(),
    configManager.load(),
    pluginManager.initialize()
  ]);
} catch (error) {
  console.error(chalk.red('Failed to initialize systems:'), error.message);
}

// Log startup
monitoring.info('Ultra-Dex CLI starting', {
  version: VERSION,
  pid: process.pid,
  nodeVersion: process.version,
  platform: process.platform
});

// Check for doomsday flag early
if (process.argv.includes('--doomsday')) {
  setDoomsdayMode(true);
}

import { showHelp as showDoomsdayHelp } from '../lib/themes/doomsday.js';

if (process.argv.includes('--help') && process.argv.includes('--doomsday')) {
  showDoomsdayHelp();
  process.exit(0);
}

// Check for ACP (Agent Client Protocol) mode - GitHub's agent portability standard
const isAcpMode = process.argv.includes('--acp');
if (isAcpMode) {
  const acpPort = process.argv.find(arg => arg.startsWith('--acp-port='))?.split('=')[1];
  const acpHttp = process.argv.includes('--acp-http');
  
  (async () => {
    try {
      const { startACPHost } = await import('../lib/acp/host.js');
      await startACPHost({
        stdio: !acpHttp,
        http: acpHttp,
        port: acpPort ? parseInt(acpPort, 10) : 3002
      });
    } catch (error) {
      console.error(chalk.red('\n✕ Failed to start ACP Host:'), error.message);
      process.exit(1);
    }
  })();
  
  // ACP mode takes over completely - don't process other commands
  await new Promise(() => {});
}

// Check for updates
const pkg = { name: PACKAGE_NAME, version: VERSION };
const notifier = updateNotifier({ pkg, updateCheckInterval: 1000 * 60 * 60 * 24 });

if (notifier.update) {
  console.log(boxen(
    `Update available! ${chalk.dim(notifier.update.current)} → ${chalk.green(notifier.update.latest)}
` +
    `Run ${chalk.cyan('npm install -g ultra-dex')} to update`,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'yellow'
    }
  ));
}

import { banner } from '../lib/commands/banner.js';
import { registerInitCommand } from '../lib/commands/init.js';
import { registerAuditCommand } from '../lib/commands/audit.js';
import { registerExamplesCommand } from '../lib/commands/examples.js';
import { registerAgentsCommand, registerPackCommand } from '../lib/commands/agents.js';
import { registerGenerateCommand } from '../lib/commands/generate.js';
import { registerBuildCommand } from '../lib/commands/build.js';
import { registerReviewCommand } from '../lib/commands/review.js';
import { registerRunCommand } from '../lib/commands/run.js';
import { registerAutoImplementCommand } from '../lib/commands/auto-implement.js';
import { registerCiMonitorCommand } from '../lib/commands/ci-monitor.js';
import { registerAlignCommand, registerStatusCommand, registerPreCommitCommand, registerStateCommand } from '../lib/commands/state.js';
import { registerDoctorCommand } from '../lib/commands/doctor.js';
import { registerDashboardCommand } from '../lib/commands/dashboard.js';
import { registerCheckCommand, registerBatchCommand, registerPipelineCommand } from '../lib/commands/advanced.js';
import { registerServeCommand } from '../lib/commands/serve.js';
import { registerVerifyCommand } from '../lib/commands/verify.js';
import { registerPluginCommand } from '../lib/commands/plugin.js';
import { registerWorkspaceCommand } from '../lib/commands/workspace.js';
import { registerVoiceCommand } from '../lib/commands/voice.js';
import { registerAuthCommand } from '../lib/commands/auth.js';

// v3.0 Commands
import { swarmCommand } from '../lib/commands/swarm.js';
import { watchCommand } from '../lib/commands/watch.js';
import { diffCommand } from '../lib/commands/diff.js';
import { exportCommand } from '../lib/commands/export.js';
import { upgradeCommand } from '../lib/commands/upgrade.js';
import { configCommand } from '../lib/commands/config.js';

import { registerRalphCommand } from '../lib/commands/ralph.js';
import { registerWorkflowCommand } from '../lib/commands/workflows.js';
import { registerPlanCommand } from '../lib/commands/plan.js';
import { registerSuggestCommand } from '../lib/commands/suggest.js';
import { registerValidateCommand } from '../lib/commands/validate.js';
import { registerFixCommand } from '../lib/commands/fix.js';
import { registerHooksCommand } from '../lib/commands/hooks.js';
import { registerFetchCommand } from '../lib/commands/fetch.js';
import { registerSyncCommand } from '../lib/commands/sync.js';
import { registerTeamCommand } from '../lib/commands/team.js';
import { registerMemoryCommand } from '../lib/commands/memory.js';
import { registerScaffoldCommand } from '../lib/commands/scaffold.js';
import { registerSystemConfigCommand, registerMetricsCommand, registerHealthCommand, registerDebugCommand } from '../lib/commands/monitoring.js';
import { registerBrainCommand } from '../lib/commands/brain.js';
import { startACPHost } from '../lib/acp/host.js';

// v3.4.3 Commands - 2026 Competitive Features
import { registerBrowserCommand } from '../lib/commands/browser.js';
import { registerExecCommand } from '../lib/commands/exec.js';
import { registerGitHubCommand } from '../lib/commands/github.js';
import { registerSearchCommand } from '../lib/commands/search.js';
import { registerCloudCommand } from '../lib/commands/cloud.js';
import { registerAutonomousCommand } from '../lib/commands/autonomous.js';
import { registerPTYCommands } from '../lib/commands/pty.js';
import { startInteractiveMode } from '../lib/ui/interactive.js';
import { theme, ultraGradient } from '../lib/ui/theme.js';

const program = new Command();

// Custom Help Configuration - Professional Purple Edition
program.configureHelp({
  formatHelp: (cmd, _helper) => {
    // For subcommands, build command-specific help
    if (cmd.parent) {
      let output = `\n${theme.title('Usage:')} ${theme.primary('ultra-dex ' + cmd.name())} ${theme.dim('[options]')}\n\n`;
      output += `${theme.subtitle(cmd.description())}\n\n`;

      const options = cmd.options;
      if (options.length > 0) {
        output += `${theme.title('Options:')}\n`;
        options.forEach(opt => {
          const flags = opt.flags.padEnd(25);
          output += `  ${theme.primary(flags)} ${theme.dim(opt.description)}\n`;
        });
        output += '\n';
      }

      return output;
    }

    const gradientBanner = ultraGradient(banner);

    let output = `\n${gradientBanner}\n\n`;
    output += `  ${theme.subtitle('AI Orchestration Meta-Layer for SaaS Development')}\n`;
    output += `  ${theme.dim('Version: ' + VERSION)}\n\n`;

    output += `  ${theme.title('USAGE')}\n`;
    output += `    ${theme.primary('ultra-dex')} ${theme.warning('[command]')} ${theme.dim('[options]')}\n\n`;

    output += `  ${theme.title('COMMANDS')}\n`;

    // Sort and format commands
    const commands = cmd.commands.map(c => {
        return `    ${theme.accent(c.name().padEnd(20))} ${theme.dim(c.description())}`;
    }).sort().join('\n');

    output += commands + '\n\n';

    output += `  ${theme.title('OPTIONS')}\n`;
    output += `    ${theme.primary('-V, --version').padEnd(20)} ${theme.dim('output the version number')}\n`;
    output += `    ${theme.primary('-h, --help').padEnd(20)} ${theme.dim('display help for command')}\n`;
    output += `    ${theme.primary('--acp').padEnd(20)} ${theme.dim('start ACP (Agent Client Protocol) host')}\n\n`;

    output += `  ${theme.dim('─────────────────────────────────────────────────────────')}\n`;
    output += `  ${theme.subtitle('Run ultra-dex without arguments to launch the Interactive Dashboard')}\n\n`;

    return output;
  }
});

program
  .name('ultra-dex')
  .description(theme.subtitle('AI Orchestration Meta-Layer for SaaS Development'))
  .version(VERSION);

registerInitCommand(program);
registerAuditCommand(program);
registerExamplesCommand(program);
registerAgentsCommand(program);
registerGenerateCommand(program);
registerBuildCommand(program);
registerReviewCommand(program);
registerRunCommand(program);

// v3.0 Commands
program
  .command('swarm <task>')
  .description('Run autonomous agent pipeline')
  .option('--dry-run', 'Show pipeline without executing')
  .option('--parallel', 'Run implementation tier agents in parallel')
  .action(swarmCommand);

program
  .command('watch')
  .description('Auto-update state on file changes')
  .option('--interval <ms>', 'Debounce interval in milliseconds', '500')
  .action(watchCommand);

program
  .command('diff')
  .description('Compare plan vs implemented code')
  .option('--json', 'Output as JSON')
  .action(diffCommand);

program
  .command('export')
  .description('Export project context')
  .option('--format <type>', 'Output format: json, html, markdown, pdf', 'json')
  .option('--output <path>', 'Output file path')
  .option('--include-agents', 'Bundle all agent prompts')
  .action(exportCommand);

program
  .command('upgrade')
  .description('Check for CLI updates')
  .option('--check', 'Check only, do not show install instructions')
  .option('--install', 'Automatically install latest version')
  .action(upgradeCommand);

program
  .command('config')
  .description('Show or generate configuration')
  .option('--mcp', 'Generate MCP config for Claude Desktop')
  .option('--cursor', 'Generate Cursor IDE rules')
  .option('--vscode', 'Generate VS Code settings.json')
  .option('--show', 'Display current Ultra-Dex config')
  .option('--set <key=value>', 'Set a config value')
  .option('--get <key>', 'Get a specific config value')
  .action(configCommand);

registerAutoImplementCommand(program);
registerCiMonitorCommand(program);
registerAlignCommand(program);
registerStatusCommand(program);
registerPreCommitCommand(program);
registerStateCommand(program);
registerDoctorCommand(program);
registerDashboardCommand(program);
registerCheckCommand(program);
registerServeCommand(program);
registerVerifyCommand(program);
registerPackCommand(program);
registerWorkflowCommand(program);
registerPlanCommand(program);
registerSuggestCommand(program);
registerValidateCommand(program);
registerFixCommand(program);
registerHooksCommand(program);
registerFetchCommand(program);
registerSyncCommand(program);
registerTeamCommand(program);
registerMemoryCommand(program);
registerScaffoldCommand(program);
registerPluginCommand(program);
registerVoiceCommand(program);
registerAuthCommand(program);

// Monitoring commands (v3.4.3) - note: status uses state.js, sys-config uses monitoring.js
registerSystemConfigCommand(program);
registerMetricsCommand(program);
registerHealthCommand(program);
registerDebugCommand(program);

// v3.4.3 Commands - 2026 Competitive Features
registerExecCommand(program);
registerBrowserCommand(program);
registerGitHubCommand(program);
registerSearchCommand(program);
registerCloudCommand(program);
registerBrainCommand(program);
registerAutonomousCommand(program);
registerRalphCommand(program);
registerWorkspaceCommand(program);
registerBatchCommand(program);
registerPipelineCommand(program);
registerPTYCommands(program);

// ACP (Agent Client Protocol) Commands
import { cursorCommand } from '../lib/acp/cursor.js';

program
  .command('acp')
  .description('Start ACP (Agent Client Protocol) host for IDE integration')
  .option('--http', 'Run in HTTP mode instead of stdio')
  .option('--port <port>', 'Port for HTTP mode', '3002')
  .option('--stdio', 'Run in stdio mode (default)', true)
  .action(async (options) => {
    const { startACPHost } = await import('../lib/acp/host.js');
    await startACPHost({
      stdio: !options.http,
      http: options.http,
      port: parseInt(options.port, 10)
    });
  });

program
  .command('cursor')
  .description('Manage Cursor 2.0 IDE integration')
  .option('--install', 'Install Cursor ACP integration (default)')
  .option('--uninstall', 'Remove Cursor ACP integration')
  .option('--status', 'Check Cursor integration status')
  .option('--vscode', 'Also update VS Code settings')
  .action(async (options) => {
    await cursorCommand(options);
  });

// Activate plugins after all commands are registered
try {
  await pluginManager.activatePlugins(program);
} catch (error) {
  console.error(chalk.red('Failed to activate plugins:'), error.message);
}

// Launch interactive mode if no arguments provided
if (process.argv.length <= 2) {
  try {
    await startInteractiveMode();
  } catch (error) {
    console.error(chalk.red('Interactive mode failed:'), error.message);
  }
} else {
  // Add 'Did you mean?' logic for typos
  program.on('command:*', () => {
    const commandName = program.args[0];
    const availableCommands = program.commands.map(cmd => cmd.name());
    
    // Simple Levenshtein-like distance check
    const suggestions = availableCommands.filter(cmd => {
        let distance = 0;
        const longer = commandName.length > cmd.length ? commandName : cmd;
        const shorter = commandName.length > cmd.length ? cmd : commandName;
        
        for (let i = 0; i < shorter.length; i++) {
            if (commandName[i] !== cmd[i]) distance++;
        }
        distance += Math.abs(commandName.length - cmd.length);
        return distance <= 2;
    });

    console.error(chalk.red(`\n✕ Unknown command: ${commandName}`));
    if (suggestions.length > 0) {
        console.log(chalk.yellow(`  Did you mean: ${suggestions.join(', ')}?\n`));
    } else {
        console.log(chalk.gray(`  Run 'ultra-dex --help' for a list of available commands.\n`));
    }
    process.exit(1);
  });

  try {
    program.parse();
  } catch (error) {
    console.error(chalk.red('Command execution failed:'), error.message);
  }
}
