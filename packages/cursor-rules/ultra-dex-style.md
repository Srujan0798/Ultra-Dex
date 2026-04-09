# Ultra-Dex Coding Style (Strict)

## Core Principles

- Prefer clarity over cleverness.
- Keep functions single-purpose and under ~40 lines when possible.
- Avoid side effects outside the module boundary.
- Use explicit types (TypeScript) for public APIs.

## Formatting

- 2 spaces indentation
- No trailing whitespace
- Use single quotes for strings unless JSON

## Error Handling

- No silent catches
- Always include error context in logs
- Favor `throw new Error("...")` with actionable messages

## Async & IO

- Use `async/await` over raw Promises
- Never block the event loop with sync file reads in hot paths

## Naming

- Verbs for functions: `createUser`, `updateRecord`
- Nouns for data: `user`, `config`, `plan`

## Unsafe Patterns (Disallowed)

- `console.log` in production paths
- `any` types in TS
- Hardcoded API keys or secrets
