import chalk from 'chalk';
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { loadState, generateMarkdown } from './plan.js';
import { startMcpServer } from '../mcp/server.js';
import { projectGraph } from '../mcp/graph.js';
import { UltraDexSocket } from '../mcp/websocket.js';
import { swarmCommand } from './swarm.js';
import { glob } from 'glob';
import { execSync, spawn } from 'child_process';
import { getRandomMessage } from '../utils/messages.js';

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
          await startMcpServer();
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

// Re-using dashboard HTML generation logic (modularized)
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
          version: '3.4.0',
          status: 'online',
          endpoints: ['/api/state', '/api/plan', '/api/context', '/api/graph', '/api/swarm']
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

      // SSE Events for Dashboard
      if (pathname === '/events') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          });
          res.write(`data: ${JSON.stringify({ type: 'log', message: 'Connected to Multiverse Kernel' })}\n\n`);
          // We'd need to manage clients here if we wanted to push updates
          return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found in this timeline' }));

    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });
  
  const wss = new UltraDexSocket(server);

  server.listen(port, () => {
    console.log(chalk.green(`✅ Portal Stabilized at http://localhost:${port}`));
    console.log(chalk.gray(`   • Dashboard: http://localhost:${port}/`));
    console.log(chalk.gray(`   • MCP API:   http://localhost:${port}/api/info`));
    
    console.log(chalk.bold.hex('#dc2626')('\n🔌 Weapon Integration (IDE):'));
    console.log(chalk.white('   Cursor IDE: '));
    console.log(chalk.cyan(`     URL: http://localhost:${port}/api/info`));
    console.log(chalk.white('   Claude Desktop:'));
    console.log(chalk.cyan(`     Run "ultra-dex config --mcp" to register.`));

    // Auto-Pilot
    fs.watch(process.cwd(), { recursive: true }, async (eventType, filename) => {
      if (!filename || filename.includes('node_modules') || filename.includes('.git') || filename.includes('IMPLEMENTATION-PLAN.md')) return;
      
      console.log(chalk.gray(`\n🔄 Timeline Shift detected in ${filename}. Synchronizing...`));
      try {
        const state = await loadState();
        if (state) {
            const markdown = generateMarkdown(state);
            await fs.writeFile(path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md'), markdown);
            wss.sendStateUpdate(state);
        }
      } catch (e) {}
    });
  });
}