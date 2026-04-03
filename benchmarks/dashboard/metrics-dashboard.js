// Copyright (c) 2026 Ultra-Dex
// benchmarks/dashboard/metrics-dashboard.js

import express from 'express';
import { createLogger } from '../../src/utils/logging.js';
import { PerformanceMetrics } from '../performance-metrics.js';
import { ObservabilitySystem } from '../../src/core/system/observability.js';

/**
 * Metrics Dashboard for performance monitoring
 */
export class MetricsDashboard {
  constructor(options = {}) {
    this.options = {
      port: options.port || 3001,
      host: options.host || 'localhost',
      enableCors: options.enableCors !== false,
      ...options,
    };

    this.logger = createLogger('MetricsDashboard');
    this.app = express();
    this.server = null;

    this.performanceMetrics = options.performanceMetrics || new PerformanceMetrics();
    this.observability = options.observability || new ObservabilitySystem();
  }

  /**
   * Start the metrics dashboard server
   */
  async start() {
    // Middleware
    this.app.use(express.json());
    if (this.options.enableCors) {
      this.app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header(
          'Access-Control-Allow-Headers',
          'Origin, X-Requested-With, Content-Type, Accept, Authorization'
        );
        if (req.method === 'OPTIONS') {
          res.sendStatus(200);
        } else {
          next();
        }
      });
    }

    // Routes
    this.setupRoutes();

    // Start server
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.options.port, this.options.host, (err) => {
        if (err) {
          this.logger.error('Failed to start metrics dashboard', { error: err.message });
          reject(err);
        } else {
          this.logger.info('Metrics dashboard started', {
            url: `http://${this.options.host}:${this.options.port}`,
          });
          resolve(this);
        }
      });
    });
  }

  /**
   * Stop the metrics dashboard server
   */
  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          this.logger.info('Metrics dashboard stopped');
          resolve();
        });
      });
    }
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // Performance metrics
    this.app.get('/api/metrics/performance', (req, res) => {
      try {
        const metrics = this.performanceMetrics.exportForDashboard();
        res.json(metrics);
      } catch (error) {
        this.logger.error('Failed to get performance metrics', { error: error.message });
        res.status(500).json({ error: 'Failed to get performance metrics' });
      }
    });

    // Latency percentiles
    this.app.get('/api/metrics/latency/:operation', (req, res) => {
      try {
        const { operation } = req.params;
        const { timeRange = 300000 } = req.query; // 5 minutes default

        const percentiles = this.performanceMetrics.getLatencyPercentiles(
          operation,
          parseInt(timeRange)
        );
        res.json(percentiles || { operation, available: false });
      } catch (error) {
        this.logger.error('Failed to get latency metrics', { error: error.message });
        res.status(500).json({ error: 'Failed to get latency metrics' });
      }
    });

    // Throughput metrics
    this.app.get('/api/metrics/throughput/:operation', (req, res) => {
      try {
        const { operation } = req.params;
        const { timeRange = 300000 } = req.query;

        const throughput = this.performanceMetrics.getThroughputStats(
          operation,
          parseInt(timeRange)
        );
        res.json(throughput || { operation, available: false });
      } catch (error) {
        this.logger.error('Failed to get throughput metrics', { error: error.message });
        res.status(500).json({ error: 'Failed to get throughput metrics' });
      }
    });

    // Resource usage
    this.app.get('/api/metrics/resources', (req, res) => {
      try {
        const resourceUsage = this.performanceMetrics.getResourceUsage();
        res.json(resourceUsage);
      } catch (error) {
        this.logger.error('Failed to get resource metrics', { error: error.message });
        res.status(500).json({ error: 'Failed to get resource metrics' });
      }
    });

    // Observability dashboard
    this.app.get('/api/observability/dashboard', (req, res) => {
      try {
        const dashboard = this.observability.getDashboard();
        res.json(dashboard);
      } catch (error) {
        this.logger.error('Failed to get observability dashboard', { error: error.message });
        res.status(500).json({ error: 'Failed to get observability dashboard' });
      }
    });

    // Recent traces
    this.app.get('/api/observability/traces', (req, res) => {
      try {
        const { limit = 50 } = req.query;
        const traces = this.observability.getRecentTraces(parseInt(limit));
        res.json({ traces });
      } catch (error) {
        this.logger.error('Failed to get traces', { error: error.message });
        res.status(500).json({ error: 'Failed to get traces' });
      }
    });

    // Alerts
    this.app.get('/api/observability/alerts', (req, res) => {
      try {
        const { severity, acknowledged } = req.query;
        const filters = {};
        if (severity) filters.severity = severity;
        if (acknowledged !== undefined) filters.acknowledged = acknowledged === 'true';

        const alerts = this.observability.getAlerts(filters);
        res.json({ alerts });
      } catch (error) {
        this.logger.error('Failed to get alerts', { error: error.message });
        res.status(500).json({ error: 'Failed to get alerts' });
      }
    });

    // Benchmark results
    this.app.get('/api/benchmarks/results', async (req, res) => {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');

        const resultsDir = path.default.join(process.cwd(), 'benchmark-results');
        const files = await fs.readdir(resultsDir).catch(() => []);

        const results = [];
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const filePath = path.default.join(resultsDir, file);
              const content = await fs.readFile(filePath, 'utf8');
              const result = JSON.parse(content);
              results.push(result);
            } catch (error) {
              // Skip invalid files
            }
          }
        }

        res.json({ results: results.slice(-20) }); // Last 20 results
      } catch (error) {
        this.logger.error('Failed to get benchmark results', { error: error.message });
        res.status(500).json({ error: 'Failed to get benchmark results' });
      }
    });

    // Dashboard HTML
    this.app.get('/', (req, res) => {
      res.send(this.getDashboardHTML());
    });

    // Static files (for charts, etc.)
    this.app.use('/static', express.static(path.join(__dirname, 'static')));
  }

  /**
   * Get HTML dashboard
   */
  getDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ultra-Dex Performance Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .chart-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .alert { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin-bottom: 10px; }
        .success { background: #d4edda; color: #155724; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Ultra-Dex Performance Dashboard</h1>
            <p>Real-time performance metrics and monitoring</p>
        </div>

        <div id="alerts"></div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-title">Active Tasks</div>
                <div class="metric-value" id="active-tasks">-</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Tasks/Second</div>
                <div class="metric-value" id="throughput">-</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Avg Response Time</div>
                <div class="metric-value" id="avg-latency">-</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Memory Usage</div>
                <div class="metric-value" id="memory-usage">-</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Error Rate</div>
                <div class="metric-value" id="error-rate">-</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">System Load</div>
                <div class="metric-value" id="system-load">-</div>
            </div>
        </div>

        <div class="chart-container">
            <h3>Response Time Trends</h3>
            <canvas id="latency-chart" width="400" height="200"></canvas>
        </div>

        <div class="chart-container">
            <h3>Throughput Trends</h3>
            <canvas id="throughput-chart" width="400" height="200"></canvas>
        </div>

        <div class="chart-container">
            <h3>Memory Usage</h3>
            <canvas id="memory-chart" width="400" height="200"></canvas>
        </div>

        <div class="chart-container">
            <h3>Recent Benchmark Results</h3>
            <div id="benchmark-results">Loading...</div>
        </div>
    </div>

    <script>
        let latencyChart, throughputChart, memoryChart;

        async function updateMetrics() {
            try {
                const [perfResponse, obsResponse] = await Promise.all([
                    fetch('/api/metrics/performance'),
                    fetch('/api/observability/dashboard')
                ]);

                const perf = await perfResponse.json();
                const obs = await obsResponse.json();

                // Update metrics cards
                document.getElementById('active-tasks').textContent = perf.resourceUsage?.activeTasks || 0;
                document.getElementById('throughput').textContent = (perf.throughput?.[perf.throughput.length - 1]?.rate || 0).toFixed(2);
                document.getElementById('avg-latency').textContent = perf.resourceUsage?.averageLatency || 0 + 'ms';
                document.getElementById('memory-usage').textContent = perf.resourceUsage?.memory?.averageMB || 0 + 'MB';
                document.getElementById('error-rate').textContent = obs.errorRate || '0%';
                document.getElementById('system-load').textContent = (perf.resourceUsage?.cpu?.averageUsage || 0).toFixed(2) + 'ms';

                // Update alerts
                updateAlerts(obs);

                // Update charts
                updateCharts(perf);

            } catch (error) {
                console.error('Failed to update metrics:', error);
            }
        }

        function updateAlerts(obs) {
            const alertsDiv = document.getElementById('alerts');
            if (obs.unacknowledgedAlerts > 0) {
                alertsDiv.innerHTML = '<div class="alert">⚠️ ' + obs.unacknowledgedAlerts + ' unacknowledged alerts</div>';
            } else {
                alertsDiv.innerHTML = '<div class="alert success">✅ All systems operational</div>';
            }
        }

        function updateCharts(perf) {
            // Latency chart
            if (!latencyChart) {
                const ctx = document.getElementById('latency-chart').getContext('2d');
                latencyChart = new Chart(ctx, {
                    type: 'line',
                    data: { labels: [], datasets: [{ label: 'Latency (ms)', data: [], borderColor: 'rgb(75, 192, 192)' }] },
                    options: { responsive: true, scales: { y: { beginAtZero: true } } }
                });
            }

            const latencyData = perf.latency.slice(-20);
            latencyChart.data.labels = latencyData.map((_, i) => i);
            latencyChart.data.datasets[0].data = latencyData.map(l => l.duration);
            latencyChart.update();

            // Throughput chart
            if (!throughputChart) {
                const ctx = document.getElementById('throughput-chart').getContext('2d');
                throughputChart = new Chart(ctx, {
                    type: 'line',
                    data: { labels: [], datasets: [{ label: 'Tasks/sec', data: [], borderColor: 'rgb(255, 99, 132)' }] },
                    options: { responsive: true, scales: { y: { beginAtZero: true } } }
                });
            }

            const throughputData = perf.throughput.slice(-20);
            throughputChart.data.labels = throughputData.map((_, i) => i);
            throughputChart.data.datasets[0].data = throughputData.map(t => t.rate);
            throughputChart.update();

            // Memory chart
            if (!memoryChart) {
                const ctx = document.getElementById('memory-chart').getContext('2d');
                memoryChart = new Chart(ctx, {
                    type: 'line',
                    data: { labels: [], datasets: [{ label: 'Memory (MB)', data: [], borderColor: 'rgb(54, 162, 235)' }] },
                    options: { responsive: true, scales: { y: { beginAtZero: true } } }
                });
            }

            const memoryData = perf.memory.slice(-20);
            memoryChart.data.labels = memoryData.map((_, i) => i);
            memoryChart.data.datasets[0].data = memoryData.map(m => m.heapUsedMB);
            memoryChart.update();
        }

        async function loadBenchmarkResults() {
            try {
                const response = await fetch('/api/benchmarks/results');
                const data = await response.json();

                const resultsDiv = document.getElementById('benchmark-results');
                if (data.results.length === 0) {
                    resultsDiv.innerHTML = '<p>No benchmark results available</p>';
                    return;
                }

                let html = '<table style="width: 100%; border-collapse: collapse;">';
                html += '<tr style="background: #f8f9fa;"><th style="border: 1px solid #dee2e6; padding: 8px;">Suite</th><th style="border: 1px solid #dee2e6; padding: 8px;">Timestamp</th><th style="border: 1px solid #dee2e6; padding: 8px;">Passed</th><th style="border: 1px solid #dee2e6; padding: 8px;">Failed</th></tr>';

                data.results.forEach(result => {
                    html += '<tr>';
                    html += '<td style="border: 1px solid #dee2e6; padding: 8px;">' + (result.suiteName || 'Unknown') + '</td>';
                    html += '<td style="border: 1px solid #dee2e6; padding: 8px;">' + new Date(result.timestamp).toLocaleString() + '</td>';
                    html += '<td style="border: 1px solid #dee2e6; padding: 8px; color: green;">' + (result.summary?.passed || 0) + '</td>';
                    html += '<td style="border: 1px solid #dee2e6; padding: 8px; color: red;">' + (result.summary?.failed || 0) + '</td>';
                    html += '</tr>';
                });

                html += '</table>';
                resultsDiv.innerHTML = html;
            } catch (error) {
                document.getElementById('benchmark-results').innerHTML = '<p>Error loading benchmark results</p>';
            }
        }

        // Initialize
        updateMetrics();
        loadBenchmarkResults();

        // Update every 5 seconds
        setInterval(updateMetrics, 5000);
    </script>
</body>
</html>`;
  }
}

export { MetricsDashboard };
export default MetricsDashboard;
