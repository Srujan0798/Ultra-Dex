/**
 * Config Utility
 * Manages system-wide configuration and environment variables
 */

import { config as dotenvConfig } from 'dotenv';

export class ConfigService {
  constructor() {
    this.loadEnv();
  }

  /**
   * Loads environment variables from .env file
   */
  loadEnv(): void {
    dotenvConfig();
  }

  /**
   * Retrieves a configuration value by key with optional default
   */
  get<T>(key: string, defaultValue?: T): T {
    const value = process.env[key];

    if (value === undefined) {
      if (defaultValue !== undefined) return defaultValue;
      throw new Error(`Configuration key ${key} is missing and no default provided`);
    }

    // Attempt type coercion
    if (typeof defaultValue === 'number') return Number(value) as unknown as T;
    if (typeof defaultValue === 'boolean')
      return (value === 'true' || value === '1') as unknown as T;

    return value as unknown as T;
  }

  /**
   * Alias for get()
   */
  getConfig<T>(key: string, defaultValue?: T): T {
    return this.get(key, defaultValue);
  }

  /**
   * Runtime setting of config values (process.env)
   */
  set(key: string, value: string): void {
    process.env[key] = value;
  }

  /**
   * Retrieves the current environment (production/development/test)
   */
  getEnvironment(): string {
    return process.env.NODE_ENV || 'development';
  }

  /**
   * Checks if the current environment is production
   */
  isProduction(): boolean {
    return this.getEnvironment() === 'production';
  }
}

export const config = new ConfigService();
export const getConfig = (key: string, defaultValue?: any) => config.getConfig(key, defaultValue);
