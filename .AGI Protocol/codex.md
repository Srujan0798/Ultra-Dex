# OpenAI Codex (VS Code Extension): Official Deep Feature Playbook

**Document Status:** 2026 Official Documentation Verified  
**Source:** developers.openai.com/codex/ide  
**Tool:** OpenAI Codex Extension for VS Code and Cursor  
**Objective:** Configure Codex as a hardcoded, project-aware engineering daemon using its full extensibility stack rather than treating it like a chatbot.

---

## 1. The 4 Operational Modes (Reasoning Effort)

This determines how much the AI "thinks" before generating code. **Choosing wrong burns your hourly quota.**

| Mode | Behavior | Token Cost | Best For |
|---|---|---|---|
| **`Low`** | Fastest token sequence. No reasoning chain. | Minimal | Boilerplate, simple autocomplete, trivial tests |
| **`Medium`** | Light contextual verification. Checks file structure. | Moderate | Standard feature implementation, endpoints |
| **`High`** | Multi-step Chain-of-Thought logic mapping. | High | Multi-service integrations, race conditions |
| **`Extra High`** | Maximum cognitive effort. Cross-references repo. | Catastrophic | Architectural migrations, cryptography |

**Rule:** Never use `Extra High` + `Full Access` repeatedly. You will hit the 30–50 heavy task/hour soft cap instantly.

---

## 2. The 7 Official Models

| Model | Tier | Strengths |
|---|---|---|
| **`gpt-5.4`** | Bleeding Edge | Maximum reasoning quality for hardest engineering problems. Drains quota. |
| **`gpt-5.4-mini`** | Daily Driver | Fast execution with minimal quota drain. Best default for `Medium`. |
| **`gpt-5.3-codex`** | Coding Specialist | Balances architecture logic with execution speed. Good for `High`. |
| **`gpt-5.3-codex-spark`** | Instant | Ultra-lightweight. Perfect for inline autocomplete. Pairs with `Low`. |
| **`gpt-5.2-codex`** | Fallback | Rotates in when newer endpoints represent server-throttle. |
| **`gpt-5.1-codex-max`** | Legacy Output | Maximum-quality legacy fallback. |
| **`gpt-5.1-codex`** | Legacy Light | Lightest fallback during strict rate-limiting. |

---

## 3. Access Control Modes

| Mode | Behavior | Context Impact |
|---|---|---|
| **`Full Access`** | Indexes your **entire workspace** (100s of files). | High. Use only when making multi-file edits. |
| **`Restricted Access`** | Locked physically to the **active file on screen**. | Near-zero. Default to this for 90% of work. |

---

## 4. Core IDE Features

### Inline Edit (Cmd+I / Ctrl+I)
Floating diff editor over code. The primary power feature. Never navigate away to a chat panel for simple edits.

### Context Injection (`@` Tags)
- `@file` — Inject a specific file
- `@folder` — Inject all files in a folder
- `@terminal` — Inject output (errors, test logs)
- `@problems` — Inject VS Code diagnostic errors

### Cloud Delegation
For massive tasks, Codex offloads to OpenAI servers in the background while you keep coding locally.

### Multimodal
Drag images directly into the chat panel to generate React UI.

---

## 5. Personalization: The `AGENTS.md` File

Permanent overrides to Codex's default behavior.

**Global (`~/AGENTS.md`)**
```markdown
You are an elite Senior Principal Engineer. No apologies. Output only code.
Always use ESM imports. Always use node:test.
```

**Local (`Ultra-Dex/AGENTS.md`)**
```markdown
Monorepo rules: Core is /src. Tests are in /tests. Use existing Logger.
```

---

## 6. Plugins & Global Config (`~/.codex/config.toml`)

Codex configuration lives in `.codex/config.toml`:

```toml
[defaults]
model = "gpt-5.4-mini"
effort = "medium"
access = "restricted"

[mcp.sqlite]
type = "local"
command = ["npx", "-y", "@modelcontextprotocol/server-sqlite", "./data/app.db"]
enabled = true

[plugins]
installed = ["codex-plugin-eslint"]
```

---

## 7. Rate Limits & The Soft Cap

OpenAI enforces a **30–50 "Heavy Coding Task" limit per hour**. Focus on survival:
1. Default to `Restricted Access` + `Medium` mode.
2. Use `gpt-5.4-mini` for boilerplate.
3. Reserve `gpt-5.4` + `Extra High` for 2 uses per hour maximum.

---

## 8. Ultra-Dex Swarm Role & Dispatch

* **Role:** High-Performance Implementation Builder
* **Best For:** Heavy architectural logic mapping, translation of blueprints, and single-window deep editing.
* **Windows:** 1 IDE window.
* **$0 Strategy:** Switch to OpenCode CLI (1M context free) when throttled.

### Dispatch Templates

```markdown
# IDE Prompt (High Effort / Full Access)
@specs/architecture.md @src/core/ Read the architecture spec and rewrite the core connection handling.

# Inline Edit (Low Effort / Restricted Access)
Make this helper function async and strongly type it.
```
