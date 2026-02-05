import fs from 'fs/promises';
import path from 'path';
import { summarizeFindings } from './report.js';

const CERT_DIR = path.resolve(process.cwd(), '.ultra-dex', 'security');

export function computeSecurityScore(summary) {
  const score = 100 - summary.critical * 25 - summary.warning * 10 - summary.info * 3;
  return Math.max(0, Math.min(100, score));
}

export async function issueCertificate(findings) {
  const summary = summarizeFindings(findings);
  const score = computeSecurityScore(summary);
  await fs.mkdir(CERT_DIR, { recursive: true });

  const payload = {
    score,
    summary,
    issuedAt: new Date().toISOString(),
    status: score >= 80 ? 'pass' : 'needs-review'
  };

  const jsonPath = path.join(CERT_DIR, 'certificate.json');
  const mdPath = path.join(CERT_DIR, 'certificate.md');

  await fs.writeFile(jsonPath, JSON.stringify(payload, null, 2), 'utf8');
  await fs.writeFile(mdPath, `# Ultra-Dex Security Certificate\n\nScore: **${score}**\n\nStatus: **${payload.status}**\n`, 'utf8');

  return { score, summary, jsonPath, mdPath };
}
