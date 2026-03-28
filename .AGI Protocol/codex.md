# OpenAI Codex (VS Code Extension): Official Deep Feature Playbook

**Document Status:** 2026 Official Documentation Verified  
**Source:** developers.openai.com/codex/ide + openai.com/codex + VS Code Marketplace  
**Tool:** OpenAI Codex Extension for VS Code, Cursor, and Windsurf  
**Objective:** Stop using Codex as a chatbot. Configure it as a hardcoded, project-aware engineering daemon using its full extensibility stack.

---

## 1. The 4 Operational Modes (Reasoning Effort)

This is the cognitive effort control. It determines how much the AI "thinks" before generating code. **Choosing wrong burns your hourly quota.**

| Mode | Behavior | Token Cost | Best For |
|---|---|---|---|
| **`Low`** | No reasoning chain. Outputs the fastest statistically probable token sequence. | Minimal | Boilerplate, simple autocomplete, repetitive JSON, trivial unit tests |
| **`Medium`** | Light contextual verification before writing. Checks file structure. | Moderate | Standard feature implementation, controller/service files, API endpoints |
| **`High`** | Enters a deep multi-step Chain-of-Thought reasoning loop. Maps logic trees before writing. | High | Complex state management, race conditions, multi-service integrations |
| **`Extra High`** | Maximum cognitive effort. Cross-references the entire codebase for logical flaws before committing a single line. Very slow. | Catastrophic | Dangerous repo-wide architectural migrations, cryptographic implementations, performance-critical algorithms. Use sparingly. |

**Rule:** Never use `Extra High` + `Full Access` repeatedly. You will hit the 30–50 heavy task/hour soft cap instantly.

---

## 2. The 7 Official Models

| Model | Tier | Strengths |
|---|---|---|
| **`gpt-5.4`** | Current / Bleeding Edge | Maximum reasoning quality. Pairs with `Extra High` mode for the hardest engineering problems. Drains quota fastest. |
| **`gpt-5.4-mini`** | Current / Daily Driver | Fast execution with minimal quota drain. Best default for `Medium` mode work. |
| **`gpt-5.3-codex`** | Current / Coding Specialist | Primary coding-specialized model. Balances deep architectural logic with execution speed. Use for `High` mode. |
| **`gpt-5.3-codex-spark`** | Current / Instant | Ultra-lightweight. Built for instantaneous inline autocomplete. Pairs perfectly with `Low` mode. |
| **`gpt-5.2-codex`** | Legacy / Fallback | Rotates in when newer endpoints are server-throttled. |
| **`gpt-5.1-codex-max`** | Legacy / Fallback | Previous-generation max-quality model. |
| **`gpt-5.1-codex`** | Legacy / Fallback | Lightest legacy model. Useful if all newer endpoints are rate-limited. |

---

## 3. Access Control Modes

| Mode | Behavior | Token Impact |
|---|---|---|
| **`Full Access`** | Codex indexes your **entire workspace**. Reads all files to build context. | High — indexes 100s of files. Use only when the task needs whole-codebase awareness. |
| **`Restricted Access`** | Codex is physically locked to the **active file on screen**. Cannot read other files. | Near-zero context overhead. Use as your daily default. |

**The Golden Rule:** Default to `Restricted Access`. Only enable `Full Access` when you explicitly need multi-file context (like a multi-service feature).

---

## 4. Core IDE Features

### Inline Edit (Cmd+I / Ctrl+I)
Highlight a block of code → Press `Cmd+I` → A floating diff editor appears directly over your code. The edit is applied as a visual diff you approve. **This is the primary power feature** — never navigate away to a chat panel for simple edits.

### Context Injection (`@` Tags)
Codex does not automatically read files you haven't referenced. You must explicitly inject context:
- `@file` — Inject a specific file into the conversation
- `@folder` — Inject all files in a folder
- `@terminal` — Inject current terminal output (error logs, test failures)
- `@problems` — Inject all VS Code diagnostic errors from the Problems panel

### Cloud Delegation
For massive tasks (e.g., *"Refactor the entire `apps/` directory to ESM"*), Codex can offload to OpenAI's cloud servers. The task runs in the background while you keep coding. You check progress in the sidebar and review the final diff when complete.

### Slash Commands
Type `/` in the Codex chat panel for rapid-fire macros:
| Command | Action |
|---|---|
| `/explain` | Explains the highlighted code in plain English |
| `/tests` | Generates unit tests matching the file's existing test framework |
| `/fix` | Reads the terminal error output and fixes the highlighted code |
| `/docs` | Generates JSDoc/TSDoc documentation for the selected function |

### Multimodal (Image Drop)
Drag a Figma screenshot or UI mockup directly into the Codex chat panel. It will analyse the image and output the matching React/CSS component. Uses `gpt-5.4` under the hood.

### Native Web Search
Codex can browse the internet to find the latest library documentation before generating code. When you ask for 2026 Node.js API syntax, it searches first, then writes.

---

## 5. Personalization: The `AGENTS.md` File

**This is the most important configuration file.** It permanently overrides Codex's default "helpful assistant" personality with your strict engineering rules.

**Global (`~/AGENTS.md`)** — Applies to every project you open:
```markdown
You are an elite Senior Principal Engineer. You do not explain obvious concepts. 
You do not write apologies. You output only code.
Never use `any` TypeScript types. Never use `require()`. Always use ESM imports.
Always use `node:test` for testing, never Jest.
```

**Local (`Ultra-Dex/AGENTS.md`)** — Overrides global rules for this specific repo:
```markdown
This is the Ultra-Dex monorepo. All core files are in src/. 
All tests live in tests/. Use the existing Logger class from src/utils/logging.js.
Never add new npm dependencies without explicit approval.
All new functions require JSDoc comments.
```

**Priority:** Local `AGENTS.md` wins over Global `~/AGENTS.md`.

---

## 6. Plugins & Global Config (`~/.codex/config.toml`)

All Codex configuration — default models, approval modes, MCP servers, and plugin bundles — lives in `~/.codex/config.toml`:

```toml
[defaults]
model = "gpt-5.4-mini"
effort = "medium"
access = "restricted"

[mcp.sqlite]
type = "local"
command = ["npx", "-y", "@modelcontextprotocol/server-sqlite", "./data/app.db"]
enabled = true

[mcp.github]
type = "remote"
url = "https://api.github.com/mcp"
enabled = false

[plugins]
installed = ["codex-plugin-eslint", "codex-plugin-prettier"]
```

---

## 7. Rate Limits & The Soft Cap

OpenAI enforces a **30–50 "Heavy Coding Task" limit per hour** on ChatGPT Plus/Pro accounts.

**What counts as heavy:** Any Composer/`Agent (Full Access)` call using `High` or `Extra High` mode, long-context file reads, or Cloud Delegation.

**Survival Strategy:**
1. Default to `Restricted Access` + `Medium` mode for 90% of work
2. Use `gpt-5.4-mini` or `gpt-5.3-codex-spark` for all boilerplate tasks
3. Reserve `gpt-5.4` + `Extra High` for maximum 2–3 uses per hour
4. When throttled: Switch to OpenCode CLI with `opencode/nemotron-3-super-free` (1M context, zero cost)

---

## 8. Ultra-Dex Initialization Protocol

Set this up once, and Codex behaves correctly from the first prompt in every session:

1. Create `Ultra-Dex/AGENTS.md` with project-specific ESM + `node:test` rules
2. Set `~/.codex/config.toml` default to `gpt-5.4-mini` / `medium` / `restricted`
3. Enable the SQLite MCP server in `config.toml` for schema-aware code generation
4. Install the `codex-plugin-eslint` plugin so every generated file auto-lints
