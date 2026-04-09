# Gemini CLI: Official Deep Feature Playbook

**Document Status:** 2026 Official Documentation Verified  
**Source:** google-gemini/gemini-cli GitHub  
**Tool:** `gemini` CLI binary (by Google DeepMind)  
**Objective:** Configure the Gemini CLI as an automated, heavily firewalled, headless background swarm daemon.

---

## 1. Installation & Authentication

```bash
# Install
npm install -g @google/gemini-cli

# Authenticate (opens browser OAuth — no key needed for free tier)
gemini auth

# Check version
gemini --version
```

**Free Tier Limits:**

- **Model:** Gemini 2.5 Pro (default)
- **Context:** 1 million tokens
- **Rate Limit:** 60 requests / minute
- **Cost:** $0

---

## 2. The Available Models

| Model                  | Context   | Speed   | Best Use                                        |
| ---------------------- | --------- | ------- | ----------------------------------------------- |
| `gemini-2.5-pro`       | 1M tokens | Slower  | Deep architecture analysis, full-repo reasoning |
| `gemini-2.5-flash`     | 1M tokens | Fast    | Rapid generation, TDD loops, boilerplate        |
| `gemini-2.0-flash-exp` | 1M tokens | Fastest | Background daemons, repetitive scanning         |

**Switch models via config:** (`~/.gemini/settings.json`)

```json
{ "model": "gemini-2.5-flash" }
```

---

## 3. Headless Execution (The Primary Swarm Mode)

Never use Gemini interactively when you can run it headless directly from the shell.

```bash
# One-shot headless execution
gemini -p "Run npm test and output a summary of failures"

# YOLO mode: executes tool calls (file edits, shell commands) without asking
gemini -y -p "Fix all failing tests in tests/core/"

# Load a prompt from a markdown file (complex dispatch)
gemini -p "$(cat dispatch_task.md)"

# Resume last crashed session
gemini -r latest
```

---

## 4. Safety Firewalls: The Policy Engine

The Policy Engine intercepts every single tool call before the LLM executes it. **You must configure this before running `-y` (YOLO) mode.**

**Location:** `~/.gemini/settings.json`

```json
{
  "policyEngine": {
    "rules": [
      { "effect": "permit", "resource": "files://./src/**", "action": "read" },
      { "effect": "permit", "resource": "files://./src/**", "action": "write" },
      { "effect": "deny", "resource": "files://./.env", "action": "*" },
      { "effect": "deny", "resource": "files://./node_modules/**", "action": "write" },
      { "effect": "confirm", "resource": "shell://**", "action": "execute" }
    ]
  }
}
```

- `permit` — Agent executes silently
- `deny` — Agent is blocked
- `confirm` — Agent waits for human keypress

---

## 5. Lifecycle Hooks

Hooks fire synchronously at defined points. The CLI waits for them to finish before proceeding. This injects dynamic context.

**Location:** `~/.gemini/settings.json`

```json
{
  "hooks": {
    "before_request": ["scripts/inject-git-log.sh"],
    "after_tool_call": ["scripts/run-lint.sh"],
    "on_error": ["scripts/alert-slack.sh"]
  }
}
```

---

## 6. Agent Skills (`SKILL.md`)

Gemini auto-discovers custom logic folders from `.gemini/skills/` (Project) or `~/.gemini/skills/` (User).

**Skill Folder Structure:**

```text
.gemini/skills/run-tests/
  SKILL.md          ← Instructions for the agent
  run_tests.sh      ← Helper script executed by SKILL.md rules
```

**`SKILL.md` format:**

```markdown
---
name: run-tests
description: Runs the full test suite and returns a structured pass/fail summary
---

Execute `npm test` using the run_tests.sh script.
Parse the output and return a JSON object with: { passed, failed, errors[] }
```

---

## 7. Proxy Routing (LiteLLM)

For enterprise/centralized Auth:

```bash
# Export proxy URL and run task
GEMINI_API_ENDPOINT=http://localhost:4000 gemini -p "task"
```

---

## 8. Ultra-Dex Swarm Role & Dispatch

- **Role:** Parallel Worker & Peripheral Process
- **Best For:** TDD loops, documentation generation, shell auditing, and massive parallel background extraction tasks.
- **Windows:** 3-5 Terminal Tabs.
- **$0 Strategy:** YOLO Mode (`-y`) relying entirely on the Policy Engine Firewall to ensure isolation.

### Dispatch Templates

```bash
# Terminal (TDD Daemon)
gemini -y -p "Run tests in /core/. Fix the source file of failing tests. Loop until pass."

# Terminal (Docs Generator)
gemini -y -p "Read /src/services/. Write proper JSDoc for exports missing them. Do not change logic."

# Terminal (Security Audit)
gemini -p "Scan src/. Find eval() usage without sanitization. Output markdown."
```
