import { logError, logEvent } from './better-stack-logger.js';

export interface BetterStackHeartbeatOptions {
  healthUrl: string;
  intervalMs?: number;
}

export function startBetterStackHeartbeat(options: BetterStackHeartbeatOptions): () => void {
  const intervalMs = options.intervalMs ?? 60_000;

  const intervalId = setInterval(async () => {
    try {
      const response = await fetch(options.healthUrl, { method: 'GET' });
      logEvent('heartbeat', {
        healthUrl: options.healthUrl,
        statusCode: response.status
      });
    } catch (error) {
      logError('Better Stack heartbeat failed', error, {
        healthUrl: options.healthUrl
      });
    }
  }, intervalMs);

  return () => clearInterval(intervalId);
}
