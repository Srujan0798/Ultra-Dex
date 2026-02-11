// Copyright (c) 2026 Ultra-Dex

export const AUTONOMOUS_GATES = [
  { id: 'architecture', description: 'Architecture approval required' },
  { id: 'security', description: 'Security review required' },
  { id: 'deploy', description: 'Deploy confirmation required' },
];

export function requireGateApproval(gateId, approvals = []) {
  return approvals.includes(gateId);
}

/**
 * Handle errors in gates module
 * @param {Error} error - The error to handle
 * @param {string} [context='gates'] - Error context
 */
function handleModuleError(error, context = 'gates') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
