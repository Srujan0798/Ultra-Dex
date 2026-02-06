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
