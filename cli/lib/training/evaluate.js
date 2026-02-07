// Copyright (c) 2026 Ultra-Dex

import { loadDataset } from './dataset.js';

export async function evaluateDataset(dataset = 'default') {
  const data = await loadDataset(dataset);
  const totals = { samples: 0, success: 0, failure: 0 };

  for (const entry of data) {
    if (entry.type !== 'sample') continue;
    totals.samples += 1;
    if (entry.outcome === 'success') totals.success += 1;
    if (entry.outcome === 'failure') totals.failure += 1;
  }

  const successRate = totals.samples ? totals.success / totals.samples : 0;
  return {
    dataset,
    totals,
    successRate,
  };
}

export default {
  evaluateDataset,
};
