# Integrations Guide

Ultra-Dex ships with first‑class integrations. Each integration exposes a small, focused API with real network calls and robust error handling.

---

## General Pattern

Most integrations follow the same structure:
- Create a client with config values
- Validate required fields
- Perform API calls with retries and rate‑limit handling

Example:
```js
import { SomeClient } from 'cli/lib/integrations/some.js';
const client = new SomeClient({ apiKey: process.env.SOME_KEY });
const result = await client.list();
```

---

## Jira

**File:** `cli/lib/integrations/jira.js`  
**Auth:** Email + API token  
**Usage:**
```js
const client = new JiraClient({ domain, email, apiToken });
await client.createIssue({ projectKey: 'UDX', summary: 'Implement auth' });
```

---

## Notion

**File:** `cli/lib/integrations/notion.js`  
**Auth:** Notion integration token  
**Usage:**
```js
const client = new NotionClient(process.env.NOTION_API_KEY);
await client.syncPlanToNotion(databaseId, planData);
```

---

## Trello

**File:** `cli/lib/integrations/trello.js`  
**Auth:** API key + token  
**Usage:**
```js
const client = new TrelloClient(apiKey, token);
const board = await client.createBoard('Ultra-Dex Roadmap');
```

---

## Slack

**File:** `cli/lib/integrations/slack.js`  
**Auth:** Bot token  
**Features:** `sendMessage`, `createChannel`, interactive webhooks

---

## Discord

**File:** `cli/lib/integrations/discord.js`  
**Auth:** Bot token  
**Features:** Rich embeds, role management, command handling

---

## GitHub

**File:** `cli/lib/integrations/github.js`  
**Auth:** PAT or GitHub App token  
**Features:** issue creation, repo status, PR metadata

---

## Stripe

**File:** `cli/lib/integrations/stripe.js`  
**Auth:** Secret key  
**Features:** customer management, products, pricing, subscriptions

---

## Vercel

**File:** `cli/lib/integrations/vercel.js`  
**Auth:** Token  
**Features:** deployments, logs, envs

---

## Supabase

**File:** `cli/lib/integrations/supabase.js`  
**Auth:** Project key  
**Features:** DB health checks, admin operations

---

## Linear

**File:** `cli/lib/integrations/linear.js`  
**Auth:** API key  
**Features:** issue creation, status sync, labels

---

## Segment

**File:** `cli/lib/integrations/segment.js`  
**Auth:** Write key  
**Features:** identify, track, group

---

## Integration CLI Commands

```bash
ultra-dex integrate --list
ultra-dex integrate jira --sync plan.md
ultra-dex integrate notion --db <databaseId>
```

---

## Configuration Validation

Each integration validates:
- Missing credentials
- Improper API endpoints
- Response errors / rate limits

When API calls fail, Ultra‑Dex will:
1. Retry with exponential backoff
2. Provide a clear error message
3. Offer a remediation hint
