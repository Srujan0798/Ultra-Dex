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
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
let Job = class {
  constructor({ id = null, type = "task", payload = null, priority = 5, maxRetries = 3, delayMs = 0 }) {
    this.id = id || `job_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    this.type = type;
    this.payload = payload;
    this.priority = priority;
    this.maxRetries = maxRetries;
    this.delayMs = delayMs;
    this.status = "pending";
    this.attempts = 0;
    this.result = null;
    this.error = null;
    this.createdAt = Date.now();
    this.startedAt = null;
    this.completedAt = null;
    this.scheduledFor = Date.now() + delayMs;
  }
  isReady() {
    return this.status === "pending" && Date.now() >= this.scheduledFor;
  }
};
Job = __decorateClass([
  singleton()
], Job);
let QueueProcessor = class extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      concurrency: config.concurrency || 5,
      pollIntervalMs: config.pollIntervalMs || 100,
      maxQueueSize: config.maxQueueSize || 1e4,
      retryDelayMs: config.retryDelayMs || 5e3,
      defaultType: config.defaultType || "task",
      ...config
    };
    this.queue = [];
    this.handlers = /* @__PURE__ */ new Map();
    this.activeJobs = /* @__PURE__ */ new Map();
    this.completedJobs = [];
    this.failedJobs = [];
    this.running = false;
    this.pollTimer = null;
    this.stats = {
      enqueued: 0,
      processed: 0,
      failed: 0,
      retried: 0,
      totalMs: 0
    };
  }
  normalizeJob(task, priority = 5, options = {}) {
    if (task instanceof Job) {
      return task;
    }
    if (task && typeof task === "object" && task.type && Object.hasOwn(task, "payload")) {
      return new Job(task);
    }
    return new Job({
      type: options.type || this.config.defaultType,
      payload: task,
      priority,
      maxRetries: options.maxRetries,
      delayMs: options.delayMs
    });
  }
  registerHandler(type, handler) {
    this.handlers.set(type, handler);
    return this;
  }
  enqueue(task, priority = 5, options = {}) {
    if (this.queue.length >= this.config.maxQueueSize) {
      throw new Error(`Queue is full (${this.config.maxQueueSize})`);
    }
    const job = this.normalizeJob(task, priority, options);
    const insertAt = this.queue.findIndex(
      (existing) => existing.priority > job.priority || existing.priority === job.priority && existing.createdAt > job.createdAt
    );
    if (insertAt === -1) {
      this.queue.push(job);
    } else {
      this.queue.splice(insertAt, 0, job);
    }
    this.stats.enqueued++;
    this.emit("job:enqueued", { id: job.id, type: job.type, priority: job.priority });
    if (this.running) {
      this.pump();
    }
    return job;
  }
  dequeue(type = null) {
    const index = this.queue.findIndex((job) => job.isReady() && (!type || job.type === type));
    if (index === -1) {
      return null;
    }
    return this.queue.splice(index, 1)[0];
  }
  async process(type = null) {
    if (this.activeJobs.size >= this.config.concurrency) {
      return null;
    }
    const job = this.dequeue(type);
    if (!job) {
      return null;
    }
    this.runJob(job);
    return job;
  }
  async runJob(job) {
    const handler = this.handlers.get(job.type);
    if (typeof handler !== "function") {
      job.status = "failed";
      job.error = `No handler registered for "${job.type}"`;
      job.completedAt = Date.now();
      this.failedJobs.push(job);
      this.stats.failed++;
      this.emit("job:failed", {
        id: job.id,
        type: job.type,
        status: job.status,
        error: job.error,
        job
      });
      return;
    }
    job.status = "running";
    job.startedAt = Date.now();
    job.attempts++;
    this.activeJobs.set(job.id, job);
    this.emit("job:started", { id: job.id, type: job.type, attempt: job.attempts });
    try {
      const result = await handler(job.payload, job);
      job.status = "completed";
      job.result = result;
      job.completedAt = Date.now();
      this.completedJobs.push(job);
      this.stats.processed++;
      this.stats.totalMs += job.completedAt - job.startedAt;
      this.emit("job:completed", {
        id: job.id,
        type: job.type,
        status: job.status,
        result,
        durationMs: job.completedAt - job.startedAt,
        job
      });
    } catch (error) {
      job.error = error?.message || String(error);
      if (job.attempts < job.maxRetries) {
        job.status = "pending";
        job.scheduledFor = Date.now() + this.config.retryDelayMs * job.attempts;
        this.stats.retried++;
        this.queue.push(job);
        this.queue.sort((left, right) => {
          if (left.priority !== right.priority) {
            return left.priority - right.priority;
          }
          return left.createdAt - right.createdAt;
        });
        this.emit("job:retry", {
          id: job.id,
          type: job.type,
          attempt: job.attempts,
          nextRetryMs: this.config.retryDelayMs * job.attempts
        });
      } else {
        job.status = "failed";
        job.completedAt = Date.now();
        this.failedJobs.push(job);
        this.stats.failed++;
        this.emit("job:failed", {
          id: job.id,
          type: job.type,
          status: job.status,
          error: job.error,
          attempts: job.attempts,
          job
        });
      }
    } finally {
      this.activeJobs.delete(job.id);
      this.evictCompleted();
      if (this.running) {
        setImmediate(() => this.pump());
      }
    }
  }
  async pump() {
    while (this.running && this.activeJobs.size < this.config.concurrency) {
      const job = await this.process();
      if (!job) {
        break;
      }
    }
  }
  start() {
    if (this.running) {
      return this;
    }
    this.running = true;
    this.pollTimer = setInterval(() => {
      this.pump();
    }, this.config.pollIntervalMs);
    this.emit("processor:started");
    this.pump();
    return this;
  }
  async stop() {
    this.running = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    while (this.activeJobs.size > 0) {
      await sleep(10);
    }
    this.emit("processor:stopped");
  }
  getJob(id) {
    if (this.activeJobs.has(id)) {
      return this.activeJobs.get(id);
    }
    return this.queue.find((job) => job.id === id) || this.completedJobs.find((job) => job.id === id) || this.failedJobs.find((job) => job.id === id) || null;
  }
  getStats() {
    return {
      ...this.stats,
      running: this.running,
      queued: this.queue.length,
      active: this.activeJobs.size,
      avgMs: this.stats.processed > 0 ? Math.round(this.stats.totalMs / this.stats.processed) : 0,
      completed: this.completedJobs.length,
      failedJobs: this.failedJobs.length
    };
  }
  getDashboard() {
    return {
      ...this.getStats(),
      recentCompleted: this.completedJobs.slice(-5).map((job) => ({
        id: job.id,
        type: job.type,
        durationMs: job.completedAt - job.startedAt
      })),
      recentFailed: this.failedJobs.slice(-5).map((job) => ({
        id: job.id,
        type: job.type,
        error: job.error,
        attempts: job.attempts
      }))
    };
  }
  evictCompleted() {
    if (this.completedJobs.length > 1e3) {
      this.completedJobs = this.completedJobs.slice(-500);
    }
  }
};
QueueProcessor = __decorateClass([
  singleton()
], QueueProcessor);
var queue_processor_default = QueueProcessor;
export {
  Job,
  QueueProcessor,
  queue_processor_default as default
};
