# Ultra-Dex Development Guide

This guide covers the local development path for the monorepo, including the CLI, SDK, tests, and optional Docker services.

## Prerequisites

- Node.js 18 or newer
- npm 8 or newer
- Git
- Docker optional, but recommended for Redis/Postgres-backed integration work

## Quick Setup

```bash
git clone https://github.com/Srujan0798/Ultra-Dex.git
cd Ultra-Dex
npm install
cp .env.example .env
```

Add at least one provider key to `.env`, or use `MOCK_AI=true` for local CLI validation.

## Running the CLI

For the current repo, the source-first workflow is the most reliable:

```bash
npm run ultra-dex -- --help
MOCK_AI=true npm run ultra-dex -- run planner -t "hello"
MOCK_AI=true npm run ultra-dex -- swarm "draft a launch checklist"
```

For watch mode during CLI work:

```bash
npm run cli:dev
```

## Docker

Docker is optional. Use it when you need Redis/Postgres locally:

```bash
docker compose up
```

That brings up the local app/infrastructure stack defined in `docker-compose.yml`.

## Environment

Start from `.env.example` and override only what you need:

```bash
cp .env.example .env
```

Common variables:

```bash
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_KEY=
NVIDIA_API_KEY=
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://ultradex:password@localhost:5432/ultradex
MEMORY_BACKEND=file
```

## Testing

```bash
npm test
npm run test:unit
npm run test:cli
npm run test:integration
```

Notes:

- Integration tests are the most likely to need Docker-backed services.
- Packaging changes should also be validated with `npm pack` in `apps/cli` and `packages/sdk`.

## Building

```bash
npm run build
npm run build:cli
npm --prefix packages/sdk run build
```

## Debugging

```bash
NODE_DEBUG=ultra-dex npm run cli:dev
MOCK_AI=true npm run ultra-dex -- doctor
npm run perf:profile
```

## Project Structure

```text
Ultra-Dex/
├── apps/
│   ├── cli/
│   ├── cloud/
│   ├── dashboard/
│   ├── desktop/
│   └── white-label/
├── docs/
├── packages/
│   └── sdk/
├── scripts/
├── src/
│   └── core/
└── tests/
```

Entry points:

- CLI: `apps/cli/bin/ultra-dex.js`
- Root runnable wrapper: `dist/ultra-dex.js`
- SDK package: `packages/sdk/src/index.ts`
