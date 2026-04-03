/**
 * @class DashboardManager
 * Manages dashboard data and chart configurations
 */

export class DashboardManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.charts = new Map();
    this.dashboards = new Map();
  }

  async initialize() {
    this.setupDefaultCharts();
    this.setupDefaultDashboards();
    this.logger.info('Dashboard Manager initialized');
  }

  setupDefaultCharts() {
    // Performance Charts
    this.registerChart('response-time-trend', {
      type: 'line',
      title: 'Response Time Trend',
      dataSource: 'performance.responseTime',
      config: {
        xAxis: 'time',
        yAxis: 'milliseconds',
        color: '#3b82f6',
      },
    });

    this.registerChart('error-rate-chart', {
      type: 'bar',
      title: 'Error Rate by Component',
      dataSource: 'performance.errorRate',
      config: {
        xAxis: 'component',
        yAxis: 'percentage',
        color: '#ef4444',
      },
    });

    // Cost Charts
    this.registerChart('cost-breakdown', {
      type: 'pie',
      title: 'Cost Breakdown',
      dataSource: 'costs',
      config: {
        categories: ['aiCosts', 'infrastructureCosts', 'storageCosts'],
        colors: ['#10b981', '#f59e0b', '#8b5cf6'],
      },
    });

    this.registerChart('cost-trend', {
      type: 'area',
      title: 'Cost Trend Over Time',
      dataSource: 'costs.totalCosts',
      config: {
        xAxis: 'time',
        yAxis: 'dollars',
        color: '#f59e0b',
      },
    });

    // Usage Charts
    this.registerChart('user-activity', {
      type: 'line',
      title: 'User Activity',
      dataSource: 'dashboard.activeUsers',
      config: {
        xAxis: 'time',
        yAxis: 'users',
        color: '#10b981',
      },
    });

    this.registerChart('cli-usage', {
      type: 'bar',
      title: 'CLI Command Usage',
      dataSource: 'cli.commandsExecuted',
      config: {
        xAxis: 'command',
        yAxis: 'count',
        color: '#6366f1',
      },
    });
  }

  setupDefaultDashboards() {
    this.registerDashboard('overview', {
      title: 'Analytics Overview',
      description: 'High-level system metrics and insights',
      charts: ['response-time-trend', 'cost-breakdown', 'user-activity', 'error-rate-chart'],
      layout: {
        grid: '2x2',
        refresh: 30000, // 30 seconds
      },
    });

    this.registerDashboard('performance', {
      title: 'Performance Dashboard',
      description: 'Detailed performance metrics and trends',
      charts: ['response-time-trend', 'error-rate-chart'],
      layout: {
        grid: '1x2',
        refresh: 60000, // 1 minute
      },
    });

    this.registerDashboard('costs', {
      title: 'Cost Analysis',
      description: 'Cost tracking and optimization insights',
      charts: ['cost-breakdown', 'cost-trend'],
      layout: {
        grid: '1x2',
        refresh: 300000, // 5 minutes
      },
    });
  }

  registerChart(id, config) {
    this.charts.set(id, {
      id,
      ...config,
      created: new Date().toISOString(),
    });
  }

  registerDashboard(id, config) {
    this.dashboards.set(id, {
      id,
      ...config,
      created: new Date().toISOString(),
    });
  }

  async getDashboardData(dashboardId) {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const chartData = {};

    for (const chartId of dashboard.charts) {
      const chart = this.charts.get(chartId);
      if (chart) {
        chartData[chartId] = await this.getChartData(chart);
      }
    }

    return {
      dashboard,
      charts: chartData,
      timestamp: new Date().toISOString(),
    };
  }

  async getChartData(chart) {
    // This would fetch actual data from collectors
    // For now, return mock data structure
    const mockData = this.generateMockData(chart);

    return {
      chart,
      data: mockData,
      lastUpdated: new Date().toISOString(),
    };
  }

  generateMockData(chart) {
    const now = new Date();
    const data = [];

    switch (chart.type) {
      case 'line':
      case 'area':
        // Time series data
        for (let i = 0; i < 24; i++) {
          const timestamp = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
          const baseValue = this.getBaseValueForChart(chart.dataSource);
          const value = baseValue + (Math.random() - 0.5) * baseValue * 0.3;
          data.push({
            x: timestamp.toISOString(),
            y: Math.max(0, value),
          });
        }
        break;

      case 'bar':
        // Categorical data
        const categories = ['core', 'cli', 'dashboard', 'ai-providers', 'services'];
        for (const category of categories) {
          data.push({
            x: category,
            y: Math.floor(Math.random() * 100),
          });
        }
        break;

      case 'pie':
        // Pie chart data
        const slices = chart.config.categories || ['Category A', 'Category B', 'Category C'];
        for (const slice of slices) {
          data.push({
            label: slice,
            value: Math.floor(Math.random() * 100) + 10,
          });
        }
        break;
    }

    return data;
  }

  getBaseValueForChart(dataSource) {
    const bases = {
      'performance.responseTime': 500,
      'performance.errorRate': 0.05,
      'costs.totalCosts': 500,
      'dashboard.activeUsers': 50,
      'cli.commandsExecuted': 20,
    };

    return bases[dataSource] || 100;
  }

  getAllDashboards() {
    return Array.from(this.dashboards.values());
  }

  getAllCharts() {
    return Array.from(this.charts.values());
  }

  async createCustomChart(id, config) {
    this.registerChart(id, config);
    return this.charts.get(id);
  }

  async createCustomDashboard(id, config) {
    this.registerDashboard(id, config);
    return this.dashboards.get(id);
  }

  async updateChart(id, updates) {
    const chart = this.charts.get(id);
    if (!chart) {
      throw new Error(`Chart ${id} not found`);
    }

    Object.assign(chart, updates, {
      updated: new Date().toISOString(),
    });

    return chart;
  }

  async updateDashboard(id, updates) {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) {
      throw new Error(`Dashboard ${id} not found`);
    }

    Object.assign(dashboard, updates, {
      updated: new Date().toISOString(),
    });

    return dashboard;
  }

  async shutdown() {
    this.charts.clear();
    this.dashboards.clear();
    this.logger.info('Dashboard Manager shut down');
  }
}
