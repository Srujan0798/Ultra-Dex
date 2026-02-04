import chalk from 'chalk';
import http from 'http';
import fs from 'fs/promises';
import { loadState, generateMarkdown } from './plan.js';
import { createMcpServer, startStdioServer } from '../mcp/server.js';
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { projectGraph } from '../mcp/graph.js';
import { webSocketServer } from '../mcp/websocket.js';
import { swarmCommand } from './swarm.js';
import { execSync } from 'child_process';
import { getRandomMessage } from '../utils/messages.js';
import { VERSION } from '../utils/version.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { AppError, ValidationError } from '../utils/errors.js';

/**
 * Register the serve command with Commander
 * @param {Command} program Commander program instance
 */
export function registerServeCommand(program) {
  program
    .command('serve')
    .description('Open the Multiverse Portal (Active Kernel)')
    .option('-p, --port <port>', 'Port to listen on', '3001')
    .option('--stdio', 'Run in Stdio mode (MCP Standard Only)', false)
    .action(async (options) => {
      try {
        if (options.stdio) {
          return await handleStdioServer();
        } else {
          return await startUnifiedKernel(options.port);
        }
      } catch (error) {
        await handleError(error, { command: 'serve', options });
        process.exit(error.exitCode || 1);
      }
    });
}

/**
 * Handle MCP Stdio server mode
 */
async function handleStdioServer() {
  try {
    printInfo('Starting MCP Stdio server...');
    await startStdioServer();
  } catch (error) {
    throw new AppError('Failed to start MCP Stdio Server', { cause: error });
  }
}

/**
 * Get git information for the dashboard
 */
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

/**
 * Generate dashboard HTML
 */
async function getDashboardHTML() {
  const { generateDashboardHTML } = await import('./dashboard.js');
  const state = await loadState();
  const gitInfo = await getGitInfo();
  await projectGraph.scan();
  const summary = projectGraph.getSummary();
  return generateDashboardHTML(state, gitInfo, { nodes: summary.nodeCount, edges: summary.edgeCount });
}

/**
 * Start the full unified kernel (HTTP + WebSocket + Dashboard + MCP SSE)
 * @param {string} portStr Port to listen on
 */
async function startUnifiedKernel(portStr) {
  const port = Number.parseInt(portStr, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new ValidationError(`Invalid port: ${portStr}. Port must be between 1 and 65535.`);
  }
      
  printInfo('\n🚀 Opening Multiverse Portal (Infinity Kernel)...\n');
  printInfo(chalk.italic(chalk.gray(`"${getRandomMessage('loading')}"`)));

  // Initialize Graph
  printInfo('🧠 Linking Neural Interface (Code Graph)...');
  try {
    await projectGraph.scan();
    printSuccess(`✅ Graph stabilized: ${projectGraph.nodes.size} nodes`);
  } catch (e) {
    printWarning(`⚠️ Graph alignment failed: ${e.message}`);
  }

  // Initialize MCP Server (The Brain)
  const mcpServer = createMcpServer();
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
        await mcpServer.connect(transport);

        if (transport.sessionId) {
            transports.set(transport.sessionId, transport);
        }

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
            res.end(JSON.stringify({ error: "Missing sessionId" }));
            return;
        }

        const transport = transports.get(sessionId);
        if (!transport) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: "Session not found" }));
            return;
        }

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

      // API Routes
      if (handleApiRoutes(req, res, pathname, url)) return;

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found in this timeline' }));

    } catch (error) {
      printError(error);
      if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
      }
    }
  });
  
  // Use the singleton instance
  const wss = webSocketServer;
  try {
    await wss.start({ port: port + 1 }); // Use next port for WebSocket

    // Add logging for WebSocket connections
    if (wss.wss) {
      wss.wss.on('connection', (ws, request) => {
        printInfo(`WebSocket client connected: ${request.socket.remoteAddress}`);

        ws.on('close', () => {
          printInfo(`WebSocket client disconnected: ${request.socket.remoteAddress}`);
        });

        ws.on('error', (error) => {
          printError(`WebSocket error for client ${request.socket.remoteAddress}: ${error.message}`);
        });
      });
    }

    printInfo(`WebSocket server listening on port ${port + 1}`);
  } catch (error) {
    printWarning(`⚠️ Could not start WebSocket server on ${port + 1}: ${error.message}`);
  }

  // Store watcher reference for cleanup
  let fileWatcher = null;

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      handleError(new AppError(`Port ${port} is already in use`, { code: 'EADDRINUSE' }));
      process.exit(1);
    } else {
      handleError(e);
    }
  });

  server.listen(port, () => {
    printSuccess(`✅ Portal Stabilized at http://localhost:${port}`);
    printInfo(`   • Dashboard: http://localhost:${port}/`);
    printInfo(`   • MCP SSE:   http://localhost:${port}/sse`);

    printInfo('\n🔌 Weapon Integration (IDE):');
    printInfo(chalk.white('   Cursor IDE: '));
    printInfo(`     Connect via MCP to http://localhost:${port}/sse`);
    printInfo(chalk.white('   Claude Desktop:'));
    printInfo(`     Run "ultra-dex config --mcp" to register.`);

    // Auto-Pilot with proper cleanup
    fileWatcher = fs.watch(process.cwd(), { recursive: true }, async (eventType, filename) => {
      if (!filename || filename.includes('node_modules') || filename.includes('.git') || filename.includes('IMPLEMENTATION-PLAN.md')) return;

      try {
        const state = await loadState();
        if (state) {
            wss.broadcast({ type: 'state_update', data: state, timestamp: new Date().toISOString() });
        }
      } catch (e) {
        // Silent watch failure to avoid spamming console
      }
    });
  });

  // Cleanup on process exit
  const cleanup = () => {
    printInfo('\nClosing Multiverse Portal...');
    if (fileWatcher) {
      fileWatcher.close();
      fileWatcher = null;
    }
    wss.stop();
    server.close();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

/**
 * Handle API routes separately for cleaner code
 */
function handleApiRoutes(req, res, pathname, url) {
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
      return true;
    }

    // Endpoint: /api/graph
    if (pathname === '/api/graph' || pathname === '/graph') {
      const summary = projectGraph.getSummary();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(summary, null, 2));
      return true;
    }

    // Endpoint: /api/state
    if (pathname === '/api/state' || pathname === '/state') {
      loadState().then(state => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(state, null, 2));
      }).catch(e => {
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      });
      return true;
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

           swarmCommand(objective, { parallel, dryRun: false }).catch(err => printError(err));

           res.writeHead(202, { 'Content-Type': 'application/json' });
           res.end(JSON.stringify({ status: 'accepted', message: 'Swarm initiated' }));
         } catch (e) {
           res.writeHead(400, { 'Content-Type': 'application/json' });
           res.end(JSON.stringify({ error: e.message }));
         }
      });
      return true;
    }

    // Endpoint: /api/plan
    if (pathname === '/api/plan' || pathname === '/plan') {
      loadState().then(state => {
        const markdown = generateMarkdown(state);
        res.writeHead(200, { 'Content-Type': 'text/markdown' });
        res.end(markdown);
      });
      return true;
    }

    // Dashboard SSE & Monitoring
    if (pathname === '/events') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });
        res.write(`data: ${JSON.stringify({ type: 'log', message: 'Connected to Multiverse Kernel' })}\n\n`);
        return true;
    }

    // Broadcast relay endpoints
    if (['/api/autonomous/status', '/api/log', '/api/agent/status'].includes(pathname) && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const typeMap = {
                    '/api/autonomous/status': 'autonomous_update',
                    '/api/log': 'log',
                    '/api/agent/status': 'agent_status'
                };
                webSocketServer.broadcast({
                    type: typeMap[pathname],
                    ...data,
                    timestamp: new Date().toISOString()
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return true;
    }

    return false;
}