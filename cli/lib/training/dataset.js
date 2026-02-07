// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';

const TRAINING_DIR = path.join(process.cwd(), '.ultra-dex', 'training');

export async function ensureTrainingDir() {
  await fs.mkdir(TRAINING_DIR, { recursive: true });
  return TRAINING_DIR;
}

export async function recordInteraction(entry, dataset = 'default') {
  await ensureTrainingDir();
  const filePath = path.join(TRAINING_DIR, `${dataset}.jsonl`);
  const payload = JSON.stringify({ ...entry, recordedAt: new Date().toISOString() });
  await fs.appendFile(filePath, payload + '\n');
  return filePath;
}

export async function loadDataset(dataset = 'default') {
  await ensureTrainingDir();
  const filePath = path.join(TRAINING_DIR, `${dataset}.jsonl`);
  const content = await fs.readFile(filePath, 'utf8');
  return content
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export async function exportDataset(dataset = 'default', outFile) {
  const data = await loadDataset(dataset);
  const output = outFile || path.join(TRAINING_DIR, `${dataset}.export.jsonl`);
  const payload = data.map((row) => JSON.stringify(row)).join('\n') + '\n';
  await fs.writeFile(output, payload);
  return output;
}

export async function listDatasets() {
  await ensureTrainingDir();
  const entries = await fs.readdir(TRAINING_DIR);
  return entries.filter((f) => f.endsWith('.jsonl'));
}

export default {
  recordInteraction,
  loadDataset,
  exportDataset,
  listDatasets,
};
