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
const SCHEMAS = {
  streaming: {
    required: [],
    optional: {
      maxBufferSize: { type: "number", min: 1, max: 1e5, default: 1e3 },
      batchSize: { type: "number", min: 1, max: 1e4, default: 100 },
      flushIntervalMs: { type: "number", min: 100, max: 6e4, default: 5e3 },
      backpressureLimit: { type: "number", min: 10, max: 1e6, default: 1e4 }
    }
  },
  webhooks: {
    required: [],
    optional: {
      maxRetries: { type: "number", min: 0, max: 10, default: 3 },
      retryDelayMs: { type: "number", min: 100, max: 6e4, default: 1e3 },
      timeoutMs: { type: "number", min: 1e3, max: 3e4, default: 1e4 }
    }
  },
  rateLimiting: {
    required: [],
    optional: {
      defaultLimit: { type: "number", min: 1, max: 1e5, default: 100 },
      windowMs: { type: "number", min: 1e3, max: 36e5, default: 6e4 },
      strategy: { type: "enum", values: ["sliding-window", "token-bucket"], default: "sliding-window" }
    }
  },
  circuitBreaker: {
    required: [],
    optional: {
      failureThreshold: { type: "number", min: 1, max: 50, default: 5 },
      resetTimeoutMs: { type: "number", min: 1e3, max: 3e5, default: 3e4 },
      timeoutMs: { type: "number", min: 1e3, max: 6e4, default: 1e4 }
    }
  },
  providerFallback: {
    required: [],
    optional: {
      strategy: { type: "enum", values: ["priority", "round-robin", "cost-optimized", "latency-optimized"], default: "priority" },
      maxRetries: { type: "number", min: 0, max: 10, default: 2 }
    }
  },
  queue: {
    required: [],
    optional: {
      concurrency: { type: "number", min: 1, max: 100, default: 5 },
      maxQueueSize: { type: "number", min: 10, max: 1e6, default: 1e4 },
      retryDelayMs: { type: "number", min: 100, max: 6e4, default: 5e3 }
    }
  },
  health: {
    required: [],
    optional: {
      intervalMs: { type: "number", min: 5e3, max: 3e5, default: 3e4 },
      timeoutMs: { type: "number", min: 1e3, max: 3e4, default: 5e3 }
    }
  },
  server: {
    required: ["port"],
    optional: {
      port: { type: "number", min: 1, max: 65535, default: 3e3 },
      host: { type: "string", default: "0.0.0.0" },
      cors: { type: "boolean", default: true }
    }
  }
};
let ConfigValidator = class extends EventEmitter {
  constructor() {
    super();
    this.schemas = new Map(Object.entries(SCHEMAS));
  }
  /**
   * Register a custom schema
   */
  registerSchema(name, schema) {
    this.schemas.set(name, schema);
  }
  /**
   * Validate a config against a schema
   */
  validate(schemaName, config = {}) {
    const schema = this.schemas.get(schemaName);
    if (!schema) {
      return { valid: false, errors: [`Unknown schema: "${schemaName}"`], config };
    }
    const errors = [];
    const warnings = [];
    const result = { ...config };
    for (const field of schema.required || []) {
      if (!(field in config)) {
        errors.push(`Missing required field: "${field}"`);
      }
    }
    for (const [field, spec] of Object.entries(schema.optional || {})) {
      if (!(field in result)) {
        result[field] = spec.default;
        continue;
      }
      const value = result[field];
      if (spec.type === "number") {
        if (typeof value !== "number" || isNaN(value)) {
          errors.push(`"${field}" must be a number, got ${typeof value}`);
          continue;
        }
        if (spec.min !== void 0 && value < spec.min) {
          errors.push(`"${field}" must be >= ${spec.min}, got ${value}`);
        }
        if (spec.max !== void 0 && value > spec.max) {
          errors.push(`"${field}" must be <= ${spec.max}, got ${value}`);
        }
      } else if (spec.type === "string") {
        if (typeof value !== "string") {
          errors.push(`"${field}" must be a string, got ${typeof value}`);
        }
      } else if (spec.type === "boolean") {
        if (typeof value !== "boolean") {
          errors.push(`"${field}" must be a boolean, got ${typeof value}`);
        }
      } else if (spec.type === "enum") {
        if (!spec.values.includes(value)) {
          errors.push(`"${field}" must be one of [${spec.values.join(", ")}], got "${value}"`);
        }
      }
    }
    const knownFields = /* @__PURE__ */ new Set([
      ...schema.required || [],
      ...Object.keys(schema.optional || {})
    ]);
    for (const field of Object.keys(config)) {
      if (!knownFields.has(field)) {
        warnings.push(`Unknown field: "${field}"`);
      }
    }
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      config: result
    };
  }
  /**
   * Validate full Ultra-Dex config
   */
  validateAll(config = {}) {
    const results = {};
    const allErrors = [];
    for (const [name] of this.schemas) {
      if (config[name]) {
        results[name] = this.validate(name, config[name]);
        if (!results[name].valid) {
          allErrors.push(...results[name].errors.map((e) => `[${name}] ${e}`));
        }
      }
    }
    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      sections: results
    };
  }
  /**
   * List available schemas
   */
  listSchemas() {
    return [...this.schemas.keys()];
  }
};
ConfigValidator = __decorateClass([
  singleton()
], ConfigValidator);
var config_validator_default = ConfigValidator;
export {
  ConfigValidator,
  config_validator_default as default
};
