// Copyright (c) 2026 Ultra-Dex

/**
 * Ultra Protocol Handler (ultra://)
 * Maps ultra:// URIs to project state, context, decisions, and memory search.
 */

import fs from 'fs/promises';
import path from 'path';
import { loadState } from '../commands/plan.js';
import { ultraMemory } from './memory.js';
import { logger } from '../ui/logger.js';

const DEFAULT_DECISION_FILES = ['ULTRA.md', 'DECISIONS.md', 'IMPLEMENTATION-PLAN.md', 'CONTEXT.md'];

function extractDecisions(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const decisions = [];
  let inDecisionBlock = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (/^#+\s*decisions/i.test(line)) {
      inDecisionBlock = true;
      continue;
    }

    if (inDecisionBlock && /^#+\s+/.test(line) && !/^#+\s*decisions/i.test(line)) {
      inDecisionBlock = false;
    }

    if (inDecisionBlock || /^-\s+/.test(line) || /^\*\s+/.test(line)) {
      if (/decision/i.test(line) || inDecisionBlock) {
        decisions.push(line.replace(/^[-*]\s+/, ''));
      }
    }
  }

  return decisions;
}

async function readFirstExistingFile(paths) {
  for (const filePath of paths) {
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      const content = await fs.readFile(fullPath, 'utf8');
      return { content, path: fullPath };
    } catch {
      // continue
    }
  }
  return { content: '', path: null };
}

async function getProjectContext() {
  const { content } = await readFirstExistingFile(['CONTEXT.md']);
  return content || '# Project Context\n\nNo context available.';
}

async function getProjectState() {
  try {
    const state = await loadState();
    if (state) return state;
  } catch (error) {
    logger.warn('Ultra protocol state read failed', error);
  }

  try {
    const raw = await fs.readFile(path.resolve(process.cwd(), '.ultra/state.json'), 'utf8');
    return JSON.parse(raw);
  } catch {
    return { error: 'State not available' };
  }
}

async function getDecisions() {
  const { content } = await readFirstExistingFile(DEFAULT_DECISION_FILES);
  const decisions = extractDecisions(content);
  if (decisions.length > 0) return decisions;

  return ['No decisions recorded yet. Add a Decisions section to ULTRA.md.'];
}

async function searchMemory(query) {
  if (!query) return [];
  try {
    const results = await ultraMemory.search(query, 8);
    return results;
  } catch (error) {
    logger.warn('Ultra protocol memory search failed', error);
    return [];
  }
}

export function registerUltraProtocol(server) {
  if (!server?.resource) return;

  server.resource('ultra_project_state', 'ultra://project/state', async (uri) => {
    const state = await getProjectState();
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(state, null, 2),
        },
      ],
    };
  });

  server.resource('ultra_project_context', 'ultra://project/context', async (uri) => {
    const context = await getProjectContext();
    return {
      contents: [
        {
          uri: uri.href,
          text: context,
        },
      ],
    };
  });

  server.resource('ultra_context_decisions', 'ultra://context/decisions', async (uri) => {
    const decisions = await getDecisions();
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify({ decisions }, null, 2),
        },
      ],
    };
  });

  server.resource('ultra_memory_search', 'ultra://memory/search', async (uri) => {
    const query = uri.searchParams?.get('q') || '';
    const results = await searchMemory(query);
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify({ query, results }, null, 2),
        },
      ],
    };
  });
}

export default {
  registerUltraProtocol,
};
