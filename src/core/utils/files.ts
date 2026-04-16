import fs from 'fs/promises';
import path from 'path';
import { logger } from './logging.js';
type FileSystemError = NodeJS.ErrnoException;
async function readFileSafe(
  filePath: string,
  label: string = ''
): Promise<{ label: string; content: string }> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { label, content };
  } catch (err) {
    const fileError = err as FileSystemError;
    if (fileError.code !== 'ENOENT') {
      logger.error(`[File] Error reading ${filePath}: ${fileError.message}`);
    }
    return { label, content: '' };
  }
}
async function pathExists(targetPath: string, type: 'file' | 'dir' = 'file'): Promise<boolean> {
  try {
    const stats = await fs.stat(targetPath);
    if (type === 'file') return stats.isFile();
    if (type === 'dir') return stats.isDirectory();
    return false;
  } catch {
    return false;
  }
}
function resolveAssetPath(basePath: string, relativePath: string): string {
  try {
    return path.join(basePath, relativePath);
  } catch (err) {
    const fileError = err as FileSystemError;
    logger.error(`[File] Error resolving path: ${fileError.message}`);
    return '';
  }
}
async function copyDirectory(sourceDir: string, targetDir: string): Promise<void> {
  try {
    await fs.mkdir(targetDir, { recursive: true });
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });
    for (const entry of entries) {
      const sourcePath = path.join(sourceDir, entry.name);
      const targetPath = path.join(targetDir, entry.name);
      if (entry.isDirectory()) {
        await copyDirectory(sourcePath, targetPath);
      } else if (entry.isFile()) {
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  } catch (err) {
    const fileError = err as FileSystemError;
    logger.error(
      `[File] Error copying directory ${sourceDir} to ${targetDir}: ${fileError.message}`
    );
    throw err;
  }
}
export { copyDirectory, pathExists, readFileSafe, resolveAssetPath };
