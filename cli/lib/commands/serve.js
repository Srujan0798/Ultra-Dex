import chalk from 'chalk';
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { loadState, generateMarkdown } from './plan.js';
import { startMcpServer } from '../mcp/server.js';
import { projectGraph } from '../mcp/graph.js';

export function registerServeCommand(program) {
  program
    .command('serve')
    .description('Start the Ultra-Dex Active Kernel (MCP Server)')
    .option('-p, --port <port>', 'Port to listen on (HTTP mode only)', '3001')
    .option('--http', 'Run in HTTP mode (Dashboard/Legacy)', false)
    .option('--stdio', 'Run in Stdio mode (MCP Standard)', true)
    .action(async (options) => {
      // If --http is explicitly set, run the HTTP server
      if (options.http) {
        await startHttpServer(options.port);
      } else {
        // Default to MCP Stdio server
        try {
          await startMcpServer();
        } catch (error) {
          console.error("Failed to start MCP Server:", error);
          process.exit(1);
        }
      }
    });
}

async function startHttpServer(portStr) {
  const port = Number.parseInt(portStr, 10);
      
  console.log(chalk.bold('\n🚀 Ultra-Dex Active Kernel Starting (HTTP Mode)...\n'));

  // Initialize Graph
  console.log(chalk.gray('Initializing Code Graph...'));
  try {
    await projectGraph.scan();
    console.log(chalk.green(`✅ Graph loaded: ${projectGraph.nodes.size} nodes`));
  } catch (e) {
    console.log(chalk.yellow(`⚠️ Graph init failed: ${e.message}`));
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

    console.log(chalk.gray(`Request: ${req.method} ${pathname}`));

    try {
      // Endpoint: / (Info)
      if (pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          name: 'Ultra-Dex Active Kernel',
          status: 'online',
          mode: 'HTTP_LEGACY',
          endpoints: [
            '/state',
            '/plan',
            '/context',
            '/graph',
            '/agents/:name'
          ]
        }, null, 2));
        return;
      }

      // Endpoint: /graph (Codebase Graph)
      if (pathname === '/graph') {
        const summary = projectGraph.getSummary();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(summary, null, 2));
        return;
      }

      // Endpoint: /state (Raw JSON State)
      if (pathname === '/state') {
        const state = await loadState();
        if (!state) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'State not found' }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(state, null, 2));
        return;
      }

      // Endpoint: /plan (Dynamic Markdown Plan)
      if (pathname === '/plan') {
        const state = await loadState();
        if (!state) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'State not found' }));
          return;
        }
        const markdown = generateMarkdown(state);
        res.writeHead(200, { 'Content-Type': 'text/markdown' });
        res.end(markdown);
        return;
      }

      // Endpoint: /context (Full Context for AI)
      if (pathname === '/context') {
        const state = await loadState();
        const plan = state ? generateMarkdown(state) : '';
        
        // Try to read other context files
        let contextMd = '';
        try {
          contextMd = await fs.readFile(path.resolve(process.cwd(), 'CONTEXT.md'), 'utf8');
        } catch (e) { contextMd = '_No CONTEXT.md found._'; }

        const fullContext = `
# PROJECT CONTEXT
${contextMd}

# LIVE PLAN (Dynamic)
${plan}
        `;
        
        res.writeHead(200, { 'Content-Type': 'text/markdown' });
        res.end(fullContext);
        return;
      }

        // Endpoint: /agents/:name (Get Agent Prompt)
        if (pathname.startsWith('/agents/')) {
        const agentName = pathname.split('/')[2];
        // Search in agents folder recursively (simplified for now)
        // Mapping common names to paths
        const agentMap = {
          'backend': 'agents/2-development/backend.md',
          'frontend': 'agents/2-development/frontend.md',
          'database': 'agents/2-development/database.md',
          'planner': 'agents/1-leadership/planner.md',
          'reviewer': 'agents/5-quality/reviewer.md'
        };

        const agentPath = agentMap[agentName] || `agents/${agentName}.md`;
        
        try {
          const content = await fs.readFile(path.resolve(process.cwd(), agentPath), 'utf8');
          res.writeHead(200, { 'Content-Type': 'text/markdown' });
          res.end(content);
        } catch (e) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Agent ${agentName} not found` }));
        }
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint not found' }));

    } catch (error) {
      console.error(chalk.red('Server Error:'), error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  });

  server.listen(port, () => {
    console.log(chalk.green(`✅ Server running at http://localhost:${port}`));
    console.log(chalk.cyan(`   • Plan:    http://localhost:${port}/plan`));
    console.log(chalk.cyan(`   • State:   http://localhost:${port}/state`));
    console.log(chalk.cyan(`   • Context: http://localhost:${port}/context`));

    // JARVIS Auto-Pilot: Watch for changes and regenerate plan
    console.log(chalk.bold.yellow('\n👁️  Auto-Pilot: Watching for changes...'));
    
    const watchPaths = [process.cwd()];
    const ignoreFiles = ['IMPLEMENTATION-PLAN.md', 'node_modules', '.git'];

    fs.watch(process.cwd(), { recursive: true }, async (eventType, filename) => {
      if (!filename || ignoreFiles.some(f => filename.includes(f))) return;
      if (!filename.endsWith('.md') && !filename.endsWith('.json')) return;

      console.log(chalk.gray(`\n🔄 Change detected in ${filename}. Regenerating plan...`));
      try {
        const state = await loadState();
        if (state) {
          const markdown = generateMarkdown(state);
          await fs.writeFile(path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md'), markdown);
          console.log(chalk.green('✅ Plan updated automatically.'));
        }
      } catch (e) {
        // silent fail for watcher
      }
    });
  });
}