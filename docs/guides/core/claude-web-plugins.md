# Claude Web Interface Plugins — Recommendations for Ultra-Dex

## ✅ MUST ADD (Essential)

| Plugin | Why for Ultra-Dex | Priority |
|--------|-------------------|----------|
| **GitHub Integration** | Core to your product — repo management, PRs, code review | P0 |
| **Engineering** | Your product IS engineering — standups, code review, architecture | P0 |
| **Slack** | Team notifications, alerts from Ultra-Dex | P0 |
| **Data** | SQL queries for analytics, user insights, billing metrics | P0 |

## ✅ SHOULD ADD (High Value)

| Plugin | Why for Ultra-Dex | Priority |
|--------|-------------------|----------|
| **Product Management** | Feature specs, roadmap planning, user research | P1 |
| **Productivity** | Task management, calendar sync, context memory | P1 |
| **Enterprise Search** | Search across Ultra-Dex docs, issues, logs | P1 |
| **Operations** | Process docs, vendor management, compliance | P2 |
| **PDF Viewer** | View contracts, invoices, documentation | P2 |

## ❌ SKIP (Not Relevant)

| Plugin | Why Skip |
|--------|----------|
| **Zoom** | Ultra-Dex doesn't need video calls |
| **Bio Research** | Not a life sciences product |
| **HR** | Not managing employees yet |
| **Legal** | Maybe later when you have contracts |
| **Finance** | Stripe handles billing, don't need accounting |
| **Customer Support** | Not a support-heavy product |
| **Marketing** | Not doing campaigns yet |
| **Sales** | Apollo is better for B2B sales |
| **Brand Voice** | Not a content marketing company |
| **Common Room** | Community tool, not needed yet |
| **Design** | You're not a design tool |

## 🎯 RECOMMENDED SETUP (Order to Add)

### Step 1: Core (Do First)
1. **GitHub Integration** — Connect your repos
2. **Engineering** — For code workflows
3. **Slack** — For team alerts
4. **Data** — For analytics queries

### Step 2: Growth (Do Next)
5. **Product Management** — For roadmap
6. **Productivity** — For task tracking
7. **Enterprise Search** — For finding docs

### Step 3: Scale (Later)
8. **Operations** — When team grows
9. **PDF Viewer** — For contracts
10. **Apollo** — If doing B2B sales

## 🔌 How to Connect

**In Claude Web Interface:**
1. Go to Settings → Skills → Connectors
2. Click "Connect" on each plugin
3. Authorize with your account
4. Grant permissions

**For Ultra-Dex MCP Server:**
```json
{
  "mcpServers": {
    "ultra-dex": {
      "command": "npx",
      "args": ["-y", "@ultra-dex/mcp-server"],
      "env": {
        "ULTRA_DEX_API_KEY": "your-key"
      }
    }
  }
}
```

## 💡 Pro Tip

**Don't add all at once.** Start with GitHub + Engineering + Slack. Add others as you hit pain points.

The more plugins you add, the more context Claude has, but also the more complex it gets.
