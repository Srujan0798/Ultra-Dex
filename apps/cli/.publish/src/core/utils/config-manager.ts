import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { logger } from './logging.js';
const DEFAULT_CONFIG = {
  version: '4.0.0',
  projectRoot: process.cwd(),
  ai: {
    defaultProvider: 'claude',
    defaultModel: 'claude-sonnet-5-20260201',
    temperature: 0.7,
    maxTokens: 8192,
    timeout: 12e4,
    retryAttempts: 3,
    retryDelay: 1e3,
    claudeSonnet5: {
      enableAdvancedFeatures: true,
      contextWindow: 2e5,
      reasoningCapabilities: true,
      codeGenerationQuality: 'high',
      multimodalSupport: true,
    },
  },
  memory: {
    maxContextTokens: 8192,
    autoPrune: true,
    pruneThreshold: 0.8,
  },
  contextPruning: {
    maxContextTokens: 8192,
    autoPrune: true,
    pruneThreshold: 0.8,
  },
  mcp: {
    port: 3001,
    host: 'localhost',
    timeout: 3e4,
    connectionRetry: 3,
    autoConnect: true,
  },
  performance: {
    cacheEnabled: true,
    cacheTimeout: 3e4,
    parallelProcessing: true,
    maxConcurrentTasks: 5,
    graphScanInterval: 3e4,
  },
  security: {
    validatePaths: true,
    allowExternalConnections: true,
    sandboxOnly: false,
    maxFileSize: 10485760,
    allowedFileTypes: ['.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.txt', '.yaml', '.yml'],
  },
  logging: {
    level: 'info',
    file: '.ultra-dex/logs/ultra-dex.log',
    maxSize: '20m',
    maxFiles: 5,
    format: 'json',
  },
  ui: {
    theme: 'professional-purple',
    autoRefresh: true,
    refreshInterval: 3e4,
    showAnimations: true,
  },
  development: {
    debugMode: false,
    verboseLogging: false,
    enableExperimental: false,
    autoSave: true,
  },
  governance: {
    allowlist: [],
    blocklist: [],
    strict: false,
  },
};
class ConfigManager {
  config;
  configPath;
  globalConfigPath;
  loaded;
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.configPath = path.resolve(process.cwd(), '.ultra-dex', 'config.json');
    this.globalConfigPath = path.resolve(homedir(), '.ultra-dex', 'config.json');
    this.loaded = false;
  }
  async load() {
    try {
      if (await this.exists(this.configPath)) {
        const projectConfig = await this.loadFromFile(this.configPath);
        this.config = this.mergeDeep(this.config, projectConfig);
      }
      if (await this.exists(this.globalConfigPath)) {
        const globalConfig = await this.loadFromFile(this.globalConfigPath);
        this.config = this.mergeDeep(this.config, globalConfig);
      }
      this.config = this.applyEnvironmentOverrides(this.config);
      this.loaded = true;
      return this.config;
    } catch (error) {
      logger.warn(
        'Failed to load configuration, using defaults:',
        error instanceof Error ? error.message : String(error)
      );
      return this.config;
    }
  }
  async save(config = null, type = 'project') {
    const targetConfig = config || this.config;
    const targetPath = type === 'global' ? this.globalConfigPath : this.configPath;
    try {
      const dir = path.dirname(targetPath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(targetPath, JSON.stringify(targetConfig, null, 2));
      return true;
    } catch (error) {
      logger.error(
        `Failed to save ${type} configuration:`,
        error instanceof Error ? error.message : String(error)
      );
      return false;
    }
  }
  async saveGlobal(config = null) {
    return this.save(config, 'global');
  }
  async loadGlobal() {
    if (await this.exists(this.globalConfigPath)) {
      return this.loadFromFile(this.globalConfigPath);
    }
    return null;
  }
  get(pathStr, defaultValue = void 0) {
    if (!this.loaded) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    const keys = pathStr.split('.');
    let value = this.config;
    for (const key of keys) {
      if (value === null || value === void 0) {
        return defaultValue;
      }
      value = value[key];
    }
    return value !== void 0 ? value : defaultValue;
  }
  set(pathStr, value) {
    if (!this.loaded) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    const keys = pathStr.split('.');
    let current = this.config;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (current[key] === void 0 || current[key] === null) {
        current[key] = {};
      }
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;
  }
  validate() {
    const errors = [];
    const aiConfig = this.config.ai;
    if (aiConfig && typeof aiConfig.defaultProvider !== 'string') {
      errors.push('ai.defaultProvider must be a string');
    }
    if (
      aiConfig &&
      (typeof aiConfig.temperature !== 'number' ||
        aiConfig.temperature < 0 ||
        aiConfig.temperature > 1)
    ) {
      errors.push('ai.temperature must be a number between 0 and 1');
    }
    const mcpConfig = this.config.mcp;
    if (
      mcpConfig &&
      (typeof mcpConfig.port !== 'number' || mcpConfig.port < 1 || mcpConfig.port > 65535)
    ) {
      errors.push('mcp.port must be a number between 1 and 65535');
    }
    const perfConfig = this.config.performance;
    if (
      perfConfig &&
      (typeof perfConfig.maxConcurrentTasks !== 'number' || perfConfig.maxConcurrentTasks < 1)
    ) {
      errors.push('performance.maxConcurrentTasks must be a positive number');
    }
    const memConfig = this.config.memory;
    if (memConfig) {
      if (typeof memConfig.maxContextTokens !== 'number' || memConfig.maxContextTokens < 1) {
        errors.push('memory.maxContextTokens must be a positive number');
      }
      if (typeof memConfig.autoPrune !== 'boolean') {
        errors.push('memory.autoPrune must be a boolean');
      }
      if (
        typeof memConfig.pruneThreshold !== 'number' ||
        memConfig.pruneThreshold < 0 ||
        memConfig.pruneThreshold > 1
      ) {
        errors.push('memory.pruneThreshold must be a number between 0 and 1');
      }
    }
    const ctxPruningConfig = this.config.contextPruning;
    if (ctxPruningConfig) {
      if (
        typeof ctxPruningConfig.maxContextTokens !== 'number' ||
        ctxPruningConfig.maxContextTokens < 1
      ) {
        errors.push('contextPruning.maxContextTokens must be a positive number');
      }
      if (typeof ctxPruningConfig.autoPrune !== 'boolean') {
        errors.push('contextPruning.autoPrune must be a boolean');
      }
      if (
        typeof ctxPruningConfig.pruneThreshold !== 'number' ||
        ctxPruningConfig.pruneThreshold < 0 ||
        ctxPruningConfig.pruneThreshold > 1
      ) {
        errors.push('contextPruning.pruneThreshold must be a number between 0 and 1');
      }
    }
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  reset() {
    this.config = { ...DEFAULT_CONFIG };
    this.loaded = true;
  }
  getConfig() {
    if (!this.loaded) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    return { ...this.config };
  }
  update(updates) {
    if (!this.loaded) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    this.config = this.mergeDeep(this.config, updates);
  }
  async exists(filePath) {
    return existsSync(filePath);
  }
  async loadFromFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(
        `Failed to load config from ${filePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  applyEnvironmentOverrides(config) {
    const overrides = {};
    if (process.env.ULTRA_DEX_AI_PROVIDER) {
      overrides.ai = overrides.ai || {};
      overrides.ai.defaultProvider = process.env.ULTRA_DEX_AI_PROVIDER;
    }
    if (process.env.ULTRA_DEX_AI_TEMPERATURE) {
      overrides.ai = overrides.ai || {};
      overrides.ai.temperature = parseFloat(process.env.ULTRA_DEX_AI_TEMPERATURE);
    }
    if (process.env.ULTRA_DEX_CLAUDE_MODEL) {
      overrides.ai = overrides.ai || {};
      overrides.ai.defaultModel = process.env.ULTRA_DEX_CLAUDE_MODEL;
    }
    if (process.env.ULTRA_DEX_MCP_PORT) {
      overrides.mcp = overrides.mcp || {};
      overrides.mcp.port = parseInt(process.env.ULTRA_DEX_MCP_PORT);
    }
    if (process.env.ULTRA_DEX_PARALLEL_TASKS) {
      overrides.performance = overrides.performance || {};
      overrides.performance.maxConcurrentTasks = parseInt(process.env.ULTRA_DEX_PARALLEL_TASKS);
    }
    if (process.env.ULTRA_DEX_LOG_LEVEL) {
      overrides.logging = overrides.logging || {};
      overrides.logging.level = process.env.ULTRA_DEX_LOG_LEVEL;
    }
    if (process.env.ULTRA_DEX_DEBUG_MODE) {
      overrides.development = overrides.development || {};
      overrides.development.debugMode = process.env.ULTRA_DEX_DEBUG_MODE === 'true';
    }
    return this.mergeDeep(config, overrides);
  }
  mergeDeep(target, source) {
    const output = { ...target };
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
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
  isObject(item) {
    return item !== null && typeof item === 'object' && !Array.isArray(item);
  }
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
            timeout: { type: 'number', minimum: 1e3 },
          },
        },
        mcp: {
          type: 'object',
          properties: {
            port: { type: 'number', minimum: 1, maximum: 65535 },
            timeout: { type: 'number', minimum: 1e3 },
          },
        },
        performance: {
          type: 'object',
          properties: {
            maxConcurrentTasks: { type: 'number', minimum: 1 },
            cacheTimeout: { type: 'number', minimum: 1e3 },
          },
        },
      },
    };
  }
  export() {
    if (!this.loaded) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    return {
      ...this.config,
      exportedAt: /* @__PURE__ */ new Date().toISOString(),
      version: this.config.version,
    };
  }
  import(configData) {
    if (!configData || typeof configData !== 'object') {
      throw new Error('Invalid configuration data provided');
    }
    const configObj = configData;
    const validation = this.validateImport(configObj);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }
    this.config = this.mergeDeep(this.config, configObj);
    return true;
  }
  validateImport(configData) {
    const errors = [];
    if (typeof configData !== 'object') {
      errors.push('Configuration must be an object');
      return { valid: false, errors };
    }
    if (configData.ai && typeof configData.ai === 'object') {
      const aiConfig = configData.ai;
      if (
        aiConfig.defaultProvider &&
        !['claude', 'openai', 'gemini', 'ollama'].includes(aiConfig.defaultProvider)
      ) {
        errors.push('Invalid AI provider in imported config');
      }
    }
    if (configData.mcp && typeof configData.mcp === 'object') {
      const mcpConfig = configData.mcp;
      if (
        mcpConfig.port &&
        (typeof mcpConfig.port !== 'number' || mcpConfig.port < 1 || mcpConfig.port > 65535)
      ) {
        errors.push('Invalid MCP port in imported config');
      }
    }
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
const configManager = new ConfigManager();
configManager.load().catch(console.error);
var config_manager_default = configManager;
export { configManager, config_manager_default as default };
