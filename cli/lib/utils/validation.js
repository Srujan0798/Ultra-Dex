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

export function validateSafePath(input, label = 'Path') {
  if (!input || !input.trim()) {
    return `${label} is required`;
  }
  const trimmed = input.trim();
  if (trimmed.includes('..')) {
    return `${label} cannot include ".."`; 
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
