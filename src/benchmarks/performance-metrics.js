// Performance metrics module
export class PerformanceMetrics {
  constructor() {
    this.metrics = new Map();
  }

  startTimer(name) {
    this.metrics.set(name, { start: Date.now() });
  }

  endTimer(name) {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.duration = Date.now() - metric.start;
    }
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  reset() {
    this.metrics.clear();
  }
}

export default PerformanceMetrics;
