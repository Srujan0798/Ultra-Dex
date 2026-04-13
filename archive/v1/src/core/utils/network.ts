import { logger } from './logging.js';

/**
 * Fetch with retry and timeout
 * Production-grade HTTP client with automatic retries and timeout handling
 */

const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds
const DEFAULT_RETRIES = 2;
const DEFAULT_DELAY_MS = 400;

interface FetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Fetch with automatic retry and timeout
 * @param url - URL to fetch
 * @param options - Fetch options including timeout
 * @param retries - Number of retry attempts
 * @param delayMs - Base delay between retries
 * @returns Response from fetch
 * @throws Error if all attempts fail
 */
async function fetchWithRetry(
  url: string,
  options: FetchOptions = {},
  retries: number = DEFAULT_RETRIES,
  delayMs: number = DEFAULT_DELAY_MS
): Promise<Response> {
  const timeout = options.timeout || DEFAULT_TIMEOUT_MS;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const fetchOptions = {
        ...options,
        signal: controller.signal,
      };

      try {
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      const isTimeout = error.name === 'AbortError';

      logger.warn(
        `[Network] Attempt ${attempt + 1}/${retries + 1} failed for ${url}: ${
          isTimeout ? 'Request timeout' : error.message
        }`
      );

      lastError = error;

      if (attempt < retries) {
        // Exponential backoff: delayMs * 2^attempt
        const backoffDelay = delayMs * Math.pow(2, attempt);
        logger.info(`[Network] Retrying in ${backoffDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }
  }

  logger.error(`[Network] All ${retries + 1} attempts failed for ${url}`);
  throw lastError || new Error(`Failed to fetch ${url}`);
}

/**
 * Fetch JSON with automatic retry and timeout
 * @param url - URL to fetch
 * @param options - Fetch options
 * @returns Parsed JSON response
 */
async function fetchJSON<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const response = await fetchWithRetry(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response.json() as Promise<T>;
}

/**
 * Fetch with circuit breaker pattern
 * Wraps fetchWithRetry with circuit breaker protection
 */
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly threshold: number;
  private readonly timeout: number;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

export { fetchWithRetry, fetchJSON, CircuitBreaker };
