// Copyright (c) 2026 Ultra-Dex

import gradient from 'gradient-string';

export const gradientPresets = {
  doomsday: gradient(['#dc2626', '#7c3aed', '#f59e0b']),
  cyberpunk: gradient(['#00f5ff', '#ff2e63', '#08f7fe']),
  corporate: gradient(['#1f2937', '#3b82f6', '#94a3b8']),
};

export function renderGradient(text, preset = 'corporate') {
  const renderer = gradientPresets[preset] || gradientPresets.corporate;
  return renderer(text);
}

export default {
  gradientPresets,
  renderGradient,
};

/**
 * Handle errors in gradients module
 * @param {Error} error - The error to handle
 * @param {string} [context='gradients'] - Error context
 */
function handleModuleError(error, context = 'gradients') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
