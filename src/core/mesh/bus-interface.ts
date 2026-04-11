/**
 * Message Bus Interface
 *
 * Provides distributed messaging capabilities for Ultra-Dex mesh nodes.
 * Implements pub/sub, request/reply, and broadcast patterns using Redis as the backend.
 *
 * @module core/mesh/bus-interface
 */

import Redis from 'ioredis';
import { EventEmitter } from 'events';
import { BetterStackLogger } from '../monitoring/better-stack-logger.js';

/**
 * Message handler function type
 */
export type MessageHandler = (message: unknown, metadata: MessageMetadata) => void | Promise<void>;

/**
 * Message metadata containing routing information
 */
export interface MessageMetadata {
  channel: string;
  timestamp: number;
  nodeId: string;
  messageId: string;
}

/**
 * Request options for request/reply pattern
 */
export interface RequestOptions {
  timeout?: number;
  correlationId?: string;
}

/**
 * Message Bus configuration options
 */
export interface MessageBusConfig {
  redisUrl?: string;
  nodeId?: string;
  keyPrefix?: string;
}

/**
 * Distributed Message Bus using Redis
 *
 * Implements:
 * - Pub/Sub: Broadcast messages to subscribers
 * - Request/Reply: Send request and wait for response
 * - Broadcast: Fan-out to all nodes
 */
export class MessageBus extends EventEmitter {
  private subscriber: Redis | null = null;
  private publisher: Redis | null = null;
  private isConnected = false;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private pendingRequests: Map<
    string,
    { resolve: Function; reject: Function; timeout: NodeJS.Timeout }
  > = new Map();
  private nodeId: string;
  private keyPrefix: string;
  private logger: BetterStackLogger;

  constructor(config: MessageBusConfig = {}) {
    super();
    this.nodeId = config.nodeId || `node-${Math.random().toString(36).slice(2, 11)}`;
    this.keyPrefix = config.keyPrefix || 'ultra-dex:mesh';
    this.logger = new BetterStackLogger();
  }

  /**
   * Connect to the message bus
   * @returns {Promise<void>}
   * @throws {Error} If connection fails
   */
  async connect(redisUrl?: string): Promise<void> {
    if (this.isConnected) {
      this.logger.warn('Already connected to message bus');
      return;
    }

    const url = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      // Create separate connections for pub/sub
      this.subscriber = new Redis(url, {
        retryStrategy: (times) => Math.min(times * 100, 3000),
        maxRetriesPerRequest: 3,
      });

      this.publisher = new Redis(url, {
        retryStrategy: (times) => Math.min(times * 100, 3000),
        maxRetriesPerRequest: 3,
      });

      // Handle subscriber messages
      this.subscriber.on('message', (channel, message) => {
        this._handleMessage(channel, message);
      });

      // Handle pattern messages for wildcards
      this.subscriber.on('pmessage', (pattern, channel, message) => {
        this._handleMessage(channel, message, pattern);
      });

      // Wait for connections to be ready
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          this.subscriber!.once('ready', resolve);
          this.subscriber!.once('error', reject);
        }),
        new Promise<void>((resolve, reject) => {
          this.publisher!.once('ready', resolve);
          this.publisher!.once('error', reject);
        }),
      ]);

      this.isConnected = true;
      this.logger.info(`Message bus connected (${this.nodeId})`);

      // Subscribe to node-specific reply channel
      await this._subscribeToNodeChannel();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to connect to message bus: ${err.message}`);
      throw new Error(`MessageBus connection failed: ${err.message}`);
    }
  }

  /**
   * Disconnect from the message bus
   * @returns {Promise<void>}
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    // Clear pending requests
    for (const [correlationId, { reject, timeout }] of this.pendingRequests) {
      clearTimeout(timeout);
      reject(new Error('Message bus disconnected'));
      this.pendingRequests.delete(correlationId);
    }

    // Unsubscribe from all channels
    if (this.subscriber) {
      await this.subscriber.unsubscribe();
      await this.subscriber.punsubscribe();
      await this.subscriber.quit();
      this.subscriber = null;
    }

    if (this.publisher) {
      await this.publisher.quit();
      this.publisher = null;
    }

    this.handlers.clear();
    this.isConnected = false;
    this.logger.info('Message bus disconnected');
  }

  /**
   * Publish a message to a channel
   * @param {string} channel - The channel to publish to
   * @param {object} message - The message to publish
   * @returns {Promise<void>}
   * @throws {Error} If not connected or publish fails
   */
  async publish(channel: string, message: unknown): Promise<void> {
    this._ensureConnected();

    const envelope = {
      payload: message,
      metadata: this._createMetadata(channel),
    };

    const channelKey = `${this.keyPrefix}:channel:${channel}`;

    try {
      await this.publisher!.publish(channelKey, JSON.stringify(envelope));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to publish to ${channel}: ${err.message}`);
      throw new Error(`Publish failed: ${err.message}`);
    }
  }

  /**
   * Subscribe to a channel
   * @param {string} channel - The channel to subscribe to (supports wildcards with *)
   * @param {Function} handler - The message handler function
   * @returns {Promise<() => Promise<void>>} Unsubscribe function
   * @throws {Error} If not connected
   */
  async subscribe(channel: string, handler: MessageHandler): Promise<() => Promise<void>> {
    this._ensureConnected();

    const channelKey = `${this.keyPrefix}:channel:${channel}`;

    // Add handler to local registry
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
    }
    this.handlers.get(channel)!.add(handler);

    // Subscribe in Redis
    try {
      if (channel.includes('*')) {
        await this.subscriber!.psubscribe(channelKey);
      } else {
        await this.subscriber!.subscribe(channelKey);
      }
      this.logger.info(`Subscribed to ${channel}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to subscribe to ${channel}: ${err.message}`);
      throw new Error(`Subscribe failed: ${err.message}`);
    }

    // Return unsubscribe function
    return async () => {
      this.handlers.get(channel)?.delete(handler);
      if (this.handlers.get(channel)?.size === 0) {
        if (channel.includes('*')) {
          await this.subscriber!.punsubscribe(channelKey);
        } else {
          await this.subscriber!.unsubscribe(channelKey);
        }
        this.handlers.delete(channel);
      }
    };
  }

  /**
   * Send a request and wait for a response
   * @param {string} targetChannel - The channel to send request to
   * @param {object} message - The request message
   * @param {number} timeout - Timeout in milliseconds (default: 5000)
   * @returns {Promise<object>} - The response message
   * @throws {Error} If timeout or not connected
   */
  async request(targetChannel: string, message: unknown, timeout: number = 5000): Promise<unknown> {
    this._ensureConnected();

    const correlationId = this._generateId();
    const replyChannel = `${this.keyPrefix}:reply:${this.nodeId}:${correlationId}`;

    const envelope = {
      payload: message,
      metadata: {
        ...this._createMetadata(targetChannel),
        replyTo: this.nodeId,
        correlationId,
      },
    };

    const targetKey = `${this.keyPrefix}:channel:${targetChannel}`;

    return new Promise(async (resolve, reject) => {
      // Set timeout
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(correlationId);
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);

      // Store pending request
      this.pendingRequests.set(correlationId, {
        resolve: (response: unknown) => {
          clearTimeout(timeoutId);
          this.pendingRequests.delete(correlationId);
          resolve(response);
        },
        reject: (error: Error) => {
          clearTimeout(timeoutId);
          this.pendingRequests.delete(correlationId);
          reject(error);
        },
        timeout: timeoutId,
      });

      // Subscribe to reply channel
      try {
        await this.subscriber!.subscribe(replyChannel);
      } catch (error) {
        clearTimeout(timeoutId);
        this.pendingRequests.delete(correlationId);
        reject(error);
        return;
      }

      // Publish request
      try {
        await this.publisher!.publish(targetKey, JSON.stringify(envelope));
      } catch (error) {
        clearTimeout(timeoutId);
        this.pendingRequests.delete(correlationId);
        await this.subscriber!.unsubscribe(replyChannel);
        reject(error);
      }
    });
  }

  /**
   * Send a reply to a request
   * @param {string} replyTo - The node ID to reply to
   * @param {string} correlationId - The correlation ID from the request
   * @param {object} message - The response message
   * @returns {Promise<void>}
   */
  async reply(replyTo: string, correlationId: string, message: unknown): Promise<void> {
    this._ensureConnected();

    const replyChannel = `${this.keyPrefix}:reply:${replyTo}:${correlationId}`;

    const envelope = {
      payload: message,
      metadata: this._createMetadata(replyChannel),
    };

    try {
      await this.publisher!.publish(replyChannel, JSON.stringify(envelope));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to send reply: ${err.message}`);
      throw new Error(`Reply failed: ${err.message}`);
    }
  }

  /**
   * Broadcast an event to all nodes
   * @param {string} event - The event name
   * @param {object} payload - The event payload
   * @returns {Promise<void>}
   * @throws {Error} If not connected
   */
  async broadcast(event: string, payload: unknown): Promise<void> {
    this._ensureConnected();

    const channel = `${this.keyPrefix}:broadcast:${event}`;

    const envelope = {
      payload,
      metadata: {
        ...this._createMetadata(event),
        broadcast: true,
      },
    };

    try {
      await this.publisher!.publish(channel, JSON.stringify(envelope));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to broadcast ${event}: ${err.message}`);
      throw new Error(`Broadcast failed: ${err.message}`);
    }
  }

  /**
   * Get connection status
   * @returns {boolean} True if connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get node ID
   * @returns {string} Current node ID
   */
  getNodeId(): string {
    return this.nodeId;
  }

  // -----------------------------------------------------------------------
  // Private Methods
  // -----------------------------------------------------------------------

  private _ensureConnected(): void {
    if (!this.isConnected) {
      throw new Error('Message bus not connected. Call connect() first.');
    }
  }

  private _createMetadata(channel: string): MessageMetadata {
    return {
      channel,
      timestamp: Date.now(),
      nodeId: this.nodeId,
      messageId: this._generateId(),
    };
  }

  private _generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  private async _subscribeToNodeChannel(): Promise<void> {
    const nodeChannel = `${this.keyPrefix}:node:${this.nodeId}`;
    await this.subscriber!.subscribe(nodeChannel);
  }

  private _handleMessage(channel: string, message: string, pattern?: string): Promise<void> | void {
    try {
      const envelope = JSON.parse(message);
      const { payload, metadata } = envelope;

      // Handle reply channel
      if (channel.includes(':reply:')) {
        const parts = channel.split(':');
        const correlationId = parts[parts.length - 1];
        const pending = this.pendingRequests.get(correlationId);
        if (pending) {
          pending.resolve(payload);
        }
        return;
      }

      // Extract channel name from full channel key
      const channelName = pattern
        ? this._matchPattern(
            pattern.replace(`${this.keyPrefix}:channel:`, ''),
            channel.replace(`${this.keyPrefix}:channel:`, '')
          )
        : channel
            .replace(`${this.keyPrefix}:channel:`, '')
            .replace(`${this.keyPrefix}:broadcast:`, '');

      // Call handlers
      const handlers = this.handlers.get(channelName);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            const result = handler(payload, metadata);
            if (result instanceof Promise) {
              result.catch((err) => {
                this.logger.error(`Handler error for ${channelName}: ${err.message}`);
              });
            }
          } catch (err) {
            this.logger.error(
              `Handler error for ${channelName}: ${err instanceof Error ? err.message : String(err)}`
            );
          }
        });
      }

      // Emit for broadcast events
      if (channel.includes(':broadcast:')) {
        const eventName = channelName;
        this.emit(eventName, payload, metadata);
      }
    } catch (err) {
      this.logger.error(
        `Failed to handle message on ${channel}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  private _matchPattern(pattern: string, channel: string): string {
    // Simple pattern matching for wildcards
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(channel) ? pattern : channel;
  }
}

export default MessageBus;
