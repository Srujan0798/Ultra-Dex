// Copyright (c) 2026 Ultra-Dex

import { EventEmitter } from 'node:events';

export class CanvasSyncHub extends EventEmitter {
  constructor() {
    super();
    this.clients = new Map();
  }

  connect(clientId, send) {
    this.clients.set(clientId, send);
    this.emit('join', { clientId });
  }

  disconnect(clientId) {
    this.clients.delete(clientId);
    this.emit('leave', { clientId });
  }

  broadcast(event, payload, exceptId = null) {
    for (const [id, send] of this.clients.entries()) {
      if (exceptId && id === exceptId) continue;
      try {
        send({ event, payload });
      } catch {
        // Ignore send errors
      }
    }
  }
}

export function createCanvasSyncHub() {
  return new CanvasSyncHub();
}
