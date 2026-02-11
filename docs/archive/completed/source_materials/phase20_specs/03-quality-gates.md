# Quality Gate System

> **Status:** Draft Specification (v1.0)
> **Source:** Orchestration/Copilot.md (Strategic Requirement #3)

## 1. Overview

Quality Gates are the "enforcers" of the system. They block AI-generated code from being accepted or committed unless it meets specific, measurable criteria. This prevents "hallucinated" or broken code from entering the codebase.

## 2. Gate Types

### 2.1. Structural Gates (Static Analysis)

- **Syntax Check**: Does it parse?
- **Linting**: Does it pass `eslint` / `ruff`?
- **Type Check**: Does `tsc` pass without errors?

### 2.2. Functional Gates (Dynamic Analysis)

- **Unit Tests**: Do existing tests pass?
- **New Tests**: Did the AI generate a test for the new code?
- **Sandbox Run**: Does the code execute in the Docker sandbox without crashing?

### 2.3. Architectural Gates (Semantic Analysis)

- **Pattern Compliance**: Does it use the correct ORM pattern? (e.g., "Use Prisma, not raw SQL")
- **Forbidden Imports**: Does it import blocked libraries?
- **Security Scan**: Are there hardcoded secrets or known vuln patterns?

## 3. Configuration Template (`quality-gate.json`)

This file resides in the project root or `.ultra/config/`.

```json
{
  "strict_mode": true,
  "gates": {
    "syntax": {
      "enabled": true,
      "blocking": true
    },
    "linting": {
      "enabled": true,
      "blocking": true,
      "command": "npm run lint"
    },
    "testing": {
      "enabled": true,
      "blocking": false,
      "require_new_tests": true
    },
    "security": {
      "enabled": true,
      "scan_secrets": true
    },
    "architecture": {
      "banned_patterns": ["console.log", "TO-DO:", "var "],
      "required_patterns": ["export function", "try {", "} catch"]
    }
  },
  "on_failure": {
    "action": "reject",
    "retry_attempts": 2,
    "feedback_prompt": "Your code failed the quality gate: {{error}}. Please fix it."
  }
}
```

## 4. Integration

- **Pre-commit**: Runs purely static checks (fast).
- **CI/CD**: Runs full suite (slow).
- **Agent Loop**: The `Reviewer` agent uses this config to evaluate `Backend` agent outputs.
