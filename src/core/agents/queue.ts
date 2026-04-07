var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
import { singleton } from "tsyringe";
import { EventEmitter } from "events";
let Queue = class extends EventEmitter {
  constructor(options = {}) {
    super();
    this.queues = /* @__PURE__ */ new Map();
    this.config = {
      maxQueueSize: options.maxQueueSize || 1e4,
      minPriority: options.minPriority || 0,
      maxPriority: options.maxPriority || 10,
      ...options
    };
    this.state = "idle";
    this.stats = {
      itemsEnqueued: 0,
      itemsDequeued: 0,
      averageQueueTime: 0,
      queueTimes: []
    };
    this.initializeQueues();
  }
  /**
   * Initialize priority queues
   */
  initializeQueues() {
    for (let i = this.config.minPriority; i <= this.config.maxPriority; i++) {
      this.queues.set(i, []);
    }
  }
  /**
   * Enqueue an item
   */
  enqueue(item, priority = 5) {
    if (priority < this.config.minPriority || priority > this.config.maxPriority) {
      throw new Error(`Invalid priority ${priority}`);
    }
    if (this.getTotalSize() >= this.config.maxQueueSize) {
      throw new Error("Queue is full");
    }
    item.enqueuedAt = Date.now();
    item.priority = priority;
    this.queues.get(priority).push(item);
    this.stats.itemsEnqueued++;
    this.emit("item.enqueued", { item, priority, queueSize: this.getTotalSize() });
    return item;
  }
  /**
   * Dequeue an item (highest priority first)
   */
  dequeue() {
    for (let i = this.config.maxPriority; i >= this.config.minPriority; i--) {
      const queue = this.queues.get(i);
      if (queue.length > 0) {
        const item = queue.shift();
        const queueTime = Date.now() - item.enqueuedAt;
        this.stats.queueTimes.push(queueTime);
        if (this.stats.queueTimes.length > 1e3) {
          this.stats.queueTimes.shift();
        }
        this.stats.averageQueueTime = this.stats.queueTimes.reduce((a, b) => a + b, 0) / this.stats.queueTimes.length;
        this.stats.itemsDequeued++;
        this.emit("item.dequeued", { item, queueTime, queueSize: this.getTotalSize() });
        return item;
      }
    }
    return null;
  }
  /**
   * Peek at next item
   */
  peek() {
    for (let i = this.config.maxPriority; i >= this.config.minPriority; i--) {
      const queue = this.queues.get(i);
      if (queue.length > 0) {
        return queue[0];
      }
    }
    return null;
  }
  /**
   * Get queue size
   */
  getQueueSize(priority) {
    if (!Number.isInteger(priority)) {
      return this.getTotalSize();
    }
    return this.queues.get(priority)?.length || 0;
  }
  /**
   * Get total queue size
   */
  getTotalSize() {
    let total = 0;
    for (const queue of this.queues.values()) {
      total += queue.length;
    }
    return total;
  }
  /**
   * Clear a priority queue
   */
  clearPriority(priority) {
    const queue = this.queues.get(priority);
    if (!queue)
      return;
    const count = queue.length;
    queue.length = 0;
    this.emit("queue.cleared", { priority, itemsCleared: count });
  }
  /**
   * Clear all queues
   */
  clear() {
    for (const queue of this.queues.values()) {
      queue.length = 0;
    }
    this.emit("queues.cleared");
  }
  /**
   * Is queue empty
   */
  isEmpty() {
    return this.getTotalSize() === 0;
  }
  /**
   * Is queue full
   */
  isFull() {
    return this.getTotalSize() >= this.config.maxQueueSize;
  }
  /**
   * Update item priority
   */
  updatePriority(itemId, newPriority) {
    if (newPriority < this.config.minPriority || newPriority > this.config.maxPriority) {
      throw new Error(`Invalid priority ${newPriority}`);
    }
    for (let i = this.config.minPriority; i <= this.config.maxPriority; i++) {
      const queue = this.queues.get(i);
      const index = queue.findIndex((item) => item.id === itemId);
      if (index !== -1) {
        const [item] = queue.splice(index, 1);
        item.priority = newPriority;
        this.queues.get(newPriority).push(item);
        this.emit("item.priority-updated", { itemId, oldPriority: i, newPriority });
        return true;
      }
    }
    return false;
  }
  /**
   * Find item
   */
  findItem(predicate) {
    for (const queue of this.queues.values()) {
      const item = queue.find(predicate);
      if (item)
        return item;
    }
    return null;
  }
  /**
   * Filter items
   */
  filter(predicate) {
    const results = [];
    for (const queue of this.queues.values()) {
      results.push(...queue.filter(predicate));
    }
    return results;
  }
  /**
   * Get all items
   */
  getAll() {
    const items = [];
    for (let i = this.config.maxPriority; i >= this.config.minPriority; i--) {
      items.push(...this.queues.get(i));
    }
    return items;
  }
  /**
   * Get queue statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalSize: this.getTotalSize(),
      sizeByPriority: Object.fromEntries(
        Array.from(this.queues.entries()).map(([priority, queue]) => [priority, queue.length])
      )
    };
  }
  /**
   * Batch dequeue
   */
  dequeueBatch(count) {
    const items = [];
    for (let i = 0; i < count; i++) {
      const item = this.dequeue();
      if (!item)
        break;
      items.push(item);
    }
    return items;
  }
  /**
   * Batch enqueue
   */
  enqueueBatch(items) {
    const results = [];
    for (const item of items) {
      try {
        results.push(this.enqueue(item, item.priority || 5));
      } catch (error) {
        results.push({ error, item });
      }
    }
    return results;
  }
};
Queue = __decorateClass([
  singleton()
], Queue);
var queue_default = Queue;
export {
  Queue,
  queue_default as default
};
