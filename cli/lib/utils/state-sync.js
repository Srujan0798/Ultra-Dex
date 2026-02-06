// Copyright (c) 2026 Ultra-Dex

/**
 * Ultra-Dex State Sync Engine
 * Bi-directionally synchronizes IMPLEMENTATION-PLAN.md and .ultra/state.json
 */

import fs from 'fs/promises';
import path from 'path';
import { loadState, saveState, parsePlanFromMarkdown, generateMarkdown } from '../commands/plan.js';

export async function syncState() {
  const projectRoot = process.cwd();
  const statePath = path.resolve(projectRoot, '.ultra/state.json');
  const planPath = path.resolve(projectRoot, 'IMPLEMENTATION-PLAN.md');

  let stateMtime = 0;
  let planMtime = 0;

  try {
    const stateStat = await fs.stat(statePath);
    stateMtime = stateStat.mtimeMs;
  } catch (e) {
    // state.json doesn't exist
  }

  try {
    const planStat = await fs.stat(planPath);
    planMtime = planStat.mtimeMs;
  } catch (e) {
    // IMPLEMENTATION-PLAN.md doesn't exist
  }

  // If neither exists, nothing to sync
  if (stateMtime === 0 && planMtime === 0) return null;

  // Decide source of truth based on mtime
  if (planMtime > stateMtime) {
    // Markdown is newer, sync to JSON
    const phases = await parsePlanFromMarkdown();
    if (phases.length > 0) {
      let state = await loadState();
      if (!state) {
        state = {
          project: { name: path.basename(projectRoot), mode: 'ULTRA_MODE' },
          updatedAt: new Date().toISOString(),
        };
      }
      state.phases = phases;
      state.updatedAt = new Date().toISOString();
      await saveState(state);
      return { source: 'markdown', target: 'json' };
    }
  } else {
    // JSON is newer (or same), sync to Markdown
    const state = await loadState();
    if (state && state.phases) {
      const markdown = generateMarkdown(state);
      await fs.writeFile(planPath, markdown);
      return { source: 'json', target: 'markdown' };
    }
  }

  return null;
}

/**
 * Force sync from JSON to Markdown
 */
export async function syncJsonToMarkdown() {
  const state = await loadState();
  if (state && state.phases) {
    const markdown = generateMarkdown(state);
    await fs.writeFile(path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md'), markdown);
    return true;
  }
  return false;
}

/**
 * Force sync from Markdown to JSON
 */
export async function syncMarkdownToJson() {
  const phases = await parsePlanFromMarkdown();
  if (phases.length > 0) {
    const state = await loadState();
    if (state) {
      state.phases = phases;
      state.updatedAt = new Date().toISOString();
      await saveState(state);
      return true;
    }
  }
  return false;
}
