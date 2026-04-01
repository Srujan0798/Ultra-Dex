/**
 * Validation Layer
 * Output validation with configurable gates and criteria
 * @module autonomous/validation-layer
 */

import { AUTONOMOUS_GATES } from './gates.js';

/**
 * Validation Layer for task output verification
 */
export class ValidationLayer {
  /**
   * @param {object} options - Validation options
   * @param {string} options.strictness - Strictness level: 'strict', 'normal', 'permissive'
   * @param {object} options.customValidators - Custom validation functions
   */
  constructor(options = {}) {
    this.strictness = options.strictness || 'normal';
    this.customValidators = options.customValidators || {};
    this.validationHistory = [];
  }

  /**
   * Validate task result
   * @param {object} result - Task execution result
   * @param {object} criteria - Validation criteria
   * @returns {object} Validation result
   */
  validate(result, criteria = {}) {
    const errors = [];
    const warnings = [];
    const gatesPassed = [];
    const gatesFailed = [];

    // Run built-in validations
    if (criteria.schema) {
      const schemaResult = this.validateSchema(result, criteria.schema);
      if (!schemaResult.valid) errors.push(...schemaResult.errors);
    }

    if (criteria.regex) {
      const regexResult = this.validateRegex(result, criteria.regex);
      if (!regexResult.valid) errors.push(...regexResult.errors);
    }

    if (criteria.function) {
      const funcResult = this.validateFunction(result, criteria.function);
      if (!funcResult.valid) errors.push(...funcResult.errors);
    }

    if (criteria.gates) {
      for (const gateName of criteria.gates) {
        const gateResult = this.checkGate(gateName, result);
        if (gateResult.passed) {
          gatesPassed.push(gateName);
        } else {
          gatesFailed.push(gateName);
          if (gateResult.blocking) {
            errors.push(`Gate '${gateName}' failed: ${gateResult.reason}`);
          } else {
            warnings.push(`Gate '${gateName}' warning: ${gateResult.reason}`);
          }
        }
      }
    }

    // Custom validators
    for (const [name, validator] of Object.entries(this.customValidators)) {
      if (criteria[name]) {
        try {
          const customResult = validator(result, criteria[name]);
          if (!customResult.valid) {
            errors.push(...(customResult.errors || []));
          }
        } catch (error) {
          warnings.push(`Custom validator '${name}' threw: ${error.message}`);
        }
      }
    }

    // Apply strictness
    const adjustedResult = this.applyStrictness(errors, warnings);

    const validation = {
      valid: adjustedResult.errors.length === 0,
      errors: adjustedResult.errors,
      warnings: adjustedResult.warnings,
      gatesPassed,
      gatesFailed,
      timestamp: new Date().toISOString()
    };

    this.validationHistory.push(validation);
    return validation;
  }

  /**
   * Validate against JSON schema
   * @param {object} result - Result to validate
   * @param {object} schema - JSON schema
   * @returns {object} Validation result
   */
  validateSchema(result, schema) {
    const errors = [];

    // Simple schema validation (production would use ajv or similar)
    if (schema.type) {
      const actualType = Array.isArray(result) ? 'array' : typeof result;
      if (actualType !== schema.type) {
        errors.push(`Expected type '${schema.type}', got '${actualType}'`);
      }
    }

    if (schema.required && typeof result === 'object' && result !== null) {
      for (const field of schema.required) {
        if (!(field in result)) {
          errors.push(`Missing required field: '${field}'`);
        }
      }
    }

    if (schema.properties && typeof result === 'object' && result !== null) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in result && propSchema.type) {
          const actualType = typeof result[key];
          if (actualType !== propSchema.type) {
            errors.push(`Field '${key}': expected '${propSchema.type}', got '${actualType}'`);
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate against regex patterns
   * @param {any} result - Result to validate
   * @param {object} patterns - Regex patterns
   * @returns {object} Validation result
   */
  validateRegex(result, patterns) {
    const errors = [];
    const str = typeof result === 'string' ? result : JSON.stringify(result);

    if (patterns.match) {
      const matchPatterns = Array.isArray(patterns.match) ? patterns.match : [patterns.match];
      for (const pattern of matchPatterns) {
        const regex = new RegExp(pattern);
        if (!regex.test(str)) {
          errors.push(`Result does not match pattern: ${pattern}`);
        }
      }
    }

    if (patterns.notMatch) {
      const notMatchPatterns = Array.isArray(patterns.notMatch) ? patterns.notMatch : [patterns.notMatch];
      for (const pattern of notMatchPatterns) {
        const regex = new RegExp(pattern);
        if (regex.test(str)) {
          errors.push(`Result matches forbidden pattern: ${pattern}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate with custom function
   * @param {any} result - Result to validate
   * @param {Function} fn - Validation function
   * @returns {object} Validation result
   */
  validateFunction(result, fn) {
    const errors = [];

    try {
      const isValid = fn(result);
      if (isValid === false) {
        errors.push('Custom validation function returned false');
      } else if (typeof isValid === 'object' && !isValid.valid) {
        errors.push(...(isValid.errors || ['Custom validation failed']));
      }
    } catch (error) {
      errors.push(`Validation function threw: ${error.message}`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Check a named gate
   * @param {string} gateName - Gate name from AUTONOMOUS_GATES
   * @param {any} result - Result to check
   * @returns {object} Gate check result
   */
  checkGate(gateName, result) {
    const gate = AUTONOMOUS_GATES[gateName];
    
    if (!gate) {
      return {
        passed: true,
        reason: `Unknown gate '${gateName}', skipping`,
        blocking: false
      };
    }

    try {
      const passed = typeof gate.check === 'function' 
        ? gate.check(result)
        : true;

      return {
        passed,
        reason: passed ? 'Gate passed' : (gate.failReason || 'Gate check failed'),
        blocking: gate.blocking !== false
      };
    } catch (error) {
      return {
        passed: false,
        reason: `Gate error: ${error.message}`,
        blocking: gate.blocking !== false
      };
    }
  }

  /**
   * Apply strictness level to errors/warnings
   * @param {Array} errors - Error list
   * @param {Array} warnings - Warning list
   * @returns {object} Adjusted lists
   */
  applyStrictness(errors, warnings) {
    switch (this.strictness) {
      case 'strict':
        // Promote all warnings to errors
        return {
          errors: [...errors, ...warnings],
          warnings: []
        };
      case 'permissive':
        // Demote non-critical errors to warnings
        return {
          errors: errors.filter(e => e.includes('required') || e.includes('Gate')),
          warnings: [...warnings, ...errors.filter(e => !e.includes('required') && !e.includes('Gate'))]
        };
      case 'normal':
      default:
        return { errors, warnings };
    }
  }

  /**
   * Add custom validator
   * @param {string} name - Validator name
   * @param {Function} fn - Validator function
   */
  addValidator(name, fn) {
    this.customValidators[name] = fn;
  }

  /**
   * Get validation history
   * @returns {Array}
   */
  getHistory() {
    return [...this.validationHistory];
  }

  /**
   * Clear validation history
   */
  clearHistory() {
    this.validationHistory = [];
  }

  /**
   * Get validation summary
   * @returns {object}
   */
  getSummary() {
    const total = this.validationHistory.length;
    const passed = this.validationHistory.filter(v => v.valid).length;
    
    return {
      total,
      passed,
      failed: total - passed,
      passRate: total > 0 ? (passed / total * 100).toFixed(1) + '%' : 'N/A'
    };
  }
}

export default ValidationLayer;
