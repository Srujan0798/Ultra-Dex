import { runQualityGates } from '../quality/gate.js';

export async function runPreCommitHook() {
  const { results } = await runQualityGates(process.cwd());
  const failed = results.filter(r => r.status === 'fail');
  if (failed.length) {
    throw new Error(`Pre-commit blocked: ${failed.length} gate(s) failed.`);
  }
  return { ok: true };
}
