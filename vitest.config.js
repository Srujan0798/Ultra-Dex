import { defineConfig } from 'vite';
import { resolve } from 'path';

// Vitest configuration for Ultra-Dex
export default defineConfig({
  test: {
    // Use the built-in Node.js test runner
    include: ['tests/**/*.test.js', 'tests/**/*.test.ts'],
    exclude: [
      'node_modules', 
      'dist', 
      'build', 
      '.git', 
      '.github', 
      'coverage',
      'tests/fixtures',
      'tests/__snapshots__'
    ],
    
    // Environment configuration
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      TEST_ENV: 'true',
      MOCK_AI_PROVIDERS: 'true',
      DISABLE_EXTERNAL_APIS: 'true'
    },
    
    // Test configuration
    globals: true,
    setupFiles: ['./tests/setup.js'],
    globalSetup: ['./tests/global-setup.js'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'packages/core/**',
        'apps/cli/lib/**',
        '!**/node_modules/**',
        '!**/coverage/**',
        '!**/dist/**',
        '!**/build/**',
        '!**/tests/**',
        '!**/examples/**',
        '!**/docs/**'
      ],
      exclude: [
        '**/node_modules/**',
        '**/coverage/**',
        '**/dist/**',
        '**/build/**',
        '**/tests/**',
        '**/examples/**',
        '**/docs/**',
        '**/.*', // Hidden files
        '**/package*.json',
        '**/README.md',
        '**/CHANGELOG.md',
        '**/LICENSE',
        '**/.*ignore',
        '**/.*config*',
        '**/tsconfig*.json',
        '**/vitest.config.*',
        '**/jest.config.*',
        '**/babel.config.*',
        '**/rollup.config.*',
        '**/webpack.config.*',
        '**/gulpfile.*',
        '**/Gruntfile.*',
        '**/.*rc',
        '**/.*.yml',
        '**/.*.yaml',
        '**/.*.toml',
        '**/.*.lock',
        '**/.*.map',
        '**/.*.min.*',
        '**/.*.bundle.*',
        '**/.*.d.ts',
        '**/.*.test.*',
        '**/.*.spec.*',
        '**/.*.stories.*',
        '**/.*.story.*',
        '**/.*.fixture.*',
        '**/.*.mock.*',
        '**/.*.stub.*',
        '**/.*.helper.*',
        '**/.*.util.*',
        '**/.*.utils.*',
        '**/.*.config.*',
        '**/.*.conf.*',
        '**/.*.settings.*',
        '**/.*.env*',
        '**/.*.secret*',
        '**/.*.key*',
        '**/.*.cert*',
        '**/.*.pem*',
        '**/.*.p12*',
        '**/.*.pfx*',
        '**/.*.crt*',
        '**/.*.csr*',
        '**/.*.der*',
        '**/.*.p7b*',
        '**/.*.p7c*',
        '**/.*.p7s*',
        '**/.*.pkcs7*',
        '**/.*.pkipath*',
        '**/.*.spc*',
        '**/.*.sst*',
        '**/.*.stl*',
        '**/.*.srl*',
        '**/.*.pem*',
        '**/.*.p12*',
        '**/.*.pfx*',
        '**/.*.crt*',
        '**/.*.csr*',
        '**/.*.der*',
        '**/.*.p7b*',
        '**/.*.p7c*',
        '**/.*.p7s*',
        '**/.*.pkcs7*',
        '**/.*.pkipath*',
        '**/.*.spc*',
        '**/.*.sst*',
        '**/.*.stl*',
        '**/.*.srl*'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80
      }
    },
    
    // Performance configuration
    testTimeout: 30000, // 30 seconds
    hookTimeout: 10000, // 10 seconds
    teardownTimeout: 10000, // 10 seconds
    
    // Reporter configuration
    reporters: ['verbose'], // Use 'json' or 'junit' for CI
    
    // File watching
    watch: false, // Enable with --watch flag
    watchExclude: [
      'node_modules',
      'dist',
      'build',
      '.git',
      '.github',
      'coverage',
      'tests/fixtures'
    ],
    
    // Type checking
    typecheck: {
      checker: 'tsc', // or 'vue-tsc'
      include: ['**/*.test.ts', '**/*.spec.ts', '**/*.test.tsx', '**/*.spec.tsx'],
      exclude: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**']
    }
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'packages/core'),
      '@cli': resolve(__dirname, 'apps/cli'),
      '@utils': resolve(__dirname, 'packages/core/utils'),
      '@ai': resolve(__dirname, 'packages/core/core/ai'),
      '@agents': resolve(__dirname, 'packages/core/core/agents'),
      '@memory': resolve(__dirname, 'packages/core/core/memory'),
      '@orchestration': resolve(__dirname, 'packages/core/core/orchestration'),
      '@tests': resolve(__dirname, 'tests')
    }
  },
  
  // Define globals for Node.js environment
  define: {
    global: 'globalThis'
  }
});