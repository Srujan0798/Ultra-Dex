import { logger } from './logging.js';
const professionalMessages = {
  start: [
    'INITIALIZING META-LAYER PROTOCOLS...',
    'ESTABLISHING NEURAL CONTEXT LINK...',
    'ACTIVATING 16-AGENT SWARM INTELLIGENCE...',
    'SYNCING MULTIVERSE REPOSITORIES...',
    'ALLOCATING SECTORS FOR ARCHITECTURAL DOMINANCE...',
    'LOADING PROVIDER ROUTING TABLE...',
    'CALIBRATING SMART ROUTER STRATEGIES...',
  ],
  success: [
    '\u2713 ALIGNMENT 100%. SYSTEM STABILIZED.',
    '\u2713 EXECUTION PERFECTED. READY FOR PRODUCTION.',
    '\u2713 META-LAYER INTEGRITY CONFIRMED.',
    '\u2713 ARCHITECTURE VALIDATED. NO DEVIATIONS DETECTED.',
  ],
  error: [
    '\u2715 CRITICAL ANOMALY DETECTED. ABORTING SEQUENCE.',
    '\u2715 CONTEXT DESYNCHRONIZATION. MANUAL OVERRIDE REQUIRED.',
    '\u2715 INFRASTRUCTURE INTEGRITY COMPROMISED.',
    '\u2715 ALIGNMENT FAILURE. DO NOT PROCEED.',
  ],
  loading: [
    'Compiling Neural Knowledge Graph...',
    'Orchestrating High-Dimension Vectors...',
    'Synthesizing Agent Context...',
    'Optimizing Local-First Daemons...',
    'Verifying 21-Step Security Protocols...',
  ],
};
function getRandomMessage(type) {
  const messages = professionalMessages[type];
  return messages[Math.floor(Math.random() * messages.length)];
}
function _handleModuleError(error, context = 'messages') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {}
}
export { getRandomMessage, professionalMessages };
