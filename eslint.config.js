import fs from 'fs';
import js from '@eslint/js';

async function loadTypeScriptEslintModule(specifier, fallbackSpecifier) {
  try {
    const mod = await import(specifier);
    return mod.default ?? mod;
  } catch {
    try {
      const mod = await import(fallbackSpecifier);
      return mod.default ?? mod;
    } catch {
      return null;
    }
  }
}

function hasLocalPackage(relativePath) {
  return fs.existsSync(new URL(relativePath, import.meta.url));
}

const hasTypeScriptEslintRuntime =
  hasLocalPackage('./node_modules/@typescript-eslint/parser/package.json') &&
  hasLocalPackage('./node_modules/@typescript-eslint/eslint-plugin/package.json') &&
  hasLocalPackage('./node_modules/@typescript-eslint/scope-manager/package.json');

const tsParser = hasTypeScriptEslintRuntime
  ? await loadTypeScriptEslintModule(
      '@typescript-eslint/parser',
      './node_modules/@typescript-eslint/parser/dist/index.js'
    )
  : null;
const tsPlugin = hasTypeScriptEslintRuntime
  ? await loadTypeScriptEslintModule(
      '@typescript-eslint/eslint-plugin',
      './node_modules/@typescript-eslint/eslint-plugin/dist/index.js'
    )
  : null;

const tsLintConfig =
  tsParser && tsPlugin
    ? [
        {
          files: ['**/*.ts', '**/*.tsx'],
          languageOptions: {
            parser: tsParser,
            parserOptions: {
              ecmaVersion: 'latest',
              sourceType: 'module',
            },
          },
          plugins: {
            '@typescript-eslint': tsPlugin,
          },
          rules: {
            ...tsPlugin.configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'warn',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
          },
        },
      ]
    : [
        {
          ignores: ['**/*.ts', '**/*.tsx'],
        },
      ];

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        AbortController: 'readonly',
        ReadableStream: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        crypto: 'readonly',
        performance: 'readonly',
        structuredClone: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        Promise: 'readonly',
        Proxy: 'readonly',
        Reflect: 'readonly',
        WeakMap: 'readonly',
        WeakRef: 'readonly',
        Symbol: 'readonly',
        BigInt: 'readonly',
        globalThis: 'readonly',
        queueMicrotask: 'readonly',
        EventTarget: 'readonly',
        Event: 'readonly',
        MessageChannel: 'readonly',
        AbortSignal: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        global: 'readonly',
        exports: 'readonly',
        module: 'readonly',
        require: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        FormData: 'readonly',
        WebSocket: 'readonly',
        WebAssembly: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-console': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-constant-condition': 'warn',
    },
  },
  ...tsLintConfig,
  {
    files: ['**/*.config.js', '**/*.config.cjs', '**/*.config.mjs'],
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
  },
  {
    files: ['apps/docs-site/src/**/*.js'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  // Additional source paths beyond apps/cli/lib
  {
    files: [
      'src/**/*.js',
      'src/**/*.ts',
      'src/**/*.tsx',
      'packages/sdk/**/*.js',
      'packages/sdk/**/*.ts',
      'apps/dashboard/src/**/*.js',
      'apps/dashboard/src/**/*.ts',
      'apps/dashboard/src/**/*.tsx',
    ],
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-undef': 'error',
    },
  },
  {
    ignores: [
      '**/node_modules/**',
      '**/.git/**',
      '**/*.node',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/.docusaurus/**',
      '**/.turbo/**',
      '**/*.d.ts',
      'apps/cli/test/**',
      'tests/**',
      'examples/**',
      'packages/extensions/vscode/out/**',
      'apps/mobile/**',
      '**/.ultra-dex/**',
      '**/.ultra/**',
      '**/.claude/**',
      '**/.cursor/**',
      '**/.husky/**',
      '**/.vscode/**',
      '**/.npmignore',
      '**/.prettierignore',
      '**/package-lock.json',
    ],
  },
];
