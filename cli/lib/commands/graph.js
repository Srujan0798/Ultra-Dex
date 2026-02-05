import chalk from 'chalk';
import fs from 'fs/promises';
import { DeepGraphRAG } from '../graph/deep-rag.js';
import { StateMachine } from '../graph/state-machine.js';
import { toMermaid, toAscii, exportMermaid, exportSvg, loadStateMachine } from '../graph/visualizer.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

export function registerGraphCommand(program) {
  const graph = program
    .command('graph')
    .description('Deep graph RAG operations');

  graph
    .command('index')
    .description('Index codebase into graph database')
    .option('--path <path>', 'Root directory to index', process.cwd())
    .option('--db-type <type>', 'Database type (neo4j|falkordb|memory)', 'neo4j')
    .action(async (options) => {
      try {
        const deep = new DeepGraphRAG({ dbType: options.dbType });
        await deep.initialize();
        const stats = await deep.indexCodebase(options.path);
        await deep.close();
        printSuccess(chalk.green(`✅ Indexed ${stats.indexed || stats.totalFiles || 0} files`));
      } catch (error) {
        printError(chalk.red(`Indexing failed: ${error.message}`));
      }
    });

  graph
    .command('search <query>')
    .description('Search the graph')
    .option('--db-type <type>', 'Database type', 'neo4j')
    .action(async (query, options) => {
      try {
        const deep = new DeepGraphRAG({ dbType: options.dbType });
        await deep.initialize();
        const results = await deep.search(query);
        await deep.close();
        if (!results.length) {
          printWarning(chalk.yellow('No results found.'));
          return;
        }
        results.forEach(r => printInfo(chalk.gray(`• ${r.path || r}`)));
      } catch (error) {
        printError(chalk.red(`Search failed: ${error.message}`));
      }
    });

  graph
    .command('impact <target>')
    .description('Impact analysis for a file or symbol')
    .option('--depth <n>', 'Depth', '2')
    .option('--db-type <type>', 'Database type', 'neo4j')
    .action(async (target, options) => {
      try {
        const deep = new DeepGraphRAG({ dbType: options.dbType });
        await deep.initialize();
        const analysis = await deep.impact(target, parseInt(options.depth, 10));
        await deep.close();
        printInfo(chalk.gray(`Risk: ${analysis.riskLevel}`));
        printInfo(chalk.gray(`Impacted: ${analysis.impactedCount}`));
      } catch (error) {
        printError(chalk.red(`Impact failed: ${error.message}`));
      }
    });

  graph
    .command('visualize')
    .description('Export graph visualization (JSON)')
    .option('--db-type <type>', 'Database type', 'neo4j')
    .action(async (options) => {
      try {
        const deep = new DeepGraphRAG({ dbType: options.dbType });
        await deep.initialize();
        const data = await deep.visualize();
        await deep.close();
        process.stdout.write(JSON.stringify(data, null, 2) + '\n');
      } catch (error) {
        printError(chalk.red(`Visualize failed: ${error.message}`));
      }
    });

  graph
    .command('state')
    .description('Show LangGraph state machine')
    .option('--export <format>', 'Export as mermaid|svg|json')
    .option('--output <path>', 'Output path for export')
    .option('--live', 'Watch state machine file for updates')
    .action(async (options) => {
      try {
        const render = async () => {
          const machine = await loadStateMachine();

          if (options.export) {
            const output = options.output || `state-graph.${options.export === 'svg' ? 'svg' : options.export === 'json' ? 'json' : 'mmd'}`;
            if (options.export === 'svg') {
              await exportSvg(output, machine);
            } else if (options.export === 'json') {
              const payload = machine.toJSON();
              await fs.writeFile(output, JSON.stringify(payload, null, 2));
            } else {
              await exportMermaid(output, machine);
            }
            printSuccess(chalk.green(`✅ State graph exported to ${output}`));
            return;
          }

          printInfo(chalk.cyan('\nState Machine\n'));
          printInfo(toAscii(machine));
          printInfo('\nMermaid:\n');
          printInfo(toMermaid(machine));
        };

        await render();

        if (options.live) {
          printInfo(chalk.gray('\nWatching for state changes...'));
          fs.watch(process.cwd(), { recursive: true }, async (event, filename) => {
            if (filename && filename.includes('state-machine.json')) {
              await render();
            }
          });
        }
      } catch (error) {
        printError(chalk.red(`State graph failed: ${error.message}`));
      }
    });
}
