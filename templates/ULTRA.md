# ULTRA Context: {{PROJECT_NAME}}

> This is the source of truth for all AI agents. It defines boundaries, invariants, and collective memory.

## 🤖 Agent Roles

- **Planner**: Task decomposition, roadmap sequencing, dependency management.
- **CTO**: Architecture decisions, standards, technical direction.
- **Backend**: APIs, services, business logic.
- **Frontend**: UI/UX, client-side state, accessibility.
- **Database**: Schema design, migrations, data integrity.
- **Security**: Threat modeling, auth boundaries, secrets hygiene.
- **QA**: Test strategy, verification gates, regression coverage.
- **DevOps**: CI/CD, infra, deployments, observability.

## 🌍 Global Context

- **Project Type**: {{FRONTEND}} + {{DATABASE}}
- **Architectural Invariants**:
  - All data access must go through the Data Access Layer (DAL).
  - Use functional, composable units where possible.
  - Fail fast with explicit error boundaries.
- **Tech Stack**:
  - Frontend: {{FRONTEND}}
  - Backend: Node.js (TypeScript)
  - Database: {{DATABASE}}
  - Auth: {{AUTH}}
  - Payments: {{PAYMENTS}}
  - Hosting: {{HOSTING}}

## 🧠 Memory

- [{{DATE}}] Project initialized with Ultra-Dex CLI.
- [{{DATE}}] Defined core stack: {{FRONTEND}}, {{DATABASE}}, {{AUTH}}.
- [{{DATE}}] Initialized ULTRA.md for cross-agent context synchronization.

## 📌 Decisions Log (Auto-Appended)

- [{{DATE}}] (AUTO) ULTRA.md created. Append architectural decisions below.
