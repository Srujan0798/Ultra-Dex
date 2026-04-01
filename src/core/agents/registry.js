// Copyright (c) 2026 Ultra-Dex
// Registry - Agent registry for discovery and management

import { EventEmitter } from 'events';

/**
 * Registry
 * Central registry for discovering and managing agents
 */
export class Registry extends EventEmitter {
  constructor(options = {}) {
    super();
    this.agents = new Map();
    this.services = new Map();
    this.config = {
      enableDiscovery: options.enableDiscovery !== false,
      discoveryInterval: options.discoveryInterval || 10000,
      heartbeatInterval: options.heartbeatInterval || 5000,
      ...options
    };
    this.state = 'idle';
    this.discoveryTimer = null;
    this.heartbeatTimer = null;
  }

  /**
   * Initialize registry
   */
  async initialize() {
    this.state = 'ready';

    if (this.config.enableDiscovery) {
      this.startDiscovery();
      this.startHeartbeat();
    }

    this.emit('registry.ready');
    return this;
  }

  /**
   * Register an agent
   */
  registerAgent(agentId, agent, metadata = {}) {
    if (this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} already registered`);
    }

    const registration = {
      id: agentId,
      agent,
      metadata,
      registeredAt: Date.now(),
      lastHeartbeat: Date.now(),
      status: 'active',
      capabilities: agent.capabilities || [],
      version: agent.version || '1.0.0'
    };

    this.agents.set(agentId, registration);

    this.emit('agent.registered', { agentId, metadata });
    return registration;
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId) {
    if (!this.agents.has(agentId)) {
      return false;
    }

    this.agents.delete(agentId);
    this.emit('agent.unregistered', { agentId });
    return true;
  }

  /**
   * Get agent from registry
   */
  getAgent(agentId) {
    return this.agents.get(agentId);
  }

  /**
   * Get agent by capability
   */
  getAgentsByCapability(capability) {
    const results = [];

    for (const [agentId, registration] of this.agents) {
      if (registration.status === 'active' &&
          registration.capabilities.includes(capability)) {
        results.push(registration);
      }
    }

    return results;
  }

  /**
   * List all registered agents
   */
  listAgents(filter = {}) {
    let agents = Array.from(this.agents.values());

    if (filter.status) {
      agents = agents.filter(a => a.status === filter.status);
    }

    if (filter.capability) {
      agents = agents.filter(a => a.capabilities.includes(filter.capability));
    }

    if (filter.type) {
      agents = agents.filter(a => a.metadata.type === filter.type);
    }

    return agents;
  }

  /**
   * Register a service
   */
  registerService(serviceId, handler, metadata = {}) {
    const service = {
      id: serviceId,
      handler,
      metadata,
      registeredAt: Date.now(),
      status: 'available',
      invocationCount: 0
    };

    this.services.set(serviceId, service);
    this.emit('service.registered', { serviceId, metadata });
    return service;
  }

  /**
   * Unregister a service
   */
  unregisterService(serviceId) {
    if (!this.services.has(serviceId)) {
      return false;
    }

    this.services.delete(serviceId);
    this.emit('service.unregistered', { serviceId });
    return true;
  }

  /**
   * Get service
   */
  getService(serviceId) {
    return this.services.get(serviceId);
  }

  /**
   * List all services
   */
  listServices() {
    return Array.from(this.services.values());
  }

  /**
   * Update agent metadata
   */
  updateAgentMetadata(agentId, metadata) {
    const registration = this.agents.get(agentId);
    if (!registration) {
      throw new Error(`Agent ${agentId} not found`);
    }

    registration.metadata = { ...registration.metadata, ...metadata };
    this.emit('agent.metadata-updated', { agentId, metadata });
    return registration;
  }

  /**
   * Record agent heartbeat
   */
  recordHeartbeat(agentId) {
    const registration = this.agents.get(agentId);
    if (!registration) {
      return false;
    }

    registration.lastHeartbeat = Date.now();
    registration.status = 'active';
    return true;
  }

  /**
   * Check agent health
   */
  isAgentHealthy(agentId, maxHeartbeatAge = 30000) {
    const registration = this.agents.get(agentId);
    if (!registration) {
      return false;
    }

    const age = Date.now() - registration.lastHeartbeat;
    return age < maxHeartbeatAge;
  }

  /**
   * Start discovery
   */
  startDiscovery() {
    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer);
    }

    this.discoveryTimer = setInterval(() => {
      this.performDiscovery();
    }, this.config.discoveryInterval);
  }

  /**
   * Perform discovery (scan for new agents)
   */
  async performDiscovery() {
    // This would connect to service discovery mechanisms
    // For now, it's a placeholder
    this.emit('discovery.performed', { agentCount: this.agents.size });
  }

  /**
   * Start heartbeat monitoring
   */
  startHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      this.checkHeartbeats();
    }, this.config.heartbeatInterval);
  }

  /**
   * Check heartbeats and mark unhealthy agents
   */
  checkHeartbeats() {
    const maxAge = 30000; // 30 seconds
    const now = Date.now();

    for (const [agentId, registration] of this.agents) {
      if (registration.status === 'active') {
        const age = now - registration.lastHeartbeat;

        if (age > maxAge) {
          registration.status = 'unhealthy';
          this.emit('agent.unhealthy', { agentId, age });
        }
      }
    }
  }

  /**
   * Search agents by metadata
   */
  searchAgents(query) {
    const results = [];

    for (const registration of this.agents.values()) {
      if (this.matchesQuery(registration, query)) {
        results.push(registration);
      }
    }

    return results;
  }

  /**
   * Check if agent matches search query
   */
  matchesQuery(registration, query) {
    for (const [key, value] of Object.entries(query)) {
      if (key === 'capabilities') {
        if (!Array.isArray(value)) {
          continue;
        }
        const hasAll = value.every(cap =>
          registration.capabilities.includes(cap)
        );
        if (!hasAll) {
          return false;
        }
      } else if (key in registration.metadata) {
        if (registration.metadata[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get registry statistics
   */
  getStats() {
    let activeAgents = 0;
    let unhealthyAgents = 0;

    for (const registration of this.agents.values()) {
      if (registration.status === 'active') {
        activeAgents++;
      } else if (registration.status === 'unhealthy') {
        unhealthyAgents++;
      }
    }

    return {
      totalAgents: this.agents.size,
      activeAgents,
      unhealthyAgents,
      totalServices: this.services.size,
      registryUptime: Date.now() - this.registryStartTime
    };
  }

  /**
   * Shutdown registry
   */
  async shutdown() {
    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer);
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.state = 'shutdown';
    this.emit('registry.shutdown');
  }
}

export default Registry;
