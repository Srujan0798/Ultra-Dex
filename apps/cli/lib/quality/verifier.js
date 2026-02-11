// Copyright (c) 2026 Ultra-Dex

import { runQualityGates } from './gate.js';

export async function verifyProject(root = process.cwd()) {
  const { results } = await runQualityGates(root);
  const failed = results.filter((r) => r.status === 'fail');
  return { ok: failed.length === 0, results };
}
