# Ultra-Dex v6.0.0

Ultra-Dex is a multi-package monorepo for AI-agent orchestration, with a production CLI, core orchestration runtime, and platform apps.

## v6.0.0 Scope

- Multi-agent orchestration core in `src/core`.
- AI meta-layer with provider routing and fallback (`OpenAI`, `Anthropic`, `Google`, `Ollama`, `Azure`, `mock`).
- CLI runtime and commands in `apps/cli` (mirrored to `cli` for packaging/runtime paths).
- MCP integrations for tool execution and remote/server workflows.
- Platform apps for dashboard, docs, web, mobile, desktop, cloud, and white-label variants.

## Repository Layout

- `apps/cli`: CLI entrypoint, commands, MCP, providers, templates, assets.
- `src/core`: Orchestration, agents, AI layer, memory, protocols, system services.
- `apps/dashboard`: Vite/React dashboard.
- `apps/docs-site`: Docusaurus docs app.
- `apps/web`, `apps/mobile`, `apps/desktop`, `apps/cloud`, `apps/white-label`: platform surfaces.
- `packages/*`: shared packages/extensions.
- `tests/*`: core, integration, and CLI test suites.

## Requirements

- Node.js `>=18.0.0`
- npm `>=8.0.0`
- Optional API keys:
  - `OPENAI_API_KEY`
  - `ANTHROPIC_API_KEY`
  - `GOOGLE_API_KEY`
- Optional local mock mode:
  - `MOCK_AI=true`

## Quick Start

```bash
npm install
npm start
```

`npm start` runs `node apps/cli/bin/ultra-dex.js`.

## Common Root Commands

```bash
# quality
npm run lint
npm run typecheck
npm test

# build
npm run build
```

`npm run build` executes:

- `build:core`
- `build:dashboard`
- `build:docs`

`build:docs` is configured to emit a fallback message when Docusaurus is unavailable in the environment.

## Notes

- CLI command registration source is `apps/cli/bin/ultra-dex.js`.
- Root `package.json` exposes the `ultra-dex` bin as `./apps/cli/bin/ultra-dex.js`.
- `src/core/orchestration` is designed to run even when optional MCP tool registration is not provided.

## License

MIT (`LICENSE`)
