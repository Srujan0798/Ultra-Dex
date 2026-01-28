/**
 * ultra-dex dashboard command
 * Local web dashboard for monitoring Ultra-Dex projects (GOD MODE)
 */

import chalk from 'chalk';
import http from 'http';
import fs from 'fs/promises';
import { execSync, spawn } from 'child_process';
import { loadState } from './plan.js';
import { buildGraph } from '../utils/graph.js';

// Global clients for SSE
const clients = new Set();

function sendToClients(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => client.res.write(payload));
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

function generateDashboardHTML(state, gitInfo, graphSummary) {
  const phasesHTML = state.phases.map(phase => {
    const statusClass = phase.status;
    const progress = (phase.steps.filter(s => s.status === 'completed').length / phase.steps.length) * 100;
    
    return `
      <div class="card phase-card ${statusClass}">
        <div class="phase-header">
            <h3>${phase.name}</h3>
            <span class="status-badge">${phase.status.replace('_', ' ')}</span>
        </div>
        <div class="progress-mini"><div class="fill" style="width: ${progress}%"></div></div>
        <ul class="steps">
          ${phase.steps.map(step => `
            <li class="${step.status}">
              <span class="dot"></span>
              ${step.task}
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }).join('');

  const agentsHTML = state.agents.registry.map(agent => `
    <div class="agent-pill ${state.agents.active.includes(agent) ? 'active' : ''}">
      @${agent}
    </div>
  `).join('');

  const graphStats = graphSummary ? `
    <div class="panel graph-panel">
      > neural_link: ACTIVE
      <br>> context_nodes: ${graphSummary.nodes}
      <br>> dependency_edges: ${graphSummary.edges}
      <br>> graph_integrity: 100%
    </div>
  ` : `
    <div class="panel graph-panel" style="color: #666">
      > neural_link: OFFLINE
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ULTRA-DEX KERNEL • ${state.project.name}</title>
  <style>
    :root {
      --bg: #09090b;
      --card: #18181b;
      --accent: #06b6d4;
      --text: #fafafa;
      --text-dim: #a1a1aa;
      --success: #22c55e;
      --warning: #eab308;
      --pending: #3f3f46;
      --danger: #ef4444;
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Inter', system-ui, sans-serif;
      padding: 2rem;
      line-height: 1.5;
    }
    .header { margin-bottom: 3rem; border-left: 4px solid var(--accent); padding-left: 1.5rem; }
    .header h1 { font-size: 2.5rem; letter-spacing: -0.05em; text-transform: uppercase; }
    .header p { color: var(--text-dim); font-family: monospace; }

    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; }
    
    .card {
      background: var(--card);
      border: 1px solid #27272a;
      border-radius: 0.75rem;
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .phase-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .status-badge { font-size: 0.65rem; text-transform: uppercase; background: #27272a; padding: 2px 8px; border-radius: 4px; color: var(--text-dim); }
    
    .phase-card.completed { border-color: var(--success); }
    .phase-card.completed .status-badge { color: var(--success); border: 1px solid var(--success); }
    .phase-card.in_progress { border-color: var(--accent); }
    .phase-card.in_progress .status-badge { color: var(--accent); border: 1px solid var(--accent); }

    .progress-mini { height: 4px; background: #27272a; border-radius: 2px; margin-bottom: 1.5rem; }
    .progress-mini .fill { height: 100%; background: var(--accent); border-radius: 2px; }

    .steps { list-style: none; }
    .steps li { font-size: 0.9rem; color: var(--text-dim); margin-bottom: 0.75rem; display: flex; align-items: center; }
    .steps li.completed { color: var(--text); }
    .steps li.completed .dot { background: var(--success); box-shadow: 0 0 8px var(--success); }
    .steps li .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--pending); margin-right: 12px; }

    .agent-grid { margin-top: 2rem; display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .agent-pill { 
        background: #27272a; padding: 4px 12px; border-radius: 99px; font-size: 0.8rem; font-family: monospace; color: var(--text-dim);
        border: 1px solid transparent;
    }
    .agent-pill.active { background: rgba(6, 182, 212, 0.1); border-color: var(--accent); color: var(--accent); }

    .control-panel {
      margin-top: 3rem;
      padding: 1.5rem;
      background: rgba(6, 182, 212, 0.05);
      border: 1px solid var(--accent);
      border-radius: 0.75rem;
    }
    .control-header { display: flex; justify-content: space-between; margin-bottom: 1rem; }
    .input-group { display: flex; gap: 1rem; }
    input[type="text"] {
      flex: 1;
      background: #000;
      border: 1px solid #333;
      padding: 0.75rem 1rem;
      color: #fff;
      border-radius: 0.5rem;
      font-family: monospace;
    }
    button {
      background: var(--accent);
      color: #000;
      border: none;
      padding: 0 1.5rem;
      border-radius: 0.5rem;
      font-weight: bold;
      cursor: pointer;
      text-transform: uppercase;
      font-size: 0.8rem;
    }
    button:hover { opacity: 0.9; }
    button:disabled { background: #333; color: #666; cursor: not-allowed; }

    .panels { display: flex; gap: 1rem; margin-top: 3rem; }
    .panel { flex: 1; padding: 1rem; background: #000; border-radius: 0.5rem; font-family: monospace; font-size: 0.8rem; }
    .git-panel { color: #22c55e; }
    .graph-panel { color: #06b6d4; }
    
    .glitch { position: absolute; top:0; right:0; padding: 0.5rem; font-size: 0.7rem; color: #333; }
    
    .live-indicator { 
      position: fixed; bottom: 1rem; right: 1rem; font-size: 0.6rem; color: var(--accent); font-family: monospace;
      display: flex; align-items: center; gap: 0.5rem;
    }
    .pulse { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
  </style>
</head>
<body>
  <div id="dashboard-root">
    <div class="header">
      <h1>${state.project.name} <small style="font-size: 0.4em; vertical-align: middle; color: var(--accent)">GOD MODE</small></h1>
      <p>KERNEL v${state.project.version} • LOCALHOST:${gitInfo.branch} • ${new Date().toLocaleTimeString()}</p>
    </div>

    <div class="control-panel">
      <div class="control-header">
        <h3>🚀 SWARM COMMAND CENTER</h3>
        <span id="swarm-status" style="font-family: monospace; color: var(--text-dim)">IDLE</span>
      </div>
      <div class="input-group">
        <input type="text" id="swarm-input" placeholder="Enter objective (e.g., 'Build user profile page')..." />
        <button id="swarm-btn" onclick="startSwarm()">DEPLOY AGENTS</button>
      </div>
    </div>

    <div class="grid" style="margin-top: 2rem">
      ${phasesHTML}
    </div>

    <div class="agent-grid">
      <span style="color: var(--text-dim); font-size: 0.8rem; margin-right: 1rem; align-self: center">AGENT REGISTRY:</span>
      ${agentsHTML}
    </div>

    <div class="panels">
      <div class="panel git-panel">
        > git status: ${gitInfo.changedFiles} files pending
        <br>> last_commit: ${gitInfo.lastCommit}
        <br>> system_status: active_kernel_running
      </div>
      ${graphStats}
    </div>
  </div>

  <div class="live-indicator">
    <div class="pulse"></div>
    REAL-TIME NEURAL LINK ACTIVE
  </div>

  <div class="glitch">SECURE_PROTOCOL_ACTIVE</div>

  <script>
    // 2026 Real-time Sync Logic (SSE)
    const evtSource = new EventSource("/events");
    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'update') {
        console.log('Neural link update received');
        window.location.reload();
      }
    };
    evtSource.onerror = (err) => {
      console.error("EventSource failed:", err);
    };

    async function startSwarm() {
      const input = document.getElementById('swarm-input');
      const btn = document.getElementById('swarm-btn');
      const status = document.getElementById('swarm-status');
      
      const objective = input.value.trim();
      if (!objective) return;

      btn.disabled = true;
      btn.innerText = "DEPLOYING...";
      status.innerText = "INITIATING_SWARM_PROTOCOL...";
      status.style.color = "var(--accent)";

      try {
        const res = await fetch('/api/swarm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feature: objective })
        });
        
        const data = await res.json();
        
        if (data.success) {
          status.innerText = "SWARM_ACTIVE";
          status.style.color = "var(--success)";
          input.value = "";
          alert("Swarm Deployed! Check your terminal for live logs.");
        } else {
          status.innerText = "DEPLOYMENT_FAILED";
          status.style.color = "var(--danger)";
          alert("Error: " + data.error);
        }
      } catch (e) {
        status.innerText = "CONNECTION_ERROR";
        status.style.color = "var(--danger)";
        alert("Connection Error");
      } finally {
        btn.disabled = false;
        btn.innerText = "DEPLOY AGENTS";
      }
    }
  </script>
</body>
</html>`;
}

export function registerDashboardCommand(program) {
  program
    .command('dashboard')
    .description('Start the Ultra-Dex JARVIS Dashboard')
    .option('-p, --port <port>', 'Port to listen on', '3002')
    .action(async (options) => {
      const port = parseInt(options.port);
      console.log(chalk.bold.cyan('\n🖥️  Starting God Mode Dashboard...'));
      
      console.log(chalk.gray('Initializing Neural Link (Graph Scan)...'));
      let graphSummary = null;
      try {
        const graph = await buildGraph();
        graphSummary = { nodes: graph.nodes.length, edges: graph.edges.length };
        console.log(chalk.green(`✅ Neural Link Established: ${graph.nodes.length} nodes mapped.`));
      } catch (e) {
        console.log(chalk.yellow('⚠️ Neural Link Warning: ' + e.message));
      }

      const server = http.createServer(async (req, res) => {
        // Handle SSE
        if (req.url === '/events') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          });
          const client = { res };
          clients.add(client);
          req.on('close', () => clients.delete(client));
          return;
        }

        // Handle API: Swarm Trigger
        if (req.url === '/api/swarm' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk.toString());
          req.on('end', async () => {
            try {
              const { feature } = JSON.parse(body);
              console.log(chalk.magenta(`\n⚡ Dashboard Trigger: Starting Swarm for "${feature}"...`));
              
              // We run this async so we don't block the response
              // Use npx to spawn autonomous process detached
              const child = spawn('npx', ['ultra-dex', 'auto-implement', feature], {
                stdio: 'inherit',
                shell: true,
                detached: true 
              });
              child.unref(); 

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Swarm initiated' }));
            } catch (e) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: e.message }));
            }
          });
          return;
        }

        const state = await loadState();
        const gitInfo = await getGitInfo();
        const html = generateDashboardHTML(state, gitInfo, graphSummary);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      });

      server.listen(port, () => {
        console.log(chalk.green(`✅ Dashboard active at http://localhost:${port}`));
      });
    });
}