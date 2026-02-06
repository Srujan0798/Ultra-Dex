// Copyright (c) 2026 Ultra-Dex

/**
 * Executor graph - converts tasks into actionable steps
 */

import { createSimpleGraph, runSimpleGraph } from './graph-utils.js';

const SYSTEM_PROMPT = `You are the Executor agent.
Convert the plan into step-by-step execution instructions.
Return actionable steps with commands or file changes where possible.`;

export function createExecutorGraph(options = {}) {
  return createSimpleGraph({
    ...options,
    nodeName: 'executor',
    systemPrompt: SYSTEM_PROMPT,
  });
}

export async function runExecutorGraph(input, options = {}) {
  return runSimpleGraph(createExecutorGraph, input, options);
}

export default { createExecutorGraph, runExecutorGraph };
