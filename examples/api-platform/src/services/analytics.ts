import { logger } from '../utils/logger';

interface UsageAnalytics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  requestsByEndpoint: Array<{ endpoint: string; count: number }>;
  requestsOverTime: Array<{ date: string; count: number }>;
}

// Mock analytics data
const analyticsStore: Map<string, Array<{
  timestamp: string;
  endpoint: string;
  status: number;
}>> = new Map();

export class AnalyticsService {
  async getUsageAnalytics(options: {
    userId: string;
    startDate: Date;
    endDate: Date;
  }): Promise<UsageAnalytics> {
    const { userId, startDate, endDate } = options;

    // In production, query from database or analytics service
    const mockData = analyticsStore.get(userId) || [];

    const filtered = mockData.filter(
      r => {
        const ts = new Date(r.timestamp);
        return ts >= startDate && ts <= endDate;
      }
    );

    const totalRequests = filtered.length;
    const successfulRequests = filtered.filter(r => r.status < 400).length;
    const failedRequests = totalRequests - successfulRequests;

    // Group by endpoint
    const endpointCounts = new Map<string, number>();
    filtered.forEach(r => {
      endpointCounts.set(r.endpoint, (endpointCounts.get(r.endpoint) || 0) + 1);
    });

    const requestsByEndpoint = Array.from(endpointCounts.entries()).map(
      ([endpoint, count]) => ({ endpoint, count })
    );

    // Group by date
    const dateCounts = new Map<string, number>();
    filtered.forEach(r => {
      const date = r.timestamp.split('T')[0];
      dateCounts.set(date, (dateCounts.get(date) || 0) + 1);
    });

    const requestsOverTime = Array.from(dateCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      requestsByEndpoint,
      requestsOverTime
    };
  }

  // Method to record request (called by middleware)
  async recordRequest(userId: string, endpoint: string, status: number): Promise<void> {
    if (!analyticsStore.has(userId)) {
      analyticsStore.set(userId, []);
    }

    analyticsStore.get(userId)!.push({
      timestamp: new Date().toISOString(),
      endpoint,
      status
    });

    // In production, send to analytics database or service
    logger.debug({ userId, endpoint, status }, 'Analytics request recorded');
  }
}
