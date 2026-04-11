# Claude Plugin Integration for Ultra-Dex

**Status**: Design Phase  
**Version**: 1.0.0  
**Date**: April 2026

## Executive Summary

This document outlines how to integrate Anthropic's Claude Engineering and Data plugins into the Ultra-Dex AI orchestration platform. Claude plugins provide 20 specialized skills (10 Engineering + 10 Data) that can be exposed as MCP tools within Ultra-Dex's ecosystem.

---

## Current Ultra-Dex MCP Architecture

Ultra-Dex already has a robust MCP infrastructure:

```
UltraDexCore
├── MCPServerManager (src/core/mcp/server-manager.ts)
│   ├── Built-in Servers (GitHub, Slack, Notion, Linear, Filesystem, Fetch, PostgreSQL, SQLite)
│   ├── Core Tools (agent-status, task-submit, memory-search, provider-info)
│   └── Local Tool Registration
├── UnifiedMemory (vector + graph + SQL)
├── AgentRegistry (capability-based agent selection)
└── GovernanceManager (policy enforcement)
```

### Key Capabilities Already Present

| Feature               | Ultra-Dex Implementation                                    | Status    |
| --------------------- | ----------------------------------------------------------- | --------- |
| MCP Server Management | `MCPServerManager` - dynamic server registration/start/stop | ✅ Ready  |
| Tool Registration     | `registerLocalTool()` for in-process tools                  | ✅ Ready  |
| Tool Discovery        | `discoverTools(capability)` + `listTools()`                 | ✅ Ready  |
| Memory Integration    | `UnifiedMemory` with vector/graph/sql tiers                 | ✅ Ready  |
| Agent Orchestration   | `AgentOrchestrator` + `AgentCoordinationProtocol`           | ✅ Ready  |
| Governance            | `GovernanceManager.gate()` for policy enforcement           | ✅ Ready  |
| Authentication        | Need to audit token propagation                             | ⚠️ Verify |
| Deterministic Output  | Need temperature:0 + schema validation                      | ⚠️ Add    |

---

## Claude Plugin Skills Overview

### Engineering Plugin (10 Skills)

| Skill                | Trigger Pattern             | Ultra-Dex Agent Mapping | MCP Tool Name              |
| -------------------- | --------------------------- | ----------------------- | -------------------------- |
| `/architecture`      | Create/evaluate ADR         | `@CTO` + `@Planner`     | `claude.architecture`      |
| `/code-review`       | Review code changes         | `@Reviewer`             | `claude.code_review`       |
| `/debug`             | Structured debugging        | `@Debugger`             | `claude.debug`             |
| `/deploy-checklist`  | Pre-deployment verification | `@DevOps`               | `claude.deploy_checklist`  |
| `/documentation`     | Write technical docs        | `@CTO`                  | `claude.documentation`     |
| `/incident-response` | Incident triage/post-mortem | `@Operator` (new)       | `claude.incident_response` |
| `/standup`           | Generate standup updates    | `@CTO`                  | `claude.standup`           |
| `/system-design`     | Design systems/services     | `@CTO` + `@Backend`     | `claude.system_design`     |
| `/tech-debt`         | Identify technical debt     | `@Reviewer` + `@CTO`    | `claude.tech_debt`         |
| `/testing-strategy`  | Design test strategies      | `@Debugger`             | `claude.testing_strategy`  |

### Data Plugin (10 Skills)

| Skill                     | Trigger Pattern                | Ultra-Dex Agent Mapping  | MCP Tool Name                 |
| ------------------------- | ------------------------------ | ------------------------ | ----------------------------- |
| `/analyze`                | Answer data questions          | `@Backend` (analytics)   | `claude.data_analyze`         |
| `/build-dashboard`        | Interactive HTML dashboard     | `@Frontend`              | `claude.build_dashboard`      |
| `/create-viz`             | Python visualizations          | `@Frontend`              | `claude.create_viz`           |
| `/data-context-extractor` | Extract company data knowledge | `@Backend`               | `claude.data_context`         |
| `/data-visualization`     | Create data visualizations     | `@Frontend`              | `claude.data_viz`             |
| `/explore-data`           | Profile datasets               | `@Backend` + `@Debugger` | `claude.explore_data`         |
| `/sql-queries`            | Write SQL (all dialects)       | `@Database`              | `claude.sql_query`            |
| `/statistical-analysis`   | Statistical methods            | `@Backend` (analytics)   | `claude.statistical_analysis` |
| `/validate-data`          | QA analysis before sharing     | `@Reviewer`              | `claude.validate_data`        |
| `/write-query`            | Optimized SQL generation       | `@Database`              | `claude.write_query`          |

---

## Integration Architecture

### Skill-to-Tool Mapping Layer

Since Ultra-Dex MCP currently routes by tool name, we need a mapping layer for skill routing:

```typescript
// src/core/mcp/skill-router.ts
export interface SkillMapping {
  skillName: string; // e.g., "/code-review"
  plugin: 'engineering' | 'data';
  agentId: string; // Ultra-Dex agent selector
  mcpToolName: string; // Tool name in MCP registry
  capabilities: string[]; // Required agent capabilities
  connectors?: string[]; // External services (github, snowflake, etc.)
}

export const CLAUDE_SKILL_MAPPINGS: SkillMapping[] = [
  // Engineering
  {
    skillName: '/code-review',
    plugin: 'engineering',
    agentId: 'reviewer',
    mcpToolName: 'claude.code_review',
    capabilities: ['code-review', 'quality-check'],
    connectors: ['github', 'gitlab'],
  },
  {
    skillName: '/architecture',
    plugin: 'engineering',
    agentId: 'cto',
    mcpToolName: 'claude.architecture',
    capabilities: ['architecture', 'adr-generation'],
    connectors: ['notion', 'github'],
  },
  {
    skillName: '/debug',
    plugin: 'engineering',
    agentId: 'debugger',
    mcpToolName: 'claude.debug',
    capabilities: ['debugging', 'root-cause-analysis'],
    connectors: ['datadog', 'pagerduty'],
  },
  {
    skillName: '/sql-queries',
    plugin: 'data',
    agentId: 'database',
    mcpToolName: 'claude.sql_query',
    capabilities: ['sql-generation', 'query-optimization'],
    connectors: ['snowflake', 'bigquery', 'databricks', 'postgres'],
  },
  // ... (16 more mappings)
];
```

### Execution Flow

```
User Request → Skill Router → Governance Gate → Agent Selection → MCP Skill Call
     ↓              ↓              ↓                ↓                    ↓
"/code-review"  Parse skill  Policy check   Find agents with    Claude API
   on PR #123   → claude.   → audit log    code-review         → Memory store
                code_review   checkpoint     capability
```

### Data Flow

```typescript
interface ClaudeSkillExecution {
  // Input
  skill: string; // '/code-review'
  context: {
    prUrl?: string;
    diff?: string;
    repoContext?: string;
  };
  options: {
    temperature: 0; // Deterministic
    maxTokens?: number;
    connectors?: string[]; // Active connectors
  };

  // Processing
  governanceCheck: boolean;
  agentRouting: string[]; // Selected agents
  mcpToolCall: string; // 'claude.code_review'

  // Output
  result: {
    findings: Finding[];
    summary: string;
    actionItems: string[];
  };
  audit: AuditLogEntry;
  memoryStore: MemoryEntry;
}
```

---

## Implementation Plan

### Phase 1: Core Skill Router (Week 1)

1. **Create Skill Router Module**

   ```typescript
   // src/core/mcp/skill-router.ts
   export class SkillRouter {
     constructor(private registry: MCPServerManager) {}

     async route(skillName: string, params: any): Promise<any> {
       const mapping = CLAUDE_SKILL_MAPPINGS.find((m) => m.skillName === skillName);
       if (!mapping) throw new Error(`Unknown skill: ${skillName}`);

       // Governance check
       await this.governance.gate({
         action: 'skill:execute',
         skill: skillName,
         user: params.user,
       });

       // Route to MCP tool
       return await this.registry.callTool('claude-plugin', mapping.mcpToolName, params);
     }
   }
   ```

2. **Register Claude Plugin MCP Server**
   ```typescript
   // In MCPServerManager._loadBuiltInServers()
   {
     id: 'claude-engineering',
     name: 'Claude Engineering Plugin',
     description: 'Claude Engineering skills as MCP tools',
     command: 'node',
     args: ['./mcp/servers/claude-engineering.js'],
     autoStart: true,
   },
   {
     id: 'claude-data',
     name: 'Claude Data Plugin',
     description: 'Claude Data skills as MCP tools',
     command: 'node',
     args: ['./mcp/servers/claude-data.js'],
     autoStart: true,
   }
   ```

### Phase 2: Agent Integration (Week 2)

Register Claude-capable agents:

```typescript
// In UltraDexCore._registerDefaultAgents()
const claudeAgents = [
  {
    id: 'claude-code-reviewer',
    name: 'Claude Code Reviewer',
    capabilities: ['code-review', 'claude-skill'],
    handler: async (input, context) => {
      const skillRouter = context.registry?.mcp?.skillRouter;
      return await skillRouter.route('/code-review', {
        prUrl: input.prUrl,
        diff: input.diff,
      });
    },
  },
  // ... more agents
];
```

### Phase 3: Connector Auth Propagation (Week 3)

**Current Gap**: Ultra-Dex needs token passthrough for GitHub/Snowflake connectors.

```typescript
// src/core/mcp/connector-auth.ts
export class ConnectorAuthMiddleware {
  async propagateTokens(userId: string, connectors: string[]): Promise<Record<string, string>> {
    const tokens: Record<string, string> = {};

    for (const connector of connectors) {
      const token = await this.authService.getConnectorToken(userId, connector);
      if (!token) {
        throw new Error(`Missing auth for connector: ${connector}`);
      }
      tokens[connector] = token;
    }

    return tokens;
  }
}
```

### Phase 4: Determinism Containment (Week 3)

```typescript
// src/core/mcp/determinism.ts
export class DeterministicMCPWrapper {
  private readonly DEFAULT_CONFIG = {
    temperature: 0,
    top_p: 1,
    seed: 42, // Fixed seed for reproducibility
  };

  async callWithValidation(toolName: string, params: any, schema: ZodSchema): Promise<any> {
    // Enforce deterministic settings
    const config = { ...params, ...this.DEFAULT_CONFIG };

    // Call MCP tool
    const result = await this.registry.callTool('claude-plugin', toolName, config);

    // Validate against schema
    const validated = schema.parse(result);

    // Log seed for replay
    this.observability.log('info', 'Deterministic MCP call', {
      tool: toolName,
      seed: config.seed,
      validation: 'passed',
    });

    return validated;
  }
}
```

---

## Memory Write Permissions

**Current State**: `UnifiedMemory` has write APIs, need to verify artifact storage.

```typescript
// Verify these APIs exist or implement:
interface UnifiedMemory {
  storeArtifact(
    agentId: string,
    artifactType: 'adr' | 'sql' | 'viz' | 'report',
    content: any,
    metadata: {
      skill: string;
      timestamp: string;
      connectors: string[];
    }
  ): Promise<string>; // Returns artifact ID
}
```

---

## Top 3 Skills - Concrete Usage Examples

### 1. `/code-review` (Highest Leverage)

```typescript
// Ultra-Dex CLI usage
const ultraDex = new UltraDexCore();
await ultraDex.initialize();

// Option A: Direct MCP tool call
const review = await ultraDex.callTool('claude-engineering', 'code_review', {
  prUrl: 'https://github.com/org/repo/pull/123',
  focus: ['security', 'performance', 'error-handling'],
  connectors: ['github'],
});

// Option B: Agent orchestration
const result = await ultraDex.execute(
  'Review PR #123 for security issues and performance bottlenecks'
);
// → Routes to @Reviewer agent with claude.code_review skill
```

**Output stored in memory:**

```json
{
  "artifactId": "review_2026_04_10_001",
  "type": "code_review",
  "skill": "/code-review",
  "findings": [{ "severity": "high", "file": "auth.ts", "issue": "Missing rate limiting" }],
  "prUrl": "https://github.com/org/repo/pull/123",
  "connectorRefs": [{ "type": "github", "id": "123" }]
}
```

### 2. `/architecture`

```typescript
// Create ADR for microservices migration
const adr = await ultraDex.callTool('claude-engineering', 'architecture', {
  prompt: 'ADR for migrating monolith to microservices',
  constraints: ['team of 5', '2-month timeline'],
  context: {
    currentStack: 'Node.js, PostgreSQL, Redis',
    traffic: '10k RPM',
  },
  connectors: ['notion'],
});

// ADR automatically stored in Notion + Ultra-Dex memory
```

### 3. `/sql-queries`

```typescript
// Natural language to SQL
const query = await ultraDex.callTool('claude-data', 'sql_query', {
  prompt: 'Monthly revenue by product category for Q1 2026',
  schema: 'ecommerce', // Reference from data-context-extractor
  dialect: 'snowflake',
  connectors: ['snowflake'],
});

// Returns validated, optimized SQL
// Stored in memory for future reuse
```

---

## CLI Integration

```bash
# Direct skill invocation
ultra-dex skill /code-review --pr https://github.com/org/repo/pull/123

# Via run command
ultra-dex run "Review PR #123" --skill code-review

# Architecture decision
ultra-dex skill /architecture \
  --prompt "ADR for Kafka vs SQS" \
  --store notion

# Data analysis
ultra-dex skill /sql-queries \
  --prompt "Top 10 customers by revenue" \
  --connector snowflake \
  --schema production

# List available skills
ultra-dex skill --list

# Show skill details
ultra-dex skill /code-review --help
```

---

## Configuration

```yaml
# config/claude-plugin.yaml
claude:
  plugins:
    engineering:
      enabled: true
      apiKey: ${CLAUDE_API_KEY}
      defaultModel: claude-3-7-sonnet-20250219
      skills:
        - /code-review
        - /architecture
        - /debug
        # ... (others)
    data:
      enabled: true
      apiKey: ${CLAUDE_API_KEY}
      defaultModel: claude-3-7-sonnet-20250219
      skills:
        - /sql-queries
        - /explore-data
        - /build-dashboard
        # ... (others)

  connectors:
    github:
      token: ${GITHUB_TOKEN}
      enabled: true
    notion:
      token: ${NOTION_TOKEN}
      enabled: true
    snowflake:
      account: ${SNOWFLAKE_ACCOUNT}
      user: ${SNOWFLAKE_USER}
      privateKey: ${SNOWFLAKE_KEY}
      enabled: true

  determinism:
    temperature: 0
    seed: 42
    validateSchema: true
```

---

## Risk Mitigation

| Risk                       | Mitigation                                                   |
| -------------------------- | ------------------------------------------------------------ |
| MCP Server Registry Gap    | Implement `SkillRouter` as mapping layer (Phase 1)           |
| Connector Auth Propagation | Add `ConnectorAuthMiddleware` (Phase 3)                      |
| Determinism                | Enforce `temperature:0` + seed + schema validation (Phase 4) |
| Memory Write Permissions   | Verify `storeArtifact()` API or implement (Phase 2)          |
| Rate Limits                | Implement circuit breaker + token optimizer                  |
| Cost                       | Use Ultra-Dex's existing cost optimization routing           |

---

## Testing Strategy

```typescript
// tests/mcp/claude-plugin.test.ts
describe('Claude Plugin Integration', () => {
  describe('/code-review skill', () => {
    it('routes to reviewer agent', async () => {
      const result = await skillRouter.route('/code-review', {
        prUrl: 'https://github.com/test/repo/pull/1',
      });
      expect(result.agent).toBe('reviewer');
      expect(result.findings).toBeDefined();
    });

    it('enforces governance policies', async () => {
      await expect(skillRouter.route('/code-review', { prUrl: 'private-repo' })).rejects.toThrow(
        'DeniedException'
      );
    });

    it('propagates GitHub tokens', async () => {
      const call = await skillRouter.route('/code-review', {
        prUrl: 'https://github.com/test/repo/pull/1',
      });
      expect(call.connectors.github.token).toBeDefined();
    });
  });
});
```

---

## Success Metrics

1. **Adoption**: % of tasks using Claude skills vs native tools
2. **Latency**: P95 skill execution time < 5s
3. **Quality**: Human rating of skill outputs > 4.0/5.0
4. **Determinism**: 100% reproducibility on same inputs
5. **Coverage**: All 20 skills available as MCP tools

---

## Next Steps

1. **Implement Skill Router** (`src/core/mcp/skill-router.ts`)
2. **Create Claude Plugin MCP Servers** (engineering + data)
3. **Add Connector Auth Middleware**
4. **Implement Determinism Wrapper**
5. **Write Integration Tests**
6. **Document CLI commands**

---

## Appendix: Qwen's Original Mapping Reference

### Engineering Plugin Integration

| Skill              | Ultra-Dex Agent  | Execution Path                                                                    | Connectors         |
| ------------------ | ---------------- | --------------------------------------------------------------------------------- | ------------------ |
| /architecture      | @CTO / @Planner  | TaskRouter → AgentOrchestrator → MCP call → ADR generation → Memory store         | notion, github     |
| /code-review       | @Reviewer        | GovernanceManager.gate() → MCP review → Policy check → Audit log → Output         | github, linear     |
| /debug             | @Debugger        | Memory.retrieve() → MCP debug workflow → Root-cause analysis → Fix proposal       | datadog, pagerduty |
| /incident-response | @Operator (new)  | Circuit breaker trigger → MCP incident workflow → Runbook execution → Post-mortem | pagerduty, slack   |
| /tech-debt         | @Reviewer + @CTO | Codebase scan → MCP analysis → Priority scoring → Backlog injection               | github, linear     |

### Data Plugin Integration

| Skill                 | Ultra-Dex Agent      | Execution Path                                                           | Connectors                      |
| --------------------- | -------------------- | ------------------------------------------------------------------------ | ------------------------------- |
| /sql-queries          | @Database            | NL → MCP SQL gen → Schema validation (UnifiedMemory) → Execution sandbox | snowflake, bigquery, databricks |
| /explore-data         | @Backend + @Debugger | Dataset path → MCP profiling → Stats + anomalies → Memory cache          | hex, amplitude                  |
| /build-dashboard      | @Frontend            | Spec → MCP viz gen → React component → Preview → Deploy check            | hex, atlassian                  |
| /statistical-analysis | @Backend (analytics) | Hypothesis → MCP analysis → Confidence intervals → Report → Audit        | amplitude, bigquery             |
| /validate-data        | @Reviewer            | Schema contract → MCP validation → Drift detection → Alert               | snowflake, databricks           |
