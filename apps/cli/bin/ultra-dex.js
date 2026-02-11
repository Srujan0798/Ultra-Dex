#!/usr/bin/env node

/**
 * @fileoverview Ultra Dex module
 * @module bin/ultra-dex
 */

process.env.FORCE_COLOR = '3';

import { Command } from 'commander';
import updateNotifier from 'update-notifier';
import boxen from 'boxen';
import chalk from 'chalk';
import { setDoomsdayMode } from '../lib/utils/theme-state.js';
import { VERSION, PACKAGE_NAME } from '../lib/utils/version.js';
import { formatInfo, formatWarning, formatSuccess } from '../lib/utils/status.js';
import { recordUsageEventSync } from '../lib/enterprise/usage.js';
import { isTelemetryEnabledSync } from '../lib/utils/telemetry.js';

// Initialize monitoring and configuration systems
import { monitoring } from '../lib/utils/monitoring.js';
import { configManager } from '../lib/utils/config-manager.js';
import { pluginManager } from '../lib/plugin-system.js';
import { governance } from '../lib/governance/index.js';
import { installHistoryTracking } from '../lib/history/tracker.js';
import '../lib/utils/error-recovery.js';

const wantsHelp =
  process.argv.includes('--help') ||
  process.argv.includes('-h') ||
  process.argv.includes('--version') ||
  process.argv.includes('-V');

// Wait for initialization
if (!wantsHelp && process.env.NODE_ENV !== 'test') {
  try {
    await Promise.all([
      monitoring.initialize(),
      configManager.load(),
      pluginManager.initialize(),
      governance.init(),
      installHistoryTracking(),
    ]);
  } catch (error) {
    console.error(chalk.red('Failed to initialize systems:'), error.message);
  }
}

// Log startup
monitoring.info('Ultra-Dex CLI starting', {
  version: VERSION,
  pid: process.pid,
  nodeVersion: process.version,
  platform: process.platform,
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
  const acpPort = process.argv.find((arg) => arg.startsWith('--acp-port='))?.split('=')[1];
  const acpHttp = process.argv.includes('--acp-http');

  (async () => {
    try {
      const { startACPHost } = await import('../lib/acp/host.js');
      await startACPHost({
        stdio: !acpHttp,
        http: acpHttp,
        port: acpPort ? parseInt(acpPort, 10) : 3002,
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
  console.log(
    formatWarning(
      `Update available! ${notifier.update.current} → ${notifier.update.latest}\n` +
        `Run ${chalk.cyan('npm install -g ultra-dex')} to update`
    )
  );
}

import { banner, registerBannerCommand } from '../lib/commands/banner.js';
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
import {
  registerAlignCommand,
  registerPreCommitCommand,
  registerStateCommand,
} from '../lib/commands/state.js';
import { registerStatusCommand } from '../lib/commands/status.js';
import { registerDoctorCommand } from '../lib/commands/doctor.js';

import { registerDashboardCommand } from '../lib/commands/dashboard.js';
import { registerCheckCommand } from '../lib/commands/check.js';
import { registerBatchCommand, registerPipelineCommand } from '../lib/commands/advanced.js';
import { registerServeCommand } from '../lib/commands/serve.js';
import { registerVerifyCommand } from '../lib/commands/verify.js';
import { registerQualityCommand } from '../lib/commands/quality-enhanced.js';
import { registerPluginCommand } from '../lib/commands/plugin.js';
import { registerMarketplaceCommand } from '../lib/commands/marketplace.js';
import { registerWorkspaceCommand } from '../lib/commands/workspace.js';
import { registerVoiceCommand } from '../lib/commands/voice.js';
import { registerAuthCommand } from '../lib/commands/auth.js';
import { registerAuthSsoCommand } from '../lib/commands/auth-sso.js';
import { registerSetupCommand } from '../lib/commands/setup.js';
import { registerForgeCommand } from '../lib/commands/forge.js';
import { registerHelpCommand } from '../lib/commands/help.js';
import { registerCostEstimatorCommand } from '../lib/ops/cost-estimator.js';
import { registerDataGovernanceCommand } from '../lib/governance/data-policy.js';
import { registerRiskCommand } from '../lib/commands/risk.js';
import { registerRollbackCommand } from '../lib/commands/rollback.js';
import { registerTelemetryCommand } from '../lib/commands/telemetry.js';
import { registerCleanCommand } from '../lib/commands/clean.js';
import { registerBenchmarkCommand } from '../lib/commands/benchmark.js';
import { registerTestCommand } from '../lib/commands/test.js';
import { registerVersionCheckCommand } from '../lib/commands/version-check.js';

// v3.0 Commands
import { registerSwarmCommand } from '../lib/commands/swarm.js';
import { registerWatchCommand } from '../lib/commands/watch.js';
import { registerDiffCommand } from '../lib/commands/diff.js';
import { registerExportCommand } from '../lib/commands/export.js';
import { registerUpgradeCommand } from '../lib/commands/upgrade.js';
import { registerConfigCommand } from '../lib/commands/config.js';

import { registerRalphCommand } from '../lib/commands/ralph.js';
import { registerWorkflowCommand } from '../lib/commands/workflows.js';
import { registerPlanCommand } from '../lib/commands/plan.js';
import { registerSuggestCommand } from '../lib/commands/suggest.js';
import { registerValidateCommand } from '../lib/commands/validate.js';
import { registerFixCommand } from '../lib/commands/fix.js';
import { registerHooksCommand } from '../lib/commands/hooks.js';
import { registerFetchCommand } from '../lib/commands/fetch.js';
import { registerSyncCommand } from '../lib/commands/sync.js';
import { registerImportCommand } from '../lib/commands/import.js';
import { registerTeamCommand } from '../lib/commands/team.js';
import { registerMemoryCommand } from '../lib/commands/memory.js';
import { registerGateCommand } from '../lib/commands/gate.js';
import { registerLedgerCommand } from '../lib/commands/ledger.js';
import { registerGovernanceCommand } from '../lib/commands/governance.js';
import { registerJiraCommand } from '../lib/commands/jira.js';
import { registerNotionCommand } from '../lib/commands/notion.js';
import { registerTrelloCommand } from '../lib/commands/trello.js';
import { registerSessionCommand } from '../lib/commands/session.js';
import { registerMcpRemoteCommand } from '../lib/commands/mcp-remote.js';
import { registerMcpHostCommand } from '../lib/commands/mcp-host.js';
import { registerBotCommand } from '../lib/commands/bot.js';
import { registerBudgetCommand } from '../lib/commands/budget.js';
import { registerDocsCommand } from '../lib/commands/docs.js';
import { registerBrowseCommand } from '../lib/commands/browse.js';
import { registerChromeAgentCommand } from '../lib/commands/chrome-agent.js';
import { registerNeuroPlanCommand } from '../lib/commands/neuro-plan.js';
import { registerVibeCommand } from '../lib/commands/vibe.js';
import { registerBackgroundAgentCommand } from '../lib/commands/background-agent.js';
import { registerDaemonCommand } from '../lib/commands/daemon.js';
import { registerRealityCheckCommand } from '../lib/commands/reality-check.js';
import { registerCompareCommand } from '../lib/commands/compare.js';
import { registerSecurityCommand } from '../lib/commands/security.js';
import { registerCredentialsCommand } from '../lib/commands/credentials.js';
import { registerPluginScanCommand } from '../lib/commands/plugin-scan.js';
import { registerPrivacyCommand } from '../lib/commands/privacy.js';
import { registerRouteCommand } from '../lib/commands/route.js';
import { registerCommitCommand } from '../lib/commands/commit.js';
import { registerRulesCommand } from '../lib/commands/rules.js';
import { registerCICDCommand } from '../lib/commands/cicd.js';
import { registerArchitectCommand } from '../lib/commands/architect.js';
import { registerTemplateCommand } from '../lib/commands/template.js';
import { registerDbAdvisorCommand } from '../lib/commands/db-advisor.js';
import { registerAiAdvisorCommand } from '../lib/commands/ai-advisor.js';
import { registerOnboardCommand } from '../lib/commands/onboard.js';
import { registerProductionReadyCommand } from '../lib/commands/production-ready.js';
import { registerDockerCommand } from '../lib/commands/docker.js';
import { registerK8sCommand } from '../lib/commands/k8s.js';
import { registerEnvCommand } from '../lib/commands/env.js';
import { registerMonitorCommand } from '../lib/commands/monitor.js';
import { registerInstallCompletionCommand } from '../lib/commands/install-completion.js';
import { registerProfileCommand } from '../lib/commands/profile.js';
import { registerPerfCommand } from '../lib/commands/perf.js';
import { registerDrCheckCommand } from '../lib/commands/dr-check.js';
import { registerSnapCommand } from '../lib/commands/snap.js';
import { registerChallengeCommand } from '../lib/commands/challenge.js';
import { registerScaffoldCommand } from '../lib/commands/scaffold.js';
import { registerScaffoldPlanCommand } from '../lib/commands/scaffold-plan.js';
import { registerDeployCommand } from '../lib/commands/deploy.js';
import { registerTemplatesCommand } from '../lib/commands/templates.js';
import { registerBillingCommands } from '../lib/commerce/billing.js';
// import { registerBudgetCommands } from '../lib/commerce/budget.js'; // Handled via registerBudgetCommand to avoid duplicate wiring
import { registerUsageCommands } from '../lib/commerce/usage.js';
import { registerAlertCommands } from '../lib/commerce/alerts.js';
import { registerRemoteClientCommand } from '../lib/mcp/remote/client.js';
import { registerSandboxCommand } from '../lib/sandbox/docker.js';
import {
  registerSystemConfigCommand,
  registerMetricsCommand,
  registerHealthCommand,
  registerDebugCommand,
} from '../lib/commands/monitoring.js';
import { registerBrainCommand } from '../lib/commands/brain.js';
import { registerEstimateCommand } from '../lib/commands/estimate.js';
import { registerUndoCommand } from '../lib/commands/undo.js';
import { startACPHost } from '../lib/acp/host.js';
import {
  createEnhancedHelp,
  formatHelpSection,
  formatUsage,
  formatDescription,
  formatOptions,
} from '../lib/utils/help.js';

// v3.4.3 Commands - 2026 Competitive Features
import { registerBrowserCommand } from '../lib/commands/browser.js';
import { registerExecCommand } from '../lib/commands/exec.js';
import { registerGitHubCommand } from '../lib/commands/github.js';
import { registerSearchCommand } from '../lib/commands/search.js';
import { registerVectorSearchCommand } from '../lib/commands/vector-search.js';
import { registerImpactCommand } from '../lib/commands/impact.js';
import { registerGraphCommand } from '../lib/commands/graph.js';
import { registerCloudCommand } from '../lib/commands/cloud.js';
import { registerApiCommand } from '../lib/commands/api.js';
import { registerAutonomousCommand } from '../lib/commands/autonomous.js';
import { registerPTYCommands } from '../lib/commands/pty.js';
import { registerIdeCommand } from '../lib/commands/ide.js';
import { registerMobileCommand } from '../lib/commands/mobile.js';
import { registerSSOCommand } from '../lib/commands/sso.js';
import { registerWhiteLabelCommand } from '../lib/commands/white-label.js';
import { startREPL } from '../lib/repl/index.js';
import { theme, ultraGradient } from '../lib/ui/theme.js';

const program = new Command();

let commandStart = null;
program.hook('preAction', (thisCommand, actionCommand) => {
  commandStart = Date.now();
  let user = null;
  try {
    user = configManager.get('user', null);
  } catch {
    user = null;
  }
  if (isTelemetryEnabledSync()) {
    recordUsageEventSync({
      stage: 'start',
      command: actionCommand?.name?.(),
      args: process.argv.slice(2),
      user: null,
      role: null,
      cwd: process.cwd(),
      pid: process.pid,
    });
  }
});

program.hook('postAction', (thisCommand, actionCommand) => {
  const durationMs = commandStart ? Date.now() - commandStart : null;
  if (isTelemetryEnabledSync()) {
    recordUsageEventSync({
      stage: 'end',
      command: actionCommand?.name?.(),
      durationMs,
      success: true,
      cwd: process.cwd(),
    });
  }
  commandStart = null;
});

// Custom Help Configuration - Professional Purple Edition
program.configureHelp({
  formatHelp: (cmd, _helper) => {
    // For subcommands, build command-specific help
    if (cmd.parent) {
      const commandData = {
        name: cmd.name(),
        description: cmd.description(),
        options: cmd.options,
        examples: cmd._examples || [],
        tips: cmd._tips || [],
        troubleshooting: cmd._troubleshooting || [],
      };

      return createEnhancedHelp(commandData);
    }

    const gradientBanner = ultraGradient(banner);

    let output = `\n${gradientBanner}\n\n`;
    output += `  ${theme.subtitle('AI Orchestration Meta-Layer for SaaS Development')}\n`;
    output += `  ${theme.dim('Version: ' + VERSION)}\n\n`;

    output += `  ${theme.title('USAGE')}\n`;
    output += `    ${theme.primary('ultra-dex')} ${theme.warning('[command]')} ${theme.dim('[options]')}\n\n`;

    output += `  ${theme.title('COMMANDS')}\n`;

    // Sort and format commands
    const commands = cmd.commands
      .map((c) => {
        return `    ${theme.accent(c.name().padEnd(20))} ${theme.dim(c.description())}`;
      })
      .sort()
      .join('\n');

    output += commands + '\n\n';

    output += `  ${theme.title('OPTIONS')}\n`;
    output += `    ${theme.primary('-V, --version').padEnd(20)} ${theme.dim('output the version number')}\n`;
    output += `    ${theme.primary('-h, --help').padEnd(20)} ${theme.dim('display help for command')}\n`;
    output += `    ${theme.primary('--acp').padEnd(20)} ${theme.dim('start ACP (Agent Client Protocol) host')}\n\n`;

    output += `  ${theme.dim('─────────────────────────────────────────────────────────')}\n`;
    output += `  ${theme.subtitle('Run ultra-dex without arguments to launch the Interactive Dashboard')}\n\n`;

    return output;
  },
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
registerSwarmCommand(program);
registerWatchCommand(program);
registerDiffCommand(program);
registerExportCommand(program);
registerUpgradeCommand(program);

program
  .command('repl')
  .description('Start the Ultra-Dex interactive REPL')
  .option('--continue', 'Resume the most recent REPL session')
  .action(async (options) => {
    await startREPL({ continue: options.continue });
  });

registerConfigCommand(program);

registerAutoImplementCommand(program);
registerCiMonitorCommand(program);
registerAlignCommand(program);
registerStatusCommand(program);
registerPreCommitCommand(program);
registerStateCommand(program);
registerDoctorCommand(program);
registerDashboardCommand(program);
registerCheckCommand(program);
registerQualityCommand(program);
registerServeCommand(program);
registerVerifyCommand(program);
registerPackCommand(program);
registerWorkflowCommand(program);
registerPlanCommand(program);
registerGitHubCommand(program);
registerBrainCommand(program);
registerSuggestCommand(program);
registerValidateCommand(program);
registerFixCommand(program);
registerHooksCommand(program);
registerFetchCommand(program);
registerSyncCommand(program);
registerImportCommand(program);
registerTeamCommand(program);
registerMemoryCommand(program);
registerGateCommand(program);
registerLedgerCommand(program);
registerGovernanceCommand(program);
registerJiraCommand(program);
registerNotionCommand(program);
registerTrelloCommand(program);
registerSessionCommand(program);
registerMcpRemoteCommand(program);
registerMcpHostCommand(program);
registerBotCommand(program);
registerBudgetCommand(program);
registerDocsCommand(program);
registerSearchCommand(program);
registerVectorSearchCommand(program);
registerBrowseCommand(program);
registerBrowserCommand(program);
registerChromeAgentCommand(program);
registerNeuroPlanCommand(program);
registerVibeCommand(program);
registerBackgroundAgentCommand(program);
registerDaemonCommand(program);
registerRealityCheckCommand(program);
registerCompareCommand(program);
registerSecurityCommand(program);
registerCredentialsCommand(program);
registerPluginScanCommand(program);
registerPrivacyCommand(program);
registerRouteCommand(program);
registerCommitCommand(program);
registerRulesCommand(program);
registerCICDCommand(program);
registerArchitectCommand(program);
registerTemplateCommand(program);
registerDbAdvisorCommand(program);
registerAiAdvisorCommand(program);
registerOnboardCommand(program);
registerProductionReadyCommand(program);
registerDockerCommand(program);
registerK8sCommand(program);
registerEnvCommand(program);
registerMonitorCommand(program);
registerInstallCompletionCommand(program);
registerProfileCommand(program);
registerPerfCommand(program);
registerDrCheckCommand(program);
registerSnapCommand(program);
registerChallengeCommand(program);
registerScaffoldCommand(program);
registerScaffoldPlanCommand(program);
registerDeployCommand(program);
registerTemplatesCommand(program);
registerBillingCommands(program);
// registerBudgetCommands(program); // Handled via registerBudgetCommand; keep disabled to avoid duplicate wiring
registerUsageCommands(program);
registerAlertCommands(program);
registerRemoteClientCommand(program);
registerSandboxCommand(program);
registerPluginCommand(program);
registerMarketplaceCommand(program);
registerVoiceCommand(program);
import { registerGhostCommand } from '../lib/commands/ghost.js';
registerGhostCommand(program);
import { registerNexusCommand } from '../lib/commands/nexus.js';
registerNexusCommand(program);
import { registerVaultCommand } from '../lib/commands/vault.js';
registerVaultCommand(program);

// v5.1 Cognitive Core Commands
import swarmP2PCommand from '../lib/commands/swarm-p2p.js';
if (!program.commands.some((cmd) => cmd.name() === swarmP2PCommand.name())) {
  program.addCommand(swarmP2PCommand);
}
registerAuthCommand(program);
import { registerThinkCommand } from '../lib/commands/think.js';
registerThinkCommand(program);
import { registerPredictCommand } from '../lib/commands/predict.js';
registerPredictCommand(program);
registerAuthSsoCommand(program);
registerSetupCommand(program);
registerIdeCommand(program);
registerMobileCommand(program);
registerSSOCommand(program);
registerWhiteLabelCommand(program);
registerForgeCommand(program);
registerHelpCommand(program);
registerCostEstimatorCommand(program);
registerRiskCommand(program);
registerRollbackCommand(program);
registerTelemetryCommand(program);
registerCleanCommand(program);
registerBenchmarkCommand(program);
registerTestCommand(program);
registerVersionCheckCommand(program);

// Monitoring commands (v3.4.3) - note: status uses state.js, sys-config uses monitoring.js
registerSystemConfigCommand(program);
registerMetricsCommand(program);
registerHealthCommand(program);
registerDebugCommand(program);
registerBannerCommand(program);

// Default to REPL if no arguments provided
if (process.argv.length <= 2) {
  await startREPL({ continue: false });
  process.exit(0);
}

await program.parseAsync(process.argv);

const LONG_RUNNING = new Set([
  'serve',
  'watch',
  'daemon',
  'cloud',
  'ci-monitor',
  'repl',
  'dashboard',
]);
const isLongRunning = process.argv.some((arg) => LONG_RUNNING.has(arg));

if (!wantsHelp && !isLongRunning) {
  await monitoring.shutdown();
  process.exit(process.exitCode ?? 0);
}
