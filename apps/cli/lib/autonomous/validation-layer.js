// Copyright (c) 2026 Ultra-Dex
// Validation Layer - Output validation with configurable gates

import { AUTONOMOUS_GATES, requireGateApproval } from './gates.js';

/**
 * @typedef {Object} ValidationCriteria
 * @property {string} type - Validation type: 'schema' | 'regex' | 'function' | 'ai-judge'
 * @property {*} spec - Validation specification (schema, pattern, function, prompt)
 * @property {string} [message] - Custom error message
 * @property {boolean} [required=true] - Whether this validation is required
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Overall validation result
 * @property {Array<{rule: string, message: string}>} errors - Validation errors
 * @property {Array<{rule: string, message: string}>} warnings - Validation warnings
 * @property {string[]} gatesPassed - Gates that passed
 * @property {string[]} gatesPending - Gates requiring approval
 * @property {Object} metadata - Validation metadata
 */

/**
 * Strictness levels
 */
const STRICTNESS = {
  PERMISSIVE: 'permissive',  // Warnings only, always passes
  NORMAL: 'normal',          // Errors fail, warnings pass
  STRICT: 'strict'           // Any issue fails
};

/**
 * ValidationLayer - Validates task outputs with configurable criteria
 * 
 * Supports multiple validation types:
 * - Schema validation (JSON structure)
 * - Regex validation (pattern matching)
 * - Function validation (custom logic)
 * - AI-judge validation (LLM-based evaluation)
 * - Gate validation (approval checkpoints)
 * 
 * @example
 * const validator = new ValidationLayer({ strictness: 'normal' });
 * const result = validator.validate(output, [
 *   { type: 'schema', spec: { type: 'object', required: ['id'] } }
 * ]);
 */
export class ValidationLayer {
  /**
   * Create a new ValidationLayer
   * @param {Object} [options={}] - Configuration options
   * @param {string} [options.strictness='normal'] - Strictness level
   * @param {Function} [options.aiJudge] - AI judge function for ai-judge validation
   * @param {string[]} [options.approvedGates=[]] - Pre-approved gate IDs
   */
  constructor(options = {}) {
    this.options = {
      strictness: options.strictness || STRICTNESS.NORMAL,
      aiJudge: options.aiJudge || null,
      approvedGates: options.approvedGates || [],
      ...options
    };
    
    this._gates = AUTONOMOUS_GATES;
    this._approvedGates = new Set(this.options.approvedGates);
  }

  /**
   * Validate output against schema
   * @private
   * @param {*} output - Output to validate
   * @param {Object} schema - JSON schema-like spec
   * @returns {{valid: boolean, errors: string[]}}
   */
  _validateSchema(output, schema) {
    const errors = [];

    if (schema.type) {
      const actualType = Array.isArray(output) ? 'array' : typeof output;
      if (actualType !== schema.type) {
        errors.push(`Expected type "${schema.type}", got "${actualType}"`);
      }
    }

    if (schema.type === 'object' && typeof output === 'object' && output !== null) {
      // Required fields
      if (schema.required) {
        for (const field of schema.required) {
          if (!(field in output)) {
            errors.push(`Missing required field: ${field}`);
          }
        }
      }

      // Property types
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          if (key in output) {
            const propType = Array.isArray(output[key]) ? 'array' : typeof output[key];
            if (propSchema.type && propType !== propSchema.type) {
              errors.push(`Field "${key}": expected "${propSchema.type}", got "${propType}"`);
            }
          }
        }
      }

      // Additional properties
      if (schema.additionalProperties === false) {
        const allowedKeys = new Set([
          ...(schema.required || []),
          ...Object.keys(schema.properties || {})
        ]);
        for (const key of Object.keys(output)) {
          if (!allowedKeys.has(key)) {
            errors.push(`Unexpected field: ${key}`);
          }
        }
      }
    }

    if (schema.type === 'array' && Array.isArray(output)) {
      if (schema.minItems !== undefined && output.length < schema.minItems) {
        errors.push(`Array must have at least ${schema.minItems} items`);
      }
      if (schema.maxItems !== undefined && output.length > schema.maxItems) {
        errors.push(`Array must have at most ${schema.maxItems} items`);
      }
    }

    if (schema.type === 'string' && typeof output === 'string') {
      if (schema.minLength !== undefined && output.length < schema.minLength) {
        errors.push(`String must be at least ${schema.minLength} characters`);
      }
      if (schema.maxLength !== undefined && output.length > schema.maxLength) {
        errors.push(`String must be at most ${schema.maxLength} characters`);
      }
      if (schema.pattern) {
        const regex = new RegExp(schema.pattern);
        if (!regex.test(output)) {
          errors.push(`String does not match pattern: ${schema.pattern}`);
        }
      }
    }

    if (schema.type === 'number' && typeof output === 'number') {
      if (schema.minimum !== undefined && output < schema.minimum) {
        errors.push(`Number must be >= ${schema.minimum}`);
      }
      if (schema.maximum !== undefined && output > schema.maximum) {
        errors.push(`Number must be <= ${schema.maximum}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate output against regex pattern
   * @private
   * @param {*} output - Output to validate
   * @param {string|RegExp} pattern - Regex pattern
   * @returns {{valid: boolean, errors: string[]}}
   */
  _validateRegex(output, pattern) {
    const str = typeof output === 'string' ? output : JSON.stringify(output);
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    
    if (!regex.test(str)) {
      return { valid: false, errors: [`Output does not match pattern: ${pattern}`] };
    }
    return { valid: true, errors: [] };
  }

  /**
   * Validate output using custom function
   * @private
   * @param {*} output - Output to validate
   * @param {Function} fn - Validation function
   * @returns {Promise<{valid: boolean, errors: string[]}>}
   */
  async _validateFunction(output, fn) {
    try {
      const result = await fn(output);
      
      if (typeof result === 'boolean') {
        return { valid: result, errors: result ? [] : ['Custom validation failed'] };
      }
      
      if (typeof result === 'object') {
        return {
          valid: result.valid !== false,
          errors: result.errors || (result.valid === false ? ['Custom validation failed'] : [])
        };
      }

      return { valid: true, errors: [] };
    } catch (error) {
      return { valid: false, errors: [`Validation function error: ${error.message}`] };
    }
  }

  /**
   * Validate output using AI judge
   * 
   * WARNING: AI judge validation is subject to prompt injection if the output 
   * contains instructions that the AI model might follow. The output is 
   * sanitized and wrapped in boundary markers, but should not be the 
   * sole validation gate for security-critical tasks.
   * 
   * @private
   * @param {*} output - Output to validate
   * @param {string} prompt - Evaluation prompt
   * @returns {Promise<{valid: boolean, errors: string[], judgment: string}>}
   */
  async _validateAiJudge(output, prompt) {
    if (!this.options.aiJudge) {
      return { valid: true, errors: [], judgment: 'AI judge not configured - skipping' };
    }

    try {
      const sanitized = this._sanitizeForAiJudge(output);
      const judgment = await this.options.aiJudge(sanitized, prompt);
      
      // Parse judgment (expecting structured response)
      const isValid = judgment.toLowerCase().includes('pass') || 
                      judgment.toLowerCase().includes('valid') ||
                      judgment.toLowerCase().includes('approved');
      
      return {
        valid: isValid,
        errors: isValid ? [] : ['AI judge rejected output'],
        judgment
      };
    } catch (error) {
      return { 
        valid: false, 
        errors: [`AI judge error: ${error.message}`],
        judgment: error.message 
      };
    }
  }

  /**
   * Sanitize content for AI judge to mitigate prompt injection
   * @private
   * @param {*} content - Content to sanitize
   * @returns {string} Sanitized string
   */
  _sanitizeForAiJudge(content) {
    let str = typeof content === 'string' ? content : JSON.stringify(content);
    
    // 1. Truncate to 10KB
    const MAX_LENGTH = 10 * 1024;
    if (str.length > MAX_LENGTH) {
      str = str.substring(0, MAX_LENGTH) + '... (truncated)';
    }

    // 2. Escape special prompt markers
    str = str.replace(/```/g, '` ` `')
             .replace(/<\|/g, '< |')
             .replace(/\|>/g, '| >');

    // 3. Strip "ignore previous" patterns
    const ignorePatterns = [
      /ignore\s+(all\s+)?previous\s+instructions/gi,
      /ignore\s+above/gi,
      /disregard\s+all\s+instructions/gi,
      /system\s+override/gi
    ];
    
    for (const pattern of ignorePatterns) {
      str = str.replace(pattern, '[REDACTED INSTRUCTION]');
    }

    // 4. Wrap in clear content boundaries
    return "=== USER CONTENT START ===\n" + str + "\n=== USER CONTENT END ===";
  }

  /**
   * Check gate approval status
   * @private
   * @param {string} gateId - Gate identifier
   * @returns {{passed: boolean, pending: boolean, gateInfo: Object}}
   */
  _checkGate(gateId) {
    const gate = this._gates.find(g => g.id === gateId);
    
    if (!gate) {
      return { passed: true, pending: false, gateInfo: null };
    }

    const passed = requireGateApproval(gateId, [...this._approvedGates]);
    
    return {
      passed,
      pending: !passed,
      gateInfo: gate
    };
  }

  /**
   * Validate output against criteria
   * 
   * @param {*} output - Output to validate
   * @param {ValidationCriteria[]} [criteria=[]] - Validation criteria
   * @param {Object} [context={}] - Validation context
   * @returns {Promise<ValidationResult>} Validation result
   * 
   * @example
   * const result = await validator.validate(output, [
   *   { type: 'schema', spec: { type: 'object', required: ['id'] } },
   *   { type: 'regex', spec: /success|completed/i }
   * ]);
   */
  async validate(output, criteria = [], context = {}) {
    const errors = [];
    const warnings = [];
    const gatesPassed = [];
    const gatesPending = [];
    const validationDetails = [];

    // Run each validation criterion
    for (const criterion of criteria) {
      const { type, spec, message, required = true } = criterion;
      let result = { valid: true, errors: [] };

      switch (type) {
        case 'schema':
          result = this._validateSchema(output, spec);
          break;
        
        case 'regex':
          result = this._validateRegex(output, spec);
          break;
        
        case 'function':
          result = await this._validateFunction(output, spec);
          break;
        
        case 'ai-judge':
          result = await this._validateAiJudge(output, spec);
          break;
        
        case 'gate': {
          const gateResult = this._checkGate(spec);
          if (gateResult.passed) {
            gatesPassed.push(spec);
          } else {
            gatesPending.push(spec);
          }
          result = { valid: gateResult.passed, errors: gateResult.pending ? [`Gate "${spec}" requires approval`] : [] };
          break;
        }
        
        default:
          warnings.push({ rule: type, message: `Unknown validation type: ${type}` });
          continue;
      }

      validationDetails.push({ type, valid: result.valid, errors: result.errors });

      if (!result.valid) {
        const formattedErrors = result.errors.map(e => ({
          rule: type,
          message: message || e
        }));

        if (required) {
          errors.push(...formattedErrors);
        } else {
          warnings.push(...formattedErrors);
        }
      }
    }

    // Check gates from context
    if (context.requiredGates) {
      for (const gateId of context.requiredGates) {
        const gateResult = this._checkGate(gateId);
        if (gateResult.passed) {
          if (!gatesPassed.includes(gateId)) gatesPassed.push(gateId);
        } else {
          if (!gatesPending.includes(gateId)) gatesPending.push(gateId);
          errors.push({ rule: 'gate', message: `Gate "${gateId}" requires approval` });
        }
      }
    }

    // Determine overall validity based on strictness
    let valid = false;
    switch (this.options.strictness) {
      case STRICTNESS.PERMISSIVE:
        valid = true; // Always pass
        break;
      case STRICTNESS.STRICT:
        valid = errors.length === 0 && warnings.length === 0 && gatesPending.length === 0;
        break;
      case STRICTNESS.NORMAL:
      default:
        valid = errors.length === 0 && gatesPending.length === 0;
    }

    return {
      valid,
      errors,
      warnings,
      gatesPassed,
      gatesPending,
      metadata: {
        strictness: this.options.strictness,
        criteriaCount: criteria.length,
        validationDetails,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Quick schema validation
   * 
   * @param {*} output - Output to validate
   * @param {Object} schema - Schema to validate against
   * @returns {ValidationResult} Validation result
   */
  validateSchema(output, schema) {
    const result = this._validateSchema(output, schema);
    return {
      valid: result.valid,
      errors: result.errors.map(e => ({ rule: 'schema', message: e })),
      warnings: [],
      gatesPassed: [],
      gatesPending: [],
      metadata: { type: 'schema' }
    };
  }

  /**
   * Approve a gate for this session
   * 
   * @param {string} gateId - Gate to approve
   * @returns {boolean} True if gate was approved
   */
  approveGate(gateId) {
    const gate = this._gates.find(g => g.id === gateId);
    if (gate) {
      this._approvedGates.add(gateId);
      return true;
    }
    return false;
  }

  /**
   * Revoke gate approval
   * 
   * @param {string} gateId - Gate to revoke
   */
  revokeGate(gateId) {
    this._approvedGates.delete(gateId);
  }

  /**
   * Get all available gates
   * 
   * @returns {Array} Gate definitions
   */
  getGates() {
    return this._gates.map(g => ({
      ...g,
      approved: this._approvedGates.has(g.id)
    }));
  }

  /**
   * Get approved gates
   * 
   * @returns {string[]} Approved gate IDs
   */
  getApprovedGates() {
    return [...this._approvedGates];
  }

  /**
   * Set strictness level
   * 
   * @param {string} level - Strictness level
   */
  setStrictness(level) {
    if (Object.values(STRICTNESS).includes(level)) {
      this.options.strictness = level;
    }
  }

  /**
   * Create validation criteria from simple rules
   * 
   * @param {Object} rules - Simple rule definitions
   * @returns {ValidationCriteria[]} Validation criteria
   * 
   * @example
   * const criteria = ValidationLayer.createCriteria({
   *   hasId: { type: 'schema', required: ['id'] },
   *   notEmpty: { type: 'regex', pattern: /.+/ }
   * });
   */
  static createCriteria(rules) {
    return Object.entries(rules).map(([name, rule]) => ({
      type: rule.type || 'function',
      spec: rule.spec || rule.pattern || rule.schema || rule.fn,
      message: rule.message || `Validation "${name}" failed`,
      required: rule.required !== false
    }));
  }
}

export { STRICTNESS };
export default ValidationLayer;

