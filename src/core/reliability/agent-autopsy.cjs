/**
 * Agent Autopsy - Failure Detection and Analysis System
 * Monitors agents in real-time, detects failures, provides forensics
 *
 * @module AgentAutopsy
 * @version 1.0.0
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

class AgentAutopsy extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      logPath: config.logPath || './data/autopsy',
      maxTraces: config.maxTraces || 1000,
      heartbeatInterval: config.heartbeatInterval || 5000,
      circuitBreakerThreshold: config.circuitBreakerThreshold || 5,
      circuitBreakerTimeout: config.circuitBreakerTimeout || 60000,
      ...config,
    };

    this.monitoredAgents = new Map();
    this.failureLog = [];
    this.circuitBreakers = new Map();
    this.metrics = {
      failures: 0,
      autopsies: 0,
      prevented: 0,
    };

    this.initialized = false;
  }

  /**
   * Initialize the autopsy system
   */
  async initialize() {
    // Create log directory
    await fs.mkdir(this.config.logPath, { recursive: true });

    // Start heartbeat monitoring
    this._startHeartbeatMonitor();

    this.initialized = true;
    this.emit('initialized');
    return true;
  }

  /**
   * Monitor an agent for failures
   * @param {string} agentId - Agent ID
   * @param {Object} options - Monitoring options
   */
  monitor(agentId, options = {}) {
    this._ensureInitialized();

    const monitor = {
      agentId,
      startedAt: new Date().toISOString(),
      lastHeartbeat: Date.now(),
      status: 'healthy',
      consecutiveFailures: 0,
      traces: [],
      thresholds: {
        maxResponseTime: options.maxResponseTime || 10000,
        maxFailures: options.maxFailures || 3,
        minConfidence: options.minConfidence || 0.7,
        ...options.thresholds,
      },
    };

    this.monitoredAgents.set(agentId, monitor);

    this.emit('monitoring:started', { agentId });
  }

  /**
   * Record agent heartbeat
   * @param {string} agentId - Agent ID
   * @param {Object} status - Current status
   */
  heartbeat(agentId, status = {}) {
    const monitor = this.monitoredAgents.get(agentId);
    if (!monitor) return;

    monitor.lastHeartbeat = Date.now();
    monitor.status = status.status || 'healthy';
    monitor.consecutiveFailures = status.status === 'error' ? monitor.consecutiveFailures + 1 : 0;

    // Check circuit breaker
    if (monitor.consecutiveFailures >= monitor.thresholds.maxFailures) {
      this._tripCircuitBreaker(agentId);
    }

    this.emit('heartbeat', { agentId, status: monitor.status });
  }

  /**
   * Record agent execution trace
   * @param {string} agentId - Agent ID
   * @param {Object} trace - Execution trace
   */
  recordTrace(agentId, trace) {
    const monitor = this.monitoredAgents.get(agentId);
    if (!monitor) return;

    const traceEntry = {
      timestamp: new Date().toISOString(),
      ...trace,
    };

    monitor.traces.push(traceEntry);

    // Keep only recent traces
    if (monitor.traces.length > 100) {
      monitor.traces = monitor.traces.slice(-100);
    }

    // Check for failure patterns
    this._analyzeTrace(agentId, traceEntry);
  }

  /**
   * Analyze a failure and generate autopsy report
   * @param {string} agentId - Agent ID
   * @param {Error} error - The error
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Autopsy report
   */
  async performAutopsy(agentId, error, context = {}) {
    this._ensureInitialized();

    const monitor = this.monitoredAgents.get(agentId);
    const failureId = this._generateFailureId();

    const autopsy = {
      id: failureId,
      agentId,
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        type: error.name,
      },
      context: {
        executionId: context.executionId,
        input: context.input,
        sessionId: context.sessionId,
        trace: monitor?.traces || [],
      },
      analysis: this._analyzeFailure(error, monitor),
      recommendations: [],
      severity: 'medium',
    };

    // Determine severity
    autopsy.severity = this._calculateSeverity(autopsy);

    // Generate recommendations
    autopsy.recommendations = this._generateRecommendations(autopsy);

    // Save autopsy report
    await this._saveAutopsy(autopsy);

    this.failureLog.push(autopsy);
    this.metrics.autopsies++;

    // Keep log size manageable
    if (this.failureLog.length > this.config.maxTraces) {
      this.failureLog = this.failureLog.slice(-this.config.maxTraces);
    }

    this.emit('autopsy:complete', autopsy);

    return autopsy;
  }

  /**
   * Check if agent is healthy
   * @param {string} agentId - Agent ID
   * @returns {Object} Health status
   */
  checkHealth(agentId) {
    const monitor = this.monitoredAgents.get(agentId);
    if (!monitor) {
      return { healthy: false, reason: 'not_monitored' };
    }

    const timeSinceHeartbeat = Date.now() - monitor.lastHeartbeat;
    const isCircuitOpen = this.circuitBreakers.has(agentId);

    if (isCircuitOpen) {
      const cb = this.circuitBreakers.get(agentId);
      if (Date.now() - cb.trippedAt > this.config.circuitBreakerTimeout) {
        // Reset circuit breaker
        this.circuitBreakers.delete(agentId);
        return { healthy: true, reason: 'circuit_reset' };
      }
      return {
        healthy: false,
        reason: 'circuit_open',
        retryAfter: cb.trippedAt + this.config.circuitBreakerTimeout - Date.now(),
      };
    }

    if (timeSinceHeartbeat > this.config.heartbeatInterval * 3) {
      return { healthy: false, reason: 'no_heartbeat', timeSince: timeSinceHeartbeat };
    }

    if (monitor.consecutiveFailures >= monitor.thresholds.maxFailures) {
      return { healthy: false, reason: 'consecutive_failures', count: monitor.consecutiveFailures };
    }

    return { healthy: true, status: monitor.status };
  }

  /**
   * Get failure statistics
   * @param {Object} filters - Filter options
   * @returns {Object} Statistics
   */
  getStats(filters = {}) {
    const { agentId, since } = filters;

    let failures = this.failureLog;

    if (agentId) {
      failures = failures.filter((f) => f.agentId === agentId);
    }

    if (since) {
      failures = failures.filter((f) => new Date(f.timestamp) >= new Date(since));
    }

    const byType = {};
    const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };

    failures.forEach((f) => {
      byType[f.error.type] = (byType[f.error.type] || 0) + 1;
      bySeverity[f.severity]++;
    });

    return {
      total: failures.length,
      byType,
      bySeverity,
      circuitBreakers: this.circuitBreakers.size,
      monitoredAgents: this.monitoredAgents.size,
      ...this.metrics,
    };
  }

  /**
   * Get recent failures
   * @param {number} limit - Number of failures to return
   * @returns {Array<Object>} Recent failures
   */
  getRecentFailures(limit = 10) {
    return this.failureLog.slice(-limit);
  }

  /**
   * Get autopsy report by ID
   * @param {string} failureId - Failure ID
   * @returns {Object|null} Autopsy report
   */
  async getAutopsy(failureId) {
    try {
      const filePath = path.join(this.config.logPath, `${failureId}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Stop monitoring an agent
   * @param {string} agentId - Agent ID
   */
  stopMonitoring(agentId) {
    this.monitoredAgents.delete(agentId);
    this.circuitBreakers.delete(agentId);
    this.emit('monitoring:stopped', { agentId });
  }

  // Private methods
  _ensureInitialized() {
    if (!this.initialized) {
      throw new Error('Autopsy not initialized. Call initialize() first.');
    }
  }

  _startHeartbeatMonitor() {
    setInterval(() => {
      const now = Date.now();

      for (const [agentId, monitor] of this.monitoredAgents) {
        const timeSinceHeartbeat = now - monitor.lastHeartbeat;

        if (timeSinceHeartbeat > this.config.heartbeatInterval * 3) {
          this.emit('agent:unresponsive', {
            agentId,
            timeSince: timeSinceHeartbeat,
          });

          // Record as potential failure
          this.recordTrace(agentId, {
            type: 'warning',
            message: 'Agent unresponsive',
            timeSinceHeartbeat,
          });
        }
      }
    }, this.config.heartbeatInterval);
  }

  _analyzeTrace(agentId, trace) {
    // Detect patterns in traces
    if (trace.type === 'error') {
      const monitor = this.monitoredAgents.get(agentId);
      monitor.consecutiveFailures++;

      if (monitor.consecutiveFailures >= monitor.thresholds.maxFailures) {
        this._tripCircuitBreaker(agentId);
      }
    }
  }

  _tripCircuitBreaker(agentId) {
    if (this.circuitBreakers.has(agentId)) return;

    this.circuitBreakers.set(agentId, {
      trippedAt: Date.now(),
      failureCount: this.monitoredAgents.get(agentId)?.consecutiveFailures || 0,
    });

    this.metrics.prevented++;

    this.emit('circuit:tripped', { agentId });
  }

  _analyzeFailure(error, monitor) {
    const analysis = {
      type: 'unknown',
      patterns: [],
      rootCause: null,
    };

    // Classify error type
    if (error.message.includes('timeout')) {
      analysis.type = 'timeout';
      analysis.patterns.push('execution_timeout');
    } else if (error.message.includes('rate limit') || error.message.includes('429')) {
      analysis.type = 'rate_limit';
      analysis.patterns.push('external_api_throttling');
    } else if (error.message.includes('memory') || error.message.includes('heap')) {
      analysis.type = 'resource_exhaustion';
      analysis.patterns.push('insufficient_resources');
    } else if (
      error.message.includes('hallucination') ||
      error.message.includes('invalid output')
    ) {
      analysis.type = 'hallucination';
      analysis.patterns.push('model_hallucination');
    } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      analysis.type = 'permission';
      analysis.patterns.push('authorization_failure');
    }

    // Check for patterns in recent traces
    if (monitor) {
      const recentTraces = monitor.traces.slice(-10);

      // Check for retry loops
      const retryCount = recentTraces.filter((t) => t.type === 'retry').length;
      if (retryCount > 3) {
        analysis.patterns.push('retry_loop');
      }

      // Check for memory bloat
      const memoryWarnings = recentTraces.filter(
        (t) => t.message?.includes('memory') || t.message?.includes('large context')
      ).length;
      if (memoryWarnings > 0) {
        analysis.patterns.push('memory_pressure');
      }
    }

    return analysis;
  }

  _calculateSeverity(autopsy) {
    if (autopsy.analysis.patterns.includes('retry_loop')) return 'critical';
    if (autopsy.analysis.patterns.includes('model_hallucination')) return 'high';
    if (autopsy.analysis.type === 'timeout') return 'high';
    if (autopsy.analysis.type === 'resource_exhaustion') return 'high';
    if (autopsy.analysis.type === 'rate_limit') return 'medium';
    return 'low';
  }

  _generateRecommendations(autopsy) {
    const recommendations = [];

    switch (autopsy.analysis.type) {
      case 'timeout':
        recommendations.push('Increase timeout threshold');
        recommendations.push('Implement async processing for long tasks');
        recommendations.push('Add progress callbacks');
        break;

      case 'rate_limit':
        recommendations.push('Implement exponential backoff');
        recommendations.push('Add request queuing');
        recommendations.push('Consider rate limit optimization');
        break;

      case 'resource_exhaustion':
        recommendations.push('Implement context compression');
        recommendations.push('Add memory monitoring');
        recommendations.push('Split large tasks into chunks');
        break;

      case 'hallucination':
        recommendations.push('Add fact-checking layer');
        recommendations.push('Implement confidence scoring');
        recommendations.push('Use multi-model consensus');
        recommendations.push('Add ground truth validation');
        break;

      case 'permission':
        recommendations.push('Verify API keys and permissions');
        recommendations.push('Check authentication flow');
        break;
    }

    if (autopsy.analysis.patterns.includes('retry_loop')) {
      recommendations.push('Implement circuit breaker pattern');
      recommendations.push('Add maximum retry limit');
      recommendations.push('Use fallback strategies');
    }

    if (autopsy.analysis.patterns.includes('memory_pressure')) {
      recommendations.push('Enable automatic context compression');
      recommendations.push('Implement tiered memory system');
      recommendations.push('Archive old context data');
    }

    return recommendations;
  }

  async _saveAutopsy(autopsy) {
    const filePath = path.join(this.config.logPath, `${autopsy.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(autopsy, null, 2));
  }

  _generateFailureId() {
    return `failure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = { AgentAutopsy };
