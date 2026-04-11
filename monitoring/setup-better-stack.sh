#!/bin/bash
# Better Stack Setup - Best SaaS Monitoring
# https://betterstack.com

echo "═══════════════════════════════════════════════════════════════════"
echo "   🥇 SETTING UP BETTER STACK (Best SaaS Monitoring)"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Why Better Stack?"
echo "  ✅ 10 monitors FREE (vs 5 Hyperping, 50 UptimeRobot)"
echo "  ✅ Log aggregation included (like $100+/mo Datadog)"
echo "  ✅ Beautiful status pages"
echo "  ✅ Incident management built-in"
echo "  ✅ Phone call alerts when needed"
echo "  ✅ Modern, fast UI"
echo ""

SERVICE_URL="https://ultra-dex.onrender.com"
SERVICE_NAME="Ultra-Dex"

echo "📋 STEP-BY-STEP SETUP GUIDE"
echo ""

# Create Better Stack config
cat > monitoring/better-stack-config.json << 'BETTEREOF'
{
  "service": {
    "name": "Ultra-Dex",
    "url": "https://ultra-dex.onrender.com",
    "better_stack_signup": "https://betterstack.com"
  },
  "monitors": [
    {
      "name": "Ultra-Dex Health",
      "url": "https://ultra-dex.onrender.com/health",
      "type": "http",
      "expected_status": 200,
      "check_interval": 60,
      "regions": ["us-east", "us-west", "eu-west"],
      "alert_on": ["down", "slow_response"],
      "priority": "critical"
    },
    {
      "name": "Ultra-Dex API",
      "url": "https://ultra-dex.onrender.com/api/status",
      "type": "http",
      "expected_status": 200,
      "check_interval": 60,
      "regions": ["us-east"],
      "alert_on": ["down"],
      "priority": "high"
    },
    {
      "name": "Ultra-Dex Auth",
      "url": "https://ultra-dex.onrender.com/api/auth/register",
      "type": "http",
      "method": "POST",
      "body": "{\"email\":\"test@test.com\",\"password\":\"test\",\"name\":\"Test\"}",
      "headers": {
        "Content-Type": "application/json"
      },
      "expected_status": 400,
      "check_interval": 300,
      "priority": "medium"
    },
    {
      "name": "Ultra-Dex Billing",
      "url": "https://ultra-dex.onrender.com/api/billing/pricing",
      "type": "http",
      "expected_status": 200,
      "check_interval": 300,
      "priority": "medium"
    }
  ],
  "heartbeats": [
    {
      "name": "Daily Backup",
      "expected_interval": 86400,
      "alert_after": 90000
    },
    {
      "name": "Hourly Sync",
      "expected_interval": 3600,
      "alert_after": 7200
    }
  ],
  "status_page": {
    "title": "Ultra-Dex Status",
    "description": "Real-time status of Ultra-Dex AI Platform services",
    "custom_domain": "status.ultra-dex.ai",
    "logo_url": "",
    "show_uptime_graph": true,
    "show_response_times": true,
    "timezone": "UTC",
    "incident_history": true
  },
  "alerting": {
    "email": {
      "enabled": true,
      "addresses": ["srujansai1010@gmail.com"]
    },
    "slack": {
      "enabled": false,
      "webhook_url": "",
      "channel": "#alerts"
    },
    "discord": {
      "enabled": false,
      "webhook_url": ""
    },
    "pagerduty": {
      "enabled": false,
      "integration_key": ""
    },
    "phone": {
      "enabled": false,
      "number": "",
      "note": "Requires paid plan ($25/mo)"
    }
  },
  "incident_management": {
    "auto_create_incidents": true,
    "severity_levels": ["critical", "high", "medium", "low"],
    "escalation_policy": {
      "enabled": false,
      "steps": [
        { "after_minutes": 5, "notify": "email" },
        { "after_minutes": 15, "notify": "slack" },
        { "after_minutes": 30, "notify": "phone" }
      ]
    }
  },
  "logs": {
    "source": "ultra-dex-render",
    "ingestion": "https://in.logs.betterstack.com",
    "retention_days": 30
  }
}
BETTEREOF

echo "✅ Configuration saved to: monitoring/better-stack-config.json"
echo ""

# Create quick setup script
cat > monitoring/quick-setup-better-stack.sh << 'QUICKEOF'
#!/bin/bash
# Quick Better Stack setup for Ultra-Dex

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           BETTER STACK QUICK SETUP                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "📱 STEP 1: Sign up (30 seconds)"
echo "   → Go to: https://betterstack.com"
echo "   → Click: 'Get Started Free'"
echo "   → Sign up with: srujansai1010@gmail.com"
echo ""

read -p "Press Enter after you've signed up..."

echo ""
echo "🔍 STEP 2: Add Monitors (2 minutes)"
echo "   Click: 'Monitors' → 'Create Monitor'"
echo ""
echo "   Add these 4 monitors:"
echo ""
echo "   1️⃣  Health Check"
echo "       Name: Ultra-Dex Health"
echo "       URL: https://ultra-dex.onrender.com/health"
echo "       Interval: 1 minute"
echo "       Regions: US East, US West, EU West"
echo ""
echo "   2️⃣  API Status"
echo "       Name: Ultra-Dex API"
echo "       URL: https://ultra-dex.onrender.com/api/status"
echo "       Interval: 1 minute"
echo ""
echo "   3️⃣  Auth Endpoint"
echo "       Name: Ultra-Dex Auth"
echo "       URL: https://ultra-dex.onrender.com/api/auth/register"
echo "       Method: POST"
echo "       Body: {\"email\":\"test@test.com\",\"password\":\"test\",\"name\":\"Test\"}"
echo "       Expected: 400 (user exists)"
echo "       Interval: 5 minutes"
echo ""
echo "   4️⃣  Billing Endpoint"
echo "       Name: Ultra-Dex Billing"
echo "       URL: https://ultra-dex.onrender.com/api/billing/pricing"
echo "       Interval: 5 minutes"
echo ""

read -p "Press Enter after adding monitors..."

echo ""
echo "🎨 STEP 3: Create Status Page (1 minute)"
echo "   Click: 'Status Pages' → 'Create Status Page'"
echo ""
echo "   Settings:"
echo "       Title: Ultra-Dex Status"
echo "       Description: Real-time status of Ultra-Dex AI Platform"
echo "       Select all 4 monitors"
echo "       Show: Uptime graph, response times, incident history"
echo ""

read -p "Press Enter after creating status page..."

echo ""
echo "🔔 STEP 4: Setup Alerts (30 seconds)"
echo "   Click: 'Integrations' → 'Add Integration'"
echo ""
echo "   Add Email:"
echo "       srujansai1010@gmail.com"
echo ""
echo "   Add Slack (optional):"
echo "       Create webhook at: https://api.slack.com/messaging/webhooks"
echo "       Paste webhook URL"
echo ""

read -p "Press Enter after setting up alerts..."

echo ""
echo "✅ SETUP COMPLETE!"
echo ""
echo "Your monitoring is now active:"
echo "   🟢 Monitors: 4 services"
echo "   📊 Status Page: https://better-stack.com/r/xxxxx"
echo "   📧 Alerts: Email + Slack"
echo "   📈 Logs: 100k/month free"
echo ""
echo "Free Tier Limits:"
echo "   Monitors: 10 (using 4)"
echo "   Logs: 100k/month"
echo "   Team: 3 members"
echo "   Retention: 30 days"
echo ""
echo "Upgrade when needed:"
echo "   Freelancer: $25/mo (50 monitors, 1M logs)"
echo ""
QUICKEOF

chmod +x monitoring/quick-setup-better-stack.sh

echo "✅ Quick setup script created"
echo ""

# Create integration code for Ultra-Dex
cat > src/core/monitoring/better-stack-logger.ts << 'LOGGEREOF'
/**
 * Better Stack Log Integration
 * Send logs to Better Stack for centralized monitoring
 */

const BETTER_STACK_SOURCE_TOKEN = process.env.BETTER_STACK_SOURCE_TOKEN;
const BETTER_STACK_ENDPOINT = 'https://in.logs.betterstack.com';

interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export class BetterStackLogger {
  private sourceToken: string;
  
  constructor(sourceToken?: string) {
    this.sourceToken = sourceToken || BETTER_STACK_SOURCE_TOKEN || '';
  }
  
  async log(level: LogEntry['level'], message: string, metadata?: Record<string, unknown>): Promise<void> {
    if (!this.sourceToken) {
      // Fallback to console if no token
      console[level](message, metadata);
      return;
    }
    
    const entry: LogEntry = {
      level,
      message,
      metadata: {
        ...metadata,
        service: 'ultra-dex',
        environment: process.env.NODE_ENV || 'development'
      },
      timestamp: new Date().toISOString()
    };
    
    try {
      await fetch(BETTER_STACK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.sourceToken}`
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      // Fallback to console on error
      console.error('Failed to send log to Better Stack:', error);
      console[level](message, metadata);
    }
  }
  
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, metadata);
  }
  
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', message, metadata);
  }
  
  error(message: string, metadata?: Record<string, unknown>): void {
    this.log('error', message, metadata);
  }
  
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', message, metadata);
  }
}

export const betterStackLogger = new BetterStackLogger();
LOGGEREOF

echo "✅ Better Stack logger integration created"
echo ""

# Create heartbeat sender for background jobs
cat > src/core/monitoring/better-stack-heartbeat.ts << 'HEARTBEATEOF'
/**
 * Better Stack Heartbeat Integration
 * Monitor background jobs and cron tasks
 */

const BETTER_STACK_HEARTBEAT_URL = process.env.BETTER_STACK_HEARTBEAT_URL;

export class BetterStackHeartbeat {
  private baseUrl: string;
  
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || BETTER_STACK_HEARTBEAT_URL || '';
  }
  
  /**
   * Send heartbeat signal
   * Use this at the end of cron jobs or background tasks
   */
  async send(heartbeatId: string): Promise<void> {
    if (!this.baseUrl) {
      console.log(`[Heartbeat] ${heartbeatId} - Skipped (no URL configured)`);
      return;
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/${heartbeatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log(`[Heartbeat] ${heartbeatId} - Sent successfully`);
      } else {
        console.error(`[Heartbeat] ${heartbeatId} - Failed: ${response.status}`);
      }
    } catch (error) {
      console.error(`[Heartbeat] ${heartbeatId} - Error:`, error);
    }
  }
  
  /**
   * Use this for daily backups
   */
  async dailyBackup(): Promise<void> {
    await this.send('daily-backup');
  }
  
  /**
   * Use this for hourly syncs
   */
  async hourlySync(): Promise<void> {
    await this.send('hourly-sync');
  }
  
  /**
   * Use this for weekly reports
   */
  async weeklyReport(): Promise<void> {
    await this.send('weekly-report');
  }
}

export const betterStackHeartbeat = new BetterStackHeartbeat();
HEARTBEATEOF

echo "✅ Better Stack heartbeat integration created"
echo ""

# Create environment template
cat > monitoring/.env.better-stack << 'ENVEOF'
# Better Stack Configuration
# Get your tokens from: https://betterstack.com/integrations

# Log ingestion token (for sending logs)
BETTER_STACK_SOURCE_TOKEN=your-source-token-here

# Heartbeat URL (for cron job monitoring)
BETTER_STACK_HEARTBEAT_URL=https://heartbeat.betterstack.com

# Status Page URL (for reference)
BETTER_STACK_STATUS_PAGE=https://status.ultra-dex.ai

# Team members to invite
BETTER_STACK_TEAM_EMAILS=srujansai1010@gmail.com
ENVEOF

echo "✅ Environment template created"
echo ""

echo "═══════════════════════════════════════════════════════════════════"
echo "   ✅ BETTER STACK SETUP FILES CREATED"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "📁 Files created:"
echo "   monitoring/better-stack-config.json - Full configuration"
echo "   monitoring/quick-setup-better-stack.sh - Interactive setup"
echo "   monitoring/.env.better-stack - Environment template"
echo "   src/core/monitoring/better-stack-logger.ts - Log integration"
echo "   src/core/monitoring/better-stack-heartbeat.ts - Cron monitoring"
echo ""
echo "🚀 NEXT STEPS:"
echo ""
echo "   OPTION 1: Manual Setup (5 minutes)"
echo "      1. Go to https://betterstack.com"
echo "      2. Sign up with your email"
echo "      3. Add monitors from better-stack-config.json"
echo "      4. Create status page"
echo ""
echo "   OPTION 2: Interactive Setup"
echo "      Run: ./monitoring/quick-setup-better-stack.sh"
echo "      (Follow the prompts)"
echo ""
echo "   OPTION 3: One-Command (Coming Soon)"
echo "      Better Stack CLI setup (if available)"
echo ""
echo "💰 COST: $0/month (free tier)"
echo "   10 monitors, 100k logs, 3 users, 30-day retention"
echo ""
echo "⬆️  UPGRADE: $25/mo when you need more"
echo "   50 monitors, 1M logs, unlimited users"
echo ""