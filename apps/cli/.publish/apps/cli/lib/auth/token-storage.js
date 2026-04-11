// Copyright (c) 2026 Ultra-Dex

/**
 * Secure Token Storage
 * Uses keytar for secure credential storage
 */

import chalk from 'chalk';

const SERVICE_NAME = 'ultra-dex';

/**
 * Secure token storage manager
 */
export class SecureTokenStorage {
  constructor() {
    this.keytar = null;
    this.available = false;
  }

  /**
   * Initialize keytar
   */
  async initialize() {
    try {
      this.keytar = await import('keytar');
      this.available = true;
      console.log(chalk.green('[TokenStorage] Secure storage initialized'));
      return true;
    } catch (error) {
      console.log(chalk.yellow('[TokenStorage] keytar not available:', error.message));
      console.log(chalk.gray('   Falling back to file-based storage (less secure)'));
      this.available = false;
      return false;
    }
  }

  /**
   * Store a token securely
   */
  async setToken(account, token) {
    if (this.available && this.keytar) {
      try {
        await this.keytar.default.setPassword(SERVICE_NAME, account, token);
        return { success: true };
      } catch (error) {
        console.error(chalk.red('[TokenStorage] Failed to store token:', error.message));
        return { success: false, error: error.message };
      }
    } else {
      // Fallback to file storage
      return this.fallbackSetToken(account, token);
    }
  }

  /**
   * Retrieve a token
   */
  async getToken(account) {
    if (this.available && this.keytar) {
      try {
        const token = await this.keytar.default.getPassword(SERVICE_NAME, account);
        return { success: true, token };
      } catch (error) {
        console.error(chalk.red('[TokenStorage] Failed to get token:', error.message));
        return { success: false, error: error.message };
      }
    } else {
      return this.fallbackGetToken(account);
    }
  }

  /**
   * Delete a token
   */
  async deleteToken(account) {
    if (this.available && this.keytar) {
      try {
        const result = await this.keytar.default.deletePassword(SERVICE_NAME, account);
        return { success: result };
      } catch (error) {
        console.error(chalk.red('[TokenStorage] Failed to delete token:', error.message));
        return { success: false, error: error.message };
      }
    } else {
      return this.fallbackDeleteToken(account);
    }
  }

  /**
   * List all stored accounts
   */
  async listAccounts() {
    if (this.available && this.keytar) {
      try {
        const accounts = await this.keytar.default.findCredentials(SERVICE_NAME);
        return {
          success: true,
          accounts: accounts.map((a) => ({ account: a.account })), // Don't return passwords
        };
      } catch (error) {
        console.error(chalk.red('[TokenStorage] Failed to list accounts:', error.message));
        return { success: false, error: error.message };
      }
    } else {
      return this.fallbackListAccounts();
    }
  }

  /**
   * Fallback file-based storage (less secure)
   */
  async fallbackSetToken(account, token) {
    const fs = await import('fs/promises');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const storageDir = path.join(process.cwd(), '.ultra-dex', 'tokens');
    const storageFile = path.join(storageDir, `${account}.token`);

    try {
      await fs.mkdir(storageDir, { recursive: true });
      await fs.writeFile(storageFile, token, { mode: 0o600 }); // Owner read/write only
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async fallbackGetToken(account) {
    const fs = await import('fs/promises');
    const path = await import('path');
    const storageFile = path.join(process.cwd(), '.ultra-dex', 'tokens', `${account}.token`);

    try {
      const token = await fs.readFile(storageFile, 'utf8');
      return { success: true, token };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { success: true, token: null };
      }
      return { success: false, error: error.message };
    }
  }

  async fallbackDeleteToken(account) {
    const fs = await import('fs/promises');
    const path = await import('path');
    const storageFile = path.join(process.cwd(), '.ultra-dex', 'tokens', `${account}.token`);

    try {
      await fs.unlink(storageFile);
      return { success: true };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { success: true };
      }
      return { success: false, error: error.message };
    }
  }

  async fallbackListAccounts() {
    const fs = await import('fs/promises');
    const path = await import('path');
    const storageDir = path.join(process.cwd(), '.ultra-dex', 'tokens');

    try {
      const files = await fs.readdir(storageDir);
      const accounts = files
        .filter((f) => f.endsWith('.token'))
        .map((f) => ({ account: f.replace('.token', '') }));
      return { success: true, accounts };
    } catch (_error) {
      return { success: true, accounts: [] };
    }
  }
}

/**
 * Store authentication tokens securely
 */
export async function storeAuthToken(provider, tokens) {
  const storage = new SecureTokenStorage();
  await storage.initialize();

  const account = `auth_${provider}`;
  const tokenString = JSON.stringify(tokens);

  return await storage.setToken(account, tokenString);
}

/**
 * Get stored authentication tokens
 */
export async function getAuthToken(provider) {
  const storage = new SecureTokenStorage();
  await storage.initialize();

  const account = `auth_${provider}`;
  const result = await storage.getToken(account);

  if (result.success && result.token) {
    try {
      return { ...result, tokens: JSON.parse(result.token) };
    } catch {
      return result;
    }
  }

  return result;
}

/**
 * Delete stored authentication tokens
 */
export async function deleteAuthToken(provider) {
  const storage = new SecureTokenStorage();
  await storage.initialize();

  const account = `auth_${provider}`;
  return await storage.deleteToken(account);
}

/**
 * Store API key securely
 */
export async function storeAPIKey(keyId, key) {
  const storage = new SecureTokenStorage();
  await storage.initialize();

  const account = `apikey_${keyId}`;
  return await storage.setToken(account, key);
}

/**
 * Get stored API key
 */
export async function getAPIKey(keyId) {
  const storage = new SecureTokenStorage();
  await storage.initialize();

  const account = `apikey_${keyId}`;
  return await storage.getToken(account);
}

// Export singleton
export const secureTokenStorage = new SecureTokenStorage();
