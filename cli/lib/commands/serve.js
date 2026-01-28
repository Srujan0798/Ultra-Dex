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
            '/agents/:name',
            '/swarm',
            '/score',
            '/rules'
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

      // Endpoint: /score (Alignment Score)
      if (pathname === '/score') {
         // Placeholder logic - real implementation would check 'diff' status
         const score = Math.floor(Math.random() * 30) + 70; // Mock score 70-100
         res.writeHead(200, { 'Content-Type': 'application/json' });
         res.end(JSON.stringify({ score, timestamp: Date.now() }));
         return;
      }

      // Endpoint: /rules (Cursor Rules)
      if (pathname === '/rules') {
        const rules = await glob('cursor-rules/*.mdc');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ rules: rules.map(r => path.basename(r)) }));
        return;
      }

      // Endpoint: /rule/:name (Get specific rule content)
      if (pathname.startsWith('/rule/')) {
        const ruleName = pathname.split('/')[2];
        const rulePath = path.join(process.cwd(), 'cursor-rules', ruleName.endsWith('.mdc') ? ruleName : `${ruleName}.mdc`);
        try {
          const content = await fs.readFile(rulePath, 'utf8');
          res.writeHead(200, { 'Content-Type': 'text/markdown' });
          res.end(content);
        } catch (e) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Rule ${ruleName} not found` }));
        }
        return;
      }

      // Endpoint: /agents (List all agents with metadata)
      if (pathname === '/agents' && req.method === 'GET') {
        try {
          const agentCategories = await fs.readdir(path.join(process.cwd(), 'agents'));
          const agents = [];
          
          for (const category of agentCategories) {
            if (category.startsWith('.') || category.endsWith('.md')) continue;
            const categoryPath = path.join(process.cwd(), 'agents', category);
            const stat = await fs.stat(categoryPath);
            if (!stat.isDirectory()) continue;
            
            const files = await fs.readdir(categoryPath);
            for (const file of files) {
              if (!file.endsWith('.md')) continue;
              const filePath = path.join(categoryPath, file);
              const content = await fs.readFile(filePath, 'utf8');
              const lines = content.split('\n');
              const title = lines.find(l => l.startsWith('# '))?.replace('# ', '') || file.replace('.md', '');
              
              agents.push({
                name: file.replace('.md', ''),
                category,
                title,
                path: `agents/${category}/${file}`
              });
            }
          }
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ count: agents.length, agents }, null, 2));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
        return;
      }

      // Endpoint: /verify (Run verification check)
      if (pathname === '/verify' && req.method === 'POST') {
        try {
          const state = await loadState();
          const checks = {
            stateExists: !!state,
            contextExists: await fs.access(path.join(process.cwd(), 'CONTEXT.md')).then(() => true).catch(() => false),
            agentsExist: await fs.access(path.join(process.cwd(), 'agents')).then(() => true).catch(() => false),
            rulesExist: await fs.access(path.join(process.cwd(), 'cursor-rules')).then(() => true).catch(() => false),
          };
          
          const passed = Object.values(checks).filter(Boolean).length;
          const total = Object.keys(checks).length;
          const score = Math.round((passed / total) * 100);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            status: passed === total ? 'pass' : 'partial',
            score,
            checks,
            timestamp: Date.now()
          }, null, 2));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
        return;
      }

      // Endpoint: /swarm (Execute Swarm)
      if (pathname === '/swarm' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
           try {
             const { task, parallel } = JSON.parse(body);
             if (!task) throw new Error('Task is required');
             
             // Run swarm in background (fire and forget for HTTP response)
             swarmCommand(task, { parallel, dryRun: false }).catch(err => console.error(err));
             
             res.writeHead(202, { 'Content-Type': 'application/json' });
             res.end(JSON.stringify({ status: 'accepted', message: 'Swarm started' }));
           } catch (e) {
             res.writeHead(400, { 'Content-Type': 'application/json' });
             res.end(JSON.stringify({ error: e.message }));
           }
        });
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
  
  // Initialize WebSocket Server
  const wss = new UltraDexSocket(server);

  server.listen(port, () => {
    console.log(chalk.green(`✅ Server running at http://localhost:${port}`));
    console.log(chalk.cyan(`   • Plan:    http://localhost:${port}/plan`));
    console.log(chalk.cyan(`   • State:   http://localhost:${port}/state`));
    console.log(chalk.cyan(`   • Context: http://localhost:${port}/context`));
    console.log(chalk.cyan(`   • Stream:  ws://localhost:${port}/stream`));

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
          
          // Broadcast update via WebSocket
          wss.sendStateUpdate(state);
        }
      } catch (e) {
        // silent fail for watcher
      }
    });
  });
}