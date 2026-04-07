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
let PolicyEngine = class extends EventEmitter {
  constructor(options = {}) {
    super();
    this.policies = /* @__PURE__ */ new Map();
    this.violations = [];
    this.enforcementLevel = options.enforcementLevel || "warn";
    this.maxViolations = options.maxViolations || 100;
    this.initializeDefaultPolicies();
  }
  initializeDefaultPolicies() {
    this.addPolicy("resource_limits", {
      name: "Resource Usage Limits",
      description: "Limits on CPU, memory, and API usage",
      rules: [
        { type: "cpu_usage", limit: 80, unit: "percent" },
        { type: "memory_usage", limit: 2048, unit: "MB" },
        { type: "api_calls", limit: 1e3, unit: "per_hour" }
      ],
      severity: "high"
    });
    this.addPolicy("security", {
      name: "Security Requirements",
      description: "Security and access control policies",
      rules: [
        { type: "auth_required", value: true },
        { type: "min_password_length", value: 8 },
        { type: "session_timeout", value: 3600, unit: "seconds" }
      ],
      severity: "critical"
    });
    this.addPolicy("agent_behavior", {
      name: "Agent Behavior Constraints",
      description: "Limits on agent actions and capabilities",
      rules: [
        { type: "max_concurrent_tasks", value: 10 },
        { type: "task_timeout", value: 300, unit: "seconds" },
        { type: "allowed_actions", value: ["read", "write", "execute", "analyze"] }
      ],
      severity: "medium"
    });
  }
  addPolicy(id, policy) {
    this.policies.set(id, {
      id,
      ...policy,
      created: /* @__PURE__ */ new Date(),
      enabled: true
    });
    this.emit("policy.added", { id, policy });
    return this.policies.get(id);
  }
  removePolicy(id) {
    const policy = this.policies.get(id);
    if (policy) {
      this.policies.delete(id);
      this.emit("policy.removed", { id, policy });
    }
    return policy;
  }
  async evaluatePolicy(policyId, context) {
    const policy = this.policies.get(policyId);
    if (!policy || !policy.enabled) {
      return { compliant: true, policy: policyId };
    }
    const violations = [];
    for (const rule of policy.rules) {
      const result2 = await this.evaluateRule(rule, context);
      if (!result2.compliant) {
        violations.push(result2);
      }
    }
    const compliant = violations.length === 0;
    const result = {
      policyId,
      policy: policy.name,
      compliant,
      violations,
      severity: policy.severity,
      timestamp: /* @__PURE__ */ new Date()
    };
    if (!compliant) {
      this.recordViolation(result);
      this.emit("policy.violation", result);
      if (this.enforcementLevel === "block" || this.enforcementLevel === "strict" && policy.severity === "critical") {
        throw new Error(`Policy violation: ${policy.name} - ${violations.map((v) => v.message).join(", ")}`);
      }
    }
    return result;
  }
  async evaluateRule(rule, context) {
    switch (rule.type) {
      case "cpu_usage":
        return this.checkResourceUsage("cpu", rule.limit, context);
      case "memory_usage":
        return this.checkResourceUsage("memory", rule.limit, context);
      case "api_calls":
        return this.checkAPILimit(rule.limit, context);
      case "auth_required":
        return this.checkAuthentication(context);
      case "max_concurrent_tasks":
        return this.checkConcurrentTasks(rule.value, context);
      case "task_timeout":
        return this.checkTaskTimeout(rule.value, context);
      case "allowed_actions":
        return this.checkAllowedActions(rule.value, context);
      default:
        return { compliant: true, rule: rule.type };
    }
  }
  checkResourceUsage(resource, limit, context) {
    const usage = context.resourceUsage?.[resource] || 0;
    const compliant = usage <= limit;
    return {
      compliant,
      rule: `${resource}_usage`,
      message: compliant ? null : `${resource} usage (${usage}) exceeds limit (${limit})`,
      actual: usage,
      limit
    };
  }
  checkAPILimit(limit, context) {
    const calls = context.apiCalls || 0;
    const compliant = calls <= limit;
    return {
      compliant,
      rule: "api_calls",
      message: compliant ? null : `API calls (${calls}) exceeds limit (${limit})`,
      actual: calls,
      limit
    };
  }
  checkAuthentication(context) {
    const authenticated = Boolean(context.user?.id);
    return {
      compliant: authenticated,
      rule: "auth_required",
      message: authenticated ? null : "Authentication required"
    };
  }
  checkConcurrentTasks(maxTasks, context) {
    const activeTasks = context.activeTasks || 0;
    const compliant = activeTasks <= maxTasks;
    return {
      compliant,
      rule: "max_concurrent_tasks",
      message: compliant ? null : `Concurrent tasks (${activeTasks}) exceeds limit (${maxTasks})`,
      actual: activeTasks,
      limit: maxTasks
    };
  }
  checkTaskTimeout(timeout, context) {
    if (!context.taskStartTime)
      return { compliant: true, rule: "task_timeout" };
    const elapsed = (Date.now() - context.taskStartTime) / 1e3;
    const compliant = elapsed <= timeout;
    return {
      compliant,
      rule: "task_timeout",
      message: compliant ? null : `Task timeout (${elapsed}s) exceeds limit (${timeout}s)`,
      actual: elapsed,
      limit: timeout
    };
  }
  checkAllowedActions(allowedActions, context) {
    if (!context.action)
      return { compliant: true, rule: "allowed_actions" };
    const compliant = allowedActions.includes(context.action);
    return {
      compliant,
      rule: "allowed_actions",
      message: compliant ? null : `Action '${context.action}' is not allowed`,
      actual: context.action,
      allowed: allowedActions
    };
  }
  recordViolation(violation) {
    this.violations.push(violation);
    if (this.violations.length > this.maxViolations) {
      this.violations.shift();
    }
  }
  async evaluateAllPolicies(context) {
    const results = [];
    const violations = [];
    for (const [policyId, policy] of this.policies) {
      if (policy.enabled) {
        try {
          const result = await this.evaluatePolicy(policyId, context);
          results.push(result);
          if (!result.compliant) {
            violations.push(result);
          }
        } catch (error) {
          throw error;
        }
      }
    }
    return {
      compliant: violations.length === 0,
      results,
      violations,
      evaluatedAt: /* @__PURE__ */ new Date()
    };
  }
  getViolations(options = {}) {
    let violations = this.violations;
    if (options.severity) {
      violations = violations.filter((v) => v.severity === options.severity);
    }
    if (options.policyId) {
      violations = violations.filter((v) => v.policyId === options.policyId);
    }
    if (options.since) {
      violations = violations.filter((v) => v.timestamp >= options.since);
    }
    return violations.slice(0, options.limit || violations.length);
  }
  getStats() {
    return {
      policies: this.policies.size,
      enabledPolicies: Array.from(this.policies.values()).filter((p) => p.enabled).length,
      totalViolations: this.violations.length,
      violationsBySeverity: {
        critical: this.violations.filter((v) => v.severity === "critical").length,
        high: this.violations.filter((v) => v.severity === "high").length,
        medium: this.violations.filter((v) => v.severity === "medium").length,
        low: this.violations.filter((v) => v.severity === "low").length
      },
      enforcementLevel: this.enforcementLevel
    };
  }
};
PolicyEngine = __decorateClass([
  singleton()
], PolicyEngine);
var policy_engine_default = PolicyEngine;
export {
  PolicyEngine,
  policy_engine_default as default
};
