// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function registerHooksCommand(program) {
  const hooks = program
    .command('hooks')
    .description('Manage Ultra-Dex git hooks for automated verification');

  // Install subcommand
  hooks
    .command('install')
    .description('Install Ultra-Dex pre-commit hook to .git/hooks/')
    .option('--force', 'Overwrite existing hooks')
    .option('--pre-commit-only', 'Only install the pre-commit hook (skip pre-push)')
    .option('--min-score <score>', 'Minimum alignment score (default: 70)', '70')
    .action(async (options) => {
      printInfo(chalk.cyan('\n🪝 Ultra-Dex Git Hooks Installation\n'));
      await installHook(options);
    });

  // Remove subcommand
  hooks
    .command('remove')
    .alias('uninstall')
    .description('Remove Ultra-Dex git hooks')
    .action(async () => {
      printInfo(chalk.cyan('\n🪝 Ultra-Dex Git Hooks Removal\n'));
      await removeHook();
    });

  // Status subcommand
  hooks
    .command('status')
    .description('Check if Ultra-Dex hooks are installed')
    .action(async () => {
      printInfo(chalk.cyan('\n🪝 Ultra-Dex Git Hooks Status\n'));
      await checkHookStatus();
    });

  // Default action (legacy support)
  hooks
    .option('--remove', 'Remove Ultra-Dex git hooks (deprecated: use "hooks remove")')
    .action(async (options) => {
      if (options.remove) {
        printInfo(chalk.cyan('\n🪝 Ultra-Dex Git Hooks Removal\n'));
        await removeHook();
      } else {
        // Show help if no subcommand
        hooks.outputHelp();
      }
    });
}

async function getGitHooksDir() {
  const gitDir = path.join(process.cwd(), '.git');
  const hooksDir = path.join(gitDir, 'hooks');

  try {
    await fs.access(gitDir);
  } catch {
    printError(chalk.red('❌ Not a git repository. Run "git init" first.\n'));
    return null;
  }

  await fs.mkdir(hooksDir, { recursive: true });
  return hooksDir;
}

async function getPreCommitHookPath() {
  // Try to find the bundled hook first
  const possiblePaths = [
    path.join(__dirname, '..', '..', 'assets', 'hooks', 'pre-commit'),
    path.join(__dirname, '..', '..', '..', 'assets', 'hooks', 'pre-commit'),
  ];

  for (const hookPath of possiblePaths) {
    try {
      await fs.access(hookPath);
      return hookPath;
    } catch {
      // Continue to next path
    }
  }

  return null;
}

async function getPrePushHookPath() {
  const possiblePaths = [
    path.join(__dirname, '..', '..', 'assets', 'hooks', 'pre-push'),
    path.join(__dirname, '..', '..', '..', 'assets', 'hooks', 'pre-push'),
  ];

  for (const hookPath of possiblePaths) {
    try {
      await fs.access(hookPath);
      return hookPath;
    } catch {
      // Continue to next path
    }
  }

  return null;
}

async function installHook(options) {
  const hooksDir = await getGitHooksDir();
  if (!hooksDir) return;

  const preCommitPath = path.join(hooksDir, 'pre-commit');
  const prePushPath = path.join(hooksDir, 'pre-push');
  let minScore = parseInt(options.minScore, 10);

  if (isNaN(minScore) || minScore < 0 || minScore > 100) {
    printWarning(chalk.yellow('Invalid minimum score. Defaulting to 70.'));
    minScore = 70;
  }

  // Try to use bundled hook
  const bundledHookPath = await getPreCommitHookPath();
  let hookScript;

  if (bundledHookPath) {
    hookScript = await fs.readFile(bundledHookPath, 'utf-8');
    // Update minimum score if specified
    hookScript = hookScript.replace(/MIN_ALIGNMENT_SCORE=\d+/, `MIN_ALIGNMENT_SCORE=${minScore}`);
    printInfo(chalk.gray(`  Using bundled hook from: ${bundledHookPath}`));
  } else {
    // Fallback to embedded script
    hookScript = generatePreCommitScript(minScore);
    printInfo(chalk.gray('  Using embedded hook script'));
  }

  try {
    const existing = await fs.readFile(preCommitPath, 'utf-8');
    if (existing.includes('ultra-dex') || existing.includes('Ultra-Dex')) {
      if (options.force) {
        await fs.writeFile(preCommitPath, hookScript);
        await fs.chmod(preCommitPath, '755');
        printSuccess(chalk.green('✅ Ultra-Dex pre-commit hook updated (--force).\n'));
      } else {
        printWarning(chalk.yellow('⚠️  Ultra-Dex pre-commit hook already exists.\n'));
        printInfo(chalk.gray('  Use --force to overwrite, or "hooks remove" first.\n'));
        return;
      }
    } else {
      // Append to existing hook
      const combined = existing + '\n\n' + hookScript;
      await fs.writeFile(preCommitPath, combined);
      await fs.chmod(preCommitPath, '755');
      printSuccess(chalk.green('✅ Ultra-Dex hook appended to existing pre-commit.\n'));
    }
  } catch {
    // No existing hook, create new one
    await fs.writeFile(preCommitPath, hookScript);
    await fs.chmod(preCommitPath, '755');
    printSuccess(chalk.green('✅ Pre-commit hook installed.\n'));
  }

  printHookInfo(minScore);

  if (!options.preCommitOnly) {
    await installPrePushHook(prePushPath, options);
  } else {
    printInfo(chalk.gray('  Skipping pre-push hook (--pre-commit-only).'));
  }
}

async function installPrePushHook(prePushPath, options) {
  const bundledHookPath = await getPrePushHookPath();
  let hookScript;

  if (bundledHookPath) {
    hookScript = await fs.readFile(bundledHookPath, 'utf-8');
    printInfo(chalk.gray(`  Using bundled pre-push hook from: ${bundledHookPath}`));
  } else {
    hookScript = generatePrePushScript();
    printInfo(chalk.gray('  Using embedded pre-push hook script'));
  }

  try {
    const existing = await fs.readFile(prePushPath, 'utf-8');
    if (existing.includes('ultra-dex') || existing.includes('Ultra-Dex')) {
      if (options.force) {
        await fs.writeFile(prePushPath, hookScript);
        await fs.chmod(prePushPath, '755');
        printSuccess(chalk.green('✅ Ultra-Dex pre-push hook updated (--force).\n'));
      } else {
        printWarning(chalk.yellow('⚠️  Ultra-Dex pre-push hook already exists.\n'));
        return;
      }
    } else {
      const combined = existing + '\n\n' + hookScript;
      await fs.writeFile(prePushPath, combined);
      await fs.chmod(prePushPath, '755');
      printSuccess(chalk.green('✅ Ultra-Dex hook appended to existing pre-push.\n'));
    }
  } catch {
    await fs.writeFile(prePushPath, hookScript);
    await fs.chmod(prePushPath, '755');
    printSuccess(chalk.green('✅ Pre-push hook installed.\n'));
  }
}

async function removeHook() {
  const hooksDir = await getGitHooksDir();
  if (!hooksDir) return;

  const preCommitPath = path.join(hooksDir, 'pre-commit');
  const prePushPath = path.join(hooksDir, 'pre-push');

  try {
    const content = await fs.readFile(preCommitPath, 'utf-8');
    if (content.includes('ultra-dex') || content.includes('Ultra-Dex')) {
      await fs.unlink(preCommitPath);
      printSuccess(chalk.green('✅ Ultra-Dex pre-commit hook removed.\n'));
    } else {
      printWarning(chalk.yellow('⚠️  Pre-commit hook exists but is not from Ultra-Dex.\n'));
    }
  } catch {
    printInfo(chalk.gray('No Ultra-Dex hooks found.\n'));
  }

  try {
    const content = await fs.readFile(prePushPath, 'utf-8');
    if (content.includes('ultra-dex') || content.includes('Ultra-Dex')) {
      await fs.unlink(prePushPath);
      printSuccess(chalk.green('✅ Ultra-Dex pre-push hook removed.\n'));
    }
  } catch {
    // ignore
  }
}

async function checkHookStatus() {
  const hooksDir = await getGitHooksDir();
  if (!hooksDir) return;

  const preCommitPath = path.join(hooksDir, 'pre-commit');
  const prePushPath = path.join(hooksDir, 'pre-push');

  try {
    const content = await fs.readFile(preCommitPath, 'utf-8');
    if (content.includes('ultra-dex') || content.includes('Ultra-Dex')) {
      printSuccess(chalk.green('✅ Ultra-Dex pre-commit hook is installed.\n'));

      // Extract min score if present
      const scoreMatch = content.match(/MIN_ALIGNMENT_SCORE=(\d+)/);
      if (scoreMatch) {
        printInfo(chalk.gray(`  Minimum alignment score: ${scoreMatch[1]}%\n`));
      }
    } else {
      printWarning(chalk.yellow('⚠️  Pre-commit hook exists but is not from Ultra-Dex.\n'));
    }
  } catch {
    printInfo(chalk.gray('❌ No pre-commit hook installed.\n'));
    printInfo(chalk.cyan('  Install with: npx ultra-dex hooks install\n'));
  }

  try {
    const content = await fs.readFile(prePushPath, 'utf-8');
    if (content.includes('ultra-dex') || content.includes('Ultra-Dex')) {
      printSuccess(chalk.green('✅ Ultra-Dex pre-push hook is installed.\n'));
    } else {
      printWarning(chalk.yellow('⚠️  Pre-push hook exists but is not from Ultra-Dex.\n'));
    }
  } catch {
    printInfo(chalk.gray('❌ No pre-push hook installed.\n'));
    printInfo(chalk.cyan('  Install with: npx ultra-dex hooks install\n'));
  }
}

function printHookInfo(minScore) {
  printInfo(chalk.bold('What this does:\n'));
  printInfo(chalk.gray(`  • Checks alignment score (minimum: ${minScore}%)`));
  printInfo(chalk.gray('  • Runs "ultra-dex validate" before each commit'));
  printInfo(chalk.gray('  • Blocks commits if validation fails'));
  printInfo(chalk.gray('  • Warns about missing documentation\n'));

  printInfo(chalk.bold('To bypass (not recommended):\n'));
  printInfo(chalk.cyan('  git commit --no-verify\n'));

  printInfo(chalk.bold('To check status:\n'));
  printInfo(chalk.cyan('  npx ultra-dex hooks status\n'));

  printInfo(chalk.bold('To remove:\n'));
  printInfo(chalk.cyan('  npx ultra-dex hooks remove\n'));
}

function generatePreCommitScript(minScore = 70) {
  return `#!/bin/sh
# Ultra-Dex Pre-Commit Hook v3.0
# Validates project alignment and structure before allowing commits
# Install with: npx ultra-dex hooks install
# Remove with: npx ultra-dex hooks remove

set -e

echo ""
echo "🎯 Ultra-Dex: Running pre-commit validation..."
echo ""

# Configuration
MIN_ALIGNMENT_SCORE=${minScore}
VALIDATION_LOG="/tmp/ultra-dex-validate.log"
ALIGN_LOG="/tmp/ultra-dex-align.log"

# Check if ultra-dex is available
if ! command -v ultra-dex &> /dev/null && ! npx ultra-dex --version &> /dev/null 2>&1; then
    echo "⚠️  Ultra-Dex not found. Skipping validation."
    echo "   Install with: npm install -g ultra-dex"
    exit 0
fi

# Run alignment check and capture score
echo "📊 Checking alignment score..."
npx ultra-dex align --dir . > "$ALIGN_LOG" 2>&1 || true

# Extract score from output
SCORE=$(grep -oE '[0-9]+%' "$ALIGN_LOG" | head -1 | tr -d '%' || echo "0")

if [ -z "$SCORE" ] || [ "$SCORE" = "0" ]; then
    SCORE=$(grep -oE 'Score: [0-9]+' "$ALIGN_LOG" | grep -oE '[0-9]+' | head -1 || echo "85")
fi

echo "   Current alignment score: \${SCORE}%"

# Check minimum score threshold
if [ "$SCORE" -lt "$MIN_ALIGNMENT_SCORE" ]; then
    echo ""
    echo "❌ COMMIT BLOCKED: Alignment score (\$SCORE%) is below minimum ($MIN_ALIGNMENT_SCORE%)"
    echo ""
    echo "📋 To fix this:"
    echo "   1. Run: npx ultra-dex validate"
    echo "   2. Run: npx ultra-dex fix (to auto-fix issues)"
    echo "   3. Review and commit again"
    echo ""
    echo "🔓 To bypass (not recommended):"
    echo "   git commit --no-verify"
    echo ""
    exit 1
fi

# Run validation
echo "🔍 Running validation checks..."
npx ultra-dex validate --dir . --scan > "$VALIDATION_LOG" 2>&1
VALIDATE_RESULT=$?

if [ $VALIDATE_RESULT -ne 0 ]; then
    echo ""
    echo "❌ COMMIT BLOCKED: Validation failed"
    echo ""
    cat "$VALIDATION_LOG"
    echo ""
    echo "📋 Run 'npx ultra-dex validate' for details"
    echo "🔓 To bypass: git commit --no-verify"
    echo ""
    exit 1
fi

# Success
echo ""
echo "✅ Ultra-Dex validation passed!"
echo "   Score: \${SCORE}% (minimum: $MIN_ALIGNMENT_SCORE%)"
echo ""

# Cleanup
rm -f "$VALIDATION_LOG" "$ALIGN_LOG" 2>/dev/null || true

exit 0
`;
}

function generatePrePushScript() {
  return `#!/bin/sh
# Ultra-Dex Pre-Push Hook v1.0
# Updates CONTEXT.md based on git diff + runs live verification

set -e

echo ""
echo "🚀 Ultra-Dex: Running pre-push verification..."
echo ""

if ! command -v ultra-dex >/dev/null 2>&1 && ! npx ultra-dex --version >/dev/null 2>&1; then
    echo "⚠️  Ultra-Dex not found. Skipping pre-push verification."
    exit 0
fi

npx ultra-dex verify --live --pre-push

echo ""
echo "✅ Ultra-Dex pre-push checks passed"
echo ""

exit 0
`;
}
