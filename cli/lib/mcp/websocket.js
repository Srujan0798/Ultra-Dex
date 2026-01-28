import { WebSocketServer } from 'ws';
import chalk from 'chalk';

export class UltraDexSocket {
  constructor(server) {
    this.wss = new WebSocketServer({ server, path: '/stream' });
    this.clients = new Set();
    
    this.wss.on('connection', (ws) => {
      console.log(chalk.gray('🔌 WebSocket client connected'));
      this.clients.add(ws);
      
      // Send initial state
      ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));
      
      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(chalk.gray('🔌 WebSocket client disconnected'));
      });
      
      ws.on('error', (err) => {
        console.error(chalk.red('WebSocket error:'), err);
      });
    });

    // Heartbeat to keep connections alive
    setInterval(() => {
      this.broadcast({ type: 'ping', timestamp: Date.now() });
    }, 30000);
  }
  
  broadcast(data) {
    const message = JSON.stringify(data);
    for (const client of this.clients) {
      if (client.readyState === 1) { // OPEN
        client.send(message);
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
}
