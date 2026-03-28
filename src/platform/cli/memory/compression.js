// Copyright (c) 2026 Ultra-Dex

export function summarizeMemory(entries = []) {
  const text = entries.map((e) => e.content || e.text || '').join('\n');
  if (!text) return '';
  const sentences = text
    .split(/[.\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.slice(0, 5).join('. ') + (sentences.length > 5 ? '...' : '');
}

export function compressEntries(entries = []) {
  return entries.map((entry) => ({
    id: entry.id,
    summary: summarizeMemory([entry]),
    createdAt: entry.createdAt,
  }));
}

export default {
  summarizeMemory,
  compressEntries,
};

/**
 * Handle errors in compression module
 * @param {Error} error - The error to handle
 * @param {string} [context='compression'] - Error context
 */
function handleModuleError(error, context = 'compression') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
