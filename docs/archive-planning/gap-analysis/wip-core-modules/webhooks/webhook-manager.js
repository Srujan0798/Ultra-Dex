// Copyright (c) 2026 Ultra-Dex
// Webhook System — Reliable event delivery with retries + dead letter queue

import { EventEmitter } from 'events';
import crypto from 'crypto';

/**
 * WebhookEndpoint — a registered delivery target
 */
export class WebhookEndpoint {
    constructor({ id = null, url, events = ['*'], secret = null, active = true, metadata = {} }) {
        this.id = id || `wh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        this.url = url;
        this.events = events;
        this.secret = secret || crypto.randomBytes(32).toString('hex');
        this.active = active;
        this.metadata = metadata;
        this.stats = { delivered: 0, failed: 0, retried: 0, lastDelivery: null };
        this.createdAt = Date.now();
    }

    matchesEvent(eventType) {
        return this.events.includes('*') || this.events.includes(eventType);
    }

    sign(payload) {
        return crypto.createHmac('sha256', this.secret).update(JSON.stringify(payload)).digest('hex');
    }

    toJSON() {
        return {
            id: this.id,
            url: this.url,
            events: this.events,
            active: this.active,
            stats: { ...this.stats },
            createdAt: this.createdAt,
        };
    }
}

/**
 * WebhookDelivery — tracks a single delivery attempt
 */
export class WebhookDelivery {
    constructor({ endpointId, event, payload }) {
        this.id = `del-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        this.endpointId = endpointId;
        this.event = event;
        this.payload = payload;
        this.status = 'pending';
        this.attempts = 0;
        this.maxRetries = 3;
        this.lastAttempt = null;
        this.response = null;
        this.error = null;
        this.createdAt = Date.now();
    }

    recordAttempt(success, response = null, error = null) {
        this.attempts++;
        this.lastAttempt = Date.now();
        if (success) {
            this.status = 'delivered';
            this.response = response;
        } else {
            this.error = error;
            this.status = this.attempts >= this.maxRetries ? 'failed' : 'retrying';
        }
    }

    canRetry() {
        return this.status === 'retrying' && this.attempts < this.maxRetries;
    }

    getRetryDelay() {
        // Exponential backoff: 1s, 4s, 9s
        return Math.pow(this.attempts, 2) * 1000;
    }
}

/**
 * WebhookManager — manages endpoints and delivery
 */
export class WebhookManager extends EventEmitter {
    constructor({ maxRetries = 3, deliveryTimeout = 10000, maxDeliveries = 5000 } = {}) {
        super();
        this.endpoints = new Map();
        this.deliveries = [];
        this.maxRetries = maxRetries;
        this.deliveryTimeout = deliveryTimeout;
        this.maxDeliveries = maxDeliveries;
        this.retryQueue = [];
        this.stats = { totalSent: 0, totalDelivered: 0, totalFailed: 0, totalRetried: 0 };
    }

    /**
     * Register a webhook endpoint
     */
    register(config) {
        const endpoint = config instanceof WebhookEndpoint ? config : new WebhookEndpoint(config);
        this.endpoints.set(endpoint.id, endpoint);
        this.emit('endpoint:registered', { id: endpoint.id, url: endpoint.url });
        return endpoint;
    }

    /**
     * Unregister a webhook endpoint
     */
    unregister(endpointId) {
        const endpoint = this.endpoints.get(endpointId);
        if (!endpoint) return false;
        this.endpoints.delete(endpointId);
        this.emit('endpoint:unregistered', { id: endpointId });
        return true;
    }

    /**
     * Get an endpoint by ID
     */
    getEndpoint(id) {
        return this.endpoints.get(id);
    }

    /**
     * List all endpoints
     */
    listEndpoints() {
        return [...this.endpoints.values()].map(e => e.toJSON());
    }

    /**
     * Dispatch an event to all matching endpoints
     */
    async dispatch(eventType, payload) {
        const matchingEndpoints = [...this.endpoints.values()]
            .filter(e => e.active && e.matchesEvent(eventType));

        if (matchingEndpoints.length === 0) return [];

        const results = [];
        for (const endpoint of matchingEndpoints) {
            const delivery = new WebhookDelivery({
                endpointId: endpoint.id,
                event: eventType,
                payload,
            });
            delivery.maxRetries = this.maxRetries;

            this.deliveries.push(delivery);
            this._evictOldDeliveries();

            const result = await this._deliver(endpoint, delivery);
            results.push(result);
        }

        this.emit('dispatch:complete', { event: eventType, results: results.length });
        return results;
    }

    /**
     * Attempt to deliver to an endpoint
     */
    async _deliver(endpoint, delivery) {
        this.stats.totalSent++;

        const signature = endpoint.sign(delivery.payload);
        const headers = {
            'Content-Type': 'application/json',
            'X-Webhook-ID': delivery.id,
            'X-Webhook-Event': delivery.event,
            'X-Webhook-Signature': `sha256=${signature}`,
            'X-Webhook-Timestamp': Date.now().toString(),
        };

        try {
            // Simulate HTTP delivery (in production, use fetch with timeout)
            const response = await this._simulateDelivery(endpoint.url, {
                event: delivery.event,
                payload: delivery.payload,
                timestamp: Date.now(),
            }, headers);

            delivery.recordAttempt(true, response);
            endpoint.stats.delivered++;
            endpoint.stats.lastDelivery = Date.now();
            this.stats.totalDelivered++;
            this.emit('delivery:success', { deliveryId: delivery.id, endpointId: endpoint.id });

            return { deliveryId: delivery.id, status: 'delivered' };
        } catch (error) {
            delivery.recordAttempt(false, null, error.message);

            if (delivery.canRetry()) {
                this.stats.totalRetried++;
                endpoint.stats.retried++;
                this.retryQueue.push({ delivery, endpoint, retryAt: Date.now() + delivery.getRetryDelay() });
                this.emit('delivery:retry', { deliveryId: delivery.id, attempt: delivery.attempts });
                return { deliveryId: delivery.id, status: 'retrying', nextRetryMs: delivery.getRetryDelay() };
            } else {
                endpoint.stats.failed++;
                this.stats.totalFailed++;
                this.emit('delivery:failed', { deliveryId: delivery.id, error: error.message });
                return { deliveryId: delivery.id, status: 'failed', error: error.message };
            }
        }
    }

    /**
     * Process retry queue
     */
    async processRetries() {
        const now = Date.now();
        const ready = this.retryQueue.filter(r => r.retryAt <= now);
        this.retryQueue = this.retryQueue.filter(r => r.retryAt > now);

        const results = [];
        for (const { delivery, endpoint } of ready) {
            const result = await this._deliver(endpoint, delivery);
            results.push(result);
        }
        return results;
    }

    /**
     * Simulated HTTP delivery (replace with fetch in production)
     */
    async _simulateDelivery(url, body, headers) {
        // Simulate network latency
        await new Promise(r => setTimeout(r, Math.random() * 50));

        // Simulate occasional failures for testing
        if (url.includes('fail')) {
            throw new Error('Connection refused');
        }

        return { status: 200, body: 'OK' };
    }

    /**
     * Get delivery history
     */
    getDeliveries({ endpointId = null, status = null, limit = 50 } = {}) {
        let results = [...this.deliveries];
        if (endpointId) results = results.filter(d => d.endpointId === endpointId);
        if (status) results = results.filter(d => d.status === status);
        return results.slice(-limit);
    }

    /**
     * Get dashboard stats
     */
    getDashboard() {
        return {
            endpoints: this.endpoints.size,
            activeEndpoints: [...this.endpoints.values()].filter(e => e.active).length,
            retryQueueSize: this.retryQueue.length,
            recentDeliveries: this.deliveries.slice(-10).map(d => ({
                id: d.id,
                event: d.event,
                status: d.status,
                attempts: d.attempts,
            })),
            stats: { ...this.stats },
        };
    }

    _evictOldDeliveries() {
        if (this.deliveries.length > this.maxDeliveries) {
            this.deliveries = this.deliveries.slice(-Math.floor(this.maxDeliveries * 0.8));
        }
    }
}

export default WebhookManager;
