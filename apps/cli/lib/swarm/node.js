// Copyright (c) 2026 Ultra-Dex
// Decentralized Agent Swarm - P2P Protocol

/**
 * SwarmNode - A single node in the decentralized agent swarm
 * Implements peer discovery, message passing, and task distribution
 */

import EventEmitter from 'events';
import crypto from 'crypto';

export class SwarmNode extends EventEmitter {
    constructor(options = {}) {
        super();
        this.id = options.id || crypto.randomUUID();
        this.name = options.name || `node-${this.id.slice(0, 8)}`;
        this.peers = new Map();
        this.tasks = new Map();
        this.capabilities = new Set(options.capabilities || ['general']);
        this.status = 'idle';
    }

    /**
     * Connect to a peer node
     */
    connect(peer) {
        if (peer.id === this.id) return false;

        this.peers.set(peer.id, {
            node: peer,
            connectedAt: Date.now(),
            latency: 0
        });

        peer.peers.set(this.id, {
            node: this,
            connectedAt: Date.now(),
            latency: 0
        });

        this.emit('peer:connected', peer);
        peer.emit('peer:connected', this);
        return true;
    }

    /**
     * Disconnect from a peer
     */
    disconnect(peerId) {
        const peer = this.peers.get(peerId);
        if (!peer) return false;

        this.peers.delete(peerId);
        peer.node.peers.delete(this.id);

        this.emit('peer:disconnected', peerId);
        return true;
    }

    /**
     * Broadcast a message to all peers
     */
    broadcast(message) {
        const envelope = {
            from: this.id,
            timestamp: Date.now(),
            message
        };

        for (const [_peerId, peer] of this.peers) {
            peer.node.receive(envelope);
        }

        return this.peers.size;
    }

    /**
     * Receive a message from a peer
     */
    receive(envelope) {
        this.emit('message', envelope);

        if (envelope.message.type === 'task:request') {
            this.handleTaskRequest(envelope);
        } else if (envelope.message.type === 'task:result') {
            this.handleTaskResult(envelope);
        }
    }

    /**
     * Submit a task to the swarm
     */
    submitTask(task) {
        const taskId = crypto.randomUUID();
        const taskEnvelope = {
            id: taskId,
            submittedBy: this.id,
            task,
            status: 'pending',
            createdAt: Date.now()
        };

        this.tasks.set(taskId, taskEnvelope);

        // Broadcast task to capable peers
        this.broadcast({
            type: 'task:request',
            taskId,
            task
        });

        return taskId;
    }

    /**
     * Handle incoming task request
     */
    handleTaskRequest(envelope) {
        const { taskId, task } = envelope.message;

        // Check if we have the capability
        if (!this.hasCapability(task.requiredCapability)) {
            return;
        }

        // Accept the task (simple first-come basis)
        this.status = 'working';
        this.emit('task:accepted', taskId);

        // Simulate task execution
        setTimeout(() => {
            const result = {
                taskId,
                executedBy: this.id,
                result: `Completed: ${task.description}`,
                completedAt: Date.now()
            };

            this.status = 'idle';

            // Send result back
            const sender = this.peers.get(envelope.from);
            if (sender) {
                sender.node.receive({
                    from: this.id,
                    timestamp: Date.now(),
                    message: {
                        type: 'task:result',
                        ...result
                    }
                });
            }
        }, task.estimatedTimeMs || 1000);
    }

    /**
     * Handle task result
     */
    handleTaskResult(envelope) {
        const { taskId, result } = envelope.message;
        const task = this.tasks.get(taskId);

        if (task) {
            task.status = 'completed';
            task.result = result;
            task.completedAt = envelope.message.completedAt;
            this.emit('task:completed', task);
        }
    }

    /**
     * Check if node has a capability
     */
    hasCapability(capability) {
        return this.capabilities.has(capability) || this.capabilities.has('general');
    }

    /**
     * Get swarm statistics
     */
    getStats() {
        return {
            id: this.id,
            name: this.name,
            peers: this.peers.size,
            tasks: this.tasks.size,
            completedTasks: [...this.tasks.values()].filter(t => t.status === 'completed').length,
            capabilities: [...this.capabilities],
            status: this.status
        };
    }
}

/**
 * Swarm - Orchestrates multiple SwarmNodes
 */
export class Swarm {
    constructor() {
        this.nodes = new Map();
    }

    /**
     * Create and add a new node to the swarm
     */
    createNode(options = {}) {
        const node = new SwarmNode(options);
        this.nodes.set(node.id, node);
        return node;
    }

    /**
     * Connect all nodes in a mesh topology
     */
    meshConnect() {
        const nodeList = [...this.nodes.values()];

        for (let i = 0; i < nodeList.length; i++) {
            for (let j = i + 1; j < nodeList.length; j++) {
                nodeList[i].connect(nodeList[j]);
            }
        }
    }

    /**
     * Get overall swarm statistics
     */
    getStats() {
        const nodes = [...this.nodes.values()].map(n => n.getStats());
        return {
            totalNodes: this.nodes.size,
            totalPeers: nodes.reduce((sum, n) => sum + n.peers, 0) / 2,
            totalTasks: nodes.reduce((sum, n) => sum + n.tasks, 0),
            completedTasks: nodes.reduce((sum, n) => sum + n.completedTasks, 0),
            nodes
        };
    }
}

export default { SwarmNode, Swarm };

/**
 * Error handler for node
 * @param {Error} error - Error to handle
 */
function _handleError(error) {
  try {
    console.error('[node]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
