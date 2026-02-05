import { ledger } from './index.js';

export async function addDecision({ agent, action, decision, rationale, affected_files = [] }) {
  const entry = {
    timestamp: new Date().toISOString(),
    agent: agent || 'unknown',
    action: action || 'decision',
    decision,
    rationale,
    affected_files
  };

  await ledger.appendEntry(entry);
  return entry;
}
