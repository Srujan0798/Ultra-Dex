---
description: Ultra-Dex Coding Style & Best Practices
globs: ['**/*.js', '**/*.ts', '**/*.tsx', '**/*.jsx']
---

# Ultra-Dex Coding Style & Governance

## 1. Core Principles

- **Modern Syntax**: Use ES2024 features (top-level await, optional chaining `?.`, nullish coalescing `??`).
- **Strict Typing**: No `any`. Use interfaces for all public APIs.
- **Functional**: Prefer pure functions and immutability where possible.
- **Async/Await**: Always use `async/await` over `.then()`.

## 2. File Structure

- **Components**: PascalCase (e.g., `MetricCard.tsx`).
- **Utilities**: kebab-case (e.g., `error-handler.js`).
- **Classes**: PascalCase (e.g., `AgentSwarm.js`).
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`).

## 3. Error Handling

- **Custom Errors**: Use `SmartError` from `lib/utils/smart-error.js`.
- **Try/Catch**: Wrap all external calls (API, DB, FS) in try/catch blocks.
- **Recovery**: Always implement fallback or retry logic for critical paths.

## 4. Performance

- **Lazy Loading**: Use `await import()` for heavy modules rarely used.
- **Memoization**: Memoize expensive calculations.
- **Streams**: Use streams for large file operations.

## 5. Documentation

- **JSDoc**: Document all exported functions and classes.
- **ADR**: Create an ADR for any significant architectural decision.

## 6. Security

- **No Secrets**: Never commit API keys or credentials. Use `.env`.
- **Validation**: Validate all inputs using Zod or manual checks.
- **Sanitization**: Sanitize user input before rendering or executing.
