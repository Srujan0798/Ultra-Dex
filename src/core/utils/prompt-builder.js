// Copyright (c) 2026 Ultra-Dex

/**
 * Prompt Builder Utility
 * Assembles prompts for the AI providers
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  USER_PROMPT_TEMPLATE,
  QUICK_START_PROMPT,
  CONTEXT_PROMPT,
} from '../templates/prompts/section-prompts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load the system prompt from file
 * @returns {Promise<string>}
 */
export async function loadSystemPrompt() {
  const promptPath = path.join(__dirname, '../templates/prompts/system-prompt.md');
  try {
    return await fs.readFile(promptPath, 'utf-8');
  } catch {
    // Fallback embedded prompt if file not found
    return `You are an expert SaaS architect. Generate a comprehensive 34-section implementation plan.
Be specific, production-ready, and thorough. Include code examples, time estimates, and realistic constraints.`;
  }
}

/**
 * Build the user prompt for implementation plan generation
 * @param {string} idea - The user's SaaS idea
 * @returns {string}
 */
export function buildImplementationPrompt(idea) {
  return USER_PROMPT_TEMPLATE.replace(/\{\{IDEA\}\}/g, idea);
}

/**
 * Build the prompt for QUICK-START.md generation
 * @returns {string}
 */
export function buildQuickStartPrompt() {
  return QUICK_START_PROMPT;
}

/**
 * Build the prompt for CONTEXT.md generation
 * @returns {string}
 */
export function buildContextPrompt() {
  return CONTEXT_PROMPT;
}

/**
 * Estimate token count for a string (rough approximation)
 * @param {string} text - Text to estimate
 * @returns {number} Estimated token count
 */
export function estimateTokens(text) {
  // Rough approximation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Calculate estimated cost for generation
 * @param {Object} provider - AI provider instance
 * @param {string} idea - User's idea
 * @returns {{inputTokens: number, outputTokens: number, cost: Object}}
 */
export function estimateGenerationCost(provider, idea) {
  // Estimate input: system prompt (~600 tokens) + user prompt (~2000 tokens) + idea
  const inputTokens = 2600 + estimateTokens(idea);

  // Estimate output: ~40,000 tokens for full 34-section plan
  const outputTokens = 40000;

  const cost = provider.estimateCost(inputTokens, outputTokens);

  return {
    inputTokens,
    outputTokens,
    cost,
  };
}

export default {
  loadSystemPrompt,
  buildImplementationPrompt,
  buildQuickStartPrompt,
  buildContextPrompt,
  estimateTokens,
  estimateGenerationCost,
};
