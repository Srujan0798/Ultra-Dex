import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['cli/test/**/*.test.js', 'cli/test/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.git'],
    globals: true,
    environment: 'node',
    setupFiles: ['./cli/test/setup.js'],
    reporters: ['verbose', 'json'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './cli/test/coverage',
      exclude: [
        'node_modules/**',
        'cli/test/**',
        'cli/bin/**',
        'cli/assets/**',
        'cli/templates/**',
        'docs/**',
        'README.md',
        'package*.json',
        'vitest.config.js'
      ],
      lines: 80,
      branches: 80,
      functions: 80,
      statements: 80
    },
    testTimeout: 10000,
    hookTimeout: 15000
  },
  resolve: {
    alias: {
      '@': new URL('./cli', import.meta.url).pathname,
      '@lib': new URL('./cli/lib', import.meta.url).pathname,
      '@test': new URL('./cli/test', import.meta.url).pathname,
      '@utils': new URL('./cli/lib/utils', import.meta.url).pathname,
      '@commands': new URL('./cli/lib/commands', import.meta.url).pathname
    }
  }
});