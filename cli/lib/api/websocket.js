// Copyright (c) 2026 Ultra-Dex

/**
 * API WebSocket Server for real-time updates
 */

import { WebSocketServer } from 'ws';

export function startWebSocketServer(server, { path = '/ws' } = {}) {
  const wss = new WebSocketServer({ server, path });

  function broadcast(payload) {
    const data = JSON.stringify(payload);
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(data);
      }
    });
  }

  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));
    ws.on('message', (message) => {
      const text = message.toString();
      broadcast({ type: 'message', payload: text });
    });
  });

  return { wss, broadcast };
}
