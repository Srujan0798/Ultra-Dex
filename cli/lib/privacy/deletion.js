import fs from 'fs/promises';
import path from 'path';

const PRIVACY_DIR = path.resolve(process.cwd(), '.ultra-dex', 'privacy');
const AUDIT_LOG = path.join(PRIVACY_DIR, 'audit.jsonl');

async function ensureDir() {
  await fs.mkdir(PRIVACY_DIR, { recursive: true });
}

export async function logPrivacyEvent(event) {
  await ensureDir();
  const payload = {
    ...event,
    timestamp: new Date().toISOString()
  };
  await fs.appendFile(AUDIT_LOG, JSON.stringify(payload) + '\n', 'utf8');
}

export async function deleteAllData(root = process.cwd()) {
  const targets = [
    path.join(root, '.ultra-dex'),
    path.join(root, '.ultra')
  ];
  for (const target of targets) {
    await fs.rm(target, { recursive: true, force: true }).catch(() => {});
  }
  await logPrivacyEvent({ action: 'delete', targets });
}

export async function exportAllData(root = process.cwd()) {
  const exportDir = path.join(root, '.ultra-dex', 'privacy', 'export');
  await fs.mkdir(exportDir, { recursive: true });
  await logPrivacyEvent({ action: 'export', exportDir });
  return exportDir;
}
