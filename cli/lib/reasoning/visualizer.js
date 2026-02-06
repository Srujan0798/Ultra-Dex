// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';
import { parseChainOfThought } from './cot-parser.js';

export function toMermaid(nodes = []) {
  const lines = ['graph TD'];
  for (let i = 0; i < nodes.length; i += 1) {
    const current = nodes[i];
    const next = nodes[i + 1];
    lines.push(`  ${current.id}["${escape(current.text)}"]`);
    if (next) {
      lines.push(`  ${current.id} --> ${next.id}`);
    }
  }
  return lines.join('\n');
}

export async function exportReasoningReport(content, outputPath) {
  const nodes = parseChainOfThought(content);
  const mermaid = toMermaid(nodes);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, mermaid);
  return outputPath;
}

function escape(text) {
  return text.replace(/"/g, '\\"');
}

export default {
  toMermaid,
  exportReasoningReport,
};
