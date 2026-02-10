# Integrations Guide

Ultra-Dex provides real API integrations with common tools. Each integration validates config, retries on transient errors, and surfaces actionable error messages.

---

## Supported Integrations

| Integration | Purpose | Primary Auth |
| --- | --- | --- |
| Jira | Issues, epics, story sync | Email + API token |
| Notion | Plan sync to databases | Integration token |
| Trello | Kanban boards and cards | API key + token |
| Slack | Notifications and workflow | Bot token |
| Discord | Notifications and bots | Bot token |
| GitHub | Repo status, PR/issue workflows | PAT or GitHub App |
| Stripe | Billing, subscriptions, webhooks | Secret key |
| Vercel | Deployments and logs | Token |
| Supabase | Project status and admin ops | Service key |
| Linear | Issue workflows | API key |
| Segment | Analytics event routing | Write key |

---

## Configuration Pattern

Most integrations accept a config object or environment variables:

```ts
{
  token: "...",
  baseUrl?: "...",
  retries?: 3,
  timeoutMs?: 15000
}
```

Common environment variables:
- `ULTRA_DEX_INTEGRATIONS_DIR`
- `JIRA_DOMAIN`, `JIRA_EMAIL`, `JIRA_API_TOKEN`
- `NOTION_API_KEY`
- `TRELLO_API_KEY`, `TRELLO_TOKEN`
- `SLACK_BOT_TOKEN`, `DISCORD_BOT_TOKEN`
- `GITHUB_TOKEN`
- `STRIPE_SECRET_KEY`
- `VERCEL_TOKEN`
- `SUPABASE_SERVICE_KEY`
- `LINEAR_API_KEY`
- `SEGMENT_WRITE_KEY`

---

## Jira
**File:** `cli/lib/integrations/jira.js`

Supported operations:
- Create issues
- Update and transition issues
- Search using JQL

Example:
```js
const client = new JiraClient({ domain, email, apiToken });
await client.createIssue({ projectKey: 'UDX', summary: 'Implement billing' });
```

---

## Notion
**File:** `cli/lib/integrations/notion.js`

Supported operations:
- Create pages
- Query databases
- Sync plan sections

---

## Trello
**File:** `cli/lib/integrations/trello.js`

Supported operations:
- Create boards
- Create lists
- Create cards and checklists

---

## Slack
**File:** `cli/lib/integrations/slack.js`

Supported operations:
- Send messages with blocks
- Create channels
- Webhook handling

---

## Discord
**File:** `cli/lib/integrations/discord.js`

Supported operations:
- Rich embeds
- Command handling
- Role management

---

## GitHub
**File:** `cli/lib/integrations/github.js`

Supported operations:
- Issue creation
- PR metadata fetch
- Repo status checks

---

## Stripe
**File:** `cli/lib/integrations/stripe.js`

Supported operations:
- Customers and subscriptions
- Checkout sessions
- Webhooks verification

---

## Vercel
**File:** `cli/lib/integrations/vercel.js`

Supported operations:
- Deployment triggers
- Environment variable sync

---

## Supabase
**File:** `cli/lib/integrations/supabase.js`

Supported operations:
- Status checks
- Admin operations

---

## Linear
**File:** `cli/lib/integrations/linear.js`

Supported operations:
- Issue creation
- Status updates

---

## Segment
**File:** `cli/lib/integrations/segment.js`

Supported operations:
- Identify, track, group events

---

## Troubleshooting

- Ensure API keys are valid and scoped correctly.
- Check network access for hosted endpoints.
- Use `--verbose` to see request errors.

For deeper reference material, see `docs/api/reference/API-REFERENCE.md`.
