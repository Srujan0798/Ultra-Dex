# 🏗️ Ultra-Dex Architecture

> Complete technical overview for contributors

## 📊 System Overview

**Ultra-Dex** is an AI orchestration meta-layer that routes tasks across 17+ providers, coordinates autonomous agent swarms, and maintains persistent memory with semantic search.

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
├─────────────────────────────────────────────────────────┤
│ CLI │ Web Dashboard │ API │ VSCode Extension │ MCP   │
└─────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────┐
│              ORCHESTRATION LAYER                       │
├─────────────────────────────────────────────────────────┤
│ AgentOrchestrator │ Task Graphs │ Ralph Loop │ Swarms  │
└─────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────┐
│                    AI META LAYER                        │
├─────────────────────────────────────────────────────────┤
│ AIMetaLayer → Router → Provider Abstraction            │
└─────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────┐
│                  17+ AI PROVIDERS                       │
├─────────────────────────────────────────────────────────┤
│ OpenAI │ Claude │ Gemini │ NVIDIA │ Groq │ DeepSeek │  │
│ Grok │ Mistral │ Together AI │ Perplexity │ ...       │
└─────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────┐
│                    MEMORY SYSTEM                        │
├─────────────────────────────────────────────────────────┤
│ PPM Manager → 3-Tier Memory with Vector Search         │
└─────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────┐
│                  DATA LAYER                             │
├─────────────────────────────────────────────────────────┤
│ Redis (Cache) │ Postgres (Persistent) │ Vector DB      │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Core Components

### 1. Agent Orchestrator (`src/core/orchestration/`)

**Purpose**: Multi-agent task coordination and execution

**Key Classes**:

```
AgentOrchestrator
├── executeNexus(task)        # Complex multi-agent tasks
├── executeTask(task)          # Single agent tasks
├── executeSwarm(objective)    # Agent swarms
├── createTaskGraph()          # DAG-based task flows
└── selfHeal()                 # Automatic recovery
```

**Design Pattern**: Task Graph with Ralph Loop (autonomous execution)

### 2. AI Meta Layer (`src/core/ai/ai-meta-layer.js`)

**Purpose**: Provider abstraction and intelligent routing

**Features**:

- **Cost-based routing**: Select cheapest provider for task
- **Latency-based routing**: Fastest provider for urgent tasks
- **Quality-based routing**: Best provider for critical tasks
- **Fallback chains**: 3 fallback providers per request
- **Caching**: Reduces costs and improves speed
- **Token tracking**: Usage monitoring per provider

**Supported Providers**:

- OpenAI (GPT-4, o1, etc.)
- Anthropic (Claude 3.5/3.7)
- Google (Gemini 2.0)
- NVIDIA (Llama 3, Nemotron)
- Groq (Fast inference)
- DeepSeek (Reasoning)
- Mistral
- Together AI
- Perplexity
- Grok
- Cohere
- Fireworks
- Ollama (Self-hosted)
- And 4+ more

### 3. Memory System (`src/core/memory/`)

**Purpose**: Persistent, searchable knowledge storage

**3-Tier Architecture**:

1. **Instant Memory** (in-process, ultra-fast)
   - Current session context
   - Recent task results

2. **Session Memory** (Redis, fast)
   - Short-term persistence
   - User context across sessions

3. **Persistent Memory** (Postgres, reliable)
   - Long-term knowledge
   - Vector search for semantic queries
   - Knowledge graph relationships

**Features**:

- Vector embeddings for semantic search
- Knowledge graph for relationships
- Automatic cleanup and optimization
- Task results stored automatically

### 4. Governance Manager (`src/core/governance/`)

**Purpose**: Policy enforcement and security

**Features**:

- Expense policies (e.g., "No more than $5/task")
- Security policies (e.g., "No prod deployment on Friday")
- Access control (e.g., "Only CTO agent can modify infra")
- Resource limits (tokens, compute, memory)
- Custom rules via configuration

**Violations**: Throw `DeniedException` with audit log

### 5. Provider Router (`src/services/ai-providers/router.js`)

**Purpose**: Intelligent provider selection

**Routing Strategy**:

```javascript
// Priority-based selection
1. Explicit provider specified → Use it
2. Cost priority → Cheapest provider meeting requirements
3. Latency priority → Fastest provider
4. Quality priority → Best quality provider

// Fallback chain (3 levels)
Primary → Fallback #1 → Fallback #2 → OpenCode/NVIDIA
```

**Configuration**:

```javascript
{
  "routing": {
    "strategy": "cost", // cost, latency, quality
    "fallbacks": 3,
    "cache": true,
    "trackUsage": true
  }
}
```

## 📦 Monorepo Structure

### Root Level

```
Ultra-Dex/
├── src/               # Core platform code
├── apps/              # End-user applications
├── agents/            # Agent definitions
├── docs/              # Documentation
├── tests/             # Test suites
├── scripts/           # Build scripts
├── config/            # Configuration files
└── packages/          # npm packages
```

### Source Code (`src/`)

```
src/
├── core/              # Core modules
│   ├── orchestration/ # Multi-agent coordination
│   ├── ai/            # AI meta-layer
│   ├── memory/        # Memory systems
│   ├── governance/    # Policy enforcement
│   ├── mcp/           # Model Context Protocol
│   └── agents/        # Agent selection
├── platform/          # Platform code
├── services/          # External services
├── types/             # TypeScript types
├── utils/             # Utilities
└── benchmarks/        # Performance tests
```

### Applications (`apps/`)

```
apps/
├── cli/               # Command-line interface
├── dashboard/         # Web dashboard
├── core-api/          # Core API server
├── docs-site/          # Documentation site
├── cloud/             # Cloud deployment
├── desktop/           # Desktop app (disabled)
├── mobile/            # Mobile app
└── website/           # Marketing website
```

### Agents (`agents/`)

```
agents/
├── cto.md             # Architecture/strategy
├── planner.md         # Task breakdown
├── backend.md         # API/database logic
├── frontend.md        # UI components
├── reviewer.md        # Code review
├── debugger.md        # Debugging help
├── devops.md          # Deployment
└── database.md        # Database design
```

## 🔌 Key Interfaces

### Provider Interface

```typescript
interface AIProvider {
  name: string;
  generate(messages, options): Promise<Response>;
  stream(messages, options): AsyncIterable<Response>;
  getModels(): Model[];
  getCost(tokenCount): number;
  validate(): boolean;
}
```

### Memory Interface

```typescript
interface MemoryManager {
  store(key, value, tier): Promise<void>;
  retrieve(key, tier): Promise<any>;
  search(query, options): Promise<Array>;
  query(vector, options): Promise<Array>;
  expire(key, ttl): Promise<void>;
}
```

### Agent Interface

```typescript
interface Agent {
  capabilities: string[]; // What this agent can do
  execute(task): Promise<Result>; // Execute task
  validate(result): boolean; // Validate output
  fallback(): Agent; // Fallback agent
}
```

## 🚀 Execution Flow

### 1. CLI Command

```bash
ultra-dex run planner -t "Build a SaaS billing system"
```

### 2. Agent Selection

```
Input: task + user context
    ↓
AgentOrchestrator.analyzeCapabilities()
    ↓
Select best agent (PlannerAgent)
    ↓
Check governance policies
```

### 3. Task Execution

```
PlannerAgent
    ↓
Decompose task into subtasks
    ↓
Create execution plan
    ↓
Prompt: backend, frontend, reviewer, etc.
    ↓
Return structured plan
```

### 4. AI Provider Routing

```
Plan ready
    ↓
AIMetaLayer.call(plan)
    ↓
Router.selectProvider()
    ↓
Check cost/latency/quality
    ↓
Select provider (e.g., NVIDIA)
    ↓
Make API call
    ↓
Track tokens/usage
    ↓
Cache result
```

### 5. Memory Storage

```
Task completed
    ↓
Store in 3-tier memory:
  - Instant: Session cache
  - Session: Redis (1 hour TTL)
  - Persistent: Postgres (vector search)
```

## 📊 Data Flow

```
User Input
    ↓
CLI Command (apps/cli/)
    ↓
Agent Orchestrator (src/core/orchestration/)
    ↓
Agent Selection (src/core/agents/)
    ↓
AI Meta Layer (src/core/ai/)
    ↓
Provider Router (src/services/ai-providers/)
    ↓
External AI Provider (OpenAI, Claude, Gemini, etc.)
    ↓
Response Processing
    ↓
Memory Storage (src/core/memory/)
    ↓
Output to User
```

## 🏗️ Technical Decisions

### 1. Why ES Modules?

- Native Node.js support (no bundler needed)
- `type: "module"` in package.json
- Cleaner imports and tree-shaking
- Modern ecosystem standard

### 2. Why Built-in Test Runner?

- Node's `--test` runner (no Jest/Vitest)
- Faster, less dependencies
- Simpler setup
- Native coverage support

### 3. Why Provider Abstraction?

- Swap providers without code changes
- Cost optimization
- Redundancy (fallback chains)
- Vendor independence

### 4. Why 3-Tier Memory?

- Performance optimization
- Cost management
- Data locality
- Graduated persistence

### 5. Why Governance Layer?

- Security
- Cost control
- Policy enforcement
- Audit trail

## 🔒 Security Architecture

### Credential Management

- Environment variables (never commit secrets)
- `.env` file ignored by git
- `.env.example` for reference
- Password Manager integration support

### Policy Enforcement

```javascript
// Example governance rules
governance: {
  "max-tokens-per-task": 100000,
  "allowed-providers": ["openai", "claude"],
  "no-deploy-friday": true,
  "require-review-for-infrastructure": true
}
```

### Audit Logging

- All actions logged
- Failed governance checks recorded
- Usage tracking per provider
- Token consumption monitoring

## 🚀 Performance Considerations

### Caching Strategy

- AI responses cached (24-48 hours)
- Memory lookups cached in Redis
- Provider responses cached by hash
- Clear cache on configuration changes

### Parallel Execution

- Task graphs execute in parallel
- Multiple agents run concurrently
- Provider calls batched when possible
- Non-blocking I/O throughout

### Optimization Techniques

- Lazy loading for providers
- Connection pooling for Redis/Postgres
- Vector search indexes
- Compiled regex patterns

## 🔧 Extension Points

### Adding New Providers

```javascript
// src/services/ai-providers/new-provider/
class NewProvider implements AIProvider {
  name = 'new-provider';
  generate(messages, options) { /* ... */ }
  stream(messages, options) { /* ... */ }
  // ... implement interface
}
```

### Adding New Agents

```javascript
// agents/custom-agent.md
# Custom Agent

## Capabilities
- Custom capability 1
- Custom capability 2

## Process
1. Step one
2. Step two
```

### Custom Policies

```javascript
// config/governance.json
{
  "custom-policies": [
    {
      "name": "no-lambda-friday",
      "condition": "day === 'Friday' && action.includes('lambda')",
      "action": "deny"
    }
  ]
}
```

## 📈 Monitoring & Observability

### Built-in Metrics

- Token usage per provider
- Task execution time
- Cache hit rates
- Error rates
- Agent selection distribution

### Health Checks

```bash
ultra-dex health
ultra-dex status
ultra-dex metrics
```

### Logging

- Structured JSON logs
- Winston logger
- Separate error logs
- Debug mode available

## 🔍 Troubleshooting

### Common Issues

**1. Provider Errors**

- Check API keys in environment
- Verify provider status
- Try fallback provider
- Check rate limits

**2. Memory Issues**

- Clear old memory entries
- Check Redis connection
- Verify Postgres indexes
- Restart memory service

**3. Agent Failures**

- Check governance policies
- Verify agent capabilities
- Check task requirements
- Review agent logs

**4. Performance**

- Enable caching
- Check provider latency
- Optimize task graphs
- Use parallel execution

## 📚 Related Resources

- **README.md**: User-facing overview
- **CLAUDE.md**: AI agent instructions
- **docs/api/**: API reference
- **docs/architecture/**: Detailed architecture docs
- **docs/guides/**: Implementation guides

## 🔮 Future Architecture

### Cache Redis Layer

High-speed caching for frequently accessed memory and tasks

### Multi-Region Deployment

Geographic distribution for low latency

### Advanced Routing

ML-based provider selection based on task type and past performance

### Plugin System

Third-party agent and provider plugins

---

**Last Updated**: 2026-04-10
**Version**: 3.1.0
**Maintainers**: Ultra-Dex Team
