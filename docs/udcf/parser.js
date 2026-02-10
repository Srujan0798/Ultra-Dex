// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';

export async function parseUdcf(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}
