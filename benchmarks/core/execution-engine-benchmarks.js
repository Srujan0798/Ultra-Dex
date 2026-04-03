// Copyright (c) 2026 Ultra-Dex
// benchmarks/core/execution-engine-benchmarks.js

// Temporarily disabled due to import issues
// import { ExecutionEngine } from '../../src/core/orchestration/execution-engine.js';
// import { SmartAIRouter } from '../../src/core/ai/router.js';
// import { AgentRegistry } from '../../src/core/orchestration/registry.js';
import { PerformanceMetrics } from '../performance-metrics.js';

/**
 * Benchmarks for ExecutionEngine performance
 * Note: Currently using mock implementations due to import issues
 */
export const executionEngineBenchmarks = [
  {
    name: 'execution-engine-simple-task',
    description: 'Execute a simple task with one step (mock)',
    async setup() {
      this.metrics = new PerformanceMetrics();
      this.metrics.startCollection();
    },

    async run() {
      // Mock execution - simulate some work
      const startTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50)); // 50-150ms
      const duration = Date.now() - startTime;

      this.metrics.recordLatency('execution-engine-simple', duration);
    },

    async teardown() {
      this.metrics.stopCollection();
    },
  },

    async run() {
      const task = {
        id: 'bench-task-simple',
        input: 'Generate a simple hello world message',
        agent: 'test-agent',
        steps: [
          {
            id: 'step1',
            type: 'generate',
            params: {
              prompt: 'Say hello world',
              model: 'gpt-3.5-turbo',
            },
          },
        ],
      };

      const startTime = Date.now();
      await this.executionEngine.execute(task);
      const duration = Date.now() - startTime;

      this.metrics.recordLatency('execution-engine-simple', duration);
    },

    async teardown() {
      this.metrics.stopCollection();
    },
  },

  {
    name: 'execution-engine-multi-step-task',
    description: 'Execute a task with multiple steps (mock)',
    async setup() {
      this.metrics = new PerformanceMetrics();
      this.metrics.startCollection();
    },

    async run() {
      // Mock multi-step execution
      const startTime = Date.now();
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 25)); // 25-75ms per step
      }
      const duration = Date.now() - startTime;

      this.metrics.recordLatency('execution-engine-multi-step', duration);
    },

    async teardown() {
      this.metrics.stopCollection();
    },
  },

  {
    name: 'execution-engine-streaming-task',
    description: 'Execute a task with streaming enabled (mock)',
    async setup() {
      this.metrics = new PerformanceMetrics();
      this.metrics.startCollection();
    },

    async run() {
      // Mock streaming execution
      const chunks = [];
      const startTime = Date.now();

      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 10)); // 10-30ms per chunk
        chunks.push({ type: 'chunk', data: `chunk-${i}` });
      }

      const duration = Date.now() - startTime;
      this.metrics.recordLatency('execution-engine-streaming', duration);
      this.metrics.recordThroughput('execution-engine-streaming', chunks.length, duration);
    },

    async teardown() {
      this.metrics.stopCollection();
    },
  },

  {
    name: 'execution-engine-concurrent-tasks',
    description: 'Execute multiple tasks concurrently (mock)',
    iterations: 50,
    async setup() {
      this.metrics = new PerformanceMetrics();
      this.metrics.startCollection();
    },

    async run() {
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        id: `bench-concurrent-${i}`,
        input: `Process item ${i}`,
      }));

      const startTime = Date.now();
      await Promise.all(tasks.map(async (task) => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 20)); // 20-50ms per task
      }));
      const duration = Date.now() - startTime;

      this.metrics.recordLatency('execution-engine-concurrent', duration);
      this.metrics.recordThroughput('execution-engine-concurrent', tasks.length, duration);
    },

    async teardown() {
      this.metrics.stopCollection();
    },
  },
];
