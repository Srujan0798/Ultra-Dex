import fs from 'fs/promises';
import path from 'path';

export async function readFileSafe(filePath, label = '') {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { label, content };
  } catch (err) {
    return { label, content: '' };
  }
}

export async function pathExists(targetPath, type = 'file') {
  try {
    const stats = await fs.stat(targetPath);
    if (type === 'file') return stats.isFile();
    if (type === 'dir') return stats.isDirectory();
    return false;
  } catch {
    return false;
  }
}

export function resolveAssetPath(basePath, relativePath) {
  return path.join(basePath, relativePath);
}
