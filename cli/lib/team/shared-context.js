/**
 * Shared context utilities for team workflows
 */

import fs from 'fs/promises';
import path from 'path';

const TEAM_DIR = '.ultra-dex';
const SHARED_CONTEXT_FILE = 'shared-context.md';

function resolveSharedContextPath(workspace = process.cwd()) {
  return path.join(workspace, TEAM_DIR, SHARED_CONTEXT_FILE);
}

export async function readSharedContext(workspace) {
  const filePath = resolveSharedContextPath(workspace);
  return fs.readFile(filePath, 'utf8');
}

export async function writeSharedContext(content, workspace) {
  const filePath = resolveSharedContextPath(workspace);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf8');
  return filePath;
}

export async function syncSharedContextFromFile(sourcePath = 'CONTEXT.md', workspace) {
  const resolvedSource = path.resolve(workspace || process.cwd(), sourcePath);
  const content = await fs.readFile(resolvedSource, 'utf8');
  return writeSharedContext(content, workspace);
}

export async function getSharedContextStatus(workspace) {
  const filePath = resolveSharedContextPath(workspace);
  try {
    const stats = await fs.stat(filePath);
    return { exists: true, updatedAt: stats.mtime.toISOString(), path: filePath };
  } catch {
    return { exists: false, updatedAt: null, path: filePath };
  }
}
