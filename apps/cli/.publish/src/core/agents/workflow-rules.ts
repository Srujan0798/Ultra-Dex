var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import { EventEmitter } from 'events';
let WorkflowRules = class extends EventEmitter {
  constructor(options = {}) {
    super();
    this.rules = /* @__PURE__ */ new Map();
    this.conditions = /* @__PURE__ */ new Map();
    this.actions = /* @__PURE__ */ new Map();
    this.priorities = /* @__PURE__ */ new Map();
    this.config = {
      enableLogging: options.enableLogging !== false,
      enableValidation: options.enableValidation !== false,
      ...options,
    };
  }
  /**
   * Add a rule
   */
  addRule(ruleId, rule) {
    this.rules.set(ruleId, {
      id: ruleId,
      condition: rule.condition,
      action: rule.action,
      priority: rule.priority || 0,
      active: rule.active !== false,
      createdAt: Date.now(),
    });
    this.emit('rule.added', { ruleId, priority: rule.priority });
    return this;
  }
  /**
   * Remove a rule
   */
  removeRule(ruleId) {
    this.rules.delete(ruleId);
    this.emit('rule.removed', { ruleId });
    return this;
  }
  /**
   * Enable a rule
   */
  enableRule(ruleId) {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.active = true;
      this.emit('rule.enabled', { ruleId });
    }
    return this;
  }
  /**
   * Disable a rule
   */
  disableRule(ruleId) {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.active = false;
      this.emit('rule.disabled', { ruleId });
    }
    return this;
  }
  /**
   * Register a condition function
   */
  registerCondition(conditionId, conditionFn) {
    this.conditions.set(conditionId, conditionFn);
    this.emit('condition.registered', { conditionId });
    return this;
  }
  /**
   * Register an action function
   */
  registerAction(actionId, actionFn) {
    this.actions.set(actionId, actionFn);
    this.emit('action.registered', { actionId });
    return this;
  }
  /**
   * Evaluate all rules against context
   */
  async evaluateRules(context) {
    const matchedRules = [];
    const sortedRules = Array.from(this.rules.values())
      .filter((r) => r.active)
      .sort((a, b) => b.priority - a.priority);
    for (const rule of sortedRules) {
      try {
        const conditionMet = await this.evaluateCondition(rule.condition, context);
        if (conditionMet) {
          matchedRules.push(rule);
        }
      } catch (error) {
        this.emit('rule.evaluation-error', { ruleId: rule.id, error });
      }
    }
    return matchedRules;
  }
  /**
   * Evaluate a condition
   */
  async evaluateCondition(condition, context) {
    if (typeof condition === 'function') {
      return await condition(context);
    }
    if (typeof condition === 'string') {
      const conditionFn = this.conditions.get(condition);
      if (conditionFn) {
        return await conditionFn(context);
      }
    }
    if (condition.type === 'and') {
      return (
        await Promise.all(condition.conditions.map((c) => this.evaluateCondition(c, context)))
      ).every((r) => r);
    }
    if (condition.type === 'or') {
      return (
        await Promise.all(condition.conditions.map((c) => this.evaluateCondition(c, context)))
      ).some((r) => r);
    }
    if (condition.type === 'not') {
      return !(await this.evaluateCondition(condition.condition, context));
    }
    return false;
  }
  /**
   * Execute actions
   */
  async executeActions(actions, context) {
    const results = [];
    for (const action of actions) {
      try {
        const result = await this.executeAction(action, context);
        results.push({ action, result, success: true });
      } catch (error) {
        results.push({ action, error, success: false });
      }
    }
    return results;
  }
  /**
   * Execute a single action
   */
  async executeAction(action, context) {
    if (typeof action === 'function') {
      return await action(context);
    }
    if (typeof action === 'string') {
      const actionFn = this.actions.get(action);
      if (actionFn) {
        return await actionFn(context);
      }
    }
    if (action.type === 'sequence') {
      return await this.executeActions(action.actions, context);
    }
    if (action.type === 'parallel') {
      return await Promise.all(action.actions.map((a) => this.executeAction(a, context)));
    }
    if (action.type === 'conditional') {
      const condition = await this.evaluateCondition(action.condition, context);
      if (condition) {
        return await this.executeAction(action.thenAction, context);
      } else if (action.elseAction) {
        return await this.executeAction(action.elseAction, context);
      }
    }
    throw new Error(`Unknown action: ${JSON.stringify(action)}`);
  }
  /**
   * Create rule from template
   */
  createRuleFromTemplate(ruleId, template, parameters = {}) {
    const rule = {
      condition:
        typeof template.condition === 'function'
          ? template.condition
          : (ctx) => this.evaluateCondition(template.condition, ctx),
      action:
        typeof template.action === 'function'
          ? template.action
          : (ctx) => this.executeAction(template.action, ctx),
      priority: template.priority || 0,
    };
    return this.addRule(ruleId, rule);
  }
  /**
   * List all rules
   */
  listRules(filter = {}) {
    let rules = Array.from(this.rules.values());
    if (filter.active !== void 0) {
      rules = rules.filter((r) => r.active === filter.active);
    }
    if (filter.minPriority !== void 0) {
      rules = rules.filter((r) => r.priority >= filter.minPriority);
    }
    return rules.sort((a, b) => b.priority - a.priority);
  }
  /**
   * Get rule statistics
   */
  getStats() {
    const rules = Array.from(this.rules.values());
    return {
      totalRules: rules.length,
      activeRules: rules.filter((r) => r.active).length,
      disabledRules: rules.filter((r) => !r.active).length,
      registeredConditions: this.conditions.size,
      registeredActions: this.actions.size,
      priorityDistribution: this.calculatePriorityDistribution(rules),
    };
  }
  /**
   * Calculate priority distribution
   */
  calculatePriorityDistribution(rules) {
    const distribution = {};
    for (const rule of rules) {
      const priority = rule.priority;
      distribution[priority] = (distribution[priority] || 0) + 1;
    }
    return distribution;
  }
  /**
   * Validate rules
   */
  validateRules() {
    const issues = [];
    for (const [ruleId, rule] of this.rules) {
      if (!rule.condition) {
        issues.push({ ruleId, issue: 'No condition defined' });
      }
      if (!rule.action) {
        issues.push({ ruleId, issue: 'No action defined' });
      }
    }
    return {
      valid: issues.length === 0,
      issues,
    };
  }
  /**
   * Export rules
   */
  export() {
    return {
      rules: Array.from(this.rules.values()).map((r) => ({
        id: r.id,
        priority: r.priority,
        active: r.active,
        createdAt: r.createdAt,
      })),
      conditionCount: this.conditions.size,
      actionCount: this.actions.size,
    };
  }
};
WorkflowRules = __decorateClass([singleton()], WorkflowRules);
var workflow_rules_default = WorkflowRules;
export { WorkflowRules, workflow_rules_default as default };
