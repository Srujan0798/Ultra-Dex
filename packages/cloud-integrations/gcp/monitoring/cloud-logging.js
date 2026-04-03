// Copyright (c) 2026 Ultra-Dex — GCP Cloud Logging

import { Logging } from '@google-cloud/logging';

export class GCPCloudLogging {
  constructor(config = {}) {
    this.logging = new Logging({
      projectId: config.projectId || process.env.GCP_PROJECT_ID,
      keyFilename: config.keyFilename || process.env.GCP_KEY_FILE,
    });
    this.logName = config.logName || 'ultra-dex';
    this.logger = this.logging.log(this.logName);
  }

  async log(entry, options = {}) {
    const metadata = {
      resource: {
        type: 'global',
      },
      severity: options.severity || 'INFO',
      labels: options.labels || {},
      timestamp: new Date(),
    };

    const logEntry = this.logger.entry(metadata, entry);
    await this.logger.write(logEntry);
  }

  async error(message, error, labels = {}) {
    await this.log(
      {
        message,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      {
        severity: 'ERROR',
        labels: { ...labels, type: 'error' },
      }
    );
  }

  async warn(message, labels = {}) {
    await this.log(
      { message },
      {
        severity: 'WARNING',
        labels: { ...labels, type: 'warning' },
      }
    );
  }

  async info(message, labels = {}) {
    await this.log(
      { message },
      {
        severity: 'INFO',
        labels: { ...labels, type: 'info' },
      }
    );
  }

  async debug(message, labels = {}) {
    await this.log(
      { message },
      {
        severity: 'DEBUG',
        labels: { ...labels, type: 'debug' },
      }
    );
  }

  // Ultra-Dex specific logging
  async logAPIUsage(provider, tokens, latency, labels = {}) {
    await this.log(
      {
        provider,
        tokens,
        latency,
        operation: 'api_usage',
      },
      {
        severity: 'INFO',
        labels: { ...labels, operation: 'api_usage', provider },
      }
    );
  }

  async logPerformance(operation, duration, labels = {}) {
    await this.log(
      {
        operation,
        duration,
        unit: 'milliseconds',
      },
      {
        severity: 'INFO',
        labels: { ...labels, operation: 'performance' },
      }
    );
  }

  async logTrace(traceId, traceData, labels = {}) {
    await this.log(
      {
        traceId,
        traceData,
        operation: 'trace',
      },
      {
        severity: 'INFO',
        labels: { ...labels, operation: 'trace', traceId },
      }
    );
  }
}
