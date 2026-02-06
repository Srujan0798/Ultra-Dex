# SaaS Analytics Example

Real-time analytics dashboard for SaaS applications using Ultra-Dex methodology.

## Overview

**Product:** Plug-and-play analytics for SaaS - track users, events, and revenue.

**Tech Stack:**

- Frontend: Next.js 15 + Tremor (dashboard UI)
- Backend: Node.js + tRPC
- Database: ClickHouse (time-series analytics)
- Cache: Redis
- Queue: BullMQ (background jobs)
- Real-time: WebSocket + SSE
- Deployment: Railway

## Core Value Proposition

**Problem:** Google Analytics is too generic for SaaS. Mixpanel is expensive. Developers need simple, code-first analytics.

**Solution:** Developer-friendly analytics SDK with:

- Simple event tracking: `analytics.track('signup', { plan: 'pro' })`
- Real-time dashboard
- SQL query interface
- Automatic funnel analysis
- Revenue tracking

## Architecture

```
┌─────────────────────────────────────────┐
│              SDK (Client)               │
│         Browser / Node.js / React       │
└──────────────┬──────────────────────────┘
               │ HTTP / Beacon API
┌──────────────▼──────────────────────────┐
│              API Gateway                │
│         Rate Limiting + Auth            │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
┌───────▼──────┐ ┌────▼──────┐
│   Events     │ │  Queue    │
│   Validation │ │  (BullMQ) │
└───────┬──────┘ └────┬──────┘
        │             │
┌───────▼─────────────▼──────┐
│      Data Pipeline         │
│  Transform + Enrich        │
└───────┬────────────────────┘
        │
┌───────▼────────────────────┐
│    ClickHouse (Analytics)  │
│    Redis (Cache)           │
└────────────────────────────┘
```

## Key Features

### 1. Event Tracking SDK

```typescript
// Simple integration
import { Analytics } from '@ultra-analytics/sdk';

const analytics = new Analytics({
  apiKey: 'your-api-key',
  host: 'https://analytics.yourapp.com',
});

// Track events
analytics.track('user_signup', {
  plan: 'pro',
  source: 'google',
  referrer: document.referrer,
});

// Identify users
analytics.identify('user_123', {
  email: 'user@example.com',
  plan: 'pro',
  mrr: 99,
});

// Page views (auto)
analytics.page();
```

### 2. Real-time Dashboard

- Live user count
- Event stream visualization
- Geographic heat map
- Device/browser breakdown
- Custom event explorer

### 3. Funnel Analysis

```sql
-- Automatic funnel queries
SELECT
  step_1,
  step_2,
  step_3,
  conversion_rate
FROM funnel(
  'user_signup',
  'onboarding_complete',
  'first_payment'
)
WHERE time > now() - INTERVAL 30 DAY
```

### 4. Revenue Analytics

- MRR/ARR tracking
- Churn analysis
- LTV calculations
- Revenue by plan
- Cohort retention

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Day 1-2: Project Setup**

- [ ] Next.js project with TypeScript
- [ ] tRPC setup with type-safe API
- [ ] Tremor dashboard components
- [ ] ClickHouse schema design

**Day 3-4: Event Ingestion**

- [ ] REST API for event collection
- [ ] Event validation (Zod schemas)
- [ ] Redis queue for buffering
- [ ] Background worker (BullMQ)

**Day 5: SDK**

- [ ] Browser SDK (umd + esm)
- [ ] Node.js SDK
- [ ] React hooks
- [ ] TypeScript types

### Phase 2: Dashboard (Week 2)

**Day 1-2: Real-time Views**

- [ ] Live user counter (WebSocket)
- [ ] Event stream component
- [ ] Time-series charts
- [ ] Auto-refresh (30s)

**Day 3-4: Analytics**

- [ ] Event explorer (filterable)
- [ ] User segmentation
- [ ] Basic retention chart
- [ ] CSV export

**Day 5: Polish**

- [ ] Dark mode
- [ ] Mobile responsive
- [ ] Loading states
- [ ] Error boundaries

### Phase 3: Advanced (Week 3)

**Week 3: Power Features**

- [ ] Funnel builder UI
- [ ] SQL query editor
- [ ] Custom dashboards
- [ ] Alert system
- [ ] Team collaboration

### Phase 4: Scale (Week 4)

- [ ] Performance optimization
- [ ] Data retention policies
- [ ] Multi-tenant isolation
- [ ] API rate limiting
- [ ] Documentation
- [ ] Launch

## Database Schema

**Events Table:**

```sql
CREATE TABLE events (
  timestamp DateTime64(3),
  event_id UUID,
  project_id String,
  event_name String,
  user_id String,
  anonymous_id String,
  properties JSON,
  context JSON
) ENGINE = MergeTree()
ORDER BY (project_id, event_name, timestamp);
```

**Sessions Table:**

```sql
CREATE TABLE sessions (
  session_id UUID,
  user_id String,
  project_id String,
  start_time DateTime64(3),
  end_time DateTime64(3),
  duration_ms UInt32,
  pageviews UInt16,
  properties JSON
) ENGINE = MergeTree()
ORDER BY (project_id, start_time);
```

## Getting Started

```bash
# Clone example
git clone https://github.com/Srujan0798/ultra-dex-examples.git
cd ultra-dex-examples/saas-analytics

# Install
npm install

# Setup ClickHouse (Docker)
docker run -d -p 8123:8123 --name clickhouse clickhouse/clickhouse-server

# Environment
cp .env.example .env.local

# Database
npx clickhouse-migrate up

# Seed sample data
npm run seed

# Dev
npm run dev
```

## SDK Usage

```html
<!-- Simple HTML integration -->
<script src="https://cdn.ultra-analytics.com/sdk.js"></script>
<script>
  UltraAnalytics.init({ apiKey: 'your-key' });
  UltraAnalytics.track('page_view');
</script>
```

```typescript
// React integration
import { useAnalytics } from '@ultra-analytics/react';

function SignupButton() {
  const { track } = useAnalytics();

  return (
    <button onClick={() => track('signup_click')}>
      Sign Up
    </button>
  );
}
```

## API Endpoints

**Events:**

- `POST /api/v1/track` - Track event
- `POST /api/v1/identify` - Identify user
- `POST /api/v1/page` - Page view

**Query:**

- `POST /api/v1/query` - SQL query
- `GET /api/v1/metrics` - Pre-built metrics
- `GET /api/v1/funnel` - Funnel analysis

## Ultra-Dex Integration

```bash
# Generate plan
npx ultra-dex init
npx ultra-dex generate "Real-time analytics SaaS"

# Run specific agents
npx ultra-dex run backend "Create ClickHouse schema"
npx ultra-dex run frontend "Build dashboard with Tremor"

# Check alignment weekly
npx ultra-dex align

# Deploy
npx ultra-dex deploy --platform railway
```

## License

MIT
