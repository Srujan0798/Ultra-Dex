# AUTO-CEO — Automated Validation & Growth System

> AI-powered automation for market validation, sentiment analysis, and growth decision-making.

## Overview

AUTO-CEO is a semi-automated system that runs on a schedule to:

1. **Collect** market signals from Reddit
2. **Analyze** sentiment and extract insights
3. **Decide** continue/pivot/stop based on weighted confidence
4. **Draft** content for validation posts
5. **Track** leads and outreach
6. **Learn** from outcomes and auto-tune thresholds

## Quick Start

```bash
# Start the scheduler
npm run auto-ceo

# Check status
npm run auto-ceo:status

# Run one cycle (dry-run)
npm run auto-ceo:once

# Generate decision report
npm run auto-ceo:decision
```

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Reddit Scraper │────▶│ Sentiment        │────▶│ Decision        │
│  (every 30 min) │     │ Analyzer         │     │ Engine          │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                         │
                              ┌────────────────────────┘
                              ▼
                    ┌──────────────────┐
                    │ Decision:        │
                    │ CONTINUE/PIVOT/  │
                    │ STOP             │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌────────────┐ ┌──────────┐ ┌──────────────┐
       │ Content    │ │ Outreach │ │ Self-        │
       │ Drafter    │ │ Manager  │ │ Improvement  │
       └────────────┘ └──────────┘ └──────────────┘
```

## Components

### 1. Scheduler (`src/automation/scheduler.ts`)

- Cron-based job runner
- 6 scheduled jobs with retry logic
- Health monitoring & dead letter queue
- State persistence

**Jobs:**
| Job | Schedule | Description |
|-----|----------|-------------|
| reddit-scraper | _/30 _ \* \* _ | Scrape Reddit responses |
| sentiment-analyzer | _/30 \* \* \* _ | Analyze sentiment |
| decision-engine | 0 9 _ \* _ | Daily decision at 9am |
| content-drafter | 0 7 _ \* _ | Draft content at 7am |
| metrics-updater | 0 _ \* \* _ | Update metrics hourly |
| self-improvement | 0 6 _ \* 0 | Weekly analysis Sunday 6am |

### 2. Decision Engine (`src/automation/decision-engine.ts`)

Calculates confidence score (0.0-1.0):

```
base = (positive_sentiment × 0.3) + (buying_signals × 0.3) +
       (willing_to_pay × 0.2) + (interest_signals × 0.2)
penalty = competitor_mentions × 0.1
confidence = clamp(base - penalty, 0, 1)
```

**Decisions:**

- **CONTINUE** (≥0.7): Product-market fit validated
- **PIVOT** (0.3-0.7): Needs adjustment
- **STOP** (<0.3): Insufficient validation
- **INSUFFICIENT_DATA** (<5 signals)

### 3. Reddit Poster (`src/automation/reddit-poster.ts`)

**Semi-automated with mandatory approval:**

1. System drafts post from template
2. Saves to `content/queue/reddit/{id}.json`
3. Human reviews in dashboard
4. Clicks "Approve" → status: approved
5. Scheduler posts to Reddit

**Safety:**

- Kill switch: `config.enabled = false`
- Rate limits: 1 post/subreddit/24h, 5 DMs/day
- Account age check (warn <30 days)
- Karma check (warn <100)
- All posts logged

### 4. Content Drafter (`src/automation/content-drafter.ts`)

Generates platform-optimized content:

- **Twitter**: 280-char milestones, validation questions
- **LinkedIn**: Professional updates, technical deep-dives
- **Reddit**: Validation posts, update threads
- **Blog**: Long-form content

Templates in `content/templates/`

### 5. Sentiment Analyzer (`src/automation/sentiment-analyzer.ts`)

Local keyword-based analysis (no API needed):

- Lexicon matching with negation handling
- Signal extraction: buying, feature requests, pain points
- Weighted scoring

### 6. Outreach Manager (`src/automation/outreach-manager.ts`)

- Identifies leads from sentiment data
- Prioritizes by signal strength
- Tracks funnel: identified → drafted → approved → sent
- Respects do-not-contact list

### 7. Interview Analyzer (`src/automation/interview-analyzer.ts`)

Extracts structured insights from transcripts:

- Pain points, feature requests, objections
- Willingness to pay detection
- Cross-interview synthesis
- Generates markdown reports

### 8. Self Improvement (`src/automation/self-improvement.ts`)

- Tracks prediction accuracy
- Auto-tunes decision thresholds (±0.05/week)
- Bounded drift (±0.2 from initial)
- Identifies patterns (best posting times, subreddits)

## Configuration

### Environment Variables

```bash
# Reddit API (required for posting)
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USERNAME=your_username
REDDIT_PASSWORD=your_password

# Optional
ULTRA_DEX_AUTOMATION=true
AUTOMATION_APPROVAL_REQUIRED=true
```

### Decision Thresholds (`config/decision-thresholds.json`)

```json
{
  "continue_threshold": 0.7,
  "stop_threshold": 0.3,
  "min_signals_required": 5,
  "weights": {
    "sentiment": 0.3,
    "buying_signal": 0.3,
    "willingness_to_pay": 0.2,
    "interest_signal": 0.2
  }
}
```

## Human-in-the-Loop

| Action               | Automated? | Human Approval?       |
| -------------------- | ---------- | --------------------- |
| Scrape Reddit        | ✅ Yes     | ❌ No                 |
| Analyze sentiment    | ✅ Yes     | ❌ No                 |
| Calculate decision   | ✅ Yes     | ❌ No                 |
| **Post to Reddit**   | 🔸 Semi    | ✅ **One-click**      |
| **Send DMs**         | 🔸 Semi    | ✅ **One-click**      |
| **Execute decision** | 🔸 Semi    | ✅ **Confirm**        |
| Generate content     | ✅ Yes     | ❌ No (human reviews) |

**Human time: <30 min/week**

## File Structure

```
src/automation/
├── index.ts              # Module exports
├── scheduler.ts          # Cron job runner
├── job-runner.ts         # Individual job executor
├── state-store.ts        # State persistence
├── reddit-auth.ts        # Reddit OAuth
├── reddit-scraper.ts     # Comment scraper
├── reddit-poster.ts      # Post/reply/DM
├── sentiment-analyzer.ts # Local sentiment
├── decision-engine.ts    # Continue/pivot/stop
├── content-drafter.ts    # Content generation
├── outreach-manager.ts   # Lead tracking
├── interview-analyzer.ts # Interview analysis
└── self-improvement.ts   # Auto-tuning

content/
├── queue/                # Draft content queue
│   ├── twitter/
│   ├── linkedin/
│   ├── reddit/
│   └── dm/
└── templates/            # Content templates

config/
├── automation-schedule.json
├── decision-thresholds.json
└── reddit-config.json

.ultra-dex/automation/
├── state.json           # System state
├── scheduler-state.json
├── post-log.jsonl       # Audit log
└── logs/                # Daily logs
```

## Testing

```bash
# Run all automation tests
npm run test:automation

# Run specific component tests
npm run test:unit
npm run test:integration

# Full validation
npx tsx validate-auto-ceo.ts
```

## Safety & Ethics

- **Reddit ToS Compliant**: Read-only scraping, semi-automated posting
- **No AI Voice Deception**: Text-based interviews only
- **Bounded Self-Improvement**: Thresholds capped at ±0.2 drift
- **Human Override**: Can reset thresholds, stop automation, reject posts
- **Audit Trail**: All posts, decisions, and approvals logged

## Metrics

Track in dashboard:

- Reddit responses (count, sentiment %)
- Interested users (identified, contacted, interviewed)
- Decision confidence (trend over time)
- Content drafts (pending, approved, posted)
- Lead funnel (identified → drafted → sent → replied)

## Troubleshooting

**Scheduler not running?**

```bash
npm run auto-ceo:status
# Check for errors in .ultra-dex/automation/logs/
```

**Decision seems wrong?**

- Check `marketing/validation/DECISION.md` for evidence breakdown
- Manually override via dashboard
- Adjust thresholds in `config/decision-thresholds.json`

**Reddit posting fails?**

- Verify credentials in `.env`
- Check account age/karma warnings
- Review `post-log.jsonl` for errors
- Ensure approval gate is enabled

## License

MIT — See LICENSE file
