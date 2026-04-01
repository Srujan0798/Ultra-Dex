const { EventEmitter } = require('events');

/**
 * Policy Manager
 * Manages governance policies and access control for Ultra-Dex
 */
class PolicyManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.policies = new Map();
    this.violations = [];
    this.config = {
      enforcementLevel: options.enforcementLevel || 'warn', // 'warn', 'block', 'audit'
      maxViolations: options.maxViolations || 100,
      retentionDays: options.retentionDays || 30
    };
  }

  /**
   * Register a new policy
   */
  registerPolicy(policy) {
    this.policies.set(policy.id, {
      ...policy,
      registeredAt: Date.now(),
      active: true
    });
    
    this.emit('policy-registered', { policyId: policy.id });
  }

  /**
   * Evaluate if an action complies with policies
   */
  async evaluateAction(action, context = {}) {
    const violations = [];
    const evaluationId = `eval-${Date.now()}`;
    
    this.emit('evaluation-started', { evaluationId, action, context });

    for (const [policyId, policy] of this.policies) {
      if (!policy.active) continue;

      try {
        const result = await this.evaluatePolicyRule(policy, action, context);
        
        if (!result.compliant) {
          const violation = {
            id: `violation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            policyId,
            action,
            context,
            severity: policy.severity || 'medium',
            message: result.message,
            timestamp: Date.now(),
            evaluationId
          };
          
          violations.push(violation);
          this.violations.push(violation);
          
          this.emit('policy-violation', violation);
        }
      } catch (error) {
        this.emit('evaluation-error', { policyId, action, error });
      }
    }

    const decision = this.makeEnforcementDecision(violations);
    
    this.emit('evaluation-completed', { 
      evaluationId, 
      violations, 
      decision,
      allowed: decision.allowed
    });

    return {
      evaluationId,
      allowed: decision.allowed,
      violations,
      decision
    };
  }

  /**
   * Evaluate a single policy rule
   */
  async evaluatePolicyRule(policy, action, context) {
    const { rules, conditions } = policy;
    
    // Check conditions first
    if (conditions && !this.evaluateConditions(conditions, context)) {
      return { compliant: true, message: 'Policy conditions not met' };
    }

    // Evaluate rules
    for (const rule of rules || []) {
      const ruleResult = this.evaluateRule(rule, action, context);
      if (!ruleResult.compliant) {
        return ruleResult;
      }
    }

    return { compliant: true };
  }

  /**
   * Evaluate policy conditions
   */
  evaluateConditions(conditions, context) {
    // Simple condition evaluation - can be extended
    for (const [key, value] of Object.entries(conditions)) {
      if (context[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Evaluate a single rule
   */
  evaluateRule(rule, action, context) {
    switch (rule.type) {
      case 'resource-limit':
        return this.evaluateResourceLimit(rule, action, context);
      case 'time-restriction':
        return this.evaluateTimeRestriction(rule, action, context);
      case 'permission-check':
        return this.evaluatePermissionCheck(rule, action, context);
      case 'rate-limit':
        return this.evaluateRateLimit(rule, action, context);
      default:
        return { compliant: true, message: `Unknown rule type: ${rule.type}` };
    }
  }

  /**
   * Evaluate resource limit rules
   */
  evaluateResourceLimit(rule, action, context) {
    const { resource, limit } = rule;
    const currentUsage = context.resourceUsage?.[resource] || 0;
    
    if (currentUsage >= limit) {
      return {
        compliant: false,
        message: `Resource ${resource} usage (${currentUsage}) exceeds limit (${limit})`
      };
    }
    
    return { compliant: true };
  }

  /**
   * Evaluate time restriction rules
   */
  evaluateTimeRestriction(rule, action, context) {
    const { allowedHours } = rule;
    const currentHour = new Date().getHours();
    
    if (!allowedHours.includes(currentHour)) {
      return {
        compliant: false,
        message: `Action not allowed at hour ${currentHour}`
      };
    }
    
    return { compliant: true };
  }

  /**
   * Evaluate permission check rules
   */
  evaluatePermissionCheck(rule, action, context) {
    const { requiredPermissions } = rule;
    const userPermissions = context.userPermissions || [];
    
    for (const permission of requiredPermissions) {
      if (!userPermissions.includes(permission)) {
        return {
          compliant: false,
          message: `Missing required permission: ${permission}`
        };
      }
    }
    
    return { compliant: true };
  }

  /**
   * Evaluate rate limit rules
   */
  evaluateRateLimit(rule, action, context) {
    const { maxActions, timeWindow } = rule;
    const userId = context.userId || 'anonymous';
    
    // Simple rate limiting - can be enhanced with Redis or external store
    const recentActions = this.violations
      .filter(v => 
        v.context?.userId === userId &&
        Date.now() - v.timestamp < timeWindow * 1000
      ).length;
    
    if (recentActions >= maxActions) {
      return {
        compliant: false,
        message: `Rate limit exceeded: ${recentActions}/${maxActions} in ${timeWindow}s`
      };
    }
    
    return { compliant: true };
  }

  /**
   * Make enforcement decision based on violations
   */
  makeEnforcementDecision(violations) {
    if (violations.length === 0) {
      return { allowed: true, reason: 'No policy violations' };
    }

    const highSeverityViolations = violations.filter(v => v.severity === 'high');
    const mediumSeverityViolations = violations.filter(v => v.severity === 'medium');

    switch (this.config.enforcementLevel) {
      case 'block':
        return {
          allowed: violations.length === 0,
          reason: violations.length > 0 ? 'Policy violations detected' : 'No violations'
        };
      case 'warn':
        return {
          allowed: highSeverityViolations.length === 0,
          reason: highSeverityViolations.length > 0 
            ? 'High severity violations detected' 
            : 'Low/medium severity violations - allowing with warning'
        };
      case 'audit':
        return {
          allowed: true,
          reason: 'Audit mode - logging violations but allowing action'
        };
      default:
        return { allowed: false, reason: 'Unknown enforcement level' };
    }
  }

  /**
   * Get policy compliance report
   */
  getComplianceReport(timeRangeMs = 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - timeRangeMs;
    const recentViolations = this.violations.filter(v => v.timestamp > cutoff);
    
    const byPolicy = {};
    const bySeverity = { high: 0, medium: 0, low: 0 };
    
    for (const violation of recentViolations) {
      byPolicy[violation.policyId] = (byPolicy[violation.policyId] || 0) + 1;
      bySeverity[violation.severity] = (bySeverity[violation.severity] || 0) + 1;
    }

    return {
      timeRange: timeRangeMs,
      totalViolations: recentViolations.length,
      violationsByPolicy: byPolicy,
      violationsBySeverity: bySeverity,
      activePolicies: this.policies.size,
      enforcementLevel: this.config.enforcementLevel
    };
  }

  /**
   * Clean up old violations
   */
  cleanupOldViolations() {
    const cutoff = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
    const originalCount = this.violations.length;
    
    this.violations = this.violations.filter(v => v.timestamp > cutoff);
    
    const cleaned = originalCount - this.violations.length;
    if (cleaned > 0) {
      this.emit('violations-cleaned', { cleaned, remaining: this.violations.length });
    }
  }
}

module.exports = { PolicyManager };
