import chalk from 'chalk';
import { fetchContext7Docs, detectDependencies } from '../docs/context7.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

export function registerDocsCommand(program) {
  const docs = program
    .command('docs [pkg]')
    .description('Fetch live documentation from Context7');

  docs
    .option('--version <version>', 'Package version', 'latest')
    .option('--detect', 'Detect dependencies from package.json')
    .action(async (pkg, options) => {
      try {
        if (options.detect) {
          const deps = await detectDependencies(process.cwd());
          printInfo(chalk.cyan(`\nDetected ${deps.length} dependencies:\n`));
          deps.slice(0, 20).forEach(dep => printInfo(`- ${dep}`));
          return;
        }

        if (!pkg) {
          printWarning(chalk.yellow('Package name required. Use --detect to list dependencies.'));
          return;
        }

        const data = await fetchContext7Docs(pkg, options.version);
        printSuccess(chalk.green(`\n✅ Context7 docs fetched for ${pkg}\n`));
        if (data.content) {
          printInfo(data.content.slice(0, 1500));
        } else {
          printInfo(JSON.stringify(data, null, 2));
        }
      } catch (error) {
        printError(chalk.red(`Docs fetch failed: ${error.message}`));
      }
    });
}

