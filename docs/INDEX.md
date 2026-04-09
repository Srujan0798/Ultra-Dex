# Ultra-Dex Documentation Index

Status labels: `CURRENT` = modified in the last 7 days, `RECENT` = modified in the last 30 days, `STALE` = older.

## Start Here

| Document                                | Purpose                                        | Status  |
| --------------------------------------- | ---------------------------------------------- | ------- |
| [docs/ARCHITECTURE.md](ARCHITECTURE.md) | Canonical system design and runtime boundaries | CURRENT |
| [README.md](../README.md)               | Repo quickstart and install surface            | CURRENT |
| [docs/API.md](API.md)                   | Top-level API reference                        | CURRENT |
| [CONTRIBUTING.md](../CONTRIBUTING.md)   | Contributor workflow and expectations          | STALE   |

## Architecture

| Directory       | Description                                         | Key doc                                                                   | Status  |
| --------------- | --------------------------------------------------- | ------------------------------------------------------------------------- | ------- |
| `AgPrompts/`    | Prompt packs and phase-specific agent prompts       | [PHASE6_PROMPTS.md](AgPrompts/phases/PHASE6_PROMPTS.md)                   | CURRENT |
| `architecture/` | Architecture deep-dives and consolidated diagrams   | [CONSOLIDATED-ARCHITECTURE.md](architecture/CONSOLIDATED-ARCHITECTURE.md) | CURRENT |
| `core/`         | Core subsystem references and changelog-style notes | [CHANGELOG.md](core/CHANGELOG.md)                                         | STALE   |
| `meta/`         | Methodology, protocols, and capability contracts    | [03-METHODOLOGY.md](meta/03-METHODOLOGY.md)                               | STALE   |
| `rfc/`          | Formal design proposals and governance RFCs         | [002-governance-agent.md](rfc/002-governance-agent.md)                    | STALE   |
| `schemas/`      | JSON schemas and machine-readable contracts         | [ledger-schema.json](schemas/ledger-schema.json)                          | STALE   |
| `specs/`        | Feature specs and technical product definitions     | [NEURAL-DEX-SPEC.md](specs/NEURAL-DEX-SPEC.md)                            | STALE   |

## Guides

| Directory     | Description                                          | Key doc                                                    | Status  |
| ------------- | ---------------------------------------------------- | ---------------------------------------------------------- | ------- |
| `agents/`     | Agent catalog, usage patterns, and agent-facing docs | [AGENT_CUSTOMIZATION.md](agents/AGENT_CUSTOMIZATION.md)    | CURRENT |
| `ai-agents/`  | Legacy AI agent notes and agent set references       | [EXAMPLES.md](ai-agents/strategies/EXAMPLES.md)            | STALE   |
| `community/`  | Community-facing guides and collaboration docs       | [CONTRIBUTING.md](community/CONTRIBUTING.md)               | CURRENT |
| `education/`  | Educational material and training docs               | [CURRICULUM.md](education/CURRICULUM.md)                   | STALE   |
| `examples/`   | Example blueprints and sample project walkthroughs   | [SaaSKit-Complete.md](examples/SaaSKit-Complete.md)        | STALE   |
| `guides/`     | Setup, workflow, and advanced usage guides           | [QUICKSTART.md](guides/QUICKSTART.md)                      | CURRENT |
| `onboarding/` | Repo onboarding and operator entry docs              | [START-HERE.md](onboarding/START-HERE.md)                  | STALE   |
| `project/`    | Project-level references and working agreements      | [TODO-artifact-bug.md](project/TODO-artifact-bug.md)       | CURRENT |
| `templates/`  | Reusable documentation and process templates         | [01-CONTEXT-TEMPLATE.md](templates/01-CONTEXT-TEMPLATE.md) | STALE   |

## API Reference

| Directory     | Description                                     | Key doc                                                          | Status  |
| ------------- | ----------------------------------------------- | ---------------------------------------------------------------- | ------- |
| `api/`        | CLI and generated API references                | [cli-reference.md](api/cli-reference.md)                         | CURRENT |
| `ecosystem/`  | Ecosystem integrations and extension references | [EXAMPLE-STANDARDS.md](ecosystem/community/EXAMPLE-STANDARDS.md) | STALE   |
| `publishing/` | Package publishing and release surface docs     | [NPM_TOKEN_SETUP.md](publishing/NPM_TOKEN_SETUP.md)              | CURRENT |
| `reference/`  | Feature matrices and quick-reference material   | [FEATURES.md](reference/FEATURES.md)                             | STALE   |
| `udcf/`       | UDCF contracts and format references            | [schema.json](udcf/schema.json)                                  | CURRENT |

## Enterprise

| Directory        | Description                                        | Key doc                                                                             | Status  |
| ---------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------- | ------- |
| `certification/` | Certification notes and readiness artifacts        | [README.md](certification/README.md)                                                | STALE   |
| `compliance/`    | Compliance checklists and framework mappings       | [ENTERPRISE_COMPLIANCE_CHECKLIST.md](compliance/ENTERPRISE_COMPLIANCE_CHECKLIST.md) | STALE   |
| `enterprise/`    | Enterprise deployment, policy, and ops docs        | [ENTERPRISE_GUIDE.md](enterprise/ENTERPRISE_GUIDE.md)                               | STALE   |
| `governance/`    | Governance policy docs and enforcement notes       | [README.md](governance/README.md)                                                   | STALE   |
| `investors/`     | Investor and business narrative documents          | [investor-outreach.md](investors/investor-outreach.md)                              | STALE   |
| `legal/`         | Legal, disclosure, and policy files                | [SECURITY.md](legal/SECURITY.md)                                                    | STALE   |
| `marketing/`     | Marketing copy and outward-facing positioning docs | [DEMO-SCRIPT.md](marketing/DEMO-SCRIPT.md)                                          | STALE   |
| `security/`      | Security reviews, controls, and hardening notes    | [SECURITY-GUIDE.md](security/SECURITY-GUIDE.md)                                     | CURRENT |

## Testing

| Directory            | Description                                    | Key doc                                                               | Status  |
| -------------------- | ---------------------------------------------- | --------------------------------------------------------------------- | ------- |
| `analysis/`          | Deep audits and repo analysis outputs          | [action-planning-framework.md](analysis/action-planning-framework.md) | CURRENT |
| `audit/`             | Audit findings and remediation reports         | [ERROR_HANDLING.md](audit/ERROR_HANDLING.md)                          | CURRENT |
| `quality/`           | Quality gates, protocols, and scorecards       | [PROTOCOL-21.md](quality/PROTOCOL-21.md)                              | STALE   |
| `reports/`           | Generated reports and completion summaries     | [PROJECT_SUMMARY.md](reports/PROJECT_SUMMARY.md)                      | CURRENT |
| `testing/`           | Test reports, baselines, and validation assets | [SYSTEM_HEALTH_REPORT.json](testing/SYSTEM_HEALTH_REPORT.json)        | CURRENT |
| `verification-logs/` | Verification trails and audit logs             | [FINAL-AUDIT-REPORT.md](verification-logs/FINAL-AUDIT-REPORT.md)      | STALE   |

## Planning

| Directory   | Description                                 | Key doc                                                   | Status  |
| ----------- | ------------------------------------------- | --------------------------------------------------------- | ------- |
| `internal/` | Internal plans and implementation summaries | [IMPROVEMENT_SUMMARY.md](internal/IMPROVEMENT_SUMMARY.md) | STALE   |
| `ops/`      | Operational procedures and service runbooks | [DISASTER-RECOVERY.md](ops/DISASTER-RECOVERY.md)          | STALE   |
| `planning/` | Roadmaps, execution plans, and dispatches   | [EXECUTION_PLAN.md](planning/EXECUTION_PLAN.md)           | STALE   |
| `process/`  | Team process and execution protocol docs    | [CHECKLIST.md](process/CHECKLIST.md)                      | STALE   |
| `scripts/`  | Documentation-related maintenance scripts   | [validate-docs.js](scripts/validate-docs.js)              | CURRENT |
| `strategy/` | Product and technical strategy docs         | [TECHNICAL_ROADMAP.md](strategy/TECHNICAL_ROADMAP.md)     | STALE   |
