#!/usr/bin/env node

/**
 * Ultra-Dex Full CLI
 * Registers all active commands. Stale/broken commands moved to archive/cli-deprecated/.
 */

import { program } from 'commander';
import chalk from 'chalk';
import { VERSION } from '../lib/utils/version.js';
import { pathToFileURL } from 'url';

const commandRegistrars = [
  { path: '../lib/commands/run.js', register: 'registerRunCommand' },
  { path: '../lib/commands/run.js', register: 'registerSwarmCommand' },
  { path: '../lib/commands/run.js', register: 'registerDistributedCommand' },
  { path: '../lib/commands/generate.js', register: 'registerGenerateCommand' },
  { path: '../lib/commands/build.js', register: 'registerBuildCommand' },
  { path: '../lib/commands/deploy.js', register: 'registerDeployCommand' },
  { path: '../lib/commands/init.js', register: 'registerInitCommand' },
  { path: '../lib/commands/scaffold.js', register: 'registerScaffoldCommand' },
  { path: '../lib/commands/agents.js', register: 'registerAgentsCommand' },
  { path: '../lib/commands/swarm.js', register: 'registerSwarmCommand' },
  { path: '../lib/commands/brain.js', register: 'registerBrainCommand' },
  { path: '../lib/commands/review.js', register: 'registerReviewCommand' },
  { path: '../lib/commands/verify.js', register: 'registerVerifyCommand' },
  { path: '../lib/commands/quality.js', register: 'registerQualityCommand' },
  { path: '../lib/commands/doctor.js', register: 'registerDoctorCommand' },
  { path: '../lib/commands/config.js', register: 'registerConfigCommand' },
  { path: '../lib/commands/help.js', register: 'registerHelpCommand' },
  { path: '../lib/commands/health.js', register: 'registerHealthCommand' },
  { path: '../lib/commands/exec.js', register: 'registerExecCommand' },
  { path: '../lib/commands/fetch.js', register: 'registerFetchCommand' },
  { path: '../lib/commands/forge.js', register: 'registerForgeCommand' },
  { path: '../lib/commands/sync.js', register: 'registerSyncCommand' },
  { path: '../lib/commands/import.js', register: 'registerImportCommand' },
  { path: '../lib/commands/export.js', register: 'registerExportCommand' },
  { path: '../lib/commands/upgrade.js', register: 'registerUpgradeCommand' },
  { path: '../lib/commands/integrate.js', register: 'registerIntegrateCommand' },
  { path: '../lib/commands/suggest.js', register: 'registerSuggestCommand' },
  { path: '../lib/commands/predict.js', register: 'registerPredictCommand' },
  // autonomous.js excluded: top-level import of src/core/orchestration causes synchronous CJS deadlock via express
  { path: '../lib/commands/pipeline.js', register: 'registerPipelineCommand' },
  { path: '../lib/commands/ralph.js', register: 'registerRalphCommand' },
  // search.js / vector-search.js excluded: missing langchain dep leaves shared graph.js in broken linking state

  { path: '../lib/commands/state.js', register: 'registerStateCommand' },
  { path: '../lib/commands/mcp-remote.js', register: 'registerMcpRemoteCommand' },
  { path: '../lib/commands/mcp.js', register: 'registerMcpCommand' },
  { path: '../lib/commands/github.js', register: 'registerGithubCommand' },
  { path: '../lib/commands/serve.js', register: 'registerServeCommand' },
  { path: '../lib/commands/login.ts', register: 'registerLoginCommand' },
  { path: '../lib/commands/auto-implement.js', register: 'registerAutoImplementCommand' },
  { path: '../lib/commands/check.js', register: 'registerCheckCommand' },
  { path: '../lib/commands/enterprise-lite.js', register: 'registerEnterpriseCommand' },
  { path: '../lib/commands/skill.js', register: 'registerSkillCommand' },
  { path: '../lib/commands/replay.js', register: 'registerReplayCommand' },
  { path: '../lib/commands/plugin.js', register: 'registerPluginCommand' },
  { path: '../lib/commands/marketplace.js', register: 'registerMarketplaceCommand' },
  { path: '../lib/commands/team.js', register: 'registerTeamCommand' },
  { path: '../lib/commands/audit.js', register: 'registerAuditCommand' },
  { path: '../lib/commands/perf.js', register: 'registerPerfCommand' },
];

export async function registerFullProgram(targetProgram = program) {
  for (const { path: cmdPath, register: fnName } of commandRegistrars) {
    try {
      const mod = await import(cmdPath);
      const fn = mod[fnName];
      if (typeof fn === 'function') {
        fn(targetProgram);
      }
    } catch (err) {
      // Skip commands that fail to load (missing deps, timeout, etc.)
      if (process.env.ULTRA_DEX_DEBUG === '1') {
        console.error(
          chalk.yellow(`Warning: Failed to register command from ${cmdPath}: ${err.message}`)
        );
      }
    }
  }
}

const isEntrypoint =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  program
    .name('ultra-dex')
    .description('AI Orchestration Meta-Layer for SaaS Development')
    .version(VERSION);

  await registerFullProgram(program);

  const argv = process.argv.length > 2 ? process.argv : [...process.argv, '--help'];
  await program.parseAsync(argv);
  process.exit(process.exitCode ?? 0);
}
