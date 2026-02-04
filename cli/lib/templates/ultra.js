export const ULTRA_TEMPLATE = `# ULTRA Context: {{PROJECT_NAME}}

> This is the source of truth for all AI agents. It defines boundaries, invariants, and collective memory.

## 🤖 Agent Roles
- **CTO (Orchestrator)**: Strategic planning and final architectural decisions.
- **Architect (Design)**: Design patterns, schema definitions, and system invariants.
- **Engineer (Implementation)**: Feature development, refactoring, and logic implementation.
- **Security (Audit)**: Vulnerability scanning and auth boundary enforcement.
- **QA (Verification)**: Testing strategies and quality gate enforcement.
- **DevOps (Delivery)**: CI/CD, deployment, and infrastructure.

## 🌍 Global Context
- **Project Type**: {{FRONTEND}} + {{DATABASE}}
- **Architectural Invariants**:
  - All data access must go through the Data Access Layer (DAL).
  - Use Functional Programming patterns where possible.
  - Fail fast with explicit error boundaries.
- **Tech Stack**:
  - Frontend: {{FRONTEND}}
  - Backend: Node.js (TypeScript)
  - Database: {{DATABASE}}
  - Auth: {{AUTH}}

## 🧠 Memory
- [{{DATE}}] Project initialized with Ultra-Dex CLI.
- [{{DATE}}] Defined core stack: {{FRONTEND}}, {{DATABASE}}, {{AUTH}}.
- [{{DATE}}] Initialized ULTRA.md for cross-agent context synchronization.
`;
