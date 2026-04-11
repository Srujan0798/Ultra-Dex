# @ultra-dex/analytics

Advanced analytics and insights platform for Ultra-Dex, providing comprehensive metrics collection, predictive analytics, intelligent insights, and automated alerting.

## Features

- **Metrics Collection**: Collect metrics from all Ultra-Dex system components
- **Predictive Analytics**: Forecast trends and optimize task performance
- **Intelligent Insights**: Generate automated insights from collected data
- **Performance Trends**: Analyze performance patterns and anomalies
- **User Behavior Analytics**: Track usage patterns and user engagement
- **Cost Optimization**: Monitor and optimize operational costs
- **Automated Alerts**: Real-time alerting for critical events
- **Dashboard Integration**: Chart and visualization components

## Installation

```bash
npm install @ultra-dex/analytics
```

## Quick Start

```javascript
import { AnalyticsEngine } from '@ultra-dex/analytics';

const analytics = new AnalyticsEngine({
  enableMetrics: true,
  enableInsights: true,
  enablePredictive: true,
});

await analytics.initialize();

// Collect metrics
await analytics.collectMetrics('core', {
  responseTime: 450,
  memoryUsage: 120000000,
});

// Get insights
const insights = await analytics.getInsights('24h');

// Get predictions
const prediction = await analytics.getPredictions('performance.responseTime', '7d');

// Get dashboard data
const dashboardData = await analytics.getDashboardData();
```

## API Reference

### AnalyticsEngine

Main entry point for the analytics platform.

```javascript
const analytics = new AnalyticsEngine(config);
await analytics.initialize();
await analytics.collectMetrics(component, metrics);
const insights = await analytics.getInsights(timeRange);
const predictions = await analytics.getPredictions(metricType, timeHorizon);
const dashboardData = await analytics.getDashboardData();
```

### MetricsCollector

Handles collection and aggregation of system metrics.

```javascript
const collector = analytics.collector;
await collector.collect('component', metrics);
const aggregated = await collector.getAggregatedMetrics(timeRange);
```

### InsightsEngine

Generates intelligent insights from metrics data.

```javascript
const insights = analytics.insights;
const insights = await insights.generateInsights(timeRange);
```

### PredictiveAnalytics

Provides forecasting and optimization recommendations.

```javascript
const predictive = analytics.predictive;
const prediction = await predictive.predict('performance.responseTime', '7d');
```

### DashboardManager

Manages dashboard configurations and data.

```javascript
const dashboard = analytics.dashboard;
const data = await dashboard.getDashboardData('overview');
```

## System Components

The analytics platform monitors these Ultra-Dex components:

- **Core**: Main application performance and resource usage
- **CLI**: Command-line interface usage and errors
- **Dashboard**: Web dashboard user activity and performance
- **AI Providers**: AI service usage, costs, and latency
- **Services**: General service metrics and throughput
- **Security**: Security events and authentication metrics
- **Performance**: System performance benchmarks
- **Costs**: Cost tracking across all services

## Configuration

```javascript
const config = {
  enableMetrics: true, // Enable metrics collection
  enableInsights: true, // Enable insights generation
  enablePredictive: true, // Enable predictive analytics
  retentionPeriod: 30, // Days to retain metrics
  alertThresholds: {
    // Custom alert thresholds
    errorRate: 0.05,
    costIncrease: 0.15,
  },
};
```

## Dashboard Integration

The analytics platform provides data for dashboard visualizations:

```javascript
// Get overview dashboard
const overview = await dashboard.getDashboardData('overview');

// Create custom chart
const chart = await dashboard.createCustomChart('custom-metric', {
  type: 'line',
  title: 'Custom Metric Trend',
  dataSource: 'custom.metric',
  config: {
    /* chart config */
  },
});
```

## Alerts and Notifications

Set up automated alerts for critical events:

```javascript
// Subscribe to alerts
analytics.alerts.subscribe('high-response-time', (alert) => {
  console.log('Alert:', alert.message);
  // Send notification, email, etc.
});

// Check for triggered alerts
const alerts = await analytics.alerts.checkAlerts(metrics);
```

## Cost Optimization

Monitor and optimize costs across the platform:

```javascript
// Get cost insights
const costInsights = await insights.generateInsights('24h');
const costRelated = costInsights.filter((i) => i.type === 'cost');

// Get cost predictions
const costPrediction = await predictive.predict('costs.totalCosts', '30d');
```

## User Behavior Analytics

Track and analyze user engagement patterns:

```javascript
import { UserBehaviorTracker } from '@ultra-dex/analytics';

const tracker = new UserBehaviorTracker(config);

// Track user events
await tracker.trackEvent('user123', 'feature_used', {
  feature: 'ai-chat',
  duration: 120,
});

// Get user profile
const profile = await tracker.getUserProfile('user123');

// Get aggregate insights
const aggregateInsights = await tracker.getAggregatedInsights();
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Type checking
npm run typecheck
```

## License

MIT
