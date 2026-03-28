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

export class ExecutionTraceRecorder {
  constructor(options = {}) {
    this.runId = options.runId || `run_${Date.now()}_${randomUUID().slice(0, 8)}`;
    this.step = 0;
    this.traceDir = options.traceDir || TRACE_DIR;
    this.traceFile = options.traceFile || path.join(this.traceDir, `${this.runId}.jsonl`);
    this.started = false;
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

    const entry = {
      timestamp: new Date().toISOString(),
      run_id: this.runId,
      step: typeof step === 'number' ? step : ++this.step,
      agent: normalizeAgent(agent),
      action: String(action),
      input: normalizeTraceValue(input),
      output: normalizeTraceValue(output),
      status: status || 'success',
    };

    if (Object.keys(metadata).length > 0) {
      entry.metadata = redact(metadata);
    }

    await appendJsonl(this.traceFile, entry);
    return entry;
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

