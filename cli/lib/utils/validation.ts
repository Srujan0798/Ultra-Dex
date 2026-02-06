const PROJECT_NAME_REGEX = /^[a-z0-9-]+$/i;

export type ValidationResult = true | string;

/**
 * Validates a project name
 * @param name - Project name to validate
 * @returns true if valid, error message string if invalid
 */
export function validateProjectName(name: string | null | undefined): ValidationResult {
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

/**
 * Validates a safe path (no parent directory traversal)
 * @param input - Path to validate
 * @param label - Label for error messages (default: 'Path')
 * @returns true if valid, error message string if invalid
 */
export function validateSafePath(
  input: string | null | undefined,
  label: string = 'Path'
): ValidationResult {
  if (!input || !input.trim()) {
    return `${label} is required`;
  }
  const trimmed = input.trim();
  if (trimmed.includes('..')) {
    return `${label} cannot include ".."`;
  }
  return true;
}

/**
 * Asserts that a path is valid, throwing an error if not
 * @param input - Path to validate
 * @param label - Label for error messages
 * @returns The input path if valid
 * @throws Error if path is invalid
 */
export function assertValidPath(input: string, label: string): string {
  const result = validateSafePath(input, label);
  if (result !== true) {
    throw new Error(result);
  }
  return input;
}
