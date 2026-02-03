/**
 * Ultra-Dex Configuration Management System
 * Handles settings, preferences, and environment configuration
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { homedir } from 'os';

// Default configuration values
const DEFAULT_CONFIG = {
  // Core settings
  version: '3.2.0',
  projectRoot: process.cwd(),
  
  // AI Provider settings
  ai: {
    defaultProvider: 'claude',
    defaultModel: 'claude-sonnet-4-20250514',
    temperature: 0.7,
    maxTokens: 8192,
    timeout: 120000, // 2 minutes
    retryAttempts: 3,
    retryDelay: 1000
  },
  
  // MCP settings
  mcp: {
    port: 3001,
    host: 'localhost',
    timeout: 30000,
    connectionRetry: 3,
    autoConnect: true
  },
  
  // Performance settings
  performance: {
    cacheEnabled: true,
    cacheTimeout: 30000, // 30 seconds
    parallelProcessing: true,
    maxConcurrentTasks: 5,
    graphScanInterval: 30000 // 30 seconds
  },
  
  // Security settings
  security: {
    validatePaths: true,
    allowExternalConnections: true,
    sandboxOnly: false, // Default to false, can be enabled for strict mode
    maxFileSize: 10485760, // 10MB
    allowedFileTypes: ['.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.txt', '.yaml', '.yml']
  },
  
  // Logging settings
  logging: {
    level: 'info',
    file: '.ultra-dex/logs/ultra-dex.log',
    maxSize: '20m',
    maxFiles: 5,
    format: 'json'
  },
  
  // UI settings
  ui: {
    theme: 'professional-purple',
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    showAnimations: true
  },
  
  // Development settings
  development: {
    debugMode: false,
    verboseLogging: false,
    enableExperimental: false,
    autoSave: true
  }
};

class ConfigManager {
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.configPath = path.resolve(process.cwd(), '.ultra-dex', 'config.json');
    this.globalConfigPath = path.resolve(homedir(), '.ultra-dex', 'config.json');
    this.loaded = false;
  }

  /**
   * Load configuration from file
   */
  async load() {
    try {
      // Try to load from project config first
      if (await this.exists(this.configPath)) {
        const projectConfig = await this.loadFromFile(this.configPath);
        this.config = this.mergeDeep(this.config, projectConfig);
      }

      // Then try global config
      if (await this.exists(this.globalConfigPath)) {
        const globalConfig = await this.loadFromFile(this.globalConfigPath);
        this.config = this.mergeDeep(this.config, globalConfig);
      }

      // Override with environment variables
      this.config = this.applyEnvironmentOverrides(this.config);

      this.loaded = true;
      return this.config;
    } catch (error) {
      console.warn('Failed to load configuration, using defaults:', error.message);
      return this.config;
    }
  }

  /**
   * Save configuration to file
   */
  async save(config = null, type = 'project') {
    if (!config) config = this.config;
    
    const targetPath = type === 'global' ? this.globalConfigPath : this.configPath;

    try {
      // Create directory if it doesn't exist
      const dir = path.dirname(targetPath);
      await fs.mkdir(dir, { recursive: true });
      
      // Write configuration to file
      await fs.writeFile(targetPath, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      console.error(`Failed to save ${type} configuration:`, error.message);
      return false;
    }
  }

  /**
   * Save global configuration
   */
  async saveGlobal(config = null) {
    return this.save(config, 'global');
  }

  /**
   * Load global configuration specifically
   */
  async loadGlobal() {
    if (await this.exists(this.globalConfigPath)) {
      return this.loadFromFile(this.globalConfigPath);
    }
    return null;
  }

  /**
   * Get configuration value by path (dot notation)
   */
  get(path, defaultValue = undefined) {
    if (!this.loaded) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    const keys = path.split('.');
    let value = this.config;

    for (const key of keys) {
      if (value === null || value === undefined) {
        return defaultValue;
      }
      value = value[key];
    }

    return value !== undefined ? value : defaultValue;
  }

  /**
   * Set configuration value by path (dot notation)
   */
  set(path, value) {
    if (!this.loaded) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    const keys = path.split('.');
    let current = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (current[key] === undefined || current[key] === null) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Validate configuration against schema
   */
  validate() {
    const errors = [];

    // Validate AI settings
    if (typeof this.config.ai.defaultProvider !== 'string') {
      errors.push('ai.defaultProvider must be a string');
    }

    if (typeof this.config.ai.temperature !== 'number' || 
        this.config.ai.temperature < 0 || 
        this.config.ai.temperature > 1) {
      errors.push('ai.temperature must be a number between 0 and 1');
    }

    // Validate MCP settings
    if (typeof this.config.mcp.port !== 'number' || 
        this.config.mcp.port < 1 || 
        this.config.mcp.port > 65535) {
      errors.push('mcp.port must be a number between 1 and 65535');
    }

    // Validate performance settings
    if (typeof this.config.performance.maxConcurrentTasks !== 'number' || 
        this.config.performance.maxConcurrentTasks < 1) {
      errors.push('performance.maxConcurrentTasks must be a positive number');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Reset configuration to defaults
   */
  reset() {
    this.config = { ...DEFAULT_CONFIG };
    this.loaded = true;
  }

  /**
   * Get the current configuration object
   */
  getConfig() {
    if (!this.loaded) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    return { ...this.config };
  }

  /**
   * Update multiple configuration values
   */
  update(updates) {
    if (!this.loaded) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    this.config = this.mergeDeep(this.config, updates);
  }

  /**
   * Check if a config file exists
   */
  async exists(filePath) {
    return existsSync(filePath);
  }

  /**
   * Load configuration from a file
   */
  async loadFromFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load config from ${filePath}: ${error.message}`);
    }
  }

  /**
   * Apply environment variable overrides
   */
  applyEnvironmentOverrides(config) {
    const overrides = {};

    // AI settings
    if (process.env.ULTRA_DEX_AI_PROVIDER) {
      overrides.ai = overrides.ai || {};
      overrides.ai.defaultProvider = process.env.ULTRA_DEX_AI_PROVIDER;
    }

    if (process.env.ULTRA_DEX_AI_TEMPERATURE) {
      overrides.ai = overrides.ai || {};
      overrides.ai.temperature = parseFloat(process.env.ULTRA_DEX_AI_TEMPERATURE);
    }

    // MCP settings
    if (process.env.ULTRA_DEX_MCP_PORT) {
      overrides.mcp = overrides.mcp || {};
      overrides.mcp.port = parseInt(process.env.ULTRA_DEX_MCP_PORT);
    }

    // Performance settings
    if (process.env.ULTRA_DEX_PARALLEL_TASKS) {
      overrides.performance = overrides.performance || {};
      overrides.performance.maxConcurrentTasks = parseInt(process.env.ULTRA_DEX_PARALLEL_TASKS);
    }

    // Logging settings
    if (process.env.ULTRA_DEX_LOG_LEVEL) {
      overrides.logging = overrides.logging || {};
      overrides.logging.level = process.env.ULTRA_DEX_LOG_LEVEL;
    }

    // Development settings
    if (process.env.ULTRA_DEX_DEBUG_MODE) {
      overrides.development = overrides.development || {};
      overrides.development.debugMode = process.env.ULTRA_DEX_DEBUG_MODE === 'true';
    }

    return this.mergeDeep(config, overrides);
  }

  /**
   * Deep merge two objects
   */
  mergeDeep(target, source) {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.mergeDeep(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }

  /**
   * Check if value is an object
   */
  isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }

  /**
   * Get configuration schema for validation
   */
  getSchema() {
    return {
      type: 'object',
      properties: {
        ai: {
          type: 'object',
          properties: {
            defaultProvider: { type: 'string', enum: ['claude', 'openai', 'gemini', 'ollama'] },
            temperature: { type: 'number', minimum: 0, maximum: 1 },
            maxTokens: { type: 'number', minimum: 1 },
            timeout: { type: 'number', minimum: 1000 }
          }
        },
        mcp: {
          type: 'object',
          properties: {
            port: { type: 'number', minimum: 1, maximum: 65535 },
            timeout: { type: 'number', minimum: 1000 }
          }
        },
        performance: {
          type: 'object',
          properties: {
            maxConcurrentTasks: { type: 'number', minimum: 1 },
            cacheTimeout: { type: 'number', minimum: 1000 }
          }
        }
      }
    };
  }

  /**
   * Export configuration for backup
   */
  export() {
    if (!this.loaded) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    
    return {
      ...this.config,
      exportedAt: new Date().toISOString(),
      version: this.config.version
    };
  }

  /**
   * Import configuration from backup
   */
  import(configData) {
    if (!configData || typeof configData !== 'object') {
      throw new Error('Invalid configuration data provided');
    }

    // Validate imported config
    const validation = this.validateImport(configData);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    this.config = this.mergeDeep(this.config, configData);
    return true;
  }

  /**
   * Validate imported configuration
   */
  validateImport(configData) {
    const errors = [];
    
    // Basic structure validation
    if (typeof configData !== 'object') {
      errors.push('Configuration must be an object');
      return { valid: false, errors };
    }

    // Validate specific sections
    if (configData.ai && typeof configData.ai === 'object') {
      if (configData.ai.defaultProvider && 
          !['claude', 'openai', 'gemini', 'ollama'].includes(configData.ai.defaultProvider)) {
        errors.push('Invalid AI provider in imported config');
      }
    }

    if (configData.mcp && typeof configData.mcp === 'object') {
      if (configData.mcp.port && 
          (typeof configData.mcp.port !== 'number' || 
           configData.mcp.port < 1 || 
           configData.mcp.port > 65535)) {
        errors.push('Invalid MCP port in imported config');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Create global config manager instance
export const configManager = new ConfigManager();

// Initialize configuration
configManager.load().catch(console.error);

// Export for use in other modules
export default configManager;