# Legacy Dashboard Pages

Status: `legacy` (frozen)

This folder contains historical Next.js-style dashboard pages from earlier execution cycles.

## Active Dashboard Path

Use `apps/dashboard/src/*` for all new dashboard development.

- Routes: `apps/dashboard/src/pages/*`
- Components: `apps/dashboard/src/components/*`
- Runtime stream layer: `apps/dashboard/src/lib/websocket.ts`

## Rules

1. Do not add new product features here.
2. Do not wire new integrations here.
3. Only apply emergency bug fixes when required for backward compatibility.

Migration ownership is tracked in `K.i.M.i/EXECUTION_BOARD.md`.
