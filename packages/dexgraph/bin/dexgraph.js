#!/usr/bin/env node

/**
 * DexGraph CLI
 *
 * Usage:
 *   npx @ultra-dex/dexgraph run workflow.yaml
 *   npx @ultra-dex/dexgraph validate workflow.yaml
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse, DexGraph, Scheduler } from '@ultra-dex/dexgraph';

const args = process.argv.slice(2);
const command = args[0];
const file = args[1];

function printUsage() {
  console.log(`
DexGraph CLI

Usage:
  dexgraph run <workflow.yaml>     Execute a workflow
  dexgraph validate <workflow.yaml> Validate a workflow definition
  dexgraph version                  Show version

Examples:
  npx @ultra-dex/dexgraph run workflow.yaml
  npx @ultra-dex/dexgraph validate workflow.yaml
`);
}

function printVersion() {
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
  console.log(pkg.version);
}

async function runWorkflow(filepath) {
  if (!filepath) {
    console.error('Error: missing workflow file');
    process.exit(1);
  }

  const absolute = path.resolve(filepath);
  if (!fs.existsSync(absolute)) {
    console.error(`Error: file not found: ${filepath}`);
    process.exit(1);
  }

  console.log(`\n🚀 Running workflow: ${filepath}\n`);

  const parsed = parse(absolute);
  const graph = new DexGraph();
  for (const node of parsed.nodes) graph.addNode(node);
  for (const edge of parsed.edges) graph.addEdge(edge);

  const executionOrder = computeExecutionOrder(graph);
  console.log('Execution order:', executionOrder.join(' → '));

  function computeExecutionOrder(g) {
    const visited = new Set();
    const order = [];
    function visit(nodeId) {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      for (const dep of g.getDependencies(nodeId)) {
        visit(dep);
      }
      order.push(nodeId);
    }
    for (const node of g.getAllNodes()) {
      visit(node.id);
    }
    return order;
  }

  // Simple built-in mock adapter for CLI demo
  const mockAdapter = {
    name: () => 'MockAdapter',
    async run(ctx) {
      await new Promise((r) => setTimeout(r, 100));
      return {
        status: 'SUCCESS',
        output: { result: `Executed ${ctx.nodeId}`, input: ctx.input },
        logs: [`Mock execution of ${ctx.nodeId}`],
        cost: { tokens: 10, estimatedUSD: 0.001, provider: 'mock' },
        confidence: 0.95,
        duration: 100,
        timestamp: new Date().toISOString(),
      };
    },
    async cancel() {},
    async status() {
      return { running: false, progress: 100 };
    },
  };

  const scheduler = new Scheduler(
    graph,
    {
      dispatch: (node) =>
        mockAdapter.run({
          nodeId: node.id,
          taskType: node.role,
          input: { prompt: node.instruction, context: node.context },
          timeout: 30000,
        }),
    },
    { maxRetries: 1, timeoutMs: 30000, onFailure: 'halt' }
  );

  const result = await scheduler.run();

  console.log('\n✅ Workflow Complete\n');
  console.log('Nodes succeeded:', result.completedNodes.join(', ') || 'none');
  console.log('Nodes failed:', result.failedNodes.join(', ') || 'none');
  console.log('Duration:', result.duration, 'ms\n');
}

function validateWorkflow(filepath) {
  if (!filepath) {
    console.error('Error: missing workflow file');
    process.exit(1);
  }

  const absolute = path.resolve(filepath);
  if (!fs.existsSync(absolute)) {
    console.error(`Error: file not found: ${filepath}`);
    process.exit(1);
  }

  try {
    parse(absolute);
    console.log(`\n✅ ${filepath} is valid\n`);
  } catch (err) {
    console.error(`\n❌ Validation failed: ${err.message}\n`);
    process.exit(1);
  }
}

switch (command) {
  case 'run':
    runWorkflow(file).catch((err) => {
      console.error('\n❌ Error:', err.message);
      process.exit(1);
    });
    break;
  case 'validate':
    validateWorkflow(file);
    break;
  case 'version':
  case '-v':
  case '--version':
    printVersion();
    break;
  case 'help':
  case '-h':
  case '--help':
  default:
    printUsage();
    break;
}
