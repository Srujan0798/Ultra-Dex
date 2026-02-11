// Copyright (c) 2026 Ultra-Dex
// src/utils/config-loader.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configuration Loader
 * Loads and validates Ultra-Dex configuration from multiple sources
 */
export class ConfigLoader {
  constructor() {
    this.config = {};
    this.defaults = {
      metaLayer: {
        version: '6.0.0',
        name: 'Ultra-Dex',
        mode: process.env.NODE_ENV || 'development'
      },
      aiProviders: {
        openai: {
          enabled: !!process.env.OPENAI_API_KEY,
          defaultModel: 'gpt-4o-2024-11-20',
          temperature: 0.7,
          maxTokens: 4096
        },
        anthropic: {
          enabled: !!process.env.ANTHROPIC_API_KEY,
          defaultModel: 'claude-3-5-sonnet-20241022',
          temperature: 0.7,
          maxTokens: 4096
        },
        google: {
          enabled: !!process.env.GOOGLE_API_KEY,
          defaultModel: 'gemini-2.0-flash-exp',
          temperature: 0.7,
          maxOutputTokens: 2048
        },
        ollama: {
          enabled: false,
          baseUrl: 'http://localhost:11434',
          defaultModel: 'llama3.2',
          temperature: 0.7
        }
      },
      orchestration: {
        maxConcurrentAgents: 8,
        timeout: 180000,
        retryPolicy: {
          maxRetries: 3,
          backoffMultiplier: 2,
          initialDelay: 1000
        },
        circuitBreaker: {
          threshold: 5,
          timeout: 60000
        },
        workflow: {
          enableParallelExecution: true,
          maxWorkflowDepth: 10,
          enableDynamicRouting: true
        }
      },
      memory: {
        storage: 'sqlite',
        ttl: 86400,
        maxSize: 2048,
        enableCompression: true,
        enableEncryption: false,
        retentionPeriod: 30
      },
      security: {
        enableSandbox: true,
        allowedDomains: ['localhost', '127.0.0.1', 'ultra-dex.ai'],
        rateLimiting: {
          enabled: true,
          windowMs: 900000,
          maxRequests: 100
        },
        enableAuditLogging: true,
        enableInputValidation: true,
        enableOutputSanitization: true
      },
      monitoring: {
        enableMetrics: true,
        enableTracing: true,
        samplingRate: 1.0,
        enablePerformanceProfiling: true,
        enableAnomalyDetection: true
      },
      features: {
        enableAgentSwarm: true,
        enableAutoHealing: true,
        enablePredictiveDebugging: true,
        enableCodeGeneration: true,
        enableCodeReview: true,
        enableSecurityScanning: true,
        enablePerformanceOptimization: true
      }
    };
  }

  /**
   * Load configuration from all sources
   */
  async load() {
    // Start with defaults
    this.config = { ...this.defaults };

    // Load from environment variables
    this.loadFromEnvironment();

    // Load from config files
    await this.loadFromFiles();

    // Validate configuration
    this.validate();

    return this.config;
  }

  /**
   * Load configuration from environment variables
   */
  loadFromEnvironment() {
    // Meta layer config
    if (process.env.ULTRADEX_MODE) {
      this.config.metaLayer.mode = process.env.ULTRADEX_MODE;
    }

    // AI provider configs
    if (process.env.DEFAULT_AI_PROVIDER) {
      this.config.aiProviders.default = process.env.DEFAULT_AI_PROVIDER;
    }

    // OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.config.aiProviders.openai.enabled = true;
      this.config.aiProviders.openai.apiKey = process.env.OPENAI_API_KEY;
    }
    if (process.env.OPENAI_DEFAULT_MODEL) {
      this.config.aiProviders.openai.defaultModel = process.env.OPENAI_DEFAULT_MODEL;
    }

    // Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      this.config.aiProviders.anthropic.enabled = true;
      this.config.aiProviders.anthropic.apiKey = process.env.ANTHROPIC_API_KEY;
    }
    if (process.env.ANTHROPIC_DEFAULT_MODEL) {
      this.config.aiProviders.anthropic.defaultModel = process.env.ANTHROPIC_DEFAULT_MODEL;
    }

    // Google
    if (process.env.GOOGLE_API_KEY) {
      this.config.aiProviders.google.enabled = true;
      this.config.aiProviders.google.apiKey = process.env.GOOGLE_API_KEY;
    }
    if (process.env.GOOGLE_DEFAULT_MODEL) {
      this.config.aiProviders.google.defaultModel = process.env.GOOGLE_DEFAULT_MODEL;
    }

    // Ollama
    if (process.env.OLLAMA_ENABLED === 'true') {
      this.config.aiProviders.ollama.enabled = true;
    }
    if (process.env.OLLAMA_BASE_URL) {
      this.config.aiProviders.ollama.baseUrl = process.env.OLLAMA_BASE_URL;
    }

    // Orchestration
    if (process.env.MAX_CONCURRENT_AGENTS) {
      this.config.orchestration.maxConcurrentAgents = parseInt(process.env.MAX_CONCURRENT_AGENTS);
    }
    if (process.env.REQUEST_TIMEOUT) {
      this.config.orchestration.timeout = parseInt(process.env.REQUEST_TIMEOUT);
    }

    // Memory
    if (process.env.MEMORY_STORAGE) {
      this.config.memory.storage = process.env.MEMORY_STORAGE;
    }
    if (process.env.MEMORY_TTL) {
      this.config.memory.ttl = parseInt(process.env.MEMORY_TTL);
    }

    // Security
    if (process.env.SANDBOX_ENABLED === 'false') {
      this.config.security.enableSandbox = false;
    }

    // Monitoring
    if (process.env.MONITORING_ENABLED === 'false') {
      this.config.monitoring.enableMetrics = false;
      this.config.monitoring.enableTracing = false;
    }
  }

  /**
   * Load configuration from files
   */
  async loadFromFiles() {
    // Try to load from various config file locations
    const configPaths = [
      path.join(process.cwd(), 'config.json'),
      path.join(process.cwd(), 'config/config.json'),
      path.join(process.cwd(), 'config/profiles/default.json'),
      path.join(__dirname, '..', '..', 'config', 'profiles', 'default.json'),
      path.join(process.cwd(), '.ultra-dex', 'config.json'),
      path.join(process.cwd(), '.config', 'ultra-dex.json')
    ];

    for (const configPath of configPaths) {
      try {
        if (await this.fileExists(configPath)) {
          const configFile = await fs.readFile(configPath, 'utf8');
          const fileConfig = JSON.parse(configFile);
          this.mergeConfig(this.config, fileConfig);
          break; // Use first found config file
        }
      } catch (error) {
        // Continue to next path if current one fails
        continue;
      }
    }

    // Load environment-specific config
    const envConfigPath = path.join(process.cwd(), `config/${this.config.metaLayer.mode}.json`);
    try {
      if (await this.fileExists(envConfigPath)) {
        const envConfigFile = await fs.readFile(envConfigPath, 'utf8');
        const envConfig = JSON.parse(envConfigFile);
        this.mergeConfig(this.config, envConfig);
      }
    } catch (error) {
      // Environment config is optional
    }
  }

  /**
   * Validate configuration
   */
  validate() {
    const errors = [];

    // Validate AI providers
    if (this.config.aiProviders.openai.enabled && !process.env.OPENAI_API_KEY) {
      errors.push('OPENAI_API_KEY is required when OpenAI provider is enabled');
    }

    if (this.config.aiProviders.anthropic.enabled && !process.env.ANTHROPIC_API_KEY) {
      errors.push('ANTHROPIC_API_KEY is required when Anthropic provider is enabled');
    }

    if (this.config.aiProviders.google.enabled && !process.env.GOOGLE_API_KEY) {
      errors.push('GOOGLE_API_KEY is required when Google provider is enabled');
    }

    // Validate orchestration settings
    if (this.config.orchestration.maxConcurrentAgents < 1) {
      errors.push('maxConcurrentAgents must be at least 1');
    }

    if (this.config.orchestration.timeout < 1000) {
      errors.push('timeout must be at least 1000ms');
    }

    // Validate memory settings
    if (this.config.memory.ttl < 300) { // Minimum 5 minutes
      errors.push('memory TTL must be at least 300 seconds (5 minutes)');
    }

    if (this.config.memory.maxSize < 1) {
      errors.push('memory maxSize must be at least 1 MB');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Merge configuration objects
   */
  mergeConfig(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.mergeConfig(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get configuration value by path (dot notation)
   */
  get(path, defaultValue = undefined) {
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
    const keys = path.split('.');
    let current = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Get the full configuration
   */
  getConfig() {
    return { ...this.config };
  }
}

// Export singleton instance
export const configLoader = new ConfigLoader();

// Export for direct import
export default configLoader;