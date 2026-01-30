/**
 * ultra-dex cloud command
 * Hosted cloud dashboard for team collaboration and SaaS mode
 * This enables Ultra-Dex to run as a service, not just a local CLI
 */

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import http from 'http';
import { WebSocketServer } from 'ws';

// ============================================================================
// CLOUD CONFIGURATION
// ============================================================================

const CLOUD_CONFIG = {
  // Default ports
  ports: {
    api: 4001,
    websocket: 4002,
    dashboard: 4003,
  },

  // State storage
  stateDir: '.ultra-dex/cloud',
  sessionsFile: '.ultra-dex/cloud/sessions.json',
  teamsFile: '.ultra-dex/cloud/teams.json',

  // Rate limits
  rateLimit: {
    requestsPerMinute: 60,
    swarmRunsPerHour: 10,
  },

  // Session settings
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
};

// ============================================================================
// SESSION MANAGER
// ============================================================================

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.teams = new Map();
  }

  async load() {
    try {
      const sessionsData = await fs.readFile(CLOUD_CONFIG.sessionsFile, 'utf8');
      const sessions = JSON.parse(sessionsData);
      for (const [id, session] of Object.entries(sessions)) {
        this.sessions.set(id, session);
      }
    } catch {
      // No existing sessions
    }

    try {
      const teamsData = await fs.readFile(CLOUD_CONFIG.teamsFile, 'utf8');
      const teams = JSON.parse(teamsData);
      for (const [id, team] of Object.entries(teams)) {
        this.teams.set(id, team);
      }
    } catch {
      // No existing teams
    }
  }

  async save() {
    await fs.mkdir(CLOUD_CONFIG.stateDir, { recursive: true });

    const sessions = Object.fromEntries(this.sessions);
    await fs.writeFile(CLOUD_CONFIG.sessionsFile, JSON.stringify(sessions, null, 2));

    const teams = Object.fromEntries(this.teams);
    await fs.writeFile(CLOUD_CONFIG.teamsFile, JSON.stringify(teams, null, 2));
  }

  createSession(userId, teamId = null) {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = {
      id: sessionId,
      userId,
      teamId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + CLOUD_CONFIG.sessionTimeout).toISOString(),
      state: {},
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Check expiration
    if (new Date(session.expiresAt) < new Date()) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  createTeam(name, ownerId) {
    const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const team = {
      id: teamId,
      name,
      ownerId,
      members: [ownerId],
      createdAt: new Date().toISOString(),
      projects: [],
      settings: {},
    };

    this.teams.set(teamId, team);
    return team;
  }

  addTeamMember(teamId, userId) {
    const team = this.teams.get(teamId);
    if (!team) return false;

    if (!team.members.includes(userId)) {
      team.members.push(userId);
    }
    return true;
  }
}

const sessionManager = new SessionManager();

// ============================================================================
// API SERVER
// ============================================================================

function createAPIServer(options = {}) {
  const { port = CLOUD_CONFIG.ports.api } = options;

  const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:${port}`);
    const path = url.pathname;

    // Parse body for POST/PUT
    let body = '';
    if (req.method === 'POST' || req.method === 'PUT') {
      for await (const chunk of req) {
        body += chunk;
      }
    }

    try {
      // Route handling
      if (path === '/api/health') {
        return sendJSON(res, { status: 'ok', version: '3.4.0' });
      }

      if (path === '/api/session' && req.method === 'POST') {
        const { userId, teamId } = JSON.parse(body);
        const session = sessionManager.createSession(userId, teamId);
        await sessionManager.save();
        return sendJSON(res, session);
      }

      if (path === '/api/team' && req.method === 'POST') {
        const { name, ownerId } = JSON.parse(body);
        const team = sessionManager.createTeam(name, ownerId);
        await sessionManager.save();
        return sendJSON(res, team);
      }

      if (path === '/api/state' && req.method === 'GET') {
        const sessionId = req.headers.authorization?.replace('Bearer ', '');
        const session = sessionManager.getSession(sessionId);

        if (!session) {
          return sendJSON(res, { error: 'Invalid session' }, 401);
        }

        return sendJSON(res, { session, state: session.state });
      }

      if (path === '/api/state' && req.method === 'PUT') {
        const sessionId = req.headers.authorization?.replace('Bearer ', '');
        const session = sessionManager.getSession(sessionId);

        if (!session) {
          return sendJSON(res, { error: 'Invalid session' }, 401);
        }

        session.state = JSON.parse(body);
        await sessionManager.save();
        return sendJSON(res, { success: true });
      }

      if (path === '/api/swarm' && req.method === 'POST') {
        const sessionId = req.headers.authorization?.replace('Bearer ', '');
        const session = sessionManager.getSession(sessionId);

        if (!session) {
          return sendJSON(res, { error: 'Invalid session' }, 401);
        }

        const { task, options } = JSON.parse(body);

        // Queue swarm run (in real implementation, would use job queue)
        const runId = `run_${Date.now()}`;

        return sendJSON(res, {
          runId,
          status: 'queued',
          task,
          message: 'Swarm run queued for execution',
        });
      }

      // 404
      sendJSON(res, { error: 'Not found' }, 404);

    } catch (err) {
      sendJSON(res, { error: err.message }, 500);
    }
  });

  return server;
}

function sendJSON(res, data, statusCode = 200) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ============================================================================
// WEBSOCKET SERVER (Real-time sync)
// ============================================================================

function createWebSocketServer(options = {}) {
  const { port = CLOUD_CONFIG.ports.websocket } = options;

  const wss = new WebSocketServer({ port });

  const clients = new Map(); // sessionId -> WebSocket

  wss.on('connection', (ws) => {
    let sessionId = null;

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'auth') {
          sessionId = message.sessionId;
          const session = sessionManager.getSession(sessionId);

          if (session) {
            clients.set(sessionId, ws);
            ws.send(JSON.stringify({ type: 'auth_success', session }));
          } else {
            ws.send(JSON.stringify({ type: 'auth_failed' }));
          }
        }

        if (message.type === 'state_update' && sessionId) {
          const session = sessionManager.getSession(sessionId);
          if (session) {
            session.state = { ...session.state, ...message.data };
            await sessionManager.save();

            // Broadcast to team members
            if (session.teamId) {
              const team = sessionManager.teams.get(session.teamId);
              if (team) {
                for (const [sid, client] of clients) {
                  const clientSession = sessionManager.getSession(sid);
                  if (clientSession?.teamId === session.teamId && sid !== sessionId) {
                    client.send(JSON.stringify({
                      type: 'state_sync',
                      from: sessionId,
                      data: message.data,
                    }));
                  }
                }
              }
            }
          }
        }

        if (message.type === 'swarm_event' && sessionId) {
          // Broadcast swarm events to team
          const session = sessionManager.getSession(sessionId);
          if (session?.teamId) {
            for (const [sid, client] of clients) {
              const clientSession = sessionManager.getSession(sid);
              if (clientSession?.teamId === session.teamId) {
                client.send(JSON.stringify({
                  type: 'swarm_event',
                  from: sessionId,
                  event: message.event,
                }));
              }
            }
          }
        }

      } catch (err) {
        ws.send(JSON.stringify({ type: 'error', message: err.message }));
      }
    });

    ws.on('close', () => {
      if (sessionId) {
        clients.delete(sessionId);
      }
    });
  });

  return wss;
}

// ============================================================================
// CLOUD DASHBOARD HTML
// ============================================================================

const CLOUD_DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ultra-Dex Cloud Dashboard</title>
  <style>
    :root {
      --bg: #0f0f23;
      --surface: #1a1a2e;
      --primary: #6366f1;
      --secondary: #8b5cf6;
      --text: #e2e8f0;
      --muted: #64748b;
      --success: #22c55e;
      --warning: #f59e0b;
      --error: #ef4444;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'SF Mono', 'Fira Code', monospace;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--surface);
    }

    h1 {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 2rem;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--surface);
      border-radius: 9999px;
      font-size: 0.875rem;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--success);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .card {
      background: var(--surface);
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid rgba(255,255,255,0.05);
    }

    .card h2 {
      font-size: 1rem;
      color: var(--muted);
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .metric {
      font-size: 2.5rem;
      font-weight: bold;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .agent-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .agent-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: rgba(255,255,255,0.02);
      border-radius: 8px;
    }

    .agent-name {
      font-weight: 600;
    }

    .agent-status {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .agent-status.idle { background: var(--muted); }
    .agent-status.running { background: var(--primary); }
    .agent-status.complete { background: var(--success); }

    .timeline {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .timeline-item {
      display: flex;
      gap: 1rem;
      padding-left: 1rem;
      border-left: 2px solid var(--primary);
    }

    .timeline-time {
      color: var(--muted);
      font-size: 0.75rem;
      min-width: 60px;
    }

    .timeline-content {
      flex: 1;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: white;
      border: none;
      border-radius: 8px;
      font-family: inherit;
      font-size: 0.875rem;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
    }

    .team-section {
      margin-top: 2rem;
    }

    .team-members {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .member-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 0.875rem;
    }

    footer {
      text-align: center;
      padding-top: 2rem;
      color: var(--muted);
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Ultra-Dex Cloud</h1>
      <div class="status-badge">
        <span class="status-dot"></span>
        <span>Connected</span>
      </div>
    </header>

    <div class="grid">
      <div class="card">
        <h2>Active Swarms</h2>
        <div class="metric" id="activeSwarms">0</div>
      </div>
      <div class="card">
        <h2>Tasks Completed</h2>
        <div class="metric" id="tasksCompleted">0</div>
      </div>
      <div class="card">
        <h2>Team Members</h2>
        <div class="metric" id="teamMembers">1</div>
      </div>
      <div class="card">
        <h2>API Calls Today</h2>
        <div class="metric" id="apiCalls">0</div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h2>Agent Status</h2>
        <div class="agent-list" id="agentList">
          <div class="agent-item">
            <span class="agent-name">@Planner</span>
            <span class="agent-status idle">Idle</span>
          </div>
          <div class="agent-item">
            <span class="agent-name">@Backend</span>
            <span class="agent-status idle">Idle</span>
          </div>
          <div class="agent-item">
            <span class="agent-name">@Frontend</span>
            <span class="agent-status idle">Idle</span>
          </div>
          <div class="agent-item">
            <span class="agent-name">@Reviewer</span>
            <span class="agent-status idle">Idle</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>Recent Activity</h2>
        <div class="timeline" id="timeline">
          <div class="timeline-item">
            <span class="timeline-time">Now</span>
            <span class="timeline-content">Cloud dashboard started</span>
          </div>
        </div>
      </div>
    </div>

    <div class="team-section card">
      <h2>Team Collaboration</h2>
      <p style="color: var(--muted); margin-bottom: 1rem;">
        Invite team members to collaborate in real-time on agent swarms.
      </p>
      <div class="team-members" id="teamMembers">
        <div class="member-avatar">You</div>
      </div>
      <button class="btn" style="margin-top: 1rem;">
        + Invite Member
      </button>
    </div>

    <footer>
      Ultra-Dex v3.4.0 | Cloud Dashboard | <a href="https://github.com/Srujan0798/Ultra-Dex" style="color: var(--primary);">GitHub</a>
    </footer>
  </div>

  <script>
    // WebSocket connection for real-time updates
    let ws;

    function connect() {
      ws = new WebSocket('ws://localhost:4002');

      ws.onopen = () => {
        console.log('Connected to Ultra-Dex Cloud');
        addTimelineItem('Connected to cloud server');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleMessage(data);
      };

      ws.onclose = () => {
        console.log('Disconnected, reconnecting...');
        setTimeout(connect, 3000);
      };
    }

    function handleMessage(data) {
      if (data.type === 'state_sync') {
        addTimelineItem('State synced from ' + data.from);
      }

      if (data.type === 'swarm_event') {
        updateAgentStatus(data.event.agent, data.event.status);
        addTimelineItem(data.event.agent + ': ' + data.event.message);
      }
    }

    function updateAgentStatus(agent, status) {
      const agentList = document.getElementById('agentList');
      const items = agentList.querySelectorAll('.agent-item');

      items.forEach(item => {
        const name = item.querySelector('.agent-name').textContent;
        if (name === agent) {
          const statusEl = item.querySelector('.agent-status');
          statusEl.textContent = status;
          statusEl.className = 'agent-status ' + status.toLowerCase();
        }
      });
    }

    function addTimelineItem(content) {
      const timeline = document.getElementById('timeline');
      const item = document.createElement('div');
      item.className = 'timeline-item';
      item.innerHTML = '<span class="timeline-time">' + new Date().toLocaleTimeString() + '</span>' +
                       '<span class="timeline-content">' + content + '</span>';
      timeline.insertBefore(item, timeline.firstChild);

      // Keep only last 10 items
      while (timeline.children.length > 10) {
        timeline.removeChild(timeline.lastChild);
      }
    }

    // Initialize
    connect();
  </script>
</body>
</html>`;

// ============================================================================
// DASHBOARD SERVER
// ============================================================================

function createDashboardServer(options = {}) {
  const { port = CLOUD_CONFIG.ports.dashboard } = options;

  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(CLOUD_DASHBOARD_HTML);
  });

  return server;
}

// ============================================================================
// CLI COMMAND
// ============================================================================

export function registerCloudCommand(program) {
  program
    .command('cloud')
    .description('Start Ultra-Dex cloud server for team collaboration')
    .option('-p, --port <port>', 'API port', '4001')
    .option('--ws-port <port>', 'WebSocket port', '4002')
    .option('--dashboard-port <port>', 'Dashboard port', '4003')
    .option('--no-dashboard', 'Disable dashboard server')
    .action(async (options) => {
      console.log(chalk.cyan('\n☁️  Ultra-Dex Cloud Server\n'));

      const spinner = ora('Starting cloud services...').start();

      try {
        // Load existing sessions
        await sessionManager.load();

        // Start API server
        const apiPort = parseInt(options.port, 10);
        const apiServer = createAPIServer({ port: apiPort });
        apiServer.listen(apiPort);

        // Start WebSocket server
        const wsPort = parseInt(options.wsPort, 10);
        createWebSocketServer({ port: wsPort });

        // Start dashboard server
        let dashboardPort = null;
        if (options.dashboard !== false) {
          dashboardPort = parseInt(options.dashboardPort, 10);
          const dashboardServer = createDashboardServer({ port: dashboardPort });
          dashboardServer.listen(dashboardPort);
        }

        spinner.succeed('Cloud services started');

        console.log(chalk.bold('\n📡 Endpoints:'));
        console.log(`   API:       ${chalk.cyan(`http://localhost:${apiPort}`)}`);
        console.log(`   WebSocket: ${chalk.cyan(`ws://localhost:${wsPort}`)}`);
        if (dashboardPort) {
          console.log(`   Dashboard: ${chalk.cyan(`http://localhost:${dashboardPort}`)}`);
        }

        console.log(chalk.gray('\n✨ Cloud server running. Press Ctrl+C to stop.\n'));

        // Keep process running
        process.on('SIGINT', async () => {
          console.log(chalk.yellow('\n\nShutting down...'));
          await sessionManager.save();
          process.exit(0);
        });

      } catch (err) {
        spinner.fail(`Failed to start: ${err.message}`);
      }
    });
}

export default {
  registerCloudCommand,
  createAPIServer,
  createWebSocketServer,
  createDashboardServer,
  sessionManager,
  CLOUD_CONFIG,
};