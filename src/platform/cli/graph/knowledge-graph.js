// Copyright (c) 2026 Ultra-Dex

/**
 * Knowledge Graph facade.
 * Wrapper around repo-indexer.js so other modules can import a stable API name.
 */

import repoGraph from './repo-indexer.js';

export const knowledgeGraph = repoGraph.repoKnowledgeGraph;
export const registerKnowledgeGraphCommand = repoGraph.registerRepoGraphCommand;
export const indexKnowledgeGraph = repoGraph.indexRepo;

export default repoGraph;

/**
 * Error handler for knowledge-graph
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[knowledge-graph]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
