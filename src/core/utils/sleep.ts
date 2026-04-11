/**
 * Sleep utility for async delays
 * @module core/utils/sleep
 */

/**
 * Pause execution for specified milliseconds
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the delay
 * @example
 * await sleep(1000); // Sleep for 1 second
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sleep with abort support for cancellation
 * @param ms - Milliseconds to sleep
 * @param signal - AbortSignal for cancellation
 * @returns Promise that resolves after delay or rejects if aborted
 */
export function sleepWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);

    if (signal) {
      const onAbort = () => {
        clearTimeout(timeout);
        reject(new Error('Sleep aborted'));
      };

      if (signal.aborted) {
        onAbort();
        return;
      }

      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

/**
 * Sleep with timeout - resolves with false if timeout exceeded
 * @param ms - Milliseconds to sleep
 * @param timeoutMs - Maximum milliseconds to wait
 * @returns Promise resolving to true if completed, false if timed out
 */
export function sleepWithTimeout(ms: number, timeoutMs: number): Promise<boolean> {
  return Promise.race([sleep(ms).then(() => true), sleep(timeoutMs).then(() => false)]);
}

export default sleep;
