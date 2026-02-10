// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';

export async function validateUdcf(input) {
  const schemaPath = path.join(process.cwd(), 'docs', 'udcf', 'schema.json');
  const schema = JSON.parse(await fs.readFile(schemaPath, 'utf8'));

  if (!input.project || !input.project.name || !input.project.version) {
    return { ok: false, error: 'Missing project name/version' };
  }
  if (!input.plan || !Array.isArray(input.plan)) {
    return { ok: false, error: 'Plan must be an array' };
  }
  return { ok: true, schema };
}
