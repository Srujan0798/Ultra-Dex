// Copyright (c) 2026 Ultra-Dex
import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import chalk from 'chalk';

/**
 * Distributed Swarm Protocol (The Hive Mind)
 * Enables cross-instance agent coordination.
 */
export class HiveMind extends EventEmitter {
  constructor() {
    super();
    this.peers = new Set();
    this.knowledgeBuffer = new Map();
  }

  async broadcastIntelligence(intelligence) {
    console.log(chalk.yellow('🐝 Hive Mind: Pulsing intelligence to peer network...'));
    const message = JSON.stringify({ type: 'INTELLIGENCE_PULSE', data: intelligence });
    
    for (const peer of this.peers) {
      if (peer.readyState === WebSocket.OPEN) {
        peer.send(message);
      }
    }
  }

  registerPeer(url) {
    const ws = new WebSocket(url);
    ws.on('open', () => {
      this.peers.add(ws);
      console.log(chalk.green(`✅ Hive connection established: ${url}`));
    });
    
    ws.on('message', (data) => {
      const pulse = JSON.parse(data);
      this.emit('pulse', pulse);
      // Synchronize with local relational memory
    });
  }
}

export const hive = new HiveMind();

