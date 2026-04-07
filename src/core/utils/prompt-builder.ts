import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  USER_PROMPT_TEMPLATE,
  QUICK_START_PROMPT,
  CONTEXT_PROMPT
} from '../templates/prompts/section-prompts.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function loadSystemPrompt() {
  const promptPath = path.join(__dirname, "../templates/prompts/system-prompt.md");
  try {
    return await fs.readFile(promptPath, "utf-8");
  } catch {
    return `You are an expert SaaS architect. Generate a comprehensive 34-section implementation plan.
Be specific, production-ready, and thorough. Include code examples, time estimates, and realistic constraints.`;
  }
}
function buildImplementationPrompt(idea) {
  return USER_PROMPT_TEMPLATE.replace(/\{\{IDEA\}\}/g, idea);
}
function buildQuickStartPrompt() {
  return QUICK_START_PROMPT;
}
function buildContextPrompt() {
  return CONTEXT_PROMPT;
}
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}
function estimateGenerationCost(provider, idea) {
  const inputTokens = 2600 + estimateTokens(idea);
  const outputTokens = 4e4;
  const cost = provider.estimateCost(inputTokens, outputTokens);
  return {
    inputTokens,
    outputTokens,
    cost
  };
}
var prompt_builder_default = {
  loadSystemPrompt,
  buildImplementationPrompt,
  buildQuickStartPrompt,
  buildContextPrompt,
  estimateTokens,
  estimateGenerationCost
};
export {
  buildContextPrompt,
  buildImplementationPrompt,
  buildQuickStartPrompt,
  prompt_builder_default as default,
  estimateGenerationCost,
  estimateTokens,
  loadSystemPrompt
};
