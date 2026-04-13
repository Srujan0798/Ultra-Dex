import { test } from 'node:test';
import * as assert from 'node:assert';
import { ResultValidator } from '../../adapters/resultValidator.js';
import { ExecutionResult } from '../../adapters/executionAdapter.js';

test('ResultValidator', async (t) => {
  const getValidResult = (): ExecutionResult => ({
    status: 'SUCCESS',
    logs: ['Test log'],
    cost: {
      tokens: 100,
      estimatedUSD: 0.001,
      provider: 'test'
    },
    confidence: 0.9,
    duration: 100,
    timestamp: new Date().toISOString()
  });

  await t.test('valid SUCCESS result passes', () => {
    const result = getValidResult();
    const validation = ResultValidator.validate(result);
    assert.strictEqual(validation.valid, true);
    assert.strictEqual(validation.errors.length, 0);
  });

  await t.test('valid FAILED result with error passes', () => {
    const result = getValidResult();
    result.status = 'FAILED';
    result.error = 'Something went wrong';
    
    const validation = ResultValidator.validate(result);
    assert.strictEqual(validation.valid, true);
  });

  await t.test('missing cost fails', () => {
    const result = getValidResult();
    delete (result as any).cost;
    
    const validation = ResultValidator.validate(result);
    assert.strictEqual(validation.valid, false);
    assert.ok(validation.errors.includes('cost is required'));
  });

  await t.test('negative tokens fails', () => {
    const result = getValidResult();
    result.cost.tokens = -10;
    
    const validation = ResultValidator.validate(result);
    assert.strictEqual(validation.valid, false);
    assert.ok(validation.errors.includes('cost.tokens must be >= 0'));
  });

  await t.test('confidence outside 0-1 fails', () => {
    const resultHigh = getValidResult();
    resultHigh.confidence = 1.5;
    
    const validationHigh = ResultValidator.validate(resultHigh);
    assert.strictEqual(validationHigh.valid, false);
    assert.ok(validationHigh.errors.includes('confidence must be between 0 and 1'));

    const resultLow = getValidResult();
    resultLow.confidence = -0.5;
    
    const validationLow = ResultValidator.validate(resultLow);
    assert.strictEqual(validationLow.valid, false);
    assert.ok(validationLow.errors.includes('confidence must be between 0 and 1'));
  });

  await t.test('non-ISO timestamp fails', () => {
    const result = getValidResult();
    result.timestamp = '12/12/2026';
    
    const validation = ResultValidator.validate(result);
    assert.strictEqual(validation.valid, false);
    assert.ok(validation.errors.includes('timestamp must be ISO 8601'));
  });

  await t.test('FAILED without error fails', () => {
    const result = getValidResult();
    result.status = 'FAILED';
    // missing error
    
    const validation = ResultValidator.validate(result);
    assert.strictEqual(validation.valid, false);
    assert.ok(validation.errors.includes('error required when status is FAILED'));
  });

  await t.test('logs must be string array', () => {
    const result = getValidResult();
    (result as any).logs = [1, 2, 3];
    
    const validation = ResultValidator.validate(result);
    assert.strictEqual(validation.valid, false);
    assert.ok(validation.errors.includes('logs must be string array'));
  });

  await t.test('serialize/deserialize roundtrip', () => {
    const result = getValidResult();
    
    const serialized = ResultValidator.serialize(result);
    assert.strictEqual(typeof serialized, 'string');
    
    const deserialized = ResultValidator.deserialize(serialized);
    assert.deepStrictEqual(deserialized, result);
  });

  await t.test('invalid status fails', () => {
    const result = getValidResult();
    (result as any).status = 'UNKNOWN_STATUS';
    
    const validation = ResultValidator.validate(result);
    assert.strictEqual(validation.valid, false);
    assert.ok(validation.errors.includes('Invalid status: UNKNOWN_STATUS'));
  });
});
