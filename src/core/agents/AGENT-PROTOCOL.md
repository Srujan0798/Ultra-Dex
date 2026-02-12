# Agent Protocol v2

> **Version:** 2.0.0  
> **Status:** ACTIVE  
> **Last Updated:** 2026-02-12

## Overview

Agent Protocol v2 defines the communication standard for all Ultra-Dex agents. It specifies message formats, task delegation patterns, context sharing mechanisms, result reporting, and error escalation procedures.

## Design Principles

1. **Async-First**: All communications are asynchronous by default
2. **Fault-Tolerant**: Graceful degradation when agents fail
3. **Observable**: All interactions are traceable and loggable
4. **Extensible**: Easy to add new message types
5. **Secure**: Built-in authentication and authorization

## Message Format

### Base Message Structure

```typescript
interface BaseMessage {
  id: string; // UUID v7
  type: MessageType;
  version: '2.0';
  timestamp: string; // ISO 8601
  sender: AgentId;
  recipient: AgentId | 'broadcast';
  correlationId?: string; // For request/response tracking
  priority: 'low' | 'normal' | 'high' | 'critical';
  ttl?: number; // Time-to-live in seconds
}

type MessageType =
  | 'task.assign'
  | 'task.update'
  | 'task.complete'
  | 'task.cancel'
  | 'context.share'
  | 'context.request'
  | 'result.report'
  | 'error.report'
  | 'heartbeat'
  | 'discovery';
```

### Task Assignment Message

```typescript
interface TaskAssignMessage extends BaseMessage {
  type: 'task.assign';
  payload: {
    taskId: string;
    taskType: string;
    description: string;
    requirements: TaskRequirement[];
    context: TaskContext;
    deadline?: string; // ISO 8601
    dependencies?: string[]; // Task IDs this depends on
    maxRetries?: number;
    timeoutMs?: number;
  };
}

interface TaskRequirement {
  type: 'capability' | 'resource' | 'permission';
  value: string;
  optional?: boolean;
}

interface TaskContext {
  projectId?: string;
  sessionId?: string;
  memory?: MemoryReference[];
  artifacts?: ArtifactReference[];
  metadata?: Record<string, any>;
}
```

### Task Update Message

```typescript
interface TaskUpdateMessage extends BaseMessage {
  type: 'task.update';
  payload: {
    taskId: string;
    status: TaskStatus;
    progress: number; // 0.0 - 1.0
    message?: string;
    artifacts?: Artifact[];
    metrics?: TaskMetrics;
  };
}

type TaskStatus =
  | 'pending'
  | 'assigned'
  | 'in-progress'
  | 'blocked'
  | 'completed'
  | 'failed'
  | 'cancelled';

interface TaskMetrics {
  tokensUsed?: number;
  latencyMs?: number;
  apiCalls?: number;
  startTime?: string;
  elapsedMs?: number;
}
```

### Task Complete Message

```typescript
interface TaskCompleteMessage extends BaseMessage {
  type: 'task.complete';
  payload: {
    taskId: string;
    status: 'completed' | 'failed' | 'cancelled';
    result?: TaskResult;
    error?: TaskError;
    artifacts: Artifact[];
    metrics: TaskMetrics;
    contextUpdates?: ContextUpdate[];
  };
}

interface TaskResult {
  success: boolean;
  data?: any;
  summary: string;
  deliverables?: Deliverable[];
}

interface TaskError {
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
  retryAfterMs?: number;
}

interface Artifact {
  id: string;
  type: 'code' | 'document' | 'config' | 'data' | 'log';
  name: string;
  content?: string;
  path?: string;
  metadata?: Record<string, any>;
}
```

### Context Sharing Message

```typescript
interface ContextShareMessage extends BaseMessage {
  type: 'context.share';
  payload: {
    contextType: 'memory' | 'state' | 'config' | 'artifact';
    data: any;
    scope: 'task' | 'session' | 'project' | 'global';
    ttl?: number; // Seconds to keep context
    access?: 'read' | 'write' | 'admin';
  };
}

interface ContextRequestMessage extends BaseMessage {
  type: 'context.request';
  payload: {
    contextType: string;
    query?: string;
    scope?: string;
    limit?: number;
  };
}
```

### Error Report Message

```typescript
interface ErrorReportMessage extends BaseMessage {
  type: 'error.report';
  payload: {
    severity: 'warning' | 'error' | 'critical';
    category: string;
    code: string;
    message: string;
    stackTrace?: string;
    context?: any;
    escalationLevel: number; // 0 = self-heal, 1 = parent, 2 = orchestrator
    suggestedAction?: string;
  };
}
```

## Task Delegation

### Hierarchical Delegation

```
Orchestrator
    ├── Architect
    │       ├── Database Designer
    │       └── API Designer
    ├── Coder
    │       ├── Frontend Developer
    │       └── Backend Developer
    └── Reviewer
            ├── Security Auditor
            └── Performance Auditor
```

### Delegation Rules

1. **Capability Matching**: Only delegate to agents with required capabilities
2. **Load Balancing**: Distribute tasks based on agent availability
3. **Timeout Cascade**: Child timeouts ≤ Parent timeout - buffer
4. **Result Aggregation**: Parent agent combines child results
5. **Error Propagation**: Child errors bubble up with context

### Delegation Example

```javascript
// Parent agent delegates subtasks
const delegation = {
  parent: 'architect',
  subtasks: [
    {
      agent: 'database-designer',
      task: 'Design user schema',
      deadline: '2026-02-12T10:00:00Z',
      dependencies: [],
    },
    {
      agent: 'api-designer',
      task: 'Design REST endpoints',
      deadline: '2026-02-12T10:30:00Z',
      dependencies: ['database-schema'], // Waits for DB design
    },
  ],
};
```

## Context Sharing

### Context Scopes

1. **Task Scope**: Only visible within current task
2. **Session Scope**: Shared across tasks in same session
3. **Project Scope**: Persistent across sessions
4. **Global Scope**: System-wide configuration

### Context Types

```typescript
interface ContextTypes {
  memory: {
    shortTerm: string[]; // Recent conversation
    longTerm: string[]; // Important facts
    vectorStore: string; // Semantic search reference
  };

  state: {
    currentPhase: string;
    completedTasks: string[];
    pendingTasks: string[];
    blockedTasks: string[];
  };

  config: {
    preferences: Record<string, any>;
    constraints: string[];
    rules: string[];
  };

  artifacts: {
    files: Artifact[];
    dependencies: string[];
    generated: string[];
  };
}
```

### Context Persistence

```javascript
// Automatic context persistence
const contextManager = {
  async save(context, scope) {
    await contextStore.set(scope, context.id, context);
  },

  async load(contextId, scope) {
    return contextStore.get(scope, contextId);
  },

  async share(fromAgent, toAgent, contextId) {
    const context = await this.load(contextId, 'task');
    await messageBus.send(toAgent, {
      type: 'context.share',
      payload: { context },
    });
  },
};
```

## Result Reporting

### Result Aggregation

```typescript
interface AggregatedResult {
  taskId: string;
  status: 'success' | 'partial' | 'failure';

  results: {
    successful: TaskResult[];
    failed: TaskError[];
    partial: PartialResult[];
  };

  summary: {
    totalSubtasks: number;
    completed: number;
    failed: number;
    durationMs: number;
    tokensUsed: number;
  };

  deliverables: Deliverable[];

  nextSteps: string[];
}
```

### Progress Tracking

```javascript
// Progress updates every 30 seconds
const progressReporter = {
  interval: 30000,

  async report(taskId, progress) {
    await messageBus.broadcast({
      type: 'task.update',
      payload: {
        taskId,
        progress: progress.percentage,
        message: progress.message,
        metrics: progress.metrics,
      },
    });
  },
};
```

## Error Escalation

### Escalation Levels

```typescript
enum EscalationLevel {
  SELF_HEAL = 0, // Agent attempts automatic recovery
  PARENT = 1, // Escalate to parent agent
  ORCHESTRATOR = 2, // Escalate to orchestrator
  HUMAN = 3, // Require human intervention
  EMERGENCY = 4, // Stop all operations
}
```

### Escalation Rules

```javascript
const escalationRules = {
  // Level 0: Self-heal
  retryableError: (error) => error.recoverable && error.retryCount < 3,

  // Level 1: Parent agent
  parentEscalation: (error) => error.category === 'dependency' || error.category === 'resource',

  // Level 2: Orchestrator
  orchestratorEscalation: (error) => error.severity === 'critical' || error.category === 'security',

  // Level 3: Human intervention
  humanEscalation: (error) =>
    error.escalationLevel >= 3 || error.code === 'HUMAN_APPROVAL_REQUIRED',

  // Level 4: Emergency stop
  emergencyStop: (error) => error.code === 'SECURITY_BREACH' || error.code === 'DATA_CORRUPTION',
};
```

### Error Recovery Flow

```
Error Occurs
    ↓
Can Self-Heal? → Yes → Retry → Success?
    ↓ No              ↓ Yes
Escalate to           Mark Complete
Parent Agent
    ↓
Parent Can Handle? → Yes → Delegate
    ↓ No
Escalate to
Orchestrator
    ↓
Orchestrator Can Handle? → Yes → Reassign
    ↓ No
Request Human
Intervention
```

## Message Broker Interface

```typescript
interface MessageBroker {
  // Send message to specific agent
  send(recipient: AgentId, message: Message): Promise<void>;

  // Broadcast to all agents
  broadcast(message: Message): Promise<void>;

  // Subscribe to messages
  subscribe(filter: MessageFilter, handler: MessageHandler): Subscription;

  // Request/Response pattern
  request<T>(recipient: AgentId, message: RequestMessage, timeoutMs?: number): Promise<T>;
}

interface MessageFilter {
  types?: MessageType[];
  from?: AgentId[];
  to?: AgentId[];
  priority?: Priority[];
}

type MessageHandler = (message: Message) => Promise<void> | void;
```

## Security

### Authentication

```javascript
// JWT-based authentication
const auth = {
  async sign(agentId, capabilities) {
    return jwt.sign(
      {
        agent: agentId,
        capabilities,
        iat: Date.now(),
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24h
      },
      AGENT_SECRET
    );
  },

  async verify(token) {
    return jwt.verify(token, AGENT_SECRET);
  },
};
```

### Authorization

```javascript
// Capability-based authorization
const authorize = {
  canExecute(agent, task) {
    return task.requirements.every((req) => req.optional || agent.capabilities.includes(req.value));
  },

  canAccess(agent, resource) {
    return resource.allowedAgents.includes(agent.id);
  },
};
```

## Implementation Example

```javascript
import { Agent } from '@ultra-dex/sdk';

class MyAgent extends Agent {
  async onMessage(message) {
    switch (message.type) {
      case 'task.assign':
        return this.handleTask(message.payload);

      case 'context.request':
        return this.provideContext(message.payload);

      case 'task.cancel':
        return this.cancelTask(message.payload.taskId);
    }
  }

  async handleTask(task) {
    try {
      // Update status
      await this.sendUpdate(task.taskId, 'in-progress', 0);

      // Do work...
      const result = await this.execute(task);

      // Report completion
      await this.sendCompletion(task.taskId, result);
    } catch (error) {
      await this.sendError(task.taskId, error);
    }
  }
}
```

## Version History

| Version | Date       | Changes                                          |
| ------- | ---------- | ------------------------------------------------ |
| 2.0.0   | 2026-02-12 | Initial v2 specification with async-first design |
| 1.0.0   | 2025-12-01 | Legacy protocol (deprecated)                     |

---

**Note:** All Ultra-Dex agents must implement this protocol for interoperability.
