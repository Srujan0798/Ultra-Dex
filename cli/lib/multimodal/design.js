// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';

export async function loadDesignInput(input) {
  if (!input) return { type: 'text', content: '' };
  const resolved = path.resolve(input);
  const exists = await fs
    .access(resolved)
    .then(() => true)
    .catch(() => false);
  if (exists) {
    const content = await fs.readFile(resolved);
    return { type: 'file', path: resolved, content };
  }
  return { type: 'text', content: input };
}

export function extractDesignTokens(text = '') {
  const tokens = [];
  const colorMatches = text.match(/#[0-9a-fA-F]{6}/g) || [];
  colorMatches.forEach((color) => tokens.push({ type: 'color', value: color }));
  return tokens;
}

export function buildComponentBlueprint(name, tokens = []) {
  return {
    name: name || 'Component',
    tokens,
    description: 'Generated component blueprint',
  };
}
