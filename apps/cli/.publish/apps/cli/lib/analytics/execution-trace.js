// Copyright (c) 2026 Ultra-Dex

/**
 * Durable execution trace recorder for agent workflows.
 * Each step is written as a JSONL event keyed by a stable run_id.
 */

import path from 'path';
import { randomUUID } from 'crypto';
import { appendJsonl, readJsonl } from './storage.js';
import { redact } from '../utils/redactor.js';

const TRACE_DIR = path.resolve(process.cwd(), '.ultra-dex', 'traces');

function normalizeAgent(agent) {
  if (!agent) return 'unknown';
  return String(agent).replace(/^@/, '').trim().toLowerCase() || 'unknown';
}

function normalizeTraceValue(value) {
  if (value === undefined || value === null) return '';

  const safeValue = redact(value);

  if (typeof safeValue === 'string') {
    return safeValue;
  }

  if (safeValue instanceof Error) {
    return safeValue.stack || safeValue.message;
  }

  if (typeof safeValue === 'object') {
    try {
      return JSON.stringify(safeValue);
    } catch {
      return String(safeValue);
    }
  }

  return String(safeValue);
}

function normalizeTimestamp(value, fallback = null) {
  if (!value) return fallback;

  if (value instanceof Date) return value.toISOString();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

function normalizeNumber(value, fallback = null) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function extractTokenUsage(usage = null) {
  if (!usage || typeof usage !== 'object') {
    return {
      input: null,
      output: null,
      total: null,
    };
  }

  const input =
    normalizeNumber(usage.inputTokens) ??
    normalizeNumber(usage.prompt_tokens) ??
    normalizeNumber(usage.input);
  const output =
    normalizeNumber(usage.outputTokens) ??
    normalizeNumber(usage.completion_tokens) ??
    normalizeNumber(usage.output);
  const total =
    normalizeNumber(usage.totalTokens) ??
    (input !== null || output !== null ? (input || 0) + (output || 0) : null);

  return { input, output, total };
}

export class ExecutionTraceRecorder {
  constructor(options = {}) {
    this.runId = options.runId || randomUUID();
    this.step = 0;
    this.traceDir = options.traceDir || TRACE_DIR;
    this.traceFile = options.traceFile || path.join(this.traceDir, `${this.runId}.jsonl`);
    this.started = false;
    this.entries = [];
  }

  async record({
    step,
    agent,
    action,
    input = '',
    output = '',
    status = 'success',
    ...metadata
  } = {}) {
    if (!action) {
      throw new Error('Execution trace action is required');
    }

    const sequenceStep = typeof step === 'number' ? step : ++this.step;
    const stepIndex =
      normalizeNumber(metadata.stepIndex) ?? normalizeNumber(metadata.loopStep) ?? sequenceStep;
    const provider = metadata.provider ?? null;
    const model = metadata.model ?? null;
    const cost = normalizeNumber(metadata.cost) ?? normalizeNumber(metadata.estimatedCost) ?? null;
    const startTime = normalizeTimestamp(metadata.startTime);
    const endTime = normalizeTimestamp(metadata.endTime, new Date().toISOString());
    const duration =
      normalizeNumber(metadata.durationMs) ??
      (startTime && endTime
        ? Math.max(0, new Date(endTime).getTime() - new Date(startTime).getTime())
        : null);
    const tokenUsage = metadata.tokensUsed || extractTokenUsage(metadata.usage);

    const entry = {
      timestamp: endTime,
      run_id: this.runId,
      step: sequenceStep,
      stepIndex,
      agent: normalizeAgent(agent),
      action: String(action),
      input: normalizeTraceValue(input),
      output: normalizeTraceValue(output),
      status: status || 'success',
      provider,
      model,
      startTime,
      endTime,
      durationMs: duration,
      tokensUsed: tokenUsage,
      cost,
    };

    const {
      stepIndex: _stepIndex,
      provider: _provider,
      model: _model,
      cost: _cost,
      estimatedCost: _estimatedCost,
      startTime: _startTime,
      endTime: _endTime,
      durationMs: _durationMs,
      tokensUsed: _tokensUsed,
      usage: _usage,
      ...restMetadata
    } = metadata;

    if (Object.keys(restMetadata).length > 0) {
      entry.metadata = redact(restMetadata);
    }

    await appendJsonl(this.traceFile, entry);
    this.entries.push(entry);
    return entry;
  }

  getEntries() {
    return [...this.entries];
  }
}

export function createExecutionTrace(options = {}) {
  return new ExecutionTraceRecorder(options);
}

export function ensureExecutionTrace(context = {}, options = {}) {
  if (context?.executionTrace && typeof context.executionTrace.record === 'function') {
    return context.executionTrace;
  }

  const trace = createExecutionTrace(options);
  if (context && typeof context === 'object') {
    context.executionTrace = trace;
  }
  return trace;
}

export async function readExecutionTrace(runId, options = {}) {
  const traceDir = options.traceDir || TRACE_DIR;
  const filePath = path.join(traceDir, `${runId}.jsonl`);
  return readJsonl(filePath, options);
}

export const executionTracePaths = {
  directory: TRACE_DIR,
};
