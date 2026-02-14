// Copyright (c) 2026 Ultra-Dex
// Queue Processor — Background job processing with priorities, retries, and scheduling

import { EventEmitter } from 'events';

/**
 * Job — represents a queued unit of work
 */
export class Job {
    constructor({ id = null, type, payload, priority = 5, maxRetries = 3, delayMs = 0 }) {
        this.id = id || `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        this.type = type;
        this.payload = payload;
        this.priority = priority;
        this.maxRetries = maxRetries;
        this.delayMs = delayMs;
        this.status = 'pending'; // pending → running → completed / failed / retrying
        this.attempts = 0;
        this.result = null;
        this.error = null;
        this.createdAt = Date.now();
        this.startedAt = null;
        this.completedAt = null;
        this.scheduledFor = Date.now() + delayMs;
    }

    isReady() {
        return this.status === 'pending' && Date.now() >= this.scheduledFor;
    }
}

/**
 * QueueProcessor — manages job queues with workers
 */
export class QueueProcessor extends EventEmitter {
    constructor({
        concurrency = 5,
        pollIntervalMs = 100,
        maxQueueSize = 10000,
        retryDelayMs = 5000,
    } = {}) {
        super();
        this.concurrency = concurrency;
        this.pollIntervalMs = pollIntervalMs;
        this.maxQueueSize = maxQueueSize;
        this.retryDelayMs = retryDelayMs;

        this.queues = new Map(); // type → Job[]
        this.handlers = new Map(); // type → handler function
        this.activeJobs = new Set();
        this.completedJobs = [];
        this.failedJobs = [];
        this.running = false;
        this.pollTimer = null;
        this.stats = { enqueued: 0, processed: 0, failed: 0, retried: 0, totalMs: 0 };
    }

    /**
     * Register a job handler for a type
     */
    registerHandler(type, handler) {
        this.handlers.set(type, handler);
        if (!this.queues.has(type)) {
            this.queues.set(type, []);
        }
        return this;
    }

    /**
     * Enqueue a job
     */
    enqueue(config) {
        const job = config instanceof Job ? config : new Job(config);

        if (!this.queues.has(job.type)) {
            this.queues.set(job.type, []);
        }

        const queue = this.queues.get(job.type);
        if (queue.length >= this.maxQueueSize) {
            throw new Error(`Queue "${job.type}" is full (${this.maxQueueSize})`);
        }

        // Insert by priority (lower = higher priority)
        const idx = queue.findIndex(j => j.priority > job.priority);
        if (idx === -1) queue.push(job);
        else queue.splice(idx, 0, job);

        this.stats.enqueued++;
        this.emit('job:enqueued', { id: job.id, type: job.type, priority: job.priority });

        // Process immediately if running
        if (this.running) this._processNext();

        return job;
    }

    /**
     * Start processing jobs
     */
    start() {
        this.running = true;
        this.pollTimer = setInterval(() => this._processNext(), this.pollIntervalMs);
        this.emit('processor:started');
        this._processNext();
    }

    /**
     * Stop processing (finish active jobs)
     */
    async stop() {
        this.running = false;
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }

        // Wait for active jobs to finish
        while (this.activeJobs.size > 0) {
            await new Promise(r => setTimeout(r, 100));
        }

        this.emit('processor:stopped');
    }

    /**
     * Process the next available job
     */
    async _processNext() {
        if (!this.running) return;
        if (this.activeJobs.size >= this.concurrency) return;

        // Find next ready job across all queues
        let nextJob = null;
        let nextQueue = null;

        for (const [type, queue] of this.queues) {
            if (!this.handlers.has(type)) continue;
            const ready = queue.find(j => j.isReady());
            if (ready && (!nextJob || ready.priority < nextJob.priority)) {
                nextJob = ready;
                nextQueue = queue;
            }
        }

        if (!nextJob) return;

        // Remove from queue and process
        const idx = nextQueue.indexOf(nextJob);
        if (idx !== -1) nextQueue.splice(idx, 1);

        this.activeJobs.add(nextJob.id);
        nextJob.status = 'running';
        nextJob.startedAt = Date.now();
        nextJob.attempts++;

        this.emit('job:started', { id: nextJob.id, type: nextJob.type, attempt: nextJob.attempts });

        try {
            const handler = this.handlers.get(nextJob.type);
            const result = await handler(nextJob.payload, nextJob);

            nextJob.status = 'completed';
            nextJob.result = result;
            nextJob.completedAt = Date.now();
            this.stats.processed++;
            this.stats.totalMs += nextJob.completedAt - nextJob.startedAt;

            this.completedJobs.push(nextJob);
            this._evictCompleted();

            this.emit('job:completed', { id: nextJob.id, type: nextJob.type, durationMs: nextJob.completedAt - nextJob.startedAt });
        } catch (error) {
            nextJob.error = error.message;

            if (nextJob.attempts < nextJob.maxRetries) {
                nextJob.status = 'pending';
                nextJob.scheduledFor = Date.now() + this.retryDelayMs * nextJob.attempts;
                this.stats.retried++;

                // Re-enqueue
                if (!this.queues.has(nextJob.type)) this.queues.set(nextJob.type, []);
                this.queues.get(nextJob.type).push(nextJob);

                this.emit('job:retry', { id: nextJob.id, attempt: nextJob.attempts, nextRetryMs: this.retryDelayMs * nextJob.attempts });
            } else {
                nextJob.status = 'failed';
                nextJob.completedAt = Date.now();
                this.stats.failed++;
                this.failedJobs.push(nextJob);

                this.emit('job:failed', { id: nextJob.id, error: error.message, attempts: nextJob.attempts });
            }
        } finally {
            this.activeJobs.delete(nextJob.id);
            // Continue processing
            if (this.running) setImmediate(() => this._processNext());
        }
    }

    /**
     * Get queue status
     */
    getQueueSizes() {
        const sizes = {};
        for (const [type, queue] of this.queues) {
            sizes[type] = queue.length;
        }
        return sizes;
    }

    /**
     * Get job by ID
     */
    getJob(id) {
        for (const queue of this.queues.values()) {
            const job = queue.find(j => j.id === id);
            if (job) return job;
        }
        const completed = this.completedJobs.find(j => j.id === id);
        if (completed) return completed;
        const failed = this.failedJobs.find(j => j.id === id);
        return failed || null;
    }

    /**
     * Get dashboard
     */
    getDashboard() {
        return {
            running: this.running,
            concurrency: this.concurrency,
            active: this.activeJobs.size,
            queues: this.getQueueSizes(),
            handlers: [...this.handlers.keys()],
            recentCompleted: this.completedJobs.slice(-5).map(j => ({
                id: j.id, type: j.type, durationMs: j.completedAt - j.startedAt,
            })),
            recentFailed: this.failedJobs.slice(-5).map(j => ({
                id: j.id, type: j.type, error: j.error, attempts: j.attempts,
            })),
            stats: {
                ...this.stats,
                avgMs: this.stats.processed > 0 ? Math.round(this.stats.totalMs / this.stats.processed) : 0,
            },
        };
    }

    _evictCompleted() {
        if (this.completedJobs.length > 1000) {
            this.completedJobs = this.completedJobs.slice(-500);
        }
    }
}

export default QueueProcessor;
