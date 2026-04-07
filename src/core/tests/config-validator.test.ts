// Copyright (c) 2026 Ultra-Dex
// Tests — Config Validator

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { ConfigValidator } from '../system/config-validator.js';

describe('ConfigValidator', () => {
    let validator;

    beforeEach(() => {
        validator = new ConfigValidator();
    });

    it('should validate correct streaming config', () => {
        const result = validator.validate('streaming', { maxBufferSize: 500, batchSize: 50 });
        assert.equal(result.valid, true);
        assert.equal(result.config.maxBufferSize, 500);
    });

    it('should apply defaults for missing fields', () => {
        const result = validator.validate('streaming', {});
        assert.equal(result.valid, true);
        assert.equal(result.config.maxBufferSize, 1000);
        assert.equal(result.config.batchSize, 100);
    });

    it('should reject invalid number type', () => {
        const result = validator.validate('streaming', { maxBufferSize: 'not-a-number' });
        assert.equal(result.valid, false);
        assert.ok(result.errors[0].includes('must be a number'));
    });

    it('should reject out-of-range values', () => {
        const result = validator.validate('streaming', { maxBufferSize: 999999 });
        assert.equal(result.valid, false);
        assert.ok(result.errors[0].includes('must be <='));
    });

    it('should validate enum fields', () => {
        const result = validator.validate('rateLimiting', { strategy: 'invalid' });
        assert.equal(result.valid, false);
        assert.ok(result.errors[0].includes('must be one of'));
    });

    it('should accept valid enum values', () => {
        const result = validator.validate('rateLimiting', { strategy: 'token-bucket' });
        assert.equal(result.valid, true);
    });

    it('should validate server config with required fields', () => {
        const result = validator.validate('server', {});
        assert.equal(result.valid, false);
        assert.ok(result.errors[0].includes('Missing required'));
    });

    it('should pass server config with required fields', () => {
        const result = validator.validate('server', { port: 8080 });
        assert.equal(result.valid, true);
        assert.equal(result.config.host, '0.0.0.0');
    });

    it('should warn about unknown fields', () => {
        const result = validator.validate('streaming', { unknownField: 'x' });
        assert.ok(result.warnings.length > 0);
        assert.ok(result.warnings[0].includes('Unknown field'));
    });

    it('should reject unknown schema', () => {
        const result = validator.validate('nonexistent', {});
        assert.equal(result.valid, false);
    });

    it('should validate all sections at once', () => {
        const result = validator.validateAll({
            streaming: { batchSize: 50 },
            rateLimiting: { strategy: 'sliding-window' },
        });
        assert.equal(result.valid, true);
    });

    it('should catch errors across multiple sections', () => {
        const result = validator.validateAll({
            streaming: { maxBufferSize: -1 },
            server: {},
        });
        assert.equal(result.valid, false);
        assert.ok(result.errors.length >= 2);
    });

    it('should allow registering custom schemas', () => {
        validator.registerSchema('custom', {
            required: ['name'],
            optional: { retries: { type: 'number', min: 0, max: 10, default: 3 } },
        });
        const result = validator.validate('custom', { name: 'test' });
        assert.equal(result.valid, true);
        assert.equal(result.config.retries, 3);
    });

    it('should list all schemas', () => {
        const schemas = validator.listSchemas();
        assert.ok(schemas.includes('streaming'));
        assert.ok(schemas.includes('server'));
        assert.ok(schemas.includes('circuitBreaker'));
    });

    it('should validate boolean fields', () => {
        const result = validator.validate('server', { port: 3000, cors: 'yes' });
        assert.equal(result.valid, false);
        assert.ok(result.errors[0].includes('must be a boolean'));
    });

    it('should validate providerFallback config', () => {
        const result = validator.validate('providerFallback', { strategy: 'cost-optimized' });
        assert.equal(result.valid, true);
    });

    it('should validate queue config', () => {
        const result = validator.validate('queue', { concurrency: 10 });
        assert.equal(result.valid, true);
        assert.equal(result.config.maxQueueSize, 10000); // default
    });
});
