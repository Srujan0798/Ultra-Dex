# Claude Skills Integration for Ultra-Dex (Model-Agnostic)

**Status**: Ready for Implementation  
**Version**: 2.0 - Model-Agnostic Architecture

---

## Core Concept: Universal Skill Layer

Claude's Engineering & Data plugins provide **20 workflow patterns** (skills) that are valuable regardless of the underlying AI provider. Ultra-Dex can implement these as **provider-agnostic capabilities** that route to the best available model.

```
Ultra-Dex Architecture:
┌─────────────────────────────────────────────────────────────────┐
│                     SKILL LAYER (20 Skills)                      │
│  /code-review  /architecture  /sql-queries  /build-dashboard    │
└──────────────────┬──────────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────────┐
│              AGENT ORCHESTRATOR                                  │
│  @Reviewer  @CTO  @Database  @Frontend  @Debugger  @Operator     │
└──────────────────┬──────────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────────┐
│              AI ROUTER (Model-Agnostic)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  GPT-4o  │  │ Claude   │  │ DeepSeek │  │  Groq    │        │
│  │          │  │  Sonnet  │  │   V3     │  │ Llama 4  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Skill Implementations (Provider-Agnostic)

Each Claude skill becomes an **Ultra-Dex Agent** that can execute on ANY provider:

### Engineering Skills (10)

| Skill                | Agent                | Capability Prompt                                    | Best Provider |
| -------------------- | -------------------- | ---------------------------------------------------- | ------------- |
| `/code-review`       | `@Reviewer`          | "Review code for security, performance, correctness" | Claude/GPT-4o |
| `/architecture`      | `@CTO` + `@Planner`  | "Create/evaluate ADRs with trade-offs"               | Claude Sonnet |
| `/debug`             | `@Debugger`          | "Structured debugging: reproduce, isolate, diagnose" | Claude/GPT-4o |
| `/deploy-checklist`  | `@DevOps`            | "Pre-deployment verification checklist"              | GPT-4o        |
| `/documentation`     | `@CTO`               | "Write technical docs, runbooks, READMEs"            | Claude        |
| `/incident-response` | `@Operator`          | "Incident triage, communication, post-mortem"        | Claude        |
| `/standup`           | `@CTO`               | "Summarize commits, PRs, ticket moves"               | GPT-4o-mini   |
| `/system-design`     | `@CTO` + `@Backend`  | "Design systems, APIs, data models"                  | Claude Sonnet |
| `/tech-debt`         | `@Reviewer` + `@CTO` | "Identify, categorize, prioritize debt"              | Claude        |
| `/testing-strategy`  | `@Debugger`          | "Design test strategies and plans"                   | GPT-4o        |

### Data Skills (10)

| Skill                     | Agent                    | Capability Prompt                           | Best Provider |
| ------------------------- | ------------------------ | ------------------------------------------- | ------------- |
| `/sql-queries`            | `@Database`              | "Write optimized SQL across dialects"       | GPT-4o/Claude |
| `/explore-data`           | `@Backend` + `@Debugger` | "Profile dataset shape and quality"         | Claude        |
| `/build-dashboard`        | `@Frontend`              | "Create interactive HTML dashboards"        | Claude        |
| `/analyze`                | `@Backend` (analytics)   | "Answer data questions, trends, segments"   | Claude        |
| `/create-viz`             | `@Frontend`              | "Publication-quality Python visualizations" | Claude        |
| `/statistical-analysis`   | `@Backend`               | "Statistical methods, hypothesis testing"   | Claude        |
| `/validate-data`          | `@Reviewer`              | "QA analysis before sharing"                | Claude        |
| `/write-query`            | `@Database`              | "Optimized SQL with best practices"         | GPT-4o        |
| `/data-context-extractor` | `@Backend`               | "Extract company data knowledge"            | Claude        |
| `/data-visualization`     | `@Frontend`              | "Create effective visualizations"           | Claude        |

---

## Implementation: Skill as Agent

### 1. Skill Agent Definition

```typescript
// src/core/agents/skills/code-review.ts
import { defineSkill } from '../skill-framework';

export const codeReviewSkill = defineSkill({
  id: '/code-review',
  name: 'Code Review',
  description: 'Review code for security, performance, and correctness',

  // Agent assignment
  agent: {
    id: 'reviewer',
    capabilities: ['code-review', 'quality-check', 'security-audit'],
  },

  // Provider selection strategy
  routing: {
    // Preferred providers in order
    providerPriority: ['anthropic', 'openai', 'deepseek'],
    // Fallback if preferred unavailable
    fallback: true,
    // Task classification for router
    taskType: 'code-analysis',
    complexity: 'high',
  },

  // Input schema
  input: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'Code to review' },
      language: { type: 'string', description: 'Programming language' },
      focus: {
        type: 'array',
        items: { enum: ['security', 'performance', 'correctness', 'style'] },
        default: ['security', 'performance', 'correctness'],
      },
      prUrl: { type: 'string', description: 'Optional PR URL for context' },
    },
    required: ['code'],
  },

  // Output schema
  output: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      findings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            severity: { enum: ['critical', 'high', 'medium', 'low'] },
            category: { enum: ['security', 'performance', 'correctness', 'style'] },
            file: { type: 'string' },
            line: { type: 'number' },
            message: { type: 'string' },
            suggestion: { type: 'string' },
          },
        },
      },
      actionItems: { type: 'array', items: { type: 'string' } },
    },
  },

  // Prompt template (provider-agnostic)
  promptTemplate: `
You are an expert code reviewer. Review the following {{language}} code:

Focus areas: {{focus}}

Code:
\`\`\`{{language}}
{{code}}
\`\`\`

{{#if prUrl}}
PR Context: {{prUrl}}
{{/if}}

Provide:
1. Executive summary (2-3 sentences)
2. Findings with severity, category, file/line references
3. Specific, actionable suggestions
4. Prioritized action items
`,

  // Determinism settings
  config: {
    temperature: 0,
    maxTokens: 4000,
    responseFormat: 'json',
  },

  // Memory storage
  memory: {
    storeInput: true,
    storeOutput: true,
    tags: ['code-review', 'quality'],
    searchable: true,
  },

  // Governance
  governance: {
    requiresApproval: false,
    auditLevel: 'full',
    dataClassification: 'code',
  },

  // Connectors (optional)
  connectors: ['github', 'gitlab'],
});
```

### 2. Skill Execution Flow

```typescript
// src/core/skills/skill-executor.ts
export class SkillExecutor {
  constructor(
    private agentRegistry: AgentRegistry,
    private aiRouter: SmartAIRouter,
    private memory: UnifiedMemory,
    private governance: GovernanceManager
  ) {}

  async execute(skillId: string, input: any, options: ExecutionOptions = {}) {
    const skill = this.getSkill(skillId);

    // 1. Governance check
    await this.governance.gate({
      action: 'skill:execute',
      skill: skillId,
      user: options.userId,
      input,
    });

    // 2. Get or create agent
    const agent = await this.agentRegistry.getOrCreate(skill.agent.id);

    // 3. Build messages from template
    const messages = this.buildPrompt(skill.promptTemplate, input);

    // 4. Route to best provider
    const result = await this.aiRouter.routeRequest(messages, skill.routing.providerPriority[0], {
      ...skill.config,
      fallback: skill.routing.fallback,
      metadata: {
        taskType: skill.routing.taskType,
        complexity: skill.routing.complexity,
      },
    });

    // 5. Parse and validate output
    const parsed = this.parseOutput(result.content, skill.output);

    // 6. Store in memory
    await this.memory.store(
      {
        type: 'skill-execution',
        skill: skillId,
        input,
        output: parsed,
        provider: result.provider,
        agent: skill.agent.id,
        timestamp: new Date().toISOString(),
      },
      {
        tags: skill.memory.tags,
        searchable: skill.memory.searchable,
      }
    );

    // 7. Audit log
    await this.governance.audit({
      action: 'skill:executed',
      skill: skillId,
      user: options.userId,
      provider: result.provider,
      success: true,
    });

    return {
      skill: skillId,
      result: parsed,
      provider: result.provider,
      agent: skill.agent.id,
    };
  }
}
```

### 3. Model-Agnostic Routing

```typescript
// Ultra-Dex routes based on task, not provider
const result = await ultraDex.executeSkill('/code-review', {
  code: 'function add(a, b) { return a + b; }',
  language: 'javascript',
  focus: ['security', 'performance'],
});

// Router decides:
// - Task: code-analysis (complexity: high)
// - Preferred: anthropic → openai → deepseek
// - Claude available? → Use Claude Sonnet
// - Claude down? → Fallback to GPT-4o
// - Cost constraint? → Try DeepSeek V3 first
```

---

## Provider Capability Matrix

| Skill              | Claude | GPT-4o | DeepSeek | Groq/Llama | Grok | Best For              |
| ------------------ | ------ | ------ | -------- | ---------- | ---- | --------------------- |
| Code Review        | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐     | ⭐⭐       | ⭐⭐ | Security, nuance      |
| Architecture       | ⭐⭐⭐ | ⭐⭐   | ⭐⭐     | ⭐         | ⭐   | Trade-off analysis    |
| SQL Generation     | ⭐⭐   | ⭐⭐⭐ | ⭐⭐⭐   | ⭐⭐       | ⭐   | Syntax accuracy       |
| Data Analysis      | ⭐⭐⭐ | ⭐⭐   | ⭐⭐     | ⭐⭐       | ⭐   | Statistical reasoning |
| Documentation      | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐     | ⭐⭐       | ⭐⭐ | Technical writing     |
| Incident Response  | ⭐⭐⭐ | ⭐⭐   | ⭐⭐     | ⭐         | ⭐⭐ | Crisis communication  |
| Dashboard Building | ⭐⭐⭐ | ⭐⭐   | ⭐⭐     | ⭐         | ⭐   | HTML/JS generation    |

---

## Startup Use Cases

### For Engineering Teams

```typescript
// Your users can call skills via SDK
import { UltraDex } from '@ultra-dex/sdk';

const client = new UltraDex({ apiKey: 'your-key' });

// Code review on any provider
const review = await client.skills.codeReview({
  code: await fs.readFile('auth.ts', 'utf8'),
  focus: ['security'],
  provider: 'auto', // Let Ultra-Dex decide
});

// Architecture decision
const adr = await client.skills.architecture({
  prompt: 'Migrate monolith to microservices',
  constraints: ['team of 5', '2 months'],
  storeIn: 'notion', // Optional connector
});
```

### For Data Teams

```typescript
// Natural language to SQL
const query = await client.skills.sqlQuery({
  prompt: 'Monthly revenue by product category',
  dialect: 'snowflake',
  schema: 'production', // From data-context-extractor
});

// Returns: { sql: 'SELECT...', explanation: '...', confidence: 0.95 }

// Build dashboard
const dashboard = await client.skills.buildDashboard({
  title: 'Revenue Dashboard',
  dataSource: query.sql,
  charts: ['line', 'bar', 'kpi-cards'],
});

// Returns: HTML file path or hosted URL
```

---

## CLI Integration

```bash
# Your users can use skills via CLI
ultra-dex skill /code-review --file src/auth.ts --focus security

# With explicit provider (optional)
ultra-dex skill /code-review --file src/auth.ts --provider claude
ultra-dex skill /code-review --file src/auth.ts --provider gpt4o
ultra-dex skill /code-review --file src/auth.ts --provider deepseek

# SQL generation
ultra-dex skill /sql-queries \
  --prompt "Top 10 customers by revenue" \
  --dialect snowflake \
  --provider gpt4o

# Architecture with storage
ultra-dex skill /architecture \
  --prompt "Kafka vs SQS for event streaming" \
  --store notion \
  --provider claude
```

---

## API Endpoints for Your Startup

```typescript
// POST /api/v1/skills/{skillId}/execute
{
  "input": {
    "code": "function add(a, b) { return a + b; }",
    "language": "javascript"
  },
  "options": {
    "provider": "auto", // or "claude", "gpt4o", "deepseek"
    "strategy": "quality", // or "cost", "latency"
    "connectors": ["github"]
  }
}

// Response
{
  "skill": "/code-review",
  "result": {
    "summary": "Code is simple but lacks input validation",
    "findings": [...],
    "actionItems": [...]
  },
  "providerUsed": "anthropic",
  "model": "claude-3-7-sonnet-20250219",
  "latencyMs": 1245,
  "costUsd": 0.004,
  "cached": false
}
```

---

## Value Proposition for Your Startup Users

| Feature                        | Benefit                                           |
| ------------------------------ | ------------------------------------------------- |
| **20 Production-Grade Skills** | Ready-to-use engineering & data workflows         |
| **Model-Agnostic**             | Use Claude, GPT-4o, DeepSeek, Groq - swap anytime |
| **Automatic Fallback**         | Skill succeeds even if preferred provider is down |
| **Cost Optimization**          | Route simple tasks to cheaper models              |
| **Unified Memory**             | Skills learn from previous executions             |
| **Connector Integration**      | GitHub, Notion, Snowflake, etc.                   |
| **Governance**                 | Audit trails, policy enforcement                  |

---

## Implementation Priority

### Phase 1: Core Skills (2 weeks)

1. `/code-review` - Most requested
2. `/sql-queries` - High value for data teams
3. `/architecture` - Strategic value

### Phase 2: Data Skills (2 weeks)

4. `/explore-data`
5. `/build-dashboard`
6. `/analyze`

### Phase 3: Complete Set (2 weeks)

7. All remaining 14 skills
8. Connector integrations
9. SDK publishing

---

## Summary

**YES** - You can absolutely use Claude's plugin patterns to build skills for your Ultra-Dex startup in a **model-agnostic way**:

1. **Skills are provider-agnostic** - They define WHAT to do (review code, generate SQL)
2. **Ultra-Dex router decides WHO** - Claude, GPT-4o, DeepSeek based on task/cost/availability
3. **Users get resilience** - Automatic fallback if provider is down
4. **Users get cost control** - Route simple tasks to cheaper models
5. **Users get consistency** - Same skill API regardless of provider

The Claude plugins give you **20 battle-tested workflow patterns** to implement. Ultra-Dex's router makes them **available on any provider**.
