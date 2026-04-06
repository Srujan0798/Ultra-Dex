// Copyright (c) 2026 Ultra-Dex
// Protocol - Agent communication protocol

import { EventEmitter } from 'events';

/**
 * Protocol
 * Base communication protocol for agents
 */
export class Protocol extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = {
      timeout: options.timeout || 30000,
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      enableEncryption: options.enableEncryption || false,
      enableCompression: options.enableCompression || false,
      ...options
    };
    this.state = 'idle';
    this.handlers = new Map();
    this.connections = new Map();
    this.messageQueue = [];
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      errorsCount: 0,
      averageLatency: 0,
      latencies: []
    };
  }

  /**
   * Initialize protocol
   */
  async initialize() {
    this.state = 'ready';
    this.emit('protocol.ready');
    return this;
  }

  /**
   * Register message handler
   */
  registerHandler(messageType, handler) {
    this.handlers.set(messageType, handler);
    this.emit('handler.registered', { messageType });
    return this;
  }

  /**
   * Unregister message handler
   */
  unregisterHandler(messageType) {
    this.handlers.delete(messageType);
    this.emit('handler.unregistered', { messageType });
    return this;
  }

  /**
   * Send message
   */
  async send(target, message, options = {}) {
    const messageId = this.generateId();
    const startTime = Date.now();

    const envelope = {
      id: messageId,
      from: options.from,
      to: target,
      type: message.type,
      payload: message.payload,
      timestamp: startTime,
      ttl: options.ttl || 3600000,
      retryCount: 0
    };

    this.emit('message.sending', { messageId, target });

    try {
      const result = await this.sendWithRetry(envelope, options);

      const latency = Date.now() - startTime;
      this.recordLatency(latency);
      this.stats.messagesSent++;

      this.emit('message.sent', { messageId, target, latency });
      return result;
    } catch (error) {
      this.stats.errorsCount++;
      this.emit('message.send-failed', { messageId, target, error });
      throw error;
    }
  }

  /**
   * Send with retry
   */
  async sendWithRetry(envelope, options = {}, attempt = 0) {
    try {
      return await this.performSend(envelope);
    } catch (error) {
      if (attempt < this.config.retryAttempts) {
        const delay = this.config.retryDelay * Math.pow(2, attempt);
        this.emit('message.retry', {
          messageId: envelope.id,
          attempt: attempt + 1,
          delay,
          error
        });

        await this.delay(delay);
        return this.sendWithRetry(envelope, options, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Perform actual send
   */
  async performSend(envelope) {
    // This would be overridden by subclasses to implement actual transport
    this.emit('message.transmitted', envelope);
    return { success: true, messageId: envelope.id };
  }

  /**
   * Receive message
   */
  async receive(message) {
    const startTime = Date.now();

    this.stats.messagesReceived++;

    this.emit('message.received', { messageId: message.id, from: message.from });

    try {
      const handler = this.handlers.get(message.type);

      if (!handler) {
        throw new Error(`No handler for message type: ${message.type}`);
      }

      const response = await handler(message);

      const latency = Date.now() - startTime;
      this.recordLatency(latency);

      this.emit('message.handled', { messageId: message.id, latency });

      return response;
    } catch (error) {
      this.stats.errorsCount++;
      this.emit('message.handle-failed', { messageId: message.id, error });
      throw error;
    }
  }

  /**
   * Request-response pattern
   */
  async request(target, message, options = {}) {
    const messageId = this.generateId();
    const timeout = options.timeout || this.config.timeout;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Request timeout: ${messageId}`));
      }, timeout);

      this.once(`response-${messageId}`, (response) => {
        clearTimeout(timer);
        resolve(response);
      });

      this.send(target, { ...message, requestId: messageId }, {
        ...options,
        expectsResponse: true
      }).catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  /**
   * Respond to message
   */
  async respond(requestId, response) {
    this.emit(`response-${requestId}`, response);
  }

  /**
   * Broadcast message to multiple targets
   */
  async broadcast(targets, message, options = {}) {
    const promises = targets.map(target =>
      this.send(target, message, { ...options, broadcast: true })
        .catch(error => ({ error, target }))
    );

    return Promise.allSettled(promises);
  }

  /**
   * Record message latency
   */
  recordLatency(latency) {
    this.stats.latencies.push(latency);

    if (this.stats.latencies.length > 1000) {
      this.stats.latencies.shift();
    }

    this.stats.averageLatency =
      this.stats.latencies.reduce((a, b) => a + b, 0) / this.stats.latencies.length;
  }

  /**
   * Get protocol statistics
   */
  getStats() {
    return {
      ...this.stats,
      messageTypes: this.handlers.size,
      activeConnections: this.connections.size,
      queuedMessages: this.messageQueue.length
    };
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Shutdown protocol
   */
  async shutdown() {
    this.state = 'shutdown';
    this.handlers.clear();
    this.connections.clear();
    this.messageQueue = [];
    this.emit('protocol.shutdown');
  }
}

/**
 * ExecutionTrace
 * Traces execution of tasks across agents
 */
export class ExecutionTrace {
  constructor(options = {}) {
    this.id = options.id || `trace-${Date.now()}`;
    this.taskId = options.taskId;
    this.agentId = options.agentId;
    this.startTime = Date.now();
    this.endTime = null;
    this.steps = [];
    this.metadata = options.metadata || {};
  }

  addStep(step) {
    this.steps.push({
      timestamp: Date.now(),
      ...step
    });
  }

  complete(result) {
    this.endTime = Date.now();
    this.result = result;
    this.duration = this.endTime - this.startTime;
  }

  toJSON() {
    return {
      id: this.id,
      taskId: this.taskId,
      agentId: this.agentId,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.duration,
      steps: this.steps,
      result: this.result,
      metadata: this.metadata
    };
  }
}

export default Protocol;
