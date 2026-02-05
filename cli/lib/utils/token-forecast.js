/**
 * Token Budget Forecasting Utility
 * Estimates token usage before executing AI tasks
 */

// Average tokens per character for different content types
const TOKENS_PER_CHAR = {
    code: 0.35,
    markdown: 0.30,
    plain: 0.25,
    json: 0.40,
};

// Model context limits and costs (per 1K tokens)
const MODEL_SPECS = {
    'gpt-4': { contextLimit: 128000, inputCost: 0.03, outputCost: 0.06 },
    'gpt-4-turbo': { contextLimit: 128000, inputCost: 0.01, outputCost: 0.03 },
    'gpt-3.5-turbo': { contextLimit: 16385, inputCost: 0.0005, outputCost: 0.0015 },
    'claude-3-opus': { contextLimit: 200000, inputCost: 0.015, outputCost: 0.075 },
    'claude-3-sonnet': { contextLimit: 200000, inputCost: 0.003, outputCost: 0.015 },
    'claude-3-haiku': { contextLimit: 200000, inputCost: 0.00025, outputCost: 0.00125 },
    'gemini-pro': { contextLimit: 32000, inputCost: 0.00025, outputCost: 0.0005 },
    'gemini-1.5-pro': { contextLimit: 1000000, inputCost: 0.0007, outputCost: 0.0021 },
};

/**
 * Estimate tokens from text content
 */
export function estimateTokens(text, contentType = 'plain') {
    if (!text) return 0;
    const ratio = TOKENS_PER_CHAR[contentType] || TOKENS_PER_CHAR.plain;
    return Math.ceil(text.length * ratio);
}

/**
 * Estimate tokens for a code file
 */
export function estimateFileTokens(content, extension) {
    const codeExtensions = ['.js', '.ts', '.tsx', '.jsx', '.py', '.go', '.rs', '.rb', '.java', '.cpp', '.c'];
    const markdownExtensions = ['.md', '.mdx'];
    const jsonExtensions = ['.json', '.yaml', '.yml'];

    if (codeExtensions.some(ext => extension?.endsWith(ext))) {
        return estimateTokens(content, 'code');
    }
    if (markdownExtensions.some(ext => extension?.endsWith(ext))) {
        return estimateTokens(content, 'markdown');
    }
    if (jsonExtensions.some(ext => extension?.endsWith(ext))) {
        return estimateTokens(content, 'json');
    }

    return estimateTokens(content, 'plain');
}

/**
 * Forecast cost for a task
 */
export function forecastCost(inputTokens, estimatedOutputTokens, model = 'claude-3-sonnet') {
    const specs = MODEL_SPECS[model] || MODEL_SPECS['claude-3-sonnet'];

    const inputCost = (inputTokens / 1000) * specs.inputCost;
    const outputCost = (estimatedOutputTokens / 1000) * specs.outputCost;

    return {
        inputTokens,
        estimatedOutputTokens,
        totalTokens: inputTokens + estimatedOutputTokens,
        inputCost: Math.round(inputCost * 10000) / 10000,
        outputCost: Math.round(outputCost * 10000) / 10000,
        totalCost: Math.round((inputCost + outputCost) * 10000) / 10000,
        model,
        withinContext: (inputTokens + estimatedOutputTokens) <= specs.contextLimit,
        contextLimit: specs.contextLimit,
        utilizationPercent: Math.round((inputTokens / specs.contextLimit) * 100)
    };
}

/**
 * Forecast for common Ultra-Dex operations
 */
export function forecastOperation(operation, context = {}) {
    const forecasts = {
        'init': {
            inputTokens: 2000,
            outputTokens: 500,
            description: 'Project initialization'
        },
        'generate': {
            inputTokens: context.fileTokens || 3000,
            outputTokens: 2000,
            description: 'Code generation'
        },
        'review': {
            inputTokens: (context.fileTokens || 2000) + 1000,
            outputTokens: 1500,
            description: 'Code review'
        },
        'swarm': {
            inputTokens: (context.agentCount || 5) * 2000,
            outputTokens: (context.agentCount || 5) * 1000,
            description: 'Multi-agent swarm'
        },
        'plan': {
            inputTokens: 3000,
            outputTokens: 2500,
            description: 'Implementation planning'
        },
        'audit': {
            inputTokens: (context.fileCount || 10) * 500,
            outputTokens: 2000,
            description: 'Security audit'
        }
    };

    const forecast = forecasts[operation] || { inputTokens: 2000, outputTokens: 1000, description: 'Unknown operation' };
    const model = context.model || 'claude-3-sonnet';

    return {
        operation,
        ...forecast,
        ...forecastCost(forecast.inputTokens, forecast.outputTokens, model)
    };
}

/**
 * Format forecast for CLI display
 */
export function formatForecastDisplay(forecast) {
    const lines = [
        `📊 Token Budget Forecast: ${forecast.operation || 'Task'}`,
        ``,
        `  Input:    ~${forecast.inputTokens.toLocaleString()} tokens ($${forecast.inputCost})`,
        `  Output:   ~${forecast.estimatedOutputTokens.toLocaleString()} tokens ($${forecast.outputCost})`,
        `  Total:    ~${forecast.totalTokens.toLocaleString()} tokens ($${forecast.totalCost})`,
        ``,
        `  Model:    ${forecast.model}`,
        `  Context:  ${forecast.utilizationPercent}% of ${(forecast.contextLimit / 1000).toLocaleString()}K limit`,
    ];

    if (!forecast.withinContext) {
        lines.push(`  ⚠️  Warning: May exceed context limit!`);
    }

    return lines.join('\n');
}

/**
 * Budget limit checker
 */
export class TokenBudget {
    constructor(dailyLimit = 100000, costLimit = 5.00) {
        this.dailyLimit = dailyLimit;
        this.costLimit = costLimit;
        this.usedTokens = 0;
        this.usedCost = 0;
        this.history = [];
    }

    canExecute(forecast) {
        return (
            (this.usedTokens + forecast.totalTokens) <= this.dailyLimit &&
            (this.usedCost + forecast.totalCost) <= this.costLimit
        );
    }

    record(forecast) {
        this.usedTokens += forecast.totalTokens;
        this.usedCost += forecast.totalCost;
        this.history.push({
            ...forecast,
            timestamp: new Date().toISOString()
        });
    }

    getStatus() {
        return {
            usedTokens: this.usedTokens,
            remainingTokens: this.dailyLimit - this.usedTokens,
            usedCost: Math.round(this.usedCost * 10000) / 10000,
            remainingBudget: Math.round((this.costLimit - this.usedCost) * 10000) / 10000,
            operationCount: this.history.length
        };
    }

    reset() {
        this.usedTokens = 0;
        this.usedCost = 0;
        this.history = [];
    }
}

export default {
    estimateTokens,
    estimateFileTokens,
    forecastCost,
    forecastOperation,
    formatForecastDisplay,
    TokenBudget,
    MODEL_SPECS
};
