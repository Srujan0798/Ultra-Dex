import { performance } from 'perf_hooks';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

interface PerformanceEvent {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryBefore?: number;
  memoryAfter?: number;
}

interface FlameGraphNode {
  name: string;
  value: number;
  children: FlameGraphNode[];
}

export class Profiler extends EventEmitter {
  private events: PerformanceEvent[] = [];
  private activeSpans: Map<string, number> = new Map();
  private isRecording = false;

  startRecording(): void {
    this.isRecording = true;
    this.events = [];
    this.activeSpans.clear();
  }

  stopRecording(): PerformanceEvent[] {
    this.isRecording = false;
    return [...this.events];
  }

  startSpan(name: string): string {
    if (!this.isRecording) return name;

    const spanId = `${name}_${Date.now()}`;
    this.activeSpans.set(spanId, performance.now());

    return spanId;
  }

  endSpan(spanId: string): PerformanceEvent | undefined {
    if (!this.isRecording) return undefined;

    const startTime = this.activeSpans.get(spanId);
    if (!startTime) return undefined;

    this.activeSpans.delete(spanId);

    const endTime = performance.now();
    const event: PerformanceEvent = {
      name: spanId.split('_')[0],
      startTime,
      endTime,
      duration: endTime - startTime,
      memoryBefore: 0,
      memoryAfter: process.memoryUsage().heapUsed / 1024 / 1024,
    };

    this.events.push(event);
    this.emit('event', event);

    return event;
  }

  measure<T>(name: string, fn: () => T): T {
    const spanId = this.startSpan(name);
    try {
      return fn();
    } finally {
      this.endSpan(spanId);
    }
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const spanId = this.startSpan(name);
    try {
      return await fn();
    } finally {
      this.endSpan(spanId);
    }
  }

  generateFlameGraph(): FlameGraphNode {
    const root: FlameGraphNode = { name: 'root', value: 0, children: [] };

    for (const event of this.events) {
      this.insertIntoFlameGraph(root, event);
    }

    return root;
  }

  private insertIntoFlameGraph(root: FlameGraphNode, event: PerformanceEvent): void {
    const parts = event.name.split(':');
    let current = root;

    for (const part of parts) {
      let child = current.children.find((c) => c.name === part);
      if (!child) {
        child = { name: part, value: 0, children: [] };
        current.children.push(child);
      }
      current = child;
    }

    current.value += event.duration;
  }

  async exportToChromeDevTools(outputPath: string): Promise<void> {
    const events = this.events.map((e) => ({
      name: e.name,
      ph: 'X', // Complete event
      ts: Math.round(e.startTime * 1000), // Convert to microseconds
      dur: Math.round(e.duration * 1000),
      pid: 1,
      tid: 1,
    }));

    await fs.writeFile(outputPath, JSON.stringify(events));
  }

  getSummary(): Record<string, { count: number; totalTime: number; avgTime: number; p95: number }> {
    const byName: Record<string, number[]> = {};

    for (const event of this.events) {
      if (!byName[event.name]) {
        byName[event.name] = [];
      }
      byName[event.name].push(event.duration);
    }

    const summary: Record<
      string,
      { count: number; totalTime: number; avgTime: number; p95: number }
    > = {};

    for (const [name, times] of Object.entries(byName)) {
      times.sort((a, b) => a - b);
      const p95Index = Math.floor(times.length * 0.95);

      summary[name] = {
        count: times.length,
        totalTime: times.reduce((a, b) => a + b, 0),
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
        p95: times[p95Index] || times[times.length - 1],
      };
    }

    return summary;
  }

  printReport(): void {
    const summary = this.getSummary();

    console.log('\n=== Performance Report ===\n');
    console.log('Operation                    Count   Total(ms)  Avg(ms)   P95(ms)');
    console.log('-'.repeat(70));

    for (const [name, stats] of Object.entries(summary).sort(
      (a, b) => b[1].totalTime - a[1].totalTime
    )) {
      console.log(
        `${name.padEnd(28)} ` +
          `${stats.count.toString().padStart(5)}   ` +
          `${stats.totalTime.toFixed(2).padStart(9)}  ` +
          `${stats.avgTime.toFixed(2).padStart(7)}  ` +
          `${stats.p95.toFixed(2).padStart(7)}`
      );
    }

    console.log('\nMemory Usage:');
    const usage = process.memoryUsage();
    console.log(`  RSS: ${(usage.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Used: ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Total: ${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log();
  }
}

export const profiler = new Profiler();
