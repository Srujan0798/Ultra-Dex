import fs from 'fs/promises';
import path from 'path';

export interface FileReadResult {
  label: string;
  content: string;
}

/**
 * Safely reads a file, returning empty content on error
 * @param filePath - Path to the file
 * @param label - Optional label for the file
 * @returns Object with label and content
 */
export async function readFileSafe(filePath: string, label: string = ''): Promise<FileReadResult> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { label, content };
  } catch (err) {
    return { label, content: '' };
  }
}

export type PathType = 'file' | 'dir';

/**
 * Checks if a path exists and is of the specified type
 * @param targetPath - Path to check
 * @param type - Type to check for ('file' or 'dir')
 * @returns true if path exists and matches type
 */
export async function pathExists(targetPath: string, type: PathType = 'file'): Promise<boolean> {
  try {
    const stats = await fs.stat(targetPath);
    if (type === 'file') return stats.isFile();
    if (type === 'dir') return stats.isDirectory();
    return false;
  } catch {
    return false;
  }
}

/**
 * Resolves an asset path relative to a base path
 * @param basePath - Base directory path
 * @param relativePath - Relative path to resolve
 * @returns Resolved absolute path
 */
export function resolveAssetPath(basePath: string, relativePath: string): string {
  return path.join(basePath, relativePath);
}

/**
 * Recursively copies a directory
 * @param sourceDir - Source directory path
 * @param targetDir - Target directory path
 */
export async function copyDirectory(sourceDir: string, targetDir: string): Promise<void> {
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
}
