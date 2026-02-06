// Copyright (c) 2026 Ultra-Dex

/**
 * Reviewer graph - audits code for quality and risks
 */

import { createSimpleGraph, runSimpleGraph } from './graph-utils.js';

const SYSTEM_PROMPT = `You are the Reviewer agent.
Review the input for bugs, security issues, performance risks, and style problems.
Return a concise list of findings and suggested fixes.`;

export function createReviewerGraph(options = {}) {
  return createSimpleGraph({
    ...options,
    nodeName: 'reviewer',
    systemPrompt: SYSTEM_PROMPT,
  });
}

export async function runReviewerGraph(input, options = {}) {
  return runSimpleGraph(createReviewerGraph, input, options);
}

export default { createReviewerGraph, runReviewerGraph };
