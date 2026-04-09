// Copyright (c) 2026 Ultra-Dex

/**
 * Ultra-Dex State Reconciler
 * Verifies if tasks marked as completed in the plan actually exist in the codebase
 */

import { projectGraph } from '../mcp/graph.js';
import { loadState } from '../commands/plan.js';

export class Reconciler {
  async reconcile() {
    const state = await loadState();
    if (!state || !state.phases) return null;

    await projectGraph.scan();

    const results = {
      score: 0,
      totalTasks: 0,
      verifiedTasks: 0,
      hallucinatedTasks: [], // Marked as completed but not found
      missingTasks: [], // Not marked as completed but found markers
      details: [],
    };

    for (const phase of state.phases) {
      for (const step of phase.steps) {
        results.totalTasks++;

        if (step.status === 'completed') {
          const isVerified = await this.verifyTask(step);
          if (isVerified) {
            results.verifiedTasks++;
          } else {
            results.hallucinatedTasks.push(step);
          }
        }
      }
    }

    results.score =
      results.totalTasks > 0 ? Math.round((results.verifiedTasks / results.totalTasks) * 100) : 0;

    return results;
  }

  async verifyTask(step) {
    const task = step.task.toLowerCase();

    // Heuristic Verification based on task keywords

    // 1. Database Schema
    if (task.includes('database') || task.includes('schema') || task.includes('prisma')) {
      const dbFiles = Array.from(projectGraph.nodes.keys()).filter(
        (f) =>
          f.includes('schema') ||
          f.includes('prisma') ||
          f.includes('database') ||
          f.includes('models')
      );
      if (dbFiles.length > 0) return true;
    }

    // 2. API Endpoints
    if (task.includes('api') || task.includes('endpoint') || task.includes('route')) {
      const apiFiles = Array.from(projectGraph.nodes.keys()).filter(
        (f) =>
          f.includes('api/') ||
          f.includes('routes/') ||
          f.includes('route.ts') ||
          f.includes('route.js')
      );
      if (apiFiles.length > 0) return true;
    }

    // 3. Components
    if (task.includes('component') || task.includes('ui') || task.includes('page')) {
      const uiFiles = Array.from(projectGraph.nodes.keys()).filter(
        (f) =>
          f.includes('components/') ||
          f.includes('pages/') ||
          f.includes('app/') ||
          f.includes('.tsx') ||
          f.includes('.jsx')
      );
      if (uiFiles.length > 0) return true;
    }

    // 4. Specific Symbol Check
    // If the task names a specific function or class (e.g. "Implement AuthService")
    const symbolMatch = step.task.match(/(?:Implement|Create|Add)\s+([A-Z][a-zA-Z0-9]+)/);
    if (symbolMatch) {
      const symbolName = symbolMatch[1];
      const found = projectGraph.findSymbol(symbolName);
      if (found.length > 0) return true;
    }

    // 5. Generic check - if any new files were added recently
    // This is a fallback
    return false;
  }
}

export const reconciler = new Reconciler();

/**
 * Safe execution wrapper with error handling for reconciler
 * @param {Function} fn - Async function to execute
 * @param {string} [context='reconciler'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'reconciler') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
