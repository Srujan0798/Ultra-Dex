import { WebSocketServer } from 'ws';
import chalk from 'chalk';

class UltraWebSocketServer {
  constructor() {
    this.wss = null;
    this.clients = new Set();
  }

  async start(options = {}) {
    const port = options.port || 3002;

    // Check if port is in use or just try to start
    // Note: The 'ws' library creates a standalone server if 'port' is provided
    try {
        this.wss = new WebSocketServer({ port });

        this.wss.on('connection', (ws) => {
          this.clients.add(ws);
          
          ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to Ultra-Dex Neural Interface' }));

          ws.on('close', () => {
            this.clients.delete(ws);
          });

          ws.on('error', (err) => {
            console.error('WebSocket client error:', err.message);
            this.clients.delete(ws);
          });
        });

        this.wss.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(chalk.yellow(`WebSocket port ${port} is busy, real-time updates disabled.`));
            } else {
                console.error('WebSocket Server Error:', err);
            }
        });

        // console.log(chalk.gray(`   • WebSocket: ws://localhost:${port}`));
    } catch (e) {
        console.error("Failed to initialize WebSocket Server:", e.message);
    }
  }

  broadcast(data) {
    if (!this.wss) return;

    const message = JSON.stringify(data);
    for (const client of this.clients) {
      if (client.readyState === 1) { // OPEN
        client.send(message);
      }
    }
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}

export const webSocketServer = new UltraWebSocketServer();
