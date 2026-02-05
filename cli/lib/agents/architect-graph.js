/**
 * Architect graph - produces high-level system design guidance
 */

import { createSimpleGraph, runSimpleGraph } from './graph-utils.js';

const SYSTEM_PROMPT = `You are the Architect agent.
Design a high-level system architecture based on the input.
Return components, data flow, and key design decisions.`;

export function createArchitectGraph(options = {}) {
  return createSimpleGraph({
    ...options,
    nodeName: 'architect',
    systemPrompt: SYSTEM_PROMPT
  });
}

export async function runArchitectGraph(input, options = {}) {
  return runSimpleGraph(createArchitectGraph, input, options);
}

export default { createArchitectGraph, runArchitectGraph };
