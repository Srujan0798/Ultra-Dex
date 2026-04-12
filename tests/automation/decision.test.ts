import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { DecisionEngine } from '../../src/automation/decision-engine';

describe('DecisionEngine', () => {
  const testHistoryFile = path.join('.ultra-dex', 'test-decision-history.json');

  test('should calculate CONTINUE recommendation (>= 0.7)', () => {
    const engine = new DecisionEngine({}, testHistoryFile);
    engine.injectTestData({
      responses: 20,
      positivePct: 1.0,
      buyingSignals: 10,
      interviews: 5,
      willingToPay: 5,
      competitorMentions: 0
    });

    const result = engine.recommend();
    assert.strictEqual(result.decision, 'CONTINUE');
    assert.ok(result.confidence >= 0.7);
  });

  test('should calculate PIVOT recommendation (0.3-0.7)', () => {
    const engine = new DecisionEngine({}, testHistoryFile);
    engine.injectTestData({
      responses: 20,
      positivePct: 0.5,
      buyingSignals: 2,
      interviews: 5,
      willingToPay: 1,
      competitorMentions: 1
    });

    const result = engine.recommend();
    assert.strictEqual(result.decision, 'PIVOT');
    assert.ok(result.confidence >= 0.3 && result.confidence < 0.7);
  });

  test('should calculate STOP recommendation (< 0.3)', () => {
    const engine = new DecisionEngine({}, testHistoryFile);
    engine.injectTestData({
      responses: 20,
      positivePct: 0.1,
      buyingSignals: 0,
      interviews: 5,
      willingToPay: 0,
      competitorMentions: 10
    });

    const result = engine.recommend();
    assert.strictEqual(result.decision, 'STOP');
    assert.ok(result.confidence < 0.3);
  });

  test('should handle edge case: exactly 0.7 confidence', () => {
    const engine = new DecisionEngine({}, testHistoryFile);
    
    engine.collectEvidence({
      reddit: {
        sentimentScores: { positive: 10, negative: 0, neutral: 0 },
        totalResponses: 10,
        buyingSignals: 10,
        highUpvoteComments: 0,
        interestSignals: 0
      },
      interviews: {
        totalInterviews: 10,
        completedInterviews: 10,
        willingToPay: 5,
        painPoints: [],
        quotes: []
      }
    });

    const { score } = engine.calculateConfidence();
    assert.strictEqual(score, 0.71); // Rounded up as per implementation
    assert.strictEqual(engine.recommend().decision, 'CONTINUE');
  });

  test('should return INSUFFICIENT_DATA if signals < 5', () => {
    const engine = new DecisionEngine({}, testHistoryFile);
    engine.injectTestData({
      responses: 2,
      positivePct: 1.0,
      buyingSignals: 1,
      interviews: 0,
      willingToPay: 0,
      competitorMentions: 0
    });

    const result = engine.recommend();
    assert.strictEqual(result.decision, 'INSUFFICIENT_DATA');
  });

  test('should track decision history', () => {
    if (fs.existsSync(testHistoryFile)) fs.unlinkSync(testHistoryFile);
    
    const engine = new DecisionEngine({}, testHistoryFile);
    engine.injectTestData({
      responses: 20,
      positivePct: 1.0,
      buyingSignals: 10,
      interviews: 5,
      willingToPay: 5,
      competitorMentions: 0
    });

    engine.recommend();
    assert.ok(fs.existsSync(testHistoryFile));
    const history = JSON.parse(fs.readFileSync(testHistoryFile, 'utf-8'));
    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].decision, 'CONTINUE');
  });
});
