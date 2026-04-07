/**
 * Safe File System Utilities
 * Provides atomic write operations and safe file handling
 * @module utils/safe-fs
 */

import { writeFile, readFile, rename, unlink, stat, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { randomBytes } from 'crypto';

/**
 * Atomically write data to a file
 * Writes to temp file first, then renames to prevent corruption
 * @param {string} filePath - Target file path
 * @param {string|Buffer} data - Data to write
 * @param {object} options - Write options
 * @returns {Promise<void>}
 */
export async function atomicWrite(filePath, data, options = {}) {
  const dir = dirname(filePath);
  const tempId = randomBytes(8).toString('hex');
  const tempPath = join(dir, `.tmp-${tempId}-${Date.now()}`);

  // Ensure directory exists
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  try {
    // Write to temp file
    await writeFile(tempPath, data, options);
    
    // Atomic rename
    await rename(tempPath, filePath);
  } catch (error) {
    // Cleanup temp file on error
    try {
      await unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Safely read a file with error handling
 * @param {string} filePath - File to read
 * @param {object} options - Read options
 * @returns {Promise<string|Buffer|null>} File contents or null if not found
 */
export async function safeRead(filePath, options = { encoding: 'utf8' }) {
  try {
    return await readFile(filePath, options);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Check if a file exists and is accessible
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>}
 */
export async function safeExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely delete a file (no error if doesn't exist)
 * @param {string} filePath - File to delete
 * @returns {Promise<boolean>} True if deleted, false if didn't exist
 */
export async function safeDelete(filePath) {
  try {
    await unlink(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

/**
 * Write JSON data atomically with pretty formatting
 * @param {string} filePath - Target file path
 * @param {object} data - JSON-serializable data
 * @param {number} indent - Indentation spaces (default: 2)
 * @returns {Promise<void>}
 */
export async function atomicWriteJSON(filePath, data, indent = 2) {
  const json = JSON.stringify(data, null, indent) + '\n';
  await atomicWrite(filePath, json, { encoding: 'utf8' });
}

/**
 * Safely read and parse JSON file
 * @param {string} filePath - JSON file to read
 * @param {object} defaultValue - Default value if file doesn't exist
 * @returns {Promise<object>} Parsed JSON or default value
 */
export async function safeReadJSON(filePath, defaultValue = null) {
  const content = await safeRead(filePath);
  if (content === null) {
    return defaultValue;
  }
  try {
    return JSON.parse(content);
  } catch {
    return defaultValue;
  }
}

export default {
  atomicWrite,
  atomicWriteJSON,
  safeRead,
  safeReadJSON,
  safeExists,
  safeDelete
};
