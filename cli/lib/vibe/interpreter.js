// Copyright (c) 2026 Ultra-Dex

import path from 'path';

const MODES = ['create', 'modify', 'explain', 'debug'];

function detectMode(input, currentMode = 'create') {
  const lower = input.toLowerCase();
  if (
    lower.startsWith('explain') ||
    lower.startsWith('what does') ||
    lower.startsWith('describe')
  ) {
    return 'explain';
  }
  if (lower.startsWith('debug') || lower.includes('why is') || lower.includes('error')) {
    return 'debug';
  }
  if (
    lower.startsWith('change') ||
    lower.startsWith('update') ||
    lower.startsWith('modify') ||
    lower.includes('make this')
  ) {
    return 'modify';
  }
  if (lower.startsWith('add') || lower.startsWith('create') || lower.startsWith('build')) {
    return 'create';
  }
  return currentMode;
}

function extractFilePath(input, cwd = process.cwd()) {
  const patterns = [/(?:in|to|file|path)\s+([\w./-]+\.[\w]+)/i, /(src[\w./-]+)/i, /(app[\w./-]+)/i];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match && match[1]) {
      return path.resolve(cwd, match[1]);
    }
  }

  return null;
}

function extractIntent(input) {
  const lower = input.toLowerCase();
  if (lower.includes('explain')) return 'explain';
  if (lower.includes('debug') || lower.includes('fix')) return 'debug';
  if (lower.includes('update') || lower.includes('change')) return 'modify';
  if (lower.includes('add') || lower.includes('create') || lower.includes('build')) return 'create';
  return 'general';
}

export function interpretInput(input, context = {}) {
  const trimmed = input.trim();
  if (!trimmed) {
    return { type: 'noop' };
  }

  const mode = detectMode(trimmed, context.mode);
  const intent = extractIntent(trimmed);
  const filePath = extractFilePath(trimmed, context.cwd);

  const questions = [];
  if ((intent === 'create' || intent === 'modify') && !filePath) {
    questions.push('Which file should I update? You can reply with: "in src/..."');
  }

  const actions = [];
  if (filePath && intent === 'create') {
    actions.push({
      type: 'create',
      path: filePath,
      content: `// TODO: ${trimmed}\n`,
      reason: 'vibe-create',
    });
  }

  if (filePath && intent === 'modify') {
    actions.push({
      type: 'modify',
      path: filePath,
      content: `\n// TODO (vibe): ${trimmed}\n`,
      reason: 'vibe-modify',
    });
  }

  return {
    type: 'intent',
    mode,
    intent,
    summary: trimmed,
    questions,
    actions,
    filePath,
  };
}

export function listModes() {
  return [...MODES];
}

/**
 * Handle errors in interpreter module
 * @param {Error} error - The error to handle
 * @param {string} [context='interpreter'] - Error context
 */
function handleModuleError(error, context = 'interpreter') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
