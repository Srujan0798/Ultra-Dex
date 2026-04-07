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
let DatabaseOptimizer = class {
  constructor() {
    this.queryStats = /* @__PURE__ */ new Map();
    this.trackingEnabled = true;
  }
  // Analyze a SQL query and return optimization suggestions
  async optimizeQuery(query) {
    const normalized = query.trim().toUpperCase();
    const analysis = {
      query,
      type: this.detectQueryType(normalized),
      suggestions: [],
      antiPatterns: [],
      estimatedCost: "unknown"
    };
    if (normalized.includes("SELECT *")) {
      analysis.antiPatterns.push("selectAll");
      analysis.suggestions.push({
        type: "performance",
        appliesTo: "selectAll",
        severity: "warning",
        message: "Avoid SELECT * - specify only needed columns",
        suggestion: "Replace SELECT * with explicit column names"
      });
    }
    if ((normalized.includes("SELECT") || normalized.includes("UPDATE") || normalized.includes("DELETE")) && !normalized.includes("WHERE")) {
      analysis.suggestions.push({
        type: "safety",
        appliesTo: "missingWhere",
        severity: "warning",
        message: "Query lacks WHERE clause - may affect all rows",
        suggestion: "Add a WHERE clause to limit affected rows"
      });
    }
    if (normalized.includes("LIKE '%")) {
      analysis.antiPatterns.push("leadingWildcard");
      analysis.suggestions.push({
        type: "performance",
        appliesTo: "leadingWildcard",
        severity: "warning",
        message: "LIKE with leading wildcard prevents index usage",
        suggestion: "Consider full-text search or restructure query"
      });
    }
    if (normalized.includes(" OR ")) {
      analysis.suggestions.push({
        type: "performance",
        appliesTo: "orCondition",
        severity: "info",
        message: "OR conditions may prevent index usage",
        suggestion: "Consider using UNION or IN clause instead"
      });
    }
    if (normalized.includes("SELECT") && normalized.match(/SELECT.*\(.*SELECT/)) {
      analysis.suggestions.push({
        type: "performance",
        appliesTo: "subquery",
        severity: "info",
        message: "Subqueries may be slow",
        suggestion: "Consider using JOINs instead of subqueries"
      });
    }
    if (normalized.includes("ORDER BY") && !normalized.includes("LIMIT")) {
      analysis.suggestions.push({
        type: "performance",
        appliesTo: "orderByNoLimit",
        severity: "info",
        message: "ORDER BY without LIMIT sorts entire result set",
        suggestion: "Add LIMIT clause if you only need top N results"
      });
    }
    if (normalized.includes("WHERE") && normalized.includes("=")) {
      analysis.suggestions.push({
        type: "indexing",
        appliesTo: "whereEquality",
        severity: "info",
        message: "Ensure WHERE columns are indexed",
        suggestion: "Add index on columns used in WHERE equality conditions"
      });
    }
    analysis.estimatedCost = this.estimateCost(normalized, analysis.suggestions);
    return { analysis, optimized: this.applyOptimizations(query, analysis) };
  }
  detectQueryType(normalized) {
    if (normalized.startsWith("SELECT"))
      return "SELECT";
    if (normalized.startsWith("INSERT"))
      return "INSERT";
    if (normalized.startsWith("UPDATE"))
      return "UPDATE";
    if (normalized.startsWith("DELETE"))
      return "DELETE";
    if (normalized.startsWith("CREATE"))
      return "CREATE";
    if (normalized.startsWith("DROP"))
      return "DROP";
    return "UNKNOWN";
  }
  estimateCost(normalized, suggestions) {
    let cost = 1;
    if (normalized.includes("SELECT *"))
      cost *= 2;
    if (!normalized.includes("WHERE"))
      cost *= 3;
    if (normalized.includes(" OR "))
      cost *= 1.5;
    if (normalized.includes("JOIN"))
      cost *= 1.5;
    if (normalized.includes("ORDER BY"))
      cost *= 1.3;
    if (normalized.includes("GROUP BY"))
      cost *= 1.5;
    if (normalized.includes("DISTINCT"))
      cost *= 1.3;
    if (normalized.includes("LIMIT"))
      cost *= 0.5;
    if (normalized.includes("INDEX"))
      cost *= 0.8;
    const warningCount = suggestions.filter((s) => s.severity === "warning").length;
    cost *= 1 + warningCount * 0.2;
    if (cost < 1)
      return "low";
    if (cost < 3)
      return "medium";
    if (cost < 5)
      return "high";
    return "very high";
  }
  applyOptimizations(query, analysis) {
    let optimized = query;
    for (const suggestion of analysis.suggestions) {
      if (suggestion.appliesTo === "selectAll") {
        optimized += " -- WARNING: Consider specifying explicit columns";
      }
    }
    return optimized;
  }
  // Create a tracked query wrapper
  createQueryWithTracking(queryFn) {
    const self = this;
    return async function(...args) {
      const startTime = Date.now();
      try {
        const result = await queryFn(...args);
        const duration = Date.now() - startTime;
        self.recordQueryStats(queryFn.name || "anonymous", duration, true);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        self.recordQueryStats(queryFn.name || "anonymous", duration, false);
        throw error;
      }
    };
  }
  recordQueryStats(queryName, durationMs, success) {
    if (!this.trackingEnabled)
      return;
    const existing = this.queryStats.get(queryName) || {
      count: 0,
      totalMs: 0,
      errors: 0,
      minMs: Infinity,
      maxMs: 0
    };
    this.queryStats.set(queryName, {
      count: existing.count + 1,
      totalMs: existing.totalMs + durationMs,
      errors: existing.errors + (success ? 0 : 1),
      minMs: Math.min(existing.minMs, durationMs),
      maxMs: Math.max(existing.maxMs, durationMs)
    });
  }
  getQueryStats(queryName) {
    if (queryName) {
      const stats = this.queryStats.get(queryName);
      if (!stats)
        return null;
      return {
        ...stats,
        avgMs: stats.totalMs / stats.count
      };
    }
    const allStats = {};
    for (const [name, stats] of this.queryStats.entries()) {
      allStats[name] = {
        ...stats,
        avgMs: stats.totalMs / stats.count
      };
    }
    return allStats;
  }
  enableTracking() {
    this.trackingEnabled = true;
  }
  disableTracking() {
    this.trackingEnabled = false;
  }
  clearStats() {
    this.queryStats.clear();
  }
};
DatabaseOptimizer = __decorateClass([
  singleton()
], DatabaseOptimizer);
const databaseOptimizer = new DatabaseOptimizer();
var db_optimizer_default = databaseOptimizer;
export {
  DatabaseOptimizer,
  databaseOptimizer,
  db_optimizer_default as default
};
