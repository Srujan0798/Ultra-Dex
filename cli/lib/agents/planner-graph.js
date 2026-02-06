// Copyright (c) 2026 Ultra-Dex

/**
 * Planner graph - breaks down goals into atomic tasks
 */

import { createSimpleGraph, runSimpleGraph } from './graph-utils.js';

const SYSTEM_PROMPT = `You are the Planner agent.
Break the user request into clear, atomic tasks (4-9 hour chunks).
Return a concise ordered list with acceptance criteria.`;

export function createPlannerGraph(options = {}) {
  return createSimpleGraph({
    ...options,
    nodeName: 'planner',
    systemPrompt: SYSTEM_PROMPT,
  });
}

export async function runPlannerGraph(input, options = {}) {
  return runSimpleGraph(createPlannerGraph, input, options);
}

export default { createPlannerGraph, runPlannerGraph };
