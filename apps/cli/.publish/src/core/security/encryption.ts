import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
class DataEncryption {
  constructor(options = {}) {
    this.options = {
      keyDerivation: options.keyDerivation || 'pbkdf2',
      // pbkdf2, scrypt, argon2
      iterations: options.iterations || 1e5,
      // For PBKDF2
      keyEncoding: options.keyEncoding || 'hex',
      ...options,
    };
    this.masterKey = options.masterKey || this.generateMasterKey();
  }
  /**
   * Generate a cryptographically secure master key
   * @returns {Buffer} Master encryption key
   */
  generateMasterKey() {
    return crypto.randomBytes(KEY_LENGTH);
  }
  /**
   * Derive encryption key from password using PBKDF2
   * @param {string} password - Password to derive key from
   * @param {Buffer} salt - Salt for key derivation
   * @returns {Promise<Buffer>} Derived key
   */
  async deriveKeyPBKDF2(password, salt) {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, this.options.iterations, KEY_LENGTH, 'sha256', (err, key) => {
        if (err) reject(err);
        else resolve(key);
      });
    });
  }
  /**
   * Derive encryption key using scrypt
   * @param {string} password - Password to derive key from
   * @param {Buffer} salt - Salt for key derivation
   * @returns {Promise<Buffer>} Derived key
   */
  async deriveKeyScrypt(password, salt) {
    return crypto.scrypt(password, salt, KEY_LENGTH);
  }
  /**
   * Encrypt data with authenticated encryption
   * @param {string|Buffer} data - Data to encrypt
   * @param {Buffer} key - Encryption key (optional, uses master key if not provided)
   * @returns {object} Encrypted data with IV and auth tag
   */
  async encrypt(data, key = null) {
    const useKey = key || this.masterKey;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, useKey, iv);
    cipher.setAAD(Buffer.from('ultra-dex-audited-data'));
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return {
      data: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: ALGORITHM,
    };
  }
  /**
   * Decrypt data
   * @param {object} encryptedData - Encrypted data object with IV and auth tag
   * @param {Buffer} key - Decryption key (optional)
   * @returns {string} Decrypted data
   */
  async decrypt(encryptedData, key = null) {
    const useKey = key || this.masterKey;
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      useKey,
      Buffer.from(encryptedData.iv, 'hex')
    );
    decipher.setAAD(Buffer.from('ultra-dex-audited-data'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
  /**
   * Encrypt a file
   * @param {string} inputFile - Path to input file
   * @param {string} outputFile - Path to output encrypted file
   * @param {Buffer} key - Encryption key (optional)
   */
  async encryptFile(inputFile, outputFile, key = null) {
    const useKey = key || this.masterKey;
    const data = await fs.readFile(inputFile);
    const encrypted = await this.encrypt(data, useKey);
    const encryptedFile = {
      version: '1.0',
      algorithm: encrypted.algorithm,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      data: encrypted.data,
      metadata: {
        originalFile: path.basename(inputFile),
        encryptedAt: /* @__PURE__ */ new Date().toISOString(),
        size: data.length,
      },
    };
    await fs.writeFile(outputFile, JSON.stringify(encryptedFile, null, 2));
  }
  /**
   * Decrypt a file
   * @param {string} inputFile - Path to encrypted file
   * @param {string} outputFile - Path to output decrypted file
   * @param {Buffer} key - Decryption key (optional)
   */
  async decryptFile(inputFile, outputFile, key = null) {
    const useKey = key || this.masterKey;
    const encryptedContent = await fs.readFile(inputFile, 'utf8');
    const encryptedData = JSON.parse(encryptedContent);
    const decrypted = await this.decrypt(encryptedData, useKey);
    await fs.writeFile(outputFile, decrypted);
  }
  /**
   * Encrypt configuration object
   * @param {object} config - Configuration object to encrypt
   * @returns {object} Encrypted configuration
   */
  async encryptConfig(config) {
    const serialized = JSON.stringify(config);
    return await this.encrypt(serialized);
  }
  /**
   * Decrypt configuration object
   * @param {object} encryptedConfig - Encrypted configuration
   * @returns {object} Decrypted configuration
   */
  async decryptConfig(encryptedConfig) {
    const decrypted = await this.decrypt(encryptedConfig);
    return JSON.parse(decrypted);
  }
  /**
   * Generate a secure hash for data integrity verification
   * @param {string|Buffer} data - Data to hash
   * @param {string} algorithm - Hash algorithm (default: sha256)
   * @returns {string} Hash digest
   */
  hash(data, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }
  /**
   * Generate HMAC for message authentication
   * @param {string|Buffer} data - Data to authenticate
   * @param {Buffer} key - HMAC key
   * @param {string} algorithm - HMAC algorithm (default: sha256)
   * @returns {string} HMAC digest
   */
  hmac(data, key = null, algorithm = 'sha256') {
    const useKey = key || this.masterKey;
    return crypto.createHmac(algorithm, useKey).update(data).digest('hex');
  }
  /**
   * Verify HMAC authenticity
   * @param {string|Buffer} data - Data to verify
   * @param {string} expectedHmac - Expected HMAC
   * @param {Buffer} key - HMAC key
   * @param {string} algorithm - HMAC algorithm (default: sha256)
   * @returns {boolean} True if HMAC matches
   */
  verifyHmac(data, expectedHmac, key = null, algorithm = 'sha256') {
    const actualHmac = this.hmac(data, key, algorithm);
    return crypto.timingSafeEqual(Buffer.from(actualHmac, 'hex'), Buffer.from(expectedHmac, 'hex'));
  }
  /**
   * Generate key pair for asymmetric encryption
   * @param {object} options - Key generation options
   * @returns {object} Public/private key pair
   */
  generateKeyPair(options = {}) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: options.modulusLength || 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: options.cipher || void 0,
        passphrase: options.passphrase || void 0,
      },
    });
    return { publicKey, privateKey };
  }
  /**
   * Sign data with private key
   * @param {string|Buffer} data - Data to sign
   * @param {string|Buffer} privateKey - Private key
   * @param {string} algorithm - Signing algorithm (default: SHA256)
   * @returns {string} Signature
   */
  sign(data, privateKey, algorithm = 'SHA256') {
    const signer = crypto.createSign(algorithm);
    signer.update(data);
    return signer.sign(privateKey, 'hex');
  }
  /**
   * Verify signature with public key
   * @param {string|Buffer} data - Data that was signed
   * @param {string} signature - Signature to verify
   * @param {string|Buffer} publicKey - Public key
   * @param {string} algorithm - Signing algorithm (default: SHA256)
   * @returns {boolean} True if signature is valid
   */
  verifySignature(data, signature, publicKey, algorithm = 'SHA256') {
    const verifier = crypto.createVerify(algorithm);
    verifier.update(data);
    return verifier.verify(publicKey, signature, 'hex');
  }
  /**
   * Get encryption system health
   * @returns {object} Health information
   */
  getHealth() {
    return {
      status: 'healthy',
      algorithm: ALGORITHM,
      keyLength: KEY_LENGTH * 8,
      ivLength: IV_LENGTH,
      timestamp: /* @__PURE__ */ new Date().toISOString(),
    };
  }
}
const encryptionManager = new DataEncryption();
var encryption_default = DataEncryption;
export { encryption_default as default, encryptionManager };
