/**
 * Ultra-Dex Enterprise Analytics Module
 * Advanced metrics, monitoring, and business intelligence
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

const ANALYTICS_DIR = '.ultra-dex/analytics';

class AnalyticsManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      storagePath: options.storagePath || ANALYTICS_DIR,
      retentionDays: options.retentionDays || 90,
      enableRealTime: options.enableRealTime !== false,
      enableHistorical: options.enableHistorical !== false,
      samplingRate: options.samplingRate || 1.0, // 1.0 = 100% sampling
      ...options
    };
    
    this.metrics = new Map(); // metricName -> metricData
    this.realTimeData = new Map(); // real-time metrics buffer
    this.storagePath = path.resolve(this.options.storagePath);
    this.initialize();
  }

  async initialize() {
    // Ensure analytics directories exist
    await fs.mkdir(this.storagePath, { recursive: true });
    await fs.mkdir(path.join(this.storagePath, 'metrics'), { recursive: true });
    await fs.mkdir(path.join(this.storagePath, 'reports'), { recursive: true });
    await fs.mkdir(path.join(this.storagePath, 'dashboards'), { recursive: true });
    
    // Initialize default metrics
    this.initializeDefaultMetrics();
  }

  initializeDefaultMetrics() {
    // System health metrics
    this.metrics.set('system.health', {
      name: 'System Health',
      description: 'Overall system health score',
      type: 'gauge',
      unit: 'score',
      currentValue: 100,
      history: [],
      timestamp: new Date().toISOString()
    });

    this.metrics.set('agents.active', {
      name: 'Active Agents',
      description: 'Number of currently active agents',
      type: 'gauge',
      unit: 'count',
      currentValue: 0,
      history: [],
      timestamp: new Date().toISOString()
    });

    this.metrics.set('memory.utilization', {
      name: 'Memory Utilization',
      description: 'Memory usage percentage',
      type: 'gauge',
      unit: 'percent',
      currentValue: 0,
      history: [],
      timestamp: new Date().toISOString()
    });

    this.metrics.set('api.requests', {
      name: 'API Requests',
      description: 'Total API requests served',
      type: 'counter',
      unit: 'count',
      currentValue: 0,
      history: [],
      timestamp: new Date().toISOString()
    });

    this.metrics.set('costs.daily', {
      name: 'Daily Costs',
      description: 'Daily operational costs',
      type: 'gauge',
      unit: 'usd',
      currentValue: 0,
      history: [],
      timestamp: new Date().toISOString()
    });

    this.metrics.set('security.incidents', {
      name: 'Security Incidents',
      description: 'Detected security incidents',
      type: 'counter',
      unit: 'count',
      currentValue: 0,
      history: [],
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track a metric value
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {object} tags - Tags for the metric
   * @param {object} metadata - Additional metadata
   */
  async trackMetric(name, value, tags = {}, metadata = {}) {
    // Apply sampling rate
    if (Math.random() > this.options.samplingRate) {
      return; // Skip this metric based on sampling rate
    }

    const metric = this.metrics.get(name) || {
      name,
      type: 'gauge', // Default to gauge
      unit: 'count',
      currentValue: 0,
      history: [],
      tags: {},
      metadata: {},
      timestamp: new Date().toISOString()
    };

    // Update metric value
    if (metric.type === 'counter') {
      metric.currentValue += value;
    } else {
      metric.currentValue = value;
    }

    metric.timestamp = new Date().toISOString();
    metric.tags = { ...metric.tags, ...tags };
    metric.metadata = { ...metric.metadata, ...metadata };

    // Add to history (keep last 1000 entries)
    metric.history.push({
      value,
      timestamp: new Date().toISOString(),
      tags,
      metadata
    });

    if (metric.history.length > 1000) {
      metric.history = metric.history.slice(-1000);
    }

    this.metrics.set(name, metric);

    // Add to real-time buffer if enabled
    if (this.options.enableRealTime) {
      this.addToRealTimeBuffer(name, value, tags, metadata);
    }

    // Emit event for real-time monitoring
    this.emit('metric:updated', { 
      name, 
      value, 
      tags, 
      metadata, 
      timestamp: new Date().toISOString() 
    });

    // Periodically save metrics to disk
    if (Math.random() < 0.1) { // Save ~10% of the time to avoid excessive I/O
      await this.saveMetrics();
    }
  }

  /**
   * Add data to real-time buffer
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {object} tags - Tags
   * @param {object} metadata - Metadata
   * @private
   */
  addToRealTimeBuffer(name, value, tags, metadata) {
    if (!this.realTimeData.has(name)) {
      this.realTimeData.set(name, []);
    }

    const buffer = this.realTimeData.get(name);
    buffer.push({
      value,
      timestamp: new Date().toISOString(),
      tags,
      metadata
    });

    // Keep only last 100 entries for real-time
    if (buffer.length > 100) {
      this.realTimeData.set(name, buffer.slice(-100));
    }
  }

  /**
   * Get metric value
   * @param {string} name - Metric name
   * @returns {object} Metric data
   */
  getMetric(name) {
    return this.metrics.get(name) || null;
  }

  /**
   * Get metric history
   * @param {string} name - Metric name
   * @param {object} options - Query options
   * @returns {Array<object>} Metric history
   */
  getMetricHistory(name, options = {}) {
    const metric = this.metrics.get(name);
    if (!metric || !metric.history) {
      return [];
    }

    let history = [...metric.history];

    // Apply time filters
    if (options.startTime) {
      history = history.filter(entry => new Date(entry.timestamp) >= new Date(options.startTime));
    }

    if (options.endTime) {
      history = history.filter(entry => new Date(entry.timestamp) <= new Date(options.endTime));
    }

    // Apply limit
    if (options.limit) {
      history = history.slice(-options.limit);
    }

    return history;
  }

  /**
   * Get real-time data for a metric
   * @param {string} name - Metric name
   * @returns {Array<object>} Real-time data
   */
  getRealTimeData(name) {
    return this.realTimeData.get(name) || [];
  }

  /**
   * Generate analytics report
   * @param {object} options - Report options
   * @returns {object} Analytics report
   */
  async generateReport(options = {}) {
    const startTime = options.startTime || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Last 24 hours
    const endTime = options.endTime || new Date().toISOString();
    const metrics = options.metrics || Array.from(this.metrics.keys());

    const report = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      generatedAt: new Date().toISOString(),
      period: { startTime, endTime },
      metrics: {},
      summary: {
        totalMetrics: metrics.length,
        startTime,
        endTime
      }
    };

    for (const metricName of metrics) {
      const metric = this.getMetric(metricName);
      if (metric) {
        const history = this.getMetricHistory(metricName, { startTime, endTime });
        
        // Calculate statistics
        const values = history.map(entry => entry.value);
        const stats = {
          count: values.length,
          sum: values.reduce((sum, val) => sum + val, 0),
          avg: values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0,
          min: values.length > 0 ? Math.min(...values) : 0,
          max: values.length > 0 ? Math.max(...values) : 0,
          latest: values.length > 0 ? values[values.length - 1] : 0
        };

        report.metrics[metricName] = {
          ...metric,
          history: history.slice(-options.historyLimit || 50), // Last 50 entries by default
          stats
        };
      }
    }

    // Add summary calculations
    report.summary = {
      ...report.summary,
      durationHours: (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60),
      totalMetrics: Object.keys(report.metrics).length
    };

    // Save report if persistence is enabled
    if (this.options.enablePersistence) {
      await this.saveReport(report);
    }

    return report;
  }

  /**
   * Generate enterprise dashboard data
   * @param {object} options - Dashboard options
   * @returns {object} Dashboard data
   */
  async generateDashboardData(options = {}) {
    const dashboard = {
      id: `dashboard_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      widgets: [],
      insights: [],
      recommendations: []
    };

    // System health widget
    const systemHealth = this.getMetric('system.health');
    dashboard.widgets.push({
      id: 'system-health',
      type: 'gauge',
      title: 'System Health',
      value: systemHealth?.currentValue || 100,
      max: 100,
      status: systemHealth?.currentValue > 90 ? 'good' : systemHealth?.currentValue > 70 ? 'warning' : 'critical'
    });

    // Active agents widget
    const activeAgents = this.getMetric('agents.active');
    dashboard.widgets.push({
      id: 'active-agents',
      type: 'counter',
      title: 'Active Agents',
      value: activeAgents?.currentValue || 0,
      trend: 'positive'
    });

    // API requests widget
    const apiRequests = this.getMetric('api.requests');
    dashboard.widgets.push({
      id: 'api-requests',
      type: 'line-chart',
      title: 'API Requests (Last 24h)',
      data: this.getMetricHistory('api.requests', { 
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        limit: 24 
      })
    });

    // Cost trends widget
    const costs = this.getMetric('costs.daily');
    dashboard.widgets.push({
      id: 'cost-trends',
      type: 'bar-chart',
      title: 'Cost Trends (Last 7 days)',
      data: this.getMetricHistory('costs.daily', { 
        startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        limit: 7 
      })
    });

    // Security incidents widget
    const securityIncidents = this.getMetric('security.incidents');
    dashboard.widgets.push({
      id: 'security-incidents',
      type: 'counter',
      title: 'Security Incidents',
      value: securityIncidents?.currentValue || 0,
      trend: 'negative'
    });

    // Generate insights
    const insights = await this.generateInsights();
    dashboard.insights = insights;

    // Generate recommendations
    const recommendations = await this.generateRecommendations();
    dashboard.recommendations = recommendations;

    return dashboard;
  }

  /**
   * Generate business insights from metrics
   * @returns {Array<object>} Array of insights
   */
  async generateInsights() {
    const insights = [];

    // Performance insight
    const apiRequests = this.getMetric('api.requests');
    const responseTimes = this.getMetricHistory('api.response_time', { 
      startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() 
    });
    
    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((sum, rt) => sum + rt.value, 0) / responseTimes.length;
      insights.push({
        id: 'performance',
        title: 'Performance Insight',
        description: `Average API response time is ${avgResponseTime.toFixed(2)}ms`,
        severity: avgResponseTime > 1000 ? 'high' : avgResponseTime > 500 ? 'medium' : 'low',
        category: 'performance'
      });
    }

    // Usage insight
    const activeAgents = this.getMetric('agents.active');
    if (activeAgents && activeAgents.currentValue > 50) {
      insights.push({
        id: 'usage',
        title: 'High Usage Alert',
        description: `Currently running ${activeAgents.currentValue} active agents`,
        severity: 'medium',
        category: 'usage'
      });
    }

    // Cost insight
    const costs = this.getMetric('costs.daily');
    if (costs && costs.currentValue > 100) {
      insights.push({
        id: 'cost',
        title: 'Cost Alert',
        description: `Daily costs of $${costs.currentValue.toFixed(2)} are above threshold`,
        severity: 'high',
        category: 'cost'
      });
    }

    return insights;
  }

  /**
   * Generate recommendations based on metrics
   * @returns {Array<object>} Array of recommendations
   */
  async generateRecommendations() {
    const recommendations = [];

    // Security recommendation
    const securityIncidents = this.getMetric('security.incidents');
    if (securityIncidents && securityIncidents.currentValue > 0) {
      recommendations.push({
        id: 'security',
        title: 'Security Hardening',
        description: 'Security incidents detected. Review access controls and audit logs.',
        priority: 'high',
        effort: 'medium',
        impact: 'high'
      });
    }

    // Performance recommendation
    const responseTimes = this.getMetricHistory('api.response_time', { 
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() 
    });
    
    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((sum, rt) => sum + rt.value, 0) / responseTimes.length;
      if (avgResponseTime > 1000) {
        recommendations.push({
          id: 'performance',
          title: 'Performance Optimization',
          description: `Average response time (${avgResponseTime.toFixed(2)}ms) exceeds optimal threshold. Consider scaling resources.`,
          priority: 'medium',
          effort: 'high',
          impact: 'medium'
        });
      }
    }

    // Resource recommendation
    const activeAgents = this.getMetric('agents.active');
    if (activeAgents && activeAgents.currentValue > 80) {
      recommendations.push({
        id: 'resources',
        title: 'Resource Scaling',
        description: `High agent count (${activeAgents.currentValue}). Consider scaling compute resources.`,
        priority: 'medium',
        effort: 'low',
        impact: 'high'
      });
    }

    return recommendations;
  }

  /**
   * Save metrics to disk
   * @private
   */
  async saveMetrics() {
    const metricsPath = path.join(this.storagePath, 'metrics', 'current.json');
    const metricsObj = {};
    
    for (const [name, metric] of this.metrics) {
      metricsObj[name] = metric;
    }
    
    await fs.writeFile(metricsPath, JSON.stringify(metricsObj, null, 2));
  }

  /**
   * Load metrics from disk
   * @private
   */
  async loadMetrics() {
    try {
      const metricsPath = path.join(this.storagePath, 'metrics', 'current.json');
      const metricsContent = await fs.readFile(metricsPath, 'utf8');
      const metricsObj = JSON.parse(metricsContent);
      
      for (const [name, metric] of Object.entries(metricsObj)) {
        this.metrics.set(name, metric);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn('Failed to load metrics:', error.message);
      }
      // File doesn't exist yet, which is fine
    }
  }

  /**
   * Get analytics health information
   * @returns {object} Health information
   */
  getHealth() {
    return {
      status: 'healthy',
      metricCount: this.metrics.size,
      realTimeBuffers: this.realTimeData.size,
      retentionDays: this.options.retentionDays,
      samplingRate: this.options.samplingRate,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const analyticsManager = new AnalyticsManager();

// Export class for instantiation with custom options
export default AnalyticsManager;