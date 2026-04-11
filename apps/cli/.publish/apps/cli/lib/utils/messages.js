// Copyright (c) 2026 Ultra-Dex

// cli/lib/utils/messages.js

/**
 * ULTRA-DEX SYSTEM MESSAGES
 * Tone: Lead Architect / Sci-Fi / Meta-Layer / Brutal Efficiency
 */

export const professionalMessages = {
  start: [
    'INITIALIZING META-LAYER PROTOCOLS...',
    'ESTABLISHING NEURAL CONTEXT LINK...',
    'ACTIVATING 16-AGENT SWARM INTELLIGENCE...',
    'SYNCING MULTIVERSE REPOSITORIES...',
    'ALLOCATING SECTORS FOR ARCHITECTURAL DOMINANCE...',
    'ENTERING SINGULARITY ERA: v6.0.0 ONLINE...',
    'CALIBRATING OVERPOWERED LOGIC LOOPS...',
  ],

  success: [
    '✓ ALIGNMENT 100%. SYSTEM STABILIZED.',
    '✓ EXECUTION PERFECTED. READY FOR PRODUCTION.',
    '✓ META-LAYER INTEGRITY CONFIRMED.',
    '✓ ARCHITECTURE VALIDATED. NO DEVIATIONS DETECTED.',
  ],

  error: [
    '✕ CRITICAL ANOMALY DETECTED. ABORTING SEQUENCE.',
    '✕ CONTEXT DESYNCHRONIZATION. MANUAL OVERRIDE REQUIRED.',
    '✕ INFRASTRUCTURE INTEGRITY COMPROMISED.',
    '✕ ALIGNMENT FAILURE. DO NOT PROCEED.',
  ],

  loading: [
    'Compiling Neural Knowledge Graph...',
    'Orchestrating High-Dimension Vectors...',
    'Synthesizing Agent Context...',
    'Optimizing Local-First Daemons...',
    'Verifying 21-Step Security Protocols...',
  ],
};

export function getRandomMessage(type) {
  const messages = professionalMessages[type];
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Handle errors in messages module
 * @param {Error} error - The error to handle
 * @param {string} [context='messages'] - Error context
 */
function _handleModuleError(error, context = 'messages') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
