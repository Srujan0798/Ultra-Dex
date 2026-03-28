# Qwen Code CLI: Official Deep Feature Playbook

**Document Status:** 2026 Official Documentation Verified  
**Source:** QwenLM/qwen-code GitHub + qwencode.github.io/docs  
**Tool:** `qwen` CLI binary (open-source fork of Gemini CLI, optimized for Qwen3-Coder models)  
**Objective:** Configure Qwen CLI as a zero-cost, compiler-aware background scanning daemon.

---

## 1. Installation & Authentication Methods

```bash
# Install globally
npm install -g @qwen/qwen-code

# Or: npx (no install needed)
npx @qwen/qwen-code --help
```

### Auth Method 1: Qwen OAuth (FREE — Recommended)
```bash
qwen auth login
# Opens browser → Sign in with qwen.ai account
# Credentials cached locally. No API key needed.
```
**Free Quota:** `1,000 requests/day` | `60 requests/minute`

### Auth Method 2: API Key (Paid / Alibaba Cloud)
```bash
export QWEN_API_KEY="your-key-here"
qwen auth --api-key $QWEN_API_KEY
```

### Auth Method 3: Local Ollama / LM Studio ($0 forever)
```bash
# Redirect to local Ollama endpoint — true zero cost
qwen --auth-type openai \
     --openai-base-url http://localhost:11434/v1 \
     --openai-api-key ollama \
     -p "Your task here"
```

---

## 2. Available Models

| Model | Context | Strengths |
|---|---|---|
| `qwen3-coder-480b-a35b-instruct` | 256K | Flagship — best for complex architecture |
| `qwen3-coder-32b-instruct` | 128K | Balanced speed + quality |
| `qwen3-coder-7b-instruct` | 64K | Fast, lightweight — good for local Ollama |
| `qwen2.5-coder-32b-instruct` | 128K | Stable release, highly reliable |

Switch models:
```bash
qwen --model qwen3-coder-32b-instruct -p "Your task"
```

---

## 3. Experimental LSP (`--experimental-lsp`)

This is Qwen's most powerful differentiator from all other CLI agents. When enabled, it connects Qwen to the Language Server Protocol — meaning it reads your **actual AST (Abstract Syntax Tree)**, not just raw text.

```bash
qwen --experimental-lsp -p "Find all callers of the AgentScheduler class"
```

**What this gives you that no other CLI has:**
- `Find All References` — Finds every file that imports or calls a specific function/class
- `Go to Definition` — Knows the actual definition location across the entire repo
- `Rename Symbol` — Renames a variable/function everywhere it appears, safely
- `Document Symbol` — Lists every class, method, and property in a file as structured data

**Use case:** If you need to verify the `AgentScheduler` zombie code is truly dead everywhere, run:
```bash
qwen --experimental-lsp -p "Use lsp to find all references to AgentScheduler across the entire codebase. List every file and line number. If count is 0, confirm it is safe to delete."
```

---

## 4. Session Checkpointing (Disaster Recovery)

When running YOLO rewrites across 50+ files, you need an undo button.

```bash
# Enable checkpointing at startup
qwen --checkpointing -p "Refactor all 62 service files to use ESM imports"

# Or set permanently in settings.json:
# { "general": { "checkpointing": { "enabled": true } } }
```

**How it works:**
- Before modifying each file, Qwen saves a diff snapshot
- If the agent crashes mid-refactor, run `qwen -r latest` to resume from the last checkpoint
- You can also roll back specific file changes from the checkpoint history

---

## 5. System Prompt Override (`--append-system-prompt`)

Inject strict rules for a single headless run without touching your global settings:

```bash
qwen --append-system-prompt "You are an expert TypeScript engineer. Never use 'any' types. Never use require(). Always use ESM imports. Output only code changes, no explanation." \
     -p "Review src/services/ and fix all TypeScript type errors"
```

---

## 6. Headless & YOLO Execution

```bash
# One-shot headless
qwen -p "Scan src/ and list all files still using require()"

# YOLO mode (no approval prompts)
qwen -y -p "Fix the dynamic require in compliance-service.ts"

# Restrict to specific file (save context window)
qwen -f src/services/compliance/compliance-service.ts \
     -p "Fix the dynamic require('crypto') by converting it to a top-level ESM import"

# Resume crashed session
qwen -r latest

# Continue previous session
qwen -c "Continue the ESM refactor from where you stopped"
```

---

## 7. Ultra-Dex Swarm Dispatch Templates

```bash
# Terminal A: Full ESM Compliance Scan
qwen --experimental-lsp -y \
     -p "Use LSP to scan every .ts and .js file in src/. Find all remaining require() calls. Fix each one by converting to a proper ESM import. Generate a report of every file changed."

# Terminal B: Dead Code Detection
qwen --experimental-lsp \
     -p "Use LSP to find all exported functions and classes that have zero references anywhere in the codebase. Output as a markdown table with filename, symbol name, and line number."

# Terminal C: Dependency Mapping
qwen --checkpointing \
     -p "Generate a full import dependency graph for src/core/. Show which files import which, and flag any circular dependencies. Save output to analysis/dependency-graph.md"
```
