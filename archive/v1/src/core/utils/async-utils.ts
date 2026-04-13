/**
 * Async utility functions
 * @module core/utils/async-utils
 */

import { sleep } from './sleep.js';

/**
 * Retry an async operation with exponential backoff
 * @param operation - Async function to retry
 * @param options - Retry configuration
 * @returns Result of the operation
 * @throws Last error encountered after all retries exhausted
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts - 1 || !shouldRetry(lastError)) {
        throw lastError;
      }

      const delay = Math.min(delayMs * Math.pow(backoffMultiplier, attempt), maxDelayMs);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Execute an operation with a timeout
 * @param operation - Async function to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param timeoutMessage - Custom timeout error message
 * @returns Result of the operation
 * @throws Error if operation times out
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage = `Operation timed out after ${timeoutMs}ms`
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Debounce an async function
 * @param fn - Function to debounce
 * @param waitMs - Milliseconds to wait
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  waitMs: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve, reject) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result as ReturnType<T>);
        } catch (error) {
          reject(error);
        }
      }, waitMs);
    });
  };
}

/**
 * Run operations in parallel with concurrency limit
 * @param items - Items to process
 * @param operation - Operation to perform on each item
 * @param concurrency - Maximum concurrent operations
 * @returns Array of results
 */
export async function parallelWithLimit<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  concurrency = 5
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const promise = operation(item).then((result) => {
      results[i] = result;
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex((p) => p === promise || p === undefined),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}

export { sleep };
