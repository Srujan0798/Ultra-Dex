#!/usr/bin/env node

import { Command } from 'commander';

import { banner } from '../lib/commands/banner.js';
import { registerInitCommand } from '../lib/commands/init.js';
import { registerAuditCommand } from '../lib/commands/audit.js';
import { registerExamplesCommand } from '../lib/commands/examples.js';
import { registerAgentsCommand, registerPackCommand } from '../lib/commands/agents.js';
import { registerBuildCommand } from '../lib/commands/build.js';
import { registerReviewCommand } from '../lib/commands/review.js';
import { registerServeCommand } from '../lib/commands/serve.js';
import { registerWorkflowCommand } from '../lib/commands/workflows.js';
import { registerSuggestCommand } from '../lib/commands/suggest.js';
import { registerValidateCommand } from '../lib/commands/validate.js';
import { registerHooksCommand } from '../lib/commands/hooks.js';
import { registerFetchCommand } from '../lib/commands/fetch.js';
import { registerSyncCommand } from '../lib/commands/sync.js';

const program = new Command();
program.banner = banner;

program
  .name('ultra-dex')
  .description('CLI for Ultra-Dex SaaS Implementation Framework')
  .version('2.2.1');

registerInitCommand(program);
registerAuditCommand(program);
registerExamplesCommand(program);
registerAgentsCommand(program);
registerBuildCommand(program);
registerReviewCommand(program);
registerServeCommand(program);
registerPackCommand(program);
registerWorkflowCommand(program);
registerSuggestCommand(program);
registerValidateCommand(program);
registerHooksCommand(program);
registerFetchCommand(program);
registerSyncCommand(program);

program.parse();
