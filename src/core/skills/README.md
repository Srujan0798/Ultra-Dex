# Ultra-Dex Skills System

Model-agnostic implementation of Claude's Engineering and Data plugin skills for Ultra-Dex.

## Overview

This module provides **20 production-grade skills** that work with ANY AI provider:

- **10 Engineering Skills**: Code review, architecture, debugging, deployment, etc.
- **10 Data Skills**: SQL generation, data analysis, dashboards, visualization, etc.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SKILL LAYER (20 Skills)                  │
│  /code-review  /architecture  /sql-queries  /build-dashboard │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              AGENT ORCHESTRATOR                              │
│  @Reviewer  @CTO  @Database  @Frontend  @Debugger            │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              AI ROUTER (Model-Agnostic)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ Claude   │ │  GPT-4o  │ │ DeepSeek │ │   Groq   │     │
│  │  Sonnet  │ │          │ │   V3     │ │  Llama   │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

```typescript
import { SkillsAPI } from 'ultra-dex/skills';

// Initialize
const skills = new SkillsAPI();
skills.initializeExecutor({
  aiRouter: ultraDex.router,
  memory: ultraDex.memory,
  governance: ultraDex.governance,
  agentRegistry: ultraDex.agents,
});

// Execute a skill
const result = await skills.codeReview({
  code: 'function add(a,b){return a+b}',
  language: 'javascript',
  focus: ['security'],
});

console.log(result);
// {
//   skill: '/code-review',
//   result: { summary: '...', findings: [...] },
//   provider: 'anthropic',
//   model: 'claude-3-7-sonnet-20250219',
//   latencyMs: 1245,
//   costUsd: 0.004,
//   cached: false
// }
```

## Available Skills

### Engineering Skills

| Skill                | Description                           | Agent       | Best Provider |
| -------------------- | ------------------------------------- | ----------- | ------------- |
| `/code-review`       | Review code for security, performance | `@Reviewer` | Claude/GPT-4o |
| `/architecture`      | Create/evaluate ADRs                  | `@CTO`      | Claude Sonnet |
| `/debug`             | Structured debugging                  | `@Debugger` | Claude/GPT-4o |
| `/deploy-checklist`  | Pre-deployment verification           | `@DevOps`   | GPT-4o        |
| `/documentation`     | Write technical docs                  | `@CTO`      | Claude        |
| `/incident-response` | Incident triage & post-mortem         | `@Operator` | Claude        |
| `/standup`           | Generate standup updates              | `@CTO`      | GPT-4o-mini   |
| `/system-design`     | Design systems & services             | `@CTO`      | Claude Sonnet |
| `/tech-debt`         | Identify technical debt               | `@Reviewer` | Claude        |
| `/testing-strategy`  | Design test strategies                | `@Debugger` | GPT-4o        |

### Data Skills

| Skill                     | Description            | Agent       | Best Provider |
| ------------------------- | ---------------------- | ----------- | ------------- |
| `/sql-queries`            | Write optimized SQL    | `@Database` | GPT-4o/Claude |
| `/explore-data`           | Profile datasets       | `@Backend`  | Claude        |
| `/build-dashboard`        | Build HTML dashboards  | `@Frontend` | Claude        |
| `/analyze`                | Answer data questions  | `@Backend`  | Claude        |
| `/create-viz`             | Python visualizations  | `@Frontend` | Claude        |
| `/statistical-analysis`   | Statistical methods    | `@Backend`  | Claude        |
| `/validate-data`          | QA analysis            | `@Reviewer` | Claude        |
| `/write-query`            | Optimized SQL          | `@Database` | GPT-4o        |
| `/data-context-extractor` | Extract data knowledge | `@Backend`  | Claude        |
| `/data-visualization`     | Create visualizations  | `@Frontend` | Claude        |

## CLI Usage

```bash
# List all skills
ultra-dex skill --list

# Execute a skill
ultra-dex skill /code-review --code "function add(a,b){return a+b}" --focus security

# With provider selection
ultra-dex skill /sql-queries --prompt "Top customers" --provider deepseek --strategy cost

# Show skill info
ultra-dex skill /architecture --info
```

## Provider Routing

Skills automatically route to the best provider based on:

- Task type and complexity
- Provider availability
- Cost/latency constraints
- User preferences

```typescript
// Auto-select best provider
await skills.execute('/code-review', { code: '...' });

// Force specific provider
await skills.execute('/code-review', { code: '...' }, { provider: 'claude' });

// Use cost-optimized routing
await skills.execute('/sql-queries', { prompt: '...' }, { strategy: 'cost' });
```

## Model-Agnostic Benefits

1. **Resilience**: Skill works even if provider is down (automatic fallback)
2. **Cost Control**: Route simple tasks to cheaper models
3. **Quality**: Use best models for complex tasks
4. **Flexibility**: Swap providers without changing code
5. **Future-Proof**: Add new providers without updating skills

## Integration with Ultra-Dex

The skills system integrates with:

- **AgentOrchestrator**: Routes to appropriate agents
- **SmartAIRouter**: Provider selection and fallback
- **UnifiedMemory**: Stores skill execution history
- **GovernanceManager**: Policy enforcement and audit
- **MCP**: Exposes skills as MCP tools

## Configuration

```typescript
{
  aiRouter: SmartAIRouter,      // Required: Provider routing
  memory: UnifiedMemory,        // Required: Result storage
  governance: GovernanceManager, // Optional: Policy enforcement
  agentRegistry: AgentRegistry,  // Required: Agent management
  enableCache: true,             // Optional: Result caching
  defaultTimeout: 60000,         // Optional: Timeout in ms
}
```

## Extending with Custom Skills

```typescript
import { defineSkill } from 'ultra-dex/skills';

const mySkill = defineSkill({
  id: '/my-custom-skill',
  name: 'My Skill',
  category: 'engineering',
  agent: { id: 'my-agent', capabilities: ['my-capability'] },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'custom',
    complexity: 'medium',
  },
  input: { type: 'object', properties: { ... }, required: ['prompt'] },
  output: { type: 'object', properties: { ... } },
  promptTemplate: 'Process: {{prompt}}',
  config: { temperature: 0, maxTokens: 2000 },
  memory: { storeOutput: true, tags: ['custom'], searchable: true },
  governance: { requiresApproval: false, auditLevel: 'basic' },
});

// Register
import { globalSkillRegistry } from 'ultra-dex/skills';
globalSkillRegistry.register(mySkill);
```

## License

MIT - Ultra-Dex Team
