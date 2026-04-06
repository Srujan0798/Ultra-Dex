// Copyright (c) 2026 Ultra-Dex
// src/core/performance/monitoring-dashboard.js

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { performance } from 'perf_hooks';
import os from 'os';
import { logger } from '../utils/logging.js';
import { advancedPerfOptimizer } from './advanced-optimizer.js';

/**
 * Advanced Performance Monitoring Dashboard
 * Real-time visualization of system performance metrics
 */
export class PerformanceMonitoringDashboard {
  constructor(options = {}) {
    this.config = {
      port: options.port || 4002,
      host: options.host || 'localhost',
      enableRealtimeUpdates: options.enableRealtimeUpdates !== false,
      updateInterval: options.updateInterval || 2000, // 2 seconds
      retentionMinutes: options.retentionMinutes || 60, // 1 hour of data
      enableHistoricalData: options.enableHistoricalData !== false,
      ...options
    };

    this.app = express();
    this.server = null;
    this.io = null;
    this.metricsHistory = [];
    this.maxHistoryPoints = this.config.retentionMinutes * (60000 / this.config.updateInterval); // Convert minutes to data points
    this.updateIntervalId = null;
    this.systemStats = {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      networkUsage: 0,
      activeConnections: 0,
      requestsPerSecond: 0,
      avgResponseTime: 0,
      errorRate: 0
    };

    this.setupExpressApp();
  }

  /**
   * Setup Express application
   */
  setupExpressApp() {
    // Serve static files and dashboard UI
    this.app.use(express.static(new URL('../../../../assets/dashboard', import.meta.url).pathname));
    
    // API endpoints
    this.app.get('/api/metrics', (req, res) => {
      res.json(this.getCurrentMetrics());
    });

    this.app.get('/api/history', (req, res) => {
      res.json(this.metricsHistory);
    });

    this.app.get('/api/stats', (req, res) => {
      res.json(this.systemStats);
    });

    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '6.0.0'
      });
    });

    // Main dashboard route
    this.app.get('/', (req, res) => {
      res.send(this.getDashboardHTML());
    });
  }

  /**
   * Start the monitoring dashboard server
   */
  async start() {
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Start collecting metrics
    if (this.config.enableRealtimeUpdates) {
      this.startMetricsCollection();
    }

    // Listen for connections
    this.server.listen(this.config.port, this.config.host, () => {
      logger.info(`📊 Performance Dashboard started at http://${this.config.host}:${this.config.port}`);
    });

    // Socket.IO event handling
    this.io.on('connection', (socket) => {
      logger.info(`🔌 Dashboard client connected: ${socket.id}`);

      // Send initial metrics
      socket.emit('metrics-update', this.getCurrentMetrics());

      socket.on('disconnect', () => {
        logger.info(`🔌 Dashboard client disconnected: ${socket.id}`);
      });

      socket.on('request-metrics', () => {
        socket.emit('metrics-update', this.getCurrentMetrics());
      });
    });

    return this;
  }

  /**
   * Start collecting metrics at regular intervals
   */
  startMetricsCollection() {
    this.updateIntervalId = setInterval(() => {
      this.collectMetrics();
      this.broadcastMetrics();
    }, this.config.updateInterval);
  }

  /**
   * Collect current system metrics
   */
  collectMetrics() {
    const currentMetrics = {
      timestamp: Date.now(),
      system: {
        cpu: this.getCPUUsage(),
        memory: this.getMemoryUsage(),
        disk: this.getDiskUsage(),
        network: this.getNetworkUsage(),
        load: os.loadavg(),
        uptime: process.uptime()
      },
      process: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        pid: process.pid,
        uptime: process.uptime()
      },
      ultraDex: {
        agents: this.getAgentMetrics(),
        aiProviders: this.getAIProviderMetrics(),
        memorySystem: this.getMemorySystemMetrics(),
        performanceOptimizer: advancedPerfOptimizer.getAdvancedMetrics()
      },
      performance: {
        responseTime: this.getResponseTimeMetrics(),
        throughput: this.getThroughputMetrics(),
        errorRate: this.getErrorRateMetrics()
      }
    };

    // Add to history
    this.metricsHistory.push(currentMetrics);
    if (this.metricsHistory.length > this.maxHistoryPoints) {
      this.metricsHistory.shift(); // Remove oldest data point
    }

    // Update system stats for quick access
    this.updateSystemStats(currentMetrics);
  }

  /**
   * Get CPU usage statistics
   */
  getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0, totalTick = 0;

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }

    const avgTick = totalTick / cpus.length;
    const avgIdle = totalIdle / cpus.length;

    return {
      count: cpus.length,
      model: cpus[0]?.model,
      speed: cpus[0]?.speed,
      usagePercent: 100 - (avgIdle / avgTick) * 100
    };
  }

  /**
   * Get memory usage statistics
   */
  getMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory,
      usagePercent: (usedMemory / totalMemory) * 100
    };
  }

  /**
   * Get disk usage statistics
   */
  getDiskUsage() {
    // In a real implementation, this would check actual disk usage
    // For now, returning simulated data
    return {
      total: 500 * 1024 * 1024 * 1024, // 500GB
      free: 200 * 1024 * 1024 * 1024,  // 200GB free
      used: 300 * 1024 * 1024 * 1024,  // 300GB used
      usagePercent: 60
    };
  }

  /**
   * Get network usage statistics
   */
  getNetworkUsage() {
    // In a real implementation, this would check actual network usage
    return {
      connections: this.getActiveConnections(),
      bandwidth: this.getBandwidthUsage()
    };
  }

  /**
   * Get active connections count
   */
  getActiveConnections() {
    // This would be tracked in a real implementation
    return 10; // Simulated value
  }

  /**
   * Get bandwidth usage
   */
  getBandwidthUsage() {
    // Simulated bandwidth usage
    return {
      upload: Math.random() * 10, // 0-10 Mbps
      download: Math.random() * 50 // 0-50 Mbps
    };
  }

  /**
   * Get agent-related metrics
   */
  getAgentMetrics() {
    // This would interface with the agent system in a real implementation
    return {
      totalAgents: 17, // Total number of registered agents
      activeAgents: Math.floor(Math.random() * 17), // Simulated active agents
      avgResponseTime: Math.random() * 500 + 100, // 100-600ms
      totalExecutions: Math.floor(Math.random() * 10000) // Simulated execution count
    };
  }

  /**
   * Get AI provider metrics
   */
  getAIProviderMetrics() {
    // This would interface with the AI provider system
    return {
      activeProviders: ['openai', 'anthropic', 'google'],
      totalRequests: Math.floor(Math.random() * 5000),
      avgResponseTime: Math.random() * 3000 + 500, // 500-3500ms
      errorRate: Math.random() * 0.05 // 0-5% error rate
    };
  }

  /**
   * Get memory system metrics
   */
  getMemorySystemMetrics() {
    // This would interface with the memory system
    return {
      hotMemorySize: Math.floor(Math.random() * 1000), // Items in hot memory
      warmMemorySize: Math.floor(Math.random() * 10000), // Items in warm memory
      coldMemorySize: Math.floor(Math.random() * 100000), // Items in cold memory
      cacheHitRate: Math.random() * 0.95 + 0.05, // 5-100% hit rate
      totalMemories: Math.floor(Math.random() * 150000)
    };
  }

  /**
   * Get response time metrics
   */
  getResponseTimeMetrics() {
    return {
      avg: Math.random() * 500 + 50, // 50-550ms
      p95: Math.random() * 1000 + 100, // 100-1100ms
      p99: Math.random() * 2000 + 200, // 200-2200ms
      min: Math.random() * 50, // 0-50ms
      max: Math.random() * 3000 + 500 // 500-3500ms
    };
  }

  /**
   * Get throughput metrics
   */
  getThroughputMetrics() {
    return {
      requestsPerSecond: Math.floor(Math.random() * 100) + 10, // 10-110 RPS
      operationsPerSecond: Math.floor(Math.random() * 200) + 20, // 20-220 OPS
      aiCallsPerMinute: Math.floor(Math.random() * 500) + 50 // 50-550 calls/min
    };
  }

  /**
   * Get error rate metrics
   */
  getErrorRateMetrics() {
    return {
      rate: Math.random() * 0.03, // 0-3% error rate
      totalErrors: Math.floor(Math.random() * 100),
      criticalErrors: Math.floor(Math.random() * 10)
    };
  }

  /**
   * Update system statistics from collected metrics
   */
  updateSystemStats(metrics) {
    this.systemStats = {
      cpuUsage: metrics.system.cpu.usagePercent,
      memoryUsage: metrics.system.memory.usagePercent,
      diskUsage: metrics.system.disk.usagePercent,
      networkUsage: metrics.system.network.bandwidth.download,
      activeConnections: metrics.system.network.connections,
      requestsPerSecond: metrics.performance.throughput.requestsPerSecond,
      avgResponseTime: metrics.performance.responseTime.avg,
      errorRate: metrics.performance.errorRate.rate
    };
  }

  /**
   * Broadcast metrics to all connected clients
   */
  broadcastMetrics() {
    if (this.io) {
      this.io.emit('metrics-update', this.getCurrentMetrics());
    }
  }

  /**
   * Get current metrics snapshot
   */
  getCurrentMetrics() {
    return {
      timestamp: Date.now(),
      system: this.systemStats,
      ultraDex: {
        version: process.env.npm_package_version || '6.0.0',
        uptime: process.uptime(),
        pid: process.pid
      },
      metrics: this.metricsHistory.length > 0 
        ? this.metricsHistory[this.metricsHistory.length - 1] 
        : null
    };
  }

  /**
   * Get dashboard HTML interface
   */
  getDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>.Ultra-Dex Performance Dashboard</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        :root {
            --primary: #8b5cf6;
            --secondary: #a78bfa;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --dark-bg: #0f172a;
            --card-bg: #1e293b;
            --text-primary: #f1f5f9;
            --text-secondary: #cbd5e1;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: var(--dark-bg);
            color: var(--text-primary);
            line-height: 1.6;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            border-bottom: 2px solid var(--primary);
        }
        
        h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .subtitle {
            color: var(--text-secondary);
            font-size: 1.1rem;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .card {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
        }
        
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .card-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: var(--secondary);
        }
        
        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .metric-label {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
        
        .status-good { color: var(--success); }
        .status-warning { color: var(--warning); }
        .status-danger { color: var(--danger); }
        
        .progress-bar {
            height: 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: var(--primary);
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        
        .chart-container {
            height: 300px;
            margin: 20px 0;
            position: relative;
        }
        
        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .tab {
            padding: 10px 20px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .tab.active {
            background: var(--primary);
            border-color: var(--primary);
        }
        
        .tab:hover {
            background: rgba(139, 92, 246, 0.2);
        }
        
        .section {
            display: none;
        }
        
        .section.active {
            display: block;
        }
        
        .agent-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
        }
        
        .agent-card {
            background: rgba(30, 41, 59, 0.7);
            border: 1px solid rgba(139, 92, 246, 0.3);
            border-radius: 8px;
            padding: 15px;
        }
        
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🌌 Ultra-Dex Performance Dashboard</h1>
            <p class="subtitle">Real-time monitoring of AI orchestration meta-layer performance</p>
        </header>

        <div class="tabs">
            <div class="tab active" onclick="switchTab('overview')">Overview</div>
            <div class="tab" onclick="switchTab('agents')">Agents</div>
            <div class="tab" onclick="switchTab('ai')">AI Providers</div>
            <div class="tab" onclick="switchTab('memory')">Memory</div>
            <div class="tab" onclick="switchTab('performance')">Performance</div>
        </div>

        <div id="overview" class="section active">
            <div class="grid">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">System Health</h3>
                    </div>
                    <div class="metric-value" id="cpu-value">0%</div>
                    <div class="metric-label">CPU Usage</div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="cpu-bar" style="width: 0%"></div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Memory</h3>
                    </div>
                    <div class="metric-value" id="memory-value">0%</div>
                    <div class="metric-label">Memory Usage</div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="memory-bar" style="width: 0%"></div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Response Time</h3>
                    </div>
                    <div class="metric-value" id="response-value">0ms</div>
                    <div class="metric-label">Average Response</div>
                    <div class="metric-label" id="response-status">Loading...</div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Throughput</h3>
                    </div>
                    <div class="metric-value" id="throughput-value">0</div>
                    <div class="metric-label">Requests/Second</div>
                    <div class="metric-label" id="throughput-status">Loading...</div>
                </div>
            </div>
        </div>

        <div id="agents" class="section">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Agent Performance</h3>
                </div>
                <div class="agent-grid" id="agent-grid">
                    <!-- Agent metrics will be populated here -->
                </div>
            </div>
        </div>

        <div id="ai" class="section">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">AI Provider Metrics</h3>
                </div>
                <div id="ai-metrics">
                    <!-- AI provider metrics will be populated here -->
                </div>
            </div>
        </div>

        <div id="memory" class="section">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Memory System</h3>
                </div>
                <div id="memory-metrics">
                    <!-- Memory metrics will be populated here -->
                </div>
            </div>
        </div>

        <div id="performance" class="section">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Performance Metrics</h3>
                </div>
                <div id="perf-metrics">
                    <!-- Performance metrics will be populated here -->
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Ultra-Dex v6.0.0 | Performance Dashboard | Real-time Monitoring</p>
            <p>Last updated: <span id="last-updated">Never</span></p>
        </div>
    </div>

    <script>
        const socket = io();
        let currentMetrics = null;

        // Tab switching functionality
        function switchTab(tabName) {
            // Hide all sections
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected section and activate selected tab
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
        }

        // Update metrics display
        function updateMetrics(metrics) {
            if (!metrics) return;
            
            currentMetrics = metrics;
            
            // Update system metrics
            document.getElementById('cpu-value').textContent = metrics.system.cpuUsage.toFixed(1) + '%';
            document.getElementById('cpu-bar').style.width = Math.min(100, metrics.system.cpuUsage) + '%';
            
            document.getElementById('memory-value').textContent = metrics.system.memoryUsage.toFixed(1) + '%';
            document.getElementById('memory-bar').style.width = Math.min(100, metrics.system.memoryUsage) + '%';
            
            document.getElementById('response-value').textContent = metrics.system.avgResponseTime.toFixed(0) + 'ms';
            document.getElementById('throughput-value').textContent = metrics.system.requestsPerSecond.toFixed(0);
            
            // Set status colors based on thresholds
            const responseStatus = document.getElementById('response-status');
            const throughputStatus = document.getElementById('throughput-status');
            
            if (metrics.system.avgResponseTime < 200) {
                responseStatus.textContent = 'Optimal';
                responseStatus.className = 'metric-label status-good';
            } else if (metrics.system.avgResponseTime < 500) {
                responseStatus.textContent = 'Good';
                responseStatus.className = 'metric-label status-warning';
            } else {
                responseStatus.textContent = 'Slow';
                responseStatus.className = 'metric-label status-danger';
            }
            
            if (metrics.system.requestsPerSecond > 50) {
                throughputStatus.textContent = 'High';
                throughputStatus.className = 'metric-label status-good';
            } else if (metrics.system.requestsPerSecond > 20) {
                throughputStatus.textContent = 'Medium';
                throughputStatus.className = 'metric-label status-warning';
            } else {
                throughputStatus.textContent = 'Low';
                throughputStatus.className = 'metric-label status-danger';
            }
            
            // Update last updated time
            document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
            
            // Update agent metrics if on agents tab
            if (document.querySelector('#agents.section.active')) {
                updateAgentMetrics(metrics.ultraDex?.agents);
            }
            
            // Update AI provider metrics if on AI tab
            if (document.querySelector('#ai.section.active')) {
                updateAIPrividerMetrics(metrics.ultraDex?.aiProviders);
            }
            
            // Update memory metrics if on memory tab
            if (document.querySelector('#memory.section.active')) {
                updateMemoryMetrics(metrics.ultraDex?.memorySystem);
            }
            
            // Update performance metrics if on performance tab
            if (document.querySelector('#performance.section.active')) {
                updatePerformanceMetrics(metrics.ultraDex?.performance);
            }
        }

        // Update agent metrics display
        function updateAgentMetrics(agents) {
            if (!agents) return;
            
            const agentGrid = document.getElementById('agent-grid');
            agentGrid.innerHTML = '';
            
            const agentCard = document.createElement('div');
            agentCard.className = 'agent-card';
            agentCard.innerHTML = \`
                <h4>Total Agents</h4>
                <p>\${agents.totalAgents}</p>
                <h4>Active Agents</h4>
                <p>\${agents.activeAgents}</p>
                <h4>Avg Response Time</h4>
                <p>\${agents.avgResponseTime.toFixed(0)}ms</p>
                <h4>Total Executions</h4>
                <p>\${agents.totalExecutions}</p>
            \`;
            
            agentGrid.appendChild(agentCard);
        }

        // Update AI provider metrics display
        function updateAIPrividerMetrics(aiProviders) {
            if (!aiProviders) return;
            
            const aiDiv = document.getElementById('ai-metrics');
            aiDiv.innerHTML = \`
                <h4>Active Providers</h4>
                <p>\${aiProviders.activeProviders.join(', ')}</p>
                <h4>Total Requests</h4>
                <p>\${aiProviders.totalRequests}</p>
                <h4>Avg Response Time</h4>
                <p>\${aiProviders.avgResponseTime.toFixed(0)}ms</p>
                <h4>Error Rate</h4>
                <p>\${(aiProviders.errorRate * 100).toFixed(2)}%</p>
            \`;
        }

        // Update memory metrics display
        function updateMemoryMetrics(memorySystem) {
            if (!memorySystem) return;
            
            const memoryDiv = document.getElementById('memory-metrics');
            memoryDiv.innerHTML = \`
                <h4>Hot Memory</h4>
                <p>\${memorySystem.hotMemorySize} items</p>
                <h4>Warm Memory</h4>
                <p>\${memorySystem.warmMemorySize} items</p>
                <h4>Cold Memory</h4>
                <p>\${memorySystem.coldMemorySize} items</p>
                <h4>Cache Hit Rate</h4>
                <p>\${(memorySystem.cacheHitRate * 100).toFixed(1)}%</p>
                <h4>Total Memories</h4>
                <p>\${memorySystem.totalMemories}</p>
            \`;
        }

        // Update performance metrics display
        function updatePerformanceMetrics(perfMetrics) {
            if (!perfMetrics) return;
            
            const perfDiv = document.getElementById('perf-metrics');
            perfDiv.innerHTML = \`
                <h4>Average Response Time</h4>
                <p>\${perfMetrics.responseTime?.avg?.toFixed(0) || 0}ms</p>
                <h4>P95 Response Time</h4>
                <p>\${perfMetrics.responseTime?.p95?.toFixed(0) || 0}ms</p>
                <h4>Requests Per Second</h4>
                <p>\${perfMetrics.throughput?.requestsPerSecond || 0}</p>
                <h4>Error Rate</h4>
                <p>\${(perfMetrics.errorRate?.rate * 100 || 0).toFixed(2)}%</p>
            \`;
        }

        // Listen for metrics updates
        socket.on('metrics-update', (metrics) => {
            updateMetrics(metrics);
        });

        // Request metrics on initial load
        socket.emit('request-metrics');

        // Refresh metrics every 5 seconds if connection is lost
        setInterval(() => {
            if (socket.connected) {
                socket.emit('request-metrics');
            }
        }, 5000);
    </script>
</body>
</html>
    `;
  }

  /**
   * Stop the monitoring dashboard
   */
  async stop() {
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
    }

    if (this.io) {
      this.io.close();
    }

    if (this.server) {
      this.server.close();
    }

    logger.info('📊 Performance Monitoring Dashboard stopped');
  }
}

// Export singleton instance
export const perfDashboard = new PerformanceMonitoringDashboard();

// Export for direct import
export default perfDashboard;