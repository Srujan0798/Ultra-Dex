// Copyright (c) 2026 Ultra-Dex
// benchmarks/regression/performance-regression-tests.js

import { ExecutionEngine } from '../../src/core/orchestration/execution-engine.js';
import { DistributedCoordinator } from '../../src/core/orchestration/distributed-coordinator.js';
import { SmartAIRouter } from '../../src/core/ai/router.js';
import { AgentRegistry } from '../../src/core/orchestration/registry.js';
import { PerformanceMetrics } from '../performance-metrics.js';
import BenchmarkRunner from '../benchmark-runner.js';

/**
 * Performance regression tests that compare against baseline metrics
 */
export const performanceRegressionTests = [
  {
    name: 'execution-engine-regression-test',
    description: "Ensure ExecutionEngine performance hasn't regressed",
    baseline: {
      mean: 1500, // 1.5 seconds baseline
      max: 3000, // 3 seconds max
      p95: 2000, // 2 seconds p95
    },
    threshold: 1.2, // 20% degradation allowed

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
        id: 'regression-test-task',
        input: 'Write a function to calculate fibonacci numbers',
        agent: 'test-agent',
        steps: [
          {
            id: 'fibonacci-step',
            type: 'generate',
            params: {
              prompt:
                'Write a JavaScript function that calculates the nth Fibonacci number efficiently',
              model: 'gpt-3.5-turbo',
            },
          },
        ],
      };

      const startTime = Date.now();
      const result = await this.executionEngine.execute(task);
      const duration = Date.now() - startTime;

      this.metrics.recordLatency('execution-regression', duration);

      return {
        duration,
        success: !result.error,
        resultSize: JSON.stringify(result).length,
      };
    },

    async teardown() {
      this.metrics.stopCollection();
    },

    validate: function (result, baseline) {
      const degradation = result.duration / baseline.mean;
      const withinThreshold = degradation <= this.threshold;

      return {
        passed: withinThreshold,
        degradation: Math.round(degradation * 100) / 100,
        threshold: this.threshold,
        actual: result.duration,
        baseline: baseline.mean,
        message: withinThreshold
          ? `Performance acceptable (${degradation}x baseline)`
          : `Performance regression detected (${degradation}x baseline, threshold: ${this.threshold}x)`,
      };
    },
  },

  {
    name: 'distributed-coordinator-regression-test',
    description: "Ensure DistributedCoordinator performance hasn't regressed",
    baseline: {
      mean: 2000, // 2 seconds baseline
      throughput: 5, // 5 tasks per second
    },
    threshold: 1.5, // 50% degradation allowed

    async setup() {
      this.metrics = new PerformanceMetrics();
      this.metrics.startCollection();

      this.executionEngine = new ExecutionEngine({
        aiRouter: new SmartAIRouter(),
        agentRegistry: new AgentRegistry(),
      });

      this.coordinator = new DistributedCoordinator({
        instanceId: 'regression-coordinator',
        port: 8160,
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
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        input: `Regression test task ${i}: Generate a random UUID`,
        mode: 'simple',
      }));

      const startTime = Date.now();
      const results = await Promise.all(tasks.map((task) => this.coordinator.submitTask(task)));
      const duration = Date.now() - startTime;

      const successfulTasks = results.filter((r) => r.success !== false).length;
      const throughput = successfulTasks / (duration / 1000);

      this.metrics.recordLatency('distributed-regression', duration);
      this.metrics.recordThroughput('distributed-regression', successfulTasks, duration);

      return {
        duration,
        throughput,
        successfulTasks,
        totalTasks: tasks.length,
      };
    },

    async teardown() {
      await this.coordinator.shutdown();
      this.metrics.stopCollection();
    },

    validate: function (result, baseline) {
      const durationDegradation = result.duration / baseline.mean;
      const throughputDegradation = baseline.throughput / result.throughput;

      const durationOk = durationDegradation <= this.threshold;
      const throughputOk = throughputDegradation <= this.threshold;

      const passed = durationOk && throughputOk;

      return {
        passed,
        durationDegradation: Math.round(durationDegradation * 100) / 100,
        throughputDegradation: Math.round(throughputDegradation * 100) / 100,
        threshold: this.threshold,
        actualDuration: result.duration,
        actualThroughput: Math.round(result.throughput * 100) / 100,
        baselineDuration: baseline.mean,
        baselineThroughput: baseline.throughput,
        message: passed
          ? 'Performance acceptable'
          : `Performance regression detected (duration: ${durationDegradation}x, throughput: ${throughputDegradation}x)`,
      };
    },
  },

  {
    name: 'memory-regression-test',
    description: "Ensure memory usage hasn't increased significantly",
    baseline: {
      averageMB: 100, // 100MB average
      peakMB: 200, // 200MB peak
    },
    threshold: 1.3, // 30% increase allowed

    async setup() {
      this.metrics = new PerformanceMetrics({ collectionInterval: 500 });
      this.metrics.startCollection();

      this.executionEngine = new ExecutionEngine({
        aiRouter: new SmartAIRouter(),
        agentRegistry: new AgentRegistry(),
      });

      await this.executionEngine.initialize();
    },

    async run() {
      // Run memory-intensive workload
      const tasks = Array.from({ length: 20 }, (_, i) => ({
        id: `memory-regression-${i}`,
        input: `Analyze this large text: ${'x'.repeat(10000)}`, // 10KB of text per task
        agent: 'test-agent',
        steps: [
          {
            id: `step-${i}`,
            type: 'generate',
            params: {
              prompt: 'Summarize the following text and extract key points',
              model: 'gpt-3.5-turbo',
            },
          },
        ],
      }));

      const startTime = Date.now();
      await Promise.all(tasks.map((task) => this.executionEngine.execute(task)));
      const duration = Date.now() - startTime;

      // Collect memory statistics
      const resourceUsage = this.metrics.getResourceUsage();

      return {
        duration,
        memoryAvg: resourceUsage?.memory?.averageMB || 0,
        memoryPeak: resourceUsage?.memory?.maxMB || 0,
        tasksProcessed: tasks.length,
      };
    },

    async teardown() {
      this.metrics.stopCollection();

      // Force garbage collection
      if (global.gc) {
        global.gc();
      }
    },

    validate: function (result, baseline) {
      const avgIncrease = result.memoryAvg / baseline.averageMB;
      const peakIncrease = result.memoryPeak / baseline.peakMB;

      const avgOk = avgIncrease <= this.threshold;
      const peakOk = peakIncrease <= this.threshold;

      const passed = avgOk && peakOk;

      return {
        passed,
        avgIncrease: Math.round(avgIncrease * 100) / 100,
        peakIncrease: Math.round(peakIncrease * 100) / 100,
        threshold: this.threshold,
        actualAvg: result.memoryAvg,
        actualPeak: result.memoryPeak,
        baselineAvg: baseline.averageMB,
        baselinePeak: baseline.peakMB,
        message: passed
          ? 'Memory usage acceptable'
          : `Memory regression detected (avg: ${avgIncrease}x, peak: ${peakIncrease}x baseline)`,
      };
    },
  },

  {
    name: 'streaming-performance-regression-test',
    description: "Ensure streaming performance hasn't regressed",
    baseline: {
      firstChunkLatency: 500, // 500ms to first chunk
      totalLatency: 2500, // 2.5 seconds total
      chunksPerSecond: 10, // 10 chunks per second
    },
    threshold: 1.4, // 40% degradation allowed

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
        id: 'streaming-regression-test',
        input: 'Write a detailed explanation of machine learning concepts',
        agent: 'test-agent',
        steps: [
          {
            id: 'streaming-step',
            type: 'generate',
            params: {
              prompt:
                'Explain supervised learning, unsupervised learning, and reinforcement learning in detail',
              model: 'gpt-3.5-turbo',
            },
          },
        ],
      };

      const chunks = [];
      let firstChunkTime = null;
      const startTime = Date.now();

      for await (const chunk of this.executionEngine.executeStream(task, {
        onProgress: (progress) => {
          if (progress.type === 'step_complete' && progress.result) {
            chunks.push(progress);

            if (firstChunkTime === null) {
              firstChunkTime = Date.now() - startTime;
            }
          }
        },
      })) {
        // Collect all chunks
      }

      const totalDuration = Date.now() - startTime;
      const chunksPerSecond = chunks.length / (totalDuration / 1000);

      this.metrics.recordLatency('streaming-first-chunk', firstChunkTime || totalDuration);
      this.metrics.recordLatency('streaming-total', totalDuration);
      this.metrics.recordThroughput('streaming-chunks', chunks.length, totalDuration);

      return {
        firstChunkLatency: firstChunkTime,
        totalLatency: totalDuration,
        chunksCount: chunks.length,
        chunksPerSecond: Math.round(chunksPerSecond * 100) / 100,
      };
    },

    async teardown() {
      this.metrics.stopCollection();
    },

    validate: function (result, baseline) {
      const firstChunkDegradation =
        (result.firstChunkLatency || result.totalLatency) / baseline.firstChunkLatency;
      const totalDegradation = result.totalLatency / baseline.totalLatency;
      const throughputDegradation = baseline.chunksPerSecond / result.chunksPerSecond;

      const firstChunkOk = firstChunkDegradation <= this.threshold;
      const totalOk = totalDegradation <= this.threshold;
      const throughputOk = throughputDegradation <= this.threshold;

      const passed = firstChunkOk && totalOk && throughputOk;

      return {
        passed,
        firstChunkDegradation: Math.round(firstChunkDegradation * 100) / 100,
        totalDegradation: Math.round(totalDegradation * 100) / 100,
        throughputDegradation: Math.round(throughputDegradation * 100) / 100,
        threshold: this.threshold,
        actualFirstChunk: result.firstChunkLatency,
        actualTotal: result.totalLatency,
        actualThroughput: result.chunksPerSecond,
        baselineFirstChunk: baseline.firstChunkLatency,
        baselineTotal: baseline.totalLatency,
        baselineThroughput: baseline.chunksPerSecond,
        message: passed ? 'Streaming performance acceptable' : `Streaming regression detected`,
      };
    },
  },
];

/**
 * Run regression tests and compare against baselines
 */
export async function runPerformanceRegressionTests() {
  const runner = new BenchmarkRunner({
    outputDir: './benchmark-results/regression',
    warmUpRuns: 2,
    measurementRuns: 5, // Fewer runs for regression tests
  });

  console.log('Running performance regression tests...\n');

  for (const test of performanceRegressionTests) {
    try {
      console.log(`Running regression test: ${test.name}`);

      // Run the test
      const result = await runner.runBenchmark(test);

      // Load baseline if available
      let baseline = test.baseline;
      const baselinePath = `./benchmarks/baselines/${test.name}.json`;

      try {
        const baselineData = JSON.parse(await fs.readFile(baselinePath, 'utf8'));
        baseline = baselineData.baseline || test.baseline;
      } catch (error) {
        console.log(`No baseline found for ${test.name}, using default`);
      }

      // Validate against baseline
      const validation = test.validate(result.stats, baseline);

      console.log(`Result: ${validation.passed ? 'PASS' : 'FAIL'}`);
      console.log(`Message: ${validation.message}`);
      console.log(`Stats:`, result.stats);
      console.log('---\n');

      // Save result for future baselines
      const regressionResult = {
        test: test.name,
        timestamp: new Date().toISOString(),
        result: result.stats,
        baseline,
        validation,
      };

      await fs.mkdir('./benchmark-results/regression', { recursive: true });
      await fs.writeFile(
        `./benchmark-results/regression/${test.name}_${Date.now()}.json`,
        JSON.stringify(regressionResult, null, 2)
      );
    } catch (error) {
      console.error(`Regression test ${test.name} failed:`, error.message);
    }
  }
}
