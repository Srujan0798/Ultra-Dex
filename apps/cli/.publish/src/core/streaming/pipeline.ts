var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import { EventEmitter } from 'events';
let StreamTransform = class {
  constructor({ name, transform, filter = null, errorHandler = null }) {
    this.name = name;
    this.transform = transform;
    this.filter = filter;
    this.errorHandler = errorHandler;
    this.stats = { processed: 0, filtered: 0, errors: 0, totalMs: 0 };
  }
  async process(event) {
    const start = Date.now();
    try {
      if (this.filter && !this.filter(event)) {
        this.stats.filtered++;
        return null;
      }
      const result = await this.transform(event);
      this.stats.processed++;
      this.stats.totalMs += Date.now() - start;
      return result;
    } catch (error) {
      this.stats.errors++;
      this.stats.totalMs += Date.now() - start;
      if (this.errorHandler) {
        return this.errorHandler(error, event);
      }
      throw error;
    }
  }
  getStats() {
    return {
      ...this.stats,
      avgMs: this.stats.processed > 0 ? Math.round(this.stats.totalMs / this.stats.processed) : 0,
    };
  }
};
StreamTransform = __decorateClass([singleton()], StreamTransform);
let StreamBuffer = class {
  constructor({ maxSize = 100, flushIntervalMs = 5e3, onFlush }) {
    this.maxSize = maxSize;
    this.flushIntervalMs = flushIntervalMs;
    this.onFlush = onFlush;
    this.buffer = [];
    this.flushCount = 0;
    this.timer = null;
  }
  add(event) {
    this.buffer.push({ event, timestamp: Date.now() });
    if (this.buffer.length >= this.maxSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushIntervalMs);
    }
  }
  async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.buffer.length === 0) return;
    const batch = [...this.buffer];
    this.buffer = [];
    this.flushCount++;
    if (this.onFlush) {
      await this.onFlush(batch);
    }
    return batch;
  }
  getStats() {
    return {
      bufferSize: this.buffer.length,
      maxSize: this.maxSize,
      flushCount: this.flushCount,
    };
  }
  destroy() {
    if (this.timer) clearTimeout(this.timer);
    this.buffer = [];
  }
};
StreamBuffer = __decorateClass([singleton()], StreamBuffer);
let StreamPipeline = class extends EventEmitter {
  constructor({ name = 'default', backpressureLimit = 1e3, deadLetterQueue = true } = {}) {
    super();
    this.name = name;
    this.transforms = [];
    this.running = false;
    this.backpressureLimit = backpressureLimit;
    this.deadLetterQueue = deadLetterQueue ? [] : null;
    this.stats = { ingested: 0, output: 0, dropped: 0, errors: 0 };
    this.buffers = /* @__PURE__ */ new Map();
  }
  /**
   * Add a transform step to the pipeline
   */
  addTransform(config) {
    const transform = config instanceof StreamTransform ? config : new StreamTransform(config);
    this.transforms.push(transform);
    return this;
  }
  /**
   * Add a buffer stage for batch processing
   */
  addBuffer(name, config) {
    const buffer = new StreamBuffer(config);
    this.buffers.set(name, buffer);
    return this;
  }
  /**
   * Start the pipeline
   */
  start() {
    this.running = true;
    this.emit('pipeline:start', { name: this.name });
  }
  /**
   * Stop the pipeline and flush all buffers
   */
  async stop() {
    this.running = false;
    for (const [name, buffer] of this.buffers) {
      await buffer.flush();
    }
    this.emit('pipeline:stop', { name: this.name, stats: this.getStats() });
  }
  /**
   * Ingest an event into the pipeline
   */
  async ingest(event) {
    if (!this.running) {
      this.stats.dropped++;
      return null;
    }
    if (this.stats.ingested - this.stats.output > this.backpressureLimit) {
      this.stats.dropped++;
      this.emit('pipeline:backpressure', { queued: this.stats.ingested - this.stats.output });
      return null;
    }
    this.stats.ingested++;
    this.emit('event:ingested', { event });
    let current = { ...event, _pipelineTimestamp: Date.now() };
    for (const transform of this.transforms) {
      try {
        const result = await transform.process(current);
        if (result === null) {
          return null;
        }
        current = result;
      } catch (error) {
        this.stats.errors++;
        if (this.deadLetterQueue) {
          this.deadLetterQueue.push({
            event: current,
            error: error.message,
            transform: transform.name,
            timestamp: Date.now(),
          });
        }
        this.emit('event:error', { event: current, error, transform: transform.name });
        return null;
      }
    }
    this.stats.output++;
    this.emit('event:output', { event: current });
    return current;
  }
  /**
   * Ingest a batch of events
   */
  async ingestBatch(events) {
    const results = [];
    for (const event of events) {
      const result = await this.ingest(event);
      if (result) results.push(result);
    }
    return results;
  }
  /**
   * Get pipeline stats
   */
  getStats() {
    return {
      name: this.name,
      running: this.running,
      pipeline: { ...this.stats },
      deadLetterQueue: this.deadLetterQueue ? this.deadLetterQueue.length : 0,
      transforms: this.transforms.map((t) => ({ name: t.name, ...t.getStats() })),
      buffers: Object.fromEntries([...this.buffers].map(([k, v]) => [k, v.getStats()])),
    };
  }
  /**
   * Get dead letter queue entries
   */
  getDeadLetters(limit = 50) {
    if (!this.deadLetterQueue) return [];
    return this.deadLetterQueue.slice(-limit);
  }
  /**
   * Replay dead letter queue entries
   */
  async replayDeadLetters(count = 10) {
    if (!this.deadLetterQueue || this.deadLetterQueue.length === 0) return [];
    const toReplay = this.deadLetterQueue.splice(0, count);
    const results = [];
    for (const entry of toReplay) {
      const result = await this.ingest(entry.event);
      results.push({ original: entry, result });
    }
    return results;
  }
  destroy() {
    this.running = false;
    for (const [, buffer] of this.buffers) {
      buffer.destroy();
    }
  }
};
StreamPipeline = __decorateClass([singleton()], StreamPipeline);
var pipeline_default = StreamPipeline;
export { StreamBuffer, StreamPipeline, StreamTransform, pipeline_default as default };
