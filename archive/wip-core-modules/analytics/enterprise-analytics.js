/**
 * Ultra-Dex Enterprise Analytics & Monitoring System
 * Advanced metrics, monitoring, and business intelligence for enterprise deployments
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

class EnterpriseAnalytics extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      retentionDays: options.retentionDays || 90,
      enableRealTime: options.enableRealTime !== false,
      enableHistorical: options.enableHistorical !== false,
      samplingRate: options.samplingRate || 1.0, // 1.0 = 100% sampling
      enableAnomalyDetection: options.enableAnomalyDetection !== false,
      enablePredictiveAnalytics: options.enablePredictiveAnalytics !== false,
      metricsStoragePath: options.metricsStoragePath || '.ultra-dex/analytics',
      ...options,
    };

    this.metrics = new Map(); // metricName -> metricData
    this.realTimeData = new Map(); // real-time metrics buffer
    this.analyticsEngine = null;
    this.anomalyDetector = null;
    this.predictiveModels = new Map();
    this.alerts = new Map();
    this.dashboards = new Map();

    this.initialize();
  }

  async initialize() {
    // Ensure analytics directory exists
    await fs.mkdir(this.options.metricsStoragePath, { recursive: true });
    await fs.mkdir(path.join(this.options.metricsStoragePath, 'metrics'), { recursive: true });
    await fs.mkdir(path.join(this.options.metricsStoragePath, 'reports'), { recursive: true });
    await fs.mkdir(path.join(this.options.metricsStoragePath, 'dashboards'), { recursive: true });

    // Initialize analytics engine
    this.initializeAnalyticsEngine();

    // Initialize anomaly detection if enabled
    if (this.options.enableAnomalyDetection) {
      this.initializeAnomalyDetection();
    }

    // Initialize predictive analytics if enabled
    if (this.options.enablePredictiveAnalytics) {
      this.initializePredictiveModels();
    }

    logger.log('📊 Enterprise Analytics System Initialized');
  }

  initializeAnalyticsEngine() {
    // Initialize default metrics
    this.metrics.set('system.health', {
      name: 'System Health',
      description: 'Overall system health score',
      type: 'gauge',
      unit: 'score',
      currentValue: 100,
      history: [],
      timestamp: new Date().toISOString(),
    });

    this.metrics.set('agents.active', {
      name: 'Active Agents',
      description: 'Number of currently active agents',
      type: 'gauge',
      unit: 'count',
      currentValue: 0,
      history: [],
      timestamp: new Date().toISOString(),
    });

    this.metrics.set('memory.utilization', {
      name: 'Memory Utilization',
      description: 'Memory usage percentage',
      type: 'gauge',
      unit: 'percent',
      currentValue: 0,
      history: [],
      timestamp: new Date().toISOString(),
    });

    this.metrics.set('api.requests', {
      name: 'API Requests',
      description: 'Total API requests served',
      type: 'counter',
      unit: 'count',
      currentValue: 0,
      history: [],
      timestamp: new Date().toISOString(),
    });

    this.metrics.set('costs.daily', {
      name: 'Daily Costs',
      description: 'Daily operational costs',
      type: 'gauge',
      unit: 'usd',
      currentValue: 0,
      history: [],
      timestamp: new Date().toISOString(),
    });

    this.metrics.set('security.incidents', {
      name: 'Security Incidents',
      description: 'Detected security incidents',
      type: 'counter',
      unit: 'count',
      currentValue: 0,
      history: [],
      timestamp: new Date().toISOString(),
    });

    this.metrics.set('user.saturation', {
      name: 'User Saturation',
      description: 'User engagement and satisfaction metrics',
      type: 'gauge',
      unit: 'score',
      currentValue: 0,
      history: [],
      timestamp: new Date().toISOString(),
    });

    this.metrics.set('performance.latency', {
      name: 'API Latency',
      description: 'API response time metrics',
      type: 'histogram',
      unit: 'milliseconds',
      p50: 0,
      p95: 0,
      p99: 0,
      history: [],
      timestamp: new Date().toISOString(),
    });
  }

  initializeAnomalyDetection() {
    // Initialize anomaly detection engine
    this.anomalyDetector = {
      thresholds: new Map(),
      patterns: new Map(),
      detectionAlgorithms: new Map(),

      // Set up default thresholds
      setThreshold: (metric, threshold) => {
        this.anomalyDetector.thresholds.set(metric, threshold);
      },

      // Detect anomalies in metric data
      detectAnomalies: (metricName, value) => {
        const threshold = this.anomalyDetector.thresholds.get(metricName);
        if (!threshold) return false;

        // Simple threshold-based detection (in production, would use ML models)
        if (threshold.type === 'upper' && value > threshold.value) return true;
        if (threshold.type === 'lower' && value < threshold.value) return true;
        if (threshold.type === 'range' && (value < threshold.min || value > threshold.max))
          return true;

        return false;
      },
    };

    // Set up default thresholds
    this.anomalyDetector.setThreshold('agents.active', { type: 'range', min: 0, max: 1000 });
    this.anomalyDetector.setThreshold('memory.utilization', { type: 'upper', value: 90 });
    this.anomalyDetector.setThreshold('api.requests', { type: 'range', min: 0, max: 100000 });
    this.anomalyDetector.setThreshold('costs.daily', { type: 'upper', value: 10000 });
    this.anomalyDetector.setThreshold('security.incidents', { type: 'upper', value: 10 });
    this.anomalyDetector.setThreshold('performance.latency', { type: 'upper', value: 1000 });
  }

  initializePredictiveModels() {
    // Initialize predictive analytics models
    this.predictiveModels.set('growth', {
      name: 'Growth Prediction',
      description: 'Predicts user growth and adoption',
      algorithm: 'linear_regression',
      trainedAt: new Date().toISOString(),
      accuracy: 0.85,
      predictions: [],
    });

    this.predictiveModels.set('cost', {
      name: 'Cost Prediction',
      description: 'Predicts operational costs',
      algorithm: 'time_series',
      trainedAt: new Date().toISOString(),
      accuracy: 0.82,
      predictions: [],
    });

    this.predictiveModels.set('capacity', {
      name: 'Capacity Prediction',
      description: 'Predicts resource utilization',
      algorithm: 'time_series',
      trainedAt: new Date().toISOString(),
      accuracy: 0.88,
      predictions: [],
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
      timestamp: new Date().toISOString(),
    };

    // Update metric value based on type
    if (metric.type === 'counter') {
      metric.currentValue += value;
    } else if (metric.type === 'histogram') {
      // Update histogram percentiles
      if (!metric.samples) metric.samples = [];
      metric.samples.push(value);

      // Calculate percentiles (simplified)
      metric.samples.sort((a, b) => a - b);
      metric.p50 = metric.samples[Math.floor(metric.samples.length * 0.5)] || 0;
      metric.p95 = metric.samples[Math.floor(metric.samples.length * 0.95)] || 0;
      metric.p99 = metric.samples[Math.floor(metric.samples.length * 0.99)] || 0;

      // Keep only last 1000 samples
      if (metric.samples.length > 1000) {
        metric.samples = metric.samples.slice(-1000);
      }
    } else {
      metric.currentValue = value;
    }

    metric.timestamp = new Date().toISOString();
    metric.tags = { ...metric.tags, ...tags };
    metric.metadata = { ...metric.metadata, ...metadata };

    // Add to history (keep last 1000 entries)
    if (!metric.history) metric.history = [];
    metric.history.push({
      value,
      timestamp: new Date().toISOString(),
      tags,
      metadata,
    });

    if (metric.history.length > 1000) {
      metric.history = metric.history.slice(-1000);
    }

    this.metrics.set(name, metric);

    // Add to real-time buffer if enabled
    if (this.options.enableRealTime) {
      this.addToRealTimeBuffer(name, value, tags, metadata);
    }

    // Check for anomalies if enabled
    if (this.options.enableAnomalyDetection && this.anomalyDetector) {
      const isAnomaly = this.anomalyDetector.detectAnomalies(name, value);
      if (isAnomaly) {
        this.emit('anomaly:detected', {
          metric: name,
          value,
          threshold: this.anomalyDetector.thresholds.get(name),
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Emit event for real-time monitoring
    this.emit('metric:updated', {
      name,
      value,
      tags,
      metadata,
      timestamp: new Date().toISOString(),
    });

    // Periodically save metrics to disk
    if (Math.random() < 0.1) {
      // Save ~10% of the time to avoid excessive I/O
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
      metadata,
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
      history = history.filter((entry) => new Date(entry.timestamp) >= new Date(options.startTime));
    }

    if (options.endTime) {
      history = history.filter((entry) => new Date(entry.timestamp) <= new Date(options.endTime));
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
        endTime,
      },
      anomalies: [],
      predictions: {},
    };

    for (const metricName of metrics) {
      const metric = this.getMetric(metricName);
      if (metric) {
        const history = this.getMetricHistory(metricName, { startTime, endTime });

        // Calculate statistics
        const values = history.map((entry) => entry.value);
        const stats = {
          count: values.length,
          sum: values.reduce((sum, val) => sum + val, 0),
          avg: values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0,
          min: values.length > 0 ? Math.min(...values) : 0,
          max: values.length > 0 ? Math.max(...values) : 0,
          latest: values.length > 0 ? values[values.length - 1] : 0,
        };

        report.metrics[metricName] = {
          ...metric,
          history: history.slice(-options.historyLimit || 50), // Last 50 entries by default
          stats,
        };

        // Check for anomalies in this metric's history
        if (this.options.enableAnomalyDetection) {
          for (const entry of history) {
            if (this.anomalyDetector.detectAnomalies(metricName, entry.value)) {
              report.anomalies.push({
                metric: metricName,
                value: entry.value,
                timestamp: entry.timestamp,
                threshold: this.anomalyDetector.thresholds.get(metricName),
              });
            }
          }
        }
      }
    }

    // Generate predictions if enabled
    if (this.options.enablePredictiveAnalytics) {
      for (const [modelName, model] of this.predictiveModels) {
        try {
          const prediction = await this.generatePrediction(modelName, { days: 7 });
          report.predictions[modelName] = prediction;
        } catch (error) {
          logger.warn(`Failed to generate prediction for ${modelName}:`, error.message);
        }
      }
    }

    // Add summary calculations
    report.summary = {
      ...report.summary,
      durationHours: (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60),
      totalMetrics: Object.keys(report.metrics).length,
      anomalyCount: report.anomalies.length,
      predictionCount: Object.keys(report.predictions).length,
    };

    // Save report if persistence is enabled
    if (this.options.enablePersistence) {
      await this.saveReport(report);
    }

    return report;
  }

  /**
   * Generate prediction using a model
   * @param {string} modelName - Model name
   * @param {object} options - Prediction options
   * @returns {object} Prediction result
   */
  async generatePrediction(modelName, options = {}) {
    const model = this.predictiveModels.get(modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }

    // In a real implementation, this would use ML models
    // For now, we'll return a mock prediction based on historical data
    const metric = this.metrics.get(modelName);
    if (!metric) {
      return { error: `Metric ${modelName} not found for prediction` };
    }

    // Simple linear extrapolation (mock implementation)
    const recentHistory = metric.history.slice(-30); // Last 30 data points
    if (recentHistory.length < 2) {
      return { error: 'Insufficient data for prediction' };
    }

    // Calculate average growth rate
    let totalGrowth = 0;
    for (let i = 1; i < recentHistory.length; i++) {
      const prev = recentHistory[i - 1].value;
      const curr = recentHistory[i].value;
      if (prev !== 0) {
        totalGrowth += (curr - prev) / prev;
      }
    }
    const avgGrowthRate = totalGrowth / (recentHistory.length - 1);

    // Generate predictions
    const predictions = [];
    const lastValue = recentHistory[recentHistory.length - 1].value;
    const days = options.days || 7;

    for (let i = 1; i <= days; i++) {
      const predictedValue = lastValue * Math.pow(1 + avgGrowthRate, i);
      predictions.push({
        day: i,
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
        predictedValue: Math.round(predictedValue),
        confidence: 0.85, // Fixed confidence for mock implementation
      });
    }

    return {
      model: modelName,
      algorithm: model.algorithm,
      accuracy: model.accuracy,
      predictions,
      confidence: 0.85,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Create a custom dashboard
   * @param {string} dashboardId - Dashboard ID
   * @param {object} config - Dashboard configuration
   * @returns {object} Dashboard object
   */
  createDashboard(dashboardId, config) {
    const dashboard = {
      id: dashboardId,
      name: config.name,
      description: config.description,
      widgets: config.widgets || [],
      filters: config.filters || {},
      refreshInterval: config.refreshInterval || 30000, // 30 seconds
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      owners: config.owners || [],
      viewers: config.viewers || [],
    };

    this.dashboards.set(dashboardId, dashboard);
    return dashboard;
  }

  /**
   * Get dashboard data
   * @param {string} dashboardId - Dashboard ID
   * @returns {object} Dashboard data
   */
  getDashboardData(dashboardId) {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      return null;
    }

    const widgetData = {};
    for (const widget of dashboard.widgets) {
      if (widget.type === 'metric') {
        widgetData[widget.id] = this.getMetric(widget.metric);
      } else if (widget.type === 'history') {
        widgetData[widget.id] = this.getMetricHistory(widget.metric, widget.options);
      } else if (widget.type === 'prediction') {
        widgetData[widget.id] = this.generatePrediction(widget.model, widget.options);
      }
    }

    return {
      ...dashboard,
      widgetData,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Set up an alert
   * @param {string} alertId - Alert ID
   * @param {object} config - Alert configuration
   * @returns {object} Alert object
   */
  setupAlert(alertId, config) {
    const alert = {
      id: alertId,
      name: config.name,
      description: config.description,
      metric: config.metric,
      condition: config.condition, // 'greater_than', 'less_than', 'equals', 'range'
      threshold: config.threshold,
      frequency: config.frequency || 'real_time',
      recipients: config.recipients || [],
      enabled: config.enabled !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.alerts.set(alertId, alert);
    return alert;
  }

  /**
   * Check if any alerts should trigger
   * @param {string} metricName - Metric name to check
   * @param {number} value - Current value
   */
  checkAlerts(metricName, value) {
    const triggeredAlerts = [];

    for (const [alertId, alert] of this.alerts) {
      if (alert.enabled && alert.metric === metricName) {
        let shouldTrigger = false;

        switch (alert.condition) {
          case 'greater_than':
            shouldTrigger = value > alert.threshold;
            break;
          case 'less_than':
            shouldTrigger = value < alert.threshold;
            break;
          case 'equals':
            shouldTrigger = value === alert.threshold;
            break;
          case 'not_equals':
            shouldTrigger = value !== alert.threshold;
            break;
          case 'range':
            shouldTrigger = value >= alert.threshold.min && value <= alert.threshold.max;
            break;
        }

        if (shouldTrigger) {
          triggeredAlerts.push(alert);
          this.emit('alert:triggered', {
            alertId,
            alert,
            metricName,
            value,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    return triggeredAlerts;
  }

  /**
   * Save metrics to disk
   * @private
   */
  async saveMetrics() {
    const metricsPath = path.join(this.options.metricsStoragePath, 'metrics', 'current.json');
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
      const metricsPath = path.join(this.options.metricsStoragePath, 'metrics', 'current.json');
      const metricsContent = await fs.readFile(metricsPath, 'utf8');
      const metricsObj = JSON.parse(metricsContent);

      for (const [name, metric] of Object.entries(metricsObj)) {
        this.metrics.set(name, metric);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.warn('Failed to load metrics:', error.message);
      }
      // Directory doesn't exist yet, which is fine
    }
  }

  /**
   * Save report to disk
   * @param {object} report - Report to save
   * @private
   */
  async saveReport(report) {
    const reportPath = path.join(this.options.metricsStoragePath, 'reports', `${report.id}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  }

  /**
   * Get system health information
   * @returns {object} Health information
   */
  getHealth() {
    return {
      status: 'healthy',
      metricCount: this.metrics.size,
      realTimeBuffers: this.realTimeData.size,
      anomalyDetection: this.options.enableAnomalyDetection,
      predictiveAnalytics: this.options.enablePredictiveAnalytics,
      retentionDays: this.options.retentionDays,
      samplingRate: this.options.samplingRate,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get enterprise metrics summary
   * @returns {object} Metrics summary
   */
  getEnterpriseMetrics() {
    const metrics = {};

    for (const [name, metric] of this.metrics) {
      metrics[name] = {
        currentValue: metric.currentValue,
        unit: metric.unit,
        description: metric.description,
        timestamp: metric.timestamp,
      };
    }

    return {
      metrics,
      summary: {
        totalMetrics: this.metrics.size,
        activeAgents: this.metrics.get('agents.active')?.currentValue || 0,
        dailyCosts: this.metrics.get('costs.daily')?.currentValue || 0,
        securityIncidents: this.metrics.get('security.incidents')?.currentValue || 0,
        memoryUtilization: this.metrics.get('memory.utilization')?.currentValue || 0,
        apiRequests: this.metrics.get('api.requests')?.currentValue || 0,
        systemHealth: this.metrics.get('system.health')?.currentValue || 0,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const enterpriseAnalytics = new EnterpriseAnalytics();

// Export class for instantiation with custom options
export default EnterpriseAnalytics;
