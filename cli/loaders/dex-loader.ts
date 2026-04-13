/**
 * .dex file loader and validator.
 *
 * Responsibility: read a .dex file from disk, parse it, and return a
 * fully-validated DexGraph ready for scheduling. No execution happens here.
 */

import * as path from 'path';
import { parse } from '../../dexgraph/parser.js';
import { DexGraph } from '../../dexgraph/graph.js';
import type { DexGraphResult } from '../../dexgraph/types.js';

export interface LoadedWorkflow {
  filePath: string;
  parseResult: DexGraphResult;
  graph: DexGraph;
}

/**
 * Resolve and validate a .dex file path — prevents directory traversal.
 * @throws if path contains '..' or escapes cwd
 */
export function resolveDexPath(rawPath: string): string {
  const normalized = path.normalize(rawPath);

  if (normalized.includes('..')) {
    throw new Error(`Path traversal not allowed: "${rawPath}"`);
  }

  const resolved = path.isAbsolute(normalized)
    ? normalized
    : path.resolve(process.cwd(), normalized);

  if (!resolved.endsWith('.dex')) {
    throw new Error(`Workflow file must have .dex extension, got: "${rawPath}"`);
  }

  return resolved;
}

/**
 * Load, parse, and build a DexGraph from a .dex workflow file.
 *
 * @example
 * const { graph, parseResult } = await loadDex('workflow.dex');
 */
export async function loadDex(rawPath: string): Promise<LoadedWorkflow> {
  const filePath = resolveDexPath(rawPath);
  const parseResult = parse(filePath);
  const graph = DexGraph.fromParseResult(parseResult);
  return { filePath, parseResult, graph };
}
