// Copyright (c) 2026 Ultra-Dex

/**
 * Git Hook Integration
 * Install and manage Git hooks with AI validation
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import inquirer from 'inquirer';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';


const execAsync = promisify(exec);

// Git hooks that we'll implement
const GIT_HOOKS = [
  'pre-commit',
  'pre-push',
  'commit-msg',
  'prepare-commit-msg',
  'post-commit',
  'post-checkout',
  'post-merge',
];

// Pre-commit hook template with AI validation
const PRE_COMMIT_HOOK = `#!/bin/sh
# Ultra-Dex AI-Powered Pre-Commit Hook
# Validates code quality before allowing commit

echo "🔍 Ultra-Dex Pre-Commit Validation..."

# Run Ultra-Dex verification
npx ultra-dex verify --quick

if [ $? -ne 0 ]; then
  echo "❌ Ultra-Dex verification failed. Commit blocked."
  exit 1
fi

# Check for sensitive data
echo "🔑 Scanning for sensitive data..."
if git diff --cached --name-only | xargs grep -l -i "password\\|secret\\|key\\|token" --include="*.js" --include="*.ts" --include="*.json" --include="*.env" --include="*.yml" --include="*.yaml" 2>/dev/null; then
  echo "❌ Sensitive data detected in files. Commit blocked."
  exit 1
fi

# Check for TO_DO comments in changed files
echo "📝 Checking for TO_DO comments..."
TODO_COUNT=$(git diff --cached --name-only | xargs grep -n "TO_DO\\|FIXME\\|BUG" 2>/dev/null | wc -l)

if [ $TODO_COUNT -gt 0 ]; then
  echo "⚠️  Found $TODO_COUNT TO_DO/FIXME/BUG comments in staged files."
  echo "💡 Consider addressing these before committing."
  read -p "Continue with commit anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Run linter on staged files
echo "🧹 Running linter on staged files..."
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -E "\\.js$|\\.ts$|\\.jsx$|\\.tsx$" || true)

if [ -n "$STAGED_FILES" ]; then
  echo "$STAGED_FILES" | xargs npx eslint --fix 2>/dev/null || true
  git add $STAGED_FILES  # Add any auto-fixes
fi

echo "✅ Pre-commit validation passed!"
exit 0
`;

// Pre-push hook template
const PRE_PUSH_HOOK = `#!/bin/sh
# Ultra-Dex AI-Powered Pre-Push Hook
# Validates code before allowing push

echo "🚀 Ultra-Dex Pre-Push Validation..."

# Get the remote name and URL
REMOTE="$1"
URL="$2"

# Run Ultra-Dex audit
npx ultra-dex audit --quick

if [ $? -ne 0 ]; then
  echo "❌ Ultra-Dex audit failed. Push blocked."
  exit 1
fi

# Check branch name convention
BRANCH_NAME=$(git symbolic-ref --short HEAD)

if [ "$BRANCH_NAME" != "main" ] && [ "$BRANCH_NAME" != "master" ]; then
  # Check if branch follows conventional naming (feature/..., bugfix/..., etc.)
  if ! echo "$BRANCH_NAME" | grep -Eq "^(feature|bugfix|hotfix|release|chore)/"; then
    echo "⚠️  Branch name '$BRANCH_NAME' doesn't follow conventional pattern."
    echo "💡 Consider using: feature/..., bugfix/..., hotfix/..., release/..., chore/..."
    read -p "Continue with push anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi
fi

# Check for large files (>10MB)
echo "📦 Checking for large files..."
LARGE_FILES=$(git diff --name-only HEAD~1..HEAD | xargs -I {} sh -c 'if [ -f "{}" ] && [ $(stat -f%z "{}" 2>/dev/null || stat -c%s "{}" 2>/dev/null) -gt 10485760 ]; then echo "{}"; fi')

if [ -n "$LARGE_FILES" ]; then
  echo "❌ Found large files (>10MB):"
  echo "$LARGE_FILES"
  echo "💡 Consider using Git LFS for large files."
  exit 1
fi

echo "✅ Pre-push validation passed!"
exit 0
`;

// Commit message hook template
const COMMIT_MSG_HOOK = `#!/bin/sh
# Ultra-Dex AI-Powered Commit Message Hook
# Validates conventional commit format

echo "✍️  Ultra-Dex Commit Message Validation..."

COMMIT_MSG_FILE=$1

# Read the commit message
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Check if it follows conventional commit format
if ! echo "$COMMIT_MSG" | grep -Eq "^(feat|fix|docs|style|refactor|test|chore|build|ci|perf|revert|merge)(\\(\\w+\\))?: .+"; then
  echo "⚠️  Commit message doesn't follow conventional format:"
  echo "💡 Use format: <type>(<scope>): <description>"
  echo "   Example: feat(auth): add login validation"
  echo "   Types: feat, fix, docs, style, refactor, test, chore, build, ci, perf, revert, merge"
  echo ""
  echo "Current message:"
  echo "$COMMIT_MSG"
  exit 1
fi

# Check length
MSG_LENGTH=\${#COMMIT_MSG}
if [ $MSG_LENGTH -gt 72 ]; then
  echo "⚠️  Commit message is too long ($MSG_LENGTH characters, max 72)"
  exit 1
fi

echo "✅ Commit message validation passed!"
exit 0
`;

class GitHookManager {
  constructor(gitDir = null) {
    this.gitDir = gitDir || this.findGitDirectory();
    this.hooksDir = path.join(this.gitDir, 'hooks');
  }

  /**
   * Find the .git directory
   */
  findGitDirectory() {
    try {
      const { stdout } = execAsync('git rev-parse --git-dir');
      return path.resolve(stdout.trim());
    } catch (_error) {
      throw new Error('Not a git repository. Run this command from inside a git repository.');
    }
  }

  /**
   * Install all git hooks
   */
  async installHooks(options = {}) {
    printInfo(chalk.cyan('\n🔧 Installing Git hooks...\n'));

    // Check if it's a git repository
    try {
      await fs.access(this.gitDir);
    } catch (_error) {
      throw new Error('Not a git repository. Run this command from inside a git repository.');
    }

    // Create hooks directory if it doesn't exist
    await fs.mkdir(this.hooksDir, { recursive: true });

    // Install each hook
    const hooksToInstall = options.hooks || GIT_HOOKS;

    for (const hookName of hooksToInstall) {
      await this.installHook(hookName, options);
    }

    printSuccess(chalk.green(`✅ Installed ${hooksToInstall.length} Git hooks`));

    // Show post-installation instructions
    printInfo(chalk.gray('\nPost-installation notes:'));
    printInfo(chalk.gray('- Hooks will run automatically on the specified Git events'));
    printInfo(chalk.gray('- You can modify the hooks in .git/hooks/ directory'));
    printInfo(
      chalk.gray('- To bypass a hook: git commit --no-verify (not recommended in production)')
    );
  }

  /**
   * Install a specific git hook
   */
  async installHook(hookName, options = {}) {
    const hookPath = path.join(this.hooksDir, hookName);

    let hookContent;

    switch (hookName) {
      case 'pre-commit':
        hookContent = options.preCommitContent || PRE_COMMIT_HOOK;
        break;
      case 'pre-push':
        hookContent = options.prePushContent || PRE_PUSH_HOOK;
        break;
      case 'commit-msg':
        hookContent = options.commitMsgContent || COMMIT_MSG_HOOK;
        break;
      case 'prepare-commit-msg':
        hookContent = this.createPrepareCommitMsgHook(options);
        break;
      case 'post-commit':
        hookContent = this.createPostCommitHook(options);
        break;
      case 'post-checkout':
        hookContent = this.createPostCheckoutHook(options);
        break;
      case 'post-merge':
        hookContent = this.createPostMergeHook(options);
        break;
      default:
        printWarning(chalk.yellow(`⚠️  Hook ${hookName} not configured. Writing empty hook.`));
        hookContent = '#!/bin/sh\n# Empty hook implementation\nexit 0\n';
    }

    // Write the hook file
    await fs.writeFile(hookPath, hookContent, { mode: 0o755 }); // Make executable

    printInfo(chalk.gray(`  Installed: ${hookName}`));
  }

  /**
   * Create prepare-commit-msg hook
   */
  createPrepareCommitMsgHook(_options) {
    return `#!/bin/sh
# Ultra-Dex Prepare Commit Message Hook
# AI-assists with commit message generation

echo "🤖 Ultra-Dex preparing commit message..."

COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2
SHA1=$3

# Only auto-generate for regular commits (not merges, squashes, etc.)
if [ -z "$COMMIT_SOURCE" ] || [ "$COMMIT_SOURCE" = "message" ]; then
  # Get the diff of staged files
  DIFF_OUTPUT=$(git diff --cached --name-only --diff-filter=ACMR | head -n 5 | tr '\\n' ',' | sed 's/,$//')
  
  if [ -n "$DIFF_OUTPUT" ]; then
    echo "# Generated by Ultra-Dex AI Assistant" >> "$COMMIT_MSG_FILE"
    echo "# Files changed: $DIFF_OUTPUT" >> "$COMMIT_MSG_FILE"
    echo "" >> "$COMMIT_MSG_FILE"
    echo "# Example: feat(auth): add login validation" >> "$COMMIT_MSG_FILE"
    echo "# Types: feat, fix, docs, style, refactor, test, chore, build, ci, perf, revert, merge" >> "$COMMIT_MSG_FILE"
  fi
fi

exit 0
`;
  }

  /**
   * Create post-commit hook
   */
  createPostCommitHook(_options) {
    return `#!/bin/sh
# Ultra-Dex Post-Commit Hook
# Runs after successful commit

echo "✅ Commit successful!"

# Optionally run Ultra-Dex to update context
if command -v ultra-dex &> /dev/null; then
  echo "🔄 Updating project context..."
  ultra-dex context update --silent
fi

exit 0
`;
  }

  /**
   * Create post-checkout hook
   */
  createPostCheckoutHook(_options) {
    return `#!/bin/sh
# Ultra-Dex Post-Checkout Hook
# Runs after branch checkout

PREV_HEAD=$1
NEW_HEAD=$2
BRANCH_SWITCH=$3

if [ $BRANCH_SWITCH = 1 ]; then
  echo "🌿 Switched to branch: $(git branch --show-current)"
  
  # Optionally run Ultra-Dex to update context for new branch
  if command -v ultra-dex &> /dev/null; then
    echo "🔄 Updating context for new branch..."
    ultra-dex context update --silent
  fi
fi

exit 0
`;
  }

  /**
   * Create post-merge hook
   */
  createPostMergeHook(_options) {
    return `#!/bin/sh
# Ultra-Dex Post-Merge Hook
# Runs after successful merge

MERGE_RESULT=$1

echo "🔄 Post-merge operations..."

# Update project context after merge
if command -v ultra-dex &> /dev/null; then
  echo "🔄 Updating project context after merge..."
  ultra-dex context update --silent
fi

# Run quick verification after merge
echo "🔍 Running quick verification..."
ultra-dex verify --quick

exit 0
`;
  }

  /**
   * List installed hooks
   */
  async listHooks() {
    printInfo(chalk.cyan('\n📋 Installed Git Hooks:\n'));

    try {
      const files = await fs.readdir(this.hooksDir);
      const installedHooks = [];
      for (const file of files) {
        if (!GIT_HOOKS.includes(file)) continue;
        const stat = await fs.stat(path.join(this.hooksDir, file));
        if (stat.isFile()) installedHooks.push(file);
      }

      if (installedHooks.length === 0) {
        printInfo(chalk.gray('No Ultra-Dex hooks installed.'));
        return [];
      }

      for (const hook of installedHooks) {
        const hookPath = path.join(this.hooksDir, hook);
        const stat = await fs.stat(hookPath);
        const isExecutable = (stat.mode & 0o111) !== 0; // Check if executable

        const status = isExecutable ? chalk.green('✓') : chalk.yellow('⚠️');
        const execStatus = isExecutable
          ? chalk.green('executable')
          : chalk.yellow('not executable');

        printInfo(`${status} ${hook} (${execStatus})`);
      }

      return installedHooks;
    } catch (error) {
      printError(chalk.red(`Failed to list hooks: ${error.message}`));
      return [];
    }
  }

  /**
   * Remove git hooks
   */
  async removeHooks(hookNames = null) {
    printInfo(chalk.cyan('\n🗑️  Removing Git hooks...\n'));

    const hooksToRemove = hookNames || GIT_HOOKS;
    let removedCount = 0;

    for (const hookName of hooksToRemove) {
      const hookPath = path.join(this.hooksDir, hookName);

      try {
        await fs.access(hookPath);
        await fs.unlink(hookPath);
        printInfo(chalk.gray(`  Removed: ${hookName}`));
        removedCount++;
      } catch (error) {
        if (error.code !== 'ENOENT') {
          printWarning(chalk.yellow(`  Could not remove ${hookName}: ${error.message}`));
        } else {
          printInfo(chalk.gray(`  Not found: ${hookName}`));
        }
      }
    }

    printSuccess(chalk.green(`✅ Removed ${removedCount} Git hooks`));
  }

  /**
   * Update git hooks
   */
  async updateHooks(options = {}) {
    printInfo(chalk.cyan('\n🔄 Updating Git hooks...\n'));

    const hooksToUpdate = options.hooks || GIT_HOOKS;
    let updatedCount = 0;

    for (const hookName of hooksToUpdate) {
      // For update, we just reinstall the hook
      await this.installHook(hookName, options);
      updatedCount++;
    }

    printSuccess(chalk.green(`✅ Updated ${updatedCount} Git hooks`));
  }

  /**
   * Validate git hooks
   */
  async validateHooks() {
    printInfo(chalk.cyan('\n🔍 Validating Git hooks...\n'));

    try {
      const files = await fs.readdir(this.hooksDir);
      const installedHooks = [];
      for (const file of files) {
        if (!GIT_HOOKS.includes(file)) continue;
        const stat = await fs.stat(path.join(this.hooksDir, file));
        if (stat.isFile()) installedHooks.push(file);
      }

      let validCount = 0;
      let invalidCount = 0;

      for (const hook of installedHooks) {
        const hookPath = path.join(this.hooksDir, hook);
        const stat = await fs.stat(hookPath);
        const isExecutable = (stat.mode & 0o111) !== 0;

        if (isExecutable) {
          printSuccess(chalk.green(`✓ ${hook} (valid)`));
          validCount++;
        } else {
          printWarning(chalk.yellow(`⚠️ ${hook} (not executable)`));
          invalidCount++;
        }
      }

      if (invalidCount > 0) {
        printInfo(chalk.gray('\nTo fix non-executable hooks:'));
        printInfo(chalk.gray(`chmod +x ${path.join(this.hooksDir, '*')}`));
      }

      printInfo(chalk.cyan(`\nValidation Summary:`));
      printInfo(chalk.gray(`Valid hooks: ${validCount}`));
      printInfo(chalk.gray(`Invalid hooks: ${invalidCount}`));
      printInfo(chalk.gray(`Total hooks: ${installedHooks.length}`));

      return { valid: validCount, invalid: invalidCount, total: installedHooks.length };
    } catch (error) {
      printError(chalk.red(`Hook validation failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * Run a specific hook manually for testing
   */
  async runHook(hookName, args = []) {
    const hookPath = path.join(this.hooksDir, hookName);

    try {
      await fs.access(hookPath);

      printInfo(chalk.cyan(`\n🧪 Running ${hookName} hook manually...\n`));

      const { stdout, stderr } = await execAsync(`"${hookPath}" ${args.join(' ')}`, {
        cwd: process.cwd(),
      });

      if (stdout) printInfo(chalk.gray(stdout));
      if (stderr) printWarning(chalk.yellow(stderr));

      printSuccess(chalk.green(`✅ ${hookName} hook executed successfully`));
      return { stdout, stderr, success: true };
    } catch (error) {
      printError(chalk.red(`Hook execution failed: ${error.message}`));
      return { error: error.message, success: false };
    }
  }

  /**
   * Get hook status
   */
  async getHookStatus() {
    const installedHooks = await this.listHooks();

    const status = {
      gitDir: this.gitDir,
      hooksDir: this.hooksDir,
      installed: installedHooks,
      totalAvailable: GIT_HOOKS.length,
      missing: GIT_HOOKS.filter((hook) => !installedHooks.includes(hook)),
      validation: await this.validateHooks(),
    };

    return status;
  }

  /**
   * Create a custom hook
   */
  async createCustomHook(hookName, hookContent) {
    if (!GIT_HOOKS.includes(hookName)) {
      printWarning(chalk.yellow(`⚠️  Warning: ${hookName} is not a standard Git hook`));

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: chalk.cyan(`Install custom hook ${hookName} anyway?`),
          default: true,
        },
      ]);

      if (!confirm) {
        printInfo(chalk.gray('Custom hook installation cancelled.'));
        return;
      }
    }

    const hookPath = path.join(this.hooksDir, hookName);
    await fs.writeFile(hookPath, hookContent, { mode: 0o755 });

    printSuccess(chalk.green(`✅ Custom hook installed: ${hookName}`));
  }

  /**
   * Backup existing hooks
   */
  async backupHooks() {
    const backupDir = path.join(this.gitDir, 'hooks-backup', `backup-${Date.now()}`);
    await fs.mkdir(backupDir, { recursive: true });

    const installedHooks = await this.listHooks();

    for (const hookName of installedHooks) {
      const originalPath = path.join(this.hooksDir, hookName);
      const backupPath = path.join(backupDir, hookName);

      await fs.copyFile(originalPath, backupPath);
    }

    printSuccess(chalk.green(`✅ Hooks backed up to: ${backupDir}`));
    return backupDir;
  }

  /**
   * Restore hooks from backup
   */
  async restoreHooks(backupDir) {
    try {
      const backupFiles = await fs.readdir(backupDir);

      for (const file of backupFiles) {
        const backupPath = path.join(backupDir, file);
        const originalPath = path.join(this.hooksDir, file);

        await fs.copyFile(backupPath, originalPath);
        await fs.chmod(originalPath, 0o755); // Ensure executable
      }

      printSuccess(chalk.green(`✅ Hooks restored from: ${backupDir}`));
    } catch (error) {
      printError(chalk.red(`Hook restoration failed: ${error.message}`));
      throw error;
    }
  }
}

// Global instance
const gitHookManager = new GitHookManager();

/**
 * Register git hook commands
 */
export function registerGitHookCommand(program) {
  const hookCmd = program
    .command('githooks')
    .alias('hooks')
    .description('Git hooks with AI-powered validation');

  hookCmd
    .command('install')
    .description('Install Ultra-Dex AI validation hooks')
    .option('-a, --all', 'Install all available hooks (default)')
    .option('-p, --pre-commit', 'Install pre-commit hook only')
    .option('--pre-push', 'Install pre-push hook only')
    .option('--commit-msg', 'Install commit-msg hook only')
    .option('--no-verify', 'Skip validation during installation')
    .action(async (options) => {
      try {
        let hooksToInstall = [];

        if (options.preCommit) {
          hooksToInstall = ['pre-commit'];
        } else if (options.prePush) {
          hooksToInstall = ['pre-push'];
        } else if (options.commitMsg) {
          hooksToInstall = ['commit-msg'];
        } else {
          // Default to all hooks
          hooksToInstall = GIT_HOOKS;
        }

        await gitHookManager.installHooks({
          hooks: hooksToInstall,
          skipValidation: options.noVerify,
        });
      } catch (error) {
        printError(chalk.red(`Git hook installation failed: ${error.message}`));
        process.exit(1);
      }
    });

  hookCmd
    .command('list')
    .alias('ls')
    .description('List installed hooks')
    .action(async () => {
      try {
        await gitHookManager.listHooks();
      } catch (error) {
        printError(chalk.red(`List hooks failed: ${error.message}`));
        process.exit(1);
      }
    });

  hookCmd
    .command('remove')
    .alias('rm')
    .description('Remove installed hooks')
    .option('-a, --all', 'Remove all Ultra-Dex hooks (default)')
    .option('-h, --hook <name>', 'Remove specific hook')
    .action(async (options) => {
      try {
        const hooksToRemove = options.hook ? [options.hook] : options.all ? GIT_HOOKS : GIT_HOOKS;
        await gitHookManager.removeHooks(hooksToRemove);
      } catch (error) {
        printError(chalk.red(`Remove hooks failed: ${error.message}`));
        process.exit(1);
      }
    });

  hookCmd
    .command('update')
    .description('Update installed hooks to latest version')
    .option('-a, --all', 'Update all hooks (default)')
    .option('-h, --hook <name>', 'Update specific hook')
    .action(async (options) => {
      try {
        const hooksToUpdate = options.hook ? [options.hook] : options.all ? GIT_HOOKS : GIT_HOOKS;
        await gitHookManager.updateHooks({ hooks: hooksToUpdate });
      } catch (error) {
        printError(chalk.red(`Update hooks failed: ${error.message}`));
        process.exit(1);
      }
    });

  hookCmd
    .command('validate')
    .alias('check')
    .description('Validate installed hooks')
    .action(async () => {
      try {
        await gitHookManager.validateHooks();
      } catch (error) {
        printError(chalk.red(`Validate hooks failed: ${error.message}`));
        process.exit(1);
      }
    });

  hookCmd
    .command('status')
    .description('Show hook installation status')
    .action(async () => {
      try {
        const status = await gitHookManager.getHookStatus();

        printInfo(chalk.cyan('\n📊 Git Hooks Status:\n'));
        printInfo(chalk.gray(`Git Directory: ${status.gitDir}`));
        printInfo(chalk.gray(`Hooks Directory: ${status.hooksDir}`));
        printInfo(
          chalk.gray(`Installed Hooks: ${status.installed.length}/${status.totalAvailable}`)
        );

        if (status.missing.length > 0) {
          printWarning(chalk.yellow(`\nMissing Hooks: ${status.missing.join(', ')}`));
        }

        printInfo(chalk.gray(`\nValidation Results:`));
        printInfo(chalk.gray(`  Valid: ${status.validation.valid}`));
        printInfo(chalk.gray(`  Invalid: ${status.validation.invalid}`));
      } catch (error) {
        printError(chalk.red(`Status check failed: ${error.message}`));
        process.exit(1);
      }
    });

  hookCmd
    .command('run')
    .description('Run a hook manually for testing')
    .argument('<hook>', 'Hook name to run')
    .argument('[args...]', 'Arguments to pass to the hook')
    .action(async (hook, args) => {
      try {
        const result = await gitHookManager.runHook(hook, args);
        if (!result.success) {
          process.exit(1);
        }
      } catch (error) {
        printError(chalk.red(`Run hook failed: ${error.message}`));
        process.exit(1);
      }
    });

  hookCmd._examples = [
    { command: 'ultra-dex githooks install', description: 'Install all AI validation hooks' },
    {
      command: 'ultra-dex githooks install --pre-commit',
      description: 'Install only pre-commit hook',
    },
    { command: 'ultra-dex githooks list', description: 'Show installed hooks' },
    { command: 'ultra-dex githooks validate', description: 'Validate hook executability' },
    { command: 'ultra-dex githooks status', description: 'Show installation status' },
    { command: 'ultra-dex githooks run pre-commit', description: 'Test run a hook' },
    { command: 'ultra-dex githooks remove --all', description: 'Remove all hooks' },
  ];
}

export default {
  GitHookManager,
  gitHookManager,
  registerGitHookCommand,
  GIT_HOOKS,
  PRE_COMMIT_HOOK,
  PRE_PUSH_HOOK,
  COMMIT_MSG_HOOK,
};
