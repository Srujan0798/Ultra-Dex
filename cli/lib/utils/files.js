// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';

/**
 * Safely read a file and return its content with a label
 * @param {string} filePath - Path to the file
 * @param {string} [label=''] - Optional label for the content
 * @returns {Promise<{label: string, content: string}>} File content object
 */
export async function readFileSafe(filePath, label = '') {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { label, content };
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`[File] Error reading ${filePath}: ${err.message}`);
    }
    return { label, content: '' };
  }
}

/**
 * Check if a path exists and matches the expected type
 * @param {string} targetPath - Path to check
 * @param {'file'|'dir'} [type='file'] - Expected type
 * @returns {Promise<boolean>} True if path exists and matches type
 */
export async function pathExists(targetPath, type = 'file') {
  try {
    const stats = await fs.stat(targetPath);
    if (type === 'file') return stats.isFile();
    if (type === 'dir') return stats.isDirectory();
    return false;
  } catch {
    return false;
  }
}

/**
 * Resolve an asset path relative to a base path
 * @param {string} basePath - Base directory path
 * @param {string} relativePath - Relative asset path
 * @returns {string} Resolved absolute path
 */
export function resolveAssetPath(basePath, relativePath) {
  try {
    return path.join(basePath, relativePath);
  } catch (err) {
    console.error(`[File] Error resolving path: ${err.message}`);
    return '';
  }
}

/**
 * Recursively copy a directory
 * @param {string} sourceDir - Source directory path
 * @param {string} targetDir - Target directory path
 * @returns {Promise<void>}
 */
export async function copyDirectory(sourceDir, targetDir) {
  try {
    await fs.mkdir(targetDir, { recursive: true });
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });
    for (const entry of entries) {
      const sourcePath = path.join(sourceDir, entry.name);
      const targetPath = path.join(targetDir, entry.name);
      if (entry.isDirectory()) {
        await copyDirectory(sourcePath, targetPath);
      } else if (entry.isFile()) {
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  } catch (err) {
    console.error(`[File] Error copying directory ${sourceDir} to ${targetDir}: ${err.message}`);
    throw err;
  }
}
