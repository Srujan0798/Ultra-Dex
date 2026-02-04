/**
 * Test setup file for Vitest
 * Sets up global test utilities and mocks
 */

import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Mock global console methods to suppress output during tests
vi.spyOn(global.console, 'log').mockImplementation(() => {});
vi.spyOn(global.console, 'info').mockImplementation(() => {});
vi.spyOn(global.console, 'warn').mockImplementation(() => {});
vi.spyOn(global.console, 'error').mockImplementation(() => {});

// Create temporary directory for test files
let tempDir;

beforeAll(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-test-'));
});

afterAll(async () => {
  if (tempDir) {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  }
});

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
});

// Global test utilities
export const createTestProject = async (projectName = 'test-project') => {
  const projectDir = path.join(tempDir, projectName);
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
  if (projectDir && await fs.stat(projectDir).then(() => true).catch(() => false)) {
    await fs.rm(projectDir, { recursive: true, force: true });
  }
};

// Make utilities available globally
global.createTestProject = createTestProject;
global.writeTestFile = writeTestFile;
global.readTestFile = readTestFile;
global.cleanupTestProject = cleanupTestProject;