# Integrations Guide

Ultra-Dex provides real API integrations with common tools. Each integration validates config, retries on transient errors, and surfaces actionable error messages.

---

## Jira
**File:** `cli/lib/integrations/jira.js`  
**Auth:** Email + API token  
**Features:** create/update/search issues, transitions, comments

```js
const client = new JiraClient({ domain, email, apiToken });
await client.createIssue({ projectKey: 'UDX', summary: 'Implement billing' });
```

---

## Notion
**File:** `cli/lib/integrations/notion.js`  
**Auth:** Notion integration token  
**Features:** page creation, DB sync, queries

---

## Trello
**File:** `cli/lib/integrations/trello.js`  
**Auth:** API key + token  
**Features:** boards, lists, cards, checklists

---

## Slack
**File:** `cli/lib/integrations/slack.js`  
**Auth:** Bot token  
**Features:** blocks, channels, webhooks

---

## Discord
**File:** `cli/lib/integrations/discord.js`  
**Auth:** Bot token  
**Features:** embeds, roles, command handling

---

## GitHub
**File:** `cli/lib/integrations/github.js`  
**Auth:** PAT or GitHub App token  
**Features:** repo status, issues, PR metadata

---

## Stripe
**File:** `cli/lib/integrations/stripe.js`  
**Auth:** Secret key  
**Features:** customers, products, pricing, subscriptions

---

## Vercel
**File:** `cli/lib/integrations/vercel.js`  
**Auth:** Token  
**Features:** deployments, logs, envs

---

## Supabase
**File:** `cli/lib/integrations/supabase.js`  
**Auth:** Project key  
**Features:** DB status, admin operations

---

## Linear
**File:** `cli/lib/integrations/linear.js`  
**Auth:** API key  
**Features:** issue creation, labels, status sync

---

## Segment
**File:** `cli/lib/integrations/segment.js`  
**Auth:** Write key  
**Features:** identify, track, group

---

## Configuration

Most integrations accept a config object with:
- `token` or `apiKey`
- optional `baseUrl` for self-hosted endpoints

Run:
```bash
ultra-dex integrate --list
```
