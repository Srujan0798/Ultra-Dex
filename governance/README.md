# Ultra-Dex Governance

This directory contains project-level governance rules that are enforced by CLI
commands and MCP capability routing.

## Scope
- Architectural Decision Records (ADR) validation
- Capability contract checks for plugins/tools
- Risk-based approval workflows
- Decision ledger traceability

## Related Sources
- `docs/rfc/001-capability-contracts.md`
- `docs/rfc/002-governance-agent.md`
- `cli/lib/governance/`

## Enforcement Path
1. Plugin/tool request enters capability router.
2. Capability manifest is validated (scope, side effects, rate limits).
3. High-risk actions require explicit approval.
4. Decisions are logged to the ledger for audit.

## Operator Commands
- `ultra-dex governance check`
- `ultra-dex ledger query <term>`
- `ultra-dex risk list`
