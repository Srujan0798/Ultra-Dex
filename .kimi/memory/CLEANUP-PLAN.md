# BRUTAL CLEANUP & RESTRUCTURING PLAN
> Complete project overhaul for production readiness

## PROBLEMS IDENTIFIED

1. **Archive overload**: 471 MD files in archive/ (mostly old docs)
2. **Duplicate documentation**: Multiple versions of same docs
3. **Scattered planning files**: Plans in root, docs, .protocol, archive
4. **No clear hierarchy**: Business, marketing, docs all mixed
5. **Dead code**: Migrations and temporary files everywhere
6. **Inconsistent naming**: Some files uppercase, some lowercase

## CLEANUP STRATEGY

### Phase 1: Archive Consolidation
- Compress archive/docs/ into yearly/quarterly bundles
- Delete duplicate migration files
- Keep only essential backups

### Phase 2: Documentation Restructure
- Single source of truth for each topic
- Clear hierarchy: docs/ > topic/ > file.md
- Remove all "COMPLETE", "FINAL", "REPORT" duplicates

### Phase 3: Root Cleanup
- Keep only essential root files
- Move planning docs to .protocol/
- Archive temporary reports

### Phase 4: Production Polish
- Consistent naming conventions
- Clear README hierarchy
- Professional structure

## TARGET STATE

```
Ultra-Dex/
├── README.md                    # Main entry (clean, professional)
├── CLAUDE.md                    # Project guide
├── CHANGELOG.md                 # Version history
├── LICENSE                      # MIT
├── package.json                 # Dependencies
├── .protocol/                   # All planning & protocols
│   ├── state/                   # Current execution state
│   ├── orchestration.md         # How we work
│   └── execution.md             # Rules
├── docs/                        # Public documentation
│   ├── README.md                # Docs index
│   ├── architecture/            # System design
│   ├── guides/                  # User guides
│   ├── api/                     # API reference
│   └── strategic/               # V2.0+ planning
├── src/                         # Source code
├── apps/                        # Applications
├── agents/                      # Agent definitions
├── tests/                       # Test suites
├── scripts/                     # Build scripts
├── archive/                     # ONLY compressed backups
│   └── (minimal, organized)
└── .kimi/                       # Memory & context
    └── memory/                  # Workflow rules
```
