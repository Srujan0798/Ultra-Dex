# Project Structure

This repository is now organized around these top-level areas:

- `apps/` product applications (CLI, website, dashboard, cloud)
- `src/` core engine and orchestration logic
- `tests/` automated test suites
- `docs/` user and maintainer documentation
- `config/` runtime and environment configuration
- `scripts/` automation and operational scripts
- `archive/` historical/legacy material kept for traceability

## Root policy

Keep only essential project entry files in root (`README`, governance docs, package manifests, tool configs).  
Infrastructure files and one-off scripts are moved under `config/runtime/` and `scripts/legacy/`.

