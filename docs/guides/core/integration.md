# Agent Integration Guide

## Runtime layers

1. **Command layer**: `apps/cli/lib/commands/*`
2. **Routing layer**: provider/model routing and fallback logic
3. **Execution layer**: orchestration in `src/core/*`
4. **State layer**: runtime/session data in `.state/`

## Provider usage model

- Prefer explicit provider selection when passed by user flags.
- Use deterministic fallback order from provider registry when primary fails.
- Surface final failure clearly when all providers fail (no silent success-like fallback).

## Adding a new agent

1. Add command registration under `apps/cli/lib/commands/`.
2. Add capability mapping/routing integration.
3. Add tests for happy path + fallback/error path.
4. Update docs for command usage and examples.
