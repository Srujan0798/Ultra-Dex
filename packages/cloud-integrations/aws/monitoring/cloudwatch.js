// Copyright (c) 2026 Ultra-Dex — AWS CloudWatch Monitoring

import {
  CloudWatchClient,
  PutMetricDataCommand,
  GetMetricStatisticsCommand,
} from '@aws-sdk/client-cloudwatch';

export class AWSCloudWatch {
  constructor(config = {}) {
    this.client = new CloudWatchClient({
      region: config.region || process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: config.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.namespace = config.namespace || 'Ultra-Dex';
  }

  async putMetric(metricName, value, dimensions = [], unit = 'Count') {
    const command = new PutMetricDataCommand({
      Namespace: this.namespace,
      MetricData: [
        {
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Dimensions: dimensions.map((dim) => ({
            Name: dim.name,
            Value: dim.value,
          })),
          Timestamp: new Date(),
        },
      ],
    });

    try {
      await this.client.send(command);
    } catch (error) {
      throw new Error(`CloudWatch put metric error: ${error.message}`);
    }
  }

  async getMetrics(metricName, startTime, endTime, dimensions = []) {
    const command = new GetMetricStatisticsCommand({
      Namespace: this.namespace,
      MetricName: metricName,
      Dimensions: dimensions.map((dim) => ({
        Name: dim.name,
        Value: dim.value,
      })),
      StartTime: startTime,
      EndTime: endTime,
      Period: 300, // 5 minutes
      Statistics: ['Average', 'Maximum', 'Minimum', 'Sum'],
    });

    try {
      const result = await this.client.send(command);
      return result.Datapoints || [];
    } catch (error) {
      throw new Error(`CloudWatch get metrics error: ${error.message}`);
    }
  }

  // Ultra-Dex specific monitoring
  async logAPIUsage(provider, tokens, latency) {
    await Promise.all([
      this.putMetric('APITokensUsed', tokens, [{ name: 'Provider', value: provider }], 'Count'),
      this.putMetric(
        'APILatency',
        latency,
        [{ name: 'Provider', value: provider }],
        'Milliseconds'
      ),
      this.putMetric('APICalls', 1, [{ name: 'Provider', value: provider }], 'Count'),
    ]);
  }

  async logError(provider, errorType) {
    await this.putMetric(
      'APIError',
      1,
      [
        { name: 'Provider', value: provider },
        { name: 'ErrorType', value: errorType },
      ],
      'Count'
    );
  }

  async logPerformance(operation, duration) {
    await this.putMetric(
      'OperationDuration',
      duration,
      [{ name: 'Operation', value: operation }],
      'Milliseconds'
    );
  }
}
