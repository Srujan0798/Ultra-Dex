# Gemini CLI: Official Deep Feature Playbook

**Document Status:** 2026 Official Documentation Verified  
**Source:** google-gemini/gemini-cli GitHub + developers.google.com/gemini-cli  
**Tool:** `gemini` CLI binary (open-source, by Google DeepMind)  
**Objective:** Stop treating Gemini CLI as a chat interface. Configure it as an automated, heavily firewalled, headless background swarm daemon.

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

**Free Tier:** Authenticated via your Google account, you get:
- **Gemini 2.5 Pro** (the default, most powerful model)
- **1 million token context window** per request
- **60 requests per minute**
- **$0 cost** as long as you stay within the quota

---

## 2. The Available Models

| Model | Context | Speed | Best Use |
|---|---|---|---|
| `gemini-2.5-pro` | 1M tokens | Slower | Deep architecture analysis, full-repo reasoning |
| `gemini-2.5-flash` | 1M tokens | Fast | Rapid generation, TDD loops, boilerplate |
| `gemini-2.0-flash-exp` | 1M tokens | Fastest | Background daemons, repetitive scanning |

Switch models by setting `model` in `~/.gemini/settings.json`:
```json
{ "model": "gemini-2.5-flash" }
```

---

## 3. Headless Execution (The Primary Swarm Mode)

Never use Gemini as a chatbot in interactive mode when you can run it headless.

```bash
# One-shot headless execution
gemini -p "Run npm test and output a summary of failures"

# YOLO mode: executes tool calls (file edits, shell commands) without asking
gemini -y -p "Fix all failing tests in tests/core/"

# Load a prompt from a markdown file (perfect for complex dispatch files)
gemini -p "$(cat dispatch_task.md)"

# Resume last crashed session
gemini -r latest
```

---

## 4. Safety Firewalls: The Policy Engine

The Policy Engine is a firewall that intercepts every single tool call before the LLM executes it. **You must configure this before running YOLO mode.**

**Location:** `~/.gemini/settings.json`

```json
{
  "policyEngine": {
    "rules": [
      { "effect": "permit", "resource": "files://./src/**", "action": "read" },
      { "effect": "permit", "resource": "files://./src/**", "action": "write" },
      { "effect": "deny",   "resource": "files://./.env", "action": "*" },
      { "effect": "deny",   "resource": "files://./node_modules/**", "action": "write" },
      { "effect": "confirm","resource": "shell://**", "action": "execute" }
    ]
  }
}
```

- `permit` — Agent executes silently
- `deny` — Agent is blocked and told the action is forbidden
- `confirm` — Agent must wait for your keypress approval

---

## 5. Lifecycle Hooks (`settings.json`)

Hooks are scripts that fire synchronously at defined points in the agentic loop. The CLI waits for them to finish before proceeding. This is how you inject live context without bloating your prompt.

```json
{
  "hooks": {
    "before_request": ["scripts/inject-git-log.sh"],
    "after_tool_call": ["scripts/run-lint.sh"],
    "on_error": ["scripts/alert-slack.sh"]
  }
}
```

**The Play:** Create `scripts/inject-git-log.sh` that outputs the last 10 Git commit messages. Gemini will automatically read this output and know exactly what changed before it edits any file.

---

## 6. Agent Skills (`SKILL.md`)

Skills are folders containing `SKILL.md` + supporting scripts. Gemini auto-discovers them from:
- Project-level: `.gemini/skills/`
- User-level: `~/.gemini/skills/`

**Example Skill Structure:**
```
.gemini/skills/run-tests/
  SKILL.md          ← Instructions for the agent
  run_tests.sh      ← Helper script
```

`SKILL.md` format:
```markdown
---
name: run-tests
description: Runs the full test suite and returns a structured pass/fail summary
---
Execute `npm test` using the run_tests.sh script.
Parse the output and return a JSON object with: { passed, failed, errors[] }
```

Once installed, just tell the agent: *"Use the run-tests skill to validate the test suite."*

---

## 7. Proxy Routing (For API Key Management)

If you need to centralize authentication across multiple engineers, route Gemini CLI through **LiteLLM Proxy**:

```bash
# Set the proxy in settings.json
# { "apiEndpoint": "http://localhost:4000" }

# Or via environment variable
GEMINI_API_ENDPOINT=http://localhost:4000 gemini -p "task"
```

LiteLLM intercepts all requests, provides centralized logging, and allows budget caps per user.

---

## 8. Ultra-Dex Swarm Dispatch Templates

Copy-paste these into your terminal tabs for parallel execution:

```bash
# Terminal A: TDD Daemon (loops until tests pass)
gemini -y -p "Run npm test in tests/core/. For each failing test, read the test file and the source file it's testing. Fix the source file. Loop until all tests pass. Output a summary when done."

# Terminal B: Documentation Generator
gemini -y -p "Read all files in src/services/. For each exported class and function with no JSDoc comment, write proper JSDoc documentation. Do not change any logic."

# Terminal C: Security Audit
gemini -p "Scan the entire src/ directory. List every location where user input is passed to a database query, shell command, or eval() without sanitization. Output as a markdown table."
```
