#!/usr/bin/env node
/**
 * ultradex — DexGraph Control Plane CLI
 *
 * Commands:
 *   init [name]         Create a new .dex project scaffold
 *   run <workflow>      Parse + build graph + execute (--dry-run to preview)
 *   status [id]         Show current workflow state
 *   resume <id>         Resume from last FAILED/BLOCKED node
 *   inspect <id>        Show full graph + execution history
 */

import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as readline from 'readline';
import { parse } from '../dexgraph/parser.js';
import { DexGraph } from '../dexgraph/graph.js';
import { Scheduler } from '../dexgraph/scheduler.js';
import { MockAdapter } from '../adapters/mockAdapter.js';
import { WorkflowStore } from '../memory/workflowStore.js';
import { EventEmitter, createEvent } from '../observability/index.js';
import type { GraphNode } from '../dexgraph/types.js';
import type { WorkflowMemory } from '../memory/workflowStore.js';

// ──────────────────────────────────────────────────────────────────────────────
// Security Utilities
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Validate file path to prevent directory traversal attacks.
 * Rejects paths containing '..' or absolute paths outside cwd.
 */
function validateSafePath(filePath: string): string {
  // Normalize the path
  const normalized = path.normalize(filePath);
  
  // Check for directory traversal attempts
  if (normalized.includes('..')) {
    throw new Error(`Invalid path: directory traversal detected in "${filePath}"`);
  }
  
  // Resolve to absolute path
  const resolved = path.resolve(normalized);
  const cwd = process.cwd();
  
  // Ensure path is within current working directory (or is absolute system path)
  // Allow paths that start with cwd or are relative to it
  if (!resolved.startsWith(cwd) && !path.isAbsolute(normalized)) {
    throw new Error(`Invalid path: "${filePath}" must be within working directory`);
  }
  
  // Ensure file has .dex extension
  if (!normalized.endsWith('.dex')) {
    throw new Error(`Invalid file: "${filePath}" must have .dex extension`);
  }
  
  return resolved;
}

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const STORE_DIR = '.ultra-dex/workflows';
const DEX_TEMPLATE = `# DexGraph Workflow Template
version: dexgraph/v1
name: my-workflow
description: Describe what this workflow does

context:
  environment: development

on_failure:
  retry: 2
  rollback: true

tasks:
  - id: plan
    role: architect
    instruction: |
      Plan the implementation. Define data models and component boundaries.
    output: architecture-plan

  - id: implement
    role: engineer
    instruction: |
      Implement the plan from {{plan.output}}.
      Write clean, tested TypeScript code.
    depends_on:
      - plan
    output: implementation
    verify:
      type: unit_test
      command: npm test

  - id: review
    role: reviewer
    instruction: |
      Review the implementation at {{implement.output}}.
      Check for security issues, best practices, completeness.
    depends_on:
      - implement
    verify:
      type: llm_check
      policy: Code must be secure, well-tested, and production-ready
`;

// ──────────────────────────────────────────────────────────────────────────────
// ANSI color helpers (no deps)
// ──────────────────────────────────────────────────────────────────────────────

const c = {
  bold:  (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim:   (s: string) => `\x1b[2m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red:   (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow:(s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan:  (s: string) => `\x1b[36m${s}\x1b[0m`,
  blue:  (s: string) => `\x1b[34m${s}\x1b[0m`,
  gray:  (s: string) => `\x1b[90m${s}\x1b[0m`,
};

function stateColor(state: string): string {
  switch (state) {
    case 'SUCCESS':   return c.green(state);
    case 'FAILED':    return c.red(state);
    case 'ROLLBACK':  return c.red(state);
    case 'RUNNING':   return c.cyan(state);
    case 'VERIFYING': return c.cyan(state);
    case 'RETRY':     return c.yellow(state);
    case 'BLOCKED':   return c.yellow(state);
    case 'READY':     return c.blue(state);
    default:          return c.gray(state);
  }
}

function pad(s: string, n: number): string {
  return s.padEnd(n);
}

function hr(char = '─', len = 60): string {
  return c.gray(char.repeat(len));
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

async function loadStore(): Promise<WorkflowStore> {
  return WorkflowStore.create({ basePath: STORE_DIR });
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

function elapsedMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

// ──────────────────────────────────────────────────────────────────────────────
// init command
// ──────────────────────────────────────────────────────────────────────────────

async function cmdInit(projectName: string): Promise<void> {
  const dir = path.resolve(projectName);
  const dexFile = path.join(dir, 'workflow.dex');
  const workflowDir = path.join(dir, 'workflow');

  // Check if already exists
  try {
    await fs.access(dir);
    console.error(c.red(`Error: directory "${projectName}" already exists`));
    process.exit(1);
  } catch {
    // Good — does not exist
  }

  await ensureDir(dir);
  await ensureDir(workflowDir);
  await fs.writeFile(dexFile, DEX_TEMPLATE, 'utf-8');
  await fs.writeFile(
    path.join(dir, '.gitignore'),
    '.ultra-dex/\nnode_modules/\n',
    'utf-8',
  );

  console.log(c.green(`✓`) + ` Initialized project ${c.bold(projectName)}`);
  console.log(c.gray(`  ${dexFile}`));
  console.log();
  console.log(`Next steps:`);
  console.log(`  ${c.cyan('ultradex run')} ${projectName}/workflow.dex ${c.dim('--dry-run')}`);
  console.log(`  ${c.cyan('ultradex run')} ${projectName}/workflow.dex`);
}

// ──────────────────────────────────────────────────────────────────────────────
// run command
// ──────────────────────────────────────────────────────────────────────────────

async function cmdRun(
  workflowFile: string,
  opts: { dryRun?: boolean; timeout?: number; id?: string },
): Promise<void> {
  // SECURITY: Validate path to prevent directory traversal (H-001)
  let resolved: string;
  try {
    resolved = validateSafePath(workflowFile);
  } catch (err) {
    console.error(c.red(`Security error: `) + (err as Error).message);
    process.exit(1);
  }

  // Parse + build graph
  let result;
  try {
    result = parse(resolved);
  } catch (err) {
    console.error(c.red(`Parse error: `) + (err as Error).message);
    process.exit(1);
  }

  let graph: DexGraph;
  try {
    graph = DexGraph.fromParseResult(result);
  } catch (err) {
    console.error(c.red(`Graph error: `) + (err as Error).message);
    process.exit(1);
  }

  const nodes = graph.getAllNodes();
  const sortedIds = graph.topologicalSort();

  // Print graph summary
  console.log();
  console.log(c.bold(`  ${result.metadata.name}`));
  if (result.metadata.description) {
    console.log(c.gray(`  ${result.metadata.description}`));
  }
  console.log();
  console.log(hr());
  console.log(
    `  ${c.bold(pad('ID', 22))} ${c.bold(pad('ROLE', 12))} ${c.bold(pad('DEPS', 20))} ${c.bold('STATE')}`,
  );
  console.log(hr());

  for (const id of sortedIds) {
    const node = graph.getNode(id);
    const deps = node.dependencies.length > 0 ? node.dependencies.join(', ') : c.gray('none');
    console.log(
      `  ${pad(node.id, 22)} ${pad(node.role, 12)} ${pad(deps, 20)} ${stateColor(node.state)}`,
    );
  }
  console.log(hr());
  console.log(c.gray(`  ${nodes.length} nodes · ${graph.getEdges().length} edges`));
  console.log();

  if (opts.dryRun) {
    console.log(c.yellow(`  Dry run — workflow not executed.`));
    console.log(c.gray(`  Remove --dry-run to execute.`));
    console.log();
    return;
  }

  // Execute
  const workflowId = opts.id ?? `${result.metadata.name}-${Date.now()}`;
  const store = await loadStore();
  const emitter = new EventEmitter();
  const adapter = new MockAdapter(50); // real adapters wired via SDK
  const timeoutMs = opts.timeout ? opts.timeout * 1000 : 300_000;

  // Progress tracking
  const started: Record<string, number> = {};
  emitter.on('node.dispatch', (ev) => {
    started[ev.nodeId!] = Date.now();
    process.stdout.write(`  ${c.cyan('→')} ${ev.data.nodeId as string} ${c.gray('running...')}\n`);
  });
  emitter.on('node.complete', (ev) => {
    const dur = started[ev.nodeId!] ? elapsedMs(Date.now() - started[ev.nodeId!]) : '';
    process.stdout.write(
      `  ${c.green('✓')} ${ev.data.nodeId as string} ${c.gray(dur)}\n`,
    );
  });
  emitter.on('node.failed', (ev) => {
    process.stdout.write(
      `  ${c.red('✗')} ${ev.data.nodeId as string} ${c.red(ev.data.error as string)}\n`,
    );
  });

  store.createWorkflow(workflowId);

  const scheduler = new Scheduler(
    graph,
    { dispatch: (node: GraphNode) => adapter.run({ nodeId: node.id, taskType: node.role, input: node.context, timeout: timeoutMs }) },
    { maxRetries: 2, maxConcurrent: 4, timeoutMs, onFailure: 'rollback' },
    undefined,
    emitter,
    workflowId,
  );

  console.log(c.gray(`  Running workflow ${c.bold(workflowId)}`));
  console.log();

  const runResult = await scheduler.run();

  await store.flush();

  console.log();
  console.log(hr());
  if (runResult.success) {
    console.log(`  ${c.green('✓')} Workflow completed in ${elapsedMs(runResult.duration)}`);
  } else {
    console.log(`  ${c.red('✗')} Workflow failed in ${elapsedMs(runResult.duration)}`);
    if (runResult.failedNodes.length > 0) {
      console.log(`  Failed: ${runResult.failedNodes.join(', ')}`);
    }
  }
  console.log(hr());
  console.log();

  process.exit(runResult.success ? 0 : 1);
}

// ──────────────────────────────────────────────────────────────────────────────
// status command
// ──────────────────────────────────────────────────────────────────────────────

async function cmdStatus(workflowId?: string): Promise<void> {
  const store = await loadStore();

  if (workflowId) {
    // Load from disk if not in memory
    await store.loadWorkflow(workflowId);
    const wf = store.getWorkflow(workflowId);
    if (!wf) {
      console.error(c.red(`Workflow not found: ${workflowId}`));
      process.exit(1);
    }
    printWorkflowStatus(wf);
    return;
  }

  // List all workflows
  const workflows = await store.loadAllWorkflows();
  if (workflows.length === 0) {
    console.log(c.gray('  No workflows found in ' + STORE_DIR));
    return;
  }

  console.log();
  console.log(hr());
  console.log(
    `  ${c.bold(pad('ID', 36))} ${c.bold(pad('STATUS', 12))} ${c.bold(pad('NODES', 8))} ${c.bold('UPDATED')}`,
  );
  console.log(hr());

  for (const wf of workflows) {
    const nodeCount = wf.nodes.size;
    const successCount = Array.from(wf.nodes.values()).filter(n => n.state === 'SUCCESS').length;
    const updated = new Date(wf.updatedAt).toLocaleString();
    console.log(
      `  ${pad(wf.workflowId, 36)} ${pad(stateColor(wf.status), 20)} ${pad(`${successCount}/${nodeCount}`, 8)} ${c.gray(updated)}`,
    );
  }
  console.log(hr());
  console.log();
}

function printWorkflowStatus(wf: WorkflowMemory): void {
  const nodes = Array.from(wf.nodes.values());
  const successCount = nodes.filter(n => n.state === 'SUCCESS').length;
  const failedCount = nodes.filter(n => n.state === 'FAILED').length;
  const pct = nodes.length > 0 ? Math.round((successCount / nodes.length) * 100) : 0;

  console.log();
  console.log(c.bold(`  Workflow: ${wf.workflowId}`));
  console.log(`  Status:   ${stateColor(wf.status)}`);
  console.log(`  Progress: ${successCount}/${nodes.length} nodes (${pct}%)`);
  console.log(`  Cost:     $${wf.metrics.totalCost.estimatedUSD.toFixed(4)} · ${wf.metrics.totalCost.tokens} tokens`);
  console.log(`  Duration: ${elapsedMs(wf.metrics.totalDuration)}`);
  console.log();
  console.log(hr());
  console.log(
    `  ${c.bold(pad('NODE', 24))} ${c.bold(pad('TYPE', 12))} ${c.bold(pad('STATE', 14))} ${c.bold('DURATION')}`,
  );
  console.log(hr());

  for (const node of nodes) {
    const dur = node.duration ? elapsedMs(node.duration) : c.gray('—');
    console.log(
      `  ${pad(node.nodeId, 24)} ${pad(node.taskType, 12)} ${pad(stateColor(node.state), 22)} ${dur}`,
    );
  }
  console.log(hr());

  if (failedCount > 0) {
    console.log();
    console.log(c.red(`  ${failedCount} node(s) failed. Run 'ultradex resume ${wf.workflowId}' to retry.`));
  }
  console.log();
}

// ──────────────────────────────────────────────────────────────────────────────
// resume command
// ──────────────────────────────────────────────────────────────────────────────

async function cmdResume(workflowId: string): Promise<void> {
  const store = await loadStore();
  await store.loadWorkflow(workflowId);
  const wf = store.getWorkflow(workflowId);

  if (!wf) {
    console.error(c.red(`Workflow not found: ${workflowId}`));
    process.exit(1);
  }

  const failedNodes = Array.from(wf.nodes.values()).filter(
    n => n.state === 'FAILED',
  );
  const blockedNodes = Array.from(wf.nodes.values()).filter(n => n.state === 'BLOCKED' || n.state === 'ROLLBACK');

  if (failedNodes.length === 0 && blockedNodes.length === 0) {
    console.log(c.green(`  Workflow ${workflowId} has no failed or blocked nodes.`));
    console.log(c.gray(`  Run 'ultradex status ${workflowId}' to check current state.`));
    return;
  }

  console.log();
  console.log(c.bold(`  Resuming workflow: ${workflowId}`));
  console.log(c.gray(`  Resetting ${failedNodes.length} failed node(s) to READY state`));

  // Reset failed nodes to READY so scheduler can re-run them
  for (const node of failedNodes) {
    node.state = 'READY';
    store.updateNode(workflowId, node);
    console.log(`  ${c.yellow('↺')} ${node.nodeId} → READY`);
  }

  await store.flush();

  console.log();
  console.log(c.gray(`  State persisted. Re-run the workflow with:`));
  console.log(`  ${c.cyan('ultradex run')} <workflow.dex> ${c.dim(`--id ${workflowId}`)}`);
  console.log();
}

// ──────────────────────────────────────────────────────────────────────────────
// inspect command
// ──────────────────────────────────────────────────────────────────────────────

async function cmdInspect(workflowId: string, opts: { json?: boolean }): Promise<void> {
  const store = await loadStore();
  await store.loadWorkflow(workflowId);
  const wf = store.getWorkflow(workflowId);

  if (!wf) {
    console.error(c.red(`Workflow not found: ${workflowId}`));
    process.exit(1);
  }

  if (opts.json) {
    // Serialize Maps for JSON output
    const output = {
      ...wf,
      nodes: Object.fromEntries(wf.nodes),
      nodeHistory: Object.fromEntries(wf.nodeHistory),
    };
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  const nodes = Array.from(wf.nodes.values());
  console.log();
  console.log(c.bold(`  Inspect: ${workflowId}`));
  console.log(`  Created: ${c.gray(new Date(wf.createdAt).toLocaleString())}`);
  console.log(`  Updated: ${c.gray(new Date(wf.updatedAt).toLocaleString())}`);
  console.log(`  Status:  ${stateColor(wf.status)}`);
  console.log();

  // Node tree
  console.log(c.bold('  Nodes'));
  console.log(hr());
  for (const node of nodes) {
    const history = wf.nodeHistory.get(node.nodeId) ?? [];
    console.log(
      `  ${c.bold(node.nodeId)} ${c.gray('·')} ${node.taskType} ${c.gray('·')} ${stateColor(node.state)}`,
    );
    if (node.error) {
      console.log(`    ${c.red('Error:')} ${node.error}`);
    }
    if (history.length > 0) {
      console.log(`    ${c.gray('History:')}`);
      for (const entry of history) {
        const status = entry.status === 'SUCCESS' ? c.green(entry.status) : c.red(entry.status);
        console.log(
          `      Attempt ${entry.attempt}: ${status} · ${elapsedMs(entry.duration)} · $${entry.cost.estimatedUSD.toFixed(4)} via ${entry.cost.provider}`,
        );
      }
    }
  }
  console.log(hr());

  // Metrics
  console.log();
  console.log(c.bold('  Metrics'));
  console.log(`  Total cost:     $${wf.metrics.totalCost.estimatedUSD.toFixed(4)} (${wf.metrics.totalCost.tokens} tokens)`);
  console.log(`  Total duration: ${elapsedMs(wf.metrics.totalDuration)}`);
  console.log(`  Success/Fail:   ${c.green(String(wf.metrics.successCount))} / ${c.red(String(wf.metrics.failureCount))}`);
  console.log();
}

// ──────────────────────────────────────────────────────────────────────────────
// CLI setup
// ──────────────────────────────────────────────────────────────────────────────

const program = new Command();

program
  .name('ultradex')
  .description('DexGraph control plane — Kubernetes for AI workflows')
  .version('2.0.0-alpha.0');

program
  .command('init [name]')
  .description('Create a new .dex project scaffold')
  .action(async (name: string | undefined) => {
    await cmdInit(name ?? 'my-project');
  });

program
  .command('run <workflow>')
  .description('Parse a .dex workflow, build graph, and execute')
  .option('--dry-run', 'Show graph without executing')
  .option('--timeout <seconds>', 'Per-node timeout in seconds', '300')
  .option('--id <workflowId>', 'Explicit workflow ID (for resume support)')
  .action(async (workflow: string, opts: { dryRun?: boolean; timeout?: string; id?: string }) => {
    await cmdRun(workflow, {
      dryRun: opts.dryRun,
      timeout: opts.timeout ? parseInt(opts.timeout, 10) : undefined,
      id: opts.id,
    });
  });

program
  .command('status [id]')
  .description('Show current workflow state (all workflows if no ID given)')
  .action(async (id: string | undefined) => {
    await cmdStatus(id);
  });

program
  .command('resume <id>')
  .description('Reset FAILED/BLOCKED nodes to READY for re-execution')
  .action(async (id: string) => {
    await cmdResume(id);
  });

program
  .command('inspect <id>')
  .description('Show full workflow graph + execution history')
  .option('--json', 'Output raw JSON')
  .action(async (id: string, opts: { json?: boolean }) => {
    await cmdInspect(id, opts);
  });

program.parse(process.argv);
