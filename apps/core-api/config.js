import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Default configuration
const defaultConfig = {
  server: {
    port: parseInt(process.env.PORT) || 4000,
    host: process.env.HOST || '0.0.0.0',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  },
  database: {
    url: process.env.DATABASE_URL || 'sqlite:./ultra-dex.db',
    migrate: process.env.DB_MIGRATE !== 'false'
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    enabled: process.env.REDIS_ENABLED === 'true'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    file: process.env.LOG_FILE || null
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'ultra-dex-default-secret-change-in-production',
    jwtExpiry: process.env.JWT_EXPIRY || '24h',
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    }
  },
  ai: {
    providers: {
      openai: {
        enabled: process.env.OPENAI_ENABLED === 'true',
        apiKey: process.env.OPENAI_API_KEY || null,
        defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o'
      },
      anthropic: {
        enabled: process.env.ANTHROPIC_ENABLED === 'true',
        apiKey: process.env.ANTHROPIC_API_KEY || null,
        defaultModel: process.env.ANTHROPIC_DEFAULT_MODEL || 'claude-3-5-sonnet-latest'
      },
      google: {
        enabled: process.env.GOOGLE_ENABLED === 'true',
        apiKey: process.env.GOOGLE_API_KEY || null,
        defaultModel: process.env.GOOGLE_DEFAULT_MODEL || 'gemini-2.0-flash-exp'
      },
      ollama: {
        enabled: process.env.OLLAMA_ENABLED === 'true',
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        defaultModel: process.env.OLLAMA_DEFAULT_MODEL || 'llama3.2'
      }
    }
  },
  memory: {
    hotRetention: parseInt(process.env.HOT_RETENTION) || 3600, // 1 hour
    warmRetention: parseInt(process.env.WARM_RETENTION) || 86400, // 24 hours
    coldRetention: parseInt(process.env.COLD_RETENTION) || 2592000, // 30 days
    maxEntries: parseInt(process.env.MAX_MEMORY_ENTRIES) || 10000
  },
  agents: {
    defaultConcurrency: parseInt(process.env.DEFAULT_CONCURRENCY) || 4,
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    timeout: parseInt(process.env.AGENT_TIMEOUT) || 30000
  },
  mcp: {
    enabled: process.env.MCP_ENABLED === 'true',
    port: parseInt(process.env.MCP_PORT) || 4001,
    host: process.env.MCP_HOST || 'localhost'
  },
  git: {
    enabled: process.env.GIT_INTEGRATION === 'true',
    autoCommit: process.env.GIT_AUTO_COMMIT === 'true',
    branchPrefix: process.env.GIT_BRANCH_PREFIX || 'ultra-dex/'
  },
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    port: parseInt(process.env.MONITORING_PORT) || 4001,
    metrics: {
      collectSystemMetrics: true,
      collectAgentMetrics: true,
      collectMemoryMetrics: true
    }
  }
};

// Validate required configuration
const requiredConfigs = [
  'security.jwtSecret'
];

const missingConfigs = [];
for (const configPath of requiredConfigs) {
  const value = getNestedProperty(defaultConfig, configPath);
  if (!value) {
    missingConfigs.push(configPath);
  }
}

if (missingConfigs.length > 0) {
  console.warn('⚠️  Warning: Missing required configuration values:', missingConfigs);
  console.warn('   Please set these environment variables or update the default configuration.');
}

function getNestedProperty(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Export configuration
export const config = defaultConfig;

// Export individual configuration sections
export const serverConfig = defaultConfig.server;
export const databaseConfig = defaultConfig.database;
export const redisConfig = defaultConfig.redis;
export const loggingConfig = defaultConfig.logging;
export const securityConfig = defaultConfig.security;
export const aiConfig = defaultConfig.ai;
export const memoryConfig = defaultConfig.memory;
export const agentsConfig = defaultConfig.agents;
export const mcpConfig = defaultConfig.mcp;
export const gitConfig = defaultConfig.git;
export const monitoringConfig = defaultConfig.monitoring;

// Export configuration utilities
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

// Export configuration validator
export function validateConfig() {
  const errors = [];
  
  // Validate port
  if (config.server.port < 1 || config.server.port > 65535) {
    errors.push('Server port must be between 1 and 65535');
  }
  
  // Validate AI providers
  const enabledProviders = Object.entries(config.ai.providers)
    .filter(([_, provider]) => provider.enabled)
    .map(([name]) => name);
  
  if (enabledProviders.length === 0) {
    errors.push('At least one AI provider must be enabled');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Export configuration getter
export function getConfig(section = null) {
  if (section) {
    return defaultConfig[section];
  }
  return defaultConfig;
}

// Export configuration updater (for testing purposes)
export function updateConfig(newConfig) {
  Object.assign(defaultConfig, newConfig);
}