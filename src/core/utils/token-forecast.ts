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
import { logger } from './logging.js';
const TOKENS_PER_CHAR = {
  code: 0.35,
  markdown: 0.3,
  plain: 0.25,
  json: 0.4
};
const MODEL_SPECS = {
  "gpt-4": { contextLimit: 128e3, inputCost: 0.03, outputCost: 0.06 },
  "gpt-4-turbo": { contextLimit: 128e3, inputCost: 0.01, outputCost: 0.03 },
  "gpt-3.5-turbo": { contextLimit: 16385, inputCost: 5e-4, outputCost: 15e-4 },
  "claude-sonnet-5-20260201": { contextLimit: 2e5, inputCost: 3e-3, outputCost: 0.015 },
  sonnet5: { contextLimit: 2e5, inputCost: 3e-3, outputCost: 0.015 },
  fennec: { contextLimit: 2e5, inputCost: 3e-3, outputCost: 0.015 },
  "claude-3-opus": { contextLimit: 2e5, inputCost: 0.015, outputCost: 0.075 },
  "claude-3-sonnet": { contextLimit: 2e5, inputCost: 3e-3, outputCost: 0.015 },
  "claude-3-haiku": { contextLimit: 2e5, inputCost: 25e-5, outputCost: 125e-5 },
  "gemini-pro": { contextLimit: 32e3, inputCost: 25e-5, outputCost: 5e-4 },
  "gemini-1.5-pro": { contextLimit: 1e6, inputCost: 7e-4, outputCost: 21e-4 }
};
function estimateTokens(text, contentType = "plain") {
  if (!text)
    return 0;
  const ratio = TOKENS_PER_CHAR[contentType] || TOKENS_PER_CHAR.plain;
  return Math.ceil(text.length * ratio);
}
function estimateFileTokens(content, extension) {
  const codeExtensions = [
    ".js",
    ".ts",
    ".tsx",
    ".jsx",
    ".py",
    ".go",
    ".rs",
    ".rb",
    ".java",
    ".cpp",
    ".c"
  ];
  const markdownExtensions = [".md", ".mdx"];
  const jsonExtensions = [".json", ".yaml", ".yml"];
  if (codeExtensions.some((ext) => extension?.endsWith(ext))) {
    return estimateTokens(content, "code");
  }
  if (markdownExtensions.some((ext) => extension?.endsWith(ext))) {
    return estimateTokens(content, "markdown");
  }
  if (jsonExtensions.some((ext) => extension?.endsWith(ext))) {
    return estimateTokens(content, "json");
  }
  return estimateTokens(content, "plain");
}
function forecastCost(inputTokens, estimatedOutputTokens, model = "claude-3-sonnet") {
  const specs = MODEL_SPECS[model] || MODEL_SPECS["claude-3-sonnet"];
  const inputCost = inputTokens / 1e3 * specs.inputCost;
  const outputCost = estimatedOutputTokens / 1e3 * specs.outputCost;
  return {
    inputTokens,
    estimatedOutputTokens,
    totalTokens: inputTokens + estimatedOutputTokens,
    inputCost: Math.round(inputCost * 1e4) / 1e4,
    outputCost: Math.round(outputCost * 1e4) / 1e4,
    totalCost: Math.round((inputCost + outputCost) * 1e4) / 1e4,
    model,
    withinContext: inputTokens + estimatedOutputTokens <= specs.contextLimit,
    contextLimit: specs.contextLimit,
    utilizationPercent: Math.round(inputTokens / specs.contextLimit * 100)
  };
}
function forecastOperation(operation, context = {}) {
  const forecasts = {
    init: {
      inputTokens: 2e3,
      outputTokens: 500,
      description: "Project initialization"
    },
    generate: {
      inputTokens: context.fileTokens || 3e3,
      outputTokens: 2e3,
      description: "Code generation"
    },
    review: {
      inputTokens: (context.fileTokens || 2e3) + 1e3,
      outputTokens: 1500,
      description: "Code review"
    },
    swarm: {
      inputTokens: (context.agentCount || 5) * 2e3,
      outputTokens: (context.agentCount || 5) * 1e3,
      description: "Multi-agent swarm"
    },
    plan: {
      inputTokens: 3e3,
      outputTokens: 2500,
      description: "Implementation planning"
    },
    audit: {
      inputTokens: (context.fileCount || 10) * 500,
      outputTokens: 2e3,
      description: "Security audit"
    }
  };
  const forecast = forecasts[operation] || {
    inputTokens: 2e3,
    outputTokens: 1e3,
    description: "Unknown operation"
  };
  const model = context.model || "claude-3-sonnet";
  return {
    operation,
    ...forecast,
    ...forecastCost(forecast.inputTokens, forecast.outputTokens, model)
  };
}
function formatForecastDisplay(forecast) {
  const lines = [
    `\u{1F4CA} Token Budget Forecast: ${forecast.operation || "Task"}`,
    ``,
    `  Input:    ~${forecast.inputTokens.toLocaleString()} tokens ($${forecast.inputCost})`,
    `  Output:   ~${forecast.estimatedOutputTokens.toLocaleString()} tokens ($${forecast.outputCost})`,
    `  Total:    ~${forecast.totalTokens.toLocaleString()} tokens ($${forecast.totalCost})`,
    ``,
    `  Model:    ${forecast.model}`,
    `  Context:  ${forecast.utilizationPercent}% of ${(forecast.contextLimit / 1e3).toLocaleString()}K limit`
  ];
  if (!forecast.withinContext) {
    lines.push(`  \u26A0\uFE0F  Warning: May exceed context limit!`);
  }
  return lines.join("\n");
}
let TokenBudget = class {
  dailyLimit;
  costLimit;
  usedTokens;
  usedCost;
  history;
  constructor(dailyLimit = 1e5, costLimit = 5) {
    this.dailyLimit = dailyLimit;
    this.costLimit = costLimit;
    this.usedTokens = 0;
    this.usedCost = 0;
    this.history = [];
  }
  canExecute(forecast) {
    return this.usedTokens + forecast.totalTokens <= this.dailyLimit && this.usedCost + forecast.totalCost <= this.costLimit;
  }
  record(forecast) {
    this.usedTokens += forecast.totalTokens;
    this.usedCost += forecast.totalCost;
    this.history.push({
      ...forecast,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  getStatus() {
    return {
      usedTokens: this.usedTokens,
      remainingTokens: this.dailyLimit - this.usedTokens,
      usedCost: Math.round(this.usedCost * 1e4) / 1e4,
      remainingBudget: Math.round((this.costLimit - this.usedCost) * 1e4) / 1e4,
      operationCount: this.history.length
    };
  }
  reset() {
    this.usedTokens = 0;
    this.usedCost = 0;
    this.history = [];
  }
};
TokenBudget = __decorateClass([
  singleton()
], TokenBudget);
var token_forecast_default = {
  estimateTokens,
  estimateFileTokens,
  forecastCost,
  forecastOperation,
  formatForecastDisplay,
  TokenBudget,
  MODEL_SPECS
};
function _handleModuleError(error, context = "token-forecast") {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
  }
}
export {
  TokenBudget,
  token_forecast_default as default,
  estimateFileTokens,
  estimateTokens,
  forecastCost,
  forecastOperation,
  formatForecastDisplay
};
