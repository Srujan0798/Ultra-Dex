// Copyright (c) 2026 Ultra-Dex
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

/**
 * Quantum Vault (v6.0.0)
 * Encrypted, Tiered Credential Management.
 */
export class QuantumVault {
  constructor(masterKey) {
    this.masterKey = masterKey || process.env.ULTRA_VAULT_KEY;
    this.vaultPath = path.join(process.cwd(), '.ultra-dex', 'vault.enc');
  }

  async encrypt(data) {
    if (!this.masterKey) throw new Error('Master Key missing');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.masterKey, 'hex'), iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { iv: iv.toString('hex'), content: encrypted };
  }

  async storeSecret(key, value) {
    const encrypted = await this.encrypt({ [key]: value });
    await fs.writeFile(this.vaultPath, JSON.stringify(encrypted));
    console.log(`✅ Secret secured in vault: ${key}`);
  }
}

export const vault = new QuantumVault();

