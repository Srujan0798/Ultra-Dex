# Ultra-Dex Comparison Matrix

Comparison focuses on workflow reliability, governance, and execution depth.

| Capability                      | Ultra-Dex | Generic AI Chat | IDE Copilot |
| ------------------------------- | --------- | --------------- | ----------- |
| Structured implementation plans | Yes       | Partial         | No          |
| Multi-agent orchestration       | Yes       | No              | Partial     |
| Persistent project memory       | Yes       | Partial         | Partial     |
| Governance + ADR checks         | Yes       | No              | No          |
| 21-step verification protocol   | Yes       | No              | No          |
| MCP context bus support         | Yes       | No              | Partial     |
| Interactive REPL mode           | Yes       | No              | N/A         |
| Voice input workflows           | Partial   | Partial         | Partial     |
| Code execution sandbox          | Partial   | No              | Partial     |
| Drift detection vs plan         | Yes       | No              | No          |
| Ops generators (Docker/K8s/CI)  | Yes       | No              | No          |
| Audit ledger for decisions      | Yes       | No              | No          |

## Notes

- `Partial` means capability exists but may require manual setup or additional configuration.
- This table is intentionally conservative. Features are marked `Yes` only when implemented in-repo.
