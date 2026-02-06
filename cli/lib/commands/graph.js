// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { DeepGraphRAG } from '../graph/deep-rag.js';
import { StateMachine } from '../graph/state-machine.js';
import {
  toMermaid,
  toAscii,
  exportMermaid,
  exportSvg,
  loadStateMachine,
} from '../graph/visualizer.js';
import { indexRepo } from '../graph/repo-indexer.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

function sanitizeId(value) {
  return value.replace(/[^a-zA-Z0-9_]/g, '_');
}

function normalizePathLabel(value, rootDir) {
  if (!value) return value;
  const relative = path.relative(rootDir, value);
  return relative.startsWith('..') ? value : relative;
}

function resolveImportPath(importerPath, specifier, knownFiles) {
  if (!specifier) return { type: 'unknown', value: specifier };
  if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
    return { type: 'package', value: specifier };
  }

  const basePath = specifier.startsWith('/')
    ? specifier
    : path.resolve(path.dirname(importerPath), specifier);

  const candidates = [
    basePath,
    `${basePath}.js`,
    `${basePath}.jsx`,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    path.join(basePath, 'index.js'),
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.jsx'),
  ];

  for (const candidate of candidates) {
    if (knownFiles.has(candidate)) {
      return { type: 'file', value: candidate };
    }
  }

  return { type: 'file', value: basePath };
}

function buildDependencyMermaid(graph, rootDir) {
  const knownFiles = new Set(Object.keys(graph.nodes || {}));
  const lines = ['graph TD'];
  const seen = new Set();

  for (const edge of graph.edges || []) {
    const fromPath = edge.from;
    const fromLabel = normalizePathLabel(fromPath, rootDir);
    const fromId = sanitizeId(fromLabel);

    const resolved = resolveImportPath(fromPath, edge.to, knownFiles);
    const toLabel =
      resolved.type === 'package'
        ? `pkg:${resolved.value}`
        : normalizePathLabel(resolved.value, rootDir);
    const toId = sanitizeId(toLabel);

    const key = `${fromId}--${toId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    lines.push(`  ${fromId}["${fromLabel}"] --> ${toId}["${toLabel}"]`);
  }

  return lines.join('\n');
}

export function registerGraphCommand(program) {
  const graph = program.command('graph').description('Deep graph RAG operations');

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
        results.forEach((r) => printInfo(chalk.gray(`• ${r.path || r}`)));
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
            const output =
              options.output ||
              `state-graph.${options.export === 'svg' ? 'svg' : options.export === 'json' ? 'json' : 'mmd'}`;
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

  graph
    .command('deps')
    .description('Generate dependency graph (Mermaid)')
    .option('--root <path>', 'Root directory to scan', process.cwd())
    .option('--output <path>', 'Output markdown file', 'ARCHITECTURE.md')
    .action(async (options) => {
      try {
        const rootDir = path.resolve(options.root);
        const graphData = await indexRepo(rootDir);
        const mermaid = buildDependencyMermaid(graphData, rootDir);

        const report =
          `# Architecture Dependency Graph\n\n` +
          `> Generated: ${new Date().toISOString()}\n` +
          `> Root: ${rootDir}\n\n` +
          '```mermaid\n' +
          `${mermaid}\n` +
          '```\n';

        await fs.writeFile(path.resolve(options.output), report);
        printSuccess(chalk.green(`✅ Dependency graph written to ${options.output}`));
      } catch (error) {
        printError(chalk.red(`Dependency graph failed: ${error.message}`));
      }
    });
}
