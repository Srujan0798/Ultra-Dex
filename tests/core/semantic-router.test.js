import assert from 'node:assert';
import { describe, it } from 'node:test';
import { AGENT_PROFILES } from '../../src/core/routing/agent-profiles.js';
import { HybridRouter, SemanticRouter } from '../../src/core/routing/semantic-router.js';

describe('SemanticRouter', () => {
  it('routes "make the button bounce" to frontend without UI keywords', () => {
    const router = new SemanticRouter({ backend: 'hashed' });
    router.retrainSync(AGENT_PROFILES);

    const result = router.routeSync('make the button bounce');

    assert.strictEqual(result.agentId, 'frontend');
    assert.ok(result.confidence > 0.85);
  });

  it('routes "optimize database queries" to backend via semantic match', () => {
    const router = new SemanticRouter({ backend: 'hashed' });
    router.retrainSync(AGENT_PROFILES);

    const result = router.routeSync('optimize database queries');

    assert.strictEqual(result.agentId, 'backend');
    assert.ok(result.confidence > 0.85);
  });
});

describe('HybridRouter', () => {
  it('falls back to capability-only routing when semantic confidence is low', () => {
    const lowConfidenceMatches = AGENT_PROFILES.map((profile, index) => ({
      agentId: profile.agentId,
      similarity: 0.08 + index * 0.001,
      confidence: 0.2,
      profile: {
        ...profile,
        capabilityTokenSet: new Set(profile.capabilities),
      },
    }));

    const router = new HybridRouter({
      semanticRouter: {
        routeSync() {
          return { matches: lowConfidenceMatches };
        },
      },
      minimumSemanticConfidence: 0.95,
    });

    const result = router.routeSync('miscellaneous task with no clear language', ['test']);

    assert.strictEqual(result.agentId, 'testing');
    assert.strictEqual(result.method, 'capability-fallback');
    assert.ok(result.semanticConfidence < 0.95);
    assert.ok(result.capabilityScore > 0.6);
  });
});
