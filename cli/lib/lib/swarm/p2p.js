// Copyright (c) 2026 Ultra-Dex

import { EventEmitter } from 'events';

/**
 * Decentralized Swarm using P2P networking
 * @extends EventEmitter
 */
export class DecentralizedSwarm extends EventEmitter {
  /**
   * Create a new decentralized swarm
   * @param {string} id - Swarm identifier
   * @param {Object} options - Swarm options
   */
  constructor(id, options = {}) {
    super();
    this.id = id;
    this.options = options;
    this.agents = new Map();
    this.connections = new Map(); // peer connections
    this.isRunning = false;
  }

  /**
   * Add an agent to the swarm
   * @param {string} agentId - Unique agent identifier
   * @param {Object} agentData - Agent metadata and capabilities
   */
  async addAgent(agentId, agentData = {}) {
    if (this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} already exists in swarm`);
    }

    const agent = {
      id: agentId,
      data: agentData,
      joinedAt: new Date(),
      status: 'active'
    };

    this.agents.set(agentId, agent);
    
    // Emit event for other peers to handle
    this.emit('agent:joined', { agentId, agentData });
    
    return agent;
  }

  /**
   * Remove an agent from the swarm
   * @param {string} agentId - Agent identifier to remove
   */
  async removeAgent(agentId) {
    if (!this.agents.has(agentId)) {
      return false;
    }

    const agent = this.agents.get(agentId);
    agent.status = 'disconnected';
    
    this.emit('agent:left', { agentId });
    
    // Actually remove after a grace period to allow cleanup
    setTimeout(() => {
      this.agents.delete(agentId);
    }, 1000);

    return true;
  }

  /**
   * Start the swarm networking
   */
  async start() {
    if (this.isRunning) {
      throw new Error('Swarm is already running');
    }

    this.isRunning = true;
    
    // Initialize P2P networking here
    // This would typically involve WebRTC, libp2p, or similar
    
    this.emit('swarm:started', { id: this.id });
  }

  /**
   * Shutdown the swarm gracefully
   */
  async shutdown() {
    if (!this.isRunning) {
      return;
    }

    // Notify all agents of shutdown
    for (const [agentId] of this.agents) {
      this.emit('agent:left', { agentId });
    }

    // Close all connections
    for (const [peerId, connection] of this.connections) {
      if (connection.close) {
        connection.close();
      }
    }

    this.connections.clear();
    this.agents.clear();
    this.isRunning = false;

    this.emit('swarm:shutdown', { id: this.id });
  }

  /**
   * Coordinate a handoff between agents
   * @param {string} fromAgentId - Agent handing off
   * @param {string} toAgentId - Agent receiving handoff
   * @param {Object} context - Handoff context/data
   */
  async coordinateHandoff(fromAgentId, toAgentId, context) {
    if (!this.agents.has(fromAgentId) || !this.agents.has(toAgentId)) {
      throw new Error('One or both agents not found in swarm');
    }

    // Perform the handoff coordination
    const handoff = {
      from: fromAgentId,
      to: toAgentId,
      context,
      timestamp: new Date()
    };

    this.emit('handoff:coordinated', handoff);

    return handoff;
  }

  /**
   * Get swarm status information
   */
  getStatus() {
    return {
      id: this.id,
      isRunning: this.isRunning,
      agentCount: this.agents.size,
      agents: Array.from(this.agents.values()),
      connectionCount: this.connections.size
    };
  }
}