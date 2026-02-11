import js from '@eslint/js';

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
            },
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-console': 'off',
            'no-empty': ['warn', { allowEmptyCatch: true }],
            'no-constant-condition': 'warn',
        },
    },
    {
        files: ['**/*.config.js', '**/*.config.cjs', '**/*.config.mjs'],
        languageOptions: {
            globals: {
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly'
            }
        }
    },
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'build/**',
            '.next/**',
            'coverage/**',
            '**/*.d.ts',
            '**/*.ts',
            '**/*.tsx',
            'apps/mobile/**',
            'apps/dashboard/**',
            'dashboard/**',
        ],
    },
];
