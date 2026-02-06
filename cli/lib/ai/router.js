// Copyright (c) 2026 Ultra-Dex

/**
 * AI Model Router
 * Algorithm to select best model per task
 */

import chalk from 'chalk';

// Model configurations
const MODEL_CONFIGS = {
  // Claude models
  'claude-3-opus': {
    provider: 'anthropic',
    capabilities: ['complex-reasoning', 'long-context', 'analysis'],
    cost: { input: 0.015, output: 0.075 }, // per 1K tokens
    maxTokens: 200000,
    description: 'Best for complex reasoning and analysis',
  },
  'claude-3-5-sonnet': {
    provider: 'anthropic',
    capabilities: ['coding', 'reasoning', 'balanced'],
    cost: { input: 0.003, output: 0.015 },
    maxTokens: 200000,
    description: 'Balanced model for coding and reasoning',
  },
  'claude-3-haiku': {
    provider: 'anthropic',
    capabilities: ['quick-tasks', 'simple-queries', 'fast-response'],
    cost: { input: 0.00025, output: 0.00125 },
    maxTokens: 200000,
    description: 'Fast model for simple tasks',
  },

  // OpenAI models
  'gpt-4o': {
    provider: 'openai',
    capabilities: ['coding', 'multimodal', 'balanced'],
    cost: { input: 0.005, output: 0.015 },
    maxTokens: 128000,
    description: 'Great for coding and multimodal tasks',
  },
  'gpt-4o-mini': {
    provider: 'openai',
    capabilities: ['quick-tasks', 'simple-queries', 'cost-effective'],
    cost: { input: 0.00015, output: 0.0006 },
    maxTokens: 128000,
    description: 'Cost-effective for simple tasks',
  },

  // Google models
  'gemini-1.5-pro': {
    provider: 'google',
    capabilities: ['reasoning', 'multimodal', 'long-context'],
    cost: { input: 0.0035, output: 0.0105 },
    maxTokens: 2000000,
    description: 'Good for reasoning and long context',
  },
  'gemini-1.5-flash': {
    provider: 'google',
    capabilities: ['quick-tasks', 'multimodal', 'fast-response'],
    cost: { input: 0.0007, output: 0.0021 },
    maxTokens: 1000000,
    description: 'Fast model for quick tasks',
  },
};

// Task classification keywords
const TASK_KEYWORDS = {
  'complex-reasoning': [
    'analyze',
    'analyze',
    'evaluate',
    'compare',
    'strategy',
    'plan',
    'design',
    'architecture',
    'research',
    'investigate',
    'assess',
  ],
  coding: [
    'code',
    'implement',
    'develop',
    'create',
    'build',
    'fix',
    'debug',
    'refactor',
    'optimize',
    'test',
    'deploy',
    'configure',
  ],
  'quick-fixes': [
    'fix',
    'correct',
    'update',
    'change',
    'modify',
    'adjust',
    'tweak',
    'patch',
    'repair',
    'solve',
    'resolve',
    'address',
  ],
  documentation: [
    'document',
    'write',
    'explain',
    'summarize',
    'describe',
    'outline',
    'draft',
    'compose',
    'author',
    'create-docs',
  ],
  review: [
    'review',
    'check',
    'verify',
    'validate',
    'audit',
    'inspect',
    'examine',
    'assess',
    'critique',
    'feedback',
    'improve',
  ],
};

/**
 * Determine the best model for a given task
 * @param {string} taskDescription - Description of the task
 * @param {Object} options - Additional options
 * @returns {Object} Selected model and reasoning
 */
export function determineBestModel(taskDescription, options = {}) {
  const {
    preferredProvider = null,
    maxCost = null,
    minPerformance = null,
    taskType = null,
  } = options;

  // Classify the task
  const taskClassification = classifyTask(taskDescription);

  // Find candidate models based on task classification
  let candidates = Object.entries(MODEL_CONFIGS)
    .filter(([_, config]) => {
      // Check if model has capability for this task type
      return config.capabilities.some(
        (cap) => taskClassification.includes(cap) || cap === taskType
      );
    })
    .map(([modelId, config]) => ({
      modelId,
      config,
      score: calculateModelScore(modelId, config, taskDescription, taskClassification),
    }));

  // Apply filters
  if (preferredProvider) {
    candidates = candidates.filter((candidate) => candidate.config.provider === preferredProvider);
  }

  if (maxCost) {
    candidates = candidates.filter((candidate) => {
      const estimatedCost = estimateTaskCost(candidate.modelId, taskDescription);
      return estimatedCost <= maxCost;
    });
  }

  // Sort by score (higher is better)
  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    // Fallback to a general-purpose model
    return {
      modelId: 'gpt-4o-mini',
      config: MODEL_CONFIGS['gpt-4o-mini'],
      reasoning: 'No suitable models found, falling back to cost-effective general model',
      confidence: 'low',
    };
  }

  const bestCandidate = candidates[0];

  return {
    modelId: bestCandidate.modelId,
    config: bestCandidate.config,
    reasoning: generateReasoning(bestCandidate, taskDescription, taskClassification),
    confidence: calculateConfidence(bestCandidate.score),
    alternatives: candidates.slice(1, 4).map((c) => ({
      modelId: c.modelId,
      config: c.config,
      score: c.score,
    })),
  };
}

/**
 * Classify the task based on keywords
 */
function classifyTask(taskDescription) {
  const lowerDesc = taskDescription.toLowerCase();
  const classifications = [];

  for (const [capability, keywords] of Object.entries(TASK_KEYWORDS)) {
    if (keywords.some((keyword) => lowerDesc.includes(keyword))) {
      classifications.push(capability);
    }
  }

  // If no specific classification, use general
  if (classifications.length === 0) {
    classifications.push('general');
  }

  return classifications;
}

/**
 * Calculate a score for how well a model fits the task
 */
function calculateModelScore(modelId, config, taskDescription, taskClassification) {
  let score = 0;

  // Boost score for matching capabilities
  for (const capability of taskClassification) {
    if (config.capabilities.includes(capability)) {
      score += 10;
    }
  }

  // Consider cost effectiveness
  const avgCost = (config.cost.input + config.cost.output) / 2;
  if (avgCost < 0.001)
    score += 5; // Very cheap
  else if (avgCost < 0.01)
    score += 2; // Cheap
  else if (avgCost > 0.05) score -= 3; // Expensive

  // Consider context length if relevant
  if (taskDescription.length > 1000 && config.maxTokens > 100000) {
    score += 3; // Good for long tasks
  }

  // Specific model boosts
  if (modelId.includes('opus') && taskClassification.includes('complex-reasoning')) {
    score += 5;
  } else if (modelId.includes('sonnet') && taskClassification.includes('coding')) {
    score += 5;
  } else if (modelId.includes('haiku') || modelId.includes('mini')) {
    // Boost for quick tasks
    if (
      taskClassification.some(
        (cat) => cat.includes('quick') || cat.includes('simple') || cat.includes('fast')
      )
    ) {
      score += 5;
    }
  }

  return score;
}

/**
 * Generate reasoning for model selection
 */
function generateReasoning(candidate, taskDescription, taskClassification) {
  const reasons = [];

  // Capability match
  const matchingCapabilities = taskClassification.filter((cap) =>
    candidate.config.capabilities.includes(cap)
  );

  if (matchingCapabilities.length > 0) {
    reasons.push(`Matches required capabilities: ${matchingCapabilities.join(', ')}`);
  }

  // Cost consideration
  const estimatedCost = estimateTaskCost(candidate.modelId, taskDescription);
  if (estimatedCost < 0.01) {
    reasons.push('Cost-effective option');
  } else if (estimatedCost > 0.1) {
    reasons.push('Higher cost but necessary for task complexity');
  }

  // Performance consideration
  reasons.push(`${candidate.config.description}`);

  return reasons.join('; ');
}

/**
 * Calculate confidence level
 */
function calculateConfidence(score) {
  if (score >= 15) return 'high';
  if (score >= 8) return 'medium';
  return 'low';
}

/**
 * Estimate task cost
 */
function estimateTaskCost(modelId, taskDescription) {
  const config = MODEL_CONFIGS[modelId];
  if (!config) return 0;

  // Rough estimation: 1000 tokens input + 500 tokens output
  const inputTokens = Math.min(taskDescription.length / 4, 1000); // Rough char to token conversion
  const outputTokens = 500; // Estimated output

  const inputCost = (inputTokens / 1000) * config.cost.input;
  const outputCost = (outputTokens / 1000) * config.cost.output;

  return inputCost + outputCost;
}

/**
 * Get model recommendation with cost/performance optimization
 */
export function getModelRecommendation(taskDescription, options = {}) {
  const recommendation = determineBestModel(taskDescription, options);

  return {
    ...recommendation,
    costEstimate: estimateTaskCost(recommendation.modelId, taskDescription),
    performanceEstimate: estimatePerformance(recommendation.modelId, taskDescription),
  };
}

/**
 * Estimate performance based on model characteristics
 */
function estimatePerformance(modelId, taskDescription) {
  const config = MODEL_CONFIGS[modelId];
  if (!config) return 'unknown';

  // Performance estimation based on model type and task
  if (config.capabilities.includes('complex-reasoning')) {
    return 'high';
  } else if (config.capabilities.includes('quick-tasks')) {
    return 'fast';
  } else {
    return 'balanced';
  }
}

/**
 * Register model router command
 */
export function registerModelRouterCommand(program) {
  const routerCmd = program
    .command('route')
    .alias('model-route')
    .description('Route tasks to optimal AI models');

  routerCmd
    .command('recommend')
    .description('Get model recommendation for a task')
    .argument('<task>', 'Task description')
    .option('-p, --provider <provider>', 'Preferred provider (anthropic, openai, google)')
    .option('-c, --max-cost <cost>', 'Maximum cost in USD', parseFloat)
    .option('-t, --type <type>', 'Explicit task type')
    .action(async (task, options) => {
      try {
        console.log(chalk.cyan(`\n🤖 AI Model Router\n`));
        console.log(chalk.gray(`Task: ${task}\n`));

        const recommendation = getModelRecommendation(task, {
          preferredProvider: options.provider,
          maxCost: options.maxCost,
          taskType: options.type,
        });

        console.log(chalk.green(`✅ Recommended Model: ${recommendation.modelId}`));
        console.log(chalk.gray(`Provider: ${recommendation.config.provider}`));
        console.log(chalk.gray(`Capabilities: ${recommendation.config.capabilities.join(', ')}`));
        console.log(chalk.gray(`Estimated Cost: $${recommendation.costEstimate.toFixed(4)}`));
        console.log(chalk.gray(`Estimated Performance: ${recommendation.performanceEstimate}`));
        console.log(chalk.gray(`Confidence: ${recommendation.confidence}`));
        console.log(chalk.gray(`Reasoning: ${recommendation.reasoning}`));

        if (recommendation.alternatives.length > 0) {
          console.log(chalk.yellow(`\nAlternative Models:`));
          recommendation.alternatives.forEach((alt, idx) => {
            console.log(
              chalk.gray(
                `  ${idx + 1}. ${alt.modelId} (${alt.config.provider}) - Score: ${alt.score.toFixed(2)}`
              )
            );
          });
        }
      } catch (error) {
        console.error(chalk.red(`Error routing model: ${error.message}`));
      }
    });

  routerCmd
    .command('list')
    .description('List all available models')
    .action(() => {
      console.log(chalk.cyan(`\n📚 Available AI Models:\n`));

      for (const [modelId, config] of Object.entries(MODEL_CONFIGS)) {
        console.log(chalk.green(`${modelId} (${config.provider})`));
        console.log(chalk.gray(`  Capabilities: ${config.capabilities.join(', ')}`));
        console.log(
          chalk.gray(`  Cost: $${config.cost.input}/inputK + $${config.cost.output}/outputK`)
        );
        console.log(chalk.gray(`  Max Tokens: ${config.maxTokens}`));
        console.log(chalk.gray(`  Description: ${config.description}\n`));
      }
    });

  routerCmd._examples = [
    {
      command: 'ultra-dex route recommend "Analyze our system architecture"',
      description: 'Get model recommendation for analysis',
    },
    {
      command: 'ultra-dex route recommend "Fix this bug in auth.ts" --type quick-fixes',
      description: 'Get model for quick fixes',
    },
    {
      command: 'ultra-dex route recommend "Write documentation for API" --provider openai',
      description: 'Get OpenAI model for docs',
    },
    { command: 'ultra-dex route list', description: 'List all available models' },
  ];
}

export default {
  determineBestModel,
  getModelRecommendation,
  registerModelRouterCommand,
  MODEL_CONFIGS,
};
