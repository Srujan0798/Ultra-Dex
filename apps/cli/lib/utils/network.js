// Copyright (c) 2026 Ultra-Dex

/**
 * Fetch a URL with automatic retry logic
 * @param {string} url - The URL to fetch
 * @param {Object} [options={}] - Fetch options
 * @param {number} [retries=2] - Number of retry attempts
 * @param {number} [delayMs=400] - Delay between retries in ms
 * @returns {Promise<Response>} The fetch response
 * @throws {Error} If all retries fail
 */
export async function fetchWithRetry(url, options = {}, retries = 2, delayMs = 400) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response;
    } catch (err) {
      console.warn(`[Network] Attempt ${attempt + 1}/${retries + 1} failed for ${url}: ${err.message}`);
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  console.error(`[Network] All ${retries + 1} attempts failed for ${url}`);
  throw lastError;
}
