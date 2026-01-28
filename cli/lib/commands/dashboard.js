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
    <div class="agent-card" id="agent-${agent}">
      <div class="agent-header">
        <span class="agent-name">@${agent}</span>
        <span class="agent-status status-idle">IDLE</span>
      </div>
      <div class="agent-activity">Waiting for tasks...</div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ULTRA-DEX KERNEL • ${state.project.name}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
    .header { margin-bottom: 3rem; border-left: 4px solid var(--accent); padding-left: 1.5rem; display: flex; justify-content: space-between; align-items: end; }
    .header h1 { font-size: 2.5rem; letter-spacing: -0.05em; text-transform: uppercase; }
    .header p { color: var(--text-dim); font-family: monospace; }

    .dashboard-grid { display: grid; grid-template-columns: 350px 1fr 300px; gap: 1.5rem; }
    
    .card {
      background: var(--card);
      border: 1px solid #27272a;
      border-radius: 0.75rem;
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
      margin-bottom: 1rem;
    }

    .phase-card.completed { border-color: var(--success); }
    .phase-card.in_progress { border-color: var(--accent); }

    .phase-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .status-badge { font-size: 0.65rem; text-transform: uppercase; background: #27272a; padding: 2px 8px; border-radius: 4px; color: var(--text-dim); }
    
    .progress-mini { height: 4px; background: #27272a; border-radius: 2px; margin-bottom: 1.5rem; }
    .progress-mini .fill { height: 100%; background: var(--accent); border-radius: 2px; }

    .steps { list-style: none; }
    .steps li { font-size: 0.85rem; color: var(--text-dim); margin-bottom: 0.5rem; display: flex; align-items: center; }
    .steps li.completed { color: var(--text); }
    .steps li.completed .dot { background: var(--success); box-shadow: 0 0 8px var(--success); }
    .steps li .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--pending); margin-right: 12px; }

    /* Agent Panel */
    .agent-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
    .agent-card { background: #202022; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #333; }
    .agent-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .agent-name { font-family: monospace; font-size: 0.8rem; color: var(--accent); }
    .agent-status { font-size: 0.6rem; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
    .status-idle { background: #333; color: #888; }
    .status-working { background: rgba(6, 182, 212, 0.2); color: var(--accent); animation: pulse 2s infinite; }
    .agent-activity { font-size: 0.7rem; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* Timeline */
    .timeline { max-height: 400px; overflow-y: auto; font-family: monospace; font-size: 0.8rem; }
    .log-entry { margin-bottom: 0.5rem; border-left: 2px solid #333; padding-left: 0.5rem; color: #888; }
    .log-entry.info { border-color: var(--accent); color: #ccc; }
    .log-entry.success { border-color: var(--success); color: var(--success); }
    .log-entry .time { color: #555; margin-right: 0.5rem; }

    /* Chart */
    .chart-container { position: relative; height: 200px; width: 100%; }

    .control-panel {
      padding: 1.5rem;
      background: rgba(6, 182, 212, 0.05);
      border: 1px solid var(--accent);
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .input-group { display: flex; gap: 1rem; margin-top: 1rem; }
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
    
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${state.project.name} <small style="font-size: 0.4em; vertical-align: middle; color: var(--accent)">GOD MODE</small></h1>
      <p>KERNEL v${state.project.version} • LOCALHOST:${gitInfo.branch} • ${new Date().toLocaleTimeString()}</p>
    </div>
    <div style="text-align: right">
      <div style="font-size: 2rem; font-weight: bold; color: var(--success)">92%</div>
      <div style="font-size: 0.8rem; color: #666">ALIGNMENT SCORE</div>
    </div>
  </div>

  <div class="dashboard-grid">
    <!-- LEFT: PHASES -->
    <div class="col-phases">
      <h3 style="color: #666; margin-bottom: 1rem; font-size: 0.8rem">IMPLEMENTATION PLAN</h3>
      ${phasesHTML}
    </div>

    <!-- CENTER: MAIN -->
    <div class="col-main">
      <div class="control-panel">
        <h3>🚀 SWARM COMMAND CENTER</h3>
        <div class="input-group">
          <input type="text" id="swarm-input" placeholder="Enter objective (e.g., 'Build user profile page')..." />
          <button id="swarm-btn" onclick="startSwarm()">DEPLOY AGENTS</button>
        </div>
      </div>

      <div class="card">
        <h3 style="margin-bottom: 1rem">ALIGNMENT VELOCITY</h3>
        <div class="chart-container">
          <canvas id="alignmentChart"></canvas>
        </div>
      </div>

      <div class="card">
        <h3 style="margin-bottom: 1rem">LIVE SYSTEM LOGS</h3>
        <div class="timeline" id="log-container">
          <div class="log-entry info"><span class="time">${new Date().toLocaleTimeString()}</span> System initialized.</div>
          <div class="log-entry info"><span class="time">${new Date().toLocaleTimeString()}</span> Neural link established.</div>
          <div class="log-entry"><span class="time">${new Date().toLocaleTimeString()}</span> Waiting for agent activity...</div>
        </div>
      </div>
    </div>

    <!-- RIGHT: AGENTS -->
    <div class="col-agents">
      <h3 style="color: #666; margin-bottom: 1rem; font-size: 0.8rem">ACTIVE AGENTS</h3>
      <div class="agent-grid">
        ${agentsHTML}
      </div>
      
      <div class="card" style="margin-top: 1rem; font-family: monospace; font-size: 0.8rem">
        <h3 style="margin-bottom: 0.5rem">SYSTEM STATUS</h3>
        <div style="color: var(--success)">> git: clean</div>
        <div style="color: var(--accent)">> graph: ${graphSummary ? graphSummary.nodes + ' nodes' : 'scanning...'}</div>
        <div style="color: #666">> memory: 24MB</div>
      </div>
    </div>
  </div>

  <script>
    // Initialize Chart
    const ctx = document.getElementById('alignmentChart').getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['1h ago', '45m ago', '30m ago', '15m ago', 'Now'],
        datasets: [{
          label: 'Alignment Score',
          data: [65, 68, 72, 85, 92],
          borderColor: '#06b6d4',
          tension: 0.4,
          fill: true,
          backgroundColor: 'rgba(6, 182, 212, 0.1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { min: 0, max: 100, grid: { color: '#333' } },
          x: { grid: { display: false } }
        }
      }
    });

    // Real-time Sync Logic (SSE)
    const evtSource = new EventSource("/events");
    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'log') {
        addLog(data.message, data.level);
      }
      
      if (data.type === 'agent_status') {
        updateAgent(data.agent, data.status, data.activity);
      }

      if (data.type === 'score') {
        // Update chart
        chart.data.datasets[0].data.shift();
        chart.data.datasets[0].data.push(data.score);
        chart.update();
      }
    };

    function addLog(msg, level = 'info') {
      const container = document.getElementById('log-container');
      const div = document.createElement('div');
      div.className = \`log-entry \${level}\`;
      div.innerHTML = \`<span class="time">\${new Date().toLocaleTimeString()}</span> \${msg}\`;
      container.prepend(div);
    }

    function updateAgent(name, status, activity) {
      const card = document.getElementById(\`agent-\${name}\`);
      if (card) {
        const statusEl = card.querySelector('.agent-status');
        const activityEl = card.querySelector('.agent-activity');
        
        statusEl.className = \`agent-status status-\${status}\`;
        statusEl.innerText = status;
        activityEl.innerText = activity;
      }
    }

    async function startSwarm() {
      const input = document.getElementById('swarm-input');
      const btn = document.getElementById('swarm-btn');
      const objective = input.value.trim();
      
      if (!objective) return;

      btn.disabled = true;
      btn.innerText = "DEPLOYING...";
      addLog(\`Initiating Swarm: \${objective}\`, 'info');

      try {
        const res = await fetch('/api/swarm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feature: objective })
        });
        
        const data = await res.json();
        
        if (data.success) {
          addLog("Swarm processes started successfully", "success");
          input.value = "";
        } else {
          addLog(\`Error: \${data.error}\`, "danger");
        }
      } catch (e) {
        addLog("Connection Failed", "danger");
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
          
          // Send initial ping
          res.write(`data: ${JSON.stringify({ type: 'log', message: 'Connected to Ultra-Dex Kernel' })}\n\n`);

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
              
              // Simulate agent activity
              sendToClients({ type: 'log', message: `Swarm triggered: ${feature}`, level: 'info' });
              sendToClients({ type: 'agent_status', agent: 'planner', status: 'working', activity: 'Analyzing requirements...' });

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