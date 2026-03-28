// Copyright (c) 2026 Ultra-Dex

// Traceability engine wrapper
import * as Trace from '../ai/trace.js';

export const traceabilityLogger = Trace.traceabilityLogger;
export const logReasoning = Trace.logReasoning;
export const logCodeChange = Trace.logCodeChange;
export const logDecision = Trace.logDecision;
export const logConstraintCheck = Trace.logConstraintCheck;
export const getLogs = Trace.getLogs;
export const searchLogs = Trace.searchLogs;
export const generateReport = Trace.generateReport;
export const registerTraceCommand = Trace.registerTraceCommand;

export default Trace;

/**
 * Error handler for engine
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    logger.error('[engine]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
