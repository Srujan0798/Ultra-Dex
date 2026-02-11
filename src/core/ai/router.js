// Copyright (c) 2026 Ultra-Dex

/**
 * Smart Model Router
 * Cost/Performance optimization logic for model selection
 */
const ROUTING_TABLE = {
  architect: { high: 'claude-3-5-sonnet', low: 'claude-3-haiku' },
  coder: { high: 'gpt-4o', low: 'gpt-4o-mini' },
  reviewer: { high: 'claude-3-5-sonnet', low: 'claude-3-haiku' },
  debugger: { high: 'gpt-4o', low: 'gpt-4o-mini' },
  default: { high: 'gpt-4o', low: 'claude-3-haiku' }
};

export function selectModel(agentId, priority = 'low') {
  const agent = agentId.toLowerCase();
  const config = ROUTING_TABLE[agent] || ROUTING_TABLE.default;
  return config[priority];
}

export function estimateCost(model, inputTokens, outputTokens) {
  const rates = {
    'gpt-4o': { in: 5, out: 15 },
    'gpt-4o-mini': { in: 0.15, out: 0.6 },
    'claude-3-5-sonnet': { in: 3, out: 15 },
    'claude-3-haiku': { in: 0.25, out: 1.25 }
  };
  
  const rate = rates[model] || rates['claude-3-haiku'];
  return (inputTokens * rate.in + outputTokens * rate.out) / 1000000;
}