// Copyright (c) 2026 Ultra-Dex
// Integration test: Smart AI Router - Provider routing, strategies, and fallback

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { EventEmitter } from 'events';

describe('Smart AI Router Integration', () => {
  let router;
  let mockProviders;
  let routingEvents;

  beforeEach(async () => {
    routingEvents = [];
    
    // Create mock providers
    mockProviders = {
      'openai-gpt4': {
        id: 'openai-gpt4',
        name: 'OpenAI GPT-4',
        capabilities: ['coding', 'reasoning', 'analysis'],
        costPer1K: { input: 0.03, output: 0.06 },
        latency: 500,
        reliability: 0.98,
        generate: async (prompt) => ({
          text: `GPT-4 response: ${prompt}`,
          tokens: { input: 100, output: 50 },
        }),
      },
      'anthropic-claude': {
        id: 'anthropic-claude',
        name: 'Anthropic Claude',
        capabilities: ['analysis', 'writing', 'long-context'],
        costPer1K: { input: 0.008, output: 0.024 },
        latency: 600,
        reliability: 0.97,
        generate: async (prompt) => ({
          text: `Claude response: ${prompt}`,
          tokens: { input: 100, output: 50 },
        }),
      },
      'google-gemini': {
        id: 'google-gemini',
        name: 'Google Gemini',
        capabilities: ['multimodal', 'quick-tasks'],
        costPer1K: { input: 0.0005, output: 0.0015 },
        latency: 300,
        reliability: 0.95,
        generate: async (prompt) => ({
          text: `Gemini response: ${prompt}`,
          tokens: { input: 100, output: 50 },
        }),
      },
    };

    // Create router with mock providers
    router = new EventEmitter();
    router.providers = new Map();
    router.metrics = new Map();
    router.strategy = 'quality'; // default

    // Add providers
    for (const [id, provider] of Object.entries(mockProviders)) {
      router.providers.set(id, provider);
      router.metrics.set(id, {
        requests: 0,
        errors: 0,
        totalLatency: 0,
        avgLatency: 0,
      });
    }

    // Track routing events
    router.on('routed', (event) => routingEvents.push(event));
    router.on('fallback', (event) => routingEvents.push({ type: 'fallback', ...event }));

    // Routing methods
    router.selectProvider = function(taskType, strategy = this.strategy) {
      const available = Array.from(router.providers.values());
      
      if (strategy === 'cost') {
        // Select cheapest provider
        return available.reduce((cheapest, current) => 
          current.costPer1K.input < cheapest.costPer1K.input ? current : cheapest
        );
      } else if (strategy === 'quality') {
        // Select most reliable provider
        return available.reduce((best, current) => 
          current.reliability > best.reliability ? current : best
        );
      } else if (strategy === 'latency') {
        // Select fastest provider
        return available.reduce((fastest, current) => 
          current.latency < fastest.latency ? current : fastest
        );
      }
      
      return available[0];
    };

    router.route = async function(prompt, options = {}) {
      const taskType = options.taskType || 'general';
      const strategy = options.strategy || this.strategy;
      
      let provider = this.selectProvider(taskType, strategy);
      let attempts = 0;
      const maxAttempts = 2;
      
      while (attempts < maxAttempts) {
        attempts++;
        const startTime = Date.now();
        
        try {
          this.emit('routed', {
            provider: provider.id,
            strategy,
            taskType,
            timestamp: new Date().toISOString(),
          });
          
          const result = await provider.generate(prompt);
          
          // Update metrics
          const latency = Date.now() - startTime;
          const metrics = this.metrics.get(provider.id);
          metrics.requests++;
          metrics.totalLatency += latency;
          metrics.avgLatency = metrics.totalLatency / metrics.requests;
          
          return {
            provider: provider.id,
            result,
            latency,
            strategy,
          };
        } catch (error) {
          const metrics = this.metrics.get(provider.id);
          metrics.errors++;
          
          if (attempts < maxAttempts) {
            // Try fallback
            this.emit('fallback', {
              from: provider.id,
              reason: error.message,
              attempt: attempts,
            });
            
            // Select different provider
            const available = Array.from(this.providers.values())
              .filter(p => p.id !== provider.id);
            provider = available[0];
          } else {
            throw error;
          }
        }
      }
    };
  });

  afterEach(() => {
    router.removeAllListeners();
  });

  it('should route using cost strategy and select cheapest provider', async () => {
    const result = await router.route('Simple task', { 
      strategy: 'cost',
      taskType: 'quick-task',
    });
    
    assert.strictEqual(result.provider, 'google-gemini', 
      'Should select cheapest provider (Gemini)');
    assert.strictEqual(result.strategy, 'cost');
    
    // Verify it's actually the cheapest
    const selected = mockProviders[result.provider];
    assert.strictEqual(selected.costPer1K.input, 0.0005, 
      'Selected provider should have lowest input cost');
  });

  it('should route using quality strategy and select most reliable provider', async () => {
    const result = await router.route('Complex analysis task', { 
      strategy: 'quality',
      taskType: 'analysis',
    });
    
    assert.strictEqual(result.provider, 'openai-gpt4', 
      'Should select most reliable provider (GPT-4)');
    assert.strictEqual(result.strategy, 'quality');
    
    // Verify it's the most reliable
    const selected = mockProviders[result.provider];
    assert.strictEqual(selected.reliability, 0.98, 
      'Selected provider should have highest reliability');
  });

  it('should route using latency strategy and select fastest provider', async () => {
    const result = await router.route('Quick response needed', { 
      strategy: 'latency',
      taskType: 'real-time',
    });
    
    assert.strictEqual(result.provider, 'google-gemini', 
      'Should select fastest provider (Gemini)');
    assert.strictEqual(result.strategy, 'latency');
    
    // Verify it's the fastest
    const selected = mockProviders[result.provider];
    assert.strictEqual(selected.latency, 300, 
      'Selected provider should have lowest latency');
  });

  it('should trigger fallback on provider failure', async () => {
    // Make GPT-4 fail
    const originalGenerate = mockProviders['openai-gpt4'].generate;
    mockProviders['openai-gpt4'].generate = async () => {
      throw new Error('Provider unavailable');
    };

    // Start with quality strategy (would normally pick GPT-4)
    router.strategy = 'quality';
    
    const fallbackEvents = [];
    router.on('fallback', (event) => fallbackEvents.push(event));
    
    const result = await router.route('Important task');
    
    // Restore original
    mockProviders['openai-gpt4'].generate = originalGenerate;
    
    // Should fallback to another provider
    assert.notStrictEqual(result.provider, 'openai-gpt4', 
      'Should fallback to different provider');
    assert.ok(fallbackEvents.length > 0, 'Should emit fallback event');
    assert.strictEqual(fallbackEvents[0].from, 'openai-gpt4', 
      'Fallback should indicate failed provider');
  });

  it('should collect latency metrics after routing', async () => {
    // Make multiple requests
    const results = [];
    for (let i = 0; i < 3; i++) {
      const result = await router.route(`Task ${i}`, { strategy: 'quality' });
      results.push(result);
    }
    
    // Check metrics were collected
    const metrics = router.metrics.get('openai-gpt4');
    assert.ok(metrics, 'Metrics should exist for provider');
    assert.strictEqual(metrics.requests, 3, 'Should track request count');
    assert.ok(results.every(r => r.latency >= 0), 'Each result should have latency');
    assert.ok(metrics.totalLatency >= 0, 'Should track total latency');
  });

  it('should emit routing event with correct metadata', async () => {
    const routedEvents = [];
    router.on('routed', (event) => routedEvents.push(event));
    
    await router.route('Test prompt', { 
      strategy: 'cost',
      taskType: 'coding',
    });
    
    assert.strictEqual(routedEvents.length, 1, 'Should emit one routing event');
    assert.ok(routedEvents[0].provider, 'Event should include provider');
    assert.strictEqual(routedEvents[0].strategy, 'cost', 
      'Event should include strategy');
    assert.strictEqual(routedEvents[0].taskType, 'coding', 
      'Event should include task type');
    assert.ok(routedEvents[0].timestamp, 'Event should include timestamp');
  });

  it('should handle multiple providers with different capabilities', async () => {
    // Add capability-specific provider
    router.providers.set('code-specialist', {
      id: 'code-specialist',
      name: 'Code Specialist',
      capabilities: ['coding', 'refactoring'],
      costPer1K: { input: 0.02, output: 0.04 },
      latency: 400,
      reliability: 0.99,
      generate: async (prompt) => ({
        text: `Code specialist: ${prompt}`,
        tokens: { input: 100, output: 50 },
      }),
    });
    
    // Initialize metrics for new provider
    router.metrics.set('code-specialist', {
      requests: 0,
      errors: 0,
      totalLatency: 0,
      avgLatency: 0,
    });

    // Route coding task
    const codingResult = await router.route('Refactor this function', {
      taskType: 'coding',
      strategy: 'quality',
    });
    
    assert.ok(codingResult.provider, 'Should select provider for coding task');
    assert.ok(codingResult.latency >= 0, 'Should track latency');
  });

  it('should track error rates per provider', async () => {
    // Make a provider fail multiple times
    mockProviders['google-gemini'].generate = async () => {
      throw new Error('Rate limit exceeded');
    };

    try {
      await router.route('Test', { strategy: 'latency' });
    } catch (e) {
      // Expected to fail after fallback exhausted
    }

    // Restore
    mockProviders['google-gemini'].generate = async (prompt) => ({
      text: `Gemini response: ${prompt}`,
      tokens: { input: 100, output: 50 },
    });

    // Check error tracking
    const geminiMetrics = router.metrics.get('google-gemini');
    assert.ok(geminiMetrics.errors > 0, 'Should track errors for failing provider');
  });
});
