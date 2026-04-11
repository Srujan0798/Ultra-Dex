# Source Management: Enterprise Search Configuration

**Generated:** 2026-04-11  
**Purpose:** Manage connected MCP sources for enterprise search

---

## Current Sources

| Source              | Status           | Priority    | Rate Limit |
| ------------------- | ---------------- | ----------- | ---------- |
| **Notion**          | ✅ Connected     | 1 (highest) | 3 req/sec  |
| **GitHub**          | ✅ Connected     | 2           | 5000/hour  |
| **Slack**           | ✅ Connected     | 3           | 20/min     |
| **Discord**         | ⚠️ Partial       | 4           | 10/min     |
| **Google Calendar** | ❌ Not connected | -           | -          |
| **Gmail**           | ❌ Not connected | -           | -          |

---

## Source Priority Rationale

| Priority | Source  | Reason                                         |
| -------- | ------- | ---------------------------------------------- |
| 1        | Notion  | Official docs, ADRs, specs (highest authority) |
| 2        | GitHub  | Code, PRs, issues (implementation truth)       |
| 3        | Slack   | Team discussions, decisions                    |
| 4        | Discord | Community, informal discussions                |

---

## Connection Guide

### Connect Notion

```
/source-management connect notion
→ OAuth flow
→ Select workspaces to index
→ Configure crawl schedule (default: daily)
```

### Connect GitHub

```
/source-management connect github
→ Personal access token (repo scope)
→ Select repositories (default: all)
→ Webhook for real-time updates
```

### Connect Slack

```
/source-management connect slack
→ OAuth with workspace
→ Select channels (default: #engineering, #product)
→ Message retention: 90 days
```

---

## Rate Limiting Strategy

| Source  | Limit   | Strategy                             |
| ------- | ------- | ------------------------------------ |
| Notion  | 3/sec   | Batch requests, cache responses      |
| GitHub  | 5000/hr | Respect If-Rate-Limited-Reset header |
| Slack   | 20/min  | Queue + exponential backoff          |
| Discord | 10/min  | Prioritize recent messages           |

---

## Add New Source

To connect additional MCP sources:

1. **Asana/Linear** - Project tracking integration
2. **Atlassian** - Confluence/Jira
3. **MS365** - Outlook, Teams
4. **Guru** - Knowledge base

Command: `/source-management add <source>`

---

## Monitoring

Track source health:

```
/source-management status
→ Shows: connected, errors, last sync, documents indexed
```

---

**Source configuration complete!** 4 sources connected, 2 available to add.
