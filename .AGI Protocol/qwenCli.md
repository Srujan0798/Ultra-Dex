# Qwen Code CLI: Official Deep Feature Playbook

**Document Status:** 2026 Official Documentation Verified  
**Source:** QwenLM/qwen-code GitHub  
**Tool:** `qwen` CLI binary (open-source form)  
**Objective:** Configure Qwen CLI as a zero-cost, compiler-aware background scanning daemon.

---

## 1. Installation & Authentication Methods

```bash
# Install globally
npm install -g @qwen/qwen-code
```

### Auth Methods

| Method | Type | Quota | Setup |
|---|---|---|---|
| **Qwen OAuth** | Recommended | 1k req/day free | `qwen auth login` |
| **API Key** | Paid Cloud | Unlimited | `qwen auth --api-key` |
| **Local Ollama** | Hardware | Local Compute | `--openai-base-url http://localhost:11434` |

---

## 2. Available Models

| Model | Context | Strengths |
|---|---|---|
| `qwen3-coder-480b-a35b-instruct` | 256K | Flagship — best for complex architecture and heavy agentic runs |
| `qwen3-coder-32b-instruct` | 128K | Balanced speed + quality |
| `qwen3-coder-7b-instruct` | 64K | Fast, lightweight — perfect for local hardware (Ollama) |
| `qwen2.5-coder-32b-instruct` | 128K | Stable release, highly reliable |

**Switch models:**
```bash
qwen --model qwen3-coder-32b-instruct -p "Your task"
```

---

## 3. Experimental LSP (`--experimental-lsp`)

When enabled, Qwen connects to the Language Server Protocol — meaning it reads your **actual AST (Abstract Syntax Tree)**, not just raw text.

```bash
qwen --experimental-lsp -p "Find all callers of the AgentScheduler class"
```

**LSP Specific Capabilities:**
- `Find All References` — Finds true codebase imports/calls, reliably.
- `Go to Definition` — Knows the actual definition mapped across the repo.
- `Rename Symbol` — Safely refactors variables everywhere without regex breaks.
- `Document Symbol` — Navigates structural data.

---

## 4. Session Checkpointing (Disaster Recovery)

Automatically snapshot diffs before making YOLO rewrites across 50+ files.

```bash
# Enable checkpointing for a dangerous refactor
qwen --checkpointing -p "Refactor all 62 service files"

# If crashed, resume from checkpoint:
qwen -r latest
```

---

## 5. System Prompt Override (`--append-system-prompt`)

Inject strict rules for a single run without altering global user settings.

```bash
qwen --append-system-prompt "Never use 'any' types. Always use ESM imports." \
     -p "Fix all type errors in src/services/"
```

---

## 6. Headless & YOLO Execution

```bash
# One-shot scanning
qwen -p "List all files using require()"

# YOLO mode (no user approval prompts)
qwen -y -p "Fix the dynamic require"

# Limit context to single file
qwen -f src/index.ts -p "Fix type errors"
```

---

## 7. Ultra-Dex Swarm Role & Dispatch

* **Role:** Long-running Background Worker & Repository Auditor
* **Best For:** Large-scale `--experimental-lsp` scans, dependency mapping, repetitive refactoring, and data processing.
* **Windows:** 4–8 Terminal Tabs.
* **$0 Strategy:** Qwen OAuth gives 1,000 req/day for free. Spoofing `--openai-base-url` allows using local Mac/Ollama hardware infinitely.

### Dispatch Templates

```bash
# Terminal (AST-verified Bulk Fixer)
qwen --experimental-lsp -y \
     -p "Find all require() calls across src/. Fix each by converting to proper ESM imports."

# Terminal (Dead Code Tracker)
qwen --experimental-lsp \
     -p "Find exported functions with zero references. Output markdown report."

# Terminal (Dependency Graph Generator)
qwen --checkpointing \
     -p "Generate a full import dependency graph for src/core/. Save to analysis/graph.md"
```
