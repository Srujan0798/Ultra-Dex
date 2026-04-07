// Copyright (c) 2026 Ultra-Dex

/**
 * Ultra-Dex Swarm Performance Optimizer
 * Implements performance enhancements for the agent swarm system
 */

import { performance } from 'perf_hooks';
import { Worker, isMainThread, parentPort } from 'worker_threads';
import { cpus } from 'os';
import fs from 'fs/promises';
import path from 'path';

// Performance configuration
const PERF_CONFIG = {
  maxWorkers: Math.min(cpus().length, 8), // Cap at 8 workers
  batchSize: 10, // Process files in batches
  cacheTTL: 300000, // 5 minutes cache
  maxConcurrentAgents: 4, // Max concurrent agents per tier
};

// Cache for performance optimization
class PerfCache {
  constructor(ttl = PERF_CONFIG.cacheTTL) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }
}

// Optimized agent execution with performance tracking
class OptimizedAgentExecutor {
  constructor() {
    this.cache = new PerfCache();
    this.workerPool = [];
    this.activeTasks = new Map();
    this.stats = {
      totalExecutions: 0,
      cachedExecutions: 0,
      avgExecutionTime: 0,
      totalExecutionTime: 0,
      totalTokens: 0,
      cacheHitRate: 0,
    };
    this.tokenCounter = 0;
  }

  // Execute agent with performance optimization
  async executeAgent(agent, task, context, previousOutput, provider) {
    const cacheKey = this.generateCacheKey(agent, task, context, previousOutput);
    const cachedResult = this.cache.get(cacheKey);

    if (cachedResult) {
      this.stats.cachedExecutions++;
      this.stats.cacheHitRate = (this.stats.cachedExecutions / this.stats.totalExecutions) * 100;
      return cachedResult;
    }

    const startTime = performance.now();
    const result = await this.runAgentInternal(agent, task, context, previousOutput, provider);
    const executionTime = performance.now() - startTime;

    // Update stats
    this.stats.totalExecutions++;
    this.stats.totalExecutionTime += executionTime;
    this.stats.avgExecutionTime = this.stats.totalExecutionTime / this.stats.totalExecutions;
    this.stats.cacheHitRate = (this.stats.cachedExecutions / this.stats.totalExecutions) * 100;

    // Estimate token usage and update stats
    this.tokenCounter += this.estimateTokens(result);
    this.stats.totalTokens = this.tokenCounter;

    // Cache result if it's not too large
    if (JSON.stringify(result).length < 10000) {
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  // Estimate token count for cost tracking
  estimateTokens(text) {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil((text || '').length / 4);
  }

  // Internal agent runner with retry logic and enhanced error handling
  async runAgentInternal(agent, task, context, previousOutput, provider) {
    if (!provider) {
      throw new Error('No AI provider configured. Set your API keys first.');
    }

    const agentPrompt = await this.loadAgentPrompt(agent.name);

    // Build the full prompt first
    const fullPrompt = `
${agentPrompt}

## Context
${context}

## Previous Agent Output
${previousOutput}

## Task
${task}

Provide your output for the next agent in the pipeline.
`;

    // Enforce prompt size limit with optimized truncation
    const prompt = this.optimizePrompt(fullPrompt);

    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        let response;
        if (provider.complete) {
          response = await provider.complete(prompt);
        } else if (provider.generate) {
          response = await provider.generate('', prompt);
        } else {
          throw new Error('Provider does not support complete or generate methods');
        }

        if (!response) {
          throw new Error('Received empty response from provider');
        }

        // Extract token usage if available
        if (response.usage) {
          this.tokenCounter += (response.usage.total_tokens || 0);
        }

        return typeof response === 'string'
          ? response
          : response.content || response.text || JSON.stringify(response);
      } catch (error) {
        lastError = error;
        if (attempt < 3) {
          // Exponential backoff with jitter
          const baseDelay = Math.min(attempt * 1000, 5000); // Cap at 5 seconds
          const jitter = Math.random() * 1000; // Add up to 1 second of randomness
          const delay = baseDelay + jitter;
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    throw new Error(`Agent @${agent.name} failed after 3 attempts`, { cause: lastError });
  }

  // Optimize prompt size with intelligent truncation
  optimizePrompt(fullPrompt) {
    const MAX_CONTEXT_SIZE = 100 * 1024; // 100KB in bytes

    if (Buffer.byteLength(fullPrompt, 'utf-8') <= MAX_CONTEXT_SIZE) {
      return fullPrompt;
    }

    // Truncate the context portion specifically with optimized algorithm
    const contextStart = fullPrompt.indexOf('## Context');
    const contextEnd = fullPrompt.indexOf('## Previous Agent Output');

    if (contextStart !== -1 && contextEnd !== -1) {
      const prefix = fullPrompt.substring(0, contextStart);
      const suffix = fullPrompt.substring(contextEnd);

      // Calculate how much context we can fit
      const overhead = Buffer.byteLength(prefix + suffix, 'utf-8');
      const availableForContext = MAX_CONTEXT_SIZE - overhead - 1000; // Leave 1KB buffer

      if (availableForContext > 0) {
        const fullContext = fullPrompt.substring(contextStart + 11, contextEnd); // +11 to skip "## Context"
        
        // Use more sophisticated truncation - preserve important parts
        const lines = fullContext.split('\n');
        const importantLines = [];
        const otherLines = [];

        // Separate important lines (those with keywords)
        for (const line of lines) {
          if (this.isImportantLine(line)) {
            importantLines.push(line);
          } else {
            otherLines.push(line);
          }
        }

        // Calculate space for other lines after accounting for important lines
        const importantText = importantLines.join('\n');
        const importantSize = Buffer.byteLength(importantText, 'utf-8');
        
        let finalContext = importantText;
        if (importantSize < availableForContext) {
          // Add other lines until we reach the limit
          for (const line of otherLines) {
            const testContext = finalContext + '\n' + line;
            if (Buffer.byteLength(testContext, 'utf-8') > availableForContext) {
              break;
            }
            finalContext = testContext;
          }
        }

        return prefix + '## Context\n' + finalContext + `\n\n[Context was optimized due to size limits.]\n` + suffix;
      }
    }

    // Fallback: simple truncation if structure isn't as expected
    const promptBytes = Buffer.from(fullPrompt, 'utf-8');
    const truncatedPrompt = promptBytes.subarray(0, MAX_CONTEXT_SIZE - 1000);
    return new TextDecoder().decode(truncatedPrompt) + `\n\n[Prompt was optimized due to size limits.]`;
  }

  // Determine if a line is important for context
  isImportantLine(line) {
    const importantKeywords = [
      'ERROR', 'WARNING', 'CRITICAL', 'FATAL', 'BUG', 'ISSUE', 
      'CONFIG', 'SETUP', 'INITIALIZE', 'AUTH', 'SECURITY',
      'DATABASE', 'API', 'ENDPOINT', 'ROUTE', 'MODEL', 'SCHEMA'
    ];
    
    const upperLine = line.toUpperCase();
    return importantKeywords.some(keyword => upperLine.includes(keyword));
  }

  // Generate cache key for agent execution
  generateCacheKey(agent, task, context, previousOutput) {
    const input = JSON.stringify({
      agent: agent.name,
      task: task.substring(0, 100), // Limit task length
      contextHash: this.hashString(context.substring(0, 500)), // Limit context
      prevOutputHash: this.hashString(previousOutput.substring(0, 500))
    });
    return this.hashString(input);
  }

  // Simple hash function for cache key
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
  }

  // Load agent prompt with caching
  async loadAgentPrompt(name) {
    const cacheKey = `prompt_${name}`;
    let prompt = this.cache.get(cacheKey);

    if (!prompt) {
      // Try to load from various locations
      const paths = [
        path.join(process.cwd(), 'agents', `${name}.md`),
        path.join(process.cwd(), 'prompts', `${name}.md`),
        path.join(process.cwd(), 'cli', 'agents', `${name}.md`)
      ];

      for (const filePath of paths) {
        try {
          if (await this.fileExists(filePath)) {
            prompt = await fs.readFile(filePath, 'utf-8');
            break;
          }
        } catch (_error) {
          continue;
        }
      }

      if (!prompt) {
        prompt = `You are the @${name} agent.`;
      }

      // Cache for 10 minutes
      this.cache.set(cacheKey, prompt);
    }

    return prompt;
  }

  // Check if file exists
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Get performance statistics
  getStats() {
    return {
      ...this.stats,
      cacheHitRate: this.stats.totalExecutions > 0 
        ? (this.stats.cachedExecutions / this.stats.totalExecutions) * 100 
        : 0,
      cacheSize: this.cache.cache.size,
    };
  }
}

// Optimized swarm pipeline executor
class OptimizedSwarmExecutor {
  constructor() {
    this.executor = new OptimizedAgentExecutor();
    this.concurrencyLimiter = new ConcurrencyLimiter(PERF_CONFIG.maxConcurrentAgents);
    this.communicationBus = new AgentCommunicationBus(); // Enhanced inter-agent communication
  }

  // Execute swarm with optimized performance
  async executeSwarm(pipeline, task, context, provider, options = {}) {
    const startTime = performance.now();
    const results = [];
    let previousOutput = '';

    // Initialize communication bus with task context
    await this.communicationBus.initialize(task, context);

    // Split pipeline into tiers
    const tiers = this.groupIntoTiers(pipeline, options.parallel);

    for (const tier of tiers) {
      if (tier.agents.length === 0) continue;

      if (tier.parallel) {
        // Execute tier in parallel with concurrency limiting
        const tierResults = await this.executeTierParallel(tier, task, context, previousOutput, provider);
        results.push(...tierResults);

        // Update previous output with successful results
        const successfulResults = tierResults.filter(r => r.success);
        if (successfulResults.length > 0) {
          previousOutput += '\n\n' + successfulResults.map(r => r.result).join('\n\n');

          // Share results with communication bus for other agents to potentially access
          for (const result of successfulResults) {
            await this.communicationBus.shareResult(result.agent, result.result);
          }
        }
      } else {
        // Execute tier sequentially
        for (const agent of tier.agents) {
          const result = await this.concurrencyLimiter.run(async () => {
            // Allow agent to access shared context from other agents
            const sharedContext = await this.communicationBus.getSharedContext(agent.name);
            const combinedContext = this.combineContexts(context, sharedContext);

            return this.executeAgentInTier(agent, task, combinedContext, previousOutput, provider);
          });

          results.push(result);
          if (result.success) {
            previousOutput = result.result;
            // Share this agent's result with the communication bus
            await this.communicationBus.shareResult(result.agent, result.result);
          }
        }
      }
    }

    const totalTime = performance.now() - startTime;

    return {
      results,
      totalTime,
      stats: this.executor.getStats(),
      successRate: results.filter(r => r.success).length / results.length * 100
    };
  }

  // Combine base context with shared context from other agents
  combineContexts(baseContext, sharedContext) {
    if (!sharedContext || Object.keys(sharedContext).length === 0) {
      return baseContext;
    }

    return baseContext + '\n\n## Shared Insights from Other Agents\n' +
           Object.entries(sharedContext).map(([agent, insight]) =>
             `### @${agent} Insight:\n${insight}`
           ).join('\n\n');
  }

  // Execute a tier in parallel with concurrency control
  async executeTierParallel(tier, task, context, previousOutput, provider) {
    const promises = tier.agents.map(agent => 
      this.concurrencyLimiter.run(async () => {
        return this.executeAgentInTier(agent, task, context, previousOutput, provider);
      })
    );

    return Promise.all(promises);
  }

  // Execute a single agent in a tier
  async executeAgentInTier(agent, task, context, previousOutput, provider) {
    try {
      const result = await this.executor.executeAgent(agent, task, context, previousOutput, provider);
      return { agent: agent.name, result, success: true };
    } catch (error) {
      return { agent: agent.name, error: error.message, success: false };
    }
  }

  // Group agents into execution tiers
  groupIntoTiers(pipeline, parallel = false) {
    if (parallel) {
      return [
        {
          name: '1-Planning',
          agents: pipeline.filter(a => a.tier === '1-planning'),
          parallel: false,
        },
        {
          name: '2-Implementation',
          agents: pipeline.filter(a => a.tier === '2-implementation'),
          parallel: true,
        },
        {
          name: '3-Security',
          agents: pipeline.filter(a => a.tier === '3-security'),
          parallel: false,
        },
        {
          name: '4-Quality',
          agents: pipeline.filter(a => a.tier === '4-quality'),
          parallel: false,
        },
      ].filter(tier => tier.agents.length > 0);
    } else {
      return [{
        name: 'All',
        agents: pipeline,
        parallel: false,
      }];
    }
  }
}

// Concurrency limiter to prevent overwhelming the system
class ConcurrencyLimiter {
  constructor(maxConcurrent) {
    this.maxConcurrent = maxConcurrent;
    this.running = 0;
    this.pending = [];
  }

  async run(fn) {
    return new Promise((resolve, reject) => {
      this.pending.push({ fn, resolve, reject });
      this.processNext();
    });
  }

  async processNext() {
    if (this.running >= this.maxConcurrent || this.pending.length === 0) {
      return;
    }

    const { fn, resolve, reject } = this.pending.shift();
    this.running++;

    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.processNext();
    }
  }
}

// Agent Communication Bus for enhanced inter-agent communication
class AgentCommunicationBus {
  constructor() {
    this.sharedResults = new Map(); // agentName -> result
    this.taskContext = null;
    this.globalContext = null;
    this.lastUpdated = new Date();
  }

  async initialize(task, context) {
    this.taskContext = task;
    this.globalContext = context;
    this.lastUpdated = new Date();
  }

  async shareResult(agentName, result) {
    this.sharedResults.set(agentName, {
      result,
      timestamp: new Date(),
      taskContext: this.taskContext
    });

    // Keep only recent results to prevent memory issues
    if (this.sharedResults.size > 50) { // Keep max 50 shared results
      const entries = Array.from(this.sharedResults.entries());
      const sortedEntries = entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      this.sharedResults = new Map(sortedEntries.slice(0, 40)); // Keep newest 40
    }
  }

  async getSharedContext(requestingAgent) {
    // Return all shared results except from the requesting agent itself
    const sharedContext = {};
    for (const [agentName, data] of this.sharedResults) {
      if (agentName !== requestingAgent) {
        sharedContext[agentName] = data.result;
      }
    }
    return sharedContext;
  }

  async getRelevantContext(requestingAgent, keywords = []) {
    // Get all shared context
    const allContext = await this.getSharedContext(requestingAgent);

    // If keywords are provided, filter for relevant context
    if (keywords.length > 0) {
      const relevantContext = {};
      for (const [agentName, result] of Object.entries(allContext)) {
        if (keywords.some(keyword =>
          result.toLowerCase().includes(keyword.toLowerCase())
        )) {
          relevantContext[agentName] = result;
        }
      }
      return relevantContext;
    }

    return allContext;
  }
}

// Export optimized classes
export {
  OptimizedAgentExecutor,
  OptimizedSwarmExecutor,
  ConcurrencyLimiter,
  AgentCommunicationBus,
  PERF_CONFIG as perfConfig
};

// Performance enhancement utilities
export const perfUtils = {
  // Measure execution time of a function
  async measureTime(fn) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return { result, duration: end - start };
  },

  // Batch process items with performance optimization
  async batchProcess(items, processor, batchSize = PERF_CONFIG.batchSize) {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item => processor(item))
      );
      results.push(...batchResults);
    }
    
    return results;
  },

  // Memoize function results
  memoize(fn, resolver) {
    const cache = new Map();
    return function (...args) {
      const key = resolver ? resolver.apply(this, args) : JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = fn.apply(this, args);
      cache.set(key, result);
      return result;
    };
  }
};