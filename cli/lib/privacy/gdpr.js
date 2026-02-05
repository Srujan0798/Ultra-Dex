import fs from 'fs/promises';
import path from 'path';
import { getConsent, setConsent } from './consent.js';
import { deleteAllData, exportAllData, logPrivacyEvent } from './deletion.js';

const AUDIT_LOG = path.resolve(process.cwd(), '.ultra-dex', 'privacy', 'audit.jsonl');

export async function exportPrivacyData() {
  const dir = await exportAllData(process.cwd());
  return dir;
}

export async function deletePrivacyData() {
  await deleteAllData(process.cwd());
}

export async function updateConsent(consent, meta = {}) {
  return await setConsent(consent, meta);
}

export async function readConsent() {
  return await getConsent();
}

export async function getPrivacyAudit() {
  try {
    const raw = await fs.readFile(AUDIT_LOG, 'utf8');
    return raw
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

export async function recordAccess(reason) {
  await logPrivacyEvent({ action: 'access', reason });
}
