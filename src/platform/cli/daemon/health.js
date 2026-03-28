// Copyright (c) 2026 Ultra-Dex

export function collectDaemonHealth() {
  const memory = process.memoryUsage();
  return {
    pid: process.pid,
    uptime: process.uptime(),
    memory,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Handle errors in health module
 * @param {Error} error - The error to handle
 * @param {string} [context='health'] - Error context
 */
function handleModuleError(error, context = 'health') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
