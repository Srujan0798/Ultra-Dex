// Copyright (c) 2026 Ultra-Dex
// src/core/orchestration/communication-bus.js

/**
 * Agent Communication Bus
 * Facilitates communication between agents in the swarm
 */

export class AgentCommunicationBus {
  constructor() {
    this.channels = new Map(); // channelName -> Set of subscribers
    this.messages = []; // message history
    this.maxHistory = 1000; // maximum messages to keep in history
    this.isConnected = false;
  }

  async initialize() {
    this.isConnected = true;
    process.stdout.write('📡 Agent Communication Bus initialized\n');
  }

  /**
   * Subscribe to a channel
   */
  subscribe(channel, handler) {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel).add(handler);
    return () => this.unsubscribe(channel, handler); // Return unsubscribe function
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel, handler) {
    const subscribers = this.channels.get(channel);
    if (subscribers) {
      subscribers.delete(handler);
      if (subscribers.size === 0) {
        this.channels.delete(channel);
      }
    }
  }

  /**
   * Publish a message to a channel
   */
  async publish(channel, message, metadata = {}) {
    if (!this.isConnected) {
      throw new Error('Communication bus is not connected');
    }

    const envelope = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      channel,
      message,
      metadata,
      timestamp: new Date().toISOString()
    };

    // Add to message history
    this.messages.push(envelope);
    if (this.messages.length > this.maxHistory) {
      this.messages.shift(); // Remove oldest message
    }

    // Notify all subscribers
    const subscribers = this.channels.get(channel);
    if (subscribers) {
      for (const handler of subscribers) {
        try {
          await handler(envelope);
        } catch (error) {
          process.stderr.write(`Error in subscriber handler for channel ${channel}: ${error.message}\n`);
        }
      }
    }

    return envelope.id;
  }

  /**
   * Get message history for a channel
   */
  getChannelHistory(channel, limit = 50) {
    return this.messages
      .filter(msg => msg.channel === channel)
      .slice(-limit);
  }

  /**
   * Get all channels
   */
  getChannels() {
    return Array.from(this.channels.keys());
  }

  /**
   * Get subscriber count for a channel
   */
  getSubscriberCount(channel) {
    const subscribers = this.channels.get(channel);
    return subscribers ? subscribers.size : 0;
  }

  async shutdown() {
    this.isConnected = false;
    this.channels.clear();
    this.messages = [];
  }
}