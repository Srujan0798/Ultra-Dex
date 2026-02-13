/**
 * Configuration Manager
 * Centralized configuration with environment support
 *
 * @module ConfigManager
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class ConfigManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.configPath = options.configPath || './config';
    this.env = options.env || process.env.NODE_ENV || 'development';
    this.config = {};
    this.schemas = new Map();
    this.initialized = false;
  }

  /**
   * Initialize configuration
   */
  async initialize() {
    // Load default config
    await this._loadDefaults();

    // Load environment-specific config
    await this._loadEnvironmentConfig();

    // Override with environment variables
    this._loadEnvVars();

    // Validate configuration
    this._validate();

    this.initialized = true;
    this.emit('initialized', this.config);
    return this.config;
  }

  /**
   * Load default configuration
   */
  async _loadDefaults() {
    this.config = {
      // Core settings
      core: {
        name: 'Ultra-Dex',
        version: '6.0.0',
        dataPath: './data',
        logLevel: 'info',
      },

      // Memory settings
      memory: {
        sqlite: {
          database: './data/memory.db',
          poolSize: 10,
        },
        chroma: {
          url: process.env.CHROMA_URL || 'http://localhost:8000',
          collection: 'ultra-dex',
        },
        neo4j: {
          uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
          user: process.env.NEO4J_USER || 'neo4j',
          password: process.env.NEO4J_PASSWORD || '',
        },
        cache: {
          ttl: 300000,
          maxSize: 1000,
        },
        compression: true,
      },

      // Agent settings
      agents: {
        maxAgents: 100,
        defaultTimeout: 30000,
        registryPath: './data/agent-registry.json',
      },

      // Reliability settings
      reliability: {
        heartbeatInterval: 5000,
        circuitBreakerThreshold: 5,
        circuitBreakerTimeout: 60000,
        maxRetries: 3,
        retryDelay: 1000,
      },

      // MCP settings
      mcp: {
        serversPath: './mcp/servers',
        maxServers: 50,
        autoRestart: true,
        restartDelay: 5000,
        healthCheckInterval: 30000,
        servers: {
          github: {
            enabled: true,
            autoStart: false,
            token: process.env.GITHUB_TOKEN,
          },
          slack: {
            enabled: true,
            autoStart: false,
            botToken: process.env.SLACK_BOT_TOKEN,
            teamId: process.env.SLACK_TEAM_ID,
          },
          notion: {
            enabled: true,
            autoStart: false,
            token: process.env.NOTION_API_TOKEN,
          },
          linear: {
            enabled: true,
            autoStart: false,
            apiKey: process.env.LINEAR_API_KEY,
          },
          filesystem: {
            enabled: true,
            autoStart: true,
            allowedPaths: [process.cwd()],
          },
          fetch: {
            enabled: true,
            autoStart: true,
          },
          postgres: {
            enabled: false,
            autoStart: false,
            url: process.env.DATABASE_URL,
          },
          sqlite: {
            enabled: true,
            autoStart: true,
            database: './data/memory.db',
          },
        },
      },

      // AI Provider settings
      providers: {
        defaultProvider: 'openai',
        fallbackEnabled: true,
        costOptimization: true,
        latencyTarget: 2000,
        maxRetries: 3,
        timeout: 30000,

        openai: {
          enabled: true,
          apiKey: process.env.OPENAI_API_KEY,
          baseURL: process.env.OPENAI_BASE_URL,
          models: ['gpt-4', 'gpt-3.5-turbo'],
          priority: 1,
          costPer1kTokens: { input: 0.01, output: 0.03 },
        },

        anthropic: {
          enabled: true,
          apiKey: process.env.ANTHROPIC_API_KEY,
          models: ['claude-3-opus', 'claude-3-sonnet'],
          priority: 2,
          costPer1kTokens: { input: 0.008, output: 0.024 },
        },

        google: {
          enabled: true,
          apiKey: process.env.GOOGLE_API_KEY,
          models: ['gemini-pro', 'gemini-ultra'],
          priority: 3,
          costPer1kTokens: { input: 0.005, output: 0.015 },
        },

        groq: {
          enabled: true,
          apiKey: process.env.GROQ_API_KEY,
          models: ['mixtral-8x7b', 'llama2-70b'],
          priority: 4,
          costPer1kTokens: { input: 0.001, output: 0.002 },
        },
      },

      // Observability settings
      observability: {
        enabled: true,
        logPath: './data/observability',
        maxTraces: 10000,
        retentionDays: 30,
        sampleRate: 1.0,
        enableConsole: true,
        metrics: {
          enabled: true,
          interval: 60000,
        },
        alerts: {
          enabled: true,
          webhook: process.env.ALERT_WEBHOOK_URL,
        },
      },

      // Token optimization
      tokenOptimizer: {
        enabled: true,
        maxCacheSize: 1000,
        cacheTTL: 3600000,
        compressionEnabled: true,
        dedupEnabled: true,
        budgetLimit: process.env.DAILY_BUDGET ? parseFloat(process.env.DAILY_BUDGET) : null,
        warnThreshold: 0.8,
      },

      // Security settings
      security: {
        jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
        jwtExpiresIn: '24h',
        rateLimit: {
          enabled: true,
          windowMs: 900000, // 15 minutes
          maxRequests: 100,
        },
        cors: {
          enabled: true,
          origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
        },
      },

      // Server settings
      server: {
        port: parseInt(process.env.PORT) || 3000,
        host: process.env.HOST || '0.0.0.0',
        ssl: {
          enabled: process.env.SSL_ENABLED === 'true',
          cert: process.env.SSL_CERT_PATH,
          key: process.env.SSL_KEY_PATH,
        },
      },
    };
  }

  /**
   * Load environment-specific config file
   */
  async _loadEnvironmentConfig() {
    const configFile = path.join(this.configPath, `${this.env}.json`);

    try {
      const data = await fs.readFile(configFile, 'utf8');
      const envConfig = JSON.parse(data);
      this._mergeConfig(this.config, envConfig);
      this.emit('config:loaded', { source: configFile });
    } catch (error) {
      // File doesn't exist, use defaults
      this.emit('config:defaults', { env: this.env });
    }
  }

  /**
   * Load environment variables
   */
  _loadEnvVars() {
    // Ultra-Dex specific env vars override config
    const envMappings = {
      ULTRA_DEX_DATA_PATH: 'core.dataPath',
      ULTRA_DEX_LOG_LEVEL: 'core.logLevel',
      ULTRA_DEX_PORT: 'server.port',
      ULTRA_DEX_MEMORY_CACHE_TTL: 'memory.cache.ttl',
      ULTRA_DEX_AGENT_TIMEOUT: 'agents.defaultTimeout',
      ULTRA_DEX_MAX_AGENTS: 'agents.maxAgents',
      ULTRA_DEX_OBSERVABILITY_ENABLED: 'observability.enabled',
      ULTRA_DEX_TOKEN_OPTIMIZATION: 'tokenOptimizer.enabled',
    };

    for (const [envVar, configPath] of Object.entries(envMappings)) {
      const value = process.env[envVar];
      if (value !== undefined) {
        this._setByPath(this.config, configPath, this._parseValue(value));
      }
    }
  }

  /**
   * Get configuration value
   * @param {string} path - Dot-notation path
   * @param {*} defaultValue - Default if not found
   * @returns {*} Configuration value
   */
  get(path, defaultValue = undefined) {
    return this._getByPath(this.config, path) ?? defaultValue;
  }

  /**
   * Set configuration value
   * @param {string} path - Dot-notation path
   * @param {*} value - Value to set
   */
  set(path, value) {
    this._setByPath(this.config, path, value);
    this.emit('config:changed', { path, value });
  }

  /**
   * Get all configuration
   * @returns {Object} Complete configuration
   */
  getAll() {
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Register configuration schema
   * @param {string} path - Configuration path
   * @param {Object} schema - Validation schema
   */
  registerSchema(path, schema) {
    this.schemas.set(path, schema);
  }

  /**
   * Validate configuration
   */
  _validate() {
    const errors = [];

    // Validate required fields
    if (!this.config.core.dataPath) {
      errors.push('core.dataPath is required');
    }

    // Validate provider configs
    for (const [provider, config] of Object.entries(this.config.providers)) {
      if (config.enabled && typeof config !== 'object') {
        errors.push(`providers.${provider} must be an object`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Save current configuration to file
   * @param {string} env - Environment name
   */
  async save(env = this.env) {
    const configFile = path.join(this.configPath, `${env}.json`);

    await fs.mkdir(this.configPath, { recursive: true });
    await fs.writeFile(configFile, JSON.stringify(this.config, null, 2));

    this.emit('config:saved', { file: configFile });
  }

  /**
   * Reset to defaults
   */
  async reset() {
    await this._loadDefaults();
    this._loadEnvVars();
    this.emit('config:reset');
  }

  // Private helper methods
  _getByPath(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }

  _setByPath(obj, path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[last] = value;
  }

  _mergeConfig(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this._mergeConfig(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  _parseValue(value) {
    // Try to parse as number
    if (!isNaN(value) && !isNaN(parseFloat(value))) {
      return parseFloat(value);
    }
    // Try to parse as boolean
    if (value === 'true') return true;
    if (value === 'false') return false;
    // Return as string
    return value;
  }
}

module.exports = { ConfigManager };
