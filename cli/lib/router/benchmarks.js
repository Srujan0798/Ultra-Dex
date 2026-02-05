/**
 * Model benchmark registry
 */

import fs from 'fs/promises';
import path from 'path';

const BENCH_PATH = path.resolve(process.cwd(), '.ultra-dex', 'router-benchmarks.json');

export async function loadBenchmarks() {
  try {
    const content = await fs.readFile(BENCH_PATH, 'utf8');
    return JSON.parse(content);
  } catch {
    return { records: [] };
  }
}

export async function recordBenchmark(record) {
  const data = await loadBenchmarks();
  data.records = data.records || [];
  data.records.push({ ...record, createdAt: new Date().toISOString() });
  await fs.mkdir(path.dirname(BENCH_PATH), { recursive: true });
  await fs.writeFile(BENCH_PATH, JSON.stringify(data, null, 2));
  return record;
}

export function selectBestModel(records, taskType) {
  const filtered = records.filter(r => r.taskType === taskType);
  if (!filtered.length) return null;
  filtered.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
  return filtered[0];
}

export default {
  loadBenchmarks,
  recordBenchmark,
  selectBestModel
};
