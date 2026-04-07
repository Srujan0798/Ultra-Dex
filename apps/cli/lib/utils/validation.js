// Copyright (c) 2026 Ultra-Dex

const PROJECT_NAME_REGEX = /^[a-z0-9-]+$/i;

/**
 * Validate project name format
 * @param {string} name - Project name
 * @returns {string|boolean} True if valid, error message string if invalid
 */
export function validateProjectName(name) {
  if (!name || !name.trim()) {
    return 'Project name is required';
  }
  try {
    const trimmed = name.trim();
    if (!PROJECT_NAME_REGEX.test(trimmed)) {
      return 'Project name must use only letters, numbers, and dashes';
    }
    if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) {
      return 'Project name cannot include path separators';
    }
    return true;
  } catch (_error) {
    return 'Invalid project name format';
  }
}

import path from 'path';

/**
 * Validate file path safety (prevent directory traversal)
 * @param {string} input - File path input
 * @param {string} [label='Path'] - Label for error messages
 * @returns {string|boolean} True if safe, error message string if unsafe
 */
export function validateSafePath(input, label = 'Path') {
  if (!input || !input.trim()) {
    return `${label} is required`;
  }

  try {
    const trimmed = input.trim();

    // 1. Null byte check (prevents common C-style string termination attacks)
    if (trimmed.includes('\0')) {
      return `${label} cannot include null bytes`;
    }

    // 2. Basic metacharacter check
    if (trimmed.includes('..')) {
      return `${label} cannot include ".."`;
    }

    // 3. Normalize and check for directory traversal in relative paths
    const normalized = path.normalize(trimmed);
    if (!path.isAbsolute(normalized) && normalized.startsWith('..')) {
      return `${label} attempted to escape directory context`;
    }

    return true;
  } catch (_error) {
    return `${label} is invalid`;
  }
}

/**
 * Validate email format
 */
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

/**
 * Assert that a path is valid and safe
 * @param {string} input - File path input
 * @param {string} label - Label for error messages
 * @returns {string} The validated input path
 * @throws {Error} If path is invalid
 */
export function assertValidPath(input, label) {
  const result = validateSafePath(input, label);
  if (result !== true) {
    throw new Error(result);
  }
  return input;
}
