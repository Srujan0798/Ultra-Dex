# Performance Optimization Guide

## Overview

This guide helps you optimize Ultra-Dex CLI performance. Use the built-in profiler to identify bottlenecks and apply these optimizations.

## Using the Profiler

### Basic Usage

```javascript
import { timeAsync, timeSync, showReport } from './lib/utils/profiler.js';

// Time an async operation
await timeAsync('file-scan', async () => {
  await scanProjectFiles();
});

// Time a sync operation
const result = timeSync('data-process', () => {
  return processData();
});

// Show performance report
showReport();
```

### Profiling a Full Command

```javascript
import { profileCommand } from './lib/utils/profiler.js';

await profileCommand('init', async () => {
  // Your command logic here
  await initializeProject();
});
```

### Manual Timing

```javascript
import { startTimer, endTimer } from './lib/utils/profiler.js';

startTimer('custom-operation');
// ... do work ...
const duration = endTimer('custom-operation');
console.log(`Operation took ${duration}ms`);
```

## Performance Targets

| Operation       | Target  | Critical Threshold |
| --------------- | ------- | ------------------ |
| Command startup | < 100ms | > 500ms            |
| File scan       | < 1s    | > 5s               |
| Graph build     | < 3s    | > 10s              |
| Agent pipeline  | < 30s   | > 60s              |
| API call        | < 5s    | > 15s              |
| Context sync    | < 2s    | > 5s               |

## Common Bottlenecks & Solutions

### 1. File System Operations

**Problem**: Excessive file reads/writes

**Solutions**:

- Use `Promise.all()` for parallel operations
- Implement file caching
- Batch file operations
- Exclude unnecessary directories

```javascript
// ❌ Slow: Sequential reads
for (const file of files) {
  await fs.readFile(file);
}

// ✅ Fast: Parallel reads
await Promise.all(files.map((f) => fs.readFile(f)));

// ✅ Fast: Batched reads
const BATCH_SIZE = 50;
for (let i = 0; i < files.length; i += BATCH_SIZE) {
  const batch = files.slice(i, i + BATCH_SIZE);
  await Promise.all(batch.map((f) => fs.readFile(f)));
}
```

### 2. Graph Scanning

**Problem**: Full project scan is slow on large projects

**Solutions**:

- Use caching with 30s TTL (already implemented)
- Exclude directories: `node_modules`, `.git`, `dist`, `build`
- Implement incremental scanning
- Limit file size analyzed

```javascript
// In mcp/graph.js
const cacheTimeout = 30000; // 30 seconds

async scan(useCache = true) {
  const now = Date.now();
  if (useCache && (now - this.lastScanTime) < cacheTimeout) {
    return this.getSummary();
  }
  // ... scan logic
}
```

### 3. API Calls

**Problem**: Slow AI provider responses

**Solutions**:

- Implement request timeouts (default: 30s)
- Use streaming for large responses
- Cache API responses when appropriate
- Implement retry logic with exponential backoff

```javascript
// Timeout handling
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch(url, {
    signal: controller.signal,
  });
} finally {
  clearTimeout(timeoutId);
}
```

### 4. State Management

**Problem**: Race conditions in state updates

**Solutions**:

- Use file locking (already implemented)
- Batch state updates
- Use atomic writes

```javascript
// File locking in state.js
async function withStateLock(callback) {
  const lockFile = path.join(process.cwd(), '.ultra-dex', 'state.lock');
  // ... lock implementation
}
```

### 5. Memory Usage

**Problem**: High memory consumption with large projects

**Solutions**:

- Stream file contents instead of loading all at once
- Use generators for lazy evaluation
- Clear references when done
- Implement pagination for large lists

```javascript
// ❌ High memory: Loading all files
const contents = await Promise.all(files.map((f) => fs.readFile(f, 'utf8')));

// ✅ Low memory: Streaming/chunking
for (const file of files) {
  const content = await fs.readFile(file, 'utf8');
  await processContent(content);
  // Content can be garbage collected
}
```

## Optimization Patterns

### Caching Strategy

```javascript
import { timeAsync } from './lib/utils/profiler.js';

class FileCache {
  constructor(ttl = 30000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  async get(key, fetchFn) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.time < this.ttl) {
      return cached.value;
    }

    const value = await timeAsync(`fetch-${key}`, fetchFn);
    this.cache.set(key, { value, time: Date.now() });
    return value;
  }
}
```

### Lazy Loading

```javascript
// Load expensive resources only when needed
class LazyLoader {
  constructor(loaderFn) {
    this.loaderFn = loaderFn;
    this.promise = null;
  }

  async get() {
    if (!this.promise) {
      this.promise = this.loaderFn();
    }
    return this.promise;
  }
}
```

### Connection Pooling

```javascript
// For API providers, reuse connections
class ApiClient {
  constructor() {
    this.agent = new Agent({ keepAlive: true });
  }

  async request(url, options) {
    return fetch(url, {
      ...options,
      agent: this.agent,
    });
  }
}
```

## Command-Specific Optimizations

### `init` Command

- Cache template files
- Parallel file creation
- Lazy dependency installation

### `brain` Command

- Incremental context updates
- Cache graph data
- Batch file analysis

### `swarm` Command

- Parallel agent execution (already implemented)
- Stream results
- Cache agent prompts

### `agents` Command

- Cache agent index
- Lazy load agent details
- Optimize search with indexing

## Benchmarking

### Run Built-in Benchmarks

```bash
# Profile a specific command
cd cli
node -e "
const { profileCommand } = require('./lib/utils/profiler.js');
const { init } = require('./lib/commands/init.js');

profileCommand('init', async () => {
  await init({ preview: true });
});
"
```

### Custom Benchmark Script

```javascript
import { timeAsync, showReport, clearMetrics } from './lib/utils/profiler.js';

async function benchmark() {
  clearMetrics();

  // Warm up
  await timeAsync('warmup', async () => {
    await fs.readdir('.');
  });

  // Actual benchmark
  for (let i = 0; i < 10; i++) {
    await timeAsync('operation', async () => {
      // Operation to benchmark
    });
  }

  showReport();
}

benchmark();
```

## Monitoring in Production

### Performance Budgets

Set budgets for critical paths:

```javascript
const BUDGETS = {
  'file-scan': 1000, // 1 second
  'graph-build': 3000, // 3 seconds
  'api-call': 5000, // 5 seconds
};

function checkBudget(operation, duration) {
  const budget = BUDGETS[operation];
  if (budget && duration > budget) {
    console.warn(
      `⚠️  Performance budget exceeded: ${operation} took ${duration}ms (budget: ${budget}ms)`
    );
  }
}
```

### Metrics Collection

```javascript
import { getStatistics } from './lib/utils/profiler.js';

// Export metrics for monitoring
const stats = getStatistics();
console.log(
  JSON.stringify({
    timestamp: new Date().toISOString(),
    performance: stats,
  })
);
```

## Best Practices

1. **Profile Before Optimizing**: Use profiler to identify actual bottlenecks
2. **Measure Impact**: Compare before/after metrics for every optimization
3. **Cache Strategically**: Cache expensive operations with appropriate TTL
4. **Fail Fast**: Validate inputs early to avoid wasted work
5. **Parallelize Wisely**: Use Promise.all() for independent operations
6. **Stream Large Data**: Don't load entire files into memory
7. **Use Appropriate Data Structures**: Maps for lookups, Sets for uniqueness
8. **Debounce Rapid Changes**: Don't trigger operations on every keystroke
9. **Lazy Load**: Defer loading until actually needed
10. **Monitor Continuously**: Track performance in CI/CD pipeline

## Tools & Resources

- **Node.js Profiler**: `node --prof`
- **Clinic.js**: `npx clinic doctor`
- **0x**: `npx 0x`
- **Built-in profiler**: `lib/utils/profiler.js`

## Getting Help

If you encounter performance issues:

1. Run with profiler enabled
2. Check performance report
3. Review optimization suggestions
4. File an issue with profiler output

---

_Last updated: February 2026_
