import { logger } from './logging.js';
async function fetchWithRetry(url, options = {}, retries = 2, delayMs = 400) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response;
    } catch (err) {
      logger.warn(`[Network] Attempt ${attempt + 1}/${retries + 1} failed for ${url}: ${err.message}`);
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  logger.error(`[Network] All ${retries + 1} attempts failed for ${url}`);
  throw lastError;
}
export {
  fetchWithRetry
};
