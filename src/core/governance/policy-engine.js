/**
 * Ultra-Dex Policy Engine
 * Evaluates rules against a context to determine if an action is allowed or requires approval.
 */

class PolicyEngine {
  constructor() {
    this.rules = [];
  }

  addRule(rule) {
    this.rules.push(rule);
  }

  /**
   * Evaluate context against rules
   * @param {Object} context 
   * @returns {Object} { allowed: boolean, reasons: string[], requiresApproval: boolean }
   */
  evaluate(context) {
    const result = {
      allowed: true,
      reasons: [],
      requiresApproval: false
    };

    for (const rule of this.rules) {
      if (rule.condition(context)) {
        if (rule.effect === 'deny') {
          result.allowed = false;
          result.reasons.push(rule.reason);
        } else if (rule.effect === 'require_approval') {
          result.requiresApproval = true;
          result.reasons.push(rule.reason);
        }
      }
    }

    return result;
  }
}

export default PolicyEngine;
