# Implementation Plan (Current)

This file tracks the active high-level implementation direction for the main product surface.

## Goals

1. Keep `main` always demo-ready.
2. Maintain strong reliability gates (lint, typecheck, tests, build).
3. Preserve clear separation between product docs, internal docs, and historical artifacts.

## Current focus areas

1. Billing and usage metering stability (Stripe + Redis paths).
2. Documentation simplification and root-level clarity.
3. Developer experience improvements in CLI and dashboard flows.

## Quality gates (required before merge)

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

## Documentation policy

- Root docs stay concise and investor-friendly.
- Full technical depth lives under `docs/`.
- Historical milestone/handoff content belongs in `docs/internal/archive/`.
