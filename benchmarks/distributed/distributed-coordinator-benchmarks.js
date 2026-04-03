// Copyright (c) 2026 Ultra-Dex
// benchmarks/distributed/distributed-coordinator-benchmarks.js

import { DistributedCoordinator } from '../../src/core/orchestration/distributed-coordinator.js';
import { ExecutionEngine } from '../../src/core/orchestration/execution-engine.js';
import { SmartAIRouter } from '../../src/core/ai/router.js';
import { AgentRegistry } from '../../src/core/orchestration/registry.js';
import { PerformanceMetrics } from '../performance-metrics.js';

/**
 * Benchmarks for DistributedCoordinator performance
 */
export const distributedCoordinatorBenchmarks = [
  {
    name: 'distributed-coordinator-local-execution',
    description: 'Execute task locally via DistributedCoordinator',
    async setup() {
      this.metrics = new PerformanceMetrics();
      this.metrics.startCollection();

      this.executionEngine = new ExecutionEngine({
        aiRouter: new SmartAIRouter(),
        agentRegistry: new AgentRegistry(),
      });

      this.coordinator = new DistributedCoordinator({
        instanceId: 'benchmark-instance',
        port: 8081,
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
      const task = {
        input: 'Calculate the sum of numbers from 1 to 100',
        mode: 'simple',
      };

      const startTime = Date.now();
      const result = await this.coordinator.submitTask(task);
      const duration = Date.now() - startTime;

      this.metrics.recordLatency('distributed-local-execution', duration);
    },

    async teardown() {
      await this.coordinator.shutdown();
      this.metrics.stopCollection();
    },
  },

  {
    name: 'distributed-coordinator-load-balancing',
    description: 'Test load balancing across multiple instances',
    async setup() {
      this.metrics = new PerformanceMetrics();
      this.metrics.startCollection();

      // Create multiple coordinator instances
      this.coordinators = [];
      for (let i = 0; i < 3; i++) {
        const executionEngine = new ExecutionEngine({
          aiRouter: new SmartAIRouter(),
          agentRegistry: new AgentRegistry(),
        });

        const coordinator = new DistributedCoordinator({
          instanceId: `benchmark-instance-${i}`,
          port: 8080 + i,
          executionEngine,
          agentRegistry: new AgentRegistry(),
          enableWebSocket: true,
          enableHttpApi: true,
          enableDiscovery: true,
          maxConcurrentTasks: 5,
        });

        await executionEngine.initialize();
        await coordinator.initialize();
        this.coordinators.push(coordinator);
      }

      // Let them discover each other
      await new Promise((resolve) => setTimeout(resolve, 2000));
    },

    async run() {
      // Submit multiple tasks to the first coordinator
      const tasks = Array.from({ length: 20 }, (_, i) => ({
        input: `Process item ${i}`,
        mode: 'simple',
      }));

      const startTime = Date.now();
      const results = await Promise.all(tasks.map((task) => this.coordinators[0].submitTask(task)));
      const duration = Date.now() - startTime;

      this.metrics.recordLatency('distributed-load-balancing', duration);
      this.metrics.recordThroughput('distributed-load-balancing', tasks.length, duration);

      // Record delegation metrics
      const delegatedTasks = results.filter((r) => r.status === 'delegated').length;
      this.metrics.recordMetric('distributed.delegated_tasks', delegatedTasks);
    },

    async teardown() {
      for (const coordinator of this.coordinators) {
        await coordinator.shutdown();
      }
      this.metrics.stopCollection();
    },
  },

  {
    name: 'distributed-coordinator-failover',
    description: 'Test failover when an instance goes down',
    async setup() {
      this.metrics = new PerformanceMetrics();
      this.metrics.startCollection();

      // Create coordinator instances
      this.coordinators = [];
      for (let i = 0; i < 2; i++) {
        const executionEngine = new ExecutionEngine({
          aiRouter: new SmartAIRouter(),
          agentRegistry: new AgentRegistry(),
        });

        const coordinator = new DistributedCoordinator({
          instanceId: `failover-instance-${i}`,
          port: 8090 + i,
          executionEngine,
          agentRegistry: new AgentRegistry(),
          enableWebSocket: true,
          enableHttpApi: true,
          enableDiscovery: true,
          maxConcurrentTasks: 3,
        });

        await executionEngine.initialize();
        await coordinator.initialize();
        this.coordinators.push(coordinator);
      }

      // Let them discover each other
      await new Promise((resolve) => setTimeout(resolve, 2000));
    },

    async run() {
      // Submit tasks to first coordinator
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        input: `Task ${i} for failover test`,
        mode: 'simple',
      }));

      // Start some long-running tasks
      const taskPromises = tasks.map((task) => this.coordinators[0].submitTask(task));

      // Simulate failure of second coordinator after 2 seconds
      setTimeout(async () => {
        await this.coordinators[1].shutdown();
        this.metrics.recordMetric('distributed.failover_triggered', 1);
      }, 2000);

      const startTime = Date.now();
      const results = await Promise.all(taskPromises);
      const duration = Date.now() - startTime;

      this.metrics.recordLatency('distributed-failover', duration);

      // Check how many tasks were redistributed
      const failedTasks = results.filter((r) => r.error).length;
      this.metrics.recordMetric('distributed.failed_tasks', failedTasks);
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
    name: 'distributed-coordinator-heartbeat-performance',
    description: 'Test heartbeat and health check performance',
    async setup() {
      this.metrics = new PerformanceMetrics();
      this.metrics.startCollection();

      this.coordinators = [];
      for (let i = 0; i < 5; i++) {
        const coordinator = new DistributedCoordinator({
          instanceId: `heartbeat-instance-${i}`,
          port: 8100 + i,
          heartbeatInterval: 1000, // 1 second for testing
          healthCheckInterval: 2000, // 2 seconds for testing
          enableWebSocket: true,
          enableHttpApi: true,
          enableDiscovery: true,
        });

        await coordinator.initialize();
        this.coordinators.push(coordinator);
      }

      // Let them discover each other
      await new Promise((resolve) => setTimeout(resolve, 3000));
    },

    async run() {
      // Let heartbeats run for measurement period
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Collect metrics from coordinators
      const metrics = this.coordinators.map((c) => c.getMetrics());

      const avgResponseTime =
        metrics.reduce((sum, m) => sum + (m.avgResponseTime || 0), 0) / metrics.length;
      const totalTasks = metrics.reduce((sum, m) => sum + m.tasksProcessed, 0);
      const totalDelegated = metrics.reduce((sum, m) => sum + m.tasksDelegated, 0);

      this.metrics.recordLatency('distributed-heartbeat', avgResponseTime);
      this.metrics.recordMetric('distributed.total_tasks_processed', totalTasks);
      this.metrics.recordMetric('distributed.total_tasks_delegated', totalDelegated);
    },

    async teardown() {
      for (const coordinator of this.coordinators) {
        await coordinator.shutdown();
      }
      this.metrics.stopCollection();
    },
  },
];
