#!/usr/bin/env node

process.env.FORCE_COLOR = '3';

import { Command } from 'commander';
import updateNotifier from 'update-notifier';
import boxen from 'boxen';
import chalk from 'chalk';
import { setDoomsdayMode } from '../lib/utils/theme-state.js';

// Check for doomsday flag early
if (process.argv.includes('--doomsday')) {
  setDoomsdayMode(true);
}

import { showHelp as showDoomsdayHelp } from '../lib/themes/doomsday.js';

if (process.argv.includes('--help') && process.argv.includes('--doomsday')) {
  showDoomsdayHelp();
  process.exit(0);
}

// Check for updates
const pkg = { name: 'ultra-dex', version: '3.2.0' };
const notifier = updateNotifier({ pkg, updateCheckInterval: 1000 * 60 * 60 * 24 });

if (notifier.update) {
  console.log(boxen(
    `Update available! ${chalk.dim(notifier.update.current)} → ${chalk.green(notifier.update.latest)}\n` +
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
import { registerAgentBuilderCommand } from '../lib/commands/agent-builder.js';
import { registerGenerateCommand } from '../lib/commands/generate.js';
import { registerBuildCommand } from '../lib/commands/build.js';
import { registerReviewCommand } from '../lib/commands/review.js';
import { registerRunCommand, registerSwarmCommand } from '../lib/commands/run.js';
import { registerAutoImplementCommand } from '../lib/commands/auto-implement.js';
import { registerCiMonitorCommand } from '../lib/commands/ci-monitor.js';
import { registerAlignCommand, registerStatusCommand, registerPreCommitCommand, registerStateCommand } from '../lib/commands/state.js';
import { registerDoctorCommand } from '../lib/commands/doctor.js';
import { registerDashboardCommand } from '../lib/commands/dashboard.js';
import { registerCheckCommand } from '../lib/commands/advanced.js';
import { registerServeCommand } from '../lib/commands/serve.js';
import { registerVerifyCommand } from '../lib/commands/verify.js';

// v3.0 Commands
import { swarmCommand } from '../lib/commands/swarm.js';
import { watchCommand } from '../lib/commands/watch.js';
import { diffCommand } from '../lib/commands/diff.js';
import { exportCommand } from '../lib/commands/export.js';
import { upgradeCommand } from '../lib/commands/upgrade.js';
import { configCommand } from '../lib/commands/config.js';

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

const program = new Command();
program.banner = banner;

program
  .name('ultra-dex')
  .description('CLI for Ultra-Dex SaaS Implementation Framework')
  .version('3.2.0');

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
registerAgentBuilderCommand(program);
registerTeamCommand(program);
registerMemoryCommand(program);

program.parse();