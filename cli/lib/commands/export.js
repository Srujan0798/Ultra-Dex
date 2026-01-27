/**
 * ultra-dex export command
 * Packages project context and plans for distribution
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { loadState } from './state.js';
import { buildGraph } from '../utils/graph.js';

export function registerExportCommand(program) {
  program
    .command('export')
    .description('Export project context and implementation plans')
    .option('-o, --output <file>', 'Output zip/json file', 'ultra-dex-export.json')
    .option('--full', 'Include full Code Property Graph', false)
    .action(async (options) => {
      console.log(chalk.cyan('\n📦 Exporting Ultra-Dex Project\n'));

      const spinner = (await import('ora')).default('Gathering project data...').start();
      try {
        const state = await loadState();
        const exportData = {
          projectName: state?.project?.name || path.basename(process.cwd()),
          exportedAt: new Date().toISOString(),
          files: {}
        };

        // Key files to include
        const filesToExport = [
          'IMPLEMENTATION-PLAN.md',
          'CONTEXT.md',
          'QUICK-START.md',
          'docs/CHECKLIST.md'
        ];

        for (const file of filesToExport) {
          try {
            const content = await fs.readFile(path.resolve(process.cwd(), file), 'utf8');
            exportData.files[file] = content;
          } catch (e) {
            // skip
          }
        }

        if (options.full) {
          exportData.graph = await buildGraph();
        }

        await fs.writeFile(options.output, JSON.stringify(exportData, null, 2));
        spinner.succeed(chalk.green(`Project exported to ${options.output}`));
        
        console.log(chalk.gray(`\n  Included ${Object.keys(exportData.files).length} files`));
        if (exportData.graph) console.log(chalk.gray(`  Included CPG (${exportData.graph.nodes.length} nodes)`));

      } catch (e) {
        spinner.fail(chalk.red(`Export failed: ${e.message}`));
      }
    });
}
