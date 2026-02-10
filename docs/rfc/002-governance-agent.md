# RFC 002: Governance Agent

## Summary
The Governance Agent enforces architecture decisions, design constraints, and policy rules. It blocks unsafe changes and creates an audit trail for critical decisions.

## Goals
- Enforce ADR compliance.
- Validate architecture constraints.
- Record decisions with provenance.

## Behavior
- Runs before code generation or merge.
- Emits violations with remediation steps.
- Writes decision logs to `docs/architecture/decisions/`.

## Status
- Drafted for v4.0.1
- Planned for v4.2
