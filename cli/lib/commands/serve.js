import chalk from 'chalk';
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { loadState, generateMarkdown } from './plan.js';
import { createMcpServer, startStdioServer } from '../mcp/server.js';
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { projectGraph } from '../mcp/graph.js';
import { webSocketServer } from '../mcp/websocket.js';
import { swarmCommand } from './swarm.js';
import { execSync } from 'child_process';
import { getRandomMessage } from '../utils/messages.js';
import { VERSION } from '../utils/version.js';

export function registerServeCommand(program) {
  program
    .command('serve')
    .description('Open the Multiverse Portal (Active Kernel)')
    .option('-p, --port <port>', 'Port to listen on', '3001')
    .option('--stdio', 'Run in Stdio mode (MCP Standard Only)', false)
    .action(async (options) => {
      if (options.stdio) {
        // Run only MCP Stdio server
        try {
          await startStdioServer();
        } catch (error) {
          console.error("Failed to start MCP Server:", error);
          process.exit(1);
        }
      } else {
        // Run full Unified Kernel (HTTP + WebSocket + Dashboard + MCP over HTTP)
        await startUnifiedKernel(options.port);
      }
    });
}

async function getGitInfo() {
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    const lastCommit = execSync('git log -1 --format="%h %s" 2>/dev/null', { encoding: 'utf8' }).trim();
    const status = execSync('git status --porcelain 2>/dev/null', { encoding: 'utf8' });
    const changedFiles = status.split('\n').filter(l => l.trim()).length;
    return { branch, lastCommit, changedFiles };
  } catch {
    return { branch: 'unknown', lastCommit: 'N/A', changedFiles: 0 };
  }
}

async function getDashboardHTML() {
  const { generateDashboardHTML } = await import('./dashboard.js');
  const state = await loadState();
  const gitInfo = await getGitInfo();
  await projectGraph.scan();
  const summary = projectGraph.getSummary();
  return generateDashboardHTML(state, gitInfo, { nodes: summary.nodeCount, edges: summary.edgeCount });
}

async function startUnifiedKernel(portStr) {
  const port = Number.parseInt(portStr, 10);
      
  console.log(chalk.bold.hex('#7c3aed')('\n🚀 Opening Multiverse Portal (Infinity Kernel)...\n'));
  console.log(chalk.italic(chalk.gray(`"${getRandomMessage('loading')}"`)));

  // Initialize Graph
  console.log(chalk.gray('🧠 Linking Neural Interface (Code Graph)...'));
  try {
    await projectGraph.scan();
    console.log(chalk.green(`✅ Graph stabilized: ${projectGraph.nodes.size} nodes`));
  } catch (e) {
    console.log(chalk.yellow(`⚠️ Graph alignment failed: ${e.message}`));
  }

  // Initialize MCP Server (The Brain)
  const mcpServer = createMcpServer();
  // Map to store transports for SSE
  // Key: sessionId (string), Value: SSEServerTransport
  // Note: SSEServerTransport doesn't expose a session ID easily, so we might need a simple array or map if we had to route messages back.
  // But for simple Request/Response in MCP via SSE, the transport handles it.
  // We just need to route the incoming POST to the correct transport.
  // Since Http is stateless, we rely on the `transport` instance being closure-bound to the `res` of the `/sse` connection?
  // No, POST /messages needs to find the correct transport.
  // The SDK's SSEServerTransport expects to handle the message.
  // Limitation: The current basic HTTP server implementation makes it hard to route POST /messages to the specific SSE connection without a Session ID.
  // Standard MCP over SSE:
  // 1. GET /sse -> Establishes connection, returns a session UUID in the event stream (endpoint event).
  // 2. POST /messages?sessionId=UUID -> Client sends message.
  // We need to implement this logic manually if using raw Node HTTP.

  const transports = new Map(); // sessionId -> transport

  const server = http.createServer(async (req, res) => {
    // CORS headers for local tools
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    try {
      // --- MCP SSE Endpoints ---

      // 1. GET /sse -> Start Session
      if (pathname === '/sse') {
        const transport = new SSEServerTransport("/messages", res);

        // This 'start' method generates a session ID and sends the 'endpoint' event
        await mcpServer.connect(transport);

        // We need to capture the session ID.
        // The SSEServerTransport stores it as `sessionId`.
        // However, `sessionId` property might be private or protected?
        // Checking SDK source (mental check): it is usually public or accessible.
        // Assuming transport.sessionId is available after start.
        if (transport.sessionId) {
            transports.set(transport.sessionId, transport);
        }

        // Cleanup on close
        res.on('close', () => {
             if (transport.sessionId) transports.delete(transport.sessionId);
        });
        return;
      }

      // 2. POST /messages -> Handle incoming JSON-RPC
      if (pathname === '/messages') {
        const sessionId = url.searchParams.get('sessionId');
        if (!sessionId) {
            res.writeHead(400);
            res.end("Missing sessionId");
            return;
        }

        const transport = transports.get(sessionId);
        if (!transport) {
            res.writeHead(404);
            res.end("Session not found");
            return;
        }

        // Delegate to transport
        await transport.handlePostMessage(req, res);
        return;
      }

      // --- Dashboard & API ---

      // Dashboard UI
      if (pathname === '/' || pathname === '/dashboard') {
        const html = await getDashboardHTML();
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
        return;
      }

      // Endpoint: /api/info
      if (pathname === '/api/info') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          name: 'Ultra-Dex Multiverse Kernel',
          version: VERSION,
          status: 'online',
          mcp: 'enabled',
          endpoints: ['/sse', '/messages', '/api/state', '/api/graph']
        }, null, 2));
        return;
      }

      // Endpoint: /api/graph
      if (pathname === '/api/graph' || pathname === '/graph') {
        const summary = projectGraph.getSummary();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(summary, null, 2));
        return;
      }

      // Endpoint: /api/state
      if (pathname === '/api/state' || pathname === '/state') {
        const state = await loadState();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(state, null, 2));
        return;
      }

      // Endpoint: /api/swarm (Execute Swarm)
      if ((pathname === '/api/swarm' || pathname === '/swarm') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
           try {
             const { task, feature, parallel } = JSON.parse(body);
             const objective = task || feature;
             if (!objective) throw new Error('Task/Feature objective is required');
             
             // Run swarm
             swarmCommand(objective, { parallel, dryRun: false }).catch(err => console.error(err));
             
             res.writeHead(202, { 'Content-Type': 'application/json' });
             res.end(JSON.stringify({ status: 'accepted', message: 'Swarm initiated' }));
           } catch (e) {
             res.writeHead(400, { 'Content-Type': 'application/json' });
             res.end(JSON.stringify({ error: e.message }));
           }
        });
        return;
      }

      // Endpoint: /api/plan
      if (pathname === '/api/plan' || pathname === '/plan') {
        const state = await loadState();
        const markdown = generateMarkdown(state);
        res.writeHead(200, { 'Content-Type': 'text/markdown' });
        res.end(markdown);
        return;
      }

      // SSE Events for Dashboard (Separate from MCP SSE)
      if (pathname === '/events') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          });
          res.write(`data: ${JSON.stringify({ type: 'log', message: 'Connected to Multiverse Kernel' })}\n\n`);
          return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found in this timeline' }));

    } catch (error) {
      console.error(error);
      if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
      }
    }
  });
  
  // Use the singleton instance
  const wss = webSocketServer;
  await wss.start({ port: 3002 });

  // Store watcher reference for cleanup
  let fileWatcher = null;

  server.listen(port, () => {
    console.log(chalk.green(`✅ Portal Stabilized at http://localhost:${port}`));
    console.log(chalk.gray(`   • Dashboard: http://localhost:${port}/`));
    console.log(chalk.gray(`   • MCP SSE:   http://localhost:${port}/sse`));

    console.log(chalk.bold.hex('#dc2626')('\n🔌 Weapon Integration (IDE):'));
    console.log(chalk.white('   Cursor IDE: '));
    console.log(chalk.cyan(`     Connect via MCP to http://localhost:${port}/sse`));
    console.log(chalk.white('   Claude Desktop:'));
    console.log(chalk.cyan(`     Run "ultra-dex config --mcp" to register.`));

    // Auto-Pilot with proper cleanup
    fileWatcher = fs.watch(process.cwd(), { recursive: true }, async (eventType, filename) => {
      if (!filename || filename.includes('node_modules') || filename.includes('.git') || filename.includes('IMPLEMENTATION-PLAN.md')) return;

      try {
        const state = await loadState();
        if (state) {
            wss.broadcast({ type: 'state_update', data: state, timestamp: new Date().toISOString() });
        }
      } catch (e) {}
    });
  });

  // Cleanup on process exit
  const cleanup = () => {
    if (fileWatcher) {
      fileWatcher.close();
      fileWatcher = null;
    }
    wss.stop();
    server.close();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}
