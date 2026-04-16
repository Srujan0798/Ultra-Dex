import { logger } from './logging.js';
async function fetchWithRetry(
  url: RequestInfo | URL,
  options: RequestInit = {},
  retries: number = 2,
  delayMs: number = 400
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn(
        `[Network] Attempt ${attempt + 1}/${retries + 1} failed for ${String(url)}: ${message}`
      );
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  logger.error(`[Network] All ${retries + 1} attempts failed for ${String(url)}`);
  throw lastError;
}
export { fetchWithRetry };
