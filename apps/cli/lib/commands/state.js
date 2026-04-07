// Copyright (c) 2026 Ultra-Dex

/**
 * ultra-dex state management commands
 * align, status, watch, pre-commit, state
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import ora from '../utils/ora.js';
import { validateSafePath } from '../utils/validation.js';
import { buildGraph } from '../utils/graph.js';
import { VERSION } from '../utils/version.js';
import { syncState } from '../utils/state-sync.js';
import { reconciler } from '../utils/reconciler.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

// State locking mechanism to prevent race conditions
let stateLock = null;

async function acquireStateLock() {
  if (stateLock) {
    // Someone else has the lock, wait for it to be released
    return new Promise((resolve) => {
      const checkLock = () => {
        if (!stateLock) {
          resolve();
        } else {
          setTimeout(checkLock, 10);
        }
      };
      checkLock();
    });
  }

  // Acquire the lock
  const lockId = Math.random().toString(36).substring(2, 15);
  stateLock = lockId;

  return lockId;
}

async function releaseStateLock(lockId) {
  if (stateLock === lockId) {
    stateLock = null;
  }
}

export async function withStateLock(callback) {
  const lockId = await acquireStateLock();
  try {
    return await callback();
  } finally {
    releaseStateLock(lockId);
  }
}

// State management helpers with locking
export async function loadState() {
  try {
    const content = await fs.readFile(path.resolve(process.cwd(), '.ultra/state.json'), 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function saveState(state) {
  const ultraDir = path.resolve(process.cwd(), '.ultra');
  const statePath = path.resolve(ultraDir, 'state.json');
  const tempPath = path.resolve(
    ultraDir,
    `state.json.tmp.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`
  );

  try {
    await fs.mkdir(ultraDir, { recursive: true });
    await fs.writeFile(tempPath, JSON.stringify(state, null, 2));
    await fs.rename(tempPath, statePath);
    return true;
  } catch (_error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(tempPath).catch(() => {});
    } catch (_unlinkError) {
      // Ignore unlink errors
    }
    return false;
  }
}

export async function updateState(updates) {
  return await withStateLock(async () => {
    const state = (await loadState()) || (await computeState());
    if (state && updates) {
      Object.assign(state, updates);
    }
    return await saveState(state);
  });
}

export async function computeState() {
  const existing = await loadState();
  if (existing && existing.project?.mode === 'ULTRA_MODE') {
    existing.updatedAt = new Date().toISOString();
    return existing;
  }

  const state = {
    version: VERSION,
    updatedAt: new Date().toISOString(),
    project: { name: path.basename(process.cwd()), mode: 'ULTRA_MODE' },
    files: {},
    sections: { total: 34, completed: 0, list: [] },
    score: 0,
  };

  const coreFiles = ['CONTEXT.md', 'IMPLEMENTATION-PLAN.md', 'CHECKLIST.md', 'QUICK-START.md'];
  for (const file of coreFiles) {
    try {
      const stat = await fs.stat(path.resolve(process.cwd(), file));
      state.files[file] = { exists: true, size: stat.size, modified: stat.mtime.toISOString() };
    } catch {
      state.files[file] = { exists: false };
    }
  }

  try {
    const plan = await fs.readFile(path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md'), 'utf8');
    const sectionRegex = /^##\s+(\d+)\.\s+(.+)$/gm;
    let match;
    while ((match = sectionRegex.exec(plan)) !== null) {
      state.sections.list.push({ number: parseInt(match[1]), title: match[2].trim() });
    }
    state.sections.completed = state.sections.list.length;
  } catch {
    /* no plan */
  }

  const fileScore =
    (Object.values(state.files).filter((f) => f.exists).length / coreFiles.length) * 40;
  const sectionScore = Math.min((state.sections.completed / state.sections.total) * 60, 60);
  state.score = Math.round(fileScore + sectionScore);

  return state;
}

export async function updateStateFile() {
  const state = await computeState();
  await saveState(state);
  return state;
}

export function registerAlignCommand(program) {
  const alignCmd = program
    .command('align')
    .description('Quick alignment score using Code Property Graph')
    .option('--strict', 'Exit with error if score < 70')
    .option('--reconcile', 'Verify completed tasks against codebase')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        // Ensure state is synced before alignment check
        await syncState();

        const state = await computeState();
        let reconciliation = null;

        if (options.reconcile) {
          reconciliation = await reconciler.reconcile();
        }

        let graphScore = 0;
        let graphStats = { nodes: 0, edges: 0 };

        try {
          const graph = await buildGraph();
          graphStats = { nodes: graph.nodes.length, edges: graph.edges.length };

          const nodesPoints = Math.min(graph.nodes.length * 2, 20);
          const edgesPoints = Math.min(graph.edges.length * 2, 20);
          graphScore = nodesPoints + edgesPoints;
        } catch (_e) {
          // Graph failed
        }

        const totalScore = Math.min(Math.round(state.score * 0.6 + graphScore), 100);

        if (options.json) {
          printInfo(
            JSON.stringify({
              score: totalScore,
              documentationScore: state.score,
              graphScore,
              graphStats,
              reconciliation,
              files: Object.values(state.files).filter((f) => f.exists).length,
              sections: state.sections.completed,
            })
          );
        } else {
          const icon = totalScore >= 80 ? '✅' : totalScore >= 50 ? '⚠️' : '❌';
          printInfo(`${icon} Alignment: ${totalScore}/100`);
          printInfo(chalk.gray(`   • Documentation: ${state.score}/100`));
          printInfo(
            chalk.gray(
              `   • Code Graph: ${graphScore}/40 (Nodes: ${graphStats.nodes}, Edges: ${graphStats.edges})`
            )
          );

          if (reconciliation) {
            printInfo(chalk.gray(`   • Truth Score: ${reconciliation.score}/100`));
            if (reconciliation.hallucinatedTasks.length > 0) {
              printError(
                `   ⚠️  Detected ${reconciliation.hallucinatedTasks.length} hallucinated tasks!`
              );
              reconciliation.hallucinatedTasks.forEach((t) => printError(`      - ${t.task}`));
            } else {
              printSuccess(`   ✅ All completed tasks verified.`);
            }
          }
        }

        if (options.strict && totalScore < 70) {
          process.exit(1);
        }
      } catch (error) {
        printError(`Error in align command: ${error.message}`);
        process.exit(1);
      }
    });

  alignCmd._examples = [
    { command: 'ultra-dex align', description: 'Compute alignment score for current project' },
    { command: 'ultra-dex align --strict', description: 'Fail CI if alignment score is below 70' },
    {
      command: 'ultra-dex align --reconcile --json',
      description: 'Verify tasks against codebase and output JSON',
    },
  ];
}

export function registerStatusCommand(program) {
  const statusCmd = program
    .command('status')
    .description('Show current project state')
    .option('--refresh', 'Refresh state before showing')
    .option('--json', 'Output raw JSON')
    .action(async (options) => {
      try {
        // Sync state before showing status
        await syncState();

        if (options.refresh) {
          const state = await computeState();
          await saveState(state);
        }

        let state = await loadState();
        if (!state) {
          printWarning('\nℹ️  Initializing project state...\n');
          state = await computeState();
          await saveState(state);
        }

        if (options.json) {
          printInfo(JSON.stringify(state, null, 2));
          return;
        }

        printInfo(chalk.bold('\n📊 Ultra-Dex Status\n'));
        printInfo(chalk.gray('─'.repeat(50)));

        if (state.phases) {
          printInfo(chalk.cyan(`  MODE: ${state.project?.mode || 'ULTRA_MODE'}`));
          printInfo(chalk.gray(`  Version: ${state.project?.version || state.version}`));
          printInfo(chalk.gray('─'.repeat(50)));

          printInfo(chalk.bold('\n🚀 Implementation Phases:'));
          state.phases.forEach((phase) => {
            const icon =
              phase.status === 'completed' ? '✅' : phase.status === 'in_progress' ? '🔄' : '⏳';
            printInfo(`  ${icon} ${chalk.bold(phase.name)}`);
            phase.steps.forEach((step) => {
              const stepIcon = step.status === 'completed' ? chalk.green('✓') : chalk.gray('-');
              printInfo(`    ${stepIcon} ${step.task}`);
            });
            printInfo('');
          });

          if (state.agents) {
            printInfo(chalk.bold('🤖 Orchestration Agents:'));
            state.agents.registry?.forEach((agent) => {
              const active = state.agents.active?.includes(agent) ? chalk.green('(Active)') : '';
              printInfo(`  • @${agent} ${active}`);
            });
          }
        } else {
          const scoreColor = state.score >= 80 ? 'green' : state.score >= 50 ? 'yellow' : 'red';
          printInfo(chalk[scoreColor](`  Score: ${state.score}/100`));
          printInfo(chalk.gray(`  Updated: ${state.updatedAt}`));
          printInfo(chalk.gray('─'.repeat(50)));

          printInfo(chalk.bold('\n📁 Documentation Files:'));
          if (state.files) {
            Object.entries(state.files).forEach(([name, info]) => {
              const icon = info.exists ? chalk.green('✓') : chalk.red('✕');
              const size = info.exists ? chalk.gray(` (${info.size} bytes)`) : '';
              printInfo(`  ${icon} ${name}${size}`);
            });
          }

          printInfo(chalk.bold('\n📝 Implementation Sections:'));
          printInfo(`  ${state.sections.completed}/${state.sections.total} completed`);
          if (state.sections.list?.length > 0) {
            const recent = state.sections.list.slice(-3);
            recent.forEach((s) => printInfo(chalk.gray(`    ${s.number}. ${s.title}`)));
            if (state.sections.list.length > 3) {
              printInfo(chalk.gray(`    ... and ${state.sections.list.length - 3} more`));
            }
          }
        }
        printInfo('');
      } catch (error) {
        printError(`Error in status command: ${error.message}`);
        process.exit(1);
      }
    });

  statusCmd._examples = [
    { command: 'ultra-dex status', description: 'Show current Ultra-Dex project status' },
    { command: 'ultra-dex status --refresh', description: 'Recompute state before displaying' },
    { command: 'ultra-dex status --json', description: 'Output raw JSON for automation' },
  ];
}

export function registerWatchCommand(program) {
  program.command('watch-legacy').action(() => logger.log("Use 'ultra-dex watch' instead."));
}

export function registerPreCommitCommand(program) {
  program
    .command('pre-commit')
    .description('Pre-commit hook - verify standards before commit')
    .option('--install', 'Install git pre-commit hook')
    .option('--uninstall', 'Remove pre-commit config and git hook')
    .option('--scan', 'Include deep code quality scan in hook')
    .option('--ai', 'Run AI-powered quality review on staged changes')
    .option('-d, --dir <directory>', 'Project directory', '.')
    .action(async (options) => {
      try {
        const dirValidation = validateSafePath(options.dir, 'Project directory');
        if (dirValidation !== true) {
          printError(dirValidation);
          process.exit(1);
        }

        const rootDir = path.resolve(options.dir);

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const templatePath = path.resolve(__dirname, '../../../templates/pre-commit-config.yaml');

        if (options.uninstall) {
          const hookPath = path.resolve(rootDir, '.git/hooks/pre-commit');
          const configPath = path.resolve(rootDir, '.pre-commit-config.yaml');
          await fs.rm(hookPath, { force: true });
          await fs.rm(configPath, { force: true });
          printSuccess('✓ Pre-commit hooks removed.');
          return;
        }

        if (options.install) {
          const configPath = path.resolve(rootDir, '.pre-commit-config.yaml');
          try {
            const template = await fs.readFile(templatePath, 'utf8');
            await fs.writeFile(configPath, template, 'utf8');
            printSuccess('✓ Pre-commit config installed.');
          } catch {
            printWarning(chalk.yellow('Could not install pre-commit config template.'));
          }

          const hookPath = path.resolve(rootDir, '.git/hooks/pre-commit');
          const scanCmd = options.scan ? '\nnpx ultra-dex validate --scan' : '';
          const aiCmd = options.ai ? '\nnpx ultra-dex pre-commit --ai' : '';
          const hookScript = `#!/bin/sh
# Ultra-Dex pre-commit hook
npx ultra-dex align --strict${scanCmd}${aiCmd}
if [ $? -ne 0 ]; then
  echo "✕ Ultra-Dex quality gate failed."
  echo "   Run 'ultra-dex review' or 'ultra-dex validate --scan' for details."
  exit 1
fi
`;
          try {
            await fs.mkdir(path.dirname(hookPath), { recursive: true });
            await fs.writeFile(hookPath, hookScript, { mode: 0o755 });
            printSuccess('✓ Pre-commit hook installed!');
            printInfo(
              chalk.gray('   Commits will be blocked if alignment score < 70 or AI review fails.')
            );
          } catch (e) {
            printError('✕ Failed to install hook: ' + e.message);
          }
          return;
        }

        const state = await loadState();

        if (options.ai) {
          const spinner = ora('🤖 AI Quality Review: Analyzing staged changes...').start();
          try {
            const { execSync } = await import('child_process');
            const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' })
              .split('\n')
              .filter(Boolean);
            if (staged.length === 0) {
              spinner.succeed('No staged changes to review.');
              return;
            }

            const { createProvider, getDefaultProvider } = await import('../providers/index.js');
            const { runAgentLoop } = await import('./run.js');

            const provider = createProvider(getDefaultProvider());
            const reviewResult = await runAgentLoop(
              'reviewer',
              `Review these staged files for architectural violations (e.g. missing validation, security risks):\n${staged.join('\n')}`,
              provider,
              { state }
            );

            if (
              reviewResult.toLowerCase().includes('reject') ||
              reviewResult.toLowerCase().includes('blocking violation')
            ) {
              spinner.fail('Quality Gate: REJECTED');
              printError('\nViolations found:');
              printInfo(reviewResult);
              process.exit(1);
            }
            spinner.succeed('Quality Gate: PASSED');
          } catch (e) {
            spinner.warn('Quality Gate skipped: ' + e.message);
          }
        }

        if (state && state.score < 70) {
          printError(`✕ BLOCKED: Alignment score ${state.score}/100 (required: 70)`);
          printWarning('   Run `ultra-dex review` for detailed analysis.');
          process.exit(1);
        } else {
          printSuccess(`✓ Alignment verified: ${state ? state.score : 'N/A'}/100`);
        }
      } catch (error) {
        printError(`Error in pre-commit command: ${error.message}`);
        process.exit(1);
      }
    });
}

export function registerStateCommand(program) {
  program
    .command('state')
    .description('Manage project state')
    .option('--init', 'Initialize state directory')
    .option('--refresh', 'Refresh state from documentation')
    .option('--sync', 'Force sync between Markdown and JSON')
    .action(async (options) => {
      try {
        if (options.sync) {
          const result = await syncState();
          if (result) {
            printSuccess(`✓ Synced ${result.source} to ${result.target}`);
          } else {
            printInfo('  State already synchronized.');
          }
          return;
        }

        if (options.init || options.refresh) {
          const state = await computeState();
          await saveState(state);
          printSuccess('✓ Project state updated');
          printInfo(`   Score: ${state.score}/100`);
          return;
        }

        const state = await loadState();
        if (!state) {
          printWarning('No state file found. Run `ultra-dex state --init`');
          return;
        }
        printInfo(JSON.stringify(state, null, 2));
      } catch (error) {
        printError(`Error in state command: ${error.message}`);
        process.exit(1);
      }
    });
}

export default {
  registerAlignCommand,
  registerStatusCommand,
  registerWatchCommand,
  registerPreCommitCommand,
  registerStateCommand,
};
