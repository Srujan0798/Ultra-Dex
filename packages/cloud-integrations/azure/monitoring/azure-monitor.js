// Copyright (c) 2026 Ultra-Dex — Azure Monitor

import { LogsQueryClient } from '@azure/monitor-query';
import { DefaultAzureCredential } from '@azure/identity';

export class AzureMonitor {
  constructor(config = {}) {
    this.credential = config.credential || new DefaultAzureCredential();
    this.logsQueryClient = new LogsQueryClient(this.credential);
    this.workspaceId = config.workspaceId || process.env.AZURE_LOG_WORKSPACE_ID;
  }

  async queryLogs(query, timespan = 'P1D') {
    try {
      const result = await this.logsQueryClient.queryWorkspace(this.workspaceId, query, {
        timespan,
      });
      return result;
    } catch (error) {
      throw new Error(`Azure Monitor query error: ${error.message}`);
    }
  }

  // Ultra-Dex specific monitoring methods
  async logAPIUsage(provider, tokens, latency, labels = {}) {
    const query = `
      UltraDex_CL
      | where Provider == "${provider}"
      | where Operation == "api_usage"
      | summarize TotalTokens = sum(Tokens), AvgLatency = avg(Latency)
      | order by TimeGenerated desc
    `;
    return this.queryLogs(query);
  }

  async logPerformance(operation, duration, labels = {}) {
    const query = `
      UltraDex_CL
      | where Operation == "performance"
      | where OperationName == "${operation}"
      | summarize AvgDuration = avg(Duration), MaxDuration = max(Duration), MinDuration = min(Duration)
      | order by TimeGenerated desc
    `;
    return this.queryLogs(query);
  }

  async logError(provider, errorType, labels = {}) {
    const query = `
      UltraDex_CL
      | where Provider == "${provider}"
      | where ErrorType == "${errorType}"
      | summarize ErrorCount = count()
      | order by TimeGenerated desc
    `;
    return this.queryLogs(query);
  }

  // Note: For actual logging to Azure Monitor, you'd use Application Insights SDK
  // This is a simplified version focusing on querying
}
