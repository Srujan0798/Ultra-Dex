/**
 * ultradex run <workflow.dex> [--dry-run] [--timeout <ms>] [--concurrency <n>]
 *
 * Pipeline: parse → build graph → display plan → execute → persist state
 * Exits 0 on workflow success, 1 on failure.
 */

import { loadDex } from '../loaders/dex-loader.js';
import { Scheduler } from '../../dexgraph/scheduler.js';
import { MockAdapter } from '../../adapters/mockAdapter.js';
import { WorkflowStore } from '../../memory/workflowStore.js';
import { EventEmitter } from '../../observability/index.js';
import { createDexLogger } from '../../dexgraph/logger.js';
import { c, stateColor, pad, hr, elapsedMs } from '../utils/display.js';
import type { GraphNode } from '../../dexgraph/types.js';

const STORE_DIR = '.ultra-dex/workflows';

export interface RunOptions {
  dryRun: boolean;
  timeoutMs: number;
  maxConcurrent: number;
  onFailure: 'halt' | 'continue' | 'rollback';
  workflowId?: string;
}

export async function runWorkflow(workflowFile: string, opts: RunOptions): Promise<void> {
  // ── Load & parse ────────────────────────────────────────────────────────────
  let loaded;
  try {
    loaded = await loadDex(workflowFile);
  } catch (err) {
    process.stderr.write(`${c.red('Error:')} ${(err as Error).message}\n`);
    process.exit(1);
  }

  const { parseResult, graph } = loaded;
  const nodes = graph.getAllNodes();
  const sortedIds = graph.topologicalSort();

  // ── Print execution plan ────────────────────────────────────────────────────
  process.stdout.write(`\n  ${c.bold(parseResult.metadata.name)}\n`);
  if (parseResult.metadata.description) {
    process.stdout.write(`  ${c.gray(parseResult.metadata.description)}\n`);
  }
  process.stdout.write(`\n${hr()}\n`);
  process.stdout.write(
    `  ${c.bold(pad('ID', 22))} ${c.bold(pad('ROLE', 12))} ${c.bold(pad('DEPS', 20))} ${c.bold('STATE')}\n`,
  );
  process.stdout.write(`${hr()}\n`);

  for (const id of sortedIds) {
    const node = graph.getNode(id);
    const deps = node.dependencies.length > 0 ? node.dependencies.join(', ') : c.gray('none');
    process.stdout.write(
      `  ${pad(node.id, 22)} ${pad(node.role, 12)} ${pad(deps, 20)} ${stateColor(node.state)}\n`,
    );
  }
  process.stdout.write(`${hr()}\n`);
  process.stdout.write(`  ${c.gray(`${nodes.length} nodes · ${graph.getEdges().length} edges`)}\n\n`);

  if (opts.dryRun) {
    process.stdout.write(`  ${c.yellow('Dry run — workflow not executed.')}\n`);
    process.stdout.write(`  ${c.gray('Remove --dry-run to execute.')}\n\n`);
    return;
  }

  // ── Execute ─────────────────────────────────────────────────────────────────
  const workflowId = opts.workflowId ?? `${parseResult.metadata.name}-${Date.now()}`;
  const store = await WorkflowStore.create({ basePath: STORE_DIR });
  const emitter = new EventEmitter();
  const adapter = new MockAdapter(50); // swap for real adapter via SDK
  const log = createDexLogger({ component: 'CLI:run', workflowId });

  // Live progress output
  const started: Record<string, number> = {};
  emitter.on('node.dispatch', (ev) => {
    started[ev.nodeId!] = Date.now();
    process.stdout.write(`  ${c.cyan('→')} ${ev.data.nodeId as string}  ${c.gray('running...')}\n`);
  });
  emitter.on('node.complete', (ev) => {
    const dur = started[ev.nodeId!] ? elapsedMs(Date.now() - started[ev.nodeId!]) : '';
    process.stdout.write(`  ${c.green('✓')} ${ev.data.nodeId as string}  ${c.gray(dur)}\n`);
  });
  emitter.on('node.failed', (ev) => {
    process.stdout.write(
      `  ${c.red('✗')} ${ev.data.nodeId as string}  ${c.red(String(ev.data.error))}\n`,
    );
  });

  store.createWorkflow(workflowId);
  log.info('workflow.start', { workflowId, nodeCount: nodes.length });

  process.stdout.write(`  ${c.gray(`Running workflow ${c.bold(workflowId)}`)}\n\n`);

  const scheduler = new Scheduler(
    graph,
    { dispatch: (node: GraphNode) => adapter.run({ nodeId: node.id, taskType: node.role, input: node.context, timeout: opts.timeoutMs }) },
    { maxRetries: 2, maxConcurrent: opts.maxConcurrent, timeoutMs: opts.timeoutMs, onFailure: opts.onFailure },
    undefined,
    emitter,
    workflowId,
  );

  const result = await scheduler.run();
  await store.flush();
  await store.close();

  // ── Result summary ──────────────────────────────────────────────────────────
  process.stdout.write(`\n${hr()}\n`);
  if (result.success) {
    process.stdout.write(`  ${c.green('✓')} Completed in ${elapsedMs(result.duration)}\n`);
    log.info('workflow.complete', { workflowId, duration: result.duration, success: true });
  } else {
    process.stdout.write(`  ${c.red('✗')} Failed in ${elapsedMs(result.duration)}\n`);
    if (result.failedNodes.length > 0) {
      process.stdout.write(`  Failed nodes: ${result.failedNodes.join(', ')}\n`);
    }
    process.stdout.write(`  Run ${c.cyan(`ultradex resume ${workflowId}`)} to retry.\n`);
    log.error('workflow.failed', new Error(`${result.failedNodes.length} node(s) failed`), { workflowId, failedNodes: result.failedNodes });
  }
  process.stdout.write(`${hr()}\n\n`);

  process.exit(result.success ? 0 : 1);
}
