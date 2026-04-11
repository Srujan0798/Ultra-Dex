// Copyright (c) 2026 Ultra-Dex

/**
 * First-class run artifact bundle writer.
 * Every execution persists result, trace, and summary artifacts.
 */

import fs from 'fs/promises';
import path from 'path';
import { readJsonl } from './storage.js';

function getRunsDirectory() {
  return path.resolve(process.cwd(), '.ultra-dex', 'runs');
}

function toText(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function truncateText(value, maxChars = 240) {
  const text = String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 3)).trim()}...`;
}

function parseStructuredInput(value) {
  if (typeof value !== 'string') return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function collectFilesTouched(events) {
  const files = new Set();

  for (const event of events) {
    if (event.action === 'READ_CODE' || event.action === 'VERIFY_CODE') {
      const filePath = String(event.input || '').trim();
      if (filePath) files.add(filePath);
      continue;
    }

    if (event.action !== 'WRITE_CODE') continue;

    const structuredInput = parseStructuredInput(event.input);
    const filePath = structuredInput?.filePath;
    if (typeof filePath === 'string' && filePath.trim()) {
      files.add(filePath.trim());
    }
  }

  return Array.from(files);
}

function collectDelegatedAgents(events) {
  const delegates = new Set();

  for (const event of events) {
    const target = event.metadata?.to;
    if (event.action === 'DELEGATE' && typeof target === 'string' && target.trim()) {
      delegates.add(target.trim());
    }
  }

  return Array.from(delegates);
}

function summarizeActions(events) {
  const actionCounts = {};
  const statusCounts = {};

  for (const event of events) {
    actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;
    statusCounts[event.status] = (statusCounts[event.status] || 0) + 1;
  }

  return { actionCounts, statusCounts };
}

function buildRunSteps(events) {
  return events.map((event) => ({
    step: Number(event.step) || 0,
    stepIndex: Number(event.stepIndex) || Number(event.step) || 0,
    agent: event.agent || 'unknown',
    action: event.action || 'UNKNOWN',
    status: event.status || 'unknown',
    input: event.input || '',
    output: event.output || '',
    provider: event.provider || null,
    model: event.model || null,
    startTime: event.startTime || event.timestamp || null,
    endTime: event.endTime || event.timestamp || null,
    duration: typeof event.durationMs === 'number' ? event.durationMs : 0,
    tokensUsed: event.tokensUsed || { input: null, output: null, total: null },
    cost: event.cost ?? null,
    timestamp: event.timestamp,
  }));
}

function buildRunSummary({ runId, command, agent, task, result, events, artifactPaths } = {}) {
  const firstEvent = events[0] || null;
  const lastEvent = events[events.length - 1] || null;
  const startedAt = firstEvent?.timestamp || new Date().toISOString();
  const completedAt = lastEvent?.timestamp || startedAt;
  const durationMs = Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime());
  const { actionCounts, statusCounts } = summarizeActions(events);
  const steps = buildRunSteps(events);

  return {
    runId,
    command: command || 'run',
    agent: agent || lastEvent?.agent || 'unknown',
    task: truncateText(task, 500),
    status: lastEvent?.status || 'unknown',
    startedAt,
    completedAt,
    durationMs,
    totalEvents: events.length,
    totalTraceSteps: Math.max(0, ...events.map((event) => Number(event.step) || 0)),
    finalAction: lastEvent?.action || null,
    actionCounts,
    statusCounts,
    delegatedAgents: collectDelegatedAgents(events),
    filesTouched: collectFilesTouched(events),
    output: result,
    resultPreview: truncateText(result, 500),
    steps,
    trace: {
      run_id: runId,
      startedAt,
      completedAt,
      durationMs,
      steps,
      output: result,
    },
    artifacts: {
      result: artifactPaths.result,
      trace: artifactPaths.trace,
      summary: artifactPaths.summary,
    },
  };
}

export function getRunArtifactPaths(runId) {
  const directory = path.join(getRunsDirectory(), runId);

  return {
    directory,
    result: path.join(directory, 'result.txt'),
    trace: path.join(directory, 'trace.jsonl'),
    summary: path.join(directory, 'summary.json'),
  };
}

export async function writeRunArtifacts({ runId, command, agent, task, result, traceFile } = {}) {
  if (!runId) {
    throw new Error('runId is required to write run artifacts');
  }

  const artifactPaths = getRunArtifactPaths(runId);
  const resultText = toText(result);

  await fs.mkdir(artifactPaths.directory, { recursive: true });
  await fs.writeFile(artifactPaths.result, resultText, 'utf8');

  let events = [];
  if (traceFile) {
    // Ensure source trace file exists before copying (handles timing issues)
    try {
      await fs.access(traceFile);
      await fs.copyFile(traceFile, artifactPaths.trace);
    } catch (_accessError) {
      // Source trace not yet available — create empty trace file to prevent downstream errors
      console.warn(`Trace file not yet available: ${traceFile}, creating empty trace`);
      await fs.writeFile(artifactPaths.trace, '', 'utf8');
    }
    events = await readJsonl(artifactPaths.trace);
  } else {
    await fs.writeFile(artifactPaths.trace, '', 'utf8');
  }

  const summary = buildRunSummary({
    runId,
    command,
    agent,
    task,
    result: resultText,
    events,
    artifactPaths,
  });

  await fs.writeFile(artifactPaths.summary, JSON.stringify(summary, null, 2), 'utf8');

  return {
    paths: artifactPaths,
    summary,
  };
}

export const runArtifactPaths = {
  get directory() {
    return getRunsDirectory();
  },
};
