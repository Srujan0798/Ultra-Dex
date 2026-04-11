// Copyright (c) 2026 Ultra-Dex

import { runQualityGates } from './gate.js';

export async function auditProject(root = process.cwd()) {
  const { results } = await runQualityGates(root);
  return results;
}
