import { contextCache, ContextCache } from './context-cache.js';

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeItems(items = [], source) {
  return items.map((item, index) => ({
    ...item,
    source: item.source || source,
    score: typeof item.score === 'number' ? item.score : Math.max(0, 1 - index * 0.1),
  }));
}

export class PredictiveEngine {
  constructor(options = {}) {
    this.memory = options.memory || null;
    this.cache =
      options.cache instanceof ContextCache
        ? options.cache
        : options.cache || contextCache;
    this.defaultTimeout = options.defaultTimeout || 5000;
    this.cacheTtl = options.cacheTtl || 300000;
    this.pending = new Map();
    this.stats = {
      prefetches: 0,
      completed: 0,
      failed: 0,
      useful: 0,
      totalPrefetchTimeMs: 0,
    };
  }

  analyzeTaskIntent(task) {
    const normalizedTask = String(task || '').trim();
    const words = normalizedTask
      .toLowerCase()
      .split(/[^a-z0-9_-]+/i)
      .map((word) => word.trim())
      .filter((word) => word.length > 2);
    const keywords = uniqueStrings(words).slice(0, 12);
    const entities = uniqueStrings(
      normalizedTask.match(/\b[A-Z][a-zA-Z0-9_-]+\b/g) || []
    ).slice(0, 8);

    let intent = 'general';
    if (keywords.some((word) => ['query', 'queries', 'schema', 'database', 'sql', 'prisma'].includes(word))) {
      intent = 'data';
    } else if (
      keywords.some((word) => ['button', 'layout', 'component', 'frontend', 'react'].includes(word))
    ) {
      intent = 'ui';
    } else if (
      keywords.some((word) => ['deploy', 'pipeline', 'build', 'docker', 'ci'].includes(word))
    ) {
      intent = 'operations';
    }

    return {
      keywords,
      entities,
      intent,
    };
  }

  async vectorPreFetch(taskDescription, topK = 5) {
    if (!this.memory?.search) {
      return [];
    }

    const results = await this.memory.search(taskDescription, topK);
    return normalizeItems(results, 'vector');
  }

  async graphPreFetch(entities = [], topK = 3) {
    if (!this.memory?.search || entities.length === 0) {
      return [];
    }

    const results = [];
    for (const entity of entities.slice(0, topK)) {
      const matches = await this.memory.search(entity, 2);
      results.push(...matches);
    }

    return normalizeItems(results, 'graph');
  }

  mergeAndRank(vectorResults = [], graphResults = []) {
    const ranked = new Map();

    for (const item of [...vectorResults, ...graphResults]) {
      const key = item.id || item.content || JSON.stringify(item);
      const previous = ranked.get(key);
      if (!previous) {
        ranked.set(key, { ...item });
        continue;
      }

      ranked.set(key, {
        ...previous,
        ...item,
        score: Math.max(previous.score || 0, item.score || 0),
        sources: uniqueStrings([
          ...(previous.sources || [previous.source].filter(Boolean)),
          ...(item.sources || [item.source].filter(Boolean)),
        ]),
      });
    }

    return [...ranked.values()].sort((left, right) => (right.score || 0) - (left.score || 0));
  }

  async predictContext(taskDescription, options = {}) {
    const taskId = options.taskId || options.cacheKey || String(taskDescription);
    const cached = this.cache.get(taskId);
    if (cached) {
      return cached;
    }

    const startedAt = Date.now();
    const intent = this.analyzeTaskIntent(taskDescription);
    const vectorResults = await this.vectorPreFetch(taskDescription, options.topK || 5);
    const graphResults = await this.graphPreFetch(intent.entities, options.graphTopK || 3);
    const items = this.mergeAndRank(vectorResults, graphResults).slice(0, options.limit || 8);

    const context = {
      taskId,
      task: taskDescription,
      fetchedAt: new Date().toISOString(),
      intent,
      vectorResults,
      graphResults,
      items,
      metrics: {
        durationMs: Date.now() - startedAt,
      },
    };

    this.cache.set(taskId, context, options.cacheTtl || this.cacheTtl);
    return context;
  }

  spawnBackgroundPrefetch(taskId, taskDescription, options = {}) {
    this.stats.prefetches++;
    const promise = this.predictContext(taskDescription, {
      ...options,
      taskId,
    })
      .then((context) => {
        this.stats.completed++;
        this.stats.totalPrefetchTimeMs += context.metrics.durationMs;
        this.pending.set(taskId, {
          status: 'complete',
          promise,
          context,
          error: null,
        });
        return context;
      })
      .catch((error) => {
        this.stats.failed++;
        this.pending.set(taskId, {
          status: 'error',
          promise,
          context: null,
          error,
        });
        throw error;
      });

    this.pending.set(taskId, {
      status: 'pending',
      promise,
      context: null,
      error: null,
    });
    return promise;
  }

  getPrefetchStatus(taskId) {
    return this.pending.get(taskId)?.status || 'missing';
  }

  async awaitPrefetch(taskId, timeout = this.defaultTimeout) {
    const record = this.pending.get(taskId);
    if (!record?.promise) {
      return null;
    }

    return await Promise.race([
      record.promise,
      new Promise((resolve) => setTimeout(() => resolve(null), timeout)),
    ]);
  }

  recordUsage(taskId, wasUseful) {
    if (!this.pending.has(taskId)) {
      return;
    }

    if (wasUseful) {
      this.stats.useful++;
    }
  }

  getStats() {
    const completed = this.stats.completed;
    return {
      ...this.stats,
      avgPrefetchTimeMs:
        completed === 0 ? 0 : Math.round(this.stats.totalPrefetchTimeMs / completed),
      prefetchHitRate: completed === 0 ? 0 : this.stats.useful / completed,
      cache: this.cache.getStats(),
      pending: this.pending.size,
    };
  }
}

export const predictiveEngine = new PredictiveEngine();
export default PredictiveEngine;
