// Copyright (c) 2026 Ultra-Dex

/**
 * NLP Intent to Model Router Integration
 * Maps detected intents to appropriate AI models for execution
 */

import { routeIntent, extractParams, getIntentConfidence } from './router.js';

// Intent to task type mapping for model selection
const INTENT_TO_TASK_MAP = {
  // Code generation tasks
  init: 'code-generation',
  generate: 'code-generation',
  'code-gen': 'code-generation',
  scaffold: 'code-generation',
  create: 'code-generation',

  // Refactoring tasks
  refactor: 'refactoring',
  optimize: 'refactoring',
  improve: 'refactoring',
  format: 'refactoring',
  lint: 'refactoring',

  // Documentation tasks
  docs: 'documentation',
  document: 'documentation',
  explain: 'documentation',
  describe: 'documentation',

  // Analysis tasks
  audit: 'analysis',
  review: 'analysis',
  analyze: 'analysis',
  check: 'analysis',
  verify: 'analysis',
  quality: 'analysis',
  security: 'analysis',
  'reality-check': 'analysis',

  // Reasoning tasks
  plan: 'reasoning',
  'neuro-plan': 'reasoning',
  estimate: 'reasoning',
  design: 'reasoning',

  // Quick query tasks
  help: 'quick-query',
  search: 'quick-query',
  'vector-search': 'quick-query',
  config: 'quick-query',
  status: 'quick-query',
  version: 'quick-query',

  // Agent/Swarm tasks - use reasoning models
  agents: 'reasoning',
  swarm: 'reasoning',
  daemon: 'reasoning',
  ralph: 'reasoning',
  bot: 'code-generation',

  // Build/Test tasks - use code generation models
  build: 'code-generation',
  test: 'code-generation',
  compile: 'code-generation',

  // Deployment tasks - use reasoning models
  deploy: 'reasoning',
  docker: 'code-generation',
  k8s: 'code-generation',
  cicd: 'code-generation',

  // Integration tasks - varies
  github: 'quick-query',
  jira: 'quick-query',
  notion: 'documentation',
  trello: 'quick-query',
  mcp: 'quick-query',
  serve: 'quick-query',

  // Utility tasks
  setup: 'code-generation',
  install: 'quick-query',
  upgrade: 'refactoring',
  clean: 'refactoring',
  undo: 'refactoring',
  rollback: 'refactoring',

  // Monitoring tasks
  monitor: 'analysis',
  dashboard: 'quick-query',
  ledger: 'documentation',
  history: 'quick-query',
  memory: 'quick-query',
  brain: 'reasoning',
  sync: 'quick-query',

  // Governance tasks
  gate: 'analysis',
  governance: 'analysis',
  compliance: 'analysis',

  // Fallback
  default: 'quick-query',
};

/**
 * Map NLP intent to model router task type
 */
export function intentToTaskType(intent) {
  return INTENT_TO_TASK_MAP[intent] || INTENT_TO_TASK_MAP.default;
}

/**
 * Get recommended model for an NLP input
 * Returns: { taskType, preferredModels, fallbacks, confidence, intent, params }
 */
export function getModelForIntent(input) {
  const intent = routeIntent(input);

  if (!intent) {
    return {
      taskType: 'quick-query',
      preferredModels: ['claude-3-haiku', 'gpt-4o-mini'],
      fallbacks: ['gemini-1.5-flash'],
      confidence: 0,
      intent: null,
      params: {},
    };
  }

  const taskType = intentToTaskType(intent);
  const params = extractParams(intent, input);
  const { confidence } = getIntentConfidence(input);

  // Get model recommendations based on task type
  const modelRecommendation = getModelForTaskType(taskType);

  return {
    intent,
    taskType,
    params,
    confidence,
    preferredModels: modelRecommendation.preferred,
    fallbacks: modelRecommendation.fallbacks,
    description: modelRecommendation.description,
  };
}

/**
 * Get model configuration for a task type
 */
function getModelForTaskType(taskType) {
  // Default model configurations by task type
  const modelConfig = {
    'code-generation': {
      preferred: ['claude-3-5-sonnet', 'gpt-4o'],
      fallbacks: ['claude-3-opus', 'gemini-1.5-pro'],
      description: 'Code generation and implementation',
    },
    refactoring: {
      preferred: ['claude-3-5-sonnet', 'gpt-4o'],
      fallbacks: ['claude-3-opus'],
      description: 'Code refactoring and improvement',
    },
    documentation: {
      preferred: ['gemini-1.5-pro', 'claude-3-5-sonnet'],
      fallbacks: ['gpt-4o'],
      description: 'Documentation generation',
    },
    analysis: {
      preferred: ['claude-3-opus', 'gemini-1.5-pro'],
      fallbacks: ['claude-3-5-sonnet', 'gpt-4o'],
      description: 'Analysis and review',
    },
    reasoning: {
      preferred: ['claude-3-5-sonnet', 'claude-3-opus'],
      fallbacks: ['gemini-1.5-pro', 'gpt-4o'],
      description: 'Complex reasoning and planning',
    },
    'quick-query': {
      preferred: ['claude-3-haiku', 'gpt-4o-mini'],
      fallbacks: ['gemini-1.5-flash'],
      description: 'Quick queries and simple tasks',
    },
  };

  return modelConfig[taskType] || modelConfig['quick-query'];
}

/**
 * Enhance input with context for better model performance
 */
export function enhanceInputForModel(input, intent, params) {
  const context = {
    intent,
    params,
    timestamp: Date.now(),
  };

  // Add task-specific context
  const taskEnhancements = {
    'code-generation': (p) => {
      let enhancement = 'Generate clean, production-ready code.';
      if (p.stack) enhancement += ` Use ${p.stack} stack.`;
      if (p.projectName) enhancement += ` For project "${p.projectName}".`;
      return enhancement;
    },
    refactoring: (_p) => {
      return 'Refactor this code to improve readability, performance, and maintainability. Follow best practices.';
    },
    documentation: (_p) => {
      return 'Generate clear, comprehensive documentation. Include examples and usage instructions.';
    },
    analysis: (_p) => {
      return 'Analyze thoroughly and provide actionable insights. Identify potential issues and improvements.';
    },
    reasoning: (_p) => {
      return 'Think step-by-step. Consider edge cases and provide a well-reasoned solution.';
    },
  };

  const taskType = intentToTaskType(intent);
  const enhancer = taskEnhancements[taskType];

  if (enhancer) {
    context.enhancement = enhancer(params);
  }

  return {
    originalInput: input,
    enhancedInput: `${input}\n\n${context.enhancement || ''}`.trim(),
    context,
  };
}

/**
 * Log model selection for analytics
 */
export function logModelSelection(intent, taskType, model, confidence) {
  // This would integrate with the monitoring system
  // For now, just return the data for external logging
  return {
    event: 'model_selection',
    timestamp: Date.now(),
    data: {
      intent,
      taskType,
      model,
      confidence,
    },
  };
}

/**
 * Get cost estimate for an intent
 */
export function estimateIntentCost(input, tokenEstimate = 1000) {
  const { taskType, preferredModels } = getModelForIntent(input);

  // Model costs per 1K tokens
  const modelCosts = {
    'claude-3-opus': { input: 0.015, output: 0.075 },
    'claude-3-5-sonnet': { input: 0.003, output: 0.015 },
    'claude-3-haiku': { input: 0.00025, output: 0.00125 },
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gemini-1.5-pro': { input: 0.0035, output: 0.0105 },
    'gemini-1.5-flash': { input: 0.0007, output: 0.0021 },
  };

  const primaryModel = preferredModels[0];
  const costs = modelCosts[primaryModel] || { input: 0.001, output: 0.003 };

  // Estimate: 30% input tokens, 70% output tokens
  const inputTokens = tokenEstimate * 0.3;
  const outputTokens = tokenEstimate * 0.7;

  const estimatedCost = (inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output;

  return {
    taskType,
    model: primaryModel,
    tokenEstimate,
    estimatedCost: Math.round(estimatedCost * 10000) / 10000, // Round to 4 decimals
    currency: 'USD',
  };
}
