// Copyright (c) 2026 Ultra-Dex

import { runStructuralGates } from '../gates/structural.js';
import { runArchitecturalGates } from '../gates/architectural.js';

export async function validateProject(root = process.cwd()) {
  const structural = await runStructuralGates();
  if (!structural.ok) return { ok: false, stage: 'structural' };
  const architectural = await runArchitecturalGates(root);
  if (!architectural.ok) return { ok: false, stage: 'architectural', violations: architectural.violations };
  return { ok: true };
}
