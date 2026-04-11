# Contributing to Ultra-Dex

Thanks for contributing. Ultra-Dex is an npm workspace monorepo centered on the CLI in `apps/cli`, shared runtime code in `src/core`, and the public SDK in `packages/sdk`.

## Code of Conduct

This project follows [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Keep discussion technical, respectful, and specific.

## Getting Started

```bash
git clone https://github.com/Srujan0798/Ultra-Dex.git
cd Ultra-Dex
npm install
npm run typecheck
npm test
```

If you want to exercise the CLI without real provider keys:

```bash
MOCK_AI=true npm run ultra-dex -- run planner -t "hello"
```

## Development

Core commands:

```bash
npm run cli:dev
npm run test:cli
npm run lint
npm run build
```

Useful variations:

```bash
MOCK_AI=true npm run ultra-dex -- doctor
NODE_DEBUG=ultra-dex npm run cli:dev
```

## Pull Request Process

1. Fork the repo and create a focused branch such as `feat/sdk-run-api` or `fix/cli-packaging`.
2. Keep changes scoped. Separate packaging, runtime, and docs changes unless they must ship together.
3. Use conventional commit messages such as `feat: add sdk run api` or `fix: make cli package installable`.
4. Run the relevant checks before opening the PR.
5. Fill out the PR template with what changed, how it was tested, and any follow-up work.

## Architecture Overview

Start with [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

High-value areas:

- `apps/cli/` contains the command surface and bundled assets.
- `src/core/` contains shared runtime modules used by the CLI and other packages.
- `packages/sdk/` contains the programmatic JavaScript/TypeScript SDK.
- `tests/` contains core, CLI, and integration coverage.

## Code Style

- Prefer TypeScript for new package-facing APIs and keep ESM imports/exports.
- Use `async`/`await` instead of callback-style control flow.
- Prefer existing custom error classes and existing logger/output helpers.
- Keep comments sparse and only where the code is non-obvious.
- Do not add new dependencies casually; packaging size matters for the CLI.

## Testing Expectations

Run the narrowest useful checks for your change:

```bash
npm run typecheck
npm run test:unit
npm run test:cli
npm run test:integration
```

For packaging changes, also validate:

```bash
cd apps/cli && npm pack
cd packages/sdk && npm pack
```
