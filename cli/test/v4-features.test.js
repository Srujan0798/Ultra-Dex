import test from 'node:test';
import assert from 'node:assert';
import { estimateDuration } from '../lib/commands/plan.js';
import { projectGraph } from '../lib/mcp/graph.js';
import { routeIntent } from '../lib/nlp/router.js';

test('Methodology: estimateDuration', () => {
  const base = 10;
  // Default: testing (+25%) + codeReview (+10%) = +35%
  const estimated = estimateDuration(base);
  assert.strictEqual(estimated, 13.5);

  const withNewTech = estimateDuration(base, { newTech: true });
  // Default (+35%) + newTech (+30%) = +65%
  assert.strictEqual(withNewTech, 16.5);
});

test('NLP: routeIntent enhanced', () => {
  assert.strictEqual(routeIntent('start a new project'), 'init');
  assert.strictEqual(routeIntent('how do i build this'), 'help');
  assert.strictEqual(routeIntent('run a swarm'), 'swarm');
  assert.strictEqual(routeIntent('check system health'), 'doctor');
  assert.strictEqual(routeIntent('talk to me'), 'voice');
});

test('Graph: getImpact', async () => {
  // Mock edges
  projectGraph.edges = [
    { from: 'A.js', to: 'B.js', type: 'depends_on' },
    { from: 'B.js', to: 'C.js', type: 'depends_on' },
    { from: 'D.js', to: 'B.js', type: 'depends_on' },
  ];

  const impact = projectGraph.getImpact('C.js');
  // C.js <- B.js <- A.js
  // C.js <- B.js <- D.js
  assert.ok(impact.includes('B.js'));
  assert.ok(impact.includes('A.js'));
  assert.ok(impact.includes('D.js'));
  assert.strictEqual(impact.length, 3);
});
