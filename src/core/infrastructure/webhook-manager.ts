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
import {
  WebhookEndpoint,
  WebhookDelivery
} from '../webhooks/webhook-manager.js';
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function normalizeEventName(eventName) {
  if (eventName === "*" || !eventName) {
    return eventName || "*";
  }
  return String(eventName).replace(/[:/]/g, ".").replace(/-+/g, ".");
}
function normalizeEventList(events) {
  const eventList = Array.isArray(events) ? events : [events || "*"];
  return eventList.map((eventName) => normalizeEventName(eventName));
}
async function readResponseText(response) {
  if (typeof response?.text === "function") {
    return await response.text();
  }
  return "";
}
let WebhookManager = class extends EventEmitter {
  constructor({
    fetch: fetchImpl = globalThis.fetch,
    maxRetries = 3,
    deliveryTimeout = 1e4,
    maxDeliveries = 5e3,
    retryBaseDelayMs = 1e3
  } = {}) {
    super();
    this.fetch = fetchImpl;
    this.endpoints = /* @__PURE__ */ new Map();
    this.deliveries = [];
    this.maxRetries = maxRetries;
    this.deliveryTimeout = deliveryTimeout;
    this.maxDeliveries = maxDeliveries;
    this.retryBaseDelayMs = retryBaseDelayMs;
    this.retryQueue = [];
    this.stats = {
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      totalRetried: 0
    };
  }
  register(eventOrConfig, url = null, options = {}) {
    if (eventOrConfig instanceof WebhookEndpoint) {
      eventOrConfig.events = normalizeEventList(eventOrConfig.events);
      this.endpoints.set(eventOrConfig.id, eventOrConfig);
      this.emit("endpoint:registered", {
        id: eventOrConfig.id,
        url: eventOrConfig.url,
        events: eventOrConfig.events
      });
      return eventOrConfig;
    }
    const config = typeof eventOrConfig === "string" ? {
      url,
      events: [eventOrConfig],
      ...options
    } : {
      ...eventOrConfig || {}
    };
    config.events = normalizeEventList(config.events);
    const endpoint = new WebhookEndpoint(config);
    endpoint.events = normalizeEventList(endpoint.events);
    this.endpoints.set(endpoint.id, endpoint);
    this.emit("endpoint:registered", { id: endpoint.id, url: endpoint.url, events: endpoint.events });
    return endpoint;
  }
  unregister(endpointId) {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) {
      return false;
    }
    this.endpoints.delete(endpointId);
    this.emit("endpoint:unregistered", { id: endpointId });
    return true;
  }
  getEndpoint(endpointId) {
    return this.endpoints.get(endpointId) || null;
  }
  listEndpoints() {
    return [...this.endpoints.values()].map((endpoint) => endpoint.toJSON());
  }
  async deliver(eventType, payload) {
    return await this.dispatch(eventType, payload);
  }
  async dispatch(eventType, payload) {
    const normalizedEvent = normalizeEventName(eventType);
    const matchingEndpoints = [...this.endpoints.values()].filter(
      (endpoint) => endpoint.active && endpoint.matchesEvent(normalizedEvent)
    );
    if (!matchingEndpoints.length) {
      return [];
    }
    const results = [];
    for (const endpoint of matchingEndpoints) {
      const delivery = new WebhookDelivery({
        endpointId: endpoint.id,
        event: normalizedEvent,
        payload
      });
      delivery.maxRetries = this.maxRetries;
      delivery.getRetryDelay = () => Math.pow(delivery.attempts, 2) * this.retryBaseDelayMs;
      this.deliveries.push(delivery);
      this.evictOldDeliveries();
      results.push(await this.deliverToEndpoint(endpoint, delivery));
    }
    this.emit("dispatch:complete", {
      event: normalizedEvent,
      deliveries: results.length
    });
    return results;
  }
  async deliverToEndpoint(endpoint, delivery) {
    const body = {
      event: delivery.event,
      payload: delivery.payload,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    const headers = {
      "Content-Type": "application/json",
      "X-Webhook-ID": delivery.id,
      "X-Webhook-Event": delivery.event,
      "X-Webhook-Signature": `sha256=${endpoint.sign(body)}`
    };
    for (let attempt = 1; attempt <= delivery.maxRetries; attempt++) {
      this.stats.totalSent++;
      try {
        const response = await this.post(endpoint.url, body, headers);
        const responseBody = await readResponseText(response);
        if (!response?.ok) {
          throw new Error(`HTTP ${response?.status || "delivery failed"}`);
        }
        delivery.recordAttempt(true, {
          status: response.status,
          body: responseBody
        });
        endpoint.stats.delivered++;
        endpoint.stats.lastDelivery = Date.now();
        this.stats.totalDelivered++;
        this.emit("delivery:success", {
          endpointId: endpoint.id,
          deliveryId: delivery.id,
          attempts: delivery.attempts
        });
        return {
          deliveryId: delivery.id,
          endpointId: endpoint.id,
          status: "delivered",
          attempts: delivery.attempts,
          response: delivery.response
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        delivery.recordAttempt(false, null, message);
        if (attempt < delivery.maxRetries) {
          this.stats.totalRetried++;
          endpoint.stats.retried++;
          this.emit("delivery:retry", {
            endpointId: endpoint.id,
            deliveryId: delivery.id,
            attempt: delivery.attempts,
            delayMs: delivery.getRetryDelay(),
            error: message
          });
          await delay(delivery.getRetryDelay());
          continue;
        }
        endpoint.stats.failed++;
        this.stats.totalFailed++;
        this.emit("delivery:failed", {
          endpointId: endpoint.id,
          deliveryId: delivery.id,
          attempts: delivery.attempts,
          error: message
        });
        return {
          deliveryId: delivery.id,
          endpointId: endpoint.id,
          status: "failed",
          attempts: delivery.attempts,
          error: message
        };
      }
    }
    return {
      deliveryId: delivery.id,
      endpointId: endpoint.id,
      status: "failed",
      attempts: delivery.attempts,
      error: delivery.error || "Delivery failed"
    };
  }
  async post(url, body, headers) {
    if (typeof this.fetch !== "function") {
      throw new Error("Fetch implementation unavailable");
    }
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), this.deliveryTimeout);
    try {
      return await this.fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: abortController.signal
      });
    } finally {
      clearTimeout(timeout);
    }
  }
  async processRetries() {
    return [];
  }
  getDeliveries({ endpointId = null, status = null, limit = 50 } = {}) {
    let results = [...this.deliveries];
    if (endpointId) {
      results = results.filter((delivery) => delivery.endpointId === endpointId);
    }
    if (status) {
      results = results.filter((delivery) => delivery.status === status);
    }
    return results.slice(-limit);
  }
  getStats() {
    return {
      endpoints: this.endpoints.size,
      activeEndpoints: [...this.endpoints.values()].filter((endpoint) => endpoint.active).length,
      deliveries: this.deliveries.length,
      retryQueueSize: this.retryQueue.length,
      stats: { ...this.stats }
    };
  }
  getDashboard() {
    return {
      ...this.getStats(),
      recentDeliveries: this.deliveries.slice(-10).map((delivery) => ({
        id: delivery.id,
        endpointId: delivery.endpointId,
        event: delivery.event,
        status: delivery.status,
        attempts: delivery.attempts
      }))
    };
  }
  evictOldDeliveries() {
    if (this.deliveries.length > this.maxDeliveries) {
      this.deliveries = this.deliveries.slice(-Math.floor(this.maxDeliveries * 0.8));
    }
  }
  async stop() {
  }
};
WebhookManager = __decorateClass([
  singleton()
], WebhookManager);
var webhook_manager_default = WebhookManager;
export {
  WebhookDelivery,
  WebhookEndpoint,
  WebhookManager,
  webhook_manager_default as default
};
