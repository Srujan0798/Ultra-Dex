# Diamond State Implementation Plan
## Ultra-Dex Enterprise Architecture Overhaul

---

## 📊 Current State Analysis

| Metric | Current | Target (Diamond State) |
|--------|---------|------------------------|
| **Singletons** | 10+ global instances | 0 - Pure DI |
| **TypeScript Coverage** | ~7% (17 TS / 210 JS files) | 100% |
| **Routing Logic** | String matching (if/else) | Vector semantic similarity |
| **Sandboxing** | None | Isolated VM + Docker |
| **Self-Healing** | Manual/autonomous mode | Automatic event-driven |

---

## 1. DEPENDENCY INJECTION (IoC Container)

### Current Problem
```javascript
// ❌ Current - Global singletons
export const ppmManager = new MemoryManager();
export const registry = new UnifiedRegistry();
export const agentOrchestrator = new AgentOrchestrator();
```

### Diamond Implementation
```typescript
// ✅ DI Container with tsyringe
@singleton()
class AgentOrchestrator {
  constructor(
    @inject(MemoryManager) private memory: IMemoryManager,
    @inject(AgentRegistry) private registry: IAgentRegistry,
    @inject(AIMetaLayer) private ai: IAIMetaLayer
  ) {}
}

// Per-request scoped instances
container.registerInstance('sessionId', req.sessionId);
const orchestrator = container.resolve(AgentOrchestrator);
```

### Implementation Tasks

#### Task 1.1: Install & Configure tsyringe
```bash
npm install tsyringe reflect-metadata
```
- Add `import 'reflect-metadata'` to entry point
- Create `src/core/di/container.ts` - Root IoC container

#### Task 1.2: Define Service Interfaces
Create `src/core/interfaces/`:
- `IMemoryManager.ts` - Abstract memory operations
- `IAgentRegistry.ts` - Agent lifecycle interface
- `IAIMetaLayer.ts` - AI provider abstraction
- `IExecutionEngine.ts` - Task execution interface
- `ITelemetryService.ts` - Metrics & tracing interface

#### Task 1.3: Refactor Core Services to DI
Priority order (highest dependency first):
1. `MemoryManager` → `@singleton()` with interface
2. `AgentRegistry` → `@singleton()` with interface
3. `AIMetaLayer` → `@singleton()` with interface
4. `AgentOrchestrator` → `@singleton()` injecting above
5. `SystemMonitor` → `@singleton()` with telemetry interface

#### Task 1.4: Session Scoping
```typescript
// src/core/di/session-scope.ts
@scoped(Lifecycle.ResolutionScoped)
class SessionScopedOrchestrator {
  constructor(@inject('sessionId') private sessionId: string) {}
}
```

**Acceptance Criteria:**
- [ ] No `export const instance = new Class()` patterns remain
- [ ] All services accessed via `container.resolve()`
- [ ] Unit tests use `container.registerInstance()` for mocking
- [ ] Concurrent session isolation verified via load test

---

## 2. SEMANTIC ROUTER (Vector-Based)

### Current Problem
```javascript
// ❌ Fragile string matching
if (task.includes('database') || task.includes('schema')) {
  return 'backend-agent';
}
if (task.includes('component') || task.includes('ui')) {
  return 'frontend-agent';
}
```

### Diamond Implementation
```typescript
// ✅ Vector semantic routing
interface AgentCapabilityProfile {
  agentId: string;
  embedding: number[]; // 384-dim vector from all-MiniLM-L6-v2
  capabilities: string[];
  examples: string[]; // Training examples for semantic matching
}

class SemanticRouter {
  async route(task: string): Promise<RouteDecision> {
    const taskEmbedding = await this.embed(task);
    
    const matches = this.agentProfiles.map(profile => ({
      agentId: profile.agentId,
      similarity: cosineSimilarity(taskEmbedding, profile.embedding),
      profile
    }));
    
    matches.sort((a, b) => b.similarity - a.similarity);
    
    return {
      agentId: matches[0].agentId,
      confidence: matches[0].similarity,
      alternatives: matches.slice(1, 3)
    };
  }
}
```

### Implementation Tasks

#### Task 2.1: Install Embedding Model
```bash
npm install @xenova/transformers
```
- Use `Xenova/all-MiniLM-L6-v2` (local, no API calls)
- 384-dimensional embeddings
- Runs in Node.js via ONNX runtime

#### Task 2.2: Create Agent Capability Profiles
Create `src/core/routing/agent-profiles.ts`:
```typescript
export const AGENT_PROFILES: AgentCapabilityProfile[] = [
  {
    agentId: 'frontend-agent',
    capabilities: ['react', 'vue', 'css', 'ui', 'component'],
    examples: [
      'Create a responsive navigation bar',
      'Build a login form with validation',
      'Style this button with hover effects',
      'Make the modal dialog accessible'
    ]
  },
  {
    agentId: 'backend-agent',
    capabilities: ['api', 'database', 'prisma', 'auth', 'server'],
    examples: [
      'Create a REST API endpoint',
      'Set up database schema with Prisma',
      'Implement JWT authentication',
      'Build a GraphQL resolver'
    ]
  }
];
```

#### Task 2.3: Build SemanticRouter
Create `src/core/routing/semantic-router.ts`:
- `embed(text: string): Promise<number[]>` - Generate embeddings
- `cosineSimilarity(a: number[], b: number[]): number` - Similarity calculation
- `route(task: string): Promise<RouteDecision>` - Main routing method
- `retrain(profiles: AgentCapabilityProfile[])` - Update profiles

#### Task 2.4: Hybrid Routing Strategy
```typescript
// Combine semantic + capability matching
class HybridRouter {
  async route(task: string, requiredCapabilities: string[]): Promise<RouteDecision> {
    // Semantic match first
    const semanticMatch = await this.semanticRouter.route(task);
    
    // Verify capability compatibility
    const capableAgents = this.filterByCapabilities(
      semanticMatch.alternatives, 
      requiredCapabilities
    );
    
    // Score = 0.7 * semanticSimilarity + 0.3 * capabilityMatch
    return this.rankByHybridScore(capableAgents);
  }
}
```

**Acceptance Criteria:**
- [ ] "make the button bounce" routes to frontend-agent (no "UI" keyword needed)
- [ ] "optimize database queries" routes to backend-agent (semantic match)
- [ ] Routing confidence > 0.85 for clear matches
- [ ] Fallback to capability-only if semantic confidence < 0.6

---

## 3. AGENT SANDBOXING & HARD BOUNDARIES

### Current Problem
```javascript
// ❌ Direct execution
const result = await agent.execute(code); // Runs in main process!
```

### Diamond Implementation
```typescript
// ✅ Sandboxed execution
interface Sandbox {
  execute(code: string, context: SandboxContext): Promise<SandboxResult>;
}

class IsolatedVMSandbox implements Sandbox {
  async execute(code: string, context: SandboxContext): Promise<SandboxResult> {
    const isolate = new ivm.Isolate({ memoryLimit: 128 });
    const jail = isolate.createContextSync();
    
    // Whitelist only safe globals
    jail.global.setSync('_console', {
      log: (msg: string) => context.logger.info(msg)
    });
    
    // Run with timeout
    const script = await isolate.compileScript(code);
    const result = await script.runSync(jail, { timeout: 5000 });
    
    return { success: true, result };
  }
}

class DockerSandbox implements Sandbox {
  async execute(command: string): Promise<SandboxResult> {
    const container = await docker.createContainer({
      Image: 'ultra-dex-sandbox:latest',
      Cmd: ['sh', '-c', command],
      HostConfig: {
        Memory: 512 * 1024 * 1024, // 512MB
        CpuQuota: 50000, // 50% CPU
        AutoRemove: true
      }
    });
    
    await container.start();
    const result = await container.wait({ timeout: 30000 });
    
    return { 
      success: result.StatusCode === 0,
      exitCode: result.StatusCode 
    };
  }
}
```

### Implementation Tasks

#### Task 3.1: Install Sandboxing Dependencies
```bash
npm install isolated-vm
# For Docker sandbox:
npm install dockerode
```

#### Task 3.2: Create Sandbox Interface
Create `src/core/sandbox/sandbox.ts`:
```typescript
export interface SandboxContext {
  timeout: number;
  memoryLimit: number;
  allowedModules: string[];
  logger: ILogger;
  filesystem: IFileSystem; // Virtual FS
}

export interface SandboxResult {
  success: boolean;
  result?: any;
  error?: string;
  exitCode?: number;
  executionTime: number;
  memoryUsed: number;
}

export interface Sandbox {
  execute(code: string, context: SandboxContext): Promise<SandboxResult>;
  dispose(): Promise<void>;
}
```

#### Task 3.3: Implement IsolatedVMSandbox
Create `src/core/sandbox/isolated-vm-sandbox.ts`:
- JavaScript code execution only
- Memory limits enforced
- No file system access (virtual FS only)
- Timeout protection
- Result serialization only (no object sharing)

#### Task 3.4: Implement DockerSandbox
Create `src/core/sandbox/docker-sandbox.ts`:
- Full OS-level isolation
- Network isolation
- Ephemeral containers (auto-remove)
- Resource limits (CPU, memory, disk)
- Image: `ultra-dex-sandbox` (minimal Alpine Linux)

#### Task 3.5: Sandbox Selection Strategy
```typescript
class SandboxRouter {
  selectSandbox(task: Task): Sandbox {
    if (task.type === 'javascript' && !task.requiresFilesystem) {
      return new IsolatedVMSandbox(); // Fast, lightweight
    }
    return new DockerSandbox(); // Full isolation
  }
}
```

#### Task 3.6: Tool Execution Wrapper
Update all tool executions:
```typescript
// Before
const result = await filesystemTool.execute({ path, content });

// After
const result = await sandbox.execute(`
  const fs = require('fs');
  fs.writeFileSync('${path}', '${content}');
`, { allowedModules: ['fs'] });
```

**Acceptance Criteria:**
- [ ] Infinite loop in agent code times out at 5s (doesn't hang system)
- [ ] Memory exhaustion crashes sandbox, not main process
- [ ] File system escape attempts blocked
- [ ] Network access denied by default
- [ ] Malicious code cannot access `process.env` or `global`

---

## 4. 100% TYPESCRIPT MIGRATION

### Current State
- 210 JavaScript files
- 17 TypeScript files
- Many `any` types still present

### Migration Strategy (Incremental)

#### Phase 1: Core Interfaces (Week 1)
Create strict interfaces for all services:
```typescript
// src/core/types/index.ts
export interface IAgent {
  id: string;
  capabilities: Capability[];
  execute(task: ITask): Promise<IExecutionResult>;
}

export interface ITask {
  id: string;
  type: TaskType;
  payload: unknown;
  priority: number;
  deadline?: Date;
}

export interface IExecutionResult {
  success: boolean;
  result?: unknown;
  error?: IExecutionError;
  metrics: IExecutionMetrics;
}
```

#### Phase 2: Memory & Storage (Week 2)
Migrate `src/core/memory/`:
- `manager.js` → `manager.ts`
- `ultra-memory.js` → `ultra-memory.ts`
- `vector-store.js` → `vector-store.ts`
- Add strict types for all memory schemas

#### Phase 3: Orchestration (Week 3)
Migrate `src/core/orchestration/`:
- `orchestrator.js` → `orchestrator.ts`
- `execution-engine.js` → `execution-engine.ts`
- `registry.js` → `registry.ts`

#### Phase 4: Agents (Week 4)
Migrate `src/core/agents/`:
- All agent controllers
- Protocol definitions
- Tool implementations

#### Phase 5: AI Layer (Week 5)
Migrate `src/core/ai/`:
- Model routers
- Provider implementations
- Evaluation loops

### Type Safety Rules
```typescript
// ❌ Forbidden
function process(data: any): any { }

// ✅ Required
function process<T extends TaskPayload>(
  data: T
): Promise<ExecutionResult<T>> { }

// ❌ Forbidden
const result = await fetchData();

// ✅ Required
const result: ApiResponse<UserData> = await fetchData();
```

**Acceptance Criteria:**
- [ ] `find src/core -name "*.js" | wc -l` returns 0
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] Strict mode: `strict: true` in tsconfig.json
- [ ] No `any` types except in test mocks
- [ ] All function signatures have explicit return types

---

## 5. TELEMETRY & AUTONOMOUS SELF-HEALING

### Current State
- SystemMonitor collects metrics
- Alerts are emitted but not acted upon
- Manual intervention required

### Diamond Implementation
```typescript
// Event-Driven Self-Healing Architecture

class AlertManager extends EventEmitter {
  emitAlert(alert: SystemAlert): void {
    this.emit('alert', alert);
    this.persistToAuditLog(alert);
    
    // Auto-trigger healing if severity > threshold
    if (alert.severity >= AlertSeverity.HIGH) {
      this.emit('auto-heal:trigger', alert);
    }
  }
}

@singleton()
class SiteReliabilityAgent {
  constructor(
    @inject(AlertManager) private alerts: AlertManager,
    @inject(AIMetaLayer) private ai: IAIMetaLayer,
    @inject(TelemetryService) private telemetry: ITelemetryService
  ) {
    this.alerts.on('auto-heal:trigger', this.handleAutoHeal.bind(this));
  }

  async handleAutoHeal(alert: SystemAlert): Promise<void> {
    switch (alert.type) {
      case 'provider.latency.high':
        await this.rerouteToBackupProvider(alert);
        break;
      case 'memory.usage.high':
        await this.triggerGarbageCollection(alert);
        break;
      case 'agent.error.rate':
        await this.restartAgent(alert);
        break;
    }
  }

  async rerouteToBackupProvider(alert: ProviderLatencyAlert): Promise<void> {
    const currentProvider = alert.providerId;
    const backup = await this.selectBackupProvider(currentProvider);
    
    this.ai.switchProvider(currentProvider, backup.id);
    
    this.telemetry.recordEvent({
      type: 'self-heal:provider-failover',
      from: currentProvider,
      to: backup.id,
      latency: alert.latency
    });
  }
}
```

### Implementation Tasks

#### Task 5.1: Enhanced AlertManager
Create `src/core/monitoring/alert-manager.ts`:
```typescript
export enum AlertSeverity {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

export interface SystemAlert {
  id: string;
  type: string;
  severity: AlertSeverity;
  timestamp: Date;
  source: string;
  message: string;
  metrics: Record<string, number>;
  suggestedAction?: string;
}

@singleton()
export class AlertManager extends EventEmitter {
  private alertHistory: SystemAlert[] = [];
  
  emitAlert(alert: SystemAlert): void {
    this.alertHistory.push(alert);
    this.emit('alert', alert);
    
    if (alert.severity >= AlertSeverity.HIGH) {
      this.emit('auto-heal:trigger', alert);
    }
    
    if (alert.severity === AlertSeverity.CRITICAL) {
      this.emit('pager-duty:escalate', alert);
    }
  }
}
```

#### Task 5.2: Telemetry Pipeline
Create `src/core/telemetry/telemetry-service.ts`:
- OpenTelemetry-compatible span collection
- Metrics aggregation (latency, throughput, errors)
- Distributed tracing across agents
- Export to Prometheus/Grafana

#### Task 5.3: Site Reliability Agent
Create `src/core/agents/site-reliability-agent.ts`:
- Subscribes to AlertManager events
- Implements healing strategies:
  - Provider failover (OpenAI → Anthropic → Google)
  - Circuit breaker pattern for failing tools
  - Automatic agent restart on crash
  - Memory pressure relief

#### Task 5.4: Healing Strategies Registry
```typescript
interface HealingStrategy {
  canHandle(alert: SystemAlert): boolean;
  execute(alert: SystemAlert): Promise<HealingResult>;
  rollback?(): Promise<void>;
}

const strategies: HealingStrategy[] = [
  new ProviderFailoverStrategy(),
  new CircuitBreakerStrategy(),
  new AgentRestartStrategy(),
  new MemoryReliefStrategy()
];
```

#### Task 5.5: Provider Failover Logic
```typescript
class ProviderFailoverStrategy implements HealingStrategy {
  private providerPriority = ['openai', 'anthropic', 'google', 'ollama'];
  
  canHandle(alert: SystemAlert): boolean {
    return alert.type === 'provider.latency.high' || 
           alert.type === 'provider.error.rate';
  }
  
  async execute(alert: ProviderAlert): Promise<HealingResult> {
    const currentIndex = this.providerPriority.indexOf(alert.providerId);
    const nextProvider = this.providerPriority[currentIndex + 1];
    
    if (!nextProvider) {
      return { success: false, error: 'No fallback provider available' };
    }
    
    await this.aiMetaLayer.switchProvider(alert.providerId, nextProvider);
    
    return { 
      success: true, 
      action: `Switched from ${alert.providerId} to ${nextProvider}` 
    };
  }
}
```

**Acceptance Criteria:**
- [ ] OpenAI latency > 2s triggers automatic switch to Anthropic
- [ ] User never sees error (seamless failover)
- [ ] Alert emitted when healing action taken
- [ ] Rollback capability if failover fails
- [ ] Metrics show MTTR (Mean Time To Recovery) < 5s

---

## IMPLEMENTATION ORDER (Recommended)

### Sprint 1: Foundation (Weeks 1-2)
1. **DI Container** - Enables testing & modularity
2. **TypeScript Interfaces** - Define contracts
3. **Core Services Refactor** - Migrate to DI

### Sprint 2: Intelligence (Weeks 3-4)
4. **Semantic Router** - Vector-based routing
5. **Agent Profiles** - Capability embeddings
6. **Hybrid Routing** - Combine semantic + capability

### Sprint 3: Safety (Weeks 5-6)
7. **IsolatedVMSandbox** - JavaScript sandboxing
8. **DockerSandbox** - Full isolation
9. **Tool Execution Wrapper** - Route all tools through sandbox

### Sprint 4: Type Safety (Weeks 7-8)
10. **TS Migration Phase 1** - Core interfaces
11. **TS Migration Phase 2** - Memory & storage
12. **TS Migration Phase 3** - Orchestration

### Sprint 5: Autonomy (Weeks 9-10)
13. **AlertManager Enhancement** - Severity-based routing
14. **Telemetry Pipeline** - OpenTelemetry integration
15. **Site Reliability Agent** - Self-healing logic
16. **Provider Failover** - Automatic routing on latency

---

## TESTING STRATEGY

### Unit Tests (Per Component)
```typescript
describe('SemanticRouter', () => {
  it('routes "make button bounce" to frontend-agent', async () => {
    const result = await router.route('make button bounce');
    expect(result.agentId).toBe('frontend-agent');
    expect(result.confidence).toBeGreaterThan(0.85);
  });
});

describe('Sandbox', () => {
  it('terminates infinite loop after timeout', async () => {
    const code = 'while(true) {}';
    const result = await sandbox.execute(code, { timeout: 1000 });
    expect(result.error).toContain('timeout');
    expect(process.uptime()).toBeLessThan(2); // Main process unaffected
  });
});
```

### Integration Tests (End-to-End)
```typescript
describe('Self-Healing Flow', () => {
  it('recovers from provider failure without user impact', async () => {
    // Simulate OpenAI latency spike
    mockProvider('openai', { latency: 5000 });
    
    const startTime = Date.now();
    const result = await ultraDex.executeTask('Generate code');
    const duration = Date.now() - startTime;
    
    // Should complete quickly via Anthropic fallback
    expect(duration).toBeLessThan(3000);
    expect(result.provider).toBe('anthropic');
  });
});
```

### Load Tests (Concurrency)
```typescript
// Verify DI enables horizontal scaling
describe('Concurrent Sessions', () => {
  it('handles 1000 concurrent sessions without memory leak', async () => {
    const sessions = await Promise.all(
      Array(1000).fill(0).map(() => createIsolatedSession())
    );
    
    // Each session has its own orchestrator instance
    expect(new Set(sessions.map(s => s.orchestratorId)).size).toBe(1000);
    
    // Memory should not grow linearly
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    expect(memoryUsage).toBeLessThan(500); // < 500MB
  });
});
```

---

## SUCCESS METRICS

| Metric | Current | Diamond Target |
|--------|---------|----------------|
| Test Coverage | ~60% | 90%+ |
| Type Safety | 7% | 100% |
| Routing Accuracy | ~70% | 95%+ |
| Sandbox Escape Rate | N/A (no sandbox) | 0% |
| MTTR (Provider Fail) | Manual (~5min) | < 5s |
| Concurrent Sessions | ~10 | 1000+ |
| Memory Leaks | Some | 0 |

---

## RISK MITIGATION

| Risk | Mitigation |
|------|------------|
| **TS Migration breaks existing code** | Incremental migration with JS compatibility layer |
| **DI adds complexity** | Comprehensive documentation + dev training |
| **Semantic routing latency** | Cache embeddings; use local model |
| **Sandbox performance** | Use IsolatedVM for JS; Docker only for system commands |
| **Auto-healing causes cascade failures** | Circuit breakers; rollback capability; manual override |

---

## AGENT ASSIGNMENT SUGGESTIONS

| Task | Skill Level | Est. Time |
|------|-------------|-----------|
| DI Container Setup | Senior | 2 days |
| Service Interface Design | Senior | 3 days |
| Core Service Refactor | Mid-Senior | 5 days |
| Semantic Router | Senior ML | 5 days |
| Agent Profile Creation | Mid | 2 days |
| IsolatedVMSandbox | Senior Security | 4 days |
| DockerSandbox | Senior DevOps | 3 days |
| TS Migration (210 files) | Mid (parallelizable) | 20 days |
| AlertManager Enhancement | Mid | 2 days |
| Site Reliability Agent | Senior | 5 days |
| Telemetry Pipeline | Senior | 4 days |
| Integration Tests | Mid | 5 days |

**Total: ~60 dev-days (3 senior, 2 mid-level developers for 4 weeks)**
