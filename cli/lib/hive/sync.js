// Copyright (c) 2026 Ultra-Dex

import { EventEmitter } from 'node:events';

export class HiveSync extends EventEmitter {
  constructor() {
    super();
    this.peers = new Set();
  }

  join(peerId) {
    this.peers.add(peerId);
    this.emit('join', peerId);
  }

  leave(peerId) {
    this.peers.delete(peerId);
    this.emit('leave', peerId);
  }

  broadcast(payload) {
    this.emit('broadcast', { peers: [...this.peers], payload });
  }
}

export function createHiveSync() {
  return new HiveSync();
}
