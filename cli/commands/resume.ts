/**
 * ultradex resume <workflowId>
 *
 * Resets FAILED / BLOCKED nodes to READY so the workflow can be re-run from
 * that point without starting over. Persists new state immediately.
 */

import { WorkflowStore } from '../../memory/workflowStore.js';
import { createDexLogger } from '../../dexgraph/logger.js';
import { c } from '../utils/display.js';

const STORE_DIR = '.ultra-dex/workflows';

export async function runResume(workflowId: string): Promise<void> {
  const store = await WorkflowStore.create({ basePath: STORE_DIR });
  const log = createDexLogger({ component: 'CLI:resume', workflowId });

  await store.loadWorkflow(workflowId);
  const wf = store.getWorkflow(workflowId);

  if (!wf) {
    process.stderr.write(`${c.red('Error:')} Workflow not found: ${workflowId}\n`);
    process.exit(1);
  }

  const failedNodes = Array.from(wf.nodes.values()).filter(
    n => n.state === 'FAILED' || n.state === 'BLOCKED' || n.state === 'ROLLBACK',
  );

  if (failedNodes.length === 0) {
    process.stdout.write(`${c.green('✓')} Workflow ${c.bold(workflowId)} has no failed nodes.\n`);
    process.stdout.write(`${c.gray(`  Run 'ultradex status ${workflowId}' to check state.`)}\n`);
    await store.close();
    return;
  }

  process.stdout.write(`\n  ${c.bold(`Resuming: ${workflowId}`)}\n`);
  process.stdout.write(`  ${c.gray(`Resetting ${failedNodes.length} node(s) to READY`)}\n\n`);

  for (const node of failedNodes) {
    node.state = 'READY';
    store.updateNode(workflowId, node);
    process.stdout.write(`  ${c.yellow('↺')} ${node.nodeId}  FAILED → READY\n`);
    log.info('node.reset', { nodeId: node.nodeId });
  }

  await store.flush();
  await store.close();

  process.stdout.write(`\n  ${c.gray('State persisted. Re-run with:')}\n`);
  process.stdout.write(`  ${c.cyan('ultradex run')} <workflow.dex>\n\n`);
}
