// Logger compatibility layer for governance audit
// Delegates to Better Stack logger

import { logger as betterStackLogger } from '../monitoring/better-stack-logger.js';

class GovernanceLogger {
  subscribers = new Map();

  subscribe(topic, handler, options = {}) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, []);
    }
    this.subscribers.get(topic).push({ handler, options });
  }

  async event(eventType, data, options = {}) {
    // Log to Better Stack
    betterStackLogger.track(eventType, data);

    // Notify subscribers
    const subscribers = this.subscribers.get(eventType) || [];
    for (const { handler } of subscribers) {
      try {
        await handler({ data, timestamp: Date.now() });
      } catch (error) {
        console.error('Logger subscriber error:', error);
      }
    }
  }

  // Delegate other methods to Better Stack logger
  info(message, context) {
    betterStackLogger.info(message, context);
  }

  error(message, error, context) {
    betterStackLogger.error(message, error, context);
  }

  warn(message, context) {
    betterStackLogger.warn(message, context);
  }

  debug(message, context) {
    betterStackLogger.debug(message, context);
  }
}

export const logger = new GovernanceLogger();
