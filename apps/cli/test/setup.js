/**
 * Shared test utilities (framework-agnostic)
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

let tempDir = null;

async function ensureTempDir() {
  if (!tempDir) {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-test-'));
  }
  return tempDir;
}

export const createTestProject = async (projectName = 'test-project') => {
  const root = await ensureTempDir();
  const projectDir = path.join(root, projectName);
  await fs.mkdir(projectDir, { recursive: true });
  return projectDir;
};

export const writeTestFile = async (dir, filename, content) => {
  const filepath = path.join(dir, filename);
  await fs.writeFile(filepath, content, 'utf8');
  return filepath;
};

export const readTestFile = async (filepath) => {
  return await fs.readFile(filepath, 'utf8');
};

export const cleanupTestProject = async (projectDir) => {
  if (
    projectDir &&
    (await fs
      .stat(projectDir)
      .then(() => true)
      .catch(() => false))
  ) {
    await fs.rm(projectDir, { recursive: true, force: true });
  }
};

export const cleanupTempDir = async () => {
  if (tempDir) {
    await fs.rm(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
};
