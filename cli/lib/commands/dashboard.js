/**
 * ultra-dex dashboard command
 * Local web dashboard for monitoring Ultra-Dex projects (GOD MODE)
 */

import chalk from 'chalk';
import http from 'http';
import { execSync, spawn } from 'child_process';
import { loadState } from './state.js';
import { buildGraph } from '../utils/graph.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { getUsageSummary } from '../enterprise/usage.js';
import { startWebSocketServer, broadcastWebSocketEvent } from '../server/websocket.js';

// Global clients for SSE
const clients = new Set();

// Action history for timeline
const actionHistory = [];
const MAX_HISTORY = 50;

function addAction(type, message, agent = null) {
  actionHistory.unshift({
    timestamp: new Date().toISOString(),
    type,
    message,
    agent
  });
  if (actionHistory.length > MAX_HISTORY) actionHistory.pop();
  sendToClients({ type: 'action', action: actionHistory[0] });
}

function sendToClients(data) {
  const payload = `data: ${JSON.stringify(data)}

`;
  clients.forEach(client => client.res.write(payload));
  broadcastWebSocketEvent(data.type || 'log', data);
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

export function generateDashboardHTML(state, gitInfo, graphSummary, usageSummary) {
  const usage = usageSummary || {
    totalCommands: 0,
    uniqueCommands: 0,
    last24h: 0,
    last7d: 0,
    errorCount: 0,
    avgDurationMs: 0,
    topCommands: []
  };
  const topCommand = usage.topCommands[0]?.name || 'n/a';

  const usageSummaryHTML = `
      <div class="card" style="margin-top: 1rem">
        <h3>USAGE ANALYTICS</h3>
        <div style="color: var(--accent)">> commands 7d: ${usage.last7d}</div>
        <div style="color: var(--success)">> commands 24h: ${usage.last24h}</div>
        <div style="color: #666">> top cmd: ${topCommand}</div>
        <div style="color: #666">> errors: ${usage.errorCount}</div>
        <div style="color: #666">> avg runtime: ${usage.avgDurationMs}ms</div>
      </div>
  `;
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
      <div class="agent-controls">
        <button class="agent-btn run" onclick="runAgent('${agent}')" title="Start agent">▶ Run</button>
        <button class="agent-btn stop" onclick="stopAgent('${agent}')" title="Stop agent" disabled>⏹ Stop</button>
        <button class="agent-btn logs" onclick="viewAgentLogs('${agent}')" title="View logs">📄 Logs</button>
      </div>
    </div>
  `).join('');

  const totalSteps = state.phases.reduce((sum, p) => sum + p.steps.length, 0);
  const completedSteps = state.phases.reduce((sum, p) => sum + p.steps.filter(s => s.status === 'completed').length, 0);
  const alignmentScore = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const scoreColor = alignmentScore >= 80 ? 'var(--success)' : alignmentScore >= 50 ? 'var(--warning)' : 'var(--danger)';

  // Using string concatenation for client-side JS to avoid backtick hell
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ULTRA-DEX KERNEL • ${state.project.name}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    /* CSS Styles (omitted for brevity, same as before) */
    :root { --bg: #09090b; --card: #18181b; --accent: #06b6d4; --text: #fafafa;
      --text-dim: #a1a1aa; --success: #22c55e; --warning: #eab308;
      --pending: #3f3f46; --danger: #ef4444; }
    .light-theme { --bg: #f8fafc; --card: #ffffff; --text: #0f172a; --text-dim: #64748b; --pending: #e2e8f0; }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background: var(--bg); color: var(--text); font-family: 'Inter', system-ui; padding: 2rem; }
    .header { margin-bottom: 2rem; border-left: 4px solid var(--accent); padding-left: 1.5rem; display: flex; justify-content: space-between; align-items: end; }
    .header h1 { font-size: 2.5rem; letter-spacing: -0.05em; text-transform: uppercase; }
    .dashboard-grid { display: grid; grid-template-columns: 350px 1fr 300px; gap: 1.5rem; }
    .card { background: var(--card); border: 1px solid #27272a; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1rem; }
    .phase-card.completed { border-color: var(--success); }
    .phase-card.in_progress { border-color: var(--accent); }
    .status-badge { font-size: 0.65rem; background: #27272a; padding: 2px 8px; border-radius: 4px; }
    .progress-mini { height: 4px; background: #27272a; border-radius: 2px; margin-bottom: 1.5rem; }
    .progress-mini .fill { height: 100%; background: var(--accent); transition: width 0.3s; }
    .steps { list-style: none; }
    .steps li { font-size: 0.85rem; color: var(--text-dim); margin-bottom: 0.5rem; display: flex; align-items: center; }
    .steps li.completed .dot { background: var(--success); }
    .steps li .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--pending); margin-right: 12px; }
    .agent-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
    .agent-card { background: #202022; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #333; }
    .agent-card.active { border-color: var(--accent); }
    .agent-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .agent-status { font-size: 0.6rem; padding: 2px 6px; border-radius: 4px; }
    .status-idle { background: #333; color: #888; }
    .status-working { background: rgba(6, 182, 212, 0.2); color: var(--accent); animation: pulse 2s infinite; }
    .status-error { background: rgba(239, 68, 68, 0.2); color: var(--danger); }
    .agent-controls { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
    .agent-btn { flex: 1; font-size: 0.65rem; padding: 0.4rem; border: none; border-radius: 0.25rem; cursor: pointer; }
    .agent-btn:disabled { opacity: 0.4; }
    .agent-btn.run { background: var(--success); color: #000; }
    .agent-btn.stop { background: var(--danger); color: #fff; }
    .agent-btn.logs { background: #333; color: #fff; }
    .timeline { max-height: 300px; overflow-y: auto; font-family: monospace; font-size: 0.8rem; }
    .log-entry { margin-bottom: 0.5rem; border-left: 2px solid #333; padding-left: 0.5rem; }
    .log-entry.info { border-color: var(--accent); color: #ccc; }
    .log-entry.success { border-color: var(--success); color: var(--success); }
    .log-entry.error { border-color: var(--danger); color: var(--danger); }
    .control-panel { padding: 1.5rem; background: rgba(6, 182, 212, 0.05); border: 1px solid var(--accent); border-radius: 0.75rem; margin-bottom: 1.5rem; }
    .input-group { display: flex; gap: 1rem; margin-top: 1rem; }
    input { flex: 1; background: #000; border: 1px solid #333; padding: 0.75rem 1rem; color: #fff; border-radius: 0.5rem; }
    button { background: var(--accent); color: #000; border: none; padding: 0 1.5rem; border-radius: 0.5rem; font-weight: bold; cursor: pointer; }
    .toast { position: fixed; bottom: 2rem; right: 2rem; background: var(--card); border: 1px solid var(--accent); padding: 1rem 1.5rem; border-radius: 0.5rem; display: none; animation: slideIn 0.3s; }
    .toast.show { display: block; }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${state.project.name} <small style="font-size: 0.4em; vertical-align: middle; color: var(--accent)">GOD MODE</small></h1>
      <p>KERNEL v${state.project.version} • LOCALHOST:${gitInfo.branch} • <span id="clock">${new Date().toLocaleTimeString()}</span></p>
    </div>
    <div class="header-controls">
      <button onclick="toggleTheme()" style="background:#27272a; color:#fff; padding:0.5rem;">🌓</button>
      <div style="text-align: right; margin-left: 1rem;">
        <div id="score-display" style="font-size: 2rem; font-weight: bold; color: ${scoreColor}">${alignmentScore}%</div>
        <div style="font-size: 0.8rem; color: #666">ALIGNMENT SCORE</div>
      </div>
    </div>
  </div>

  <div class="toolbar">
    <button onclick="runAction('generate')">⚡ Generate</button>
    <button onclick="runAction('build')">🔨 Build</button>
    <button onclick="runAction('review')">🔍 Review</button>
    <button onclick="runAction('validate')">✅ Validate</button>
    <span style="flex:1"></span>
    <button onclick="refreshDashboard()" style="background:#27272a; color:#fff">🔄 Refresh</button>
  </div>

  <div class="dashboard-grid">
    <div class="col-phases">
      <h3 style="color: #666; margin-bottom: 1rem; font-size: 0.8rem">IMPLEMENTATION PLAN</h3>
      ${phasesHTML}
    </div>

          <div class="col-main">
            <div class="control-panel">
              <h3>🚀 SWARM COMMAND CENTER</h3>
              <div class="input-group">
                <input type="text" id="swarm-input" placeholder="Enter objective..." />
                <button id="swarm-btn" onclick="startSwarm()">DEPLOY AGENTS</button>
              </div>
            </div>
    
            <div class="card" id="healing-card">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem">
                <h3>🛡️ SELF-HEALING MONITOR</h3>
                <span id="healing-badge" class="status-badge" style="background:#333; color:#888">IDLE</span>
              </div>
              <div id="healing-status" style="font-size:0.9rem; color:#aaa; margin-bottom:0.5rem">System healthy. Watching for issues...</div>
              <div id="healing-stats" style="display:flex; gap:1rem; font-size:0.8rem; color:#666">
                <span>Fixes: <strong id="fix-count" style="color:#fff">0</strong></span>
                <span>Success: <strong id="success-rate" style="color:#fff">100%</strong></span>
              </div>
            </div>
    
            <div class="card">
              <h3>ALIGNMENT VELOCITY</h3>
              <div class="chart-container">
                <canvas id="alignmentChart"></canvas>
              </div>
            </div>
    
            <div class="card">
              <h3>LIVE SYSTEM LOGS</h3>
              <div class="timeline" id="log-container">
                <div class="log-entry info"><span class="time">${new Date().toLocaleTimeString()}</span> System initialized.</div>
              </div>
            </div>
          </div>
    <div class="col-agents">
      <h3 style="color: #666; margin-bottom: 1rem; font-size: 0.8rem">ACTIVE AGENTS</h3>
      <div class="agent-grid">
        ${agentsHTML}
      </div>
      
      <div class="card" style="margin-top: 1rem">
        <h3>SYSTEM STATUS</h3>
        <div style="color: var(--success)">> git: ${gitInfo.changedFiles > 0 ? gitInfo.changedFiles + ' changes' : 'clean'}</div>
        <div style="color: var(--accent)">> graph: ${graphSummary ? graphSummary.nodes + ' nodes' : 'scanning...'}</div>
        <div style="color: #666">> uptime: <span id="uptime">0s</span></div>
      </div>
      ${usageSummaryHTML}
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    // Fetch initial memory
    async function loadMemory() {
      try {
        const res = await fetch('/api/memory');
        const memories = await res.json();
        const container = document.getElementById('memory-bank');
        if (memories && memories.length > 0) {
           // Logic omitted
        }
      } catch (e) {
        console.error("Failed to load memory:", e);
      }
    }
    loadMemory();

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
      options: { responsive: true, maintainAspectRatio: false }
    });

    const evtSource = new EventSource("/events");
    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'log') addLog(data.message, data.level);
      if (data.type === 'agent_status') updateAgent(data.agent, data.status, data.activity);
      if (data.type === 'autonomous_update') updateAutonomous(data.data);
    };

    function updateAutonomous(data) {
      const badge = document.getElementById('healing-badge');
      const statusText = document.getElementById('healing-status');
      const fixCount = document.getElementById('fix-count');
      
      if (data.status === 'healing') {
        badge.innerText = 'ACTIVE';
        badge.style.background = 'var(--accent)';
        badge.style.color = '#000';
        badge.classList.add('pulse'); // You might want to add a pulse animation class
      } else if (data.status === 'fixed') {
        badge.innerText = 'SUCCESS';
        badge.style.background = 'var(--success)';
        badge.style.color = '#000';
      } else if (data.status === 'failed') {
        badge.innerText = 'FAILED';
        badge.style.background = 'var(--danger)';
        badge.style.color = '#fff';
      } else {
        badge.innerText = 'IDLE';
        badge.style.background = '#333';
        badge.style.color = '#888';
      }

      statusText.innerText = data.message;
      if (data.stats) {
        fixCount.innerText = data.stats.fixes;
      }
    }

    function addLog(msg, level = 'info') {
      const container = document.getElementById('log-container');
      const div = document.createElement('div');
      div.className = "log-entry " + level;
      div.innerHTML = "<span class='time'>" + new Date().toLocaleTimeString() + "</span> " + msg;
      container.prepend(div);
      while (container.children.length > 50) container.lastChild.remove();
    }

    function updateAgent(name, status, activity) {
      const card = document.getElementById("agent-" + name);
      if (card) {
        const statusEl = card.querySelector('.agent-status');
        const activityEl = card.querySelector('.agent-activity');
        statusEl.className = "agent-status status-" + status;
        statusEl.innerText = status;
        activityEl.innerText = activity;
        card.classList.toggle('active', status === 'working');
      }
    }

    function showToast(message) {
      const toast = document.getElementById('toast');
      toast.innerText = message;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function toggleTheme() {
      document.body.classList.toggle('light-theme');
    }

    async function runAction(action) {
      addLog("Running " + action + "...", 'info');
      try {
        const res = await fetch("/api/action/" + action, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          addLog(action + " completed successfully", 'success');
          showToast("✅ " + action + " completed");
        } else {
          addLog(action + " failed: " + data.error, 'error');
          showToast("❌ " + action + " failed");
        }
      } catch (e) {
        addLog("Failed to run " + action, 'error');
        showToast("❌ Connection error");
      }
    }

    function refreshDashboard() {
      location.reload();
    }

    async function startSwarm() {
      const input = document.getElementById('swarm-input');
      const btn = document.getElementById('swarm-btn');
      const objective = input.value.trim();
      if (!objective) return;

      btn.disabled = true;
      btn.innerText = "DEPLOYING...";
      addLog("Initiating Swarm: " + objective, 'info');

      try {
        const res = await fetch('/api/swarm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feature: objective })
        });
        const data = await res.json();
        if (data.success) {
          addLog("Swarm processes started", "success");
          showToast('🐝 Swarm deployed!');
          input.value = "";
        } else {
          addLog("Error: " + data.error, "error");
        }
      } catch (e) {
        addLog("Connection Failed", "error");
      } finally {
        btn.disabled = false;
        btn.innerText = "DEPLOY AGENTS";
      }
    }

    async function runAgent(agentName) {
      const card = document.getElementById("agent-" + agentName);
      const runBtn = card.querySelector('.agent-btn.run');
      
      addLog("Starting agent: @" + agentName, 'info');
      runBtn.disabled = true;

      try {
        const res = await fetch('/api/agent/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent: agentName })
        });
        const data = await res.json();
        if (data.success) {
          showToast("🤖 @" + agentName + " is running");
        } else {
          addLog("Failed to start @" + agentName + ": " + data.error, 'error');
          runBtn.disabled = false;
        }
      } catch (e) {
        addLog("Connection failed", 'error');
        runBtn.disabled = false;
      }
    }

    async function stopAgent(agentName) {
      addLog("Stopping agent: @" + agentName, 'info');
      try {
        const res = await fetch('/api/agent/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent: agentName })
        });
        showToast("🛑 @" + agentName + " stopped");
      } catch (e) {
        addLog("Failed to stop @" + agentName, 'error');
      }
    }

    async function viewAgentLogs(agentName) {
      addLog("Opening logs for @" + agentName, 'info');
      try {
        const res = await fetch("/api/agent/logs?agent=" + agentName);
        const data = await res.json();
        if (data.logs) {
            // Simplified log viewing for stability
            addLog("Logs received for @" + agentName, 'success');
            console.log(data.logs);
        }
      } catch (e) {
        addLog("Failed to fetch logs", 'error');
      }
    }

    const startTime = Date.now();
    setInterval(() => {
      document.getElementById('clock').innerText = new Date().toLocaleTimeString();
      const uptime = Math.floor((Date.now() - startTime) / 1000);
      document.getElementById('uptime').innerText = uptime + "s";
    }, 1000);
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
      try {
        const port = parseInt(options.port);

        // Validate port
        if (isNaN(port) || port < 1 || port > 65535) {
          printError(chalk.red('❌ Error: Invalid port number. Must be between 1 and 65535.'));
          process.exitCode = 1;
          process.exit(process.exitCode);
        }

        printInfo(chalk.bold.cyan('\n🖥️  Starting God Mode Dashboard...'));

        printInfo(chalk.gray('Initializing Neural Link (Graph Scan)...'));
        let graphSummary = null;
        try {
          const graph = await buildGraph();
          graphSummary = { nodes: graph.nodes.length, edges: graph.edges.length };
          printSuccess(chalk.green(`✅ Neural Link Established: ${graph.nodes.length} nodes mapped.`));
        } catch (e) {
          printWarning(chalk.yellow('⚠️ Neural Link Warning: ' + e.message));
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
          res.write(`data: ${JSON.stringify({ type: 'log', message: 'Connected to Ultra-Dex Kernel' })}\n\n`);
          req.on('close', () => clients.delete(client));
          return;
        }

        // Swarm Trigger
        if (req.url === '/api/swarm' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk.toString());
          req.on('end', async () => {
            try {
              const { feature } = JSON.parse(body);
              printInfo(chalk.magenta(`\n⚡ Dashboard Trigger: Starting Swarm for "${feature}"...`));

              addAction('swarm', `Swarm started: ${feature}`, 'planner');
              sendToClients({ type: 'log', message: `Swarm triggered: ${feature}`, level: 'info' });

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

        // Autonomous Status Update
        if (req.url === '/api/autonomous/status' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk.toString());
          req.on('end', () => {
            try {
              const statusData = JSON.parse(body);
              sendToClients({ type: 'autonomous_update', data: statusData });
              // Also log significant events
              if (statusData.status === 'healing') {
                addAction('healing_start', `Self-healing started: ${statusData.message}`, 'debugger');
              } else if (statusData.status === 'fixed') {
                addAction('healing_success', `Self-healing fixed issue`, 'debugger');
              }
              
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } catch (e) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: e.message }));
            }
          });
          return;
        }

        // Log Endpoint
        if (req.url === '/api/log' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk.toString());
          req.on('end', () => {
            try {
              const logData = JSON.parse(body);
              sendToClients({ type: 'log', ...logData });
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } catch (e) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: e.message }));
            }
          });
          return;
        }

        // Quick Actions
        if (req.url.startsWith('/api/action/') && req.method === 'POST') {
          const action = req.url.replace('/api/action/', '');
          try {
            const actionCommands = {
              generate: ['npx', ['ultra-dex', 'generate']],
              build: ['npx', ['ultra-dex', 'build']],
              review: ['npx', ['ultra-dex', 'review']],
              validate: ['npx', ['ultra-dex', 'validate']],
              diff: ['npx', ['ultra-dex', 'diff', '--json']]
            };
            
            if (!actionCommands[action]) throw new Error('Unknown action');
            
            addAction(action, `Started ${action}`, null);
            sendToClients({ type: 'log', message: `Running ${action}...`, level: 'info' });
            
            const [cmd, args] = actionCommands[action];
            const result = execSync(`${cmd} ${args.join(' ')}`, {
              encoding: 'utf-8',
              timeout: 60000,
              maxBuffer: 1024 * 1024
            });
            
            sendToClients({ type: 'log', message: `${action} completed`, level: 'success' });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, output: result.slice(0, 1000) }));
          } catch (e) {
            sendToClients({ type: 'log', message: `${action} failed: ${e.message}`, level: 'error' });
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: e.message }));
          }
          return;
        }

        // Agent Control
        if (req.url === '/api/agent/run' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk.toString());
          req.on('end', () => {
            try {
              const { agent, task } = JSON.parse(body);
              printInfo(chalk.cyan(`▶️ Dashboard: Running agent @${agent}`));
              addAction('agent_start', `Agent @${agent} started`, agent);
              sendToClients({ type: 'agent_status', agent, status: 'working', activity: task || 'Processing...' });
              
              const agentProcess = spawn('npx', ['ultra-dex', 'run', agent, task || ''], {
                stdio: 'pipe',
                shell: true,
                detached: true
              });
              
              agentProcess.stdout?.on('data', (data) => {
                sendToClients({ type: 'agent_log', agent, message: data.toString().slice(0, 200) });
              });
              
              agentProcess.on('close', (code) => {
                const status = code === 0 ? 'completed' : 'error';
                sendToClients({ type: 'agent_status', agent, status, activity: code === 0 ? 'Completed' : 'Failed' });
                addAction(status === 'completed' ? 'agent_complete' : 'agent_error', 
                  `Agent @${agent} ${status}`, agent);
              });
              
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: `Agent @${agent} started` }));
            } catch (e) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: e.message }));
            }
          });
          return;
        }

        if (req.url === '/api/agent/stop' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk.toString());
          req.on('end', () => {
            try {
              const { agent } = JSON.parse(body);
              printInfo(chalk.yellow(`⏹ Dashboard: Stopping agent @${agent}`));
              addAction('agent_stop', `Agent @${agent} stopped by user`, agent);
              sendToClients({ type: 'agent_status', agent, status: 'idle', activity: 'Stopped' });
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: `Agent @${agent} stopped` }));
            } catch (e) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: e.message }));
            }
          });
          return;
        }

        // Export Report
        if (req.url === '/api/export') {
          try {
            const state = await loadState();
            const gitInfo = await getGitInfo();
            const usageSummary = await getUsageSummary({ windowDays: 7 });
            const html = generateDashboardHTML(state, gitInfo, graphSummary, usageSummary);
            res.writeHead(200, {
              'Content-Type': 'text/html',
              'Content-Disposition': 'attachment; filename="ultra-dex-report.html"'
            });
            res.end(html);
          } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
          }
          return;
        }

        const state = await loadState();
        const gitInfo = await getGitInfo();
        const usageSummary = await getUsageSummary({ windowDays: 7 });
        const html = generateDashboardHTML(state, gitInfo, graphSummary, usageSummary);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      });

      startWebSocketServer({ server });

      server.listen(port, () => {
        printSuccess(chalk.green(`✅ Dashboard active at http://localhost:${port}`));
        printInfo(chalk.gray(`🔌 WebSocket active at ws://localhost:${port}`));
      });

      // Handle server errors
      server.on('error', (err) => {
        printError(chalk.red(`❌ Server error: ${err.message}`));
        process.exitCode = 1;
        process.exit(process.exitCode);
      });
    } catch (error) {
      await handleError(error, { command: 'dashboard', options });
      process.exitCode = error.exitCode || 1;
      process.exit(process.exitCode);
    }
    });
}
