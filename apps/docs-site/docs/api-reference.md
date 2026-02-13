# Ultra-Dex API Reference

Welcome to the Ultra-Dex API Reference. This document provides comprehensive information about the Ultra-Dex platform's API endpoints, methods, and usage examples.

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

## Core Endpoints

### 1. Task Execution

Execute a task using the AI orchestration engine.

**Endpoint:** `POST /tasks`

**Request Body:**
```json
{
  "task": "Describe the task to execute",
  "options": {
    "agents": ["planner", "reviewer"],
    "providers": ["openai", "anthropic"],
    "timeout": 30000
  }
}
```

**Response:**
```json
{
  "id": "task_abc123",
  "status": "processing|completed|failed",
  "result": "...",
  "metadata": {
    "agents_used": ["planner"],
    "tokens_consumed": 1200,
    "execution_time": 2450
  }
}
```

### 2. Agent Management

List, create, or configure specialized agents.

**Endpoint:** `GET /agents`

**Response:**
```json
{
  "agents": [
    {
      "id": "planner",
      "name": "Project Planner",
      "capabilities": ["task_breakdown", "timeline_estimation"],
      "status": "active"
    },
    {
      "id": "reviewer",
      "name": "Code Reviewer",
      "capabilities": ["code_analysis", "security_check"],
      "status": "active"
    }
  ]
}
```

### 3. Memory Operations

Interact with the persistent memory system.

**Endpoint:** `POST /memory/query`

**Request Body:**
```json
{
  "query": "What decisions were made about the authentication system?",
  "context": "project_x",
  "limit": 5
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "mem_123",
      "content": "Decision: Use JWT tokens with refresh rotation...",
      "type": "decision",
      "timestamp": "2026-01-15T10:30:00Z",
      "tags": ["auth", "security"]
    }
  ]
}
```

### 4. Provider Status

Check the status of AI providers.

**Endpoint:** `GET /providers/status`

**Response:**
```json
{
  "providers": {
    "openai": {
      "status": "operational",
      "latency": 1200,
      "rate_limit_remaining": 95
    },
    "anthropic": {
      "status": "operational",
      "latency": 950,
      "rate_limit_remaining": 48
    }
  }
}
```

## Error Handling

All API responses follow this structure:

```json
{
  "error": {
    "type": "invalid_request_error",
    "message": "The request format was invalid",
    "code": "INVALID_INPUT"
  }
}
```

Common error types:
- `invalid_request_error`: The request was malformed
- `authentication_error`: Invalid or missing API key
- `rate_limit_error`: Request rate limit exceeded
- `provider_error`: Issue with underlying AI provider
- `timeout_error`: Request timed out

## SDK Integration

The Ultra-Dex SDK provides convenient wrappers for all API endpoints:

```javascript
import { UltraDex } from '@ultra-dex/sdk';

const client = new UltraDex({
  apiKey: process.env.ULTRADEX_API_KEY
});

// Execute a task
const result = await client.executeTask({
  task: "Plan a user authentication system",
  options: {
    agents: ["planner", "security"]
  }
});
```

## Rate Limits

The API enforces rate limits to ensure fair usage:
- Standard tier: 100 requests per minute
- Pro tier: 500 requests per minute
- Enterprise tier: 1000+ requests per minute

Rate limit information is included in response headers:
- `X-RateLimit-Limit`: Max requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when counter resets