#!/usr/bin/env node

import { Command } from 'commander';

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

// New v2.4 Commands
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

const program = new Command();
program.banner = banner;

program
  .name('ultra-dex')
  .description('CLI for Ultra-Dex SaaS Implementation Framework')
  .version('2.4.0');

registerInitCommand(program);
registerAuditCommand(program);
registerExamplesCommand(program);
registerAgentsCommand(program);
registerGenerateCommand(program);
registerBuildCommand(program);
registerReviewCommand(program);
registerRunCommand(program);

// v2.4 Commands
program
  .command('swarm <task>')
  .description('Run autonomous agent pipeline')
  .option('--dry-run', 'Show pipeline without executing')
  .option('--parallel', 'Run agents in parallel where possible')
  .action(swarmCommand);

program
  .command('watch')
  .description('Auto-update state on file changes')
  .action(watchCommand);

program
  .command('diff')
  .description('Compare plan vs implemented code')
  .action(diffCommand);

program
  .command('export')
  .description('Export project context')
  .option('--format <type>', 'Output format: json, html, md', 'json')
  .action(exportCommand);

program
  .command('upgrade')
  .description('Check for CLI updates')
  .option('--check', 'Just check, no install')
  .action(upgradeCommand);

program
  .command('config')
  .description('Show or generate configuration')
  .option('--mcp', 'Generate MCP config for Claude Desktop')
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

program.parse();