// Copyright (c) 2026 Ultra-Dex

import path from 'path';
import { SecurityError, ValidationError } from '../utils/errors.js';

const BLOCKED_COMMAND_PATTERNS = [
  /rm\s+-rf\s+\//i,
  /mkfs\./i,
  /shutdown/i,
  /reboot/i,
  /:\(\)\s*\{\s*:\|:\s*;\s*\}/, // fork bomb
  /\bdd\s+if=/i,
  /\bsudo\b/i,
  /\bdocker\b/i,
];

/**
 * Assert that a shell command is safe to execute
 * @param {string} command - Shell command string
 * @throws {ValidationError} If command is empty or invalid
 * @throws {SecurityError} If command matches a blocked pattern
 */
export function assertSafeCommand(command) {
  if (!command || typeof command !== 'string') {
    throw new ValidationError('Command is required.');
  }
  const trimmed = command.trim();
  if (!trimmed) {
    throw new ValidationError('Command cannot be empty.');
  }
  for (const pattern of BLOCKED_COMMAND_PATTERNS) {
    if (pattern.test(trimmed)) {
      throw new SecurityError(`Blocked potentially dangerous command: ${trimmed}`);
    }
  }
}

/**
 * Assert that a file path is safe and within the project root
 * @param {string} targetPath - Path to validate
 * @param {string} [cwd=process.cwd()] - Working directory root
 * @returns {string} Resolved absolute path
 * @throws {ValidationError} If path is invalid
 * @throws {SecurityError} If path escapes project root
 */
export function assertSafePath(targetPath, cwd = process.cwd()) {
  if (!targetPath || typeof targetPath !== 'string') {
    throw new ValidationError('Path is required.');
  }
  if (targetPath.includes('\0')) {
    throw new ValidationError('Path cannot include null bytes.');
  }
  const resolved = path.resolve(cwd, targetPath);
  if (!resolved.startsWith(path.resolve(cwd))) {
    throw new SecurityError(`Path escapes project root: ${targetPath}`);
  }
  return resolved;
}

/**
 * Handle errors in permissions module
 * @param {Error} error - The error to handle
 * @param {string} [context='permissions'] - Error context
 */
function handleModuleError(error, context = 'permissions') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
