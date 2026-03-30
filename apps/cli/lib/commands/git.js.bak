import chalk from 'chalk';
import { promisify } from 'node:util';
import { execFile as _execFile } from 'node:child_process';

const execFile = promisify(_execFile);

async function runGit(args, options = {}) {
  const { stdout } = await execFile('git', args, {
    cwd: options.cwd || process.cwd(),
    maxBuffer: 8 * 1024 * 1024,
  });
  return stdout.trim();
}

async function isGitRepo(cwd = process.cwd()) {
  try {
    await runGit(['rev-parse', '--is-inside-work-tree'], { cwd });
    return true;
  } catch {
    return false;
  }
}

function inferCommitType(files) {
  if (files.some((file) => file.includes('test') || file.endsWith('.test.js') || file.endsWith('.spec.js'))) {
    return 'test';
  }
  if (files.some((file) => file.includes('docs') || file.endsWith('.md'))) {
    return 'docs';
  }
  if (files.some((file) => file.includes('workflow') || file.includes('.github/'))) {
    return 'ci';
  }
  if (files.some((file) => file.includes('eslint') || file.includes('prettier') || file.includes('tsconfig'))) {
    return 'chore';
  }
  if (files.some((file) => file.includes('fix') || file.includes('bug'))) {
    return 'fix';
  }
  return 'feat';
}

function summarizeScope(files) {
  if (files.length === 0) return 'core';
  const first = files[0];
  if (first.startsWith('apps/dashboard/')) return 'dashboard';
  if (first.startsWith('apps/cli/')) return 'cli';
  if (first.startsWith('apps/core-api/')) return 'api';
  if (first.startsWith('docs/')) return 'docs';
  if (first.startsWith('.github/')) return 'ci';
  const top = first.split('/')[0] || 'core';
  return top.replace(/[^a-zA-Z0-9_-]/g, '') || 'core';
}

async function getStagedFiles(cwd = process.cwd()) {
  const output = await runGit(['diff', '--cached', '--name-only'], { cwd });
  return output ? output.split('\n').map((line) => line.trim()).filter(Boolean) : [];
}

async function getMergedBranches(cwd = process.cwd()) {
  const output = await runGit(['branch', '--merged'], { cwd });
  return output
    .split('\n')
    .map((line) => line.replace('*', '').trim())
    .filter(Boolean)
    .filter((branch) => !['main', 'master', 'develop', 'dev'].includes(branch));
}

async function getCurrentBranch(cwd = process.cwd()) {
  return runGit(['branch', '--show-current'], { cwd });
}

function formatJsonOrTable(data, asJson) {
  if (asJson) {
    logger.log(JSON.stringify(data, null, 2));
    return;
  }

  for (const [key, value] of Object.entries(data)) {
    logger.log(`${chalk.gray(key.padEnd(20))} ${chalk.white(String(value))}`);
  }
}

async function runAnalyze(options) {
  const since = Number.parseInt(options.since ?? '30', 10);
  const sinceArg = Number.isFinite(since) ? `--since=${since}.days` : '--since=30.days';

  const [currentBranch, statusRaw, commitsRaw, contributorsRaw] = await Promise.all([
    getCurrentBranch(),
    runGit(['status', '--short']),
    runGit(['log', sinceArg, '--oneline']),
    runGit(['shortlog', '-sn', sinceArg, 'HEAD']),
  ]);

  const commits = commitsRaw ? commitsRaw.split('\n').filter(Boolean) : [];
  const contributors = contributorsRaw ? contributorsRaw.split('\n').filter(Boolean) : [];
  const statusLines = statusRaw ? statusRaw.split('\n').filter(Boolean) : [];

  const analysis = {
    branch: currentBranch,
    periodDays: since,
    commitCount: commits.length,
    changedFiles: statusLines.length,
    topContributors: contributors.slice(0, 5).join(' | ') || 'n/a',
    workingTreeClean: statusLines.length === 0,
  };

  formatJsonOrTable(analysis, Boolean(options.json));

  if (!options.json && commits.length > 0) {
    logger.log(chalk.cyan('\nRecent commits:'));
    commits.slice(0, 8).forEach((line) => logger.log(`  ${chalk.gray('•')} ${line}`));
  }
}

async function runSuggestCommit(options) {
  const stagedFiles = await getStagedFiles();
  if (stagedFiles.length === 0) {
    logger.log(chalk.yellow('No staged changes. Stage files first: git add <files>'));
    return;
  }

  const type = options.type || inferCommitType(stagedFiles);
  const scope = options.scope || summarizeScope(stagedFiles);
  const shortSummary = options.summary || `update ${scope} changes`;

  const conventional = `${type}(${scope}): ${shortSummary}`;
  logger.log(chalk.green(conventional));

  if (!options.quiet) {
    logger.log(chalk.cyan('\nStaged files used for suggestion:'));
    stagedFiles.slice(0, 20).forEach((file) => logger.log(`  ${chalk.gray('•')} ${file}`));
  }
}

async function runCleanupBranches(options) {
  const current = await getCurrentBranch();
  const merged = await getMergedBranches();
  const safeTargets = merged.filter((branch) => branch !== current);

  if (safeTargets.length === 0) {
    logger.log(chalk.green('No merged branches to clean.'));
    return;
  }

  logger.log(chalk.cyan('Merged branches eligible for cleanup:'));
  safeTargets.forEach((branch) => logger.log(`  ${chalk.gray('•')} ${branch}`));

  if (!options.apply) {
    logger.log(chalk.yellow('\nDry run mode. Re-run with --apply to delete local branches.'));
    return;
  }

  for (const branch of safeTargets) {
    await runGit(['branch', '-d', branch]);
  }

  logger.log(chalk.green(`Deleted ${safeTargets.length} merged branch(es).`));
}

async function runRelease(options) {
  const bump = options.bump || 'patch';
  const currentBranch = await getCurrentBranch();

  if (!['main', 'master', 'release'].some((name) => currentBranch === name) && !options.allowAnyBranch) {
    throw new Error(`Release command allowed only on main/master/release. Current: ${currentBranch}`);
  }

  const lastTag = await runGit(['describe', '--tags', '--abbrev=0']).catch(() => 'v0.0.0');
  const commitsRaw = await runGit(['log', `${lastTag}..HEAD`, '--oneline']);
  const commits = commitsRaw ? commitsRaw.split('\n').filter(Boolean) : [];

  logger.log(chalk.cyan(`Last tag: ${lastTag}`));
  logger.log(chalk.cyan(`Commits since ${lastTag}: ${commits.length}`));
  commits.slice(0, 20).forEach((line) => logger.log(`  ${chalk.gray('•')} ${line}`));

  if (!options.apply) {
    logger.log(
      chalk.yellow(
        `\nDry run mode. Re-run with --apply --tag vX.Y.Z to create a local release tag (${bump} bump suggested).`
      )
    );
    return;
  }

  if (!options.tag) {
    throw new Error('When using --apply, provide --tag (e.g. --tag v6.1.0).');
  }

  await runGit(['tag', options.tag]);
  logger.log(chalk.green(`Created local tag ${options.tag}. Push manually when ready: git push origin ${options.tag}`));
}

export function registerGitWorkflowCommand(program) {
  const git = program.command('git').description('Deep git workflow tools for Ultra-Dex');

  git
    .command('analyze')
    .description('Analyze repository activity and ownership signals')
    .option('--since <days>', 'Number of days to analyze', '30')
    .option('--json', 'Print machine-readable JSON output')
    .action(async (options) => {
      if (!(await isGitRepo())) {
        logger.error(chalk.red('Current directory is not a git repository.'));
        process.exitCode = 1;
        return;
      }
      await runAnalyze(options);
    });

  git
    .command('suggest-commit')
    .description('Suggest a conventional commit message from staged changes')
    .option('--type <type>', 'Override commit type (feat/fix/chore/docs/test/ci)')
    .option('--scope <scope>', 'Override commit scope')
    .option('--summary <summary>', 'Override commit summary')
    .option('--quiet', 'Only print the commit suggestion')
    .action(async (options) => {
      if (!(await isGitRepo())) {
        logger.error(chalk.red('Current directory is not a git repository.'));
        process.exitCode = 1;
        return;
      }
      await runSuggestCommit(options);
    });

  git
    .command('cleanup-branches')
    .description('Delete merged local branches safely')
    .option('--apply', 'Apply deletion (default is dry-run)')
    .action(async (options) => {
      if (!(await isGitRepo())) {
        logger.error(chalk.red('Current directory is not a git repository.'));
        process.exitCode = 1;
        return;
      }
      await runCleanupBranches(options);
    });

  git
    .command('release')
    .description('Prepare release changelog and optional local tag creation')
    .option('--bump <type>', 'Semantic bump hint (patch/minor/major)', 'patch')
    .option('--tag <tag>', 'Tag to create in apply mode (e.g. v6.1.0)')
    .option('--apply', 'Apply local tag creation')
    .option('--allow-any-branch', 'Skip branch guard for release command')
    .action(async (options) => {
      if (!(await isGitRepo())) {
        logger.error(chalk.red('Current directory is not a git repository.'));
        process.exitCode = 1;
        return;
      }

      try {
        await runRelease(options);
      } catch (error) {
        logger.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exitCode = 1;
      }
    });
}
