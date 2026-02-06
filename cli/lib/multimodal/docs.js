// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';

export async function generateDocsFromFiles(files) {
  const docs = [];
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const lines = content.split('\n').slice(0, 40).join('\n');
      docs.push({ file, summary: lines });
    } catch {
      docs.push({ file, summary: 'Unable to read file.' });
    }
  }
  return docs;
}

export async function writeDocsReport(docs, outputPath) {
  const resolved = path.resolve(outputPath);
  const body = [
    '# Auto-Generated Documentation',
    '',
    ...docs.map((doc) => `## ${doc.file}\n\n${doc.summary}\n`),
  ].join('\n');
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, body, 'utf8');
  return resolved;
}
