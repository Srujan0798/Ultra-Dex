# Ultra-Dex Performance Benchmarking & Metrics System

This directory contains a comprehensive performance benchmarking and metrics system for Ultra-Dex, providing tools to measure, monitor, and analyze system performance.

## Overview

The benchmarking system includes:

- **Performance Benchmarks**: Automated tests for core components, distributed coordination, and system integration
- **Metrics Collection**: Real-time performance metrics collection with latency, throughput, and resource usage tracking
- **Regression Testing**: Automated performance regression detection
- **Metrics Dashboard**: Web-based dashboard for real-time monitoring
- **Benchmark Runner**: CLI tool for executing benchmark suites

## Directory Structure

```
benchmarks/
├── core/                          # Core component benchmarks
│   └── execution-engine-benchmarks.js
├── distributed/                   # Distributed coordinator benchmarks
│   └── distributed-coordinator-benchmarks.js
├── integration/                   # System integration benchmarks
│   └── system-integration-benchmarks.js
├── regression/                    # Performance regression tests
│   └── performance-regression-tests.js
├── dashboard/                     # Metrics dashboard
│   └── metrics-dashboard.js
├── performance-metrics.js         # Metrics collection system
├── benchmark-runner.js            # Benchmark execution engine
└── run-benchmarks.js              # CLI runner script
```

## Quick Start

### Running Benchmarks

```bash
# Run all benchmark suites
node benchmarks/run-benchmarks.js all

# Run specific benchmark suites
node benchmarks/run-benchmarks.js core
node benchmarks/run-benchmarks.js distributed
node benchmarks/run-benchmarks.js integration

# Run performance regression tests
node benchmarks/run-benchmarks.js regression
```

### Starting Metrics Dashboard

```javascript
import { MetricsDashboard } from './benchmarks/dashboard/metrics-dashboard.js';

const dashboard = new MetricsDashboard({
  port: 3001,
  performanceMetrics: myPerformanceMetrics,
  observability: myObservabilitySystem,
});

await dashboard.start();
```

Then visit `http://localhost:3001` for the dashboard.

### Using Performance Metrics

```javascript
import { PerformanceMetrics } from './benchmarks/performance-metrics.js';

const metrics = new PerformanceMetrics();
metrics.startCollection();

// Record metrics
metrics.recordLatency('operation.name', duration, { userId: '123' });
metrics.recordThroughput('operation.name', 10, 1000); // 10 operations per second
metrics.recordMetric('custom.metric', value, { tags: 'here' });

// Get statistics
const latencyStats = metrics.getLatencyPercentiles('operation.name');
const throughputStats = metrics.getThroughputStats('operation.name');
const resourceUsage = metrics.getResourceUsage();
```

## Benchmark Suites

### Core Benchmarks (`core/`)

Tests individual components:

- **ExecutionEngine**: Task execution performance, step processing, streaming
- Measures latency, throughput, and resource usage for various task types

### Distributed Benchmarks (`distributed/`)

Tests distributed coordination:

- **DistributedCoordinator**: Load balancing, failover, heartbeats
- Measures delegation performance, peer communication, failover recovery

### Integration Benchmarks (`integration/`)

Tests full system performance:

- **System Workflow**: End-to-end task processing
- **High Throughput**: Concurrent task processing under load
- **Resilience**: System behavior under failure conditions
- **Memory Usage**: Memory leak detection and usage patterns

### Regression Tests (`regression/`)

Performance regression detection:

- Compares current performance against baseline metrics
- Alerts on significant performance degradation
- Supports configurable thresholds and baselines

## Metrics Collected

### Latency Metrics

- Task execution time
- Step processing time
- API response time
- Network communication time

### Throughput Metrics

- Tasks per second
- Operations per second
- Data processing rates

### Resource Usage Metrics

- Memory usage (heap, RSS)
- CPU utilization
- System load
- Network I/O

### Custom Metrics

- Error rates
- Cache hit rates
- Queue depths
- Connection counts

## Configuration

### Benchmark Runner Options

```javascript
const runner = new BenchmarkRunner({
  outputDir: './benchmark-results', // Results output directory
  warmUpRuns: 3, // Warm-up iterations
  measurementRuns: 10, // Measurement iterations
  timeout: 30000, // Timeout per benchmark (ms)
});
```

### Performance Metrics Options

```javascript
const metrics = new PerformanceMetrics({
  collectionInterval: 5000, // Collection interval (ms)
  retentionPeriod: 3600000, // Data retention (ms)
});
```

### Metrics Dashboard Options

```javascript
const dashboard = new MetricsDashboard({
  port: 3001, // Dashboard port
  host: 'localhost', // Dashboard host
  enableCors: true, // Enable CORS
});
```

## Results Analysis

Benchmark results are stored as JSON files in the `benchmark-results/` directory:

```
benchmark-results/
├── core/
│   └── execution-engine-benchmarks_2026-04-03T19-02-56.123Z.json
├── distributed/
│   └── distributed-coordinator-benchmarks_2026-04-03T19-02-56.123Z.json
└── regression/
    └── execution-engine-regression-test_2026-04-03T19-02-56.123Z.json
```

Each result file contains:

- Benchmark metadata (name, timestamp, iterations)
- Performance statistics (mean, median, p95, p99, std dev)
- Success/failure status
- Error details (if applicable)

## Integration with Ultra-Dex

The benchmarking system integrates with Ultra-Dex components:

### ExecutionEngine Integration

```javascript
const engine = new ExecutionEngine({
  enablePerformanceMetrics: true,
  performanceMetrics: sharedMetricsInstance,
});
```

### DistributedCoordinator Integration

```javascript
const coordinator = new DistributedCoordinator({
  enablePerformanceMetrics: true,
  performanceMetrics: sharedMetricsInstance,
});
```

### Observability Integration

The system works with the existing `ObservabilitySystem` for comprehensive monitoring.

## Performance Baselines

Create baseline files for regression testing:

```javascript
// benchmarks/baselines/execution-engine-regression-test.json
{
  "baseline": {
    "mean": 1500,
    "max": 3000,
    "p95": 2000
  },
  "threshold": 1.2,
  "created": "2026-04-03T19:02:56.123Z"
}
```

## API Reference

### BenchmarkRunner

- `runSuite(name, benchmarks)`: Run a suite of benchmarks
- `runBenchmark(benchmark)`: Run a single benchmark
- `compareWithBaseline(results, baselinePath)`: Compare results with baseline

### PerformanceMetrics

- `startCollection()`: Start metrics collection
- `stopCollection()`: Stop metrics collection
- `recordLatency(operation, duration, tags)`: Record latency measurement
- `recordThroughput(operation, count, timeWindow, tags)`: Record throughput measurement
- `recordMetric(name, value, tags)`: Record custom metric
- `getLatencyPercentiles(operation, timeRange)`: Get latency statistics
- `getThroughputStats(operation, timeRange)`: Get throughput statistics
- `getResourceUsage()`: Get current resource usage
- `exportForDashboard()`: Export metrics for dashboard

### MetricsDashboard

- `start()`: Start dashboard server
- `stop()`: Stop dashboard server

## Best Practices

1. **Warm-up Runs**: Always include warm-up iterations for JIT compilation
2. **Statistical Significance**: Use sufficient measurement runs (10+ recommended)
3. **Isolated Testing**: Run benchmarks in isolated environments
4. **Baseline Updates**: Update baselines when making intentional performance changes
5. **Continuous Monitoring**: Use the dashboard for ongoing performance monitoring
6. **Resource Monitoring**: Monitor system resources during benchmark runs

## Troubleshooting

### Common Issues

1. **Timeout Errors**: Increase timeout values for long-running benchmarks
2. **Memory Issues**: Reduce concurrent operations or increase memory limits
3. **Network Errors**: Ensure proper network configuration for distributed tests
4. **File Permission Errors**: Check write permissions for results directory

### Debug Mode

Enable debug logging:

```bash
DEBUG=benchmark:* node benchmarks/run-benchmarks.js core
```

## Contributing

When adding new benchmarks:

1. Follow the existing benchmark structure
2. Include proper setup/teardown
3. Add meaningful names and descriptions
4. Include performance assertions where applicable
5. Update this README with new benchmark descriptions

## License

Copyright (c) 2026 Ultra-Dex
