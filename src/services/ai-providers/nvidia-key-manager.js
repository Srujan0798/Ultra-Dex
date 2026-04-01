/**
 * NVIDIA API Key Manager
 * Support for multiple API keys with rotation and load balancing
 * 
 * Benefits:
 * - Avoid rate limits by rotating keys
 * - Use different keys for different models
 * - Fallback if one key fails
 * - Track usage per key
 */

import { OpenAI } from 'openai';

class NVIDIAKeyManager {
  constructor() {
    this.keys = [];
    this.currentIndex = 0;
    this.keyUsage = new Map();
    this.keyFailures = new Map();
  }

  /**
   * Add an API key
   * @param {string} key - NVIDIA API key
   * @param {Object} options - Key configuration
   * @param {string} options.name - Friendly name for the key
   * @param {Array} options.models - Specific models this key can access (optional)
   * @param {number} options.priority - Priority (higher = used first)
   * @param {number} options.rateLimit - Max requests per minute
   */
  addKey(key, options = {}) {
    const keyConfig = {
      key,
      name: options.name || `Key-${this.keys.length + 1}`,
      models: options.models || null, // null = all models
      priority: options.priority || 0,
      rateLimit: options.rateLimit || 100, // default 100 req/min
      createdAt: Date.now(),
    };

    this.keys.push(keyConfig);
    this.keyUsage.set(key, 0);
    this.keyFailures.set(key, 0);

    // Sort by priority (highest first)
    this.keys.sort((a, b) => b.priority - a.priority);

    console.log(`✅ Added API Key: ${keyConfig.name}`);
    return this.keys.length;
  }

  /**
   * Remove an API key
   * @param {number} index - Key index (0-based)
   */
  removeKey(index) {
    if (index >= 0 && index < this.keys.length) {
      const removed = this.keys.splice(index, 1)[0];
      this.keyUsage.delete(removed.key);
      this.keyFailures.delete(removed.key);
      console.log(`❌ Removed API Key: ${removed.name}`);
      return true;
    }
    return false;
  }

  /**
   * Get current key (with rotation)
   * @param {string} modelId - Optional model ID to check key permissions
   * @returns {Object} Key configuration
   */
  getCurrentKey(modelId = null) {
    if (this.keys.length === 0) {
      throw new Error('No API keys configured');
    }

    // Try keys in priority order
    for (let i = 0; i < this.keys.length; i++) {
      const keyIndex = (this.currentIndex + i) % this.keys.length;
      const keyConfig = this.keys[keyIndex];

      // Check if key supports this model
      if (modelId && keyConfig.models && !keyConfig.models.includes(modelId)) {
        continue;
      }

      // Check if key has exceeded rate limit
      const usage = this.keyUsage.get(keyConfig.key) || 0;
      if (usage >= keyConfig.rateLimit) {
        continue;
      }

      // Check failure count
      const failures = this.keyFailures.get(keyConfig.key) || 0;
      if (failures >= 5) {
        console.warn(`⚠️  Key ${keyConfig.name} has ${failures} failures, skipping`);
        continue;
      }

      this.currentIndex = keyIndex;
      return keyConfig;
    }

    // Fallback: return any key if all checks fail
    return this.keys[this.currentIndex % this.keys.length];
  }

  /**
   * Rotate to next key
   */
  rotateKey() {
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return this.getCurrentKey();
  }

  /**
   * Create OpenAI client with current key
   * @param {string} modelId - Optional model ID
   * @returns {OpenAI} Configured client
   */
  createClient(modelId = null) {
    const keyConfig = this.getCurrentKey(modelId);
    
    return new OpenAI({
      baseURL: 'https://integrate.api.nvidia.com/v1',
      apiKey: keyConfig.key,
    });
  }

  /**
   * Record successful request
   * @param {string} key - API key used
   */
  recordSuccess(key) {
    const usage = this.keyUsage.get(key) || 0;
    this.keyUsage.set(key, usage + 1);
    
    // Reset failure count on success
    this.keyFailures.set(key, 0);
  }

  /**
   * Record failed request
   * @param {string} key - API key used
   */
  recordFailure(key) {
    const failures = this.keyFailures.get(key) || 0;
    this.keyFailures.set(key, failures + 1);
    
    // Auto-rotate on failure
    this.rotateKey();
  }

  /**
   * Reset usage counters
   */
  resetUsage() {
    this.keyUsage.forEach((_, key) => this.keyUsage.set(key, 0));
    console.log('🔄 Reset all usage counters');
  }

  /**
   * Reset failure counters
   */
  resetFailures() {
    this.keyFailures.forEach((_, key) => this.keyFailures.set(key, 0));
    console.log('🔄 Reset all failure counters');
  }

  /**
   * Get usage statistics
   * @returns {Object} Usage stats per key
   */
  getUsageStats() {
    return this.keys.map((keyConfig, index) => ({
      index,
      name: keyConfig.name,
      usage: this.keyUsage.get(keyConfig.key) || 0,
      failures: this.keyFailures.get(keyConfig.key) || 0,
      rateLimit: keyConfig.rateLimit,
      priority: keyConfig.priority,
      models: keyConfig.models || 'all',
    }));
  }

  /**
   * Get total keys count
   */
  getKeyCount() {
    return this.keys.length;
  }

  /**
   * List all keys (without exposing full key)
   */
  listKeys() {
    return this.keys.map((keyConfig, index) => ({
      index,
      name: keyConfig.name,
      masked: keyConfig.key.substring(0, 10) + '...',
      priority: keyConfig.priority,
      models: keyConfig.models || 'all',
    }));
  }
}

// Lazy singleton instance - created on first access
let _keyManagerInstance = null;

function getKeyManager() {
  if (!_keyManagerInstance) {
    _keyManagerInstance = new NVIDIAKeyManager();
  }
  return _keyManagerInstance;
}

// Export getter instead of instance for lazy initialization
export { getKeyManager as keyManager };

/**
 * Initialize key manager from environment variables
 * Supports: NVIDIA_API_KEY, NVIDIA_API_KEY_1, NVIDIA_API_KEY_2, etc.
 */
export function initializeKeyManager() {
  const km = getKeyManager();
  const keys = [];

  // Check for primary key
  if (process.env.NVIDIA_API_KEY) {
    keys.push({
      key: process.env.NVIDIA_API_KEY,
      name: 'Primary',
      priority: 10,
    });
  }

  // Check for additional keys (NVIDIA_API_KEY_1, NVIDIA_API_KEY_2, etc.)
  let index = 1;
  while (process.env[`NVIDIA_API_KEY_${index}`]) {
    keys.push({
      key: process.env[`NVIDIA_API_KEY_${index}`],
      name: `Secondary-${index}`,
      priority: 10 - index, // Decreasing priority
    });
    index++;
  }

  // Add all keys
  keys.forEach(({ key, name, priority }) => {
    km.addKey(key, { name, priority });
  });

  console.log(`🔑 Initialized ${km.getKeyCount()} API key(s)`);

  return km;
}

export default NVIDIAKeyManager;

