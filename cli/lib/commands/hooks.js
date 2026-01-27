import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

export function registerHooksCommand(program) {
  program
    .command('hooks')
    .description('Set up git hooks for automated verification')
    .option('--remove', 'Remove Ultra-Dex git hooks')
    .action(async (options) => {
      console.log(chalk.cyan('\n🪝 Ultra-Dex Git Hooks Setup\n'));

      const gitDir = path.join(process.cwd(), '.git');
      const hooksDir = path.join(gitDir, 'hooks');

      try {
        await fs.access(gitDir);
      } catch {
        console.log(chalk.red('❌ Not a git repository. Run "git init" first.\n'));
        process.exit(1);
      }

      await fs.mkdir(hooksDir, { recursive: true });

      const preCommitPath = path.join(hooksDir, 'pre-commit');

      if (options.remove) {
        try {
          const content = await fs.readFile(preCommitPath, 'utf-8');
          if (content.includes('ultra-dex')) {
            await fs.unlink(preCommitPath);
            console.log(chalk.green('✅ Ultra-Dex pre-commit hook removed.\n'));
          } else {
            console.log(chalk.yellow('⚠️  Pre-commit hook exists but is not from Ultra-Dex.\n'));
          }
        } catch {
          console.log(chalk.gray('No Ultra-Dex hooks found.\n'));
        }
        return;
      }

      const preCommitScript = `#!/bin/sh
# Ultra-Dex Pre-Commit Hook
# Validates project structure before allowing commits
# Remove with: npx ultra-dex hooks --remove

echo "🔍 Ultra-Dex: Validating project structure..."

# Run validation
npx ultra-dex validate --dir . > /tmp/ultra-dex-validate.log 2>&1
RESULT=$?

if [ $RESULT -ne 0 ]; then
  echo ""
  echo "❌ Ultra-Dex validation failed. Commit blocked."
  echo ""
  echo "Run 'npx ultra-dex validate' to see details."
  echo "Fix issues or bypass with: git commit --no-verify"
  echo ""
  exit 1
fi

# Check for required files
if [ ! -f "QUICK-START.md" ]; then
  echo "⚠️  Warning: QUICK-START.md not found"
fi

if [ ! -f "IMPLEMENTATION-PLAN.md" ]; then
  echo "⚠️  Warning: IMPLEMENTATION-PLAN.md not found"
fi

echo "✅ Ultra-Dex validation passed."
exit 0
`;

      try {
        const existing = await fs.readFile(preCommitPath, 'utf-8');
        if (existing.includes('ultra-dex')) {
          console.log(chalk.yellow('⚠️  Ultra-Dex pre-commit hook already exists.\n'));
          console.log(chalk.gray('  Use --remove to remove it first.\n'));
          return;
        } else {
          const combined = existing + '\n\n' + preCommitScript;
          await fs.writeFile(preCommitPath, combined);
          await fs.chmod(preCommitPath, '755');
          console.log(chalk.green('✅ Ultra-Dex hook appended to existing pre-commit.\n'));
        }
      } catch {
        await fs.writeFile(preCommitPath, preCommitScript);
        await fs.chmod(preCommitPath, '755');
        console.log(chalk.green('✅ Pre-commit hook installed.\n'));
      }

      console.log(chalk.bold('What this does:\n'));
      console.log(chalk.gray('  • Runs "ultra-dex validate" before each commit'));
      console.log(chalk.gray('  • Blocks commits if required files are missing'));
      console.log(chalk.gray('  • Warns about incomplete sections\n'));

      console.log(chalk.bold('To bypass (not recommended):\n'));
      console.log(chalk.cyan('  git commit --no-verify\n'));

      console.log(chalk.bold('To remove:\n'));
      console.log(chalk.cyan('  npx ultra-dex hooks --remove\n'));
    });
}
