import { EventEmitter } from 'events';
import crypto from 'crypto';
class TokenOptimizer extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      maxCacheSize: config.maxCacheSize || 1e3,
      cacheTTL: config.cacheTTL || 36e5,
      // 1 hour
      compressionEnabled: config.compressionEnabled !== false,
      dedupEnabled: config.dedupEnabled !== false,
      budgetLimit: config.budgetLimit || null,
      // Daily budget in USD
      warnThreshold: config.warnThreshold || 0.8,
      // Warn at 80% of budget
      ...config,
    };
    this.cache = /* @__PURE__ */ new Map();
    this.usageStats = {
      totalTokens: 0,
      totalCost: 0,
      dailyTokens: /* @__PURE__ */ new Map(),
      dailyCost: /* @__PURE__ */ new Map(),
      providerUsage: /* @__PURE__ */ new Map(),
    };
    this.compressionCache = /* @__PURE__ */ new Map();
    this.dedupIndex = /* @__PURE__ */ new Map();
    this.initialized = false;
  }
  /**
   * Initialize token optimizer
   */
  async initialize() {
    this._startCleanupJob();
    this._scheduleDailyReset();
    this.initialized = true;
    this.emit('initialized');
    return true;
  }
  /**
   * Check cache for identical or similar request
   * @param {Object} request - Request object
   * @returns {Object|null} Cached result or null
   */
  checkCache(request) {
    const hash = this._hashRequest(request);
    const cached = this.cache.get(hash);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > this.config.cacheTTL) {
      this.cache.delete(hash);
      return null;
    }
    this.emit('cache:hit', { hash, savings: cached.tokens });
    return {
      result: cached.result,
      tokens: cached.tokens,
      cost: cached.cost,
      fromCache: true,
    };
  }
  /**
   * Store result in cache
   * @param {Object} request - Request object
   * @param {Object} result - Result to cache
   * @param {Object} metrics - Token metrics
   */
  storeCache(request, result, metrics) {
    const hash = this._hashRequest(request);
    if (this.cache.size >= this.config.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(hash, {
      result: this._cloneResult(result),
      tokens: metrics.tokens || 0,
      cost: metrics.cost || 0,
      timestamp: Date.now(),
    });
    this.emit('cache:store', { hash, tokens: metrics.tokens });
  }
  /**
   * Compress context to reduce token usage
   * @param {Array<Object>} messages - Chat messages
   * @param {Object} options - Compression options
   * @returns {Array<Object>} Compressed messages
   */
  compressContext(messages, options = {}) {
    if (!this.config.compressionEnabled) return messages;
    const {
      maxTokens = 4e3,
      preserveRecent = 3,
      // Keep N most recent messages uncompressed
      compressionLevel = 'medium',
      // 'low', 'medium', 'high'
    } = options;
    let totalTokens = this._estimateTokens(messages);
    if (totalTokens <= maxTokens) {
      return messages;
    }
    const recent = messages.slice(-preserveRecent);
    let toCompress = messages.slice(0, -preserveRecent);
    const compressed = this._compressMessages(toCompress, compressionLevel);
    const result = [
      {
        role: 'system',
        content: `[Previous ${toCompress.length} messages compressed]
${compressed.summary}`,
      },
      ...recent,
    ];
    const savings = totalTokens - this._estimateTokens(result);
    this.emit('compression:applied', {
      original: totalTokens,
      compressed: this._estimateTokens(result),
      savings,
    });
    return result;
  }
  /**
   * Check for duplicate/similar requests
   * @param {Object} request - Request object
   * @returns {Object|null} Similar cached request
   */
  checkDuplicate(request) {
    if (!this.config.dedupEnabled) return null;
    const hash = this._hashRequest(request);
    const recent = Array.from(this.cache.entries())
      .filter(([_, v]) => Date.now() - v.timestamp < 6e4)
      .map(([k, v]) => ({ hash: k, ...v }));
    const duplicate = recent.find((r) => r.hash === hash);
    if (duplicate) {
      this.emit('dedup:found', { hash, savings: duplicate.tokens });
      return duplicate;
    }
    return null;
  }
  /**
   * Track token usage
   * @param {Object} metrics - Usage metrics
   */
  trackUsage(metrics) {
    const { tokens, cost, provider, model, cached = false } = metrics;
    if (cached) return;
    this.usageStats.totalTokens += tokens;
    this.usageStats.totalCost += cost;
    const today = /* @__PURE__ */ new Date().toISOString().split('T')[0];
    const dailyTokens = this.usageStats.dailyTokens.get(today) || 0;
    this.usageStats.dailyTokens.set(today, dailyTokens + tokens);
    const dailyCost = this.usageStats.dailyCost.get(today) || 0;
    this.usageStats.dailyCost.set(today, dailyCost + cost);
    if (!this.usageStats.providerUsage.has(provider)) {
      this.usageStats.providerUsage.set(provider, { tokens: 0, cost: 0, requests: 0 });
    }
    const providerStats = this.usageStats.providerUsage.get(provider);
    providerStats.tokens += tokens;
    providerStats.cost += cost;
    providerStats.requests += 1;
    if (this.config.budgetLimit) {
      const budgetUsed = (dailyCost + cost) / this.config.budgetLimit;
      if (budgetUsed >= 1) {
        this.emit('budget:exceeded', {
          dailyCost: dailyCost + cost,
          limit: this.config.budgetLimit,
        });
      } else if (budgetUsed >= this.config.warnThreshold) {
        this.emit('budget:warning', {
          dailyCost: dailyCost + cost,
          limit: this.config.budgetLimit,
          threshold: this.config.warnThreshold,
        });
      }
    }
    this.emit('usage:tracked', { tokens, cost, provider });
  }
  /**
   * Get optimization suggestions
   * @returns {Array<Object>} Suggestions
   */
  getSuggestions() {
    const suggestions = [];
    const stats = this.getStats();
    if (stats.cacheHitRate < 0.1) {
      suggestions.push({
        type: 'cache',
        priority: 'medium',
        message: 'Low cache hit rate. Consider increasing cache TTL or adjusting request patterns.',
        impact: 'high',
      });
    }
    for (const [provider, usage] of this.usageStats.providerUsage) {
      const avgCostPerRequest = usage.cost / usage.requests;
      if (avgCostPerRequest > 0.05) {
        suggestions.push({
          type: 'cost',
          priority: 'high',
          message: `${provider} has high average cost ($${avgCostPerRequest.toFixed(4)} per request). Consider using cheaper alternatives for similar quality.`,
          impact: 'high',
        });
      }
    }
    const dailyCosts = Array.from(this.usageStats.dailyCost.values());
    if (dailyCosts.length > 1) {
      const avgCost = dailyCosts.reduce((a, b) => a + b, 0) / dailyCosts.length;
      const lastDay = dailyCosts[dailyCosts.length - 1];
      if (lastDay > avgCost * 1.5) {
        suggestions.push({
          type: 'usage',
          priority: 'medium',
          message: `Yesterday's cost ($${lastDay.toFixed(2)}) was 50% above average ($${avgCost.toFixed(2)}).`,
          impact: 'medium',
        });
      }
    }
    return suggestions;
  }
  /**
   * Get usage statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const today = /* @__PURE__ */ new Date().toISOString().split('T')[0];
    const cacheHits = Array.from(this.cache.values()).filter(
      (v) => Date.now() - v.timestamp < 36e5
    ).length;
    return {
      totalTokens: this.usageStats.totalTokens,
      totalCost: this.usageStats.totalCost,
      todayTokens: this.usageStats.dailyTokens.get(today) || 0,
      todayCost: this.usageStats.dailyCost.get(today) || 0,
      cacheSize: this.cache.size,
      cacheHits,
      cacheHitRate: this.usageStats.totalTokens > 0 ? cacheHits / this.usageStats.totalTokens : 0,
      providerBreakdown: Object.fromEntries(this.usageStats.providerUsage),
      budgetRemaining: this.config.budgetLimit
        ? this.config.budgetLimit - (this.usageStats.dailyCost.get(today) || 0)
        : null,
    };
  }
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.emit('cache:cleared');
  }
  /**
   * Get cost estimate for request
   * @param {Object} request - Request object
   * @param {string} provider - Provider name
   * @returns {Object} Cost estimate
   */
  estimateCost(request, provider) {
    const tokens = this._estimateTokens(request.messages || []);
    const costs = {
      openai: { input: 0.01, output: 0.03 },
      anthropic: { input: 8e-3, output: 0.024 },
      google: { input: 5e-3, output: 0.015 },
      groq: { input: 1e-3, output: 2e-3 },
    };
    const providerCost = costs[provider] || costs.openai;
    const inputCost = ((tokens * 0.7) / 1e3) * providerCost.input;
    const outputCost = ((tokens * 0.3) / 1e3) * providerCost.output;
    return {
      tokens,
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
    };
  }
  // Private methods
  _hashRequest(request) {
    const str = JSON.stringify({
      messages: request.messages,
      model: request.model,
      temperature: request.temperature,
    });
    return crypto.createHash('md5').update(str).digest('hex');
  }
  _cloneResult(result) {
    return JSON.parse(JSON.stringify(result));
  }
  _estimateTokens(messages) {
    const text = JSON.stringify(messages);
    return Math.ceil(text.length / 4);
  }
  _compressMessages(messages, level) {
    switch (level) {
      case 'low':
        return {
          summary: messages
            .filter((m) => m.role !== 'system')
            .map((m) => `${m.role}: ${m.content?.substring(0, 100)}...`)
            .join('\n'),
        };
      case 'medium':
        const roles = {};
        messages.forEach((m) => {
          roles[m.role] = (roles[m.role] || 0) + 1;
        });
        return {
          summary: `Conversation with ${messages.length} messages (${Object.entries(roles)
            .map(([r, c]) => `${c} ${r}`)
            .join(', ')})`,
        };
      case 'high':
        return {
          summary: `${messages.length} messages in conversation history`,
        };
      default:
        return { summary: `${messages.length} messages` };
    }
  }
  _startCleanupJob() {
    setInterval(() => {
      const now = Date.now();
      for (const [hash, entry] of this.cache.entries()) {
        if (now - entry.timestamp > this.config.cacheTTL) {
          this.cache.delete(hash);
        }
      }
    }, 6e5);
  }
  _scheduleDailyReset() {
    const now = /* @__PURE__ */ new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow - now;
    setTimeout(() => {
      const cutoff = /* @__PURE__ */ new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      for (const date of this.usageStats.dailyTokens.keys()) {
        if (new Date(date) < cutoff) {
          this.usageStats.dailyTokens.delete(date);
          this.usageStats.dailyCost.delete(date);
        }
      }
      this._scheduleDailyReset();
    }, msUntilMidnight);
  }
}
var token_optimizer_default = TokenOptimizer;
export { TokenOptimizer, token_optimizer_default as default };
