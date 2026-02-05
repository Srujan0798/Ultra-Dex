import { readLedger } from './storage.js';

export async function searchLedger(query) {
  const entries = await readLedger();
  const q = query.toLowerCase();
  return entries.filter(entry =>
    entry.action.toLowerCase().includes(q) ||
    entry.input.toLowerCase().includes(q) ||
    entry.output.toLowerCase().includes(q) ||
    entry.rationale.toLowerCase().includes(q)
  );
}

export async function rangeLedger(from, to) {
  const entries = await readLedger();
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  return entries.filter(entry => {
    const ts = new Date(entry.timestamp);
    if (fromDate && ts < fromDate) return false;
    if (toDate && ts > toDate) return false;
    return true;
  });
}

export async function agentLedger(agent) {
  const entries = await readLedger();
  return entries.filter(entry => entry.agent === agent);
}

export async function exportLedger(format = 'json') {
  const entries = await readLedger();
  if (format === 'csv') {
    const header = ['id', 'timestamp', 'agent', 'action', 'input', 'output', 'rationale'].join(',');
    const rows = entries.map(e => [
      e.id,
      e.timestamp,
      e.agent,
      e.action,
      JSON.stringify(e.input),
      JSON.stringify(e.output),
      JSON.stringify(e.rationale)
    ].join(','));
    return [header, ...rows].join('\n');
  }
  return JSON.stringify(entries, null, 2);
}

export default {
  searchLedger,
  rangeLedger,
  agentLedger,
  exportLedger
};
