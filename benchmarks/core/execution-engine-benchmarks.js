// Copyright (c) 2026 Ultra-Dex
// benchmarks/core/execution-engine-benchmarks.js

import { ExecutionEngine } from '../../src/core/orchestration/execution-engine.js';
import { SmartAIRouter } from '../../src/core/ai/router.js';
import { AgentRegistry } from '../../src/core/orchestration/registry.js';
import { PerformanceMetrics } from '../performance-metrics.js';

/**
 * Benchmarks for ExecutionEngine performance
 */
export const executionEngineBenchmarks = [
  {
    name: 'execution-engine-simple-task',
    description: 'Execute a simple task with one step',
    async setup() {
      this.metrics = new PerformanceMetrics();
      this.metrics.startCollection();

      this.executionEngine = new ExecutionEngine({
        aiRouter: new SmartAIRouter(),
        agentRegistry: new AgentRegistry(),
      });

      await this.executionEngine.initialize();
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
    description: 'Execute a task with multiple steps',
    async setup() {
      this.metrics = new PerformanceMetrics();
      this.metrics.startCollection();

      this.executionEngine = new ExecutionEngine({
        aiRouter: new SmartAIRouter(),
        agentRegistry: new AgentRegistry(),
      });

      await this.executionEngine.initialize();
    },

    async run() {
      const task = {
        id: 'bench-task-multi',
        input: 'Create a todo list application',
        agent: 'test-agent',
        steps: [
          {
            id: 'step1',
            type: 'generate',
            params: {
              prompt: 'Design a todo list data structure',
              model: 'gpt-3.5-turbo',
            },
          },
          {
            id: 'step2',
            type: 'generate',
            params: {
              prompt: 'Create functions to add, remove, and list todos',
              model: 'gpt-3.5-turbo',
            },
          },
          {
            id: 'step3',
            type: 'generate',
            params: {
              prompt: 'Add validation and error handling',
              model: 'gpt-3.5-turbo',
            },
          },
        ],
      };

      const startTime = Date.now();
      await this.executionEngine.execute(task);
      const duration = Date.now() - startTime;

      this.metrics.recordLatency('execution-engine-multi-step', duration);
    },

    async teardown() {
      this.metrics.stopCollection();
    },
  },

  {
    name: 'execution-engine-streaming-task',
    description: 'Execute a task with streaming enabled',
    async setup() {
      this.metrics = new PerformanceMetrics();
      this.metrics.startCollection();

      this.executionEngine = new ExecutionEngine({
        aiRouter: new SmartAIRouter(),
        agentRegistry: new AgentRegistry(),
      });

      await this.executionEngine.initialize();
    },

    async run() {
      const task = {
        id: 'bench-task-streaming',
        input: 'Write a short story about AI',
        agent: 'test-agent',
        steps: [
          {
            id: 'step1',
            type: 'generate',
            params: {
              prompt: 'Write a 200-word short story about artificial intelligence',
              model: 'gpt-3.5-turbo',
            },
          },
        ],
      };

      const chunks = [];
      const startTime = Date.now();

      for await (const chunk of this.executionEngine.executeStream(task, {
        onProgress: (progress) => {
          if (progress.type === 'step_complete') {
            chunks.push(progress);
          }
        },
      })) {
        // Collect streaming data
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
    description: 'Execute multiple tasks concurrently',
    iterations: 50, // 50 concurrent tasks
    async setup() {
      this.metrics = new PerformanceMetrics();
      this.metrics.startCollection();

      this.executionEngine = new ExecutionEngine({
        aiRouter: new SmartAIRouter(),
        agentRegistry: new AgentRegistry(),
      });

      await this.executionEngine.initialize();
    },

    async run() {
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        id: `bench-concurrent-${i}`,
        input: `Generate a random number: ${Math.random()}`,
        agent: 'test-agent',
        steps: [
          {
            id: `step-${i}`,
            type: 'generate',
            params: {
              prompt: 'Generate a random number between 1 and 100',
              model: 'gpt-3.5-turbo',
            },
          },
        ],
      }));

      const startTime = Date.now();
      await Promise.all(tasks.map((task) => this.executionEngine.execute(task)));
      const duration = Date.now() - startTime;

      this.metrics.recordLatency('execution-engine-concurrent', duration);
      this.metrics.recordThroughput('execution-engine-concurrent', tasks.length, duration);
    },

    async teardown() {
      this.metrics.stopCollection();
    },
  },
];
