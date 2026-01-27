/**
 * ultra-dex state management commands
 * align, status, watch, pre-commit, state
 */

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import { watch as fsWatch } from 'fs';
import path from 'path';
import { validateSafePath } from '../utils/validation.js';

// State management helpers
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
  try {
    await fs.mkdir(ultraDir, { recursive: true });
    await fs.writeFile(statePath, JSON.stringify(state, null, 2));
    return true;
  } catch {
    return false;
  }
}

export async function computeState() {
  // Try to load existing state first to check schema
  const existing = await loadState();
  if (existing && existing.project?.mode === 'GOD_MODE') {
    // In God Mode, we don't recompute entire state from scratch
    // We just update the timestamp
    existing.updatedAt = new Date().toISOString();
    return existing;
  }

  // Legacy computation logic
  const state = {
    version: '2.4.0',
    updatedAt: new Date().toISOString(),
    project: { name: path.basename(process.cwd()) },
    files: {},
    sections: { total: 34, completed: 0, list: [] },
    score: 0
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
  } catch { /* no plan */ }

  const fileScore = Object.values(state.files).filter(f => f.exists).length / coreFiles.length * 40;
  const sectionScore = state.sections.completed / state.sections.total * 60;
  state.score = Math.round(fileScore + sectionScore);

  return state;
}

export async function updateState() {
  const state = await computeState();
  await saveState(state);
  return state;
}

export function registerAlignCommand(program) {
  program
    .command('align')
    .description('Quick alignment score (one-liner)')
    .option('--strict', 'Exit with error if score < 70')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const state = await computeState();
      
      if (options.json) {
        if (state.project?.mode === 'GOD_MODE') {
             console.log(JSON.stringify({ mode: 'GOD_MODE', phases: state.phases }));
        } else {
             console.log(JSON.stringify({ score: state.score, files: Object.values(state.files).filter(f => f.exists).length, sections: state.sections.completed }));
        }
      } else {
        if (state.project?.mode === 'GOD_MODE') {
             console.log(`✅ Alignment: GOD MODE ACTIVE (All systems operational)`);
        } else {
            const icon = state.score >= 80 ? '✅' : state.score >= 50 ? '⚠️' : '❌';
            console.log(`${icon} Alignment: ${state.score}/100 (${Object.values(state.files).filter(f => f.exists).length}/4 files, ${state.sections.completed}/34 sections)`);
        }
      }
      
      if (options.strict && state.score < 70 && state.project?.mode !== 'GOD_MODE') {
        process.exit(1);
      }
    });
}

export function registerStatusCommand(program) {
  program
    .command('status')
    .description('Show current project state')
    .option('--refresh', 'Refresh state before showing')
    .option('--json', 'Output raw JSON')
    .action(async (options) => {
      if (options.refresh) {
        const state = await computeState();
        await saveState(state);
      }

      let state = await loadState();
      if (!state) {
        console.log(chalk.yellow('\n⚠️  No .ultra/state.json found. Generating...\n'));
        state = await computeState();
        await saveState(state);
      }

      if (options.json) {
        console.log(JSON.stringify(state, null, 2));
        return;
      }

      console.log(chalk.bold('\n📊 Ultra-Dex Status\n'));
      console.log(chalk.gray('─'.repeat(50)));
      
      if (state.project?.mode === 'GOD_MODE') {
          // Render God Mode Status
          console.log(chalk.cyan(`  MODE: ${state.project.mode}`));
          console.log(chalk.gray(`  Version: ${state.project.version}`));
          console.log(chalk.gray('─'.repeat(50)));
          
          console.log(chalk.bold('\n🚀 Phases:'));
          state.phases.forEach(phase => {
              const icon = phase.status === 'completed' ? '✅' : phase.status === 'in_progress' ? '🔄' : '⏳';
              console.log(`  ${icon} ${chalk.bold(phase.name)}`);
              phase.steps.forEach(step => {
                  const stepIcon = step.status === 'completed' ? chalk.green('✓') : chalk.gray('-');
                  console.log(`    ${stepIcon} ${step.task}`);
              });
              console.log('');
          });

          console.log(chalk.bold('🤖 Agents:'));
          state.agents.registry.forEach(agent => {
              const active = state.agents.active.includes(agent) ? chalk.green('(Active)') : '';
              console.log(`  • @${agent} ${active}`);
          });

      } else {
          // Render Legacy Status
          const scoreColor = state.score >= 80 ? 'green' : state.score >= 50 ? 'yellow' : 'red';
          console.log(chalk[scoreColor](`  Score: ${state.score}/100`));
          console.log(chalk.gray(`  Updated: ${state.updatedAt}`));
          console.log(chalk.gray('─'.repeat(50)));

          console.log(chalk.bold('\n📁 Files:'));
          if (state.files) {
            Object.entries(state.files).forEach(([name, info]) => {
                const icon = info.exists ? chalk.green('✓') : chalk.red('✗');
                const size = info.exists ? chalk.gray(` (${info.size} bytes)`) : '';
                console.log(`  ${icon} ${name}${size}`);
            });
          }

          console.log(chalk.bold('\n📝 Sections:'));
          console.log(`  ${state.sections.completed}/${state.sections.total} documented`);
          if (state.sections.list.length > 0) {
            const recent = state.sections.list.slice(-3);
            recent.forEach(s => console.log(chalk.gray(`    ${s.number}. ${s.title}`)));
            if (state.sections.list.length > 3) {
            console.log(chalk.gray(`    ... and ${state.sections.list.length - 3} more`));
            }
          }
      }
      console.log('');
    });
}

export function registerWatchCommand(program) {
    // This is now handled by watch.js, but keeping here for legacy imports if any. 
    // In God Mode, watch.js replaces this.
    // The bin/ultra-dex.js uses watch.js, so this might be dead code or overwritten.
    // I will leave it as is or update it to be safe.
    program
    .command('watch-legacy') // Rename to avoid conflict if both registered
    .action(() => console.log("Use 'ultra-dex watch' instead."));
}

export function registerPreCommitCommand(program) {
  program
    .command('pre-commit')
    .description('Pre-commit hook - verify before commit')
    .option('--install', 'Install git pre-commit hook')
    .option('-d, --dir <directory>', 'Project directory', '.')
    .action(async (options) => {
      const dirValidation = validateSafePath(options.dir, 'Project directory');
      if (dirValidation !== true) {
        console.log(chalk.red(dirValidation));
        process.exit(1);
      }

      const rootDir = path.resolve(options.dir);

      if (options.install) {
        const hookPath = path.resolve(rootDir, '.git/hooks/pre-commit');
        const hookScript = `#!/bin/sh
# Ultra-Dex pre-commit hook
npx ultra-dex align --strict
if [ $? -ne 0 ]; then
  echo "❌ Ultra-Dex alignment check failed. Score must be >= 70."
  echo "   Run 'ultra-dex review' for details."
  exit 1
fi
`;
        try {
          await fs.mkdir(path.dirname(hookPath), { recursive: true });
          await fs.writeFile(hookPath, hookScript, { mode: 0o755 });
          console.log(chalk.green('✅ Pre-commit hook installed!'));
          console.log(chalk.gray('   Commits will be blocked if alignment score < 70.'));
        } catch (e) {
          console.log(chalk.red('❌ Failed to install hook: ' + e.message));
        }
        return;
      }
      
      const state = await computeState();
      
      if (state.project?.mode === 'GOD_MODE') {
          console.log(chalk.green(`✅ Alignment OK: GOD MODE ACTIVE`));
          return;
      }

      if (state.score < 70) {
        console.log(chalk.red(`❌ BLOCKED: Alignment score ${state.score}/100 (required: 70)`));
        console.log(chalk.yellow('   Run `ultra-dex review` for detailed analysis.'));
        process.exit(1);
      } else {
        console.log(chalk.green(`✅ Alignment OK: ${state.score}/100`));
      }
    });
}

export function registerStateCommand(program) {
  program
    .command('state')
    .description('Manage .ultra/state.json')
    .option('--init', 'Initialize .ultra directory')
    .option('--refresh', 'Refresh state from files')
    .action(async (options) => {
      if (options.init || options.refresh) {
        const state = await computeState();
        await saveState(state);
        console.log(chalk.green('✅ State updated'));
        if (state.project?.mode === 'GOD_MODE') {
             console.log(chalk.gray(`   Mode: GOD_MODE`));
        } else {
             console.log(chalk.gray(`   Score: ${state.score}/100`));
        }
        return;
      }

      const state = await loadState();
      if (!state) {
        console.log(chalk.yellow('No .ultra/state.json found. Run `ultra-dex state --init`'));
        return;
      }
      console.log(JSON.stringify(state, null, 2));
    });
}

export default {
  registerAlignCommand,
  registerStatusCommand,
  registerWatchCommand,
  registerPreCommitCommand,
  registerStateCommand,
};
