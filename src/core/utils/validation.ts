const PROJECT_NAME_REGEX = /^[a-z0-9-]+$/i;
function validateProjectName(name) {
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
function validateSafePath(input, label = 'Path') {
  if (!input || !input.trim()) {
    return `${label} is required`;
  }
  try {
    const trimmed = input.trim();
    if (trimmed.includes('\0')) {
      return `${label} cannot include null bytes`;
    }
    if (trimmed.includes('..')) {
      return `${label} cannot include ".."`;
    }
    const normalized = path.normalize(trimmed);
    if (!path.isAbsolute(normalized) && normalized.startsWith('..')) {
      return `${label} attempted to escape directory context`;
    }
    return true;
  } catch (_error) {
    return `${label} is invalid`;
  }
}
function assertValidPath(input, label) {
  const result = validateSafePath(input, label);
  if (result !== true) {
    throw new Error(result);
  }
  return input;
}
export { assertValidPath, validateProjectName, validateSafePath };
