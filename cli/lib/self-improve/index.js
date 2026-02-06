// Copyright (c) 2026 Ultra-Dex

/**
 * Self-Improving Agents
 * Tracks outcomes, learns from corrections, runs prompt A/B tests.
 */

import fs from 'fs/promises';
import path from 'path';

const ROOT_DIR = path.resolve(process.cwd(), '.ultra-dex', 'self-improve');
const STATE_PATH = path.join(ROOT_DIR, 'state.json');
const CORRECTIONS_LOG = path.join(ROOT_DIR, 'corrections.jsonl');
const AB_LOG = path.join(ROOT_DIR, 'ab-tests.jsonl');

async function ensureDir() {
  await fs.mkdir(ROOT_DIR, { recursive: true });
}

async function loadState() {
  try {
    const data = await fs.readFile(STATE_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
    return { agents: {}, patterns: {}, updatedAt: null };
  }
}

async function saveState(state) {
  await ensureDir();
  const payload = { ...state, updatedAt: new Date().toISOString() };
  await fs.writeFile(STATE_PATH, JSON.stringify(payload, null, 2));
  return payload;
}

export async function recordOutcome(agent, { success, durationMs, task } = {}) {
  const state = await loadState();
  state.agents[agent] = state.agents[agent] || { success: 0, failure: 0, history: [] };
  if (success) state.agents[agent].success += 1;
  else state.agents[agent].failure += 1;
  state.agents[agent].history.push({
    success,
    durationMs,
    task,
    timestamp: new Date().toISOString(),
  });
  return saveState(state);
}

export async function recordCorrection(agent, correction) {
  await ensureDir();
  const entry = {
    agent,
    correction,
    timestamp: new Date().toISOString(),
  };
  await fs.appendFile(CORRECTIONS_LOG, JSON.stringify(entry) + '\n', 'utf8');

  const state = await loadState();
  state.patterns.corrections = state.patterns.corrections || [];
  state.patterns.corrections.push(entry);
  return saveState(state);
}

export async function runABTest(agent, variants = []) {
  await ensureDir();
  const test = {
    agent,
    variants,
    startedAt: new Date().toISOString(),
  };
  await fs.appendFile(AB_LOG, JSON.stringify(test) + '\n', 'utf8');
  return test;
}

export async function optimizePrompt(agent, recommendation) {
  const state = await loadState();
  state.patterns.prompts = state.patterns.prompts || {};
  state.patterns.prompts[agent] = recommendation;
  return saveState(state);
}

export async function exportPatterns(destination) {
  const state = await loadState();
  const outputPath = destination || path.join(ROOT_DIR, `patterns-${Date.now()}.json`);
  await fs.writeFile(outputPath, JSON.stringify(state.patterns, null, 2));
  return outputPath;
}

export async function getAgentStats(agent) {
  const state = await loadState();
  return state.agents[agent] || { success: 0, failure: 0, history: [] };
}

export default {
  recordOutcome,
  recordCorrection,
  runABTest,
  optimizePrompt,
  exportPatterns,
  getAgentStats,
};
