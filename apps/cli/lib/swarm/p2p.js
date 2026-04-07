// Copyright (c) 2026 Ultra-Dex

/**
 * Decentralized Agent Swarm - P2P Protocol
 * Enables agents to communicate peer-to-peer without central coordination
 */

import EventEmitter from 'events';
import crypto from 'crypto';
import { AgentMessage, HandoffPayload } from '../swarm/protocol.js';

/**
 * P2P Node - Represents an agent in the decentralized swarm
 */
export class P2PNode extends EventEmitter {
  constructor(agentId, options = {}) {
    super();
    this.id = agentId;
    this.peers = new Map(); // peerId -> connection
    this.topics = new Map(); // topic -> Set of subscribers
    this.messageLog = new Map(); // messageId -> { message, timestamp }
    this.options = {
      heartbeatInterval: 5000,
      messageTTL: 300000, // 5 minutes
      maxPeers: 50,
      ...options,
    };
    this.isRunning = false;
    this.heartbeatTimer = null;
  }

  /**
   * Start the P2P node
   */
  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Start heartbeat
    this.heartbeatTimer = setInterval(() => {
      this.broadcastHeartbeat();
    }, this.options.heartbeatInterval);

    this.emit('started', { nodeId: this.id });
    return this;
  }

  /**
   * Stop the P2P node
   */
  async stop() {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Disconnect all peers
    for (const [peerId, _peer] of this.peers) {
      this.disconnect(peerId);
    }

    this.emit('stopped', { nodeId: this.id });
    return this;
  }

  /**
   * Connect to a peer
   */
  connect(peerId, connection) {
    if (this.peers.size >= this.options.maxPeers) {
      throw new Error(`Max peers (${this.options.maxPeers}) reached`);
    }

    this.peers.set(peerId, {
      id: peerId,
      connection,
      connectedAt: Date.now(),
      lastSeen: Date.now(),
      capabilities: new Set(),
    });

    this.emit('peer:connected', { peerId });
    return this;
  }

  /**
   * Disconnect from a peer
   */
  disconnect(peerId) {
    const peer = this.peers.get(peerId);
    if (peer) {
      this.peers.delete(peerId);
      this.emit('peer:disconnected', { peerId });
    }
    return this;
  }

  /**
   * Subscribe to a topic
   */
  subscribe(topic, handler) {
    if (!this.topics.has(topic)) {
      this.topics.set(topic, new Set());
    }
    this.topics.get(topic).add(handler);
    this.emit('subscribed', { topic });
    return this;
  }

  /**
   * Unsubscribe from a topic
   */
  unsubscribe(topic, handler) {
    const handlers = this.topics.get(topic);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.topics.delete(topic);
      }
    }
    this.emit('unsubscribed', { topic });
    return this;
  }

  /**
   * Publish message to a topic (gossip protocol)
   */
  async publish(topic, message) {
    const envelope = {
      id: crypto.randomUUID(),
      topic,
      from: this.id,
      message: message instanceof AgentMessage ? message.toJSON() : message,
      timestamp: Date.now(),
      ttl: this.options.messageTTL,
      hops: 0,
    };

    // Store in message log
    this.messageLog.set(envelope.id, {
      envelope,
      receivedAt: Date.now(),
    });

    // Forward to peers
    await this.gossip(envelope);

    // Process locally if subscribed
    const handlers = this.topics.get(topic);
    if (handlers) {
      for (const handler of handlers) {
        try {
          await handler(envelope.message, envelope);
        } catch (error) {
          this.emit('error', { error, envelope });
        }
      }
    }

    this.emit('published', { envelope });
    return envelope.id;
  }

  /**
   * Gossip message to connected peers
   */
  async gossip(envelope) {
    if (envelope.hops >= 10) return; // Max hops

    envelope.hops++;

    const promises = [];
    for (const [peerId, peer] of this.peers) {
      // Don't send back to sender
      if (peerId === envelope.from) continue;

      // Check if already received (prevent loops)
      if (peer.lastMessageIds?.has(envelope.id)) continue;

      promises.push(
        this.sendToPeer(peerId, {
          type: 'gossip',
          envelope,
        }).catch((err) => {
          this.emit('error', { error: err, peerId });
        })
      );
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send direct message to a peer
   */
  async sendToPeer(peerId, data) {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error(`Peer ${peerId} not found`);
    }

    // Simulate network send - in real implementation would use WebSocket/WebRTC
    peer.lastSeen = Date.now();

    // Emit for the peer connection to handle
    this.emit('send', { peerId, data });

    return true;
  }

  /**
   * Receive message from a peer
   */
  async receiveFromPeer(peerId, data) {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.lastSeen = Date.now();
    }

    switch (data.type) {
      case 'gossip':
        await this.handleGossip(data.envelope, peerId);
        break;
      case 'direct':
        this.emit('message', {
          from: peerId,
          message: data.message,
          type: 'direct',
        });
        break;
      case 'heartbeat':
        this.handleHeartbeat(peerId, data);
        break;
      case 'handoff':
        await this.handleHandoff(data.handoff, peerId);
        break;
    }
  }

  /**
   * Handle gossip message
   */
  async handleGossip(envelope, fromPeerId) {
    // Check if already seen
    if (this.messageLog.has(envelope.id)) {
      return;
    }

    // Validate TTL
    if (Date.now() - envelope.timestamp > envelope.ttl) {
      return;
    }

    // Store in message log
    this.messageLog.set(envelope.id, {
      envelope,
      receivedAt: Date.now(),
      fromPeer: fromPeerId,
    });

    // Process if subscribed
    const handlers = this.topics.get(envelope.topic);
    if (handlers) {
      for (const handler of handlers) {
        try {
          await handler(envelope.message, envelope);
        } catch (error) {
          this.emit('error', { error, envelope });
        }
      }
    }

    // Forward to other peers
    await this.gossip(envelope);

    this.emit('received:gossip', { envelope, fromPeerId });
  }

  /**
   * Broadcast heartbeat to all peers
   */
  broadcastHeartbeat() {
    const heartbeat = {
      type: 'heartbeat',
      from: this.id,
      timestamp: Date.now(),
      peers: this.peers.size,
    };

    for (const [peerId] of this.peers) {
      this.sendToPeer(peerId, heartbeat).catch(() => {
        // Peer might be dead, disconnect
        this.disconnect(peerId);
      });
    }
  }

  /**
   * Handle incoming heartbeat
   */
  handleHeartbeat(peerId, _data) {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.lastSeen = Date.now();
    }
  }

  /**
   * Send handoff to specific peer
   */
  async sendHandoff(peerId, handoffPayload) {
    return this.sendToPeer(peerId, {
      type: 'handoff',
      handoff: handoffPayload instanceof HandoffPayload ? handoffPayload.toJSON() : handoffPayload,
    });
  }

  /**
   * Handle incoming handoff
   */
  async handleHandoff(handoffData, fromPeerId) {
    const handoff = HandoffPayload.fromJSON(handoffData);
    this.emit('handoff:received', {
      handoff,
      fromPeerId,
      message: handoff.toMessage(),
    });
  }

  /**
   * Get network stats
   */
  getStats() {
    return {
      peers: this.peers.size,
      topics: this.topics.size,
      messages: this.messageLog.size,
      uptime: this.isRunning ? Date.now() - this.startTime : 0,
    };
  }

  /**
   * Get connected peers
   */
  getPeers() {
    return Array.from(this.peers.keys());
  }

  /**
   * Discover peers with specific capability
   */
  discoverPeers(capability) {
    const matches = [];
    for (const [peerId, peer] of this.peers) {
      if (peer.capabilities.has(capability)) {
        matches.push(peerId);
      }
    }
    return matches;
  }
}

/**
 * DecentralizedSwarm - High-level P2P swarm coordinator
 */
export class DecentralizedSwarm extends EventEmitter {
  constructor(swarmId, options = {}) {
    super();
    this.id = swarmId;
    this.nodes = new Map(); // agentId -> P2PNode
    this.options = {
      discoveryInterval: 10000,
      consensusThreshold: 0.67, // 2/3 majority
      ...options,
    };
    this.consensusLog = new Map();
  }

  /**
   * Add agent to decentralized swarm
   */
  async addAgent(agentId, options = {}) {
    const node = new P2PNode(agentId, options);

    node.on('message', (data) => {
      this.emit('agent:message', { agentId, ...data });
    });

    node.on('handoff:received', (data) => {
      this.emit('agent:handoff', { agentId, ...data });
    });

    await node.start();
    this.nodes.set(agentId, node);

    this.emit('agent:joined', { agentId });
    return node;
  }

  /**
   * Remove agent from swarm
   */
  async removeAgent(agentId) {
    const node = this.nodes.get(agentId);
    if (node) {
      await node.stop();
      this.nodes.delete(agentId);
      this.emit('agent:left', { agentId });
    }
  }

  /**
   * Connect two agents in the swarm
   */
  connectAgents(agentId1, agentId2) {
    const node1 = this.nodes.get(agentId1);
    const node2 = this.nodes.get(agentId2);

    if (!node1 || !node2) {
      throw new Error('Both agents must be in the swarm');
    }

    // Create bidirectional connection
    node1.connect(agentId2, { type: 'p2p', target: agentId2 });
    node2.connect(agentId1, { type: 'p2p', target: agentId1 });

    this.emit('agents:connected', { agentId1, agentId2 });
  }

  /**
   * Broadcast task to all agents
   */
  async broadcastTask(task, topic = 'tasks') {
    const promises = [];
    for (const [_agentId, node] of this.nodes) {
      promises.push(
        node.publish(topic, {
          type: 'task',
          task,
          from: 'swarm',
        })
      );
    }
    await Promise.allSettled(promises);
  }

  /**
   * Coordinate handoff between agents via P2P
   */
  async coordinateHandoff(fromAgentId, toAgentId, payload) {
    const fromNode = this.nodes.get(fromAgentId);
    if (!fromNode) {
      throw new Error(`Agent ${fromAgentId} not found`);
    }

    await fromNode.sendHandoff(toAgentId, payload);

    this.emit('handoff:coordinated', {
      from: fromAgentId,
      to: toAgentId,
      payload,
    });
  }

  /**
   * Reach consensus on a decision (Byzantine Fault Tolerant)
   */
  async proposeConsensus(topic, proposal) {
    const proposalId = crypto.randomUUID();
    const votes = new Map();

    // Broadcast proposal
    await this.broadcastTask(
      {
        type: 'consensus:propose',
        proposalId,
        topic,
        proposal,
      },
      'consensus'
    );

    // Collect votes
    const checkConsensus = () => {
      const totalNodes = this.nodes.size;
      const yesVotes = Array.from(votes.values()).filter((v) => v === 'yes').length;
      return yesVotes / totalNodes >= this.options.consensusThreshold;
    };

    // Wait for votes (timeout after 30 seconds)
    await new Promise((resolve) => {
      const timeout = setTimeout(resolve, 30000);

      const checkInterval = setInterval(() => {
        if (checkConsensus()) {
          clearTimeout(timeout);
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });

    const accepted = checkConsensus();
    this.consensusLog.set(proposalId, {
      topic,
      proposal,
      votes: Object.fromEntries(votes),
      accepted,
      timestamp: Date.now(),
    });

    return { proposalId, accepted, votes: Object.fromEntries(votes) };
  }

  /**
   * Get swarm topology
   */
  getTopology() {
    const topology = {
      id: this.id,
      agents: [],
      connections: [],
    };

    for (const [agentId, node] of this.nodes) {
      topology.agents.push({
        id: agentId,
        peers: node.getPeers(),
        stats: node.getStats(),
      });

      for (const peerId of node.getPeers()) {
        topology.connections.push([agentId, peerId]);
      }
    }

    return topology;
  }

  /**
   * Shutdown the swarm
   */
  async shutdown() {
    const promises = [];
    for (const [agentId, _node] of this.nodes) {
      promises.push(this.removeAgent(agentId));
    }
    await Promise.all(promises);
    this.emit('shutdown');
  }
}

export default { P2PNode, DecentralizedSwarm };
