// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';

export function compactHistory(lines, max = 20) {
  if (!Array.isArray(lines)) return [];
  if (lines.length <= max) return lines;
  const head = lines.slice(0, Math.floor(max / 2));
  const tail = lines.slice(-Math.floor(max / 2));
  return [...head, '... (compacted) ...', ...tail];
}

export function summarizeOutput(output, maxChars = 500) {
  if (!output) return '';
  const text = output.toString().replace(/\s+/g, ' ').trim();
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '...';
}

export async function appendLessonsToUltra(projectRoot, lesson) {
  const ultraPath = path.join(projectRoot, 'ULTRA.md');
  try {
    const content = await fs.readFile(ultraPath, 'utf8');
    const entry = `\n- [${new Date().toISOString().slice(0, 10)}] ${lesson}`;
    await fs.writeFile(ultraPath, content + entry, 'utf8');
    return true;
  } catch {
    return false;
  }
}
