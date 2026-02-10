# 📁 Ultra-Dex Agent Prompts Index

> **MASTER INDEX** - Organized for Agent Clarity.
> **Last Updated:** Feb 10, 2026

---

## 🚀 ACTIVE (Start Here)

These are the currently active missions.

| File | Description | Priority |
| :--- | :--- | :--- |
| [**PROMPT_08_ECOSYSTEM.md**](./active/PROMPT_08_ECOSYSTEM.md) | **v4.3 Ecosystem**: Docs, VS Code Ext, Desktop App | ✅ Completed |
| [**PROMPT_09_V5_MOONSHOTS.md**](./active/PROMPT_09_V5_MOONSHOTS.md) | **v5.0 Moonshots**: Voice, Computer Use, 3D Viz | 🔵 P4 (Active) |

---

## 🎭 CORE PERSONAS (System Prompts)

**Mandatory:** Use these prompts to initialize Agent Roles.

| File | Role | Focus |
| :--- | :--- | :--- |
| [**ARCHITECT-PROMPT.md**](./core-systems/ARCHITECT-PROMPT.md) | **Architect** | Design & Structure |
| [**CODER-PROMPT.md**](./core-systems/CODER-PROMPT.md) | **Coder** | Implementation |
| [**REVIEWER-PROMPT.md**](./core-systems/REVIEW-PROMPT.md) | **Reviewer** | Quality Control |
| [**DEBUGGER-PROMPT.md**](./core-systems/DEBUGGER-PROMPT.md) | **Debugger** | Fixes & Root Cause |
| [**SWARM-PROMPT.md**](./core-systems/SWARM-PROMPT.md) | **Orchestrator** | Task Management |
| [**MEMORY-PROMPT.md**](./core-systems/MEMORY-PROMPT.md) | **Librarian** | Context Retrieval |
| [**QA-PROMPT.md**](./core-systems/QA-PROMPT.md) | **Gatekeeper** | Verification |
| [**GOVERNANCE-PROMPT.md**](./core-systems/GOVERNANCE-PROMPT.md) | **Governor** | Compliance |

---

## 📜 CORE SPECIFICATIONS (Reference)

**Reference:** Read these for technical implementation details.

| File | Description | Focus |
| :--- | :--- | :--- |
| [**AGENT_SWARM_SPEC.md**](./core-systems/AGENT_SWARM_SPEC.md) | **Swarm Engine**: Multi-Agent Logic | AI |
| [**MEMORY_SPEC.md**](./core-systems/MEMORY_SPEC.md) | **UltraMemory**: RAG & Graph DB Specs | Data |
| [**QA_SPEC.md**](./core-systems/QA_SPEC.md) | **Protocol 21**: Mandatory Verification Steps | Quality |
| [**MCP_SERVER_SPEC.md**](./core-systems/MCP_SERVER_SPEC.md) | **MCP Host**: Connection & Protocol Specs | Infra |
| [**PROMPT_TEMPLATE.md**](./core-systems/PROMPT_TEMPLATE.md) | **Standard Template**: For new prompts | Meta |

---

## 🏛️ ARCHIVE (Completed)

Historical prompts for v4.x. Use only for reference.

| File | Description | Status |
| :--- | :--- | :--- |
| [PROMPT_01_TEMPLATES.md](./archive/v4.x/PROMPT_01_TEMPLATES.md) | SaaS Templates & Scaffolds | ✅ Done |
| [PROMPT_02_INTEGRATIONS.md](./archive/v4.x/PROMPT_02_INTEGRATIONS.md) | Generic Integrations | ✅ Done |
| [PROMPT_03_CLI_COMMANDS.md](./archive/v4.x/PROMPT_03_CLI_COMMANDS.md) | Core CLI Enhancements | ✅ Done |
| [PROMPT_04_AGENT_SYSTEM.md](./archive/v4.x/PROMPT_04_AGENT_SYSTEM.md) | Agent Swarm mvp | ✅ Done |
| [PROMPT_05_MEMORY_GRAPH.md](./archive/v4.x/PROMPT_05_MEMORY_GRAPH.md) | Memory Graph mvp | ✅ Done |
| [PROMPT_06_DEVOPS.md](./archive/v4.x/PROMPT_06_DEVOPS.md) | Docker & K8s Generators | ✅ Done |
| [PROMPT_07_DASHBOARD.md](./archive/v4.x/PROMPT_07_DASHBOARD.md) | React Dashboard | ✅ Done |

---

## 📋 Review Policy

When an agent starts a task:
1.  **Select the Persona** from the CORE PERSONAS list.
2.  **Consult the Specs** in CORE SPECIFICATIONS for rules.
3.  **Ignore ARCHIVE** unless debugging legacy code.