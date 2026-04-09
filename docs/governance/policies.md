# Governance Policies

## Capability Policy

- Every plugin/tool must declare capability metadata.
- Mutating tools must declare side effects.
- High-risk tools default to manual approval.

## Security Policy

- No hardcoded credentials in source.
- Secrets must be loaded from environment or secure storage.
- File-system writes are restricted to workspace paths by default.

## Decision Policy

- Significant architectural choices require an ADR record.
- ADR records must reference affected services/files.
- Reversals must explicitly supersede prior ADR IDs.

## Quality Policy

- P0 checks must pass before release tags.
- Critical vulnerabilities block deploy.
- Production release requires `production-ready` gate pass.
