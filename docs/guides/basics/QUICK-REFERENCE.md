# Ultra-Dex Quick Reference (v6.0.0)

> **One-page cheatsheet for the Cognitive Core Era.**

---

## 🚀 Quick Start

```bash
# Initialize Ultra-Dex
npx ultra-dex init

# Start the MCP Server (Connects Claude/Cursor)
npx ultra-dex serve

# Verify project health
npx ultra-dex verify --full
```

---

## 🎭 The 8 Core Agents (Personas)

| Icon | Agent | Focus | File Path |
| :--- | :--- | :--- | :--- |
| 🏛️ | **Architect** | Design & "The Moat" | `core-systems/ARCHITECT-PROMPT.md` |
| 💻 | **Coder** | Implementation | `core-systems/CODER-PROMPT.md` |
| 🪐 | **Reviewer** | Meta-Layer Audit | `core-systems/REVIEWER-PROMPT.md` |
| 🐞 | **Debugger** | Root Cause Analysis | `core-systems/DEBUGGER-PROMPT.md` |
| 🐝 | **Swarm** | Orchestration | `core-systems/SWARM-PROMPT.md` |
| 💾 | **Memory** | Context Retrieval | `core-systems/MEMORY-PROMPT.md` |
| ✅ | **QA** | Gatekeeping (Protocol 21) | `core-systems/QA-PROMPT.md` |
| ⚖️ | **Governor** | Policy Enforcement | `core-systems/GOVERNANCE-PROMPT.md` |

**Full Index:** [AgPrompts/INDEX.md](../../AgPrompts/INDEX.md)

---

## 📋 The 21-Step Verification Protocol

> **Command:** `npx ultra-dex verify`

1.  **Context**: Did you read the docs?
2.  **Intent**: Did you ask clarifying questions?
3.  **Dependency**: What breaks?
4.  **Architecture**: Fits the Moat?
5.  **Security**: Threat model check.
6.  **Performance**: Budget check.
7.  **Quality**: Lint/Format/Types.
8.  **Coverage**: >80% tests.
9.  **Error Handling**: No silent failures.
10. **Docs**: JSDoc/README.
11. **Unit Tests**: Pass.
12. **Integration Tests**: Pass.
13. **E2E Tests**: Smoke check.
14. **Security Scan**: Snyk/Audit.
15. **Benchmark**: Latency check.
16. **Accessibility**: WCAG check.
17. **Rollback**: Plan created.
18. **Feature Flag**: Configured.
19. **Monitoring**: Alerts set.
20. **Staging**: Verified.
21. **Production**: Ready.

---

## 💻 Essential CLI Commands

| Command | Description |
| :--- | :--- |
| `ultra-dex init` | Scaffold new project |
| `ultra-dex plan` | Create implementation plan |
| `ultra-dex run [file]` | Execute a plan |
| `ultra-dex verify` | Run 21-step checks |
| `ultra-dex serve` | Start MCP server |
| `ultra-dex context` | Update CONTEXT.md |
| `ultra-dex memory` | Query vector store |

---

## 🎯 Decision Trees

### Which Database?
- **Relational (SQL)**: Default. Use Postgres/Supabase.
- **Vector (Embeddings)**: Use Chroma/Pinecone.
- **Graph (Relationships)**: Use Neo4j.

### Which Model?
- **Architecting**: Claude 3.5 Sonnet / Opus.
- **Coding**: GPT-4o or Claude 3.5 Sonnet.
- **Refactoring**: GPT-4o (Lazy).
- **Docs**: Gemini 1.5 Pro (Long context).

---

## 🔗 Quick Links

- [**Master Roadmap**](../../ROADMAP.md)
- [**Agent Prompts**](../../AgPrompts/INDEX.md)
- [**Architecture**](../../architecture/README.md)
- [**Guides**](../README.md)

---

_Ultra-Dex v6.0.0 OVERPOWERED_