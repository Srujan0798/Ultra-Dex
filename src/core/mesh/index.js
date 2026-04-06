import MessageBus from './bus-interface.js';
import { InMemoryMessageBus } from './in-memory-adapter.js';
import { RedisMessageBus } from './redis-adapter.js';
import { KafkaMessageBus } from './kafka-adapter.js';

export function createBus(type = 'memory', config = {}) {
  switch (type) {
    case 'memory':
      return new InMemoryMessageBus(config);
    case 'redis':
      return new RedisMessageBus(config);
    case 'kafka':
      return new KafkaMessageBus(config);
    default:
      throw new Error(`Unsupported bus type: ${type}`);
  }
}

export function getBusHealth(bus) {
  if (!bus) {
    return {
      connected: false,
      type: 'unknown',
    };
  }

  return typeof bus.getStats === 'function'
    ? bus.getStats()
    : {
        connected: true,
        type: bus.constructor?.name || 'custom',
      };
}

export {
  MessageBus,
  InMemoryMessageBus,
  RedisMessageBus,
  KafkaMessageBus,
};

export default createBus;
