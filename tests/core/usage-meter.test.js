import "reflect-metadata";
// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Tests for usage metering system
 * @module tests/core/usage-meter
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { UsageMeter } from '../../src/core/billing/usage-meter.js';
import { PRICING_TIERS } from '../../src/core/billing/pricing-tiers.js';

describe('UsageMeter', () => {
  let meter;

  beforeEach(() => {
    meter = new UsageMeter();
  });

  afterEach(() => {
    meter.destroy();
  });

  it('should allow requests within free tier limits', () => {
    const userId = 'user-free-1';
    const freePlan = 'free';
    
    // Free tier: 100 req/day
    const result = meter.checkLimit(userId, freePlan);
    
    assert.equal(result.allowed, true);
    assert.ok(result.remaining.requests >= 0);
    assert.ok(result.resetAt instanceof Date);
  });

  it('should deny 101st request for free user (daily limit)', () => {
    const userId = 'user-free-exceed';
    const freePlan = 'free';
    
    // Free tier: 100 req/day, 101st should exceed
    meter.increment(userId, { requests: 101 });
    
    const result = meter.checkLimit(userId, freePlan);
    
    assert.equal(result.allowed, false);
    assert.equal(result.remaining.requests, 0);
    assert.equal(result.reason, 'Daily request limit exceeded');
  });

  it('should allow pro user 10,000 requests per day', () => {
    const userId = 'user-pro-1';
    const proPlan = 'pro';
    
    // Pro tier: 10,000 req/day. Before processing the 10,000th request,
    // the user has consumed 9,999 requests and should still be allowed.
    meter.increment(userId, { requests: 9999 });
    
    const result = meter.checkLimit(userId, proPlan);
    
    assert.equal(result.allowed, true);
    assert.equal(result.remaining.requests, 1);
  });

  it('should allow unlimited requests for enterprise users', () => {
    const userId = 'user-enterprise-1';
    const enterprisePlan = 'enterprise';
    
    // Enterprise tier: unlimited
    meter.increment(userId, { requests: 100000 });
    
    const result = meter.checkLimit(userId, enterprisePlan);
    
    assert.equal(result.allowed, true);
    assert.equal(result.remaining.requests, -1); // -1 indicates unlimited
    assert.equal(result.remaining.tokens, -1);
  });

  it('should track token usage separately', () => {
    const userId = 'user-tokens-1';
    const freePlan = 'free';
    
    // Free tier: 10,000 tokens/day
    meter.increment(userId, { tokens: 10001 });
    
    const result = meter.checkLimit(userId, freePlan);
    
    assert.equal(result.allowed, false);
    assert.equal(result.remaining.tokens, 0);
    assert.equal(result.reason, 'Daily token limit exceeded');
  });

  it('should reset usage at midnight UTC', async () => {
    const userId = 'user-reset-1';
    const freePlan = 'free';
    
    // Use some of the daily limit
    meter.increment(userId, { requests: 10 });
    
    const beforeReset = meter.checkLimit(userId, freePlan);
    assert.equal(beforeReset.allowed, true);
    
    // Reset the user
    meter.resetUser(userId);
    
    const afterReset = meter.checkLimit(userId, freePlan);
    assert.equal(afterReset.allowed, true);
    assert.ok(afterReset.remaining.requests >= 100);
  });

  it('should increment multiple usage types', () => {
    const userId = 'user-multi-1';
    
    meter.increment(userId, { 
      requests: 5, 
      tokens: 1000, 
      agentRuns: 2 
    });
    
    const usage = meter.getUsage(userId);
    
    assert.equal(usage.requestCount, 5);
    assert.equal(usage.tokenCount, 1000);
    assert.equal(usage.agentRunCount, 2);
  });

  it('should handle invalid plan gracefully', () => {
    const userId = 'user-invalid-1';
    const invalidPlan = 'nonexistent';
    
    const result = meter.checkLimit(userId, invalidPlan);
    
    assert.equal(result.allowed, false);
    assert.equal(result.reason, 'Invalid plan');
  });

  it('should track remaining requests correctly', () => {
    const userId = 'user-remaining-1';
    const freePlan = 'free';
    
    // Free tier: 100 req/day
    meter.increment(userId, { requests: 2 });
    
    const result = meter.checkLimit(userId, freePlan);
    
    assert.equal(result.allowed, true);
    assert.equal(result.remaining.requests, 98); // 100 - 2 = 98
  });

  it('should return usage statistics', () => {
    const userId = 'user-stats-1';
    
    meter.increment(userId, { requests: 10, tokens: 5000 });
    
    const usage = meter.getUsage(userId);
    
    assert.equal(usage.requestCount, 10);
    assert.equal(usage.tokenCount, 5000);
    assert.ok(usage.resetAt instanceof Date);
  });

  it('should handle concurrent increments correctly', () => {
    const userId = 'user-concurrent-1';
    
    // Simulate concurrent requests
    meter.increment(userId, { requests: 1 });
    meter.increment(userId, { requests: 1 });
    meter.increment(userId, { requests: 1 });
    
    const usage = meter.getUsage(userId);
    assert.equal(usage.requestCount, 3);
  });

  it('should enforce both request and token limits', () => {
    const userId = 'user-double-limit-1';
    const freePlan = 'free';
    
    // Free tier: 100 req/day, 10K tokens/day
    meter.increment(userId, { requests: 2, tokens: 200 });
    
    const result1 = meter.checkLimit(userId, freePlan);
    assert.equal(result1.allowed, true);
    
    // Exceed token limit
    meter.increment(userId, { tokens: 10000 });
    
    const result2 = meter.checkLimit(userId, freePlan);
    assert.equal(result2.allowed, false);
    assert.equal(result2.reason, 'Daily token limit exceeded');
  });

  it('should calculate next reset time correctly', () => {
    const userId = 'user-reset-time-1';
    
    const result = meter.checkLimit(userId, 'free');
    const now = new Date();
    const resetAt = result.resetAt;
    
    // Reset should be tomorrow at midnight UTC
    assert.ok(resetAt > now);
    assert.equal(resetAt.getUTCHours(), 0);
    assert.equal(resetAt.getUTCMinutes(), 0);
    assert.equal(resetAt.getUTCSeconds(), 0);
  });

  it('should handle pro tier limits correctly', () => {
    const userId = 'user-pro-limits-1';
    const proPlan = 'pro';
    
    // Pro tier: 10,000 req/day, 1M tokens/day
    meter.increment(userId, { requests: 300, tokens: 30000 });
    
    const result = meter.checkLimit(userId, proPlan);
    
    assert.equal(result.allowed, true);
    assert.ok(result.remaining.requests >= 9700);
    assert.ok(result.remaining.tokens >= 970000);
  });

  it('should deny requests when pro tier request limit exceeded', () => {
    const userId = 'user-pro-exceed-1';
    const proPlan = 'pro';
    
    // Exceed daily request limit (10,000 req/day for pro)
    meter.increment(userId, { requests: 10001 });
    
    const result = meter.checkLimit(userId, proPlan);
    
    assert.equal(result.allowed, false);
    assert.equal(result.remaining.requests, 0);
  });

  it('should deny requests when pro tier token limit exceeded', () => {
    const userId = 'user-pro-token-exceed-1';
    const proPlan = 'pro';
    
    // Exceed daily token limit (1,000,000 tokens/day for pro)
    meter.increment(userId, { tokens: 1000001 });
    
    const result = meter.checkLimit(userId, proPlan);
    
    assert.equal(result.allowed, false);
    assert.equal(result.remaining.tokens, 0);
    assert.equal(result.reason, 'Daily token limit exceeded');
  });
});
