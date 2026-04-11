// Copyright (c) 2026 Ultra-Dex

/**
 * Context7 MCP server adaptor
 * Fetches and caches documentation from Context7 for LLM context enrichment
 *
 * @module cli/mcp/servers/context7
 */

import { Logger } from '../../utils/logger.js';

const logger = new Logger({ prefix: 'Context7' });

const CONTEXT7_API_BASE = 'https://api.context7.com/v1';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 100;

// Simple in-memory LRU cache
const docCache = new Map();
const cacheTimestamps = new Map();

/**
 * Configuration options for Context7 requests
 * @typedef {Object} Context7Config
 * @property {string} [apiKey] - Context7 API key
 * @property {string} [cacheDir] - Directory for caching docs
 * @property {number} [timeout] - Request timeout in ms
 */

/**
 * Fetch documentation from Context7
 * @param {Object} params - Request parameters
 * @param {string} params.package - Package name (e.g., 'lodash', 'react')
 * @param {string} [params.version] - Package version (default: 'latest')
 * @param {string} [params.topic] - Specific topic to fetch (e.g., 'debounce', 'useEffect')
 * @param {Context7Config} [params.options] - Additional options
 * @returns {Promise<Object>} Structured documentation with code examples
 * @throws {Error} If package not found or API error
 */
export async function handleContext7Request(params) {
  const { package: pkg, version = 'latest', topic, options = {} } = params || {};

  if (!pkg) {
    throw new Error('package name required');
  }

  const cacheKey = `${pkg}@${version}:${topic || 'full'}`;

  // Check cache
  if (docCache.has(cacheKey)) {
    const cached = docCache.get(cacheKey);
    const timestamp = cacheTimestamps.get(cacheKey);
    if (Date.now() - timestamp < CACHE_DURATION_MS) {
      logger.debug(`Cache hit for ${cacheKey}`);
      return cached;
    }
    // Expired
    docCache.delete(cacheKey);
    cacheTimestamps.delete(cacheKey);
  }

  try {
    const docs = await fetchContext7Docs(pkg, version, topic, options);

    // Cache result
    if (docCache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entry
      const oldestKey = cacheTimestamps.keys().next().value;
      docCache.delete(oldestKey);
      cacheTimestamps.delete(oldestKey);
    }
    docCache.set(cacheKey, docs);
    cacheTimestamps.set(cacheKey, Date.now());

    return docs;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to fetch Context7 docs: ${message}`);
    throw error;
  }
}

/**
 * Fetch documentation from Context7 API
 * @param {string} pkg - Package name
 * @param {string} version - Package version
 * @param {string} [topic] - Specific topic
 * @param {Context7Config} options - Request options
 * @returns {Promise<Object>} Documentation structure
 * @private
 */
async function fetchContext7Docs(pkg, version, topic, options) {
  const apiKey = options.apiKey || process.env.CONTEXT7_API_KEY;
  const timeout = options.timeout || 30000;

  const headers = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  // Build URL based on whether we're fetching specific topic or full docs
  const path = topic
    ? `/docs/${encodeURIComponent(pkg)}/${encodeURIComponent(version)}/topics/${encodeURIComponent(topic)}`
    : `/docs/${encodeURIComponent(pkg)}/${encodeURIComponent(version)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${CONTEXT7_API_BASE}${path}`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Documentation not found for ${pkg}@${version}${topic ? `/${topic}` : ''}`);
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later or use an API key.');
      }
      throw new Error(`Context7 API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform Context7 response to standardized format
    return {
      package: pkg,
      version: version,
      topic: topic || 'general',
      timestamp: new Date().toISOString(),
      summary: data.summary || '',
      sections: data.sections || [],
      codeExamples: data.codeExamples || [],
      apiReference: data.apiReference || [],
      relatedTopics: data.relatedTopics || [],
      source: 'context7',
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Search Context7 documentation
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query
 * @param {string[]} [params.packages] - Packages to search within
 * @param {number} [params.limit] - Max results (default: 10)
 * @param {Context7Config} [params.options] - API options
 * @returns {Promise<Object[]>} Search results
 */
export async function searchContext7(params) {
  const { query, packages = [], limit = 10, options = {} } = params || {};

  if (!query) {
    throw new Error('search query required');
  }

  const apiKey = options.apiKey || process.env.CONTEXT7_API_KEY;
  const timeout = options.timeout || 30000;

  const headers = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const searchParams = new URLSearchParams({
    q: query,
    limit: String(limit),
  });

  if (packages.length > 0) {
    packages.forEach((pkg) => searchParams.append('package', pkg));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${CONTEXT7_API_BASE}/search?${searchParams}`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Context7 search error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return data.results || [];
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Search timed out after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Clear the documentation cache
 * @returns {number} Number of entries cleared
 */
export function clearContext7Cache() {
  const size = docCache.size;
  docCache.clear();
  cacheTimestamps.clear();
  return size;
}

/**
 * Get cache statistics
 * @returns {Object} Cache info
 */
export function getContext7CacheStats() {
  return {
    size: docCache.size,
    maxSize: MAX_CACHE_SIZE,
    entries: Array.from(docCache.keys()),
    oldestEntry:
      cacheTimestamps.size > 0
        ? new Date(Math.min(...Array.from(cacheTimestamps.values()))).toISOString()
        : null,
  };
}

/**
 * List available packages in Context7
 * @param {Context7Config} [options] - API options
 * @returns {Promise<string[]>} Available package names
 */
export async function listAvailablePackages(options = {}) {
  const apiKey = options.apiKey || process.env.CONTEXT7_API_KEY;

  const headers = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(`${CONTEXT7_API_BASE}/packages`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to list packages: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.packages || [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to list packages: ${message}`);
    throw error;
  }
}

/**
 * Safe execution wrapper with error handling for context7
 * @param {Function} fn - Async function to execute
 * @param {string} [context='context7'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'context7') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
    return null;
  }
}

export default {
  handleContext7Request,
  searchContext7,
  clearContext7Cache,
  getContext7CacheStats,
  listAvailablePackages,
};
