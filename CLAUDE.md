# CLAUDE.md

> **PROJECT STATUS: v2.1.0 - ETERNAL STATE ACHIEVED** | All tests passing (306 unit, 44 integration) | All 6 NoopSubsystems replaced

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

```bash
npm start                    # Run the CLI
npm run dev                  # Run CLI with file watch (hot reload)
npm run demo                 # Run a demo with MOCK_AI=true (no real API calls)
```

### Build

```bash
npm run build                # Build all (core + dashboard)
npm run build:core           # Core modules only
npm run build:cli            # Bundle CLI via esbuild → dist/ultra-dex.js
npm run build:dashboard      # Dashboard app
```

### Testing

```bash
npm test                     # All tests (unit + integration + CLI), 30s timeout
npm run test:unit            # tests/core/*.test.js
npm run test:integration     # tests/integration/*.test.js, 60s timeout
npm run test:cli             # tests/cli/*.test.js
npm test -- tests/core/some.test.js   # Single test file
npm run test:watch           # Watch mode for core unit tests
npm run test:coverage        # With spec reporter
```

Tests use Node's built-in `node --test` runner (not Jest/Vitest). `NODE_ENV=test` is set automatically.

### Lint & Format

```bash
npm run lint                 # ESLint on apps/cli/lib (JS/TS)
npm run lint:fix             # Auto-fix ESLint issues
npm run format               # Prettier on all files
npm run format:check         # Prettier check (CI-safe)
npm run typecheck            # TypeScript noEmit check
```

### Pre-commit gates (run before committing)

```bash
npm run governance           # Pre-commit governance checks
npm run gate:local           # Full local enterprise gate
```

## Architecture

Ultra-Dex is an **AI orchestration meta-layer** — it routes tasks across AI providers, coordinates multi-agent swarms, and maintains persistent memory. It is an ES Module monorepo (`"type": "module"`), Node >=18.

### Core execution flow

```
CLI (apps/cli/bin/ultra-dex.js)
  └─ Command (apps/cli/lib/commands/*.js)
       └─ AgentOrchestrator.executeNexus() / executeTask()
            ├─ Governance check (src/core/governance/)
            ├─ Memory search (src/core/memory/)
            ├─ Agent selection (src/core/agents/)
            └─ AIMetaLayer.call() → Provider (src/services/ai-providers/)
```

### Key modules

| Path                                        | Role                                                                                                 |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `apps/cli/bin/ultra-dex.js`                 | CLI entry point; Commander.js, lazy command loading                                                  |
| `apps/cli/lib/commands/run.js`              | `run`, `swarm`, `distributed` commands                                                               |
| `src/core/orchestration/index.js`           | `AgentOrchestrator` (also exported as `nexus`) — multi-agent coordination, task graphs, self-healing |
| `src/core/ai/ai-meta-layer.js`              | `AIMetaLayer` — provider abstraction, cost/latency/quality routing, caching, token tracking          |
| `src/core/memory/unified-api.js`            | `ppmManager` — tiered persistent memory, semantic/vector search                                      |
| `src/core/governance/governance-manager.js` | Policy enforcement; throws `DeniedException` on violations                                           |
| `src/core/mcp/`                             | Model Context Protocol server and tool registry                                                      |
| `src/services/ai-providers/router.js`       | Routes requests to the right provider with fallback chains                                           |
| `src/index.js`                              | Top-level export of the whole platform                                                               |

### AI providers

Providers live in `src/services/ai-providers/` and implement a common interface. Supported: OpenAI, Anthropic, Google Gemini, NVIDIA Nemotron, Mistral, Groq, DeepSeek, Cohere, Together AI, Fireworks, Perplexity, Grok, Llama 4. The router selects by cost / latency / quality or explicit override. Set `MOCK_AI=true` to use the mock provider (no API calls).

### Agent system

Predefined roles in `src/core/agents/`: Planner, Backend, Frontend, CTO, Reviewer, Database, Auth, DevOps, Debugger. Selection is capability-based. The **Ralph Loop** pattern drives autonomous multi-step execution.

### Memory system (`ppmManager`)

Three tiers: instant (in-process), session, persistent. Supports vector-based semantic search and graph-based knowledge storage. All task results are stored back into memory automatically.

### Governance

Every task and tool execution passes through `GovernanceManager` before running. Violations throw `DeniedException`. Audit logs are written for all actions.

## Code style

- **TypeScript**: strict mode, interfaces over types, explicit param/return types, `unknown` not `any`
- **Naming**: `camelCase` vars/functions, `PascalCase` classes, `UPPER_SNAKE_CASE` constants, filenames match class name
- **Imports**: use `src/` alias (not relative `../../`), e.g. `import { Service } from 'src/services/service'`
- **Async**: async/await with try/catch; no floating promises
- **Errors**: custom classes extending `Error`; log via `winston`; never swallow
- **Commits**: conventional commits (`feat:`, `fix:`, `chore:`, etc.)


## Enabled Skills

### 🎨 Frontend-Design Skill

**Skill Identity**
- Name: `frontend-design`
- Type: UI/UX Creation & Code Generation
- Added by: You
- Last updated: Mar 17, 2026
- Trigger: Slash command + auto
- License: Complete terms in LICENSE.txt

**Description**

Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

---

### Design Thinking Process

Before coding, understand the context and commit to a BOLD aesthetic direction:

1. **Purpose**: What problem does this interface solve? Who uses it?
2. **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
3. **Constraints**: Technical requirements (framework, performance, accessibility).
4. **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- ✅ Production-grade and functional
- ✅ Visually striking and memorable
- ✅ Cohesive with a clear aesthetic point-of-view
- ✅ Meticulously refined in every detail

---

### Frontend Aesthetics Guidelines

Focus on these core principles:

#### Typography (CRITICAL)
- **DO**: Choose fonts that are beautiful, unique, and interesting
- **DO**: Avoid generic fonts like Arial and Inter
- **DO**: Opt for distinctive choices that elevate the frontend's aesthetics
- **DO**: Use unexpected, characterful font choices
- **DO**: Pair a distinctive display font with a refined body font
- ❌ NEVER use generic AI-generated font families

#### Color & Theme
- **DO**: Commit to a cohesive aesthetic
- **DO**: Use CSS variables for consistency
- **DO**: Dominant colors with sharp accents outperform timid, evenly-distributed palettes
- ❌ NEVER use cliched color schemes like purple gradients on white backgrounds

#### Motion
- **DO**: Use animations for effects and micro-interactions
- **DO**: Prioritize CSS-only solutions for HTML
- **DO**: Use Motion library for React when available
- **DO**: Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions
- **DO**: Use scroll-triggering and hover states that surprise

#### Spatial Composition
- **DO**: Use unexpected layouts
- **DO**: Asymmetry, overlap, diagonal flow
- **DO**: Grid-breaking elements
- **DO**: Generous negative space OR controlled density

#### Backgrounds & Visual Details
- **DO**: Create atmosphere and depth rather than defaulting to solid colors
- **DO**: Add contextual effects and textures that match the overall aesthetic
- **DO**: Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays
- ❌ NEVER use generic AI-generated aesthetics

---

### What NOT to Do

❌ **Overused font families**: Inter, Roboto, Arial, system fonts (in generic contexts)
❌ **Cliched color schemes**: Particularly purple gradients on white backgrounds
❌ **Predictable layouts and component patterns**: Standard card grids, centered everything
❌ **Cookie-cutter design**: Lacking context-specific character
❌ **Generic AI-generated aesthetics**: No distinctive vision

**Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.**

---

### Implementation Complexity Matching

**IMPORTANT**: Match implementation complexity to the aesthetic vision.

- **Maximalist designs** need elaborate code with extensive animations and effects
- **Minimalist or refined designs** need restraint, precision, and careful attention to spacing, typography, and subtle details
- **Elegance comes from executing the vision well**

---

### Creative Mandate

**Remember**: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
