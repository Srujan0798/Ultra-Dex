import chalk from 'chalk';
import path from 'path';
import { snapshotContext } from '../utils/sync.js';
import { validateSafePath } from '../utils/validation.js';

export function registerSyncCommand(program) {
  program
    .command('sync')
    .description('Auto-sync CONTEXT.md with current codebase')
    .option('-d, --dir <directory>', 'Project directory', '.')
    .action(async (options) => {
      const dirValidation = validateSafePath(options.dir, 'Project directory');
      if (dirValidation !== true) {
        console.log(chalk.red(dirValidation));
        process.exit(1);
      }

      const rootDir = path.resolve(options.dir);
      console.log(chalk.cyan('\n🔁 Ultra-Dex Context Sync\n'));

      try {
        const result = await snapshotContext(rootDir);
        if (result.missingContext) {
          console.log(chalk.red('❌ CONTEXT.md not found. Run `ultra-dex init` first.'));
          process.exit(1);
        }

        if (result.updated) {
          console.log(chalk.green('✅ CONTEXT.md updated with latest snapshot.'));
        } else {
          console.log(chalk.yellow('⚠️  CONTEXT.md already up to date.'));
        }
        console.log(chalk.gray(`Files scanned: ${result.summary.fileCount}`));
        console.log(chalk.gray(`Stack guess: ${result.summary.stack}`));
        console.log(chalk.gray(`Changes since last sync: +${result.diff.added} / -${result.diff.removed}\n`));
      } catch (error) {
        console.log(chalk.red('❌ Sync failed.'));
        console.error(error);
        process.exit(1);
      }
    });
}
