// Copyright (c) 2026 Ultra-Dex

import { appendEntry, readLedger, verifyLedger, ledgerPath } from './storage.js';
import { searchLedger, rangeLedger, agentLedger, exportLedger } from './query.js';

export const ledger = {
  appendEntry,
  readLedger,
  verifyLedger,
  searchLedger,
  rangeLedger,
  agentLedger,
  exportLedger,
  path: ledgerPath,
};

export default ledger;

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[index]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
