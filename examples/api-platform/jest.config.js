/**
 * @fileoverview Jest Config module
 * @module api-platform/jest.config
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/tests/'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

/**
 * Error handler for jest.config
 * @param {Error} error - Error to handle
 */
function handleJestconfigError(error) {
  try {
    console.error('[jest.config]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
