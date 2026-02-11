# Ultra-Dex Enterprise API Reference

> **Version:** 6.0.0-OVERPOWERED  
> **Last Updated:** February 11, 2026  
> **Status:** Production Ready

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Teams](#teams)
3. [Projects](#projects)
4. [Agents](#agents)
5. [RBAC](#rbac)
6. [Audit Logs](#audit-logs)
7. [Error Handling](#error-handling)

---

## 🔐 Authentication

### POST /api/v1/auth/login

Authenticate user and receive access token.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "mfaCode": "123456" // Optional
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "developer"
    }
  }
}
```

**Error Codes:**

- `AUTH_001` - Invalid credentials
- `AUTH_002` - Account locked
- `AUTH_003` - MFA required

---

## 👥 Teams

### POST /api/v1/teams

Create a new team.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request:**

```json
{
  "name": "Engineering Team",
  "description": "Core engineering team",
  "settings": {
    "maxProjects": 10,
    "maxMembers": 5,
    "allowGuestAccess": false
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "team-456",
    "name": "Engineering Team",
    "description": "Core engineering team",
    "ownerId": "user-123",
    "createdAt": "2026-02-11T10:00:00Z",
    "settings": {
      "maxProjects": 10,
      "maxMembers": 5,
      "allowGuestAccess": false,
      "requireApprovalForProjects": false,
      "defaultProjectVisibility": "team"
    },
    "members": [
      {
        "id": "member-1",
        "userId": "user-123",
        "role": "owner",
        "status": "active",
        "joinedAt": "2026-02-11T10:00:00Z"
      }
    ]
  }
}
```

### GET /api/v1/teams

List teams for authenticated user.

**Response:**

```json
{
  "success": true,
  "data": {
    "teams": [
      {
        "id": "team-456",
        "name": "Engineering Team",
        "role": "owner",
        "memberCount": 5,
        "projectCount": 3
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

### POST /api/v1/teams/:teamId/members

Invite member to team.

**Request:**

```json
{
  "email": "newmember@example.com",
  "role": "developer",
  "message": "Welcome to the team!"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "invitation": {
      "id": "invite-789",
      "email": "newmember@example.com",
      "role": "developer",
      "status": "pending",
      "expiresAt": "2026-02-18T10:00:00Z"
    }
  }
}
```

---

## 📁 Projects

### POST /api/v1/projects

Create new project.

**Request:**

```json
{
  "name": "E-commerce Platform",
  "description": "Full-stack e-commerce solution",
  "template": "next15-saas",
  "teamId": "team-456",
  "visibility": "team"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "project-abc",
    "name": "E-commerce Platform",
    "description": "Full-stack e-commerce solution",
    "status": "initializing",
    "createdAt": "2026-02-11T10:00:00Z",
    "teamId": "team-456",
    "visibility": "team",
    "progress": {
      "overall": 0,
      "phases": []
    }
  }
}
```

### GET /api/v1/projects/:projectId

Get project details.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "project-abc",
    "name": "E-commerce Platform",
    "description": "Full-stack e-commerce solution",
    "status": "active",
    "createdAt": "2026-02-11T10:00:00Z",
    "updatedAt": "2026-02-11T15:30:00Z",
    "teamId": "team-456",
    "visibility": "team",
    "progress": {
      "overall": 45,
      "phases": [
        {
          "name": "Architecture",
          "status": "completed",
          "progress": 100
        },
        {
          "name": "Development",
          "status": "in_progress",
          "progress": 60
        }
      ]
    },
    "stats": {
      "filesCreated": 150,
      "linesOfCode": 12500,
      "agentsUsed": 8,
      "deployments": 3
    }
  }
}
```

### POST /api/v1/projects/:projectId/share

Share project with team.

**Request:**

```json
{
  "teamId": "team-789",
  "permissions": ["view", "edit"]
}
```

---

## 🤖 Agents

### GET /api/v1/agents

List available agents.

**Response:**

```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "planner",
        "name": "Planner",
        "description": "Task breakdown and sprint planning",
        "tier": "leadership",
        "capabilities": ["planning", "estimation", "breakdown"],
        "avgResponseTime": 1200
      },
      {
        "id": "backend",
        "name": "Backend Developer",
        "description": "API and server logic development",
        "tier": "development",
        "capabilities": ["api-design", "database", "business-logic"],
        "avgResponseTime": 2500
      }
    ]
  }
}
```

### POST /api/v1/agents/:agentId/execute

Execute agent task.

**Request:**

```json
{
  "objective": "Build user authentication API",
  "context": {
    "projectId": "project-abc",
    "techStack": ["Next.js", "Prisma", "PostgreSQL"],
    "requirements": ["JWT tokens", "Refresh tokens", "Password hashing"]
  },
  "options": {
    "sandbox": true,
    "autoDeploy": false,
    "approvalRequired": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "executionId": "exec-xyz",
    "agentId": "backend",
    "status": "running",
    "startedAt": "2026-02-11T10:00:00Z",
    "estimatedDuration": 300,
    "websocketUrl": "wss://api.ultra-dex.io/v1/executions/exec-xyz/stream"
  }
}
```

### GET /api/v1/agents/:agentId/executions/:executionId

Get execution status.

**Response:**

```json
{
  "success": true,
  "data": {
    "executionId": "exec-xyz",
    "agentId": "backend",
    "status": "completed",
    "startedAt": "2026-02-11T10:00:00Z",
    "completedAt": "2026-02-11T10:04:32Z",
    "duration": 272,
    "results": {
      "filesCreated": 5,
      "filesModified": 2,
      "testsGenerated": 12,
      "linesOfCode": 450
    },
    "artifacts": [
      {
        "type": "code",
        "path": "src/app/api/auth/login/route.ts",
        "content": "..."
      }
    ]
  }
}
```

---

## 🔒 RBAC

### GET /api/v1/roles

List all roles.

**Response:**

```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "role-super-admin",
        "name": "Super Admin",
        "description": "Full system access",
        "isSystem": true,
        "permissions": ["*"]
      },
      {
        "id": "role-developer",
        "name": "Developer",
        "description": "Standard development access",
        "isSystem": true,
        "permissions": ["project:view", "project:create", "project:edit", "code:read", "code:write"]
      }
    ]
  }
}
```

### POST /api/v1/roles

Create custom role.

**Request:**

```json
{
  "name": "Senior Developer",
  "description": "Senior developer with deployment access",
  "permissions": [
    "project:view",
    "project:create",
    "project:edit",
    "project:delete",
    "code:read",
    "code:write",
    "deployment:create",
    "deployment:approve"
  ]
}
```

### POST /api/v1/roles/assign

Assign role to user.

**Request:**

```json
{
  "userId": "user-789",
  "roleId": "role-developer",
  "scope": {
    "type": "team",
    "id": "team-456"
  },
  "expiresAt": "2026-12-31T23:59:59Z" // Optional
}
```

### POST /api/v1/permissions/check

Check user permissions.

**Request:**

```json
{
  "userId": "user-789",
  "permission": "project:delete",
  "scope": {
    "type": "team",
    "id": "team-456"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "allowed": true,
    "reason": "Permission granted",
    "permissions": ["project:view", "project:create", "project:edit", "project:delete"]
  }
}
```

---

## 📊 Audit Logs

### GET /api/v1/audit/logs

Query audit logs.

**Query Parameters:**

- `startDate` - ISO 8601 date
- `endDate` - ISO 8601 date
- `types` - Comma-separated event types
- `userId` - Filter by user
- `severity` - Filter by severity
- `limit` - Results limit (default: 100)
- `offset` - Pagination offset

**Response:**

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "audit-123",
        "timestamp": "2026-02-11T10:00:00Z",
        "type": "user.login",
        "severity": "info",
        "userId": "user-123",
        "action": "USER_LOGIN_SUCCESS",
        "resource": "authentication",
        "details": {
          "ipAddress": "192.168.1.1",
          "userAgent": "Mozilla/5.0...",
          "method": "password"
        }
      }
    ],
    "total": 1523,
    "page": 1,
    "limit": 100
  }
}
```

### GET /api/v1/audit/stats

Get audit statistics.

**Query Parameters:**

- `startDate` - Required
- `endDate` - Required

**Response:**

```json
{
  "success": true,
  "data": {
    "totalEvents": 1523,
    "eventsByType": {
      "user.login": 342,
      "ai.request": 856,
      "code.modified": 245,
      "permission.changed": 12
    },
    "eventsBySeverity": {
      "info": 1456,
      "warning": 45,
      "error": 20,
      "critical": 2
    },
    "uniqueUsers": 23,
    "timeRange": {
      "start": "2026-02-01T00:00:00Z",
      "end": "2026-02-11T23:59:59Z"
    }
  }
}
```

### POST /api/v1/audit/export

Export audit logs.

**Request:**

```json
{
  "startDate": "2026-02-01T00:00:00Z",
  "endDate": "2026-02-11T23:59:59Z",
  "format": "csv", // or "json", "pdf"
  "filters": {
    "types": ["user.login", "security.alert"],
    "severities": ["warning", "error", "critical"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://storage.ultra-dex.io/audits/audit-export-2026-02-11.csv",
    "expiresAt": "2026-02-11T11:00:00Z",
    "recordCount": 67
  }
}
```

---

## ⚠️ Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Invalid credentials provided",
    "category": "authentication",
    "severity": "high",
    "details": {
      "attempt": 3,
      "maxAttempts": 5
    },
    "timestamp": "2026-02-11T10:00:00Z",
    "requestId": "req-abc-123"
  }
}
```

### Error Categories

- `validation` (400) - Invalid input data
- `authentication` (401) - Authentication required/failed
- `authorization` (403) - Insufficient permissions
- `not_found` (404) - Resource not found
- `conflict` (409) - Resource conflict
- `rate_limit` (429) - Too many requests
- `external_service` (502/503) - External service error
- `internal` (500) - Internal server error

### Rate Limiting

API requests are rate-limited per user:

- **Standard:** 100 requests/minute
- **Enterprise:** 1000 requests/minute

Rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1644576000
```

---

## 📈 Webhooks

### Supported Events

- `project.created`
- `project.updated`
- `agent.execution.completed`
- `team.member.invited`
- `audit.security.alert`

### Webhook Payload Format

```json
{
  "event": "project.created",
  "timestamp": "2026-02-11T10:00:00Z",
  "data": {
    "projectId": "project-abc",
    "name": "E-commerce Platform",
    "createdBy": "user-123"
  }
}
```

---

## 🔗 SDK Examples

### JavaScript/TypeScript

```typescript
import { UltraDexClient } from '@ultra-dex/sdk';

const client = new UltraDexClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.ultra-dex.io',
});

// Create team
const team = await client.teams.create({
  name: 'Engineering',
  description: 'Core engineering team',
});

// Execute agent
const execution = await client.agents.execute('backend', {
  objective: 'Build auth API',
  context: { projectId: 'project-abc' },
});

// Check execution status
const status = await client.agents.getExecutionStatus(execution.id);
```

### cURL Examples

```bash
# Authentication
curl -X POST https://api.ultra-dex.io/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123"
  }'

# List agents
curl https://api.ultra-dex.io/v1/agents \
  -H "Authorization: Bearer YOUR_TOKEN"

# Execute agent
curl -X POST https://api.ultra-dex.io/v1/agents/backend/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "Build user auth API",
    "context": {
      "projectId": "project-abc"
    }
  }'
```

---

## 📚 Additional Resources

- [SDK Documentation](https://docs.ultra-dex.io/sdk)
- [Webhook Guide](https://docs.ultra-dex.io/webhooks)
- [Error Codes Reference](https://docs.ultra-dex.io/errors)
- [Changelog](https://docs.ultra-dex.io/changelog)

---

**Support:** support@ultra-dex.io  
**Status Page:** https://status.ultra-dex.io
