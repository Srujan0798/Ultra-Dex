// Copyright (c) 2026 Ultra-Dex
// Project Fortress: Quantum-Safe Vault
// Implements AES-256-GCM (Quantum Resistant Symmetric Encryption)

import crypto from 'crypto';



export class QuantumVault {
    constructor(secretKey) {
        // Ensure key is 32 bytes (256 bits)
        if (!secretKey || secretKey.length !== 32) {
            // In production, derive from a stronger master password using Argon2id
            // For now, we accept a 32-byte buffer or string
            throw new Error('QuantumVault requires a 32-byte secret key.');
        }
        this.key = secretKey;
        this.algorithm = 'aes-256-gcm';
    }

    /**
     * Encrypts data using AES-256-GCM
     * @param {string} text - The plaintext to encrypt
     * @returns {string} - Combined IV + AuthTag + Encrypted Data (Hex)
     */
    encrypt(text) {
        const _iv = crypto.randomBytes(16); // 96-bit IV is standard for GCM, often implemented as 12 bytes, but node crypto handles 16 well or 12. 
        // Node.js crypto recommends 12 bytes for GCM usually, let's stick to standard 12 bytes (96 bits) for GCM if we want to be strict, but 16 is common for CBC. 
        // Let's use 16 bytes (128 bits) for IV to be safe/standard with general AES, but for GCM specifically 12 bytes is optimal.
        // However, to be "Quantum Safe" against Grover's algorithm, we rely on the 256-bit key.

        // NIST recommends 12 bytes for GCM.
        const startIv = crypto.randomBytes(12);

        const cipher = crypto.createCipheriv(this.algorithm, this.key, startIv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        // Format: IV:AuthTag:EncryptedData
        return `${startIv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }

    /**
     * Decrypts data
     * @param {string} encryptedData - The encrypted string (IV:Tag:Data)
     * @returns {string} - The decrypted plaintext
     */
    decrypt(encryptedData) {
        const parts = encryptedData.split(':');
        if (parts.length !== 3) throw new Error('Invalid encrypted data format.');

        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const text = parts[2];

        const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(text, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    /**
     * Securely shreds a sensitive string from memory (Best Effort in JS)
     * @param {Object} obj - The object containing sensitive data
     * @param {string} prop - The property name to shred
     */
    shred(obj, prop) {
        if (obj && obj[prop]) {
            // Overwrite with zeros
            const len = obj[prop].length;
            obj[prop] = '0'.repeat(len);
            // Delete property
            delete obj[prop];
        }
    }

    /**
     * Rotates the key (Simulated)
     * In a real system, this would re-encrypt the data with a new key.
     */
    rotateKey() {
        // 1. Generate new Key
        const newKey = crypto.randomBytes(32);
        // 2. In a real DB, fetch all secrets, decrypt with old key, encrypt with new key.
        // 3. Update storage.
        console.log('Key rotation logic would execute here. New key generated.');
        return newKey;
    }
}

// Singleton instance for the CLI app (managed properly in real usage)
// For CLI usage, we might load the key from env or keychain.
export const vault = new QuantumVault(crypto.createHash('sha256').update('ultra-dex-default-key-do-not-use-in-prod').digest());

export default vault;

/**
 * Error handler for quantum-vault
 * @param {Error} error - Error to handle
 */
function _handleError(error) {
  try {
    console.error('[quantum-vault]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
