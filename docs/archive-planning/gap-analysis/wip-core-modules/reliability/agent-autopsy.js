/**
 * Agent Autopsy System for Ultra-Dex
 * Analyzes agent failures and implements recovery strategies
 */

import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

class AgentAutopsy extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      logPath: options.logPath || path.join(process.cwd(), '.ultra-dex', 'autopsy'),
      logRetention: options.logRetention || 7, // days
      maxFailureCount: options.maxFailureCount || 5,
      recoveryStrategies: options.recoveryStrategies || ['restart', 'retry', 'fallback'],
      ...options,
    };

    this.failureLog = new Map();
    this.agentStates = new Map();
    this.recoveryHistory = new Map();
    this.autopsyReports = [];
    this.monitoredAgents = new Map();
    this.initialized = false;
  }

  /**
   * Initialize autopsy storage. Kept explicit for compatibility with
   * newer orchestrators that call initialize() before use.
   */
  async initialize() {
    if (this.initialized) {
      return true;
    }

    await fs.mkdir(this.options.logPath, { recursive: true });
    this.initialized = true;
    this.emit('initialized');
    return true;
  }

  monitor(agentId, config = {}) {
    this.monitoredAgents.set(agentId, {
      agentId,
      maxResponseTime: config.maxResponseTime || 30000,
      maxFailures: config.maxFailures || this.options.maxFailureCount,
      lastHeartbeat: null,
      status: 'healthy',
    });
    return this.monitoredAgents.get(agentId);
  }

  heartbeat(agentId, status = {}) {
    const monitored = this.monitoredAgents.get(agentId) || this.monitor(agentId);
    monitored.lastHeartbeat = new Date().toISOString();
    monitored.status = status.status || 'healthy';
    this.monitoredAgents.set(agentId, monitored);
    this.emit('heartbeat', { agentId, ...monitored });
    return monitored;
  }

  checkHealth(agentId) {
    const monitored = this.monitoredAgents.get(agentId);
    if (!monitored) {
      return { healthy: true, status: 'unknown', agentId };
    }
    return {
      healthy: monitored.status !== 'error',
      status: monitored.status,
      lastHeartbeat: monitored.lastHeartbeat,
      agentId,
    };
  }

  /**
   * Compatibility entry point used by the core orchestrator.
   * Delegates to the existing failure pipeline and returns a report.
   */
  async performAutopsy(agentId, error, context = {}) {
    await this.initialize();
    const failure = await this.logFailure(agentId, error, context);
    const report = await this.generateAutopsyReport(agentId);

    return {
      id: failure.id,
      agentId,
      timestamp: failure.timestamp,
      error: failure.error,
      analysis: failure.analysis,
      recommendations: report.recommendations,
      summary: report.summary,
    };
  }

  /**
   * Log an agent failure
   * @param {string} agentId - ID of the failed agent
   * @param {Error} error - Error that caused the failure
   * @param {object} context - Context of the failure
   */
  async logFailure(agentId, error, context = {}) {
    const failure = {
      id: `failure_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      agentId,
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
      },
      context,
      analysis: await this.analyzeFailure(error, context),
    };

    // Add to failure log
    if (!this.failureLog.has(agentId)) {
      this.failureLog.set(agentId, []);
    }

    const agentFailures = this.failureLog.get(agentId);
    agentFailures.push(failure);

    // Keep only recent failures based on retention policy
    const cutoffDate = new Date(Date.now() - this.options.logRetention * 24 * 60 * 60 * 1000);
    const recentFailures = agentFailures.filter((f) => new Date(f.timestamp) > cutoffDate);
    this.failureLog.set(agentId, recentFailures);

    logger.log(`💀 Agent ${agentId} failure logged: ${error.message}`);
    this.emit('failure:logged', { agentId, failure });

    // Check if we need to take action based on failure count
    await this.evaluateFailurePattern(agentId);

    return failure;
  }

  /**
   * Analyze a failure to determine its nature and cause
   * @param {Error} error - The error to analyze
   * @param {object} context - Context of the failure
   * @returns {object} Analysis of the failure
   */
  async analyzeFailure(error, context) {
    const analysis = {
      type: 'unknown',
      severity: 'medium',
      cause: 'unknown',
      recoverySuggestions: [],
      isRecoverable: true,
      requiresManualIntervention: false,
    };

    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Analyze error type
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      analysis.type = 'timeout';
      analysis.severity = 'high';
      analysis.cause = 'operation_timeout';
      analysis.recoverySuggestions = ['increase_timeout', 'retry_with_backoff'];
    } else if (errorMessage.includes('memory') && errorMessage.includes('limit')) {
      analysis.type = 'resource_exhaustion';
      analysis.severity = 'high';
      analysis.cause = 'memory_limit_exceeded';
      analysis.recoverySuggestions = ['reduce_input_size', 'optimize_processing'];
    } else if (errorMessage.includes('permission') || errorMessage.includes('access denied')) {
      analysis.type = 'authorization';
      analysis.severity = 'critical';
      analysis.cause = 'insufficient_permissions';
      analysis.requiresManualIntervention = true;
      analysis.recoverySuggestions = ['check_permissions', 'update_config'];
    } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      analysis.type = 'network';
      analysis.severity = 'high';
      analysis.cause = 'network_failure';
      analysis.recoverySuggestions = ['retry_connection', 'check_network'];
    } else if (errorMessage.includes('database') || errorMessage.includes('sql')) {
      analysis.type = 'database';
      analysis.severity = 'high';
      analysis.cause = 'database_error';
      analysis.recoverySuggestions = ['check_db_connection', 'retry_operation'];
    } else if (errorName.includes('syntax') || errorName.includes('parse')) {
      analysis.type = 'input_validation';
      analysis.severity = 'medium';
      analysis.cause = 'invalid_input_format';
      analysis.recoverySuggestions = ['validate_input', 'correct_format'];
    } else {
      analysis.type = 'unknown';
      analysis.severity = 'medium';
      analysis.cause = 'unexpected_error';
      analysis.recoverySuggestions = ['retry', 'manual_review'];
    }

    // Determine if error is recoverable
    analysis.isRecoverable = !['authorization', 'critical'].includes(analysis.severity);

    return analysis;
  }

  /**
   * Evaluate failure patterns for an agent
   * @param {string} agentId - ID of the agent
   */
  async evaluateFailurePattern(agentId) {
    const failures = this.failureLog.get(agentId) || [];
    const recentFailures = failures.filter((f) => {
      const minutesAgo = (Date.now() - new Date(f.timestamp).getTime()) / (1000 * 60);
      return minutesAgo < 10; // Last 10 minutes
    });

    if (recentFailures.length >= this.options.maxFailureCount) {
      logger.log(
        `🚨 Agent ${agentId} showing concerning failure pattern (${recentFailures.length} recent failures)`
      );

      // Mark agent as unstable
      this.agentStates.set(agentId, {
        status: 'unstable',
        lastFailure: recentFailures[recentFailures.length - 1],
        failureCount: recentFailures.length,
        timestamp: new Date().toISOString(),
      });

      // Attempt recovery
      await this.attemptRecoveryForAgent(agentId);
    }
  }

  /**
   * Attempt recovery for a specific agent
   * @param {string} agentId - ID of the agent to recover
   * @returns {object} Recovery result
   */
  async attemptRecoveryForAgent(agentId) {
    const agentState = this.agentStates.get(agentId);
    if (!agentState) {
      logger.log(`No state found for agent ${agentId}`);
      return { success: false, reason: 'no_state_found' };
    }

    const lastFailure = agentState.lastFailure;
    const analysis = lastFailure.analysis;

    logger.log(`Attempting recovery for agent ${agentId} (type: ${analysis.type})`);

    // Try different recovery strategies based on failure analysis
    for (const strategy of this.options.recoveryStrategies) {
      const recoveryResult = await this.executeRecoveryStrategy(strategy, agentId, analysis);

      if (recoveryResult.success) {
        logger.log(`✅ Recovery successful for agent ${agentId} using strategy: ${strategy}`);

        // Update agent state
        this.agentStates.set(agentId, {
          ...agentState,
          status: 'recovered',
          lastRecovery: {
            strategy,
            timestamp: new Date().toISOString(),
            result: recoveryResult,
          },
        });

        // Add to recovery history
        if (!this.recoveryHistory.has(agentId)) {
          this.recoveryHistory.set(agentId, []);
        }
        this.recoveryHistory.get(agentId).push({
          strategy,
          timestamp: new Date().toISOString(),
          result: recoveryResult,
          failure: lastFailure,
        });

        return recoveryResult;
      } else {
        logger.log(
          `Recovery strategy ${strategy} failed for agent ${agentId}:`,
          recoveryResult.error
        );
      }
    }

    logger.log(`❌ All recovery strategies failed for agent ${agentId}`);
    return { success: false, reason: 'all_strategies_failed' };
  }

  /**
   * Execute a specific recovery strategy
   * @param {string} strategy - Name of the strategy to execute
   * @param {string} agentId - ID of the agent to recover
   * @param {object} analysis - Failure analysis
   * @returns {object} Recovery result
   */
  async executeRecoveryStrategy(strategy, agentId, analysis) {
    switch (strategy) {
      case 'restart':
        return await this.restartAgent(agentId);
      case 'retry':
        return await this.retryAgent(agentId, analysis);
      case 'fallback':
        return await this.fallbackAgent(agentId, analysis);
      case 'throttle':
        return await this.throttleAgent(agentId);
      case 'reset':
        return await this.resetAgent(agentId);
      default:
        return { success: false, error: `Unknown strategy: ${strategy}` };
    }
  }

  /**
   * Restart an agent
   * @param {string} agentId - ID of the agent to restart
   * @returns {object} Result of the restart
   */
  async restartAgent(agentId) {
    try {
      logger.log(`🔄 Restarting agent: ${agentId}`);

      // In a real implementation, this would restart the agent process
      // For now, we'll just update the state
      this.agentStates.set(agentId, {
        status: 'restarting',
        timestamp: new Date().toISOString(),
      });

      // Simulate restart process
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.agentStates.set(agentId, {
        status: 'running',
        timestamp: new Date().toISOString(),
        restartedAt: new Date().toISOString(),
      });

      return {
        success: true,
        action: 'restart',
        details: `Agent ${agentId} restarted successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        action: 'restart',
      };
    }
  }

  /**
   * Retry an agent operation
   * @param {string} agentId - ID of the agent to retry
   * @param {object} analysis - Failure analysis
   * @returns {object} Result of the retry
   */
  async retryAgent(agentId, analysis) {
    try {
      logger.log(`🔄 Retrying agent: ${agentId}`);

      // Update agent state
      this.agentStates.set(agentId, {
        status: 'retrying',
        timestamp: new Date().toISOString(),
      });

      // Apply any specific retry logic based on analysis
      if (analysis.type === 'timeout') {
        // For timeout errors, we might want to increase timeout
        logger.log(`Increasing timeout for agent ${agentId}`);
      } else if (analysis.type === 'resource_exhaustion') {
        // For resource exhaustion, we might want to reduce workload
        logger.log(`Reducing workload for agent ${agentId}`);
      }

      // Simulate retry process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      this.agentStates.set(agentId, {
        status: 'running',
        timestamp: new Date().toISOString(),
        retriedAt: new Date().toISOString(),
      });

      return {
        success: true,
        action: 'retry',
        details: `Agent ${agentId} retry completed`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        action: 'retry',
      };
    }
  }

  /**
   * Fallback to an alternative agent
   * @param {string} agentId - ID of the agent to fallback from
   * @param {object} analysis - Failure analysis
   * @returns {object} Result of the fallback
   */
  async fallbackAgent(agentId, analysis) {
    try {
      logger.log(`🔄 Falling back from agent: ${agentId}`);

      // Find an alternative agent
      const alternativeAgent = await this.findAlternativeAgent(agentId, analysis);

      if (!alternativeAgent) {
        return {
          success: false,
          error: 'no_alternative_agent_available',
          action: 'fallback',
        };
      }

      logger.log(`Using alternative agent: ${alternativeAgent}`);

      // Update agent state
      this.agentStates.set(agentId, {
        status: 'fallback_active',
        fallbackAgent: alternativeAgent,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        action: 'fallback',
        details: `Fall back to agent ${alternativeAgent} successful`,
        fallbackAgent,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        action: 'fallback',
      };
    }
  }

  /**
   * Throttle an agent to reduce load
   * @param {string} agentId - ID of the agent to throttle
   * @returns {object} Result of the throttling
   */
  async throttleAgent(agentId) {
    try {
      logger.log(`⏳ Throttling agent: ${agentId}`);

      // Update agent state to throttled
      this.agentStates.set(agentId, {
        status: 'throttled',
        throttleLevel: 'medium',
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        action: 'throttle',
        details: `Agent ${agentId} throttled successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        action: 'throttle',
      };
    }
  }

  /**
   * Reset an agent to initial state
   * @param {string} agentId - ID of the agent to reset
   * @returns {object} Result of the reset
   */
  async resetAgent(agentId) {
    try {
      logger.log(`🔄 Resetting agent: ${agentId}`);

      // Reset agent state completely
      this.agentStates.set(agentId, {
        status: 'reset',
        timestamp: new Date().toISOString(),
      });

      // Clear any cached data or state
      await this.clearAgentState(agentId);

      return {
        success: true,
        action: 'reset',
        details: `Agent ${agentId} reset successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        action: 'reset',
      };
    }
  }

  /**
   * Find an alternative agent for fallback
   * @param {string} originalAgentId - Original agent ID
   * @param {object} analysis - Failure analysis
   * @returns {string|null} Alternative agent ID or null if none available
   */
  async findAlternativeAgent(originalAgentId, analysis) {
    // In a real implementation, this would look for available agents
    // that can handle the same type of work
    // For now, return a generic fallback agent
    return `fallback_${originalAgentId}`;
  }

  /**
   * Clear agent state
   * @param {string} agentId - ID of the agent
   */
  async clearAgentState(agentId) {
    // In a real implementation, this would clear any cached state
    // associated with the agent
    logger.log(`🧹 Cleared state for agent: ${agentId}`);
  }

  /**
   * Generate an autopsy report for an agent
   * @param {string} agentId - ID of the agent
   * @returns {object} Autopsy report
   */
  async generateAutopsyReport(agentId) {
    const failures = this.failureLog.get(agentId) || [];
    const recoveryHistory = this.recoveryHistory.get(agentId) || [];
    const currentState = this.agentStates.get(agentId);

    const report = {
      agentId,
      timestamp: new Date().toISOString(),
      summary: {
        totalFailures: failures.length,
        totalRecoveries: recoveryHistory.length,
        currentStatus: currentState?.status || 'unknown',
        lastFailure: failures.length > 0 ? failures[failures.length - 1].timestamp : null,
        lastRecovery:
          recoveryHistory.length > 0 ? recoveryHistory[recoveryHistory.length - 1].timestamp : null,
      },
      failures: failures.map((f) => ({
        timestamp: f.timestamp,
        error: f.error.message,
        type: f.analysis.type,
        severity: f.analysis.severity,
        cause: f.analysis.cause,
      })),
      recoveryHistory: recoveryHistory.map((r) => ({
        timestamp: r.timestamp,
        strategy: r.strategy,
        success: r.result.success,
        details: r.result.details,
      })),
      recommendations: await this.generateRecommendations(agentId),
    };

    this.autopsyReports.push(report);

    // Keep only recent reports
    const maxReports = 50;
    if (this.autopsyReports.length > maxReports) {
      this.autopsyReports = this.autopsyReports.slice(-maxReports);
    }

    return report;
  }

  /**
   * Generate recommendations for an agent
   * @param {string} agentId - ID of the agent
   * @returns {Array<string>} Recommendations
   */
  async generateRecommendations(agentId) {
    const failures = this.failureLog.get(agentId) || [];
    const recommendations = [];

    // Analyze failure patterns
    const failureTypes = failures.reduce((acc, f) => {
      acc[f.analysis.type] = (acc[f.analysis.type] || 0) + 1;
      return acc;
    }, {});

    // Generate recommendations based on patterns
    for (const [type, count] of Object.entries(failureTypes)) {
      if (count >= 3) {
        switch (type) {
          case 'timeout':
            recommendations.push('Increase operation timeout values');
            recommendations.push('Optimize agent processing speed');
            break;
          case 'resource_exhaustion':
            recommendations.push('Reduce input size or batch processing');
            recommendations.push('Increase memory allocation');
            break;
          case 'network':
            recommendations.push('Check network connectivity');
            recommendations.push('Implement better retry logic');
            break;
          case 'database':
            recommendations.push('Verify database connection');
            recommendations.push('Optimize database queries');
            break;
        }
      }
    }

    // Add general recommendations
    if (recommendations.length === 0) {
      recommendations.push('Monitor agent performance');
      recommendations.push('Review agent configuration');
    }

    return recommendations;
  }

  /**
   * Get agent health score
   * @param {string} agentId - ID of the agent
   * @returns {number} Health score (0-100)
   */
  async getAgentHealthScore(agentId) {
    const failures = this.failureLog.get(agentId) || [];
    const recoveryHistory = this.recoveryHistory.get(agentId) || [];
    const currentState = this.agentStates.get(agentId);

    // Calculate health score based on various factors
    let score = 100;

    // Deduct points for recent failures
    const recentFailures = failures.filter((f) => {
      const hoursAgo = (Date.now() - new Date(f.timestamp).getTime()) / (1000 * 60 * 60);
      return hoursAgo < 24; // Last 24 hours
    });

    score -= recentFailures.length * 10; // 10 points per recent failure

    // Adjust for recovery success rate
    if (recoveryHistory.length > 0) {
      const successfulRecoveries = recoveryHistory.filter((r) => r.result.success).length;
      const successRate = successfulRecoveries / recoveryHistory.length;
      score += successRate * 20; // Up to 20 bonus points for good recovery rate
    }

    // Adjust for current state
    if (currentState?.status === 'unstable') {
      score -= 30;
    } else if (currentState?.status === 'recovered') {
      score += 5;
    }

    // Ensure score stays within bounds
    score = Math.max(0, Math.min(100, Math.round(score)));

    return score;
  }

  /**
   * Get all failure logs
   * @returns {Map} Failure logs
   */
  getFailureLogs() {
    return new Map(this.failureLog);
  }

  /**
   * Get all agent states
   * @returns {Map} Agent states
   */
  getAgentStates() {
    return new Map(this.agentStates);
  }

  /**
   * Get recovery history
   * @returns {Map} Recovery history
   */
  getRecoveryHistory() {
    return new Map(this.recoveryHistory);
  }

  /**
   * Get all autopsy reports
   * @returns {Array} Autopsy reports
   */
  getAutopsyReports() {
    return [...this.autopsyReports];
  }

  /**
   * Clear all logs and history
   */
  async clearAllLogs() {
    this.failureLog.clear();
    this.agentStates.clear();
    this.recoveryHistory.clear();
    this.autopsyReports = [];

    logger.log('🧹 All agent autopsy logs cleared');
  }
}

export { AgentAutopsy };
export default AgentAutopsy;

let agentAutopsyInstance = null;
export function getInstance() {
  if (!agentAutopsyInstance) {
    agentAutopsyInstance = new AgentAutopsy();
  }
  return agentAutopsyInstance;
}
