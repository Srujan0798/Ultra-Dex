// Copyright (c) 2026 Ultra-Dex

/**
 * Custom Agent Training
 * Persists project-specific conventions and user corrections for agents.
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

const TRAINING_DIR = path.resolve(process.cwd(), '.ultra-dex', 'training');
const MODEL_PATH = path.join(TRAINING_DIR, 'model.json');
const CORRECTIONS_LOG = path.join(TRAINING_DIR, 'corrections.jsonl');

async function ensureTrainingDir() {
  await fs.mkdir(TRAINING_DIR, { recursive: true });
}

async function loadTrainingState() {
  try {
    const data = await fs.readFile(MODEL_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { version: 1, agents: {}, conventions: {}, updatedAt: null };
    }
    return { version: 1, agents: {}, conventions: {}, updatedAt: null };
  }
}

async function saveTrainingState(state) {
  await ensureTrainingDir();
  const payload = { ...state, updatedAt: new Date().toISOString() };
  await fs.writeFile(MODEL_PATH, JSON.stringify(payload, null, 2));
  return payload;
}

async function scanConventions(rootDir = process.cwd()) {
  const patterns = '**/*.{js,ts,tsx,jsx,md,json,yml,yaml}';
  const files = await glob(patterns, {
    cwd: rootDir,
    nodir: true,
    ignore: ['**/node_modules/**', '**/.git/**', '**/.ultra-dex/**', '**/dist/**', '**/build/**'],
  });

  const sample = files.slice(0, 30);
  let spaceIndents = 0;
  let tabIndents = 0;
  const indentSizes = {};
  let lf = 0;
  let crlf = 0;
  let singleQuotes = 0;
  let doubleQuotes = 0;

  for (const file of sample) {
    const fullPath = path.join(rootDir, file);
    let content = '';
    try {
      content = await fs.readFile(fullPath, 'utf8');
    } catch {
      continue;
    }

    if (content.includes('\r\n')) crlf += 1;
    else lf += 1;

    const lines = content.split(/\r?\n/).slice(0, 200);
    for (const line of lines) {
      const match = line.match(/^(\t+| +)/);
      if (match) {
        if (match[0].includes('\t')) {
          tabIndents += 1;
        } else {
          spaceIndents += 1;
          const size = match[0].length;
          indentSizes[size] = (indentSizes[size] || 0) + 1;
        }
      }

      if (line.includes("'")) singleQuotes += 1;
      if (line.includes('"')) doubleQuotes += 1;
    }
  }

  const indentStyle = tabIndents > spaceIndents ? 'tab' : 'space';
  const indentSize =
    Object.entries(indentSizes)
      .sort((a, b) => b[1] - a[1])
      .map(([size]) => Number(size))[0] || 2;
  const lineEndings = crlf > lf ? 'crlf' : 'lf';
  const quoteStyle = singleQuotes >= doubleQuotes ? 'single' : 'double';

  return {
    indentStyle,
    indentSize,
    lineEndings,
    quoteStyle,
    filesScanned: sample.length,
    sampleSize: files.length,
  };
}

export async function trainAgent(agentName, options = {}) {
  const state = await loadTrainingState();
  const conventions = await scanConventions(options.rootDir || process.cwd());

  state.agents = state.agents || {};
  state.agents[agentName] = {
    name: agentName,
    trainedAt: new Date().toISOString(),
    conventions,
    corrections: state.agents[agentName]?.corrections || [],
  };

  state.conventions = conventions;
  return saveTrainingState(state);
}

export async function recordCorrection(agentName, correction) {
  await ensureTrainingDir();
  const entry = {
    agent: agentName,
    correction,
    timestamp: new Date().toISOString(),
  };

  await fs.appendFile(CORRECTIONS_LOG, JSON.stringify(entry) + '\n', 'utf8');

  const state = await loadTrainingState();
  state.agents = state.agents || {};
  state.agents[agentName] = state.agents[agentName] || { name: agentName, corrections: [] };
  state.agents[agentName].corrections = state.agents[agentName].corrections || [];
  state.agents[agentName].corrections.push(entry);

  return saveTrainingState(state);
}

export async function exportModel(destination) {
  const state = await loadTrainingState();
  const outputPath = destination || path.join(TRAINING_DIR, `model-export-${Date.now()}.json`);
  await fs.writeFile(outputPath, JSON.stringify(state, null, 2));
  return outputPath;
}

export async function importModel(sourcePath) {
  const data = await fs.readFile(sourcePath, 'utf8');
  const imported = JSON.parse(data);
  const state = await loadTrainingState();

  state.agents = { ...(state.agents || {}), ...(imported.agents || {}) };
  state.conventions = imported.conventions || state.conventions;

  return saveTrainingState(state);
}

export async function getTrainingSummary() {
  const state = await loadTrainingState();
  return {
    agents: Object.keys(state.agents || {}).length,
    conventions: state.conventions || {},
    updatedAt: state.updatedAt,
  };
}

export const trainingPaths = {
  model: MODEL_PATH,
  corrections: CORRECTIONS_LOG,
};
