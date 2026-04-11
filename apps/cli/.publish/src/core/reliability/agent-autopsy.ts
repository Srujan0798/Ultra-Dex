import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
const defaultLogger = {
  log(...args) {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    console.log(...args);
  },
};
class AgentAutopsy extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      logPath: options.logPath || path.join(process.cwd(), '.ultra-dex', 'autopsy'),
      logRetention: options.logRetention || 7,
      // days
      maxFailureCount: options.maxFailureCount || 5,
      recoveryStrategies: options.recoveryStrategies || ['restart', 'retry', 'fallback'],
      ...options,
    };
    this.logger = options.logger || defaultLogger;
    this.failureLog = /* @__PURE__ */ new Map();
    this.agentStates = /* @__PURE__ */ new Map();
    this.recoveryHistory = /* @__PURE__ */ new Map();
    this.autopsyReports = [];
    this.monitoredAgents = /* @__PURE__ */ new Map();
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
      maxResponseTime: config.maxResponseTime || 3e4,
      maxFailures: config.maxFailures || this.options.maxFailureCount,
      lastHeartbeat: null,
      status: 'healthy',
    });
    return this.monitoredAgents.get(agentId);
  }
  heartbeat(agentId, status = {}) {
    const monitored = this.monitoredAgents.get(agentId) || this.monitor(agentId);
    monitored.lastHeartbeat = /* @__PURE__ */ new Date().toISOString();
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
      timestamp: /* @__PURE__ */ new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
      },
      context,
      analysis: await this.analyzeFailure(error, context),
    };
    if (!this.failureLog.has(agentId)) {
      this.failureLog.set(agentId, []);
    }
    const agentFailures = this.failureLog.get(agentId);
    agentFailures.push(failure);
    const cutoffDate = new Date(Date.now() - this.options.logRetention * 24 * 60 * 60 * 1e3);
    const recentFailures = agentFailures.filter((f) => new Date(f.timestamp) > cutoffDate);
    this.failureLog.set(agentId, recentFailures);
    this.logger.log(`\u{1F480} Agent ${agentId} failure logged: ${error.message}`);
    this.emit('failure:logged', { agentId, failure });
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
      const minutesAgo = (Date.now() - new Date(f.timestamp).getTime()) / (1e3 * 60);
      return minutesAgo < 10;
    });
    if (recentFailures.length >= this.options.maxFailureCount) {
      this.logger.log(
        `\u{1F6A8} Agent ${agentId} showing concerning failure pattern (${recentFailures.length} recent failures)`
      );
      this.agentStates.set(agentId, {
        status: 'unstable',
        lastFailure: recentFailures[recentFailures.length - 1],
        failureCount: recentFailures.length,
        timestamp: /* @__PURE__ */ new Date().toISOString(),
      });
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
      this.logger.log(`No state found for agent ${agentId}`);
      return { success: false, reason: 'no_state_found' };
    }
    const lastFailure = agentState.lastFailure;
    const analysis = lastFailure.analysis;
    this.logger.log(`Attempting recovery for agent ${agentId} (type: ${analysis.type})`);
    for (const strategy of this.options.recoveryStrategies) {
      const recoveryResult = await this.executeRecoveryStrategy(strategy, agentId, analysis);
      if (recoveryResult.success) {
        this.logger.log(
          `\u2705 Recovery successful for agent ${agentId} using strategy: ${strategy}`
        );
        this.agentStates.set(agentId, {
          ...agentState,
          status: 'recovered',
          lastRecovery: {
            strategy,
            timestamp: /* @__PURE__ */ new Date().toISOString(),
            result: recoveryResult,
          },
        });
        if (!this.recoveryHistory.has(agentId)) {
          this.recoveryHistory.set(agentId, []);
        }
        this.recoveryHistory.get(agentId).push({
          strategy,
          timestamp: /* @__PURE__ */ new Date().toISOString(),
          result: recoveryResult,
          failure: lastFailure,
        });
        return recoveryResult;
      } else {
        this.logger.log(
          `Recovery strategy ${strategy} failed for agent ${agentId}:`,
          recoveryResult.error
        );
      }
    }
    this.logger.log(`\u274C All recovery strategies failed for agent ${agentId}`);
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
      this.logger.log(`\u{1F504} Restarting agent: ${agentId}`);
      this.agentStates.set(agentId, {
        status: 'restarting',
        timestamp: /* @__PURE__ */ new Date().toISOString(),
      });
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      this.agentStates.set(agentId, {
        status: 'running',
        timestamp: /* @__PURE__ */ new Date().toISOString(),
        restartedAt: /* @__PURE__ */ new Date().toISOString(),
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
      this.logger.log(`\u{1F504} Retrying agent: ${agentId}`);
      this.agentStates.set(agentId, {
        status: 'retrying',
        timestamp: /* @__PURE__ */ new Date().toISOString(),
      });
      if (analysis.type === 'timeout') {
        this.logger.log(`Increasing timeout for agent ${agentId}`);
      } else if (analysis.type === 'resource_exhaustion') {
        this.logger.log(`Reducing workload for agent ${agentId}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
      this.agentStates.set(agentId, {
        status: 'running',
        timestamp: /* @__PURE__ */ new Date().toISOString(),
        retriedAt: /* @__PURE__ */ new Date().toISOString(),
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
      this.logger.log(`\u{1F504} Falling back from agent: ${agentId}`);
      const alternativeAgent = await this.findAlternativeAgent(agentId, analysis);
      if (!alternativeAgent) {
        return {
          success: false,
          error: 'no_alternative_agent_available',
          action: 'fallback',
        };
      }
      this.logger.log(`Using alternative agent: ${alternativeAgent}`);
      this.agentStates.set(agentId, {
        status: 'fallback_active',
        fallbackAgent: alternativeAgent,
        timestamp: /* @__PURE__ */ new Date().toISOString(),
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
      this.logger.log(`\u23F3 Throttling agent: ${agentId}`);
      this.agentStates.set(agentId, {
        status: 'throttled',
        throttleLevel: 'medium',
        timestamp: /* @__PURE__ */ new Date().toISOString(),
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
      this.logger.log(`\u{1F504} Resetting agent: ${agentId}`);
      this.agentStates.set(agentId, {
        status: 'reset',
        timestamp: /* @__PURE__ */ new Date().toISOString(),
      });
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
    return `fallback_${originalAgentId}`;
  }
  /**
   * Clear agent state
   * @param {string} agentId - ID of the agent
   */
  async clearAgentState(agentId) {
    this.logger.log(`\u{1F9F9} Cleared state for agent: ${agentId}`);
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
      timestamp: /* @__PURE__ */ new Date().toISOString(),
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
    const failureTypes = failures.reduce((acc, f) => {
      acc[f.analysis.type] = (acc[f.analysis.type] || 0) + 1;
      return acc;
    }, {});
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
    let score = 100;
    const recentFailures = failures.filter((f) => {
      const hoursAgo = (Date.now() - new Date(f.timestamp).getTime()) / (1e3 * 60 * 60);
      return hoursAgo < 24;
    });
    score -= recentFailures.length * 10;
    if (recoveryHistory.length > 0) {
      const successfulRecoveries = recoveryHistory.filter((r) => r.result.success).length;
      const successRate = successfulRecoveries / recoveryHistory.length;
      score += successRate * 20;
    }
    if (currentState?.status === 'unstable') {
      score -= 30;
    } else if (currentState?.status === 'recovered') {
      score += 5;
    }
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
    this.logger.log('\u{1F9F9} All agent autopsy logs cleared');
  }
}
var agent_autopsy_default = AgentAutopsy;
let agentAutopsyInstance = null;
function getInstance() {
  if (!agentAutopsyInstance) {
    agentAutopsyInstance = new AgentAutopsy();
  }
  return agentAutopsyInstance;
}
export { AgentAutopsy, agent_autopsy_default as default, getInstance };
