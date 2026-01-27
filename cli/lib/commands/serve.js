import chalk from 'chalk';
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { readFileSafe } from '../utils/files.js';

// State management helpers
async function loadState() {
  try {
    const content = await fs.readFile(path.resolve(process.cwd(), '.ultra/state.json'), 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function computeState() {
  const state = {
    version: '2.1.0',
    updatedAt: new Date().toISOString(),
    project: { name: path.basename(process.cwd()) },
    files: {},
    sections: { total: 34, completed: 0, list: [] },
    score: 0
  };

  const coreFiles = ['CONTEXT.md', 'IMPLEMENTATION-PLAN.md', 'CHECKLIST.md', 'QUICK-START.md'];
  for (const file of coreFiles) {
    try {
      const stat = await fs.stat(path.resolve(process.cwd(), file));
      state.files[file] = { exists: true, size: stat.size };
    } catch {
      state.files[file] = { exists: false };
    }
  }

  try {
    const plan = await fs.readFile(path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md'), 'utf8');
    const sectionRegex = /^##\s+(\d+)\.\s+(.+)$/gm;
    let match;
    while ((match = sectionRegex.exec(plan)) !== null) {
      state.sections.list.push({ number: parseInt(match[1]), title: match[2].trim() });
    }
    state.sections.completed = state.sections.list.length;
  } catch { /* no plan */ }

  const fileScore = Object.values(state.files).filter(f => f.exists).length / coreFiles.length * 40;
  const sectionScore = state.sections.completed / state.sections.total * 60;
  state.score = Math.round(fileScore + sectionScore);

  return state;
}

const BUILD_AGENTS = [
  { name: 'planner', tier: 'architect', task: 'Break down requirements into tasks' },
  { name: 'cto', tier: 'architect', task: 'Technical decisions & architecture' },
  { name: 'backend', tier: 'core', task: 'API, business logic, services' },
  { name: 'frontend', tier: 'core', task: 'UI components, pages, styling' },
  { name: 'database', tier: 'core', task: 'Schema design, migrations, queries' },
  { name: 'auth', tier: 'specialist', task: 'Authentication & authorization' },
  { name: 'security', tier: 'specialist', task: 'Security audit & hardening' },
  { name: 'testing', tier: 'specialist', task: 'Test strategy & implementation' },
  { name: 'reviewer', tier: 'quality', task: 'Code review & best practices' },
  { name: 'devops', tier: 'quality', task: 'CI/CD, deployment, infrastructure' }
];

export function registerServeCommand(program) {
  program
    .command('serve')
    .description('Serve Ultra-Dex context over HTTP (MCP-compatible)')
    .option('-p, --port <port>', 'Port to listen on', '3001')
    .action(async (options) => {
      const port = Number.parseInt(options.port, 10);
      if (Number.isNaN(port)) {
        console.log(chalk.red('Invalid port. Use a numeric value.'));
        process.exit(1);
      }

      const server = http.createServer(async (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        if (!req.url || req.url === '/') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            name: 'Ultra-Dex MCP Server',
            version: '2.1.0',
            endpoints: ['/context', '/state', '/score', '/agents', '/agent/:name', '/refresh']
          }));
          return;
        }

        if (req.url === '/context') {
          const meta = {
            protocol: 'mcp-lite',
            version: '0.1',
            generatedAt: new Date().toISOString(),
          };
          const [context, plan, quickStart] = await Promise.all([
            readFileSafe('CONTEXT.md', 'CONTEXT.md'),
            readFileSafe('IMPLEMENTATION-PLAN.md', 'IMPLEMENTATION-PLAN.md'),
            readFileSafe('QUICK-START.md', 'QUICK-START.md'),
          ]);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ meta, files: [context, plan, quickStart] }));
          return;
        }

        // /state - returns .ultra/state.json
        if (req.url === '/state') {
          let state = await loadState();
          if (!state) state = await computeState();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(state));
          return;
        }

        // /score - quick alignment score
        if (req.url === '/score') {
          const state = await computeState();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ score: state.score, sections: state.sections.completed, total: 34 }));
          return;
        }

        // /agents - list available agents
        if (req.url === '/agents') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ agents: BUILD_AGENTS }));
          return;
        }

        // /agent/:name - get specific agent prompt
        if (req.url.startsWith('/agent/')) {
          const agentName = req.url.replace('/agent/', '');
          try {
            const agentPath = path.resolve(process.cwd(), `agents/${agentName}.md`);
            const content = await fs.readFile(agentPath, 'utf8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ agent: agentName, prompt: content }));
          } catch {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Agent ${agentName} not found` }));
          }
          return;
        }

        // /refresh - force state refresh
        if (req.url === '/refresh') {
          const state = await computeState();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ refreshed: true, score: state.score }));
          return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      });

      server.listen(port, () => {
        console.log(chalk.green(`\n✅ Ultra-Dex MCP server running on http://localhost:${port}`));
        console.log(chalk.bold('\n📡 Endpoints:'));
        console.log(chalk.gray('  GET /          → Server info & endpoint list'));
        console.log(chalk.gray('  GET /context   → All context files'));
        console.log(chalk.gray('  GET /state     → Full project state'));
        console.log(chalk.gray('  GET /score     → Quick alignment score'));
        console.log(chalk.gray('  GET /agents    → List available agents'));
        console.log(chalk.gray('  GET /agent/:n  → Get specific agent prompt'));
        console.log(chalk.gray('  GET /refresh   → Force state refresh'));
        console.log(chalk.cyan('\n💡 Connect your AI tool to this server for live context.\n'));
      });
    });
}
