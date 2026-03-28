// Copyright (c) 2026 Ultra-Dex

import { WebSocketServer } from 'ws';
import { printInfo, printWarning } from '../utils/output.js';

let wss = null;

export function startWebSocketServer({ port = 3002, server = null } = {}) {
  if (wss) return wss;

  wss = new WebSocketServer(server ? { server } : { port });

  wss.on('connection', (socket) => {
    socket.send(
      JSON.stringify({
        type: 'status',
        data: { message: 'Connected to Ultra-Dex WebSocket' },
        timestamp: new Date().toISOString(),
      })
    );

    socket.on('error', (err) => {
      printWarning(`WebSocket client error: ${err.message}`);
    });
  });

  wss.on('listening', () => {
    if (!server) {
      printInfo(`WebSocket server listening on ws://localhost:${port}`);
    }
  });

  wss.on('error', (err) => {
    printWarning(`WebSocket server error: ${err.message}`);
  });

  return wss;
}

export function broadcastWebSocketEvent(type, data) {
  if (!wss) return;
  const payload = JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString(),
  });

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(payload);
    }
  });
}

export function stopWebSocketServer() {
  if (wss) {
    wss.close();
    wss = null;
  }
}

/**
 * Handle errors in websocket module
 * @param {Error} error - The error to handle
 * @param {string} [context='websocket'] - Error context
 */
function handleModuleError(error, context = 'websocket') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
