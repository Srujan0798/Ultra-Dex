// Copyright (c) 2026 Ultra-Dex

export function streamText(text, options = {}) {
  const delay = options.delay ?? 6;
  return new Promise((resolve) => {
    let index = 0;
    const interval = setInterval(() => {
      process.stdout.write(text[index] || '');
      index += 1;
      if (index >= text.length) {
        clearInterval(interval);
        process.stdout.write('\n');
        resolve();
      }
    }, delay);
  });
}

/**
 * Handle errors in realtime module
 * @param {Error} error - The error to handle
 * @param {string} [context='realtime'] - Error context
 */
function handleModuleError(error, context = 'realtime') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
