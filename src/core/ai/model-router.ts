var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
import { singleton } from "tsyringe";
import { printInfo, printSuccess, printError } from '../utils/output.js';
import { loadRouterConfigSync, resolveOverrides } from './router-config.js';
const MODEL_CONFIGS = {
  // Claude models
  "claude-3-opus": {
    provider: "anthropic",
    capabilities: ["complex-reasoning", "analysis", "long-context"],
    cost: { input: 0.015, output: 0.075 },
    // per 1K tokens
    maxTokens: 2e5,
    description: "Best for complex reasoning and analysis"
  },
  "claude-3-5-sonnet": {
    provider: "anthropic",
    capabilities: ["coding", "reasoning", "balanced"],
    cost: { input: 3e-3, output: 0.015 },
    maxTokens: 2e5,
    description: "Balanced model for coding and reasoning"
  },
  "claude-3-haiku": {
    provider: "anthropic",
    capabilities: ["quick-tasks", "simple-queries", "fast-response"],
    cost: { input: 25e-5, output: 125e-5 },
    maxTokens: 2e5,
    description: "Fast model for simple tasks"
  },
  // OpenAI models
  "gpt-4o": {
    provider: "openai",
    capabilities: ["coding", "multimodal", "balanced"],
    cost: { input: 5e-3, output: 0.015 },
    maxTokens: 128e3,
    description: "Great for coding and multimodal tasks"
  },
  "gpt-4o-mini": {
    provider: "openai",
    capabilities: ["quick-tasks", "simple-queries", "cost-effective"],
    cost: { input: 15e-5, output: 6e-4 },
    maxTokens: 128e3,
    description: "Cost-effective for simple tasks"
  },
  // Google models
  "gemini-1.5-pro": {
    provider: "google",
    capabilities: ["reasoning", "multimodal", "long-context"],
    cost: { input: 35e-4, output: 0.0105 },
    maxTokens: 2e6,
    description: "Good for reasoning and long context"
  },
  "gemini-1.5-flash": {
    provider: "google",
    capabilities: ["quick-tasks", "multimodal", "fast-response"],
    cost: { input: 7e-4, output: 21e-4 },
    maxTokens: 1e6,
    description: "Fast model for quick tasks"
  }
};
const ROUTING_TABLE = {
  "code-generation": {
    preferred: ["gpt-4o", "claude-3-5-sonnet"],
    fallbacks: ["claude-3-opus", "gemini-1.5-pro"],
    description: "Code generation tasks"
  },
  refactoring: {
    preferred: ["claude-3-5-sonnet", "gpt-4o"],
    fallbacks: ["claude-3-opus", "gemini-1.5-pro"],
    description: "Code refactoring tasks"
  },
  documentation: {
    preferred: ["gemini-1.5-pro", "claude-3-5-sonnet"],
    fallbacks: ["gpt-4o", "claude-3-opus"],
    description: "Documentation generation"
  },
  analysis: {
    preferred: ["claude-3-opus", "gemini-1.5-pro"],
    fallbacks: ["claude-3-5-sonnet", "gpt-4o"],
    description: "Complex analysis tasks"
  },
  "quick-query": {
    preferred: ["claude-3-haiku", "gpt-4o-mini"],
    fallbacks: ["gemini-1.5-flash"],
    description: "Simple queries and quick tasks"
  },
  reasoning: {
    preferred: ["claude-3-5-sonnet", "claude-3-opus"],
    fallbacks: ["gemini-1.5-pro", "gpt-4o"],
    description: "Logical reasoning tasks"
  },
  review: {
    preferred: ["claude-3-5-sonnet", "gpt-4o"],
    fallbacks: ["claude-3-opus", "gemini-1.5-pro"],
    description: "Code review tasks"
  }
};
const TASK_CLASSIFICATIONS = {
  "code-generation": [
    "write",
    "create",
    "implement",
    "build",
    "develop",
    "generate",
    "code",
    "function",
    "class",
    "method",
    "endpoint",
    "api",
    "component",
    "service",
    "module",
    "library",
    "framework"
  ],
  refactoring: [
    "refactor",
    "improve",
    "optimize",
    "clean",
    "simplify",
    "restructure",
    "modernize",
    "upgrade",
    "migrate",
    "transform",
    "reorganize",
    "consolidate",
    "extract"
  ],
  documentation: [
    "document",
    "explain",
    "describe",
    "summarize",
    "outline",
    "specify",
    "write-docs",
    "comment",
    "annotate",
    "spec",
    "manual",
    "guide",
    "tutorial",
    "readme",
    "api-docs"
  ],
  analysis: [
    "analyze",
    "evaluate",
    "assess",
    "review",
    "audit",
    "examine",
    "investigate",
    "study",
    "research",
    "compare",
    "benchmark",
    "profile",
    "debug"
  ],
  "quick-query": [
    "what",
    "how",
    "when",
    "where",
    "why",
    "define",
    "explain",
    "tell",
    "find",
    "search",
    "lookup",
    "calculate",
    "convert",
    "translate",
    "count",
    "list"
  ],
  reasoning: [
    "think",
    "consider",
    "reason",
    "infer",
    "deduce",
    "conclude",
    "justify",
    "argue",
    "evaluate",
    "assess",
    "judge",
    "determine",
    "decide",
    "solve"
  ],
  review: [
    "review",
    "check",
    "verify",
    "validate",
    "inspect",
    "examine",
    "critique",
    "feedback",
    "improve",
    "fix",
    "correct",
    "identify",
    "spot",
    "find-bugs"
  ]
};
const DEFAULT_CONFIG = {
  defaultModel: "gpt-4o-mini",
  enableFallback: true,
  maxRetries: 2,
  costThreshold: 0.1,
  // Max cost per request in USD
  performancePriority: "balanced",
  // 'speed', 'accuracy', 'cost', 'balanced'
  preferredProvider: null
  // Override to force specific provider
};
let ModelRouter = class {
  /**
   * Create a new ModelRouter
   * @param {Object} [config={}] - Router configuration overrides
   * @param {string} [config.defaultModel] - Default model ID
   * @param {boolean} [config.enableFallback] - Enable fallback models
   * @param {number} [config.maxRetries] - Max retry count
   * @param {number} [config.costThreshold] - Max cost per request in USD
   * @param {string} [config.performancePriority] - Priority: speed|accuracy|cost|balanced
   */
  constructor(config = {}) {
    this.routerConfig = loadRouterConfigSync();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.routingTable = { ...ROUTING_TABLE, ...this.routerConfig.routes || {} };
    this.taskClassifications = { ...TASK_CLASSIFICATIONS };
    this.modelConfigs = { ...MODEL_CONFIGS };
    this.overrides = Array.isArray(this.routerConfig.overrides) ? this.routerConfig.overrides : [];
    this.stats = {
      requests: 0,
      cost: 0,
      successes: 0,
      failures: 0
    };
  }
  /**
   * Determine the best model for a given task
   * @param {string} taskDescription - Description of the task
   * @param {Object} [options={}] - Routing options
   * @param {string} [options.strategy] - Routing strategy name
   * @returns {{model: string, taskType: string, routingConfig: Object, confidence: number, reason: string}}
   */
  determineModel(taskDescription, options = {}) {
    this.stats.requests++;
    const taskType = this.classifyTask(taskDescription);
    const override = resolveOverrides(taskDescription, this.overrides);
    if (override?.model) {
      return {
        model: override.model,
        taskType,
        routingConfig: { preferred: [override.model], fallbacks: [] },
        confidence: 0.9,
        reason: `Override rule matched keyword "${override.keyword}"`
      };
    }
    const routingConfig = this.routingTable[taskType] || this.routingTable["quick-query"];
    let candidateModels = [...routingConfig.preferred];
    const strategy = options.strategy || options.profile;
    if (strategy && this.routerConfig.strategies?.[strategy]) {
      const strategyConfig = this.routerConfig.strategies[strategy];
      if (strategyConfig?.defaultModel) {
        candidateModels.unshift(strategyConfig.defaultModel);
      }
      if (strategyConfig?.performancePriority) {
        this.config.performancePriority = strategyConfig.performancePriority;
      }
    }
    if (this.config.enableFallback) {
      candidateModels = [...candidateModels, ...routingConfig.fallbacks];
    }
    candidateModels = this.filterModels(candidateModels, options);
    const selectedModel = this.selectModelByPriority(candidateModels, options);
    const modelConfig = this.modelConfigs[selectedModel];
    if (modelConfig) {
      this.stats.cost += (modelConfig.cost.input + modelConfig.cost.output) * 1e-3;
    }
    return {
      model: selectedModel,
      taskType,
      routingConfig,
      confidence: this.calculateConfidence(selectedModel, taskType),
      reason: `Selected ${selectedModel} for ${taskType} task based on routing table`
    };
  }
  /**
   * Classify a task based on description keywords
   * @param {string} taskDescription - Task description
   * @returns {string} Best matching task type
   */
  classifyTask(taskDescription) {
    const lowerDesc = taskDescription.toLowerCase();
    const scores = {};
    for (const [taskType, keywords] of Object.entries(this.taskClassifications)) {
      let score = 0;
      for (const keyword of keywords) {
        if (lowerDesc.includes(keyword)) {
          score++;
        }
      }
      scores[taskType] = score;
    }
    let bestType = "quick-query";
    let bestScore = 0;
    for (const [taskType, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestType = taskType;
      }
    }
    if (bestScore === 0) {
      bestType = "quick-query";
    }
    return bestType;
  }
  /**
   * Filter models based on provider and cost options
   * @param {string[]} models - Candidate model IDs
   * @param {Object} options - Filter options
   * @returns {string[]} Filtered model IDs
   */
  filterModels(models, options) {
    return models.filter((modelId) => {
      const config = this.modelConfigs[modelId];
      if (!config)
        return false;
      if (this.config.preferredProvider && config.provider !== this.config.preferredProvider) {
        return false;
      }
      const avgCost = (config.cost.input + config.cost.output) / 2;
      if (avgCost > this.config.costThreshold) {
        return false;
      }
      return true;
    });
  }
  /**
   * Select model based on performance priority
   * @param {string[]} models - Candidate model IDs
   * @param {Object} options - Selection options
   * @returns {string} Selected model ID
   */
  selectModelByPriority(models, options) {
    if (models.length === 0) {
      return this.config.defaultModel;
    }
    switch (this.config.performancePriority) {
      case "speed":
        return models.sort((a, b) => {
          const configA = this.modelConfigs[a];
          const configB = this.modelConfigs[b];
          return configA.cost.input + configA.cost.output - (configB.cost.input + configB.cost.output);
        })[0];
      case "accuracy":
        return models.sort((a, b) => {
          const configA = this.modelConfigs[a];
          const configB = this.modelConfigs[b];
          return configB.cost.input + configB.cost.output - (configA.cost.input + configA.cost.output);
        })[0];
      case "cost":
        return models.sort((a, b) => {
          const configA = this.modelConfigs[a];
          const configB = this.modelConfigs[b];
          const costA = configA.cost.input + configA.cost.output;
          const costB = configB.cost.input + configB.cost.output;
          return costA - costB;
        })[0];
      case "balanced":
      default:
        return models[0];
    }
  }
  /**
   * Calculate confidence in model selection
   * @param {string} model - Model ID
   * @param {string} taskType - Task classification
   * @returns {number} Confidence score 0-1
   */
  calculateConfidence(model, taskType) {
    const routingConfig = this.routingTable[taskType];
    if (!routingConfig)
      return 0.5;
    const position = [...routingConfig.preferred, ...routingConfig.fallbacks].indexOf(model);
    if (position === -1)
      return 0.1;
    if (position < routingConfig.preferred.length) {
      return 0.9 - position * 0.1;
    } else {
      return 0.6 - (position - routingConfig.preferred.length) * 0.1;
    }
  }
  /**
   * Estimate cost for a task
   * @param {string} model - Model ID
   * @param {number} [inputTokens=1000] - Estimated input tokens
   * @param {number} [outputTokens=500] - Estimated output tokens
   * @returns {number} Estimated cost in USD
   */
  estimateCost(model, inputTokens = 1e3, outputTokens = 500) {
    const config = this.modelConfigs[model];
    if (!config)
      return 0;
    const inputCost = inputTokens / 1e3 * config.cost.input;
    const outputCost = outputTokens / 1e3 * config.cost.output;
    return inputCost + outputCost;
  }
  /**
   * Get router statistics
   * @returns {{requests: number, cost: number, successes: number, failures: number}}
   */
  getStats() {
    return { ...this.stats };
  }
  /**
   * Reset router statistics
   */
  resetStats() {
    this.stats = {
      requests: 0,
      cost: 0,
      successes: 0,
      failures: 0
    };
  }
  /**
   * Update routing table dynamically
   * @param {string} taskType - Task type key
   * @param {Object} config - New routing config for this task
   */
  updateRouting(taskType, config) {
    this.routingTable[taskType] = { ...this.routingTable[taskType], ...config };
  }
  /**
   * Get available models for a task type
   * @param {string} taskType - Task type key
   * @returns {string[]} Model IDs
   */
  getModelsForTask(taskType) {
    const routingConfig = this.routingTable[taskType];
    if (!routingConfig)
      return [];
    return [...routingConfig.preferred, ...routingConfig.fallbacks];
  }
};
ModelRouter = __decorateClass([
  singleton()
], ModelRouter);
const modelRouter = new ModelRouter();
function registerModelRouterCommand(program) {
  const routerCmd = program.command("model-router").alias("router").description("AI model routing configuration");
  routerCmd.command("route").description("Route a task to the best model").argument("<task>", "Task description").option("-p, --priority <priority>", "Priority (speed|accuracy|cost|balanced)", "balanced").option("-v, --verbose", "Show detailed routing information").action(async (task, options) => {
    try {
      printInfo(`\u{1F916} Routing task: "${task}"`);
      if (options.priority) {
        modelRouter.config.performancePriority = options.priority;
      }
      const result = modelRouter.determineModel(task);
      printSuccess(`\u2705 Selected model: ${result.model}`);
      printInfo(`Task type: ${result.taskType}`);
      printInfo(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      printInfo(`Reason: ${result.reason}`);
      if (options.verbose) {
        printInfo(`Routing config: ${JSON.stringify(result.routingConfig, null, 2)}`);
      }
      const costEstimate = modelRouter.estimateCost(result.model);
      printInfo(`Estimated cost: $${costEstimate.toFixed(4)} per request`);
    } catch (error) {
      printError(`Model routing failed: ${error.message}`);
    }
  });
  routerCmd.command("list").description("List all available models and their capabilities").action(() => {
    printInfo("\u{1F4DA} Available AI Models:\n");
    for (const [modelId, config] of Object.entries(modelRouter.modelConfigs)) {
      printSuccess(`${modelId} (${config.provider})`);
      printInfo(`  Capabilities: ${config.capabilities.join(", ")}`);
      printInfo(`  Cost: $${config.cost.input}/inputK + $${config.cost.output}/outputK`);
      printInfo(`  Max Tokens: ${config.maxTokens}`);
      printInfo(`  Description: ${config.description}
`);
    }
  });
  routerCmd.command("table").description("Show routing table").action(() => {
    printInfo("\u{1F4CB} Model Routing Table:\n");
    for (const [taskType, config] of Object.entries(modelRouter.routingTable)) {
      printSuccess(`${taskType}:`);
      printInfo(`  Preferred: ${config.preferred.join(", ")}`);
      printInfo(`  Fallbacks: ${config.fallbacks.join(", ")}`);
      printInfo(`  Description: ${config.description}
`);
    }
  });
  routerCmd.command("stats").description("Show router statistics").action(() => {
    const stats = modelRouter.getStats();
    printSuccess("\u{1F4CA} Model Router Statistics:");
    printInfo(`  Requests: ${stats.requests}`);
    printInfo(`  Estimated Cost: $${stats.cost.toFixed(4)}`);
    printInfo(`  Successes: ${stats.successes}`);
    printInfo(`  Failures: ${stats.failures}`);
  });
  routerCmd._examples = [
    {
      command: 'ultra-dex model-router route "Write a React component"',
      description: "Route code generation task"
    },
    {
      command: 'ultra-dex model-router route "Explain quantum computing" --priority accuracy',
      description: "Route with accuracy priority"
    },
    { command: "ultra-dex model-router list", description: "List all available models" },
    { command: "ultra-dex model-router table", description: "Show routing table" },
    { command: "ultra-dex model-router stats", description: "Show router statistics" }
  ];
}
var model_router_default = {
  ModelRouter,
  modelRouter,
  MODEL_CONFIGS,
  ROUTING_TABLE,
  TASK_CLASSIFICATIONS,
  DEFAULT_CONFIG,
  registerModelRouterCommand
};
export {
  ModelRouter,
  model_router_default as default,
  modelRouter,
  registerModelRouterCommand
};
