# V1.x Protocols - File Organization Guide

## Current Location
All V1.x protocol files are in: `reports/`

## Files to Move to `reports/v1-protocols/`

Create folder and move these files:
```bash
cd /Users/srujansai/Desktop/Ultra-Dex/reports
mkdir -p v1-protocols

# Move all V1.x files
mv v1.0-final-plan.md v1-protocols/
mv v1.0-dispatch-protocols.md v1-protocols/
mv v1.0-master-orchestration.md v1-protocols/
mv v1.1-truth-audit.md v1-protocols/
mv v1.2-execution-core.md v1-protocols/
mv v1.3-logging-spine.md v1-protocols/
mv v1.4-trace-system.md v1-protocols/
mv v1.5-bounded-execution.md v1-protocols/
mv v1.6-cleanup-controlled.md v1-protocols/
mv v1.7-enforcement.md v1-protocols/
mv v1.8-agent-mapping.md v1-protocols/
mv v1.9-validation-final.md v1-protocols/
mv v1.x-INDEX.md v1-protocols/
mv cto-master-prompt.md v1-protocols/

# Verify
ls v1-protocols/
```

## Final Structure
```
reports/
├── v1-protocols/           ← NEW FOLDER
│   ├── v1.x-INDEX.md       ← Start here
│   ├── cto-master-prompt.md
│   ├── v1.0-final-plan.md
│   ├── v1.0-dispatch-protocols.md
│   ├── v1.0-master-orchestration.md
│   ├── v1.1-truth-audit.md
│   ├── v1.2-execution-core.md
│   ├── v1.3-logging-spine.md
│   ├── v1.4-trace-system.md
│   ├── v1.5-bounded-execution.md
│   ├── v1.6-cleanup-controlled.md
│   ├── v1.7-enforcement.md
│   ├── v1.8-agent-mapping.md
│   └── v1.9-validation-final.md
│
├── cycle_1.md              ← Old cycle reports (keep separate)
├── cycle_2_report.md
├── ...
└── [other reports]
```

## Why This Organization
- V1.x protocols are for **pre-V2.0 stabilization**
- Cycle reports are **historical** (already executed)
- Keeps navigation clean
- Prevents confusion between old cycles and new protocols
