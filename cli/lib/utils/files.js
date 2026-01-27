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

export async function copyWithFallback({ primary, fallback, destination, onPrimaryMissing }) {
  try {
    await fs.copyFile(primary, destination);
    return 'primary';
  } catch (primaryError) {
    if (onPrimaryMissing) {
      onPrimaryMissing(primaryError);
    }
    if (!fallback) {
      throw primaryError;
    }
    await fs.copyFile(fallback, destination);
    return 'fallback';
  }
}

export async function readWithFallback({ primary, fallback, encoding = 'utf-8' }) {
  try {
    return await fs.readFile(primary, encoding);
  } catch (primaryError) {
    if (!fallback) {
      throw primaryError;
    }
    return await fs.readFile(fallback, encoding);
  }
}

export function resolveAssetPath(basePath, relativePath) {
  return path.join(basePath, relativePath);
}
