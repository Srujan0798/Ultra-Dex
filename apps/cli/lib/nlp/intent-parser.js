// Copyright (c) 2026 Ultra-Dex

/**
 * NLP Intent Router
 * Maps natural language to CLI commands
 */
const INTENT_MAP = {
  '^init.*': 'init',
  '^start.*': 'init',
  '^create.*': 'generate',
  '^build.*': 'build',
  '^check.*': 'check',
  '^verify.*': 'verify',
  '^serve.*': 'serve',
  '^sync.*': 'sync',
  '^fix.*': 'autonomous --fix',
  '^what.*next': 'plan --timeline',
  '^status.*': 'status',
};

export function parseIntent(input) {
  const lower = input.toLowerCase().trim();
  
  for (const [pattern, command] of Object.entries(INTENT_MAP)) {
    if (new RegExp(pattern).test(lower)) {
      return command;
    }
  }

  // Fallback to "help" or similar if no match
  return null;
}