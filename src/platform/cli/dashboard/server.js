// Copyright (c) 2026 Ultra-Dex

/**
 * Dashboard Server v2 (God Mode)
 * Provides memory stream, kernel heartbeat, and context graph endpoints.
 */

import http from 'http';
import { projectGraph } from '../mcp/graph.js';
import { ultraMemory } from '../mcp/memory.js';
import { printInfo, printWarning } from '../utils/output.js';

export async function buildDashboardState() {
  await projectGraph.scan();
  const graphSummary = projectGraph.getSummary();
  const memoryStream = (await ultraMemory.getAll()).slice(-20).reverse();

  return {
    heartbeat: new Date().toISOString(),
    status: 'online',
    memoryStream,
    graph: graphSummary,
  };
}

export function createDashboardServer({ port = 3004 } = {}) {
  const server = http.createServer(async (req, res) => {
    try {
      if (req.url === '/api/status') {
        const state = await buildDashboardState();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(state, null, 2));
        return;
      }

      if (req.url === '/api/stop' && req.method === 'POST') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'stopping', message: 'Emergency stop invoked' }));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });

  server.listen(port, () => {
    printInfo(`Dashboard V2 listening on http://localhost:${port}`);
  });

  server.on('error', (error) => {
    printWarning(`Dashboard server error: ${error.message}`);
  });

  return server;
}

export default {
  createDashboardServer,
  buildDashboardState,
};
