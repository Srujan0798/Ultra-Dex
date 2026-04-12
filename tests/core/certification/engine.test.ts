import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CertificationEngine } from '../../../src/core/certification/engine.ts';

describe('CertificationEngine', () => {
  it('starts assessment with timer and expires correctly', async () => {
    const engine = new CertificationEngine();
    const session = engine.startAssessment('architect', 20);
    assert.ok(session.id);
    assert.ok(session.expiresAt > session.startedAt);

    await new Promise((resolve) => setTimeout(resolve, 25));
    assert.throws(() => engine.scoreAnswer(session, 1, 1), /expired/);
  });

  it('scores answers and applies pass/fail threshold by level', () => {
    const engine = new CertificationEngine();
    let session = engine.startAssessment('expert', 5_000);
    session = engine.scoreAnswer(session, 4, 5);
    session = engine.scoreAnswer(session, 5, 5);
    session = engine.scoreAnswer(session, 4, 5); // 13/15 = 86.6%
    const result = engine.finalizeAssessment(session);
    assert.strictEqual(result.passed, true);
  });

  it('generates certificate with verifiable signature', () => {
    const engine = new CertificationEngine();
    const certificate = engine.generateCertificate('candidate-1', 'practitioner', 92.4);
    assert.ok(certificate.signature.length > 10);
    assert.strictEqual(engine.verifyCertificate(certificate), true);

    const tampered = {
      ...certificate,
      payload: { ...certificate.payload, score: 99.9 },
    };
    assert.strictEqual(engine.verifyCertificate(tampered), false);
  });
});
