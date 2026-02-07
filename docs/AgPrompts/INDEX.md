# 📁 Ultra-Dex Agent Prompts Index

All prompts for AI agents organized by category.

---
# 📚 Ultra-Dex Agent Prompts Index

This directory contains all agent prompts for Ultra-Dex development.

---

## 🚀 v4.1/v4.2 Implementation Prompts (NEW)

| File | Description | Priority |
|------|-------------|----------|
| [V4.1_V4.2_COMPLETE_PLAN.md](./V4.1_V4.2_COMPLETE_PLAN.md) | **Master plan for all v4.1/v4.2 features** | 🔴 P0 |
| [PROMPT_01_TEMPLATES.md](./PROMPT_01_TEMPLATES.md) | Complete 5 templates (SaaSKit, HabitStack, etc.) | 🔴 P0 ✅ |
| [PROMPT_02_INTEGRATIONS.md](./PROMPT_02_INTEGRATIONS.md) | Complete 11 integrations (remove stubs) | 🔴 P0 ✅ |
| [PROMPT_03_CLI_COMMANDS.md](./PROMPT_03_CLI_COMMANDS.md) | Enhance 10 CLI commands | 🟡 P1 ✅ |
| [PROMPT_04_AGENT_SYSTEM.md](./PROMPT_04_AGENT_SYSTEM.md) | Agent swarm & meta-orchestrator | 🟡 P1 ✅ |
| [PROMPT_05_MEMORY_GRAPH.md](./PROMPT_05_MEMORY_GRAPH.md) | Deep RAG & impact visualizer | 🟡 P1 ✅ |
| [PROMPT_06_DEVOPS.md](./PROMPT_06_DEVOPS.md) | Docker, K8s, CI/CD generators | 🟢 P2 ✅ |
| [PROMPT_07_DASHBOARD.md](./PROMPT_07_DASHBOARD.md) | React dashboard GUI | 🟢 P2 ✅ |

---

## 🎯 v4.0.0 Core Prompts

| File | Description |
|------|-------------|
| [V4_IMPLEMENTATION.md](./V4_IMPLEMENTATION.md) | Complete v4.0.0 implementation guide |
| [RELEASE_PROMPT.md](./RELEASE_PROMPT.md) | Release management tasks |
| [CONTEXT_PRUNING.md](./CONTEXT_PRUNING.md) | Memory auto-pruning implementation |
| [GOVERNANCE_AGENT.md](./GOVERNANCE_AGENT.md) | ADR enforcement agent |
| [CAPABILITY_CONTRACTS.md](./CAPABILITY_CONTRACTS.md) | Plugin capability definitions |

---

## 📖 Reference Prompts

| File | Description |
|------|-------------|
| [ALL_38_PROMPTS.md](./ALL_38_PROMPTS.md) | 38 core operational prompts |
| [MASTER_PROMPTS_INDEX.md](./MASTER_PROMPTS_INDEX.md) | Complete 240 prompts index |
| [REVIEW-PROMPT.md](./REVIEW-PROMPT.md) | Code review guidelines |

---

## 📁 Phase Prompts

Located in `phases/` subdirectory:
- PHASE5_PROMPTS.md through PHASE20_PROMPTS.md
- 16 phase-specific implementation guides

---

## 📋 Agent Execution Order

1. **PROMPT_01_TEMPLATES.md** → Complete 5 templates ✅
2. **PROMPT_02_INTEGRATIONS.md** → Remove all stubs ✅
3. **PROMPT_03_CLI_COMMANDS.md** → Enhance CLI ✅
4. **PROMPT_04_AGENT_SYSTEM.md** → Build swarm ✅
5. **PROMPT_05_MEMORY_GRAPH.md** → Deep RAG ✅
6. **PROMPT_06_DEVOPS.md** → Infrastructure ✅
7. **PROMPT_07_DASHBOARD.md** → GUI ✅

---

**Total: 30+ prompt files | v4.1+v4.2 = 7 new prompts**
| 16 | [PHASE16_PROMPTS.md](./phases/PHASE16_PROMPTS.md) |
| 17 | [PHASE17_PROMPTS.md](./phases/PHASE17_PROMPTS.md) |
| 18 | [PHASE18_PROMPTS.md](./phases/PHASE18_PROMPTS.md) |
| 19 | [PHASE19_PROMPTS.md](./phases/PHASE19_PROMPTS.md) |
| 20 | [PHASE20_PROMPTS.md](./phases/PHASE20_PROMPTS.md) |

---

## 🚀 Usage

```bash
# Copy any prompt to clipboard
cat docs/AgPrompts/V4_IMPLEMENTATION.md | pbcopy
# Paste into Cursor/Claude/etc.
```
