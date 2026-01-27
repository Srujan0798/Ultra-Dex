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
import { registerAlignCommand, registerStatusCommand, registerWatchCommand, registerPreCommitCommand, registerStateCommand } from '../lib/commands/state.js';
import { registerDoctorCommand, registerConfigCommand } from '../lib/commands/doctor.js';
import { registerDashboardCommand } from '../lib/commands/dashboard.js';
import { registerDiffCommand, registerExportCommand, registerUpgradeCommand } from '../lib/commands/advanced.js';
import { registerServeCommand } from '../lib/commands/serve.js';
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
registerSwarmCommand(program);
registerAlignCommand(program);
registerStatusCommand(program);
registerWatchCommand(program);
registerPreCommitCommand(program);
registerStateCommand(program);
registerDoctorCommand(program);
registerConfigCommand(program);
registerDashboardCommand(program);
registerDiffCommand(program);
registerExportCommand(program);
registerUpgradeCommand(program);
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
