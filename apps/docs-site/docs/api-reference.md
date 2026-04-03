# Ultra-Dex API Reference

Welcome to the Ultra-Dex API Reference. This document provides comprehensive information about the Ultra-Dex platform's API endpoints, methods, TypeScript types, and usage examples.

## Base URL

All API requests are made to the following base URL:
```
https://api.ultradex.ai/v1
```

## Authentication

All API requests require an authentication header:
```
Authorization: Bearer YOUR_API_KEY
```

## TypeScript Types

```typescript
// Common types
export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  meta?: ResponseMetadata;
}

export interface ApiError {
  type: ErrorType;
  message: string;
  code: string;
  details?: Record<string, any>;
}

export interface ResponseMetadata {
  requestId: string;
  timestamp: string;
  version: string;
  processingTime?: number;
}

export type ErrorType =
  | 'invalid_request_error'
  | 'authentication_error'
  | 'authorization_error'
  | 'rate_limit_error'
  | 'provider_error'
  | 'timeout_error'
  | 'validation_error'
  | 'internal_error';

// Task types
export interface Task {
  id?: string;
  type: TaskType;
  title: string;
  description: string;
  input: Record<string, any>;
  options?: TaskOptions;
  metadata?: TaskMetadata;
}

export interface TaskOptions {
  agents?: string[];
  providers?: string[];
  priority?: TaskPriority;
  timeout?: number;
  maxRetries?: number;
  tags?: string[];
  context?: string;
}

export interface TaskMetadata {
  createdBy?: string;
  projectId?: string;
  parentTaskId?: string;
  estimatedDuration?: number;
  costEstimate?: number;
}

export type TaskType =
  | 'code_generation'
  | 'code_review'
  | 'testing'
  | 'documentation'
  | 'planning'
  | 'analysis'
  | 'deployment'
  | 'custom';

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface TaskResult {
  id: string;
  status: TaskStatus;
  output?: Record<string, any>;
  error?: string;
  metadata: TaskResultMetadata;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

export interface TaskResultMetadata {
  agentsUsed: string[];
  providersUsed: string[];
  tokensConsumed: number;
  executionTime: number;
  cost: number;
  retryCount: number;
}

// Agent types
export interface Agent {
  id: string;
  name: string;
  description?: string;
  capabilities: string[];
  model: string;
  provider: string;
  status: AgentStatus;
  config: AgentConfig;
  metadata: AgentMetadata;
}

export interface AgentConfig {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  tools?: string[];
  memoryEnabled?: boolean;
}

export interface AgentMetadata {
  createdAt: string;
  updatedAt: string;
  version: string;
  author?: string;
  usage: AgentUsage;
}

export interface AgentUsage {
  totalTasks: number;
  successRate: number;
  averageExecutionTime: number;
  totalTokensConsumed: number;
}

export type AgentStatus = 'active' | 'inactive' | 'training' | 'error';

// Memory types
export interface MemoryQuery {
  query: string;
  context?: string;
  type?: MemoryType;
  tags?: string[];
  limit?: number;
  similarity?: number;
}

export interface MemoryEntry {
  id: string;
  content: string;
  type: MemoryType;
  context: string;
  tags: string[];
  metadata: MemoryMetadata;
  embedding?: number[];
  createdAt: string;
  updatedAt: string;
}

export type MemoryType =
  | 'decision'
  | 'fact'
  | 'conversation'
  | 'code'
  | 'document'
  | 'task_result';

export interface MemoryMetadata {
  source?: string;
  confidence?: number;
  importance?: number;
  expiration?: string;
}

// Provider types
export interface ProviderStatus {
  name: string;
  status: ProviderHealthStatus;
  latency: number;
  rateLimitRemaining: number;
  rateLimitReset: string;
  models: ModelInfo[];
  lastChecked: string;
}

export type ProviderHealthStatus =
  | 'operational'
  | 'degraded'
  | 'outage'
  | 'maintenance';

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  pricing: ModelPricing;
  capabilities: string[];
}

export interface ModelPricing {
  inputTokenCost: number;
  outputTokenCost: number;
  currency: string;
}

// Chat types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  functionCall?: FunctionCall;
}

export interface FunctionCall {
  name: string;
  arguments: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  functions?: FunctionDefinition[];
  functionCall?: string | { name: string };
  stream?: boolean;
  logprobs?: number;
}

export interface FunctionDefinition {
  name: string;
  description?: string;
  parameters?: Record<string, any>;
}

export interface ChatResponse {
  id: string;
  content: string;
  role: string;
  usage: TokenUsage;
  model: string;
  finishReason?: string;
  functionCall?: FunctionCall;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// Streaming types
export interface StreamChunk {
  id?: string;
  content?: string;
  role?: string;
  usage?: TokenUsage;
  model?: string;
  finishReason?: string;
  functionCall?: FunctionCall;
  done: boolean;
}

// WebSocket types
export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  id?: string;
}

export type WebSocketMessageType =
  | 'task_update'
  | 'agent_status'
  | 'memory_update'
  | 'provider_status'
  | 'error'
  | 'ping'
  | 'pong';

// Batch types
export interface BatchRequest {
  requests: BatchItem[];
  options?: BatchOptions;
}

export interface BatchItem {
  id: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
}

export interface BatchOptions {
  concurrency?: number;
  timeout?: number;
  retryFailed?: boolean;
}

export interface BatchResponse {
  responses: BatchResult[];
}

export interface BatchResult {
  id: string;
  status: number;
  headers: Record<string, string>;
  body?: any;
  error?: string;
}
```

## Core Endpoints

### 1. Task Execution

Execute a task using the AI orchestration engine.

**Endpoint:** `POST /tasks`

**TypeScript:**
```typescript
const response = await fetch('/v1/tasks', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'code_generation',
    title: 'Create a user authentication system',
    description: 'Implement JWT-based authentication with refresh tokens',
    input: {
      requirements: ['JWT auth', 'password hashing', 'refresh tokens'],
      techStack: ['Node.js', 'Express', 'PostgreSQL']
    },
    options: {
      agents: ['planner', 'coder', 'reviewer'],
      providers: ['openai', 'anthropic'],
      priority: 'high',
      timeout: 300000
    }
  } as Task)
});

const result: ApiResponse<TaskResult> = await response.json();
```

**Request Body:**
```json
{
  "type": "code_generation",
  "title": "Create a user authentication system",
  "description": "Implement JWT-based authentication with refresh tokens",
  "input": {
    "requirements": ["JWT auth", "password hashing", "refresh tokens"],
    "techStack": ["Node.js", "Express", "PostgreSQL"]
  },
  "options": {
    "agents": ["planner", "coder", "reviewer"],
    "providers": ["openai", "anthropic"],
    "priority": "high",
    "timeout": 300000,
    "tags": ["authentication", "security"]
  }
}
```

**Response:**
```json
{
  "data": {
    "id": "task_abc123",
    "status": "processing",
    "output": {
      "plan": "...",
      "code": "...",
      "tests": "..."
    },
    "metadata": {
      "agentsUsed": ["planner", "coder"],
      "providersUsed": ["openai"],
      "tokensConsumed": 2450,
      "executionTime": 45230,
      "cost": 0.12
    },
    "createdAt": "2026-04-03T18:57:02Z",
    "updatedAt": "2026-04-03T18:57:47Z"
  },
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-04-03T18:57:47Z",
    "version": "v2.0.0",
    "processingTime": 45230
  }
}
```

**Query Parameters:**
- `async`: `boolean` - Return immediately with task ID for async processing
- `webhook`: `string` - URL to notify when task completes

### 2. Task Status and Results

Get the status and results of a specific task.

**Endpoint:** `GET /tasks/{taskId}`

**TypeScript:**
```typescript
const response = await fetch(`/v1/tasks/${taskId}`, {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});

const result: ApiResponse<TaskResult> = await response.json();
```

**Response:**
```json
{
  "data": {
    "id": "task_abc123",
    "status": "completed",
    "output": {
      "files": [
        {
          "path": "src/auth/jwt.js",
          "content": "...",
          "language": "javascript"
        }
      ],
      "summary": "Implemented JWT authentication with bcrypt password hashing"
    },
    "metadata": {
      "agentsUsed": ["coder", "reviewer"],
      "providersUsed": ["openai"],
      "tokensConsumed": 1200,
      "executionTime": 2450,
      "cost": 0.06
    }
  }
}
```

### 3. Task Cancellation

Cancel a running task.

**Endpoint:** `POST /tasks/{taskId}/cancel`

**TypeScript:**
```typescript
const response = await fetch(`/v1/tasks/${taskId}/cancel`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${apiKey}` }
});
```

### 4. Agent Management

List, create, or configure specialized agents.

**Endpoint:** `GET /agents`

**TypeScript:**
```typescript
const response = await fetch('/v1/agents', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});

const result: ApiResponse<Agent[]> = await response.json();
```

**Response:**
```json
{
  "data": [
    {
      "id": "planner",
      "name": "Project Planner",
      "description": "Creates detailed project plans and timelines",
      "capabilities": ["task_breakdown", "timeline_estimation", "risk_assessment"],
      "model": "gpt-4",
      "provider": "openai",
      "status": "active",
      "config": {
        "temperature": 0.3,
        "maxTokens": 2000,
        "systemPrompt": "You are an expert project planner..."
      },
      "metadata": {
        "createdAt": "2026-01-01T00:00:00Z",
        "updatedAt": "2026-04-03T18:57:02Z",
        "version": "2.0.0",
        "usage": {
          "totalTasks": 1250,
          "successRate": 0.95,
          "averageExecutionTime": 30000,
          "totalTokensConsumed": 500000
        }
      }
    }
  ]
}
```

**Create Agent:** `POST /agents`

```typescript
const newAgent: Partial<Agent> = {
  name: 'Custom Code Reviewer',
  capabilities: ['code_review', 'security_audit'],
  model: 'claude-3-opus-20240229',
  provider: 'anthropic',
  config: {
    temperature: 0.1,
    systemPrompt: 'You are a senior code reviewer...'
  }
};

const response = await fetch('/v1/agents', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(newAgent)
});
```

### 5. Memory Operations

Interact with the persistent memory system.

**Endpoint:** `POST /memory/query`

**TypeScript:**
```typescript
const query: MemoryQuery = {
  query: 'authentication system decisions',
  context: 'project_x',
  type: 'decision',
  limit: 5,
  similarity: 0.8
};

const response = await fetch('/v1/memory/query', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(query)
});

const result: ApiResponse<MemoryEntry[]> = await response.json();
```

**Request Body:**
```json
{
  "query": "authentication system decisions",
  "context": "project_x",
  "type": "decision",
  "tags": ["auth", "security"],
  "limit": 5,
  "similarity": 0.8
}
```

**Response:**
```json
{
  "data": [
    {
      "id": "mem_123",
      "content": "Decision: Use JWT tokens with refresh rotation every 7 days for better security",
      "type": "decision",
      "context": "project_x",
      "tags": ["auth", "security", "jwt"],
      "metadata": {
        "source": "planning_agent",
        "confidence": 0.95,
        "importance": 0.8
      },
      "createdAt": "2026-01-15T10:30:00Z",
      "updatedAt": "2026-01-15T10:30:00Z"
    }
  ]
}
```

**Store Memory:** `POST /memory/store`

```typescript
const entry: Partial<MemoryEntry> = {
  content: "New decision: Implement rate limiting on auth endpoints",
  type: "decision",
  context: "project_x",
  tags: ["auth", "security", "rate-limiting"]
};

await fetch('/v1/memory/store', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(entry)
});
```

### 6. Provider Status

Check the status of AI providers.

**Endpoint:** `GET /providers/status`

**TypeScript:**
```typescript
const response = await fetch('/v1/providers/status', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});

const result: ApiResponse<Record<string, ProviderStatus>> = await response.json();
```

**Response:**
```json
{
  "data": {
    "openai": {
      "name": "OpenAI",
      "status": "operational",
      "latency": 1200,
      "rateLimitRemaining": 95,
      "rateLimitReset": "2026-04-03T19:00:00Z",
      "models": [
        {
          "id": "gpt-4",
          "name": "GPT-4",
          "provider": "openai",
          "contextLength": 8192,
          "pricing": {
            "inputTokenCost": 0.00003,
            "outputTokenCost": 0.00006,
            "currency": "USD"
          },
          "capabilities": ["chat", "function_calling", "streaming"]
        }
      ],
      "lastChecked": "2026-04-03T18:57:02Z"
    }
  }
}
```

### 7. Chat Completions

Direct chat completions with AI models.

**Endpoint:** `POST /chat/completions`

**TypeScript:**
```typescript
const messages: ChatMessage[] = [
  { role: 'system', content: 'You are a helpful coding assistant.' },
  { role: 'user', content: 'Write a function to validate email addresses.' }
];

const options: ChatOptions = {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 1000,
  stream: false
};

const response = await fetch('/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ messages, ...options })
});

const result: ApiResponse<ChatResponse> = await response.json();
```

### 8. Streaming Chat

Real-time streaming chat responses.

**Endpoint:** `POST /chat/completions` (with stream: true)

**TypeScript:**
```typescript
const response = await fetch('/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Tell me a story' }],
    stream: true,
    model: 'gpt-4'
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') return;

      try {
        const parsed: StreamChunk = JSON.parse(data);
        if (parsed.content) {
          process.stdout.write(parsed.content);
        }
      } catch (e) {
        // Handle parsing error
      }
    }
  }
}
```

### 9. WebSocket Real-time Updates

Connect via WebSocket for real-time updates.

**Endpoint:** `ws://api.ultradex.ai/v1/ws`

**TypeScript:**
```typescript
const ws = new WebSocket('ws://api.ultradex.ai/v1/ws', [], {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});

ws.onmessage = (event) => {
  const message: WebSocketMessage = JSON.parse(event.data);

  switch (message.type) {
    case 'task_update':
      console.log('Task updated:', message.payload);
      break;
    case 'agent_status':
      console.log('Agent status:', message.payload);
      break;
    case 'error':
      console.error('Error:', message.payload);
      break;
  }
};

// Subscribe to task updates
ws.send(JSON.stringify({
  type: 'subscribe',
  payload: { taskId: 'task_123' }
}));
```

### 10. Batch Operations

Execute multiple operations in a single request.

**Endpoint:** `POST /batch`

**TypeScript:**
```typescript
const batchRequest: BatchRequest = {
  requests: [
    {
      id: 'task1',
      method: 'POST',
      url: '/v1/tasks',
      body: {
        type: 'code_generation',
        title: 'Create login form',
        input: { framework: 'react' }
      }
    },
    {
      id: 'task2',
      method: 'GET',
      url: '/v1/providers/status'
    }
  ],
  options: {
    concurrency: 2,
    timeout: 60000
  }
};

const response = await fetch('/v1/batch', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(batchRequest)
});

const result: ApiResponse<BatchResponse> = await response.json();
```

## Error Handling

All API responses follow this structure:

```json
{
  "error": {
    "type": "invalid_request_error",
    "message": "The request format was invalid",
    "code": "INVALID_INPUT",
    "details": {
      "field": "options.timeout",
      "expected": "number",
      "received": "string"
    }
  },
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-04-03T18:57:47Z",
    "version": "v2.0.0"
  }
}
```

Common error types:
- `invalid_request_error`: The request was malformed
- `authentication_error`: Invalid or missing API key
- `authorization_error`: Insufficient permissions
- `rate_limit_error`: Request rate limit exceeded
- `provider_error`: Issue with underlying AI provider
- `timeout_error`: Request timed out
- `validation_error`: Input validation failed
- `internal_error`: Server-side error

## SDK Integration

The Ultra-Dex SDK provides convenient wrappers for all API endpoints:

```typescript
import { UltraDex } from '@ultra-dex/sdk';

const client = new UltraDex({
  apiKey: process.env.ULTRADEX_API_KEY
});

// Execute a task
const result = await client.executeTask({
  type: 'code_generation',
  title: 'Create authentication middleware',
  input: { language: 'javascript', framework: 'express' },
  options: {
    agents: ['coder', 'reviewer'],
    priority: 'high'
  }
});

// Stream chat responses
const stream = client.stream('Explain async/await in JavaScript');
for await (const chunk of stream) {
  console.log(chunk.content);
}

// Query memory
const memories = await client.queryMemory({
  query: 'authentication best practices',
  limit: 5
});
```

## Rate Limits

The API enforces rate limits to ensure fair usage:
- **Free tier**: 100 requests per minute, 1000 per hour
- **Pro tier**: 500 requests per minute, 5000 per hour
- **Enterprise tier**: 1000+ requests per minute, custom limits

Rate limit information is included in response headers:
- `X-RateLimit-Limit`: Max requests allowed per minute
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Time when current window resets (Unix timestamp)
- `X-RateLimit-Retry-After`: Seconds to wait before retrying (when limit exceeded)

```typescript
// Handle rate limiting
const response = await fetch('/v1/tasks', { /* ... */ });

if (response.status === 429) {
  const retryAfter = response.headers.get('X-RateLimit-Retry-After');
  console.log(`Rate limited. Retry after ${retryAfter} seconds`);
  await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
}
```

## Pagination

List endpoints support pagination:

```typescript
const response = await fetch('/v1/tasks?page=2&limit=20', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: ResponseMetadata & {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}
```

## Webhooks

Configure webhooks for real-time notifications:

```typescript
// Register webhook
await fetch('/v1/webhooks', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://myapp.com/webhooks/ultradex',
    events: ['task.completed', 'task.failed'],
    secret: 'webhook-secret'
  })
});
```

Webhook payload structure:
```json
{
  "event": "task.completed",
  "data": {
    "taskId": "task_123",
    "result": { /* TaskResult */ }
  },
  "timestamp": "2026-04-03T18:57:47Z",
  "signature": "sha256=..."
}
```