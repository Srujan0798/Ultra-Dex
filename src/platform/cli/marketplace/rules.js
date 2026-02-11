// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Rules module
 * @module marketplace/rules
 */

import fs from 'fs/promises';
import path from 'path';

const COMMUNITY_DIR = path.resolve(process.cwd(), 'cursor-rules', 'community');
const ENTERPRISE_DIR = path.resolve(process.cwd(), 'cursor-rules', 'enterprise');

export async function listRules(type = 'community') {
  const dir = type === 'enterprise' ? ENTERPRISE_DIR : COMMUNITY_DIR;
  try {
    const files = await fs.readdir(dir);
    return files
      .filter((file) => file.endsWith('.mdc'))
      .map((file) => ({ name: file.replace('.mdc', ''), file }));
  } catch {
    return [];
  }
}

export async function installRule(sourcePath, targetName) {
  const destDir = COMMUNITY_DIR;
  await fs.mkdir(destDir, { recursive: true });
  const dest = path.join(destDir, `${targetName || path.basename(sourcePath)}`);
  await fs.copyFile(sourcePath, dest);
  return dest;
}

export async function publishRule(rulePath) {
  return { status: 'pending', path: rulePath };
}
