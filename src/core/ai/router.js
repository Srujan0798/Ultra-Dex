// Copyright (c) 2026 Ultra-Dex

/**
 * Meta-Layer Smart Router (v6.0.0)
 * Advanced Cost & Performance Optimization.
 */

const ROUTING_TABLE = {
  orchestrator: { reasoning: 'o1', balanced: 'claude-3-5-sonnet-latest', fast: 'gemini-2.0-flash' },
  architect: { reasoning: 'o1-preview', balanced: 'claude-3-5-sonnet-latest', fast: 'claude-3-haiku' },
  coder: { reasoning: 'deepseek-r1', balanced: 'gpt-4o', fast: 'gpt-4o-mini' },
  reviewer: { reasoning: 'claude-3-5-sonnet-latest', balanced: 'claude-3-5-sonnet-latest', fast: 'claude-3-haiku' },
  default: { reasoning: 'gpt-4o', balanced: 'claude-3-5-sonnet-latest', fast: 'gpt-4o-mini' }
};

export function selectModel(agentId, strategy = 'balanced') {
  const agent = agentId.toLowerCase();
  const config = ROUTING_TABLE[agent] || ROUTING_TABLE.default;
  return config[strategy] || config.balanced;
}

/**
 * FinOps: Estimate cost per million tokens (USD)
 */
export function estimateCost(model, inputTokens, outputTokens) {
  const rates = {
    'o1': { in: 15, out: 60 },
    'o1-preview': { in: 15, out: 60 },
    'deepseek-r1': { in: 0.55, out: 2.19 },
    'gpt-4o': { in: 2.5, out: 10 },
    'gpt-4o-mini': { in: 0.15, out: 0.6 },
    'claude-3-5-sonnet-latest': { in: 3, out: 15 },
    'claude-3-haiku': { in: 0.25, out: 1.25 },
    'gemini-2.0-flash': { in: 0.1, out: 0.4 }
  };
  
  const rate = rates[model] || rates['gpt-4o-mini'];
  return (inputTokens * rate.in + outputTokens * rate.out) / 1000000;
}
