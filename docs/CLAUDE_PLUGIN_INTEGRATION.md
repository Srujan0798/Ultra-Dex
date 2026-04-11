# Claude Plugin Integration Plan for Ultra-Dex

## Executive Summary

This document outlines the integration of Claude's **Engineering** and **Data** plugins into Ultra-Dex's MCP architecture, enabling skill-based task routing and external tool execution.

---

## Current Architecture Analysis

### Ultra-Dex MCP Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    Ultra-Dex Core                               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │   Agent     │  │  MCP Server  │  │   AI Provider       │   │
│  │   Registry  │──│   Manager    │──│   Router            │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
│         │                 │                      │              │
│         ▼                 ▼                      ▼              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ Unified     │  │ Local Tools  │  │   External MCP      │   │
│  │ Memory      │  │ (Core)       │  │   Servers           │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component          | Path                                       | Purpose                      |
| ------------------ | ------------------------------------------ | ---------------------------- |
| `MCPServerManager` | `src/core/mcp/server-manager.ts`           | Manages MCP server lifecycle |
| `UnifiedRegistry`  | `src/core/agents/unified-registry.ts`      | Agent discovery & execution  |
| `UltraDexCore`     | `src/core/orchestration/ultra-dex-core.ts` | Main orchestration hub       |
| Local Tools        | `src/core/mcp/tools/*.ts`                  | In-process MCP tools         |

---

## Plugin → Ultra-Dex Mapping

### Engineering Plugin (10 Skills)

| Plugin Skill         | Ultra-Dex Agent  | Execution Path                                                                    | MCP Connector Required               |
| -------------------- | ---------------- | --------------------------------------------------------------------------------- | ------------------------------------ |
| `/architecture`      | @CTO / @Planner  | TaskRouter → AgentOrchestrator → MCP call → ADR generation → Memory store         | notion (docs), github (repo context) |
| `/code-review`       | @Reviewer        | GovernanceManager.gate() → MCP review → Policy check → Audit log → Output         | github, linear (ticket linkage)      |
| `/debug`             | @Debugger        | Memory.retrieve() → MCP debug workflow → Root-cause analysis → Fix proposal       | datadog, pagerduty (observability)   |
| `/incident-response` | @Operator (new)  | Circuit breaker trigger → MCP incident workflow → Runbook execution → Post-mortem | pagerduty, slack                     |
| `/tech-debt`         | @Reviewer + @CTO | Codebase scan → MCP analysis → Priority scoring → Backlog injection               | github, linear                       |
| `/system-design`     | @CTO / @Planner  | TaskRouter → AgentOrchestrator → MCP design → ADR generation                      | notion, confluence                   |
| `/testing-strategy`  | @Reviewer        | Test plan generation → MCP validation → Coverage analysis                         | github, jenkins                      |
| `/documentation`     | @CTO             | Documentation generation → MCP publish → Versioned docs                           | notion, confluence                   |
| `/standup`           | @Planner         | Activity aggregation → MCP summary → Formatted output                             | slack, linear                        |
| `/deploy-checklist`  | @DevOps          | Pre-deployment validation → MCP verification → Go/No-go                           | github, jenkins                      |

### Data Plugin (10 Skills)

| Plugin Skill              | Ultra-Dex Agent      | Execution Path                                                                         | MCP Connector Required          |
| ------------------------- | -------------------- | -------------------------------------------------------------------------------------- | ------------------------------- |
| `/sql-queries`            | @Database            | Natural language → MCP SQL gen → Schema validation (UnifiedMemory) → Execution sandbox | snowflake, bigquery, databricks |
| `/explore-data`           | @Backend + @Debugger | Dataset path → MCP profiling → Stats + anomalies → Memory cache                        | hex, amplitude                  |
| `/build-dashboard`        | @Frontend            | Spec → MCP viz gen → React component → Preview → Deploy check                          | hex, atlassian                  |
| `/statistical-analysis`   | @Backend (analytics) | Hypothesis → MCP analysis → Confidence intervals → Report → Audit                      | amplitude, bigquery             |
| `/validate-data`          | @Reviewer            | Schema contract → MCP validation → Drift detection → Alert                             | snowflake, databricks           |
| `/analyze`                | @Backend             | Query → MCP aggregation → Insights → Memory store                                      | bigquery, postgres              |
| `/create-viz`             | @Frontend            | Data → MCP viz gen → Python/matplotlib → Export                                        | jupyter, matplotlib             |
| `/data-context-extractor` | @Backend + @CTO      | Schema discovery → MCP skill gen → Knowledge base update                               | dbt, snowflake                  |
| `/data-visualization`     | @Frontend            | Dataset → MCP chart gen → Interactive export                                           | plotly, observable              |
| `/write-query`            | @Database            | NL → MCP dialect translation → Optimized SQL                                           | snowflake, bigquery, postgres   |

---

## Implementation Strategy

### Phase 1: Skill-to-Tool Mapping Layer (Week 1)

Create a new `PluginSkillRouter` that maps Claude plugin skills to Ultra-Dex MCP tool calls.

```typescript
// src/core/mcp/skill-router.ts
interface SkillMapping {
  skill: string; // e.g., "/code-review"
  plugin: string; // "engineering" | "data"
  agentCapabilities: string[];
  mcpTools: string[]; // Required MCP tool names
  requiredConnectors: string[];
  outputSchema: string; // Zod schema for validation
}

class PluginSkillRouter {
  private mappings: Map<string, SkillMapping> = new Map();

  registerSkill(mapping: SkillMapping): void;
  resolveSkill(skillName: string): SkillMapping;
  async executeSkill(
    skill: string,
    params: unknown,
    context: ExecutionContext
  ): Promise<SkillResult>;
}
```

### Phase 2: Connector Authentication Middleware (Week 1-2)

Ensure tokens propagate from Ultra-Dex's AuthService to MCP calls.

```typescript
// src/core/mcp/auth-middleware.ts
class ConnectorAuthMiddleware {
  intercept(serverId: string, toolName: string, params: unknown): Promise<unknown>;
  injectTokens(params: unknown, connectors: string[]): Promise<unknown>;
}
```

### Phase 3: Determinism Containment (Week 2)

Enforce reproducible MCP outputs.

```typescript
// src/core/mcp/determinism-guard.ts
interface DeterminismConfig {
  temperature: 0;
  seed: string;
  responseSchema: ZodSchema;
  maxRetries: number;
}

class DeterminismGuard {
  wrap<T>(fn: () => Promise<T>, config: DeterminismConfig): Promise<T>;
  logSeed(operation: string, seed: string): void;
}
```

### Phase 4: Memory Write Permissions (Week 2-3)

Enable agent-generated artifacts to be stored in UnifiedMemory.

```typescript
// Extension to UnifiedMemory
interface ArtifactStorage {
  storeArtifact(agentId: string, artifactType: string, content: unknown): Promise<string>;
  retrieveArtifact(artifactId: string): Promise<unknown>;
  linkArtifactToTask(artifactId: string, taskId: string): Promise<void>;
}
```

### Phase 5: Plugin Skill Implementations (Week 3-4)

Create concrete skill handlers for top 3 skills per plugin.

---

## Concrete Usage Examples

### Engineering — `/code-review` (Highest Leverage)

```bash
# CLI usage
ultra-dex skill engineering/code-review \
  --pr-url "https://github.com/org/repo/pull/123" \
  --focus "security,performance" \
  --output-format "json"

# Execution flow:
# 1. PluginSkillRouter.resolveSkill("/code-review")
# 2. AgentRegistry.discover(["code-review", "security-analysis"])
# 3. GovernanceManager.gate() - check policy
# 4. MCPServerManager.callTool("github", "get_pr", {url})
# 5. AgentOrchestrator.executeNexus(@Reviewer, diff)
# 6. Memory.storeArtifact(reviewResult, type: "code-review")
# 7. Output formatted results
```

### Engineering — `/architecture`

```bash
# CLI usage
ultra-dex skill engineering/architecture \
  --context "migrate monolith to microservices" \
  --constraints "budget:$50k,timeline:3months" \
  --output "adr"

# Execution flow:
# 1. PluginSkillRouter routes to @Planner + @CTO
# 2. Memory.retrieve("similar migrations")
# 3. MCP call to notion for existing ADRs
# 4. Multi-agent swarm generates ADR
# 5. Store in memory + notion via MCP
```

### Data — `/sql-queries`

```bash
# CLI usage
ultra-dex skill data/sql-queries \
  --natural-language "Show me monthly revenue by region for Q4" \
  --dialect "snowflake" \
  --validate-only true

# Execution flow:
# 1. PluginSkillRouter routes to @Database
# 2. MCP call to snowflake MCP server for schema
# 3. UnifiedMemory.retrieve("revenue queries")
# 4. Generate SQL with dialect-specific optimization
# 5. Schema validation against UnifiedMemory
# 6. Return SQL or execute in sandbox
```

---

## Blocking Considerations (MUST RESOLVE)

### 1. MCP Server Registry Gap ⚠️

**Issue:** Ultra-Dex has `MCPServerManager` but it routes by tool name, not by skill name.

**Current:**

```typescript
// server-manager.ts - routes by tool name
async callTool(serverId: string, toolName: string, params: unknown)
```

**Required:**

```typescript
// Need skill-to-tool mapping
async callSkill(plugin: string, skill: string, params: unknown)
// Maps /code-review → [github.get_pr, github.get_diff, ...]
```

**Action:** Implement `PluginSkillRouter` layer (see Phase 1).

### 2. Connector Authentication Propagation ⚠️

**Issue:** GitHub/Snowflake connectors require OAuth tokens. Does AuthService propagate to MCP calls?

**Audit Required:** Check `AgentCommunicationBus` for token passthrough.

**Action:** Add `ConnectorAuthMiddleware` (see Phase 2).

### 3. Determinism Containment ⚠️

**Issue:** MCP plugin outputs are probabilistic.

**Required:**

- Enforce `temperature: 0`
- Add `response_schema` validation at MCP boundary
- Log seed values for replay

**Action:** Implement `DeterminismGuard` (see Phase 3).

### 4. Memory Write Permissions ⚠️

**Issue:** Plugin outputs (ADRs, SQL) must be stored.

**Current:** `UnifiedMemory.store()` exists but no artifact-specific API.

**Required:**

```typescript
UnifiedMemory.storeArtifact(agentId, artifactType, content);
```

**Action:** Extend UnifiedMemory (see Phase 4).

---

## Code Changes Required

### New Files to Create

```
src/core/mcp/
├── skill-router.ts           # NEW: Plugin-to-tool mapping
├── auth-middleware.ts        # NEW: Token propagation
├── determinism-guard.ts      # NEW: Reproducibility layer
├── skills/                   # NEW: Skill implementations
│   ├── engineering/
│   │   ├── code-review.ts
│   │   ├── architecture.ts
│   │   └── index.ts
│   └── data/
│       ├── sql-queries.ts
│       ├── explore-data.ts
│       └── index.ts
└── connectors/               # NEW: Auth-aware connectors
    ├── github-connector.ts
    ├── snowflake-connector.ts
    └── base-connector.ts

src/core/agents/
└── roles/                    # NEW: Agent role definitions
    ├── operator.ts           # For /incident-response
    └── index.ts

src/core/memory/
└── artifact-storage.ts       # NEW: Artifact persistence
```

### Files to Modify

```
src/core/mcp/server-manager.ts
  - Add skill discovery methods
  - Integrate PluginSkillRouter

src/core/agents/unified-registry.ts
  - Add capability-based discovery
  - Add skill-to-agent mapping

src/core/memory/unified-api.ts
  - Add storeArtifact() method
  - Add artifact retrieval

src/core/orchestration/ultra-dex-core.ts
  - Initialize PluginSkillRouter
  - Add skill execution method

src/core/governance/governance-manager.ts
  - Add skill-specific policies
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/core/mcp/skill-router.test.ts
describe('PluginSkillRouter', () => {
  it('should resolve /code-review to correct tool chain', () => {});
  it('should validate required connectors', () => {});
  it('should enforce determinism config', () => {});
});
```

### Integration Tests

```typescript
// tests/integration/claude-plugin.test.ts
describe('Claude Plugin Integration', () => {
  it('should execute /code-review end-to-end', async () => {});
  it('should execute /sql-queries with Snowflake', async () => {});
  it('should fail gracefully when connector unavailable', async () => {});
});
```

---

## CLI Commands

```bash
# List available skills
ultra-dex skills list --plugin engineering
ultra-dex skills list --plugin data

# Execute a skill
ultra-dex skill engineering/code-review --pr-url "..."
ultra-dex skill data/sql-queries --query "..."

# Validate skill without execution
ultra-dex skill validate engineering/architecture --dry-run

# Get skill documentation
ultra-dex skills info engineering/code-review
```

---

## Timeline

| Week | Milestone                                                |
| ---- | -------------------------------------------------------- |
| 1    | Phase 1: Skill-to-tool mapping, Phase 2: Auth middleware |
| 2    | Phase 3: Determinism guard, Phase 4: Memory extensions   |
| 3    | Phase 5: Top 3 skill implementations                     |
| 4    | Integration tests, CLI commands, documentation           |

---

## Success Metrics

- [ ] 20 skills mapped (10 engineering + 10 data)
- [ ] 3+ MCP connectors working (github, snowflake, slack)
- [ ] < 500ms skill routing overhead
- [ ] 100% deterministic outputs (temperature: 0)
- [ ] All artifacts stored in UnifiedMemory
- [ ] Integration tests pass (100%)

---

## Appendix: Claude Plugin API Reference

### Engineering Plugin Skills

1. `/architecture` - ADR creation/evaluation
2. `/code-review` - Security, performance, correctness review
3. `/debug` - Structured debugging session
4. `/deploy-checklist` - Pre-deployment verification
5. `/documentation` - Technical docs, runbooks, READMEs
6. `/incident-response` - Triage, communicate, postmortem
7. `/standup` - Standup updates from activity
8. `/system-design` - Service/API architecture
9. `/tech-debt` - Identify, categorize, prioritize
10. `/testing-strategy` - Test plans and coverage

### Data Plugin Skills

1. `/analyze` - Answer data questions
2. `/build-dashboard` - Interactive HTML dashboards
3. `/create-viz` - Publication-quality visualizations
4. `/data-context-extractor` - Company-specific skill generation
5. `/data-visualization` - Python-based charts
6. `/explore-data` - Dataset profiling
7. `/sql-queries` - Cross-dialect SQL generation
8. `/statistical-analysis` - Hypothesis testing, trends
9. `/validate-data` - QA before sharing
10. `/write-query` - Optimized SQL per dialect

---

_Generated for Ultra-Dex v2.1.0_
