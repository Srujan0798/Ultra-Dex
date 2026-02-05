# Ultra-Dex Phase 20 - Final Specifications

> **Source:** 03-quality-gates.md, 04-decision-ledger.md, MIGRATION-GUIDE.md
> **Total:** 10 New Prompts (#231-240)
> **Date:** Feb 5, 2026

---

## 📐 EXACT SCHEMAS & CONFIGS

---

### PROMPT 231: Quality Gate Configuration
> **Source:** 03-quality-gates.md
> **Status:** Specification

```
## Task: Implement Quality Gate Config

**Files to create:**
- config/quality-gate.json

**Requirement:**
- Implement the exact JSON schema defined in spec.
- Gates: `syntax`, `linting`, `testing`, `security`, `architectural`.
- Forbidden Patterns: `console.log`, `TODO:`.
- Retry Logic: `retry_attempts: 2`.

**Commit:** "config: Add strict quality-gate.json configuration"
```

---

### PROMPT 232: Decision Ledger Schema
> **Source:** 04-decision-ledger.md
> **Status:** Specification

```
## Task: Implement Ledger Schema

**Files to create:**
- cli/lib/ledger/schema.ts

**Requirement:**
- Define `LedgerBlock` interface.
- Fields: `block_id`, `timestamp`, `task_id`, `agent`, `decision`, `constraints_checked`.
- Storage: `.ultra/ledger.jsonl` (Append-only).
- Implement `appendBlock(data)` function.

**Commit:** "feat: Implement immutable decision ledger schema"
```

---

### PROMPT 233: Environment Defaults (Migration)
> **Source:** MIGRATION-GUIDE.md
> **Status:** DevOps

```
## Task: Update Environment Defaults

**Files to update:**
- cli/lib/config/defaults.js

**Requirement:**
- Set `CACHE_TIMEOUT = 30000` (30s).
- Set `CONCURRENCY_LIMIT = 100`.
- Set `MCP_PORT = 3001` (Default).
- Set `LOG_LEVEL = info`.
- Ensure backward compatibility with v3.3.x projects.

**Commit:** "config: Update default environment variables per v3.4.5 spec"
```

---

### PROMPT 234: RAG Defaults (Research)
> **Source:** AI-RESEARCH.md
> **Status:** AI Core

```
## Task: Implement RAG Defaults

**Files to create:**
- cli/lib/ai/rag-defaults.js

**Requirement:**
- Define default Stack based on research.
- MVP: Chroma DB + OpenAI Embeddings.
- Production: Pinecone + Cohere.
- Chunk strategy: 300-600 tokens with 15% overlap.

**Commit:** "ai: Define researched defaults for RAG pipeline"
```

---

### PROMPT 235: Migration Utility
> **Source:** MIGRATION-GUIDE.md
> **Status:** Utility

```
## Task: Version Check Utility

**Files to create:**
- cli/lib/commands/version-check.js

**Requirement:**
- Check running version against `package.json`.
- Warn if project config is outdated (pre v3.4.5).
- Suggest `ultra-dex config --reset` if config schema mismatch.

**Commit:** "feat: Add semantic version check utility"
```

---

### PROMPT 236: Structural Gate Logic
> **Source:** 03-quality-gates.md
> **Status:** Quality

```
## Task: Implement Structural Gates

**Files to create:**
- cli/lib/gates/structural.js

**Requirement:**
- Static analysis engine.
- Check 1: `syntax` (parse verify).
- Check 2: `linting` (run eslint/ruff).
- Check 3: `type_check` (run tsc --noEmit).
- Fail fast if any check returns exit code != 0.

**Commit:** "feat: Add structural static analysis gates"
```

---

### PROMPT 237: Architectural Gate Logic
> **Source:** 03-quality-gates.md
> **Status:** Quality

```
## Task: Implement Architectural Gates

**Files to create:**
- cli/lib/gates/architectural.js

**Requirement:**
- Semantic analysis engine.
- Check 1: `banned_patterns` (Regex match for forbidden imports/code).
- Check 2: `required_patterns` (Must have try/catch).
- Check 3: `security` (Secret scanning).

**Commit:** "feat: Add architectural pattern enforcement gates"
```

---

### PROMPT 238: Ledger Query Engine
> **Source:** 04-decision-ledger.md
> **Status:** Intelligence

```
## Task: Implement Ledger CLI

**Files to create:**
- cli/lib/commands/ledger.js

**Requirement:**
- Command: `ultra-dex ledger search "query"`.
- Scan `.ultra/ledger.jsonl`.
- Return formated ASCII table of matching decisions.
- Filter by `agent`, `date`, or `decision.selected_option`.

**Commit:** "feat: Add CLI for querying decision ledger"
```

---

### PROMPT 239: Project Template Update
> **Source:** MIGRATION-GUIDE.md
> **Status:** Templates

```
## Task: Update New Project Structure

**Files to update:**
- cli/lib/init/scaffold.js

**Requirement:**
- Ensure `init` creates the v3.4.5 structure:
  - `docs/CHECKLIST.md` (21-step)
  - `docs/AI-PROMPTS.md`
  - `.cursor/rules/`
- Remove legacy `.agents/` folder creation if present.

**Commit:** "refactor: Update project scaffolding to v3.4.5 standard"
```

---

### PROMPT 240: The Final Seal
> **Source:** Completion
> **Status:** Milestone

```
## Task: Project Finalization

**Files to create:**
- ULTRA_DEX_COMPLETE.md

**Requirement:**
- A final manifesto file in the root.
- Lists all 20 Phases.
- Declares the project "Feature Complete" for v4.0.
- Signifies readiness for global distribution.

**Commit:** "chore: Add project completion manifesto"
```
