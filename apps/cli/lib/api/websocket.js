// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview WebSocket Server for Real-time Updates
 * @module api/websocket
 * @description Provides real-time bidirectional communication for the API Gateway.
 */

import { WebSocketServer } from 'ws';

/**
 * Start a WebSocket server attached to an HTTP server
 * @api public
 * @param {import('http').Server} server - HTTP server to attach to
 * @param {Object} [options] - WebSocket configuration
 * @param {string} [options.path='/ws'] - WebSocket endpoint path
 * @returns {{wss: WebSocketServer, broadcast: Function}} WebSocket server and broadcast function
 * @example
 * const server = http.createServer(app);
 * const { wss, broadcast } = startWebSocketServer(server, { path: '/ws' });
 * broadcast({ type: 'update', data: { status: 'ready' } });
 *
 * @swagger
 * /ws:
 *   websocket:
 *     summary: Real-time updates WebSocket
 *     description: Connect for real-time server events and messaging
 */
export function startWebSocketServer(server, { path = '/ws' } = {}) {
  const wss = new WebSocketServer({ server, path });

  /**
   * Broadcast a payload to all connected clients
   * @param {Object} payload - JSON-serializable payload to broadcast
   */
  function broadcast(payload) {
    try {
      const data = JSON.stringify(payload);
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(data);
        }
      });
    } catch (error) {
      console.error('[WebSocket] Broadcast error:', error.message);
    }
  }

  wss.on('connection', (ws) => {
    try {
      ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));
      ws.on('message', (message) => {
        try {
          const text = message.toString();
          broadcast({ type: 'message', payload: text });
        } catch (error) {
          console.error('[WebSocket] Message handling error:', error.message);
        }
      });
      ws.on('error', (error) => {
        console.error('[WebSocket] Client error:', error.message);
      });
    } catch (error) {
      console.error('[WebSocket] Connection error:', error.message);
    }
  });

  return { wss, broadcast };
}
