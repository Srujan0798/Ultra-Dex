# Ultra-Dex Slack Integration

Real-time workflow notifications and Slack-native workflow management.

## Features

### 📨 Notifications
- Workflow start/completion/failure alerts
- Progress updates with node counts
- Cost tracking per workflow
- Error details and stack traces
- Custom notification levels (all/errors/completions/none)

### 💬 Slash Commands
| Command | Description |
|---------|-------------|
| `/ultradex run <workflow>` | Trigger workflow execution |
| `/ultradex status <workflow>` | Check workflow status |
| `/ultradex logs <workflow>` | View execution logs |
| `/ultradex list` | List all workflows |
| `/ultradex help` | Show help |

### 🏠 App Home
- Quick actions dashboard
- Workflow list with status
- Direct links to web dashboard

### 🔘 Interactive Buttons
- Re-run workflows from notifications
- View details in dashboard
- Approve/reject gated workflows

## Setup

### 1. Create Slack App
```bash
# Go to https://api.slack.com/apps
# Create New App -> From scratch
```

### 2. Configure OAuth & Permissions
Bot Token Scopes needed:
- `chat:write` - Post messages
- `chat:write.public` - Post in public channels
- `commands` - Slash commands
- `app_mentions:read` - Respond to mentions

### 3. Enable Socket Mode
For local development, enable Socket Mode to receive events without public URL.

### 4. Install & Configure
```typescript
import { SlackIntegration } from '@ultra-dex/slack-integration';

const slack = new SlackIntegration({
  botToken: process.env.SLACK_BOT_TOKEN!,
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  appToken: process.env.SLACK_APP_TOKEN!, // For Socket Mode
  defaultChannel: '#workflows',
  notificationLevels: ['all'],
  includeLogs: true,
});

await slack.initialize();

// Forward workflow events to Slack
engine.events.on('workflow.completed', (event) => {
  slack.notify({
    type: 'workflow.completed',
    workflowId: event.workflowId,
    workflowName: event.workflowName,
    timestamp: new Date().toISOString(),
    data: {
      status: event.status,
      durationMs: event.durationMs,
      totalCost: event.totalCost,
    },
  });
});
```

## Configuration Options

```typescript
interface SlackConfig {
  botToken: string;           // xoxb-... (required)
  signingSecret: string;      // From app credentials (required)
  appToken?: string;          // xapp-... (for Socket Mode)
  socketMode?: boolean;       // Default: true
  defaultChannel?: string;    // #channel-name
  webhookUrl?: string;        // For simple notifications
  notificationLevels?: Array<'all' | 'errors' | 'completions' | 'none'>;
  includeLogs?: boolean;      // Include logs in notifications
}
```

## Message Formats

### Workflow Started
```
🚀 Workflow Started: data-pipeline
Status: ⏳ running
```

### Workflow Completed
```
✅ Workflow Completed: data-pipeline
Status: ✅ success
Duration: 2m 30s
Cost: $0.0234
[Re-run] [View Details]
```

### Workflow Failed
```
❌ Workflow Failed: data-pipeline
Status: ❌ failed
Duration: 45s
Error: Connection timeout...
[Re-run] [View Details]
```

## Development

```bash
cd integrations/slack
npm install
npm run build
npm run dev  # Watch mode
```

## License

MIT
