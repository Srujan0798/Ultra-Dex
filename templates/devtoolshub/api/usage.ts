import { getUsageAnalytics, trackUsage } from '../lib/usage';

export async function recordUsage(options: {
  keyId: string;
  endpoint: string;
  responseTime?: number;
  statusCode?: number;
}) {
  return trackUsage(options);
}

export async function listUsage(keyId: string, since?: Date) {
  return getUsageAnalytics(keyId, since);
}
