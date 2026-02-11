# 🌌 Ultra-Dex Architecture: The v6.0.0 Meta-Layer

Ultra-Dex is an **AI Orchestration Meta-Layer** designed for high-autonomy, high-reliability software engineering. It moves beyond simple prompt-following to a **Cognitive Operating System** for agent swarms.

## 🏗️ Structural Foundation

The system is organized as a high-performance monorepo:

- `src/core/`: The Brain. Contains the Nexus orchestrator, tiered relational memory, and autonomous loops.
- `apps/cli/`: The Interface. High-speed terminal entry point for human-agent coordination.
- `apps/dashboard/`: The Observability Layer. Real-time visual monitoring of agent cognitive states.
- `src/services/security/`: The Steel Gate. Docker-hardened sandboxes and static code validation.

## 🧠 Cognitive Pillars

### 1. Nexus Orchestrator (`src/core/orchestration`)
The Nexus is the central reasoning hub. It decomposes high-level objectives into atomic, tier-specific tasks and manages the parallel execution of the agent swarm.

### 2. Ralph Loop: Autonomous Execution (`src/core/agents`)
The **Reasoning & Action Loop for Persistent Hub (Ralph)** allows agents to autonomously:
- PLAN: Multi-path architectural simulation.
- ACT: Code generation and execution in hardened Docker sandboxes.
- VERIFY: Automated technical checks via Protocol 21.
- RECOVER: Self-healing loops for failed tests or linting errors.

### 3. Relational Knowledge Graph (`src/core/memory`)
Ultra-Dex uses a three-tier memory system:
- Hot Tier (Memory): Active session context.
- Warm Tier (SQLite): Persistent observations and codebase mapping.
- Cold Tier (Knowledge Graph): Relational links between architectural decisions (WHY) and implemented code (WHAT).

## 🛡️ The Steel Gate: Protocol 21
Every agent output must pass through Protocol 21—a mandatory 21-step verification engine that automates:
- Technical Validation (Lint, Types, Build)
- Security Scans (Static analysis, risky patterns)
- Performance Audits (Complexity checks)

## 🌐 Bidirectional MCP Ecosystem
Ultra-Dex acts as a central **Model Context Protocol (MCP)** Hub:
- As a Host: Consumes context from external tools (GitHub, Docker, Google Search).
- As a Server: Exposes internal agent states and memory to IDEs (Cursor, VS Code) and other AI agents.

---

_Ultra-Dex v6.0.0 - Built for the GenAI 2.0 Era._