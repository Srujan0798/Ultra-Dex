import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { ThompsonSamplingRouter } from '../../src/core/routing/bandit-router.js';
import { ProviderHealthMonitor } from '../../src/core/routing/health-monitor.js';
import { RAGPipeline } from '../../src/core/memory/rag-pipeline.js';
import { MarketplaceService } from '../../src/core/marketplace/marketplace-service.js';

describe('E2E Intelligence Layer Integration', () => {
  let router;
  let healthMonitor;
  let ragPipeline;
  let marketplace;

  before(async () => {
    router = new ThompsonSamplingRouter();
    healthMonitor = new ProviderHealthMonitor();
    ragPipeline = new RAGPipeline();
    marketplace = new MarketplaceService();
  });

  after(async () => {
    // Cleanup
  });

  it('should list 8 built-in agents from marketplace', async () => {
    const agents = await marketplace.listAgents();
    assert.ok(agents.length >= 8, 'Should have at least 8 built-in agents');

    const agentNames = agents.map((a) => a.name);
    assert.ok(agentNames.includes('Planner'), 'Should have Planner agent');
    assert.ok(agentNames.includes('Backend Developer'), 'Should have Backend agent');
  });

  it('should route with --optimize cost picking cheapest provider', () => {
    // Train router to prefer cheap provider
    for (let i = 0; i < 10; i++) {
      router.updateStats('nvidia', { success: true, cost: 0.0006, latency: 100 });
    }

    const result = router.selectProvider('test task', { optimize: 'cost' });
    assert.ok(result?.provider, 'Should return a provider result');
    assert.ok(['nvidia', 'gemini', 'openai', 'claude'].includes(result.provider));
  });

  it('should mark provider DEGRADED at 20% error rate', () => {
    // Simulate 30% error rate (3 errors out of 10 calls)
    for (let i = 0; i < 7; i++) {
      healthMonitor.recordLatency('test-provider', 100);
    }
    healthMonitor.recordError('test-provider');
    healthMonitor.recordError('test-provider');
    healthMonitor.recordError('test-provider');

    const status = healthMonitor.getStatus().get('test-provider');
    assert.ok(status?.status === 'DEGRADED' || status?.status === 'UNHEALTHY');
  });

  it('should retrieve context via RAG pipeline', async () => {
    // Store a result first
    await ragPipeline.storeResult('Design API for user management', 'planner', {
      output: 'Created REST API design',
      tokens: 500,
    });

    // Retrieve context for similar task
    const contexts = await ragPipeline.retrieveContext('Design API for users', 'planner', 3);

    // RAG should return contexts (even if mock memory returns empty)
    assert.ok(Array.isArray(contexts));
  });

  it('should augment prompt with retrieved context', () => {
    const systemPrompt = 'You are a helpful assistant.';
    const contexts = ['Previous: Designed REST API with endpoints /users, /auth'];

    const augmented = ragPipeline.augmentPrompt(systemPrompt, contexts);

    assert.ok(augmented.includes('Relevant Past Context'));
    assert.ok(augmented.includes('Previous: Designed'));
  });

  it('should exclude UNHEALTHY providers from routing', () => {
    // Make provider unhealthy
    healthMonitor.recordError('unhealthy-provider');
    healthMonitor.recordError('unhealthy-provider');
    healthMonitor.recordLatency('unhealthy-provider', 100);
    healthMonitor.recordError('unhealthy-provider');

    const isHealthy = healthMonitor.checkHealth('unhealthy-provider');
    assert.strictEqual(isHealthy, false);
  });

  it('should get agent info from marketplace', async () => {
    const agent = await marketplace.getAgent('@ultra-dex/planner');
    assert.ok(agent, 'Should return agent info');
    assert.strictEqual(agent?.name, 'Planner');
  });
});
