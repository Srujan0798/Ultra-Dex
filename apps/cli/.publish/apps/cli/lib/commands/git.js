import { execFileSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

async function getGitInfo(cwd) {
  try {
    const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd,
      encoding: 'utf8',
      timeout: 5000,
    }).trim();

    const lastCommit = execFileSync('git', ['log', '-1', '--format=%h %s'], {
      cwd,
      encoding: 'utf8',
      timeout: 5000,
    }).trim();

    const status = execFileSync('git', ['status', '--porcelain'], {
      cwd,
      encoding: 'utf8',
      timeout: 5000,
    });

    return {
      branch,
      lastCommit,
      changedFiles: status.split('\n').filter(Boolean).length,
      isClean: status.trim() === '',
    };
  } catch {
    return {
      branch: 'unknown',
      lastCommit: 'N/A',
      changedFiles: 0,
      isClean: true,
    };
  }
}

async function syncGitContext(cwd, memoryPath) {
  const gitInfo = await getGitInfo(cwd);

  try {
    const memoryDir = path.dirname(memoryPath);
    await fs.mkdir(memoryDir, { recursive: true });

    const context = {
      type: 'git-context',
      timestamp: new Date().toISOString(),
      branch: gitInfo.branch,
      lastCommit: gitInfo.lastCommit,
      changedFiles: gitInfo.changedFiles,
      isClean: gitInfo.isClean,
    };

    await fs.appendFile(memoryPath, JSON.stringify(context) + '\n', 'utf8');

    return context;
  } catch (error) {
    return { error: error.message };
  }
}

async function getRepositoryRoot(cwd) {
  try {
    const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd,
      encoding: 'utf8',
      timeout: 5000,
    }).trim();
    return root;
  } catch {
    return cwd;
  }
}

async function analyzeGitHistory(cwd, since = 7) {
  try {
    const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd,
      encoding: 'utf8',
      timeout: 5000,
    }).trim();

    const commitCount = parseInt(
      execFileSync('git', ['rev-list', '--count', `--since=${since}.days.ago`, 'HEAD'], {
        cwd,
        encoding: 'utf8',
        timeout: 5000,
      }).trim() || '0'
    );

    const contributors = execFileSync(
      'git',
      ['shortlog', '-sn', `--since=${since}.days.ago`, 'HEAD'],
      {
        cwd,
        encoding: 'utf8',
        timeout: 5000,
      }
    )
      .trim()
      .split('\n')
      .filter(Boolean).length;

    return {
      branch,
      commitCount,
      contributors,
      periodDays: since,
    };
  } catch (error) {
    return {
      branch: 'unknown',
      commitCount: 0,
      contributors: 0,
      periodDays: since,
      error: error.message,
    };
  }
}

async function suggestCommitMessage(cwd, quiet = false) {
  try {
    const status = execFileSync('git', ['status', '--porcelain'], {
      cwd,
      encoding: 'utf8',
      timeout: 5000,
    });

    const files = status.split('\n').filter(Boolean);
    const staged = files.filter(
      (f) => f.startsWith('A ') || f.startsWith('M ') || f.startsWith('D ')
    );

    if (staged.length === 0) {
      return { message: null, reason: 'No staged files' };
    }

    const fileTypes = new Set();
    for (const file of staged) {
      const filename = file.slice(3);
      if (filename.includes('test')) fileTypes.add('test');
      else if (filename.includes('docs') || filename.endsWith('.md')) fileTypes.add('docs');
      else if (filename.startsWith('fix') || filename.includes('bug')) fileTypes.add('fix');
      else if (filename.startsWith('feat') || filename.includes('feature')) fileTypes.add('feat');
      else fileTypes.add('chore');
    }

    const type = fileTypes.has('feat')
      ? 'feat'
      : fileTypes.has('fix')
        ? 'fix'
        : fileTypes.has('test')
          ? 'test'
          : fileTypes.has('docs')
            ? 'docs'
            : 'chore';

    const scope =
      staged.length === 1 ? path.basename(staged[0].slice(3)).split('.')[0] : 'multiple';

    const message = `${type}(${scope}): update ${staged.length} file(s)`;

    if (!quiet) {
      console.log(message);
    }

    return { message, type, scope, files: staged.length };
  } catch (error) {
    return { message: null, error: error.message };
  }
}

async function cleanupBranches(cwd, dryRun = true) {
  try {
    const branches = execFileSync('git', ['branch', '--merged'], {
      cwd,
      encoding: 'utf8',
      timeout: 5000,
    })
      .trim()
      .split('\n')
      .map((b) => b.trim())
      .filter((b) => b && !b.startsWith('*'));

    if (dryRun) {
      return {
        dryRun: true,
        branchesToDelete: branches,
        count: branches.length,
      };
    }

    for (const branch of branches) {
      try {
        execFileSync('git', ['branch', '-d', branch], { cwd, timeout: 5000 });
      } catch {
        // Skip branches that can't be deleted
      }
    }

    return {
      dryRun: false,
      deleted: branches,
    };
  } catch (error) {
    return {
      branchesToDelete: [],
      error: error.message,
    };
  }
}

async function getReleaseInfo(cwd, dryRun = true) {
  try {
    let lastTag;
    try {
      lastTag = execFileSync('git', ['describe', '--tags', '--abbrev=0'], {
        cwd,
        encoding: 'utf8',
        timeout: 5000,
      }).trim();
    } catch {
      lastTag = 'v0.0.0';
    }

    let commitCount = 0;
    try {
      commitCount = parseInt(
        execFileSync('git', ['rev-list', '--count', `${lastTag}..HEAD`], {
          cwd,
          encoding: 'utf8',
          timeout: 5000,
        }).trim() || '0'
      );
    } catch {
      commitCount = 0;
    }

    if (!dryRun) {
      const version = lastTag.replace('v', '').split('.').map(Number);
      version[2] = (version[2] || 0) + 1;
      const newTag = `v${version.join('.')}`;
      execFileSync('git', ['tag', newTag], { cwd, timeout: 5000 });
      return { lastTag, newTag, commitCount, released: true };
    }

    return {
      dryRun: true,
      lastTag,
      commitsSince: commitCount,
    };
  } catch (error) {
    return {
      lastTag: 'v0.0.0',
      commitsSince: 0,
      error: error.message,
    };
  }
}

export function registerGitWorkflowCommand(program) {
  const gitCommand = program.command('git').description('Git workflow integration commands');

  gitCommand
    .command('info')
    .description('Show current git context')
    .option('-C, --cwd <path>', 'Working directory', process.cwd())
    .action(async (options) => {
      const info = await getGitInfo(options.cwd);
      console.log(JSON.stringify(info, null, 2));
    });

  gitCommand
    .command('sync')
    .description('Sync git context to memory')
    .option('-C, --cwd <path>', 'Working directory', process.cwd())
    .option(
      '-m, --memory <path>',
      'Memory file path',
      path.join(os.homedir(), '.ultra-dex', 'memory.jsonl')
    )
    .action(async (options) => {
      const result = await syncGitContext(options.cwd, options.memory);
      console.log(JSON.stringify(result, null, 2));
    });

  gitCommand
    .command('root')
    .description('Get repository root directory')
    .option('-C, --cwd <path>', 'Working directory', process.cwd())
    .action(async (options) => {
      const root = await getRepositoryRoot(options.cwd);
      console.log(root);
    });

  gitCommand
    .command('analyze')
    .description('Analyze git history')
    .option('-C, --cwd <path>', 'Working directory', process.cwd())
    .option('-s, --since <days>', 'Days to analyze', '7')
    .option('--json', 'Output as JSON', false)
    .action(async (options) => {
      const result = await analyzeGitHistory(options.cwd, parseInt(options.since));
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Branch: ${result.branch}`);
        console.log(`Commits in last ${result.periodDays} days: ${result.commitCount}`);
        console.log(`Contributors: ${result.contributors}`);
      }
    });

  gitCommand
    .command('suggest-commit')
    .description('Suggest conventional commit message')
    .option('-C, --cwd <path>', 'Working directory', process.cwd())
    .option('-q, --quiet', 'Only output the message', false)
    .action(async (options) => {
      const result = await suggestCommitMessage(options.cwd, options.quiet);
      if (!options.quiet) {
        if (result.message) {
          console.log('Suggested commit message:');
          console.log(result.message);
        } else {
          console.log(result.reason || 'Could not suggest message');
        }
      }
    });

  gitCommand
    .command('cleanup-branches')
    .description('Clean up merged branches')
    .option('-C, --cwd <path>', 'Working directory', process.cwd())
    .option('--dry-run', 'Show what would be deleted without deleting', true)
    .action(async (options) => {
      const result = await cleanupBranches(options.cwd, options.dryRun);
      if (result.dryRun) {
        console.log('Dry run mode - branches to delete:');
        result.branchesToDelete.forEach((b) => console.log(`  - ${b}`));
        console.log(`\nTotal: ${result.count} branches`);
      } else {
        console.log('Deleted branches:');
        result.deleted.forEach((b) => console.log(`  - ${b}`));
      }
    });

  gitCommand
    .command('release')
    .description('Release management')
    .option('-C, --cwd <path>', 'Working directory', process.cwd())
    .option('--dry-run', 'Show what would be released', true)
    .action(async (options) => {
      const result = await getReleaseInfo(options.cwd, options.dryRun);
      if (result.dryRun) {
        console.log(`Last tag: ${result.lastTag}`);
        console.log(`Commits since ${result.lastTag}: ${result.commitsSince}`);
        console.log('Dry run mode - use --no-dry-run to create tag');
      } else {
        console.log(`Created tag: ${result.newTag}`);
      }
    });

  return gitCommand;
}

export {
  getGitInfo,
  syncGitContext,
  getRepositoryRoot,
  analyzeGitHistory,
  suggestCommitMessage,
  cleanupBranches,
  getReleaseInfo,
};
