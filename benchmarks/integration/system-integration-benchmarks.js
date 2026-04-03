// Copyright (c) 2026 Ultra-Dex
// benchmarks/integration/system-integration-benchmarks.js

import { ExecutionEngine } from '../../src/core/orchestration/execution-engine.js';
import { DistributedCoordinator } from '../../src/core/orchestration/distributed-coordinator.js';
import { SmartAIRouter } from '../../src/core/ai/router.js';
import { AgentRegistry } from '../../src/core/orchestration/registry.js';
import { ObservabilitySystem } from '../../src/core/system/observability.js';
import { PerformanceMetrics } from '../performance-metrics.js';

/**
 * Integration benchmarks testing full system performance
 */
export const systemIntegrationBenchmarks = [
  {
    name: 'full-system-workflow',
    description: 'Complete workflow from task submission to completion',
    async setup() {
      this.metrics = new PerformanceMetrics();
      this.metrics.startCollection();

      this.observability = new ObservabilitySystem();
      await this.observability.initialize();

      this.executionEngine = new ExecutionEngine({
        aiRouter: new SmartAIRouter(),
        agentRegistry: new AgentRegistry(),
        observability: this.observability,
      });

      this.coordinator = new DistributedCoordinator({
        instanceId: 'integration-test',
        port: 8120,
        executionEngine: this.executionEngine,
        agentRegistry: new AgentRegistry(),
        enableWebSocket: false,
        enableHttpApi: false,
        enableDiscovery: false,
      });

      await this.executionEngine.initialize();
      await this.coordinator.initialize();
    },

    async run() {
      const workflow = {
        input: 'Build a simple REST API for managing books',
        mode: 'complex',
        steps: [
          {
            type: 'generate',
            params: {
              prompt: 'Design the API endpoints and data models for a book management system',
              model: 'gpt-4',
            },
          },
          {
            type: 'generate',
            params: {
              prompt: 'Implement the API routes and controllers',
              model: 'gpt-4',
            },
          },
          {
            type: 'generate',
            params: {
              prompt: 'Add input validation and error handling',
              model: 'gpt-4',
            },
          },
        ],
      };

      const startTime = Date.now();
      const result = await this.coordinator.submitTask(workflow);
      const duration = Date.now() - startTime;

      this.metrics.recordLatency('full-system-workflow', duration);

      // Collect observability metrics
      const dashboard = this.observability.getDashboard();
      this.metrics.recordMetric('observability.requests', dashboard.requests);
      this.metrics.recordMetric('observability.errors', dashboard.errors);
      this.metrics.recordMetric('observability.avg_latency', dashboard.averageLatency);
    },

    async teardown() {
      await this.coordinator.shutdown();
      this.metrics.stopCollection();
    },
  },

  {
    name: 'high-throughput-task-processing',
    description: 'Process many tasks concurrently under load',
    async setup() {
      this.metrics = new PerformanceMetrics();
      this.metrics.startCollection();

      this.observability = new ObservabilitySystem();
      await this.observability.initialize();

      // Create multiple execution engines
      this.executionEngines = [];
      for (let i = 0; i < 4; i++) {
        const engine = new ExecutionEngine({
          aiRouter: new SmartAIRouter(),
          agentRegistry: new AgentRegistry(),
          observability: this.observability,
        });
        await engine.initialize();
        this.executionEngines.push(engine);
      }

      // Create distributed coordinators
      this.coordinators = [];
      for (let i = 0; i < 4; i++) {
        const coordinator = new DistributedCoordinator({
          instanceId: `throughput-instance-${i}`,
          port: 8130 + i,
          executionEngine: this.executionEngines[i],
          agentRegistry: new AgentRegistry(),
          enableWebSocket: true,
          enableHttpApi: true,
          enableDiscovery: true,
          maxConcurrentTasks: 10,
        });

        await coordinator.initialize();
        this.coordinators.push(coordinator);
      }

      // Let them discover each other
      await new Promise((resolve) => setTimeout(resolve, 3000));
    },

    async run() {
      // Generate 100 tasks
      const tasks = Array.from({ length: 100 }, (_, i) => ({
        input: `Process data item ${i}: ${Math.random().toString(36).substring(7)}`,
        mode: 'simple',
      }));

      const startTime = Date.now();

      // Submit tasks to different coordinators in batches
      const results = [];
      const batchSize = 10;

      for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);
        const batchPromises = batch.map((task, idx) => {
          const coordinatorIdx = Math.floor(i / batchSize) % this.coordinators.length;
          return this.coordinators[coordinatorIdx].submitTask(task);
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      const duration = Date.now() - startTime;

      // Calculate metrics
      const successfulTasks = results.filter((r) => r.success !== false).length;
      const failedTasks = results.length - successfulTasks;

      this.metrics.recordLatency('high-throughput-processing', duration);
      this.metrics.recordThroughput('high-throughput-processing', successfulTasks, duration);
      this.metrics.recordMetric('integration.successful_tasks', successfulTasks);
      this.metrics.recordMetric('integration.failed_tasks', failedTasks);

      // Collect system resource usage
      const resourceUsage = this.metrics.getResourceUsage();
      if (resourceUsage) {
        this.metrics.recordMetric('integration.memory_peak', resourceUsage.memory.maxMB);
        this.metrics.recordMetric('integration.cpu_avg', resourceUsage.cpu.averageUsage);
      }
    },

    async teardown() {
      for (const coordinator of this.coordinators) {
        try {
          await coordinator.shutdown();
        } catch (error) {
          // Ignore shutdown errors
        }
      }
      this.metrics.stopCollection();
    },
  },

  {
    name: 'system-resilience-under-failure',
    description: 'Test system behavior when components fail',
    async setup() {
      this.metrics = new PerformanceMetrics();
      this.metrics.startCollection();

      this.observability = new ObservabilitySystem();
      await this.observability.initialize();

      // Create 5 coordinator instances
      this.coordinators = [];
      this.executionEngines = [];

      for (let i = 0; i < 5; i++) {
        const engine = new ExecutionEngine({
          aiRouter: new SmartAIRouter(),
          agentRegistry: new AgentRegistry(),
          observability: this.observability,
        });
        await engine.initialize();
        this.executionEngines.push(engine);

        const coordinator = new DistributedCoordinator({
          instanceId: `resilience-instance-${i}`,
          port: 8140 + i,
          executionEngine: engine,
          agentRegistry: new AgentRegistry(),
          enableWebSocket: true,
          enableHttpApi: true,
          enableDiscovery: true,
          maxConcurrentTasks: 8,
          enableFailover: true,
        });

        await coordinator.initialize();
        this.coordinators.push(coordinator);
      }

      // Let them discover each other
      await new Promise((resolve) => setTimeout(resolve, 3000));
    },

    async run() {
      // Submit 50 tasks
      const tasks = Array.from({ length: 50 }, (_, i) => ({
        input: `Resilience test task ${i}`,
        mode: 'simple',
        timeout: 15000, // 15 second timeout
      }));

      // Start submitting tasks
      const taskPromises = tasks.map((task) => this.coordinators[0].submitTask(task));

      // Simulate failures during execution
      const failureSchedule = [
        { delay: 2000, instances: [2, 3] }, // Fail instances 2 and 3 after 2 seconds
        { delay: 5000, instances: [1] }, // Fail instance 1 after 5 seconds
      ];

      for (const failure of failureSchedule) {
        setTimeout(async () => {
          for (const instanceIdx of failure.instances) {
            try {
              await this.coordinators[instanceIdx].shutdown();
              this.metrics.recordMetric('integration.instance_failure', 1, {
                instance: instanceIdx,
              });
            } catch (error) {
              // Ignore shutdown errors
            }
          }
        }, failure.delay);
      }

      const startTime = Date.now();
      const results = await Promise.allSettled(taskPromises);
      const duration = Date.now() - startTime;

      // Analyze results
      const fulfilled = results.filter((r) => r.status === 'fulfilled').length;
      const rejected = results.filter((r) => r.status === 'rejected').length;
      const successful = results.filter(
        (r) => r.status === 'fulfilled' && r.value?.success !== false
      ).length;

      this.metrics.recordLatency('system-resilience', duration);
      this.metrics.recordThroughput('system-resilience', fulfilled, duration);
      this.metrics.recordMetric('integration.tasks_completed', successful);
      this.metrics.recordMetric('integration.tasks_failed', rejected);

      // Calculate resilience score (tasks completed / total tasks)
      const resilienceScore = successful / tasks.length;
      this.metrics.recordMetric('integration.resilience_score', Math.round(resilienceScore * 100));
    },

    async teardown() {
      for (const coordinator of this.coordinators) {
        try {
          await coordinator.shutdown();
        } catch (error) {
          // Ignore shutdown errors
        }
      }
      this.metrics.stopCollection();
    },
  },

  {
    name: 'memory-usage-under-load',
    description: 'Monitor memory usage patterns under sustained load',
    async setup() {
      this.metrics = new PerformanceMetrics({ collectionInterval: 1000 }); // 1 second intervals
      this.metrics.startCollection();

      this.observability = new ObservabilitySystem();
      await this.observability.initialize();

      this.executionEngine = new ExecutionEngine({
        aiRouter: new SmartAIRouter(),
        agentRegistry: new AgentRegistry(),
        observability: this.observability,
      });

      this.coordinator = new DistributedCoordinator({
        instanceId: 'memory-test',
        port: 8150,
        executionEngine: this.executionEngine,
        agentRegistry: new AgentRegistry(),
        enableWebSocket: false,
        enableHttpApi: false,
        enableDiscovery: false,
        maxConcurrentTasks: 20,
      });

      await this.executionEngine.initialize();
      await this.coordinator.initialize();
    },

    async run() {
      // Run sustained load for 30 seconds
      const testDuration = 30000;
      const startTime = Date.now();
      let taskCount = 0;
      const tasks = [];

      while (Date.now() - startTime < testDuration) {
        // Submit batches of tasks
        const batch = Array.from({ length: 5 }, (_, i) => ({
          input: `Memory test task ${taskCount + i}: ${Math.random().toString(36)}`,
          mode: 'simple',
        }));

        const batchPromises = batch.map((task) => this.coordinator.submitTask(task));
        tasks.push(...batchPromises);
        taskCount += batch.length;

        // Small delay between batches
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Wait for all tasks to complete
      const results = await Promise.all(tasks);
      const duration = Date.now() - startTime;

      // Collect memory metrics
      const memoryStats = this.metrics.getMetricStats('system.memory.heapUsed');
      const resourceUsage = this.metrics.getResourceUsage();

      this.metrics.recordMetric('memory.peak_usage_mb', resourceUsage?.memory?.maxMB || 0);
      this.metrics.recordMetric('memory.average_usage_mb', resourceUsage?.memory?.averageMB || 0);
      this.metrics.recordThroughput('memory-test-throughput', taskCount, duration);

      // Check for memory leaks (compare start and end memory)
      const startMemory = this.metrics.metrics.memory[0]?.heapUsedMB || 0;
      const endMemory =
        this.metrics.metrics.memory[this.metrics.metrics.memory.length - 1]?.heapUsedMB || 0;
      const memoryGrowth = endMemory - startMemory;

      this.metrics.recordMetric('memory.growth_mb', memoryGrowth);
      this.metrics.recordMetric('memory.leak_detected', memoryGrowth > 50 ? 1 : 0); // >50MB growth indicates potential leak
    },

    async teardown() {
      await this.coordinator.shutdown();
      this.metrics.stopCollection();

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    },
  },
];
