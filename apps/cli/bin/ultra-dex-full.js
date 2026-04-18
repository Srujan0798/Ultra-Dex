#!/usr/bin/env node

/**
 * Ultra-Dex Full CLI
 * Registers all active commands using static imports for bundling compatibility.
 * Stale/broken commands moved to archive/cli-deprecated/.
 */

import { program } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { VERSION } from '../lib/utils/version.js';

// Static imports for all command modules
// These are imported statically so esbuild can bundle them correctly
import * as runCmd from '../lib/commands/run.js';
import * as generateCmd from '../lib/commands/generate.js';
import * as buildCmd from '../lib/commands/build.js';
import * as deployCmd from '../lib/commands/deploy.js';
import * as initCmd from '../lib/commands/init.js';
import * as scaffoldCmd from '../lib/commands/scaffold.js';
import * as agentsCmd from '../lib/commands/agents.js';
import * as brainCmd from '../lib/commands/brain.js';
import * as reviewCmd from '../lib/commands/review.js';
import * as checkCmd from '../lib/commands/check.js';
import * as qualityCmd from '../lib/commands/quality.js';
import * as doctorCmd from '../lib/commands/doctor.js';
import * as configCmd from '../lib/commands/config.js';
import * as helpCmd from '../lib/commands/help.js';
import * as healthCmd from '../lib/commands/health.js';
import * as execCmd from '../lib/commands/exec.js';
import * as fetchCmd from '../lib/commands/fetch.js';
import * as forgeCmd from '../lib/commands/forge.js';
import * as syncCmd from '../lib/commands/sync.js';
import * as importCmd from '../lib/commands/import.js';
import * as exportCmd from '../lib/commands/export.js';
import * as upgradeCmd from '../lib/commands/upgrade.js';
import * as integrateCmd from '../lib/commands/integrate.js';
import * as suggestCmd from '../lib/commands/suggest.js';
import * as predictCmd from '../lib/commands/predict.js';
import * as pipelineCmd from '../lib/commands/pipeline.js';
import * as ralphCmd from '../lib/commands/ralph.js';
import * as stateCmd from '../lib/commands/state.js';
import * as mcpRemoteCmd from '../lib/commands/mcp-remote.js';
import * as mcpCmd from '../lib/commands/mcp.js';
import * as githubCmd from '../lib/commands/github.js';
import * as serveCmd from '../lib/commands/serve.js';
import * as autoImplementCmd from '../lib/commands/auto-implement.js';
// Note: enterprise-lite.js excluded - imports from non-existent src/core/enterprise/init.ts
import * as skillCmd from '../lib/commands/skill.js';
import * as replayCmd from '../lib/commands/replay.js';
import * as pluginCmd from '../lib/commands/plugin.js';
import * as marketplaceCmd from '../lib/commands/marketplace.js';
// Note: team.js excluded - imports from non-existent src/core/team/team-manager.ts
import * as auditCmd from '../lib/commands/audit.js';
import * as perfCmd from '../lib/commands/perf.js';
import * as swarmCmd from '../lib/commands/swarm.js';
import * as verifyCmd from '../lib/commands/verify.js';
import * as autonomousCmd from '../lib/commands/autonomous.js';

// Note: search.js / vector-search.js excluded - missing langchain dep leaves shared graph.js in broken linking state
// Note: autonomous.js excluded from default - top-level import of src/core/orchestration causes synchronous CJS deadlock via express

// Command registration with static imports
// Format: [module, registerFunctionName]
const commandRegistrations = [
  // run.js exports multiple commands
  [runCmd, 'registerRunCommand'],
  [runCmd, 'registerSwarmCommand'],
  [runCmd, 'registerDistributedCommand'],

  // Other command modules
  [generateCmd, 'registerGenerateCommand'],
  [buildCmd, 'registerBuildCommand'],
  [deployCmd, 'registerDeployCommand'],
  [initCmd, 'registerInitCommand'],
  [scaffoldCmd, 'registerScaffoldCommand'],
  [agentsCmd, 'registerAgentsCommand'],
  [agentsCmd, 'registerPackCommand'],
  [swarmCmd, 'registerSwarmCommand'],
  [brainCmd, 'registerBrainCommand'],
  [reviewCmd, 'registerReviewCommand'],
  [verifyCmd, 'registerVerifyCommand'],
  [qualityCmd, 'registerQualityCommand'],
  [doctorCmd, 'registerDoctorCommand'],
  [configCmd, 'registerConfigCommand'],
  [helpCmd, 'registerHelpCommand'],
  [healthCmd, 'registerHealthCommand'],
  [execCmd, 'registerExecCommand'],
  [fetchCmd, 'registerFetchCommand'],
  [forgeCmd, 'registerForgeCommand'],
  [syncCmd, 'registerSyncCommand'],
  [importCmd, 'registerImportCommand'],
  [exportCmd, 'registerExportCommand'],
  [upgradeCmd, 'registerUpgradeCommand'],
  [integrateCmd, 'registerIntegrateCommand'],
  [suggestCmd, 'registerSuggestCommand'],
  [predictCmd, 'registerPredictCommand'],
  [pipelineCmd, 'registerPipelineCommand'],
  [ralphCmd, 'registerRalphCommand'],
  [stateCmd, 'registerStateCommand'],
  [mcpRemoteCmd, 'registerMcpRemoteCommand'],
  [mcpCmd, 'registerMcpCommand'],
  [githubCmd, 'registerGitHubCommand'],
  [serveCmd, 'registerServeCommand'],
  [autoImplementCmd, 'registerAutoImplementCommand'],
  [checkCmd, 'registerCheckCommand'],
  // [enterpriseLiteCmd, 'registerEnterpriseCommand'], // Excluded - missing init.ts dependency
  [skillCmd, 'registerSkillCommand'],
  [replayCmd, 'registerReplayCommand'],
  [pluginCmd, 'registerPluginCommand'],
  [marketplaceCmd, 'registerMarketplaceCommand'],
  [teamCmd, 'registerTeamCommand'],
  [auditCmd, 'registerAuditCommand'],
  [perfCmd, 'registerPerfCommand'],

  // Optional/experimental commands
  [autonomousCmd, 'registerAutonomousCommand'],
];

export async function registerFullProgram(targetProgram = program) {
  for (const [moduleObj, fnName] of commandRegistrations) {
    try {
      const fn = moduleObj[fnName];
      if (typeof fn === 'function') {
        fn(targetProgram);
      } else if (process.env.ULTRA_DEX_DEBUG === '1') {
        console.error(chalk.yellow(`Warning: ${fnName} is not a function in module`));
      }
    } catch (err) {
      // Skip commands that fail to register
      if (process.env.ULTRA_DEX_DEBUG === '1') {
        console.error(
          chalk.yellow(`Warning: Failed to register command ${fnName}: ${err.message}`)
        );
      }
    }
  }
}

const isEntrypoint =
  Boolean(process.argv[1]) && path.basename(process.argv[1]) === 'ultra-dex-full.js';

if (isEntrypoint) {
  const run = async () => {
    program
      .name('ultra-dex')
      .description('AI Orchestration Meta-Layer for SaaS Development')
      .version(VERSION);

    await registerFullProgram(program);

    const argv = process.argv.length > 2 ? process.argv : [...process.argv, '--help'];
    await program.parseAsync(argv);
    process.exit(process.exitCode ?? 0);
  };

  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
