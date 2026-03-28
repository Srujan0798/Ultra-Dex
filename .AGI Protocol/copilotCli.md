# GitHub Copilot CLI: Official Deep Feature Playbook

**Document Status:** 2026 Official Documentation Verified  
**Topic:** Copilot CLI (Agentic Terminal Agent, Multi-Model, Parallel Fleet)  
**Objective:** Extract maximum autonomous coding performance from the `copilot` binary.

---

## 1. What It Is

Copilot CLI is GitHub's autonomous coding agent that runs entirely in the terminal. It is NOT just a shell command helper — it is a full agentic development environment that can plan, build, review, and remember across sessions.

**Requires:** Active GitHub Copilot subscription (Plus, Pro, Business, or Enterprise).

---

## 2. Shell Commands (Top-Level)

| Command | Purpose |
|---|---|
| `copilot` | Launch full interactive agentic session |
| `copilot init` | Bootstrap custom instructions (`.github/copilot-instructions.md`) in current repo |
| `copilot login` / `copilot logout` | Authenticate with GitHub |
| `copilot update` | Download & install the latest version |
| `copilot version` | Show current version |
| `copilot plugin` | Manage installed plugins |
| `copilot help [topic]` | Help on config, commands, environment, logging, permissions |

---

## 3. In-Session Slash Commands

Once inside an interactive session (`copilot`), these slash commands control the agent:

| Command | Purpose |
|---|---|
| `/plan` | Create a structured implementation plan before writing code |
| `/delegate` | Push changes to remote repo with AI-generated pull request |
| `/fleet` | **Spawn parallel sub-agents** for concurrent task execution |
| `/review` | Run code review agent on current directory changes |
| `/mcp` | Manage MCP server configurations |
| `/model` | Switch AI model mid-conversation |
| `/context` | Visualize context window token usage |
| `/compact` | Summarize conversation history to free up context space |
| `/diff` | Review all changes made in the current session |
| `/clear` | Reset the context of the current session |

---

## 4. Multi-Model Support

You can switch models mid-session using `/model`. Available models include:
- **Claude Opus 4.6** (Anthropic)
- **Claude Sonnet 4.6** (Anthropic)
- **GPT-5.3-Codex** (OpenAI)
- **Gemini 3 Pro** (Google)

---

## 5. Specialized Built-In Agents

| Agent | Role |
|---|---|
| `Explore` | Codebase analysis and understanding |
| `Task` | Running builds and tests |
| `Code Review` | High-signal change reviews |
| `Plan` | Implementation planning |

These agents can run **in parallel** via `/fleet`.

---

## 6. Key Advanced Features

* **MCP Support:** Extensible through Model Context Protocol servers, plugins, and custom skills.
* **Repository Memory:** Remembers conventions and patterns across sessions.
* **Custom Instructions:** Use `copilot init` to create `.github/copilot-instructions.md` for project-specific rules (similar to `AGENTS.md`).
* **Autopilot Mode:** For tasks where Copilot works fully autonomously without asking for approval.
* **Plan Mode:** Copilot analyzes requests, asks clarifying questions, builds structured plan first.
* **GitHub Deep Integration:** Manages remote repos, issues, PRs, and GitHub Actions using natural language.

---

## 7. Swarm Role Assignment

* **Role:** Autonomous GitHub-Integrated Builder
* **Best For:** PR workflows, code reviews, GitHub Actions automation, and fleet-based parallel task execution.
* **Windows:** 1–3 (Use `/fleet` for internal parallelism)
* **$0 Strategy:** Included with your GitHub Copilot subscription. No additional API costs.
