// Copyright (c) 2026 Ultra-Dex

const PROJECT_NAME_REGEX = /^[a-z0-9-]+$/i;

export function validateProjectName(name) {
  if (!name || !name.trim()) {
    return 'Project name is required';
  }
  const trimmed = name.trim();
  if (!PROJECT_NAME_REGEX.test(trimmed)) {
    return 'Project name must use only letters, numbers, and dashes';
  }
  if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) {
    return 'Project name cannot include path separators';
  }
  return true;
}

import path from 'path';

export function validateSafePath(input, label = 'Path') {
  if (!input || !input.trim()) {
    return `${label} is required`;
  }

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
}

export function assertValidPath(input, label) {
  const result = validateSafePath(input, label);
  if (result !== true) {
    throw new Error(result);
  }
  return input;
}
