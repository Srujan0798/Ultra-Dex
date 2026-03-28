# Amp Code CLI: Official Deep Feature Playbook

**Document Status:** 2026 Official Documentation Verified  
**Source:** Sourcegraph (ampcode.com)  
**Tool:** Amp CLI by Sourcegraph  
**Objective:** Extract maximum autonomous coding performance from the `amp` binary using unconstrained token generation.

---

## 1. What It Is

Amp is Sourcegraph's next-gen agentic coding tool. It operates as both a CLI tool and VS Code extension. Unlike simple autocomplete, Amp completes entire tasks autonomously with **unconstrained token usage** — it doesn't cut corners to save tokens, it finishes the job properly.

---

## 2. The 3 Agent Modes

| Mode | Behavior |
|---|---|
| `smart` | Unconstrained state-of-the-art model use. Maximum quality. Uses the best model available (Claude Opus 4.6, GPT-5.4). |
| `rush` | Fast and efficient. Uses lighter models for speed. Best for simple, quick tasks. |
| `deep` | Extended reasoning on complex problems. Takes more time but produces deeply thought-out solutions. |

---

## 3. Multi-Model Integration

Amp is model-agnostic. It intelligently selects models, but you can also force specific ones:
- **Claude Opus 4.6** (Anthropic)
- **GPT-5.4** (OpenAI)
- **Gemini** (Google)

The mode (`smart`/`rush`/`deep`) determines which model tier Amp selects automatically.

---

## 4. Built-In Tools

| Tool | Purpose |
|---|---|
| `search` | Code search across the repository |
| `read` | Read file contents |
| `write` | Write/edit files |
| `bash` | Execute shell commands |
| Custom Toolboxes | Define your own tools |

Granular permission settings control which tools the agent can access.

---

## 5. Key Advanced Features

* **Agent Skills:** Specific instruction files for using local tools. Improves tool-use performance efficiently without bloating the prompt.
* **`AGENT.md` Support:** Amp reads `AGENT.md` files to understand codebase structure, development practices, and coding standards for contextually relevant generation.
* **Thread Sharing:** Conversation threads sync to ampcode.com. Teams can share successful approaches and track adoption.
* **Code Review Agent:** Pre-scans diffs, provides summaries, guidance, and actionable feedback.
* **TypeScript SDK:** Build programmatic automation (automated PR analysis, doc generators, test automation, CI/CD pipelines).
* **Tab Completion Engine:** Custom engine that anticipates developer actions for faster workflow.

---

## 6. CLI Usage

```bash
# Launch interactive session
amp

# Run a specific task non-interactively  
amp "Refactor auth.js to use ES modules"

# Use a specific mode
amp --mode rush "Generate unit tests for utils.js"
amp --mode deep "Analyze the race condition in scheduler.js"
```

---

## 7. Ultra-Dex Swarm Role & Dispatch

* **Role:** Autonomous Deep-Reasoning Builder
* **Best For:** Complex multi-file implementations, deep architectural analysis, and rapid boilerplate.
* **Windows:** 1–3 tabs
* **$0 Strategy:** Use `rush` mode for bulk operations to save quota.

### Dispatch Templates

```bash
# Terminal (Complex Blueprint Translation)
amp --mode deep "Read the architecture specs in /specs and implement the core orchestrator loop"

# Terminal (Rapid Generation)
amp --mode rush "Generate unit tests globally for all files ending in -service.js"
```
