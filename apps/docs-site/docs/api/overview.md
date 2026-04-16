# API Reference Overview

Ultra-Dex provides a comprehensive API for programmatic access to its features, allowing integration with other tools and custom automation workflows.

## API Architecture

### HTTP API
The Ultra-Dex HTTP API provides RESTful endpoints for:
- Project management
- Agent orchestration
- State management
- Context access
- Swarm control

### WebSocket API
Real-time bidirectional communication for:
- Live status updates
- Event streaming
- Interactive sessions
- Real-time collaboration

### MCP Protocol
Model Context Protocol endpoints for AI tool integration:
- File operations
- Code execution
- Context management
- Tool access

## Base URLs

### Development
- HTTP: `http://localhost:3001`
- WebSocket: `ws://localhost:3001/ws`

### Production
- HTTP: `https://api.ultra-dex.ai`
- WebSocket: `wss://api.ultra-dex.ai/ws`

## Authentication

### API Keys
Most endpoints require authentication using API keys:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.ultra-dex.ai/v1/projects
```

### Environment Variables
Set your API key as an environment variable:

```bash
export ULTRA_DEX_API_KEY=your_api_key_here
```

## HTTP API Endpoints

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Agents
- `GET /api/agents` - List available agents
- `POST /api/agents/{name}/run` - Run an agent
- `GET /api/agents/{name}` - Get agent details
- `GET /api/agents/status` - Get agent status

### Swarms
- `POST /api/swarm` - Start a new swarm
- `GET /api/swarm/{id}` - Get swarm status
- `GET /api/swarm` - List swarms
- `DELETE /api/swarm/{id}` - Stop swarm

### State
- `GET /api/state` - Get project state
- `PUT /api/state` - Update project state
- `GET /api/state/alignment` - Get alignment score

### Context
- `GET /api/context` - Get project context
- `PUT /api/context` - Update context
- `GET /api/context/summary` - Get context summary

## Request Format

### Headers
```http
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
X-Ultra-Dex-Version: 3.7.2
```

### Example Request
```json
{
  "objective": "Implement user authentication",
  "agents": ["@planner", "@backend", "@security"],
  "options": {
    "parallel": true,
    "verify": true
  }
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "objective",
      "reason": "Required field is missing"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `AUTHENTICATION_FAILED` | Invalid or missing API key |
| `VALIDATION_ERROR` | Request parameters validation failed |
| `RESOURCE_NOT_FOUND` | Requested resource does not exist |
| `RATE_LIMIT_EXCEEDED` | Too many requests from this client |
| `INTERNAL_ERROR` | Internal server error |
| `AGENT_UNAVAILABLE` | Requested agent is not available |
| `PERMISSION_DENIED` | Insufficient permissions for this operation |

## WebSocket Events

### Connection
Connect to: `ws://localhost:3001/ws`

### Event Types

#### Agent Status Updates
```json
{
  "type": "agent_status",
  "data": {
    "agent": "@backend",
    "status": "working",
    "activity": "Implementing API endpoints",
    "taskId": "task-123"
  }
}
```

#### Swarm Updates
```json
{
  "type": "swarm_update",
  "data": {
    "swarmId": "swarm-456",
    "status": "in_progress",
    "progress": 65,
    "activeAgents": ["@backend", "@frontend"]
  }
}
```

#### Context Updates
```json
{
  "type": "context_update",
  "data": {
    "projectId": "proj-789",
    "changedSections": ["architecture", "tech_stack"]
  }
}
```

## SDKs and Libraries

### JavaScript/Node.js
```javascript
import { UltraDexClient } from '@ultra-dex/client';

const client = new UltraDexClient({
  apiKey: process.env.ULTRA_DEX_API_KEY,
  baseURL: 'http://localhost:3001'
});

// Run an agent
const result = await client.agents.run('@planner', {
  task: 'Create project plan'
});
```

### Python
```python
from ultra_dex import UltraDexClient

client = UltraDexClient(api_key='YOUR_API_KEY')

# Start a swarm
result = client.swarm.start('Implement user authentication')
```

## Rate Limits

- **Free Tier**: 1,000 requests per hour
- **Pro Tier**: 10,000 requests per hour
- **Enterprise**: Custom limits

Rate limit headers:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
```

## Webhook Support

Configure webhooks to receive real-time notifications:

```json
{
  "url": "https://your-service.com/webhooks/ultra-dex",
  "events": ["swarm.completed", "agent.status_change"],
  "secret": "your-webhook-secret"
}
```

## Testing the API

### Using curl
```bash
# Get available agents
curl -H "Authorization: Bearer YOUR_API_KEY" \
     http://localhost:3001/api/agents

# Start a swarm
curl -X POST \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"objective": "Build API"}' \
     http://localhost:3001/api/swarm
```

### Using Postman
Import the Ultra-Dex Postman collection for easy testing:
- Base URL: `http://localhost:3001`
- Headers: Include `Authorization: Bearer {{API_KEY}}`
- Environment: Set `API_KEY` variable

## Best Practices

- Always handle rate limits gracefully
- Use exponential backoff for retry logic
- Implement proper error handling
- Log API requests for debugging
- Use HTTPS in production
- Rotate API keys periodically
- Validate responses before processing

## Next Steps

- Explore the [CLI Overview](./cli-overview.md) for command-line usage
- Review the [SDK Reference](/docs/sdk) for client libraries
- Check the [Troubleshooting Guide](/docs/troubleshooting) for common issues