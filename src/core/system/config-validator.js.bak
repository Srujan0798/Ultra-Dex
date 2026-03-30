// Copyright (c) 2026 Ultra-Dex
// Configuration Validator — centralized config validation for all Ultra-Dex modules

import { EventEmitter } from 'events';

/**
 * Schema definitions for Ultra-Dex configuration
 */
const SCHEMAS = {
    streaming: {
        required: [],
        optional: {
            maxBufferSize: { type: 'number', min: 1, max: 100000, default: 1000 },
            batchSize: { type: 'number', min: 1, max: 10000, default: 100 },
            flushIntervalMs: { type: 'number', min: 100, max: 60000, default: 5000 },
            backpressureLimit: { type: 'number', min: 10, max: 1000000, default: 10000 },
        },
    },
    webhooks: {
        required: [],
        optional: {
            maxRetries: { type: 'number', min: 0, max: 10, default: 3 },
            retryDelayMs: { type: 'number', min: 100, max: 60000, default: 1000 },
            timeoutMs: { type: 'number', min: 1000, max: 30000, default: 10000 },
        },
    },
    rateLimiting: {
        required: [],
        optional: {
            defaultLimit: { type: 'number', min: 1, max: 100000, default: 100 },
            windowMs: { type: 'number', min: 1000, max: 3600000, default: 60000 },
            strategy: { type: 'enum', values: ['sliding-window', 'token-bucket'], default: 'sliding-window' },
        },
    },
    circuitBreaker: {
        required: [],
        optional: {
            failureThreshold: { type: 'number', min: 1, max: 50, default: 5 },
            resetTimeoutMs: { type: 'number', min: 1000, max: 300000, default: 30000 },
            timeoutMs: { type: 'number', min: 1000, max: 60000, default: 10000 },
        },
    },
    providerFallback: {
        required: [],
        optional: {
            strategy: { type: 'enum', values: ['priority', 'round-robin', 'cost-optimized', 'latency-optimized'], default: 'priority' },
            maxRetries: { type: 'number', min: 0, max: 10, default: 2 },
        },
    },
    queue: {
        required: [],
        optional: {
            concurrency: { type: 'number', min: 1, max: 100, default: 5 },
            maxQueueSize: { type: 'number', min: 10, max: 1000000, default: 10000 },
            retryDelayMs: { type: 'number', min: 100, max: 60000, default: 5000 },
        },
    },
    health: {
        required: [],
        optional: {
            intervalMs: { type: 'number', min: 5000, max: 300000, default: 30000 },
            timeoutMs: { type: 'number', min: 1000, max: 30000, default: 5000 },
        },
    },
    server: {
        required: ['port'],
        optional: {
            port: { type: 'number', min: 1, max: 65535, default: 3000 },
            host: { type: 'string', default: '0.0.0.0' },
            cors: { type: 'boolean', default: true },
        },
    },
};

/**
 * ConfigValidator — validates and applies defaults to configuration objects
 */
export class ConfigValidator extends EventEmitter {
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

        // Check required fields
        for (const field of schema.required || []) {
            if (!(field in config)) {
                errors.push(`Missing required field: "${field}"`);
            }
        }

        // Validate and apply defaults for optional fields
        for (const [field, spec] of Object.entries(schema.optional || {})) {
            if (!(field in result)) {
                result[field] = spec.default;
                continue;
            }

            const value = result[field];

            // Type check
            if (spec.type === 'number') {
                if (typeof value !== 'number' || isNaN(value)) {
                    errors.push(`"${field}" must be a number, got ${typeof value}`);
                    continue;
                }
                if (spec.min !== undefined && value < spec.min) {
                    errors.push(`"${field}" must be >= ${spec.min}, got ${value}`);
                }
                if (spec.max !== undefined && value > spec.max) {
                    errors.push(`"${field}" must be <= ${spec.max}, got ${value}`);
                }
            } else if (spec.type === 'string') {
                if (typeof value !== 'string') {
                    errors.push(`"${field}" must be a string, got ${typeof value}`);
                }
            } else if (spec.type === 'boolean') {
                if (typeof value !== 'boolean') {
                    errors.push(`"${field}" must be a boolean, got ${typeof value}`);
                }
            } else if (spec.type === 'enum') {
                if (!spec.values.includes(value)) {
                    errors.push(`"${field}" must be one of [${spec.values.join(', ')}], got "${value}"`);
                }
            }
        }

        // Warn about unknown fields
        const knownFields = new Set([
            ...(schema.required || []),
            ...Object.keys(schema.optional || {}),
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
            config: result,
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
                    allErrors.push(...results[name].errors.map(e => `[${name}] ${e}`));
                }
            }
        }

        return {
            valid: allErrors.length === 0,
            errors: allErrors,
            sections: results,
        };
    }

    /**
     * List available schemas
     */
    listSchemas() {
        return [...this.schemas.keys()];
    }
}

export default ConfigValidator;
