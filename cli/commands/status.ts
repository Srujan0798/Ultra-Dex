/**
 * ultradex status [workflowId] [--json]
 *
 * Shows current state of one workflow, or a summary table of all workflows.
 */

import { WorkflowStore } from '../../memory/workflowStore.js';
import type { WorkflowMemory } from '../../memory/workflowStore.js';
import { c, stateColor, pad, hr, elapsedMs } from '../utils/display.js';

const STORE_DIR = '.ultra-dex/workflows';

export interface StatusOptions {
  json?: boolean;
}

export async function runStatus(workflowId: string | undefined, opts: StatusOptions): Promise<void> {
  const store = await WorkflowStore.create({ basePath: STORE_DIR });

  if (workflowId) {
    await store.loadWorkflow(workflowId);
    const wf = store.getWorkflow(workflowId);
    if (!wf) {
      process.stderr.write(`${c.red('Error:')} Workflow not found: ${workflowId}\n`);
      process.exit(1);
    }

    if (opts.json) {
      const out = { ...wf, nodes: Object.fromEntries(wf.nodes), nodeHistory: Object.fromEntries(wf.nodeHistory) };
      process.stdout.write(JSON.stringify(out, null, 2) + '\n');
      return;
    }

    printWorkflowStatus(wf);
    return;
  }

  // List all
  const workflows = await store.loadAllWorkflows();
  await store.close();

  if (workflows.length === 0) {
    process.stdout.write(`${c.gray('No workflows found in ' + STORE_DIR)}\n`);
    return;
  }

  process.stdout.write(`\n${hr()}\n`);
  process.stdout.write(
    `  ${c.bold(pad('ID', 36))} ${c.bold(pad('STATUS', 12))} ${c.bold(pad('NODES', 8))} ${c.bold('UPDATED')}\n`,
  );
  process.stdout.write(`${hr()}\n`);

  for (const wf of workflows) {
    const nodeCount = wf.nodes.size;
    const successCount = Array.from(wf.nodes.values()).filter(n => n.state === 'SUCCESS').length;
    const updated = new Date(wf.updatedAt).toLocaleString();
    process.stdout.write(
      `  ${pad(wf.workflowId, 36)} ${pad(stateColor(wf.status), 20)} ${pad(`${successCount}/${nodeCount}`, 8)} ${c.gray(updated)}\n`,
    );
  }
  process.stdout.write(`${hr()}\n\n`);
}

function printWorkflowStatus(wf: WorkflowMemory): void {
  const nodes = Array.from(wf.nodes.values());
  const successCount = nodes.filter(n => n.state === 'SUCCESS').length;
  const failedCount = nodes.filter(n => n.state === 'FAILED').length;
  const pct = nodes.length > 0 ? Math.round((successCount / nodes.length) * 100) : 0;

  process.stdout.write(`\n`);
  process.stdout.write(`  ${c.bold('Workflow:')} ${wf.workflowId}\n`);
  process.stdout.write(`  Status:   ${stateColor(wf.status)}\n`);
  process.stdout.write(`  Progress: ${successCount}/${nodes.length} nodes (${pct}%)\n`);
  process.stdout.write(`  Cost:     $${wf.metrics.totalCost.estimatedUSD.toFixed(4)} · ${wf.metrics.totalCost.tokens} tokens\n`);
  process.stdout.write(`  Duration: ${elapsedMs(wf.metrics.totalDuration)}\n\n`);
  process.stdout.write(`${hr()}\n`);
  process.stdout.write(
    `  ${c.bold(pad('NODE', 24))} ${c.bold(pad('TYPE', 12))} ${c.bold(pad('STATE', 14))} ${c.bold('DURATION')}\n`,
  );
  process.stdout.write(`${hr()}\n`);

  for (const node of nodes) {
    const dur = node.duration ? elapsedMs(node.duration) : c.gray('—');
    process.stdout.write(
      `  ${pad(node.nodeId, 24)} ${pad(node.taskType, 12)} ${pad(stateColor(node.state), 22)} ${dur}\n`,
    );
  }
  process.stdout.write(`${hr()}\n`);

  if (failedCount > 0) {
    process.stdout.write(`\n  ${c.red(`${failedCount} node(s) failed. Run 'ultradex resume ${wf.workflowId}' to retry.`)}\n`);
  }
  process.stdout.write('\n');
}
