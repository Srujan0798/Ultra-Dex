/**
 * Diamond State Integration Tests (JavaScript Wrapper)
 * Tests the compiled TypeScript Diamond State
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

// Import from the compiled TypeScript (will use .js extensions)
const {
  initializeDiamondState,
  AlertSeverity,
  MockEmbeddingModel,
  VirtualFileSystem,
  DI_TOKENS,
  container,
} = await import('../src/core/index.js');

describe('Diamond State Architecture', () => {
  let diamond;

  before(async () => {
    diamond = await initializeDiamondState({
      mesh: { enabled: false },
      streaming: { enabled: false },
      selfHealing: { enabled: true },
    });
  });

  after(async () => {
    await diamond.telemetry.shutdown();
  });

  describe('Pillar 1: Foundation (DI & Interfaces)', () => {
    it('should have all services registered in DI container', () => {
      assert.ok(container.resolve(DI_TOKENS.Logger), 'Logger should be registered');
      assert.ok(container.resolve(DI_TOKENS.ConfigService), 'ConfigService should be registered');
      assert.ok(container.resolve(DI_TOKENS.AlertManager), 'AlertManager should be registered');
      assert.ok(container.resolve(DI_TOKENS.TelemetryService), 'TelemetryService should be registered');
      assert.ok(container.resolve(DI_TOKENS.EmbeddingModel), 'EmbeddingModel should be registered');
    });

    it('should create child containers for sessions', () => {
      const sessionContainer = container.createChildContainer();
      sessionContainer.registerInstance(DI_TOKENS.SessionId, 'test-session-123');
      
      const sessionId = sessionContainer.resolve(DI_TOKENS.SessionId);
      assert.strictEqual(sessionId, 'test-session-123');
    });
  });

  describe('Pillar 2: Intelligence (Semantic Router)', () => {
    it('should route frontend tasks correctly', async () => {
      const decision = await diamond.semanticRouter.route('Create a React component with Tailwind');
      
      assert.strictEqual(decision.agentId, 'frontend-agent');
      assert.ok(decision.confidence > 0.8, `Confidence should be > 0.8, got ${decision.confidence}`);
      assert.ok(decision.alternatives.length > 0, 'Should have alternatives');
      assert.ok(decision.reasoning, 'Should have reasoning');
    });

    it('should route backend tasks correctly', async () => {
      const decision = await diamond.semanticRouter.route('Set up PostgreSQL with Prisma ORM');
      
      assert.strictEqual(decision.agentId, 'backend-agent');
      assert.ok(decision.confidence > 0.8, `Confidence should be > 0.8, got ${decision.confidence}`);
    });

    it('should route devops tasks correctly', async () => {
      const decision = await diamond.semanticRouter.route('Create Dockerfile for Node.js app');
      
      assert.strictEqual(decision.agentId, 'devops-agent');
      assert.ok(decision.confidence > 0.8, `Confidence should be > 0.8, got ${decision.confidence}`);
    });

    it('should batch route efficiently', async () => {
      const tasks = [
        'Create React component',
        'Set up database',
        'Create Dockerfile',
      ];

      const results = await diamond.semanticRouter.routeBatch(tasks);
      
      assert.strictEqual(results.length, 3);
      assert.strictEqual(results[0].agentId, 'frontend-agent');
      assert.strictEqual(results[1].agentId, 'backend-agent');
      assert.strictEqual(results[2].agentId, 'devops-agent');
    });
  });

  describe('Pillar 3: Safety (Sandboxing)', () => {
    it('should execute code in isolated VM', async () => {
      const code = `
        const x = 10;
        const y = 20;
        x + y;
      `;

      const result = await diamond.isolatedVMSandbox.execute(code, {
        timeout: 5000,
        memoryLimit: 128,
        allowedModules: [],
        logger: diamond.logger,
        filesystem: new VirtualFileSystem(),
        environment: {},
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.result, 30);
      assert.ok(result.executionTime < 1000, 'Should execute quickly');
    });

    it('should timeout long-running code', async () => {
      const code = `
        let i = 0;
        while (i < 1000000000) { i++; }
      `;

      const result = await diamond.isolatedVMSandbox.execute(code, {
        timeout: 100,
        memoryLimit: 128,
        allowedModules: [],
        logger: diamond.logger,
        filesystem: new VirtualFileSystem(),
        environment: {},
      });

      assert.strictEqual(result.success, false);
      assert.ok(result.error?.includes('timeout'), 'Should timeout');
    });
  });

  describe('Pillar 4: Autonomy (Self-Healing)', () => {
    it('should emit and handle alerts', async () => {
      let alertReceived = false;
      
      const unsubscribe = diamond.alertManager.subscribe((alert) => {
        if (alert.type === 'test.alert') {
          alertReceived = true;
        }
      });

      diamond.alertManager.builder()
        .type('test.alert')
        .severity(AlertSeverity.LOW)
        .message('Test alert')
        .source('test')
        .emit();

      await new Promise(resolve => setTimeout(resolve, 100));

      assert.strictEqual(alertReceived, true);
      unsubscribe();
    });

    it('should track healing statistics', () => {
      const stats = diamond.siteReliability?.getStats();
      
      assert.ok(stats, 'Should have stats');
      assert.ok(typeof stats.totalAttempts === 'number');
      assert.ok(typeof stats.successful === 'number');
      assert.ok(typeof stats.failed === 'number');
    });
  });

  describe('Pillar 5: Observability (Telemetry)', () => {
    it('should record spans', () => {
      const tracer = diamond.telemetry.getTracer('test');
      const span = tracer.startSpan('test-operation');
      
      tracer.log(span, { message: 'Test log' });
      tracer.finishSpan(span);

      assert.ok(span.id);
      assert.ok(span.traceId);
      assert.ok(span.endTime);
    });

    it('should record metrics', () => {
      diamond.telemetry.recordMetric('test.metric', 42, { tag: 'value' });
      
      const metrics = diamond.telemetry.getMetrics('test.metric', {
        start: new Date(Date.now() - 60000),
        end: new Date(),
      });

      assert.ok(metrics.length > 0);
      assert.strictEqual(metrics[0].value, 42);
    });
  });

  describe('Pillar 6: MCP App Store', () => {
    it('should publish and search plugins', async () => {
      const plugin = {
        id: 'test-plugin-' + Date.now(),
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        license: 'MIT',
        capabilities: ['test'],
        entryPoint: './index.js',
        dependencies: {},
        permissions: ['test:read'],
      };

      const result = await diamond.appStore.publish(plugin);
      assert.strictEqual(result.success, true);

      const searchResults = await diamond.appStore.search('test');
      assert.ok(searchResults.length > 0);
    });

    it('should audit plugins for security', async () => {
      const suspiciousPlugin = {
        id: 'suspicious-plugin-' + Date.now(),
        name: 'Suspicious Plugin',
        version: '1.0.0',
        description: 'A suspicious plugin',
        author: 'Unknown',
        license: 'MIT',
        capabilities: ['dangerous'],
        entryPoint: 'eval("malicious")',
        dependencies: { 'malicious-package': '1.0.0' },
        permissions: ['filesystem:write', 'network:all'],
      };

      const result = await diamond.appStore.publish(suspiciousPlugin);
      assert.strictEqual(result.success, false);
      assert.ok(result.errors && result.errors.length > 0);
    });
  });
});

describe('Mock Embedding Model', () => {
  it('should generate deterministic embeddings', async () => {
    const model = new MockEmbeddingModel();
    await model.initialize();

    const embedding1 = await model.embed('test text');
    const embedding2 = await model.embed('test text');
    
    assert.deepStrictEqual(embedding1, embedding2);
    
    const magnitude = Math.sqrt(embedding1.reduce((sum, x) => sum + x * x, 0));
    assert.ok(Math.abs(magnitude - 1) < 0.01, 'Should be normalized');
  });

  it('should calculate cosine similarity', async () => {
    const model = new MockEmbeddingModel();
    await model.initialize();

    const e1 = await model.embed('database optimization');
    const e2 = await model.embed('database optimization');
    const e3 = await model.embed('frontend styling');

    const similarity1 = model.cosineSimilarity(e1, e2);
    const similarity2 = model.cosineSimilarity(e1, e3);

    assert.strictEqual(similarity1, 1);
    assert.ok(similarity2 < 1);
  });
});
