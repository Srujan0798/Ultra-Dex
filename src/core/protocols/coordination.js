/**
 * Multi-Agent Coordination Protocol
 * Enables agents to communicate, negotiate, and coordinate actions
 *
 * @module AgentCoordinationProtocol
 * @version 1.0.0
 */

import { EventEmitter } from 'events';

class AgentCoordinationProtocol extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      defaultTimeout: config.defaultTimeout || 30000,
      maxHops: config.maxHops || 5,
      enableNegotiation: config.enableNegotiation !== false,
      consensusThreshold: config.consensusThreshold || 0.66,
      ...config,
    };

    this.agents = new Map();
    this.sessions = new Map();
    this.messageQueue = [];
    this.protocols = new Map();
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      negotiations: 0,
      conflicts: 0,
    };

    this.initialized = false;
  }

  /**
   * Initialize coordination protocol
   */
  async initialize() {
    // Register built-in protocols
    this._registerDefaultProtocols();

    // Start message processor
    this._startMessageProcessor();

    this.initialized = true;
    this.emit('initialized');
    return true;
  }

  /**
   * Register an agent in the coordination network
   * @param {string} agentId - Agent ID
   * @param {Object} capabilities - Agent capabilities
   * @param {Function} messageHandler - Handler for incoming messages
   */
  registerAgent(agentId, capabilities = [], messageHandler) {
    this._ensureInitialized();

    this.agents.set(agentId, {
      id: agentId,
      capabilities,
      status: 'active',
      messageHandler,
      inbox: [],
      lastActive: Date.now(),
    });

    this.emit('agent:registered', { agentId, capabilities });
  }

  /**
   * Create coordination session
   * @param {Object} options - Session options
   * @returns {Object} Session
   */
  createSession(options = {}) {
    this._ensureInitialized();

    const sessionId = this._generateSessionId();
    const session = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      leader: options.leader || null,
      agents: new Set(options.agents || []),
      goal: options.goal || null,
      status: 'active',
      messages: [],
      decisions: [],
      context: options.context || {},
    };

    this.sessions.set(sessionId, session);

    this.emit('session:created', { sessionId });

    return session;
  }

  /**
   * Send message between agents
   * @param {Object} message - Message object
   * @returns {Promise<Object>} Send result
   */
  async sendMessage(message) {
    this._ensureInitialized();

    const {
      from,
      to,
      type = 'message',
      content,
      sessionId = null,
      requiresResponse = false,
      timeout = this.config.defaultTimeout,
      metadata = {},
    } = message;

    // Validate sender and receiver
    if (!this.agents.has(from)) {
      throw new Error(`Sender agent '${from}' not registered`);
    }

    if (!this.agents.has(to)) {
      throw new Error(`Receiver agent '${to}' not registered`);
    }

    const messageId = this._generateMessageId();
    const envelope = {
      id: messageId,
      from,
      to,
      type,
      content,
      sessionId,
      timestamp: new Date().toISOString(),
      requiresResponse,
      timeout,
      metadata,
      status: 'pending',
      hops: 0,
    };

    // Add to queue
    this.messageQueue.push(envelope);
    this.metrics.messagesSent++;

    this.emit('message:sent', envelope);

    if (requiresResponse) {
      return this._waitForResponse(messageId, timeout);
    }

    return { messageId, status: 'sent' };
  }

  /**
   * Broadcast message to multiple agents
   * @param {string} from - Sender agent ID
   * @param {Array<string>} to - Receiver agent IDs
   * @param {Object} content - Message content
   * @param {Object} options - Broadcast options
   * @returns {Promise<Array<Object>>} Results
   */
  async broadcast(from, to, content, options = {}) {
    const promises = to.map((agentId) =>
      this.sendMessage({
        from,
        to: agentId,
        content,
        ...options,
      })
    );

    return Promise.allSettled(promises);
  }

  /**
   * Coordinate task among multiple agents
   * @param {string} sessionId - Session ID
   * @param {Object} task - Task to coordinate
   * @returns {Promise<Object>} Coordination result
   */
  async coordinate(sessionId, task) {
    this._ensureInitialized();

    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session '${sessionId}' not found`);
    }

    const coordination = {
      task,
      assignments: new Map(),
      results: new Map(),
      status: 'coordinating',
    };

    // Find best agents for task
    const assignments = this._assignTaskToAgents(task, Array.from(session.agents));

    // Send task assignments
    for (const [agentId, subtask] of assignments) {
      coordination.assignments.set(agentId, subtask);

      await this.sendMessage({
        from: session.leader || 'coordinator',
        to: agentId,
        type: 'task_assignment',
        content: subtask,
        sessionId,
        requiresResponse: true,
      });
    }

    // Wait for all results (with timeout)
    const timeout = task.timeout || this.config.defaultTimeout;
    const results = await this._gatherResults(sessionId, coordination.assignments, timeout);

    coordination.results = results;
    coordination.status = 'complete';

    // Aggregate results
    const aggregated = this._aggregateResults(results, task.aggregationStrategy);

    this.emit('coordination:complete', { sessionId, task, results: aggregated });

    return {
      task,
      assignments: Object.fromEntries(coordination.assignments),
      results: Object.fromEntries(results),
      aggregated,
      duration: Date.now() - new Date(session.createdAt).getTime(),
    };
  }

  /**
   * Negotiate between conflicting agents
   * @param {string} sessionId - Session ID
   * @param {Array<string>} agents - Agents in conflict
   * @param {Object} conflict - Conflict details
   * @returns {Promise<Object>} Negotiation result
   */
  async negotiate(sessionId, agents, conflict) {
    this._ensureInitialized();

    if (!this.config.enableNegotiation) {
      throw new Error('Negotiation is disabled');
    }

    this.metrics.negotiations++;

    const negotiation = {
      id: this._generateNegotiationId(),
      sessionId,
      agents,
      conflict,
      proposals: new Map(),
      round: 0,
      maxRounds: 5,
    };

    // Request proposals from all agents
    const proposalPromises = agents.map((agentId) =>
      this.sendMessage({
        from: 'negotiator',
        to: agentId,
        type: 'negotiation_request',
        content: { conflict, negotiationId: negotiation.id },
        sessionId,
        requiresResponse: true,
        timeout: 10000,
      })
    );

    const proposals = await Promise.allSettled(proposalPromises);

    // Collect valid proposals
    proposals.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        negotiation.proposals.set(agents[index], result.value.content);
      }
    });

    // Find consensus or best compromise
    const resolution = this._resolveNegotiation(negotiation);

    this.emit('negotiation:complete', { negotiationId: negotiation.id, resolution });

    return {
      negotiationId: negotiation.id,
      proposals: Object.fromEntries(negotiation.proposals),
      resolution,
      consensus: resolution.consensus,
    };
  }

  /**
   * Multi-model consensus - Ask multiple agents, take majority vote
   * @param {string} question - Question to ask
   * @param {Array<string>} agents - Agent IDs to ask
   * @param {Object} options - Options
   * @returns {Promise<Object>} Consensus result
   */
  async consensus(question, agents, options = {}) {
    this._ensureInitialized();

    const { threshold = this.config.consensusThreshold } = options;

    // Query all agents
    const queryPromises = agents.map((agentId) =>
      this.sendMessage({
        from: 'consensus_coordinator',
        to: agentId,
        type: 'consensus_query',
        content: { question },
        requiresResponse: true,
        timeout: 15000,
      }).catch(() => null)
    );

    const responses = await Promise.all(queryPromises);
    const validResponses = responses.filter((r) => r !== null);

    // Count responses
    const counts = {};
    validResponses.forEach((response) => {
      const answer = response.content?.answer || 'no_response';
      counts[answer] = (counts[answer] || 0) + 1;
    });

    // Find majority
    const total = validResponses.length;
    let consensus = null;
    let maxCount = 0;

    for (const [answer, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        consensus = answer;
      }
    }

    const confidence = maxCount / total;

    return {
      question,
      responses: validResponses.map((r) => ({
        agent: r.from,
        answer: r.content?.answer,
      })),
      consensus: confidence >= threshold ? consensus : null,
      confidence,
      counts,
    };
  }

  /**
   * Verify agent identity and role
   * @param {string} agentId - Agent ID
   * @param {string} expectedRole - Expected role
   * @returns {boolean} Verification result
   */
  verifyIdentity(agentId, expectedRole) {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    // Check capabilities match expected role
    return agent.capabilities.includes(expectedRole);
  }

  /**
   * End coordination session
   * @param {string} sessionId - Session ID
   */
  endSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'ended';
      session.endedAt = new Date().toISOString();

      this.emit('session:ended', { sessionId });
    }
  }

  /**
   * Get protocol statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      agents: this.agents.size,
      sessions: this.sessions.size,
      queueLength: this.messageQueue.length,
      ...this.metrics,
    };
  }

  // Private methods
  _ensureInitialized() {
    if (!this.initialized) {
      throw new Error('Coordination protocol not initialized');
    }
  }

  _registerDefaultProtocols() {
    // Request-response protocol
    this.protocols.set('request-response', {
      name: 'Request-Response',
      handler: async (message) => {
        // Default request-response logic
      },
    });

    // Publish-subscribe protocol
    this.protocols.set('pub-sub', {
      name: 'Publish-Subscribe',
      handler: async (message) => {
        // Default pub-sub logic
      },
    });

    // Consensus protocol
    this.protocols.set('consensus', {
      name: 'Consensus',
      handler: async (message) => {
        // Default consensus logic
      },
    });
  }

  _startMessageProcessor() {
    setInterval(async () => {
      if (this.messageQueue.length === 0) return;

      const message = this.messageQueue.shift();

      try {
        await this._processMessage(message);
      } catch (error) {
        this.emit('message:error', { message, error });
      }
    }, 10);
  }

  async _processMessage(message) {
    const agent = this.agents.get(message.to);
    if (!agent) {
      throw new Error(`Agent '${message.to}' not found`);
    }

    // Deliver message
    if (agent.messageHandler) {
      await agent.messageHandler(message);
    } else {
      agent.inbox.push(message);
    }

    agent.lastActive = Date.now();
    this.metrics.messagesReceived++;

    this.emit('message:delivered', message);
  }

  _waitForResponse(messageId, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Response timeout after ${timeout}ms`));
      }, timeout);

      const handler = (message) => {
        if (message.inReplyTo === messageId) {
          clearTimeout(timer);
          this.off('message:delivered', handler);
          resolve(message);
        }
      };

      this.on('message:delivered', handler);
    });
  }

  _assignTaskToAgents(task, availableAgents) {
    const assignments = new Map();

    // Simple round-robin assignment (in production, use capability matching)
    const subtasks = task.subtasks || [task];

    subtasks.forEach((subtask, index) => {
      const agentId = availableAgents[index % availableAgents.length];
      assignments.set(agentId, subtask);
    });

    return assignments;
  }

  async _gatherResults(sessionId, assignments, timeout) {
    const results = new Map();
    const startTime = Date.now();

    const pending = new Set(assignments.keys());

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        // Check for responses
        const session = this.sessions.get(sessionId);
        if (session) {
          session.messages.forEach((msg) => {
            if (msg.type === 'task_result' && pending.has(msg.from)) {
              results.set(msg.from, msg.content);
              pending.delete(msg.from);
            }
          });
        }

        // Check completion
        if (pending.size === 0 || Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          resolve(results);
        }
      }, 100);
    });
  }

  _aggregateResults(results, strategy = 'concatenate') {
    const resultArray = Array.from(results.values());

    switch (strategy) {
      case 'concatenate':
        return resultArray.join('\n');

      case 'merge':
        return resultArray.reduce((acc, result) => ({ ...acc, ...result }), {});

      case 'vote':
        // Simple majority vote
        const votes = {};
        resultArray.forEach((r) => {
          const key = JSON.stringify(r);
          votes[key] = (votes[key] || 0) + 1;
        });
        return Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];

      default:
        return resultArray;
    }
  }

  _resolveNegotiation(negotiation) {
    const proposals = Array.from(negotiation.proposals.values());

    if (proposals.length === 0) {
      return { consensus: false, resolution: null };
    }

    // Simple majority resolution
    const votes = {};
    proposals.forEach((p) => {
      const key = JSON.stringify(p);
      votes[key] = (votes[key] || 0) + 1;
    });

    const total = proposals.length;
    const [winningProposal, count] = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];

    return {
      consensus: count / total >= this.config.consensusThreshold,
      resolution: JSON.parse(winningProposal),
      votes: count,
      total,
    };
  }

  _generateSessionId() {
    return `coord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _generateNegotiationId() {
    return `neg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export { AgentCoordinationProtocol };
export default AgentCoordinationProtocol;
