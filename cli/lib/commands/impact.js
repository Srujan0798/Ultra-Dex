// Copyright (c) 2026 Ultra-Dex

/**
 * Impact Analysis Command
 */

import chalk from 'chalk';
import fs from 'fs';
import { GraphRAG } from '../rag/graph.js';
import { buildImpactGraph, writeImpactReport } from '../graph/impact-visualizer.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

async function runImpactAnalysis(target, options) {
  const graphRAG = new GraphRAG({
    dbType: options.dbType,
    useInMemory: options.dbType === 'memory',
  });

  await graphRAG.initialize();
  const analysis = await graphRAG.getImpactAnalysis(target, parseInt(options.depth, 10) || 2);
  await graphRAG.close();

  const graph = buildImpactGraph(analysis, target);
  return { analysis, graph };
}

export function registerImpactCommand(program) {
  program
    .command('impact <target>')
    .description('Analyze impact of changing a file or symbol')
    .option('--depth <n>', 'Analysis depth', '2')
    .option('--db-type <type>', 'Database type (neo4j|falkordb|memory)', 'neo4j')
    .option('--output <path>', 'Write impact report to HTML/JSON')
    .option('--json', 'Output JSON to stdout')
    .option('--watch', 'Re-run analysis when files change')
    .action(async (target, options) => {
      try {
        printInfo(chalk.cyan.bold(`\n🎯 Impact Analysis: ${target}\n`));

        const handleResult = async () => {
          const { analysis, graph } = await runImpactAnalysis(target, options);

          const riskColor =
            analysis.riskLevel === 'high'
              ? 'red'
              : analysis.riskLevel === 'medium'
                ? 'yellow'
                : 'green';

          printInfo(
            chalk.white(`Risk Level: ${chalk[riskColor](analysis.riskLevel.toUpperCase())}`)
          );
          printInfo(chalk.gray(`Impacted Files: ${analysis.impactedCount}\n`));

          if (analysis.impactedFiles.length > 0) {
            analysis.impactedFiles.forEach((f) => {
              const indent = '  '.repeat(Math.max(0, f.distance - 1));
              printInfo(chalk.gray(`${indent}- ${f.path}`));
            });
          }

          if (options.output) {
            const report = await writeImpactReport(options.output, graph);
            printSuccess(chalk.green(`\n✅ Impact report saved to ${report.path}`));
          }

          if (options.json) {
            process.stdout.write(JSON.stringify({ analysis, graph }, null, 2) + '\n');
          }
        };

        await handleResult();

        if (options.watch) {
          printInfo(chalk.gray('\nWatching for changes...'));
          fs.watch(process.cwd(), { recursive: true }, async () => {
            try {
              await handleResult();
            } catch (error) {
              printWarning(chalk.yellow(`Watch update failed: ${error.message}`));
            }
          });
        }
      } catch (error) {
        printError(chalk.red(`Impact analysis failed: ${error.message}`));
        process.exit(1);
      }
    });
}
