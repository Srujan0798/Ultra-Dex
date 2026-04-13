/**
 * ultradex inspect <workflowId> [--json]
 *
 * Deep inspection: full graph topology, per-node execution history,
 * cost breakdown, and performance metrics.
 */

import { WorkflowStore } from '../../memory/workflowStore.js';
import { c, stateColor, hr, elapsedMs } from '../utils/display.js';

const STORE_DIR = '.ultra-dex/workflows';

export interface InspectOptions {
  json?: boolean;
}

export async function runInspect(workflowId: string, opts: InspectOptions): Promise<void> {
  const store = await WorkflowStore.create({ basePath: STORE_DIR });

  await store.loadWorkflow(workflowId);
  const wf = store.getWorkflow(workflowId);
  await store.close();

  if (!wf) {
    process.stderr.write(`${c.red('Error:')} Workflow not found: ${workflowId}\n`);
    process.exit(1);
  }

  if (opts.json) {
    const out = {
      ...wf,
      nodes: Object.fromEntries(wf.nodes),
      nodeHistory: Object.fromEntries(wf.nodeHistory),
    };
    process.stdout.write(JSON.stringify(out, null, 2) + '\n');
    return;
  }

  const nodes = Array.from(wf.nodes.values());

  process.stdout.write(`\n`);
  process.stdout.write(`  ${c.bold('Workflow:')} ${wf.workflowId}\n`);
  process.stdout.write(`  Created: ${c.gray(new Date(wf.createdAt).toLocaleString())}\n`);
  process.stdout.write(`  Updated: ${c.gray(new Date(wf.updatedAt).toLocaleString())}\n`);
  process.stdout.write(`  Status:  ${stateColor(wf.status)}\n\n`);

  // ── Node details ─────────────────────────────────────────────────────────────
  process.stdout.write(`  ${c.bold('Nodes')}\n${hr()}\n`);

  for (const node of nodes) {
    const history = wf.nodeHistory.get(node.nodeId) ?? [];
    process.stdout.write(
      `  ${c.bold(node.nodeId)} ${c.gray('·')} ${node.taskType} ${c.gray('·')} ${stateColor(node.state)}\n`,
    );

    if (node.error) {
      process.stdout.write(`    ${c.red('Error:')} ${node.error}\n`);
    }

    if (node.executedAt) {
      process.stdout.write(`    ${c.gray('Executed:')} ${new Date(node.executedAt).toLocaleString()}\n`);
    }

    if (history.length > 0) {
      process.stdout.write(`    ${c.gray('Execution history:')}\n`);
      for (const entry of history) {
        const status = entry.status === 'SUCCESS' ? c.green(entry.status) : c.red(entry.status);
        process.stdout.write(
          `      Attempt ${entry.attempt}: ${status} · ${elapsedMs(entry.duration)} · ` +
          `$${entry.cost.estimatedUSD.toFixed(4)} via ${entry.cost.provider}\n`,
        );
        if (entry.error) {
          process.stdout.write(`        ${c.red('Error:')} ${entry.error}\n`);
        }
      }
    }
  }

  process.stdout.write(`${hr()}\n\n`);

  // ── Metrics ──────────────────────────────────────────────────────────────────
  process.stdout.write(`  ${c.bold('Metrics')}\n`);
  process.stdout.write(`  Total cost:     $${wf.metrics.totalCost.estimatedUSD.toFixed(4)} (${wf.metrics.totalCost.tokens} tokens)\n`);
  process.stdout.write(`  Total duration: ${elapsedMs(wf.metrics.totalDuration)}\n`);
  process.stdout.write(`  Success/Fail:   ${c.green(String(wf.metrics.successCount))} / ${c.red(String(wf.metrics.failureCount))}\n\n`);
}
