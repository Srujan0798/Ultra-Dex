/**
 * Ultra-Dex Unified Self-Healing System
 * Integrates Health Monitoring, Agent Autopsy, and Recovery Orchestration
 */

import { EventEmitter } from 'events';
import { HealthMonitor } from '../system/health-monitor.js';
import { AgentAutopsy } from './agent-autopsy.js';
import { logger } from '../../utils/logging.js';

class SelfHealingSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    this.health = new HealthMonitor(options.health);
    this.autopsy = new AgentAutopsy(options.autopsy);
    this.isOperational = false;
  }

  async start() {
    if (this.isOperational) return;

    // Register core component health checks
    this.health.registerHealthCheck('memory-tier', async () => {
      // In real impl, check SQLite/Neo4j connectivity
      return { healthy: true, status: 'synced' };
    }, { critical: true });

    this.health.registerHealthCheck('ai-router', async () => {
      // Check if providers are configured
      return { healthy: true };
    });

    // Link Health events to Autopsy for deep analysis
    this.health.on('health-check-complete', (status) => {
      if (status.overall === 'degraded') {
        this.emit('system:degraded', status);
      }
    });

    this.health.on('recovery-failed', async (data) => {
      logger.error(`Self-healing failed for ${data.component}`, data.error);
      // Escalation logic could go here
    });

    await this.health.start();
    this.isOperational = true;
    logger.info('Self-healing system operational');
  }

  async stop() {
    await this.health.stop();
    this.isOperational = false;
  }

  /**
   * Main entry point for reporting agent errors
   */
  async reportAgentError(agentId, error, context = {}) {
    const report = await this.autopsy.logFailure(agentId, error, context);

    if (report.analysis.isRecoverable) {
      this.emit('agent:recovering', { agentId, report });
      // The autopsy system already triggers attemptRecoveryForAgent if threshold met
    } else {
      this.emit('agent:terminal-failure', { agentId, report });
    }

    return report;
  }

  getSystemStatus() {
    return {
      operational: this.isOperational,
      health: this.health.getSystemStatus(),
      recoveryStats: this.health.getRecoveryStats()
    };
  }
}

export const selfHealing = new SelfHealingSystem();
export default selfHealing;
