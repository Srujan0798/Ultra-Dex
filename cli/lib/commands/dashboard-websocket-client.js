/**
 * WebSocket Push Updates for Dashboard
 * Replaces polling with real-time WebSocket events
 * 
 * Add this to your dashboard.html script section
 */

// WebSocket Connection Manager
class DashboardWebSocket {
  constructor(url = 'ws://localhost:3002/ws') {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.listeners = new Map();
    this.isConnected = false;
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('[WebSocket] Connected to Ultra-Dex server');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Show connection status
        showConnectionStatus('connected');
        
        // Request initial state
        this.send({ type: 'request_state' });
        
        // Emit connection event
        this.emit('connected', {});
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (e) {
          console.error('[WebSocket] Failed to parse message:', e);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        this.isConnected = false;
        showConnectionStatus('disconnected');
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        this.emit('error', error);
      };
      
    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error);
      this.attemptReconnect();
    }
  }
  
  handleMessage(data) {
    // Route message to appropriate handler
    switch (data.type) {
      case 'system_update':
        this.emit('system_update', data.data);
        updateDashboardMetrics(data.data);
        break;
        
      case 'agent_status':
        this.emit('agent_status', data);
        updateAgentStatus(data.agent, data.status, data.activity);
        break;
        
      case 'swarm_update':
        this.emit('swarm_update', data.data);
        updateSwarmStatus(data.data);
        break;
        
      case 'state_update':
        this.emit('state_update', data.data);
        updatePhaseProgress(data.data);
        break;
        
      case 'graph_update':
        this.emit('graph_update', data.data);
        updateGraphMetrics(data.data);
        break;
        
      case 'action':
        this.emit('action', data.action);
        addActionToTimeline(data.action);
        break;
        
      case 'log':
        this.emit('log', data);
        addLogEntry(data.message, data.level || 'info');
        break;
        
      case 'connected':
        console.log('[WebSocket] Server says:', data.message);
        break;
        
      case 'pong':
        // Heartbeat response
        break;
        
      default:
        console.log('[WebSocket] Unknown message type:', data.type);
    }
  }
  
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
  
  attemptReconnect() {
    this.reconnectAttempts++;
    console.log(`[WebSocket] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    showConnectionStatus('reconnecting', this.reconnectAttempts);
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Initialize WebSocket connection
const wsClient = new DashboardWebSocket();

// Connect when page loads
document.addEventListener('DOMContentLoaded', () => {
  wsClient.connect();
  
  // Setup heartbeat to keep connection alive
  setInterval(() => {
    if (wsClient.isConnected) {
      wsClient.send({ type: 'ping', timestamp: Date.now() });
    }
  }, 30000); // Every 30 seconds
});

// Connection status indicator
function showConnectionStatus(status, attempt = null) {
  const statusEl = document.getElementById('connection-status');
  if (!statusEl) return;
  
  switch (status) {
    case 'connected':
      statusEl.innerHTML = '🟢 Live';
      statusEl.style.color = 'var(--success)';
      break;
    case 'disconnected':
      statusEl.innerHTML = '🔴 Offline';
      statusEl.style.color = 'var(--danger)';
      break;
    case 'reconnecting':
      statusEl.innerHTML = `🟡 Reconnecting (${attempt})...`;
      statusEl.style.color = 'var(--warning)';
      break;
  }
}

// Update functions that respond to WebSocket events
function updateDashboardMetrics(data) {
  // Update alignment score
  if (data.state && data.state.progress !== undefined) {
    const scoreDisplay = document.getElementById('score-display');
    if (scoreDisplay) {
      const score = Math.round(data.state.progress);
      scoreDisplay.innerText = score + '%';
      
      // Update color based on score
      if (score >= 80) {
        scoreDisplay.style.color = 'var(--success)';
      } else if (score >= 50) {
        scoreDisplay.style.color = 'var(--warning)';
      } else {
        scoreDisplay.style.color = 'var(--danger)';
      }
    }
  }
  
  // Update graph metrics
  if (data.graph) {
    const graphEl = document.querySelector('[data-metric="graph"]');
    if (graphEl) {
      graphEl.innerText = `${data.graph.nodes} nodes`;
    }
  }
  
  // Update client count
  const clientsEl = document.getElementById('client-count');
  if (clientsEl) {
    clientsEl.innerText = `${data.clients} clients`;
  }
}

function updateAgentStatus(agentName, status, activity) {
  const agentCard = document.getElementById(`agent-${agentName}`);
  if (!agentCard) return;
  
  const statusEl = agentCard.querySelector('.agent-status');
  const activityEl = agentCard.querySelector('.agent-activity');
  const runBtn = agentCard.querySelector('.agent-btn.run');
  const stopBtn = agentCard.querySelector('.agent-btn.stop');
  
  if (statusEl) {
    statusEl.className = `agent-status status-${status}`;
    statusEl.innerText = status.toUpperCase();
  }
  
  if (activityEl && activity) {
    activityEl.innerText = activity;
  }
  
  // Update button states
  if (status === 'working') {
    if (runBtn) runBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;
    agentCard.classList.add('active');
  } else {
    if (runBtn) runBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
    agentCard.classList.remove('active');
  }
  
  // Flash animation for status change
  agentCard.style.animation = 'none';
  setTimeout(() => {
    agentCard.style.animation = '';
  }, 10);
}

function updateSwarmStatus(data) {
  // Update swarm progress
  const progressEl = document.getElementById('swarm-progress');
  if (progressEl && data.progress !== undefined) {
    progressEl.style.width = data.progress + '%';
    progressEl.innerText = data.progress + '%';
  }
  
  // Update objective
  const objectiveEl = document.getElementById('swarm-objective');
  if (objectiveEl && data.objective) {
    objectiveEl.innerText = data.objective;
  }
  
  // Update active agents list
  if (data.agents) {
    data.agents.forEach(agent => {
      updateAgentStatus(agent.name, agent.status, agent.activity);
    });
  }
}

function updatePhaseProgress(state) {
  if (!state || !state.phases) return;
  
  state.phases.forEach(phase => {
    const phaseCard = document.querySelector(`[data-phase="${phase.name}"]`);
    if (phaseCard) {
      // Update status badge
      const badge = phaseCard.querySelector('.status-badge');
      if (badge) {
        badge.innerText = phase.status.replace('_', ' ');
        badge.className = `status-badge ${phase.status}`;
      }
      
      // Update progress bar
      const progress = phaseCard.querySelector('.progress-mini .fill');
      if (progress) {
        const completedSteps = phase.steps.filter(s => s.status === 'completed').length;
        const percent = (completedSteps / phase.steps.length) * 100;
        progress.style.width = percent + '%';
      }
      
      // Update step list
      phase.steps.forEach(step => {
        const stepEl = phaseCard.querySelector(`[data-step="${step.task}"]`);
        if (stepEl) {
          stepEl.className = step.status;
        }
      });
    }
  });
}

function updateGraphMetrics(graphData) {
  // Update graph visualization if present
  const graphViz = document.getElementById('graph-visualization');
  if (graphViz && window.updateGraphViz) {
    window.updateGraphViz(graphData);
  }
}

function addActionToTimeline(action) {
  const container = document.getElementById('actions-container');
  if (!container) return;
  
  const actionEl = document.createElement('div');
  actionEl.className = 'action-item';
  actionEl.innerHTML = `
    <span class="action-icon">${getActionIcon(action.type)}</span>
    <div class="action-details">
      <div class="action-message">${action.message}</div>
      <div class="action-time">${new Date(action.timestamp).toLocaleTimeString()}</div>
    </div>
  `;
  
  container.insertBefore(actionEl, container.firstChild);
  
  // Keep only last 50 actions
  while (container.children.length > 50) {
    container.removeChild(container.lastChild);
  }
}

function addLogEntry(message, level = 'info') {
  const container = document.getElementById('log-container');
  if (!container) return;
  
  const entry = document.createElement('div');
  entry.className = `log-entry ${level}`;
  entry.innerHTML = `
    <span class="time">${new Date().toLocaleTimeString()}</span>
    ${escapeHtml(message)}
  `;
  
  container.appendChild(entry);
  container.scrollTop = container.scrollHeight;
  
  // Keep only last 100 log entries
  while (container.children.length > 100) {
    container.removeChild(container.firstChild);
  }
}

function getActionIcon(type) {
  const icons = {
    'agent_start': '🤖',
    'agent_complete': '✅',
    'agent_error': '❌',
    'agent_stop': '🛑',
    'swarm': '🐝',
    'build': '🔨',
    'deploy': '🚀',
    'default': '📌'
  };
  return icons[type] || icons.default;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make WebSocket client globally accessible
window.wsClient = wsClient;
