import { WebSocketServer } from 'ws';
import chalk from 'chalk';

export class UltraDexSocket {
  constructor(server, options = {}) {
    this.wss = new WebSocketServer({ server, path: '/stream' });
    this.clients = new Set();
    this.scoreInterval = null;
    this.scoreCalculator = options.scoreCalculator || (() => Math.floor(Math.random() * 30) + 70);
    
    this.wss.on('connection', (ws, _req) => {
      console.log(chalk.gray('🔌 WebSocket client connected'));
      this.clients.add(ws);
      
      // Send initial state
      ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));
      
      // Send current score immediately
      this.sendAlignmentScore(this.scoreCalculator());
      
      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(chalk.gray('🔌 WebSocket client disconnected'));
      });
      
      ws.on('error', (err) => {
        console.error(chalk.red('WebSocket error:'), err);
        this.clients.delete(ws);
      });
      
      // Handle reconnection request
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          if (data.type === 'reconnect') {
            ws.send(JSON.stringify({ type: 'reconnected', timestamp: Date.now() }));
          } else if (data.type === 'get_score') {
            this.sendAlignmentScore(this.scoreCalculator());
          }
        } catch (e) {
          // Ignore invalid messages
        }
      });
    });

    // Heartbeat every 30 seconds
    setInterval(() => {
      this.broadcast({ type: 'ping', timestamp: Date.now() });
    }, 30000);
    
    // Alignment score broadcast every 30 seconds
    this.startScoreBroadcast();
  }
  
  startScoreBroadcast() {
    if (this.scoreInterval) clearInterval(this.scoreInterval);
    this.scoreInterval = setInterval(() => {
      if (this.clients.size > 0) {
        const score = this.scoreCalculator();
        this.sendAlignmentScore(score);
      }
    }, 30000);
  }
  
  stopScoreBroadcast() {
    if (this.scoreInterval) {
      clearInterval(this.scoreInterval);
      this.scoreInterval = null;
    }
  }
  
  broadcast(data) {
    const message = JSON.stringify(data);
    for (const client of this.clients) {
      if (client.readyState === 1) { // OPEN
        try {
          client.send(message);
        } catch (e) {
          this.clients.delete(client);
        }
      } else {
        this.clients.delete(client);
      }
    }
  }
  
  sendStateUpdate(state) {
    this.broadcast({
      type: 'state_update',
      data: state,
      timestamp: Date.now()
    });
  }
  
  sendAlignmentScore(score) {
    this.broadcast({
      type: 'score_update',
      score,
      timestamp: Date.now()
    });
  }
  
  sendAgentStatus(agent, status, message) {
    this.broadcast({
      type: 'agent_status',
      agent,
      status, // 'running', 'completed', 'failed'
      message,
      timestamp: Date.now()
    });
  }
  
  // Utility method to get connection count
  getConnectionCount() {
    return this.clients.size;
  }
}
