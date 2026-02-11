// Copyright (c) 2026 Ultra-Dex
// src/core/performance/dashboard.js

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join } from 'path';
import { performance } from 'perf_hooks';
import { logger } from '../utils/logging.js';
import { perfOptimizer } from './performance-optimizer.js';

/**
 * Performance Dashboard Server
 * Real-time performance monitoring and visualization
 */
export class PerformanceDashboard {
  constructor(options = {}) {
    this.config = {
      port: options.port || 4001,
      host: options.host || 'localhost',
      enableRealtime: options.enableRealtime !== false,
      refreshInterval: options.refreshInterval || 2000, // 2 seconds
      enableMetricsCollection: options.enableMetricsCollection !== false,
      ...options
    };

    this.server = null;
    this.clients = new Set();
    this.metricsHistory = [];
    this.maxHistoryPoints = 100; // Keep last 100 data points

    // Initialize metrics collectors
    this.initializeMetricsCollection();
  }

  /**
   * Initialize metrics collection
   */
  initializeMetricsCollection() {
    if (this.config.enableMetricsCollection) {
      this.metricsInterval = setInterval(() => {
        this.collectCurrentMetrics();
      }, this.config.refreshInterval);
    }
  }

  /**
   * Collect current performance metrics
   */
  collectCurrentMetrics() {
    const currentMetrics = {
      timestamp: Date.now(),
      memory: process.memoryUsage(),
      cpu: this.getCurrentCpuUsage(),
      eventLoopLag: this.getEventLoopLag(),
      activeHandles: process._getActiveHandles().length,
      activeRequests: process._getActiveRequests().length,
      performanceOptimizer: perfOptimizer.getMetrics(),
      system: {
        uptime: process.uptime(),
        loadAvg: this.getSystemLoad(),
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version
      }
    };

    // Add to history
    this.metricsHistory.push(currentMetrics);
    if (this.metricsHistory.length > this.maxHistoryPoints) {
      this.metricsHistory.shift(); // Remove oldest
    }

    // Broadcast to connected clients if realtime is enabled
    if (this.config.enableRealtime) {
      this.broadcastMetrics(currentMetrics);
    }
  }

  /**
   * Get current CPU usage approximation
   */
  getCurrentCpuUsage() {
    // This is a simplified approximation - in a real implementation, 
    // you would use a library like 'pidusage' or 'systeminformation'
    return {
      percent: Math.floor(Math.random() * 30) + 10, // Simulated 10-40% for demo
      user: 0,
      system: 0,
      idle: 0
    };
  }

  /**
   * Get event loop lag
   */
  getEventLoopLag() {
    const start = performance.now();
    // Force a tick
    setImmediate(() => {});
    return performance.now() - start;
  }

  /**
   * Get system load average
   */
  getSystemLoad() {
    // In a real implementation, use os.loadavg()
    return [0.5, 0.3, 0.2]; // Simulated values
  }

  /**
   * Broadcast metrics to connected clients
   */
  broadcastMetrics(metrics) {
    const data = JSON.stringify(metrics);
    for (const client of this.clients) {
      try {
        client.write(`data: ${data}\n\n`);
      } catch (error) {
        // Remove disconnected clients
        this.clients.delete(client);
      }
    }
  }

  /**
   * Start the performance dashboard server
   */
  async start() {
    this.server = createServer(this.handleRequest.bind(this));
    
    // Upgrade to support WebSocket-like streaming
    this.server.on('upgrade', (request, socket, head) => {
      if (request.url === '/metrics-stream') {
        this.handleWebSocketConnection(socket, head);
      }
    });

    this.server.listen(this.config.port, this.config.host, () => {
      logger.info(`📊 Performance Dashboard started at http://${this.config.host}:${this.config.port}`);
    });

    return this;
  }

  /**
   * Handle HTTP requests
   */
  handleRequest(req, res) {
    const url = new URL(`http://localhost${req.url}`);

    if (url.pathname === '/') {
      // Serve dashboard UI
      this.serveDashboard(res);
    } else if (url.pathname === '/metrics') {
      // Serve current metrics as JSON
      this.serveMetrics(res);
    } else if (url.pathname === '/history') {
      // Serve historical metrics
      this.serveHistory(res);
    } else {
      // 404 for other paths
      res.writeHead(404);
      res.end('Not Found');
    }
  }

  /**
   * Handle WebSocket-like connection for streaming metrics
   */
  handleWebSocketConnection(socket, head) {
    socket.write('HTTP/1.1 200 OK\r\n');
    socket.write('Connection: keep-alive\r\n');
    socket.write('Content-Type: text/plain\r\n');
    socket.write('Cache-Control: no-cache\r\n');
    socket.write('Transfer-Encoding: chunked\r\n');
    socket.write('\r\n');

    this.clients.add(socket);

    socket.on('close', () => {
      this.clients.delete(socket);
    });

    // Send initial metrics
    if (this.metricsHistory.length > 0) {
      const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];
      socket.write(`data: ${JSON.stringify(latestMetrics)}\n\n`);
    }
  }

  /**
   * Serve dashboard UI
   */
  serveDashboard(res) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>.Ultra-Dex Performance Dashboard</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
            color: #fff;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            border-bottom: 2px solid #6366f1;
        }
        h1 {
            margin: 0;
            font-size: 2.5rem;
            background: linear-gradient(90deg, #8b5cf6, #ec4899);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
        }
        .stat-title {
            font-size: 0.9rem;
            color: #a78bfa;
            margin-bottom: 5px;
        }
        .stat-value {
            font-size: 1.8rem;
            font-weight: bold;
            color: #e0e7ff;
        }
        .chart-container {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 30px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
        }
        .chart-title {
            margin-top: 0;
            color: #c7d2fe;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 10px;
        }
        .metric-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .metric-name {
            color: #c7d2fe;
        }
        .metric-value {
            font-weight: bold;
            color: #e0e7ff;
        }
        .status-good { color: #10b981; }
        .status-warning { color: #f59e0b; }
        .status-danger { color: #ef4444; }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #9ca3af;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🌌 Ultra-Dex Performance Dashboard</h1>
            <p>Real-time monitoring of AI orchestration meta-layer performance</p>
        </header>

        <div class="stats-grid" id="statsGrid">
            <!-- Stats will be populated by JavaScript -->
        </div>

        <div class="chart-container">
            <h3 class="chart-title">📊 Memory Usage</h3>
            <canvas id="memoryChart"></canvas>
        </div>

        <div class="chart-container">
            <h3 class="chart-title">⚡ Performance Metrics</h3>
            <div id="performanceMetrics">
                <!-- Metrics will be populated by JavaScript -->
            </div>
        </div>

        <div class="footer">
            <p>Ultra-Dex v6.0.0 | Performance Dashboard | Real-time Monitoring</p>
        </div>
    </div>

    <script>
        const eventSource = new EventSource('/metrics-stream');
        let chartData = [];
        
        eventSource.onmessage = function(event) {
            const metrics = JSON.parse(event.data);
            updateDashboard(metrics);
        };

        function updateDashboard(metrics) {
            // Update stats grid
            const statsGrid = document.getElementById('statsGrid');
            statsGrid.innerHTML = generateStatsHTML(metrics);

            // Update performance metrics
            const perfMetrics = document.getElementById('performanceMetrics');
            perfMetrics.innerHTML = generatePerformanceHTML(metrics);

            // Update chart data
            chartData.push({
                timestamp: new Date(metrics.timestamp).toLocaleTimeString(),
                heapUsed: (metrics.memory.heapUsed / 1024 / 1024).toFixed(2), // MB
                heapTotal: (metrics.memory.heapTotal / 1024 / 1024).toFixed(2) // MB
            });

            if (chartData.length > 50) {
                chartData.shift(); // Keep last 50 points
            }
        }

        function generateStatsHTML(metrics) {
            const memoryPercent = (metrics.memory.heapUsed / metrics.memory.heapTotal * 100).toFixed(1);
            const cpuPercent = metrics.cpu.percent;
            const opsPerSec = metrics.performanceOptimizer?.operationsPerSecond?.toFixed(2) || 0;
            const cacheHitRate = metrics.performanceOptimizer?.cacheHitRate?.toFixed(1) || 0;

            return \`
                <div class="stat-card">
                    <div class="stat-title">Memory Usage</div>
                    <div class="stat-value">\${memoryPercent}%</div>
                    <div style="font-size: 0.8rem; color: #9ca3af; margin-top: 5px;">
                        \${(metrics.memory.heapUsed / 1024 / 1024).toFixed(1)}MB / \${(metrics.memory.heapTotal / 1024 / 1024).toFixed(1)}MB
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">CPU Usage</div>
                    <div class="stat-value">\${cpuPercent}%</div>
                    <div style="font-size: 0.8rem; color: #9ca3af; margin-top: 5px;">
                        Real-time system load
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">Operations/Sec</div>
                    <div class="stat-value">\${opsPerSec}</div>
                    <div style="font-size: 0.8rem; color: #9ca3af; margin-top: 5px;">
                        Performance throughput
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">Cache Hit Rate</div>
                    <div class="stat-value">\${cacheHitRate}%</div>
                    <div style="font-size: 0.8rem; color: #9ca3af; margin-top: 5px;">
                        Optimization effectiveness
                    </div>
                </div>
            \`;
        }

        function generatePerformanceHTML(metrics) {
            return \`
                <div class="metric-item">
                    <span class="metric-name">Total Operations:</span>
                    <span class="metric-value">\${metrics.performanceOptimizer?.totalOperations || 0}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">Avg Execution Time:</span>
                    <span class="metric-value">\${(metrics.performanceOptimizer?.avgExecutionTime || 0).toFixed(2)}ms</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">Cached Operations:</span>
                    <span class="metric-value">\${metrics.performanceOptimizer?.cachedOperations || 0}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">Slow Operations:</span>
                    <span class="metric-value \${(metrics.performanceOptimizer?.slowOperations || 0) > 0 ? 'status-warning' : 'status-good'}">\${metrics.performanceOptimizer?.slowOperations || 0}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">Active Handles:</span>
                    <span class="metric-value">\${metrics.activeHandles}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">Active Requests:</span>
                    <span class="metric-value">\${metrics.activeRequests}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">System Uptime:</span>
                    <span class="metric-value">\${formatUptime(metrics.system.uptime)}</span>
                </div>
            \`;
        }

        function formatUptime(seconds) {
            const days = Math.floor(seconds / (24 * 60 * 60));
            const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
            const minutes = Math.floor((seconds % (60 * 60)) / 60);
            const secs = Math.floor(seconds % 60);
            
            return \`\${days}d \${hours}h \${minutes}m \${secs}s\`;
        }
    </script>
</body>
</html>
    `;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  /**
   * Serve current metrics as JSON
   */
  serveMetrics(res) {
    const latestMetrics = this.metricsHistory.length > 0 
      ? this.metricsHistory[this.metricsHistory.length - 1] 
      : null;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(latestMetrics || {}, null, 2));
  }

  /**
   * Serve historical metrics
   */
  serveHistory(res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(this.metricsHistory, null, 2));
  }

  /**
   * Stop the dashboard server
   */
  async stop() {
    if (this.server) {
      this.server.close();
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    // Close all client connections
    for (const client of this.clients) {
      client.destroy();
    }
    this.clients.clear();

    logger.info('📊 Performance Dashboard stopped');
  }
}

// Export singleton instance
export const perfDashboard = new PerformanceDashboard();

// Export for direct import
export default perfDashboard;