// Copyright (c) 2026 Ultra-Dex

/**
 * Redaction utility to prevent sensitive data leakage in logs and errors.
 */

// Patterns for known API key formats
const KEY_PATTERNS = [
  // OpenAI (sk-...) - usually 48+ chars, but sk-proj is variable
  /\b(sk-[a-zA-Z0-9_-]{20,})\b/g,
  // Anthropic (sk-ant-...)
  /\b(sk-ant-[a-zA-Z0-9_-]{20,})\b/g,
  // GitHub (ghp_, gho_, etc.)
  /\b(gh[pousr]-[a-zA-Z0-9]{36})\b/g,
  // Slack (xoxb-...)
  /\b(xox[baprs]-[a-zA-Z0-9_-]{10,})\b/g,
  // Google (AIza...)
  /\b(AIza[0-9A-Za-z_-]{35})\b/g,
  // Generic Bearer token (Bearer ...)
  /Bearer\s+([a-zA-Z0-9_.~+/ -]{20,})/gi,
];

// Sensitive property names (case-insensitive partial match)
const SENSITIVE_KEYS = [
  'api_key',
  'apikey',
  'auth_token',
  'access_token',
  'secret',
  'password',
  'passwd',
  'authorization',
  'private_key',
  'client_secret',
];

/**
 * Redact sensitive information from a string or object.
 * @param {any} input - The input to redact.
 * @param {WeakSet} visited - Internal set to track visited objects (circular ref protection).
 * @returns {any} The redacted input.
 */
export function redact(input, visited = new WeakSet()) {
  if (!input) return input;

  // Handle strings
  if (typeof input === 'string') {
    let redacted = input;
    for (const pattern of KEY_PATTERNS) {
      redacted = redacted.replace(pattern, (match, group1) => {
        // If the pattern has a capturing group (like Bearer), redact that group
        const target = group1 || match;
        if (target.length < 8) return match; // Too short to safely redact
        const prefix = target.slice(0, 3);
        const suffix = target.slice(-4);
        const masked = `${prefix}...${suffix}[REDACTED]`;
        return match.replace(target, masked);
      });
    }
    return redacted;
  }

  // Handle arrays
  if (Array.isArray(input)) {
    if (visited.has(input)) return '[Circular]';
    visited.add(input);
    const result = input.map((item) => redact(item, visited));
    visited.delete(input); // Allow re-visiting in different branches? No, structured clone behavior usually doesn't need to delete, but for recursion depth it might be okay.
    // Actually, for circular ref detection, we just need to know if we are currently visiting it.
    // But since we are creating a NEW object structure (deep copy with redaction), we don't need to worry about modifying the original.
    // However, if the input has a cycle, we need to break it in the output.
    return result;
  }

  // Handle errors
  if (input instanceof Error) {
    if (visited.has(input)) return '[Circular Error]';
    visited.add(input);

    const redactedError = new Error(redact(input.message, visited));
    redactedError.stack = redact(input.stack, visited);
    // Copy other properties
    for (const key of Object.getOwnPropertyNames(input)) {
      if (key !== 'message' && key !== 'stack') {
        redactedError[key] = redact(input[key], visited);
      }
    }

    visited.delete(input);
    return redactedError;
  }

  // Handle objects (plain objects only to avoid breaking classes/buffers)
  if (typeof input === 'object' && input !== null) {
    // Only process plain objects or arrays (already handled)
    // We check constructor to avoid messing with special types like Buffer, Date, etc.
    if (input.constructor !== Object) {
      return input;
    }

    if (visited.has(input)) return '[Circular]';
    visited.add(input);

    const redactedObj = {};
    for (const [key, value] of Object.entries(input)) {
      // Check if key is sensitive
      const isSensitive = SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k));

      if (isSensitive) {
        if (typeof value === 'string' && value.length > 5) {
          redactedObj[key] = `${value.slice(0, 3)}...${value.slice(-3)}[REDACTED]`;
        } else if (value === null || value === undefined) {
          redactedObj[key] = value;
        } else {
          redactedObj[key] = '[REDACTED]';
        }
      } else {
        redactedObj[key] = redact(value, visited);
      }
    }

    visited.delete(input);
    return redactedObj;
  }

  return input;
}

export default redact;
