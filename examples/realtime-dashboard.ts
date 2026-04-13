/**
 * Real-time Dashboard Integration Example
 *
 * Shows how to wire up WebSocket server with workflow execution
 * for live dashboard updates.
 */

import { ExecutionEngine } from '../runtime/execution_engine/index.js';
import { MockAdapter } from '../adapters/mockAdapter.js';
import { startDashboardServer, DashboardEvent } from '../observability/webSocketServer.js';
import { getGlobalLogger } from '../observability/logger.js';

const logger = getGlobalLogger();

async function main() {
  // 1. Start WebSocket server for dashboard
  logger.info('Starting dashboard WebSocket server...');
  const wsServer = await startDashboardServer({
    port: 8080,
    host: 'localhost',
  });

  logger.info(`Dashboard server running on ws://localhost:8080`);
  logger.info('Open dashboard in browser to see real-time updates');

  // 2. Create execution engine with event forwarding
  const adapter = new MockAdapter();
  const engine = new ExecutionEngine(adapter);

  // 3. Forward engine events to WebSocket clients
  engine.events.on('workflow.started', (event) => {
    wsServer.broadcast({
      type: 'workflow.started',
      timestamp: new Date().toISOString(),
      workflowId: event.workflowId,
      data: {
        totalNodes: event.totalNodes,
        workflowName: event.workflowName,
      },
    });
  });

  engine.events.on('task.started', (event) => {
    wsServer.broadcast({
      type: 'task.started',
      timestamp: event.timestamp,
      workflowId: event.workflowId,
      taskId: event.taskId,
      data: {
        agentType: event.agentType,
      },
    });
  });

  engine.events.on('task.completed', (event) => {
    wsServer.broadcast({
      type: 'task.completed',
      timestamp: event.timestamp,
      workflowId: event.workflowId,
      taskId: event.taskId,
      data: {
        cost: event.cost,
        durationMs: event.durationMs,
      },
    });
  });

  engine.events.on('workflow.completed', (event) => {
    wsServer.broadcast({
      type: 'workflow.completed',
      timestamp: event.timestamp,
      workflowId: event.workflowId,
      data: {
        status: event.status,
        totalCost: event.totalCost,
        durationMs: event.durationMs,
        completedNodes: event.completedNodes,
        failedNodes: event.failedNodes,
      },
    });
  });

  // 4. Send periodic metrics updates
  setInterval(() => {
    wsServer.broadcast({
      type: 'metrics.update',
      timestamp: new Date().toISOString(),
      data: {
        connectedClients: wsServer.getClientCount(),
        serverTime: Date.now(),
      },
    });
  }, 5000);

  logger.info('Event forwarding configured');
  logger.info('Execute a workflow to see real-time updates in dashboard');

  // 5. Run a sample workflow
  logger.info('Running sample workflow...');
  
  try {
    const result = await engine.run('./test-workflow.dex');
    logger.info('Workflow completed', { status: result.success });
  } catch (error) {
    logger.error('Workflow failed', error as Error);
  }

  // Keep server running
  logger.info('Dashboard server still running. Press Ctrl+C to stop.');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };
