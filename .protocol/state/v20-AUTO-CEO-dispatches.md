# V2.0 AUTO-CEO DISPATCHES — AUTOMATED VALIDATION & GROWTH (Week 18)
> Source: AUTO-CEO.md + KIMI CONSCIOUSNESS.md + /engineering:system-design + /marketing:campaign-plan
> Depends: Phases 1-4 dispatches exist as PLANS; current codebase is v6.0.0 (package.json) but 134/272 tests passing (80 fail, 58 cancelled)
> Skills Used: /engineering:system-design, /engineering:architecture, /marketing:content-creation, /marketing:campaign-plan, /data:analyze, /product-management:synthesize-research

---

## GROUND TRUTH AUDIT (Read This First)

**Claimed state:** "v6.0.0, 534 tests, 4 phases COMPLETE"
**Actual state:**
```
package.json version: 6.0.0 (bumped, but features are stubs/partial)
Tests: 134 pass / 80 fail / 58 cancelled = 49% pass rate
src/automation/: DOES NOT EXIST (must create from scratch)
src/core/routing/: EXISTS (bandit-router.ts, health-monitor.ts)
src/core/marketplace/: EXISTS (registry-api.ts, search.ts)
src/core/plugins/: EXISTS (loader, registry, types)
packages/vscode-extension/: EXISTS (scaffolded)
apps/dashboard/: EXISTS (Next.js app)
marketing/validation/: EXISTS (reddit-posts.md, response-tracker.md, interview-script.md)
AUTO-CEO.md: EXISTS (architecture doc)
.kimi/: EXISTS (CONSCIOUSNESS.md, memory/)
```

**What this means:** The feature files exist but many are incomplete or have failing tests. AUTO-CEO is an automation layer ON TOP of a codebase that's not fully stable yet. The dispatch must account for this.

**Decision:** Build AUTO-CEO as an independent automation module (`src/automation/`) that does NOT depend on Ultra-Dex core stability. It uses Reddit API, scheduling, and AI directly — not through the Ultra-Dex routing layer.

---

## CRITICAL ARCHITECTURE DECISIONS

### ADR-001: Reddit Automation Ethics & Legality

**Context:** Auto-posting and auto-DMing on Reddit.
**Decision:** SEMI-AUTOMATED, NOT FULLY AUTOMATED.

Reddit's API ToS (Section 5) prohibits:
- Automated bulk messaging
- Bot accounts that impersonate humans
- Automated upvoting/engagement manipulation

**Our approach:**
- **Auto-DRAFT** posts → human approves with one click → system posts
- **Auto-DETECT** interested users → human approves DM → system sends
- **Auto-SCRAPE** responses → fully automated (read-only is allowed)
- **Auto-ANALYZE** sentiment → fully automated (local processing)
- Account must be labeled as bot or use human account with manual approval gate

**Risk if ignored:** Reddit account ban, IP ban, legal exposure.

### ADR-002: AI Interviews — Text Only, No Voice Deception

**Context:** Conducting user interviews via AI.
**Decision:** TEXT-BASED CHAT ONLY. No AI voice impersonation.

- AI voice interviews without disclosure violate FTC guidelines and multiple state laws
- Text interviews via Reddit chat or email are fine IF disclosed as AI-assisted
- Opening line must include: "This is an AI-assisted interview for Ultra-Dex. Your responses help us build better tools."

### ADR-003: Decision Engine — Advisory, Not Autonomous

**Context:** System auto-decides continue/pivot/stop.
**Decision:** ADVISORY with human confirmation for irreversible actions.

- Data collection and analysis: FULLY AUTOMATED
- Score calculation: FULLY AUTOMATED
- Decision recommendation: FULLY AUTOMATED
- Executing the decision (killing a project, pivoting direction): HUMAN CONFIRMS
- Content posting, scaling budget: HUMAN CONFIRMS first 10, then auto after proven accuracy

### ADR-004: Minimum Viable Automation (Answer to Q7)

**Core 3 features that deliver 80% of value:**
1. **Response Scraper + Sentiment Analyzer** — automated data collection
2. **Decision Engine** — automated analysis and recommendation
3. **Content Drafter** — automated content creation (human posts)

Everything else is optimization on top of these three.

---

## PHASE OVERVIEW

**Thesis:** Build an automation layer that collects market signals, analyzes them, and recommends decisions — with human-in-the-loop for actions that touch external platforms. The system should run on a schedule (cron), store state in local files, and require <1hr/week of human time.

**Success Gate:**
```bash
# Scraper runs on schedule
node src/automation/scheduler.js status → "All jobs healthy, last run: 2 min ago"
# Sentiment analysis works
node src/automation/sentiment-analyzer.js --input marketing/validation/response-tracker.md → JSON scores
# Decision engine produces recommendation
node src/automation/decision-engine.js → { decision: "CONTINUE", confidence: 0.82, evidence: {...} }
# Content drafter generates posts
node src/automation/content-drafter.js --platform twitter --count 7 → 7 draft tweets in content/queue/
# Dashboard shows metrics
open apps/dashboard → AUTO-CEO tab with live metrics
```

**Total Windows:** 12 (4 per day × 3 days)
**Parallel Safe:** All windows within same day

---

## ANSWERS TO ARCHITECTURAL QUESTIONS

### Q1: Cheapest way to auto-post to Reddit?
**Answer:** PRAW (Python Reddit API Wrapper) via `snoowrap` (Node.js equivalent). Both are free, use OAuth2. Cost: $0. BUT — auto-posting violates ToS for marketing. Use semi-auto: system drafts, human clicks "approve" in dashboard, system posts via API. One click per post.

### Q2: How to avoid Reddit banning auto-DMs?
**Answer:** You can't safely auto-DM at scale. Reddit aggressively bans automated DMs. Instead: auto-detect interested users → generate personalized DM draft → human sends from their account. Alternative: reply publicly with "DM me if you want early access" — users come to you.

### Q3: Which AI voice tool for auto-interviews?
**Answer:** NONE for auto-interviews. Text-based only. Use structured chat via Reddit DM or email with clear AI disclosure. For voice: schedule real Calendly calls where YOU talk. 5 human interviews > 50 AI interviews for signal quality.

### Q4: How does system decide continue/pivot/stop?
**Answer:**
```
CONTINUE: positive_sentiment > 0.6 AND willing_to_pay >= 3 AND unique_feature_requests <= 3
PIVOT:    positive_sentiment 0.3-0.6 OR (willing_to_pay < 3 AND clear_alternative)
STOP:     positive_sentiment < 0.3 AND willing_to_pay == 0 AND responses < 5 after 7 days
```
Thresholds are configurable in `config/decision-thresholds.json`. System recalibrates weekly based on prediction accuracy.

### Q5: What if Reddit API changes?
**Answer:** Snoowrap abstracts the API. If Reddit kills API access (like they did to third-party apps in 2023): Fallback 1: RSS feeds (read-only, no posting). Fallback 2: Browser automation via Playwright (fragile but works). Fallback 3: Switch to Hacker News/Twitter API. The scraper has an adapter interface — swap backends without changing analysis logic.

### Q6: How to store credentials securely?
**Answer:** `.env` file (gitignored) for local dev. For production: Node.js `dotenv` + `process.env`. NEVER in config JSON. Reddit OAuth tokens stored in `~/.ultra-dex/auth/reddit.json` with 600 permissions. Rotate refresh tokens on each use.

### Q7: Minimum viable automation?
**Answer:** See ADR-004 above. Three features: Scraper, Decision Engine, Content Drafter. Total: ~800 LOC. Deliverable in 2 days.

---

## ═══════════════════════════════════════════════
## DAY 1: DATA COLLECTION LAYER (Read-Only Automation)
## ═══════════════════════════════════════════════

### Day 1 Parallel: W69, W70, W71, W72
### Gate: System scrapes Reddit responses, analyzes sentiment, stores results — zero human input needed

---

### [WINDOW 69] CLAUDE — claude-opus-4
Task ID: V20-W69-SCHEDULER-CORE
Objective: Build the automation scheduler — cron-based job runner with health monitoring and state persistence
Target Files: src/automation/scheduler.ts (NEW), src/automation/job-runner.ts (NEW), src/automation/state-store.ts (NEW), config/automation-schedule.json (NEW)
Why this lane: Scheduler is the backbone of AUTO-CEO. Must handle failures, retries, and state correctly. Opus for correctness.
Power Tier: HIGH
Command:
```bash
claude --model opus --effort max -p \
  "Build the AUTO-CEO job scheduler for Ultra-Dex.

   CREATE src/automation/scheduler.ts:
   1) AutoCEOScheduler class:
      - constructor(config): Load schedule from config/automation-schedule.json
      - start(): Begin all scheduled jobs
      - stop(): Graceful shutdown, persist state
      - status(): Return health of all jobs (last run, next run, errors)
      - Jobs:
        - reddit-scraper: every 30 min
        - sentiment-analyzer: after each scrape
        - decision-engine: daily at 9am
        - content-drafter: daily at 7am
        - metrics-updater: every 1 hour
        - self-improvement: weekly Sunday 6am

   2) Implementation:
      - Use node-cron for scheduling (lightweight, no external deps)
      - Each job: { id, cronExpression, handler, lastRun, nextRun, status, errorCount }
      - Retry logic: 3 retries with exponential backoff (1s, 5s, 30s)
      - Dead letter queue: jobs that fail 3x get logged, human notified
      - State file: .ultra-dex/automation/scheduler-state.json

   CREATE src/automation/job-runner.ts:
   - JobRunner class:
     - run(jobId): Execute job handler
     - timeout: 5 minutes per job (kill if hung)
     - logging: structured JSON logs to .ultra-dex/automation/logs/{date}.jsonl
     - metrics: track duration, success/fail, data volume per run

   CREATE src/automation/state-store.ts:
   - AutoCEOState class:
     - load(): Read state from disk
     - save(): Persist to disk (atomic write via rename)
     - get(key): Read state value
     - set(key, value): Write state value
     - State: last scrape results, sentiment scores, decision history, content queue
     - Location: .ultra-dex/automation/state.json

   CREATE config/automation-schedule.json:
   - Jobs array with cron expressions
   - Feature flags: { redditScraper: true, sentimentAnalyzer: true, ... }
   - Rate limits per job
   - Human approval gates: { posting: true, dming: true, interviews: false }

   IMPORTANT: This runs standalone — does NOT import from Ultra-Dex core.
   Only dependency: node-cron, winston (logging).
   Must work even if Ultra-Dex tests are failing."
```
Expected Output: Standalone scheduler with cron jobs, state persistence, health monitoring
Validation:
```bash
cd /path/to/ultra-dex
node -e "import('./src/automation/scheduler.ts')" # verify it loads
node src/automation/scheduler.ts status 2>/dev/null || echo "Needs compile step"
npx tsx src/automation/scheduler.ts status
```
Fallback #1: `claude --model claude-sonnet-4-20250514 --effort high -p "Build automation scheduler..."`
Fallback #2: `codex --full-auto -m o1 exec "Create cron-based job scheduler for automation..."`
Fallback #3: `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "Build Node.js cron scheduler with state persistence..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 70] CODEX — o1
Task ID: V20-W70-REDDIT-SCRAPER
Objective: Build Reddit response scraper using snoowrap — read-only, ToS-compliant, extracts comments/scores
Target Files: src/automation/reddit-scraper.ts (NEW), src/automation/reddit-auth.ts (NEW), config/reddit-config.json (NEW)
Why this lane: API integration with rate limiting requires careful implementation. Codex o1 for correctness under constraints.
Power Tier: HIGH
Command:
```bash
codex --full-auto -m o1 exec \
  "Build Reddit scraper for Ultra-Dex AUTO-CEO.

   CREATE src/automation/reddit-auth.ts:
   - RedditAuth class:
     - authenticate(): OAuth2 via snoowrap (script app type)
     - Credentials from env: REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD
     - Token refresh: auto-refresh before expiry
     - Rate limit: respect 60 requests/min, track remaining
     - Error handling: 429 → backoff, 403 → re-auth, 5xx → retry

   CREATE src/automation/reddit-scraper.ts:
   - RedditScraper class:
     - constructor(auth: RedditAuth)
     - scrapePost(postUrl): Get all comments on a post
       Return: { postId, title, upvotes, commentCount, comments: Comment[] }
       Comment: { id, author, body, score, created, sentiment: null }
     - scrapeSubreddit(name, query, limit): Search for Ultra-Dex mentions
     - scrapeUserHistory(username): Check if user is a potential lead
     - getPostMetrics(postUrl): upvotes, upvoteRatio, comments, crossPosts
     - Output: Append to marketing/validation/response-tracker.md (markdown table)
     - Also write raw JSON to .ultra-dex/automation/scrape-results/{postId}.json

   - Rate limiting:
     - Track API calls per minute
     - Queue requests if approaching limit
     - Log rate limit headers from every response

   - Deduplication:
     - Track seen comment IDs in state
     - Only process new comments on each scrape
     - Update existing comment scores (they change over time)

   CREATE config/reddit-config.json:
   - monitoredPosts: [] (URLs from marketing/validation/reddit-posts.md)
   - subreddits: ['LocalLLaMA', 'SaaS', 'Entrepreneur']
   - scrapeInterval: '*/30 * * * *'  (every 30 min)
   - maxCommentsPerPost: 500
   - searchTerms: ['ultra-dex', 'ai orchestration', 'llm routing']

   IMPORTANT: READ-ONLY operations only. No posting, no voting, no DMing.
   npm install snoowrap."
```
Expected Output: Reddit scraper that collects comments, scores, and updates response-tracker.md
Validation:
```bash
# Dry run (requires Reddit API credentials)
REDDIT_CLIENT_ID=test npx tsx src/automation/reddit-scraper.ts --dry-run
# Verify: outputs expected JSON structure without actual API calls
npx tsx -e "import { RedditScraper } from './src/automation/reddit-scraper'; console.log('loads')"
```
Fallback #1: `codex --full-auto -m gpt-4o exec "Build Reddit scraper with snoowrap..."`
Fallback #2: `claude --model claude-sonnet-4-20250514 --effort high -p "Build Reddit comment scraper..."`
Fallback #3: `opencode run -m opencode/deepseek-v3.2 -p "Build Reddit API scraper with snoowrap and rate limiting..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 71] CLAUDE — claude-sonnet-4-20250514
Task ID: V20-W71-SENTIMENT-ANALYZER
Objective: Build sentiment analysis pipeline — keyword + pattern matching, no external API needed
Target Files: src/automation/sentiment-analyzer.ts (NEW), config/sentiment-lexicon.json (NEW)
Why this lane: NLP pipeline with scoring rubric. Sonnet for balanced implementation.
Power Tier: BALANCED
Command:
```bash
claude --model claude-sonnet-4-20250514 --effort high -p \
  "Build sentiment analysis pipeline for Ultra-Dex AUTO-CEO.

   CREATE src/automation/sentiment-analyzer.ts:
   - SentimentAnalyzer class:
     - analyze(text): { score: -1.0 to 1.0, label: positive|negative|neutral, signals: string[] }
     - analyzeBatch(comments[]): Annotate each comment with sentiment
     - extractSignals(text): Interest signals beyond sentiment
       - 'would pay' / 'take my money' / 'how much' → BUYING_SIGNAL
       - 'already use X' / 'switched to' → COMPETITOR_MENTION
       - 'doesn't work' / 'tried and failed' → PAIN_POINT
       - 'can you add' / 'would be nice if' → FEATURE_REQUEST
       - 'DM me' / 'link?' / 'where can I try' → INTEREST_SIGNAL
     - generateReport(comments[]): Summary stats
       - { totalComments, positive%, negative%, neutral%,
           buyingSignals, featureRequests, competitorMentions,
           topPositive: Comment[], topNegative: Comment[],
           interestedUsers: string[] }

   - Algorithm (NO external API, runs locally):
     1) Tokenize: split on whitespace, lowercase, remove punctuation
     2) Lexicon match: score each token against sentiment-lexicon.json
     3) Negation handling: 'not good' → flip score
     4) Intensifier handling: 'very good' → boost score
     5) Context patterns: regex for buying signals, feature requests, etc.
     6) Aggregate: average token scores, weighted by signal matches

   CREATE config/sentiment-lexicon.json:
   - Positive words (200+): useful, great, amazing, need, want, pay, buy, love, perfect, exactly
   - Negative words (200+): useless, waste, don't need, already exists, overkill, complicated
   - Tech-specific: 'langchain sucks' → positive for Ultra-Dex, 'another wrapper' → negative
   - Intensifiers: very, extremely, absolutely, definitely
   - Negators: not, never, don't, won't, can't

   Output: Update marketing/validation/response-tracker.md with sentiment column.
   Also write .ultra-dex/automation/sentiment-reports/{date}.json."
```
Expected Output: Local sentiment analyzer with 70%+ accuracy on developer Reddit comments
Validation:
```bash
npx tsx -e "
  import { SentimentAnalyzer } from './src/automation/sentiment-analyzer';
  const sa = new SentimentAnalyzer();
  console.log(sa.analyze('This is exactly what I need, take my money'));
  console.log(sa.analyze('Another unnecessary wrapper nobody asked for'));
  console.log(sa.analyze('Interesting but I already use LangChain'));
"
# Expected: positive (buying signal), negative, neutral (competitor mention)
```
Fallback #1: `gemini -y -p "Build keyword-based sentiment analyzer for Reddit comments..."`
Fallback #2: `codex --full-auto -m gpt-4o exec "Create sentiment analysis pipeline..."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Build local sentiment analyzer..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 72] GEMINI — gemini-2.5-pro
Task ID: V20-W72-METRICS-DASHBOARD
Objective: Build AUTO-CEO metrics page in existing dashboard — scrape stats, sentiment trends, funnel
Target Files: apps/dashboard/app/auto-ceo/page.tsx (NEW), apps/dashboard/lib/auto-ceo-api.ts (NEW)
Why this lane: Dashboard page generation — Gemini for React component creation at free tier.
Power Tier: BALANCED
Command:
```bash
gemini -y -p \
  "Build AUTO-CEO dashboard page for Ultra-Dex.

   CREATE apps/dashboard/app/auto-ceo/page.tsx:
   - Header: 'AUTO-CEO Control Center'
   - KPI Cards Row:
     - Total Reddit Responses (number)
     - Positive Sentiment % (gauge)
     - Interested Users (number with list)
     - Buying Signals (number, highlighted green)
     - Decision Confidence (0-100% gauge)
   - Charts:
     - Sentiment trend over time (line chart, recharts)
     - Responses by subreddit (bar chart)
     - Signal distribution (pie: buying, interest, feature req, pain point)
   - Tables:
     - Recent responses (author, comment preview, sentiment, signals)
     - Interested users (username, signal type, status: contacted/not)
     - Feature requests (feature, count, example comment)
   - Controls:
     - 'Approve Post' button (shows draft, one-click send)
     - 'Approve DM' button (shows draft DM, one-click send)
     - Decision override: manual continue/pivot/stop buttons
     - Kill switch: stop all automation
   - Scheduler Status:
     - Each job: name, last run, next run, status (green/red), error count

   CREATE apps/dashboard/lib/auto-ceo-api.ts:
   - readState(): Read from .ultra-dex/automation/state.json
   - readSentimentReport(): Latest sentiment report
   - readScraperResults(): Latest scrape results
   - approvePost(postId): Trigger post via API
   - approveDM(userId, message): Trigger DM via API
   - overrideDecision(decision): Human override

   Use: recharts, shadcn/ui, Tailwind. Read data from JSON files (no DB needed)."
```
Expected Output: AUTO-CEO dashboard page with live metrics and human approval controls
Validation:
```bash
cd apps/dashboard && npm run build
# Verify: auto-ceo page builds, no errors
```
Fallback #1: `gemini -y --model gemini-2.5-flash -p "Build AUTO-CEO dashboard page..."`
Fallback #2: `claude --model claude-sonnet-4-20250514 --effort high -p "Build AUTO-CEO dashboard..."`
Fallback #3: `opencode run -m opencode/deepseek-v3.2 -p "Create React dashboard page for automation metrics..."`
Cost Class: FREE

---

## ═══════════════════════════════════════════════
## DAY 2: ANALYSIS & DECISION LAYER
## ═══════════════════════════════════════════════

### Day 2 Parallel: W73, W74, W75, W76
### Gate: Decision engine produces recommendation, content drafter generates posts, outreach drafts ready

---

### [WINDOW 73] CLAUDE — claude-opus-4
Task ID: V20-W73-DECISION-ENGINE
Objective: Build the decision engine — weighs evidence, calculates confidence, recommends continue/pivot/stop
Target Files: src/automation/decision-engine.ts (NEW), config/decision-thresholds.json (NEW), marketing/validation/DECISION.md (template)
Why this lane: Decision logic is the highest-stakes component. Opus for correct threshold math and edge cases.
Power Tier: HIGH
Command:
```bash
claude --model opus --effort max -p \
  "Build the AUTO-CEO decision engine for Ultra-Dex.

   CREATE src/automation/decision-engine.ts:
   1) DecisionEngine class:
      - constructor(thresholds: Thresholds)
      - collectEvidence(): Gather all data points
        - Reddit: sentiment scores, response count, buying signals
        - Interviews: count, quotes, pain points, willingness to pay
        - Content: engagement rates, follower growth
        - Competition: mentions of alternatives
      - calculateConfidence(): 0.0 to 1.0
        Formula:
          base = (positive_sentiment_pct × 0.3) +
                 (buying_signals / total_responses × 0.3) +
                 (willing_to_pay_count / interview_count × 0.2) +
                 (interest_signals / total_responses × 0.2)
          penalty = competitor_better_mentions × 0.1
          confidence = clamp(base - penalty, 0, 1)
      - recommend(): { decision, confidence, evidence, rationale, nextSteps }
        CONTINUE: confidence >= 0.7
        PIVOT:    confidence >= 0.3 AND confidence < 0.7
        STOP:     confidence < 0.3
      - generateReport(): Write to marketing/validation/DECISION.md
        - Evidence table with scores
        - Confidence calculation breakdown
        - Recommendation with reasoning
        - Suggested next steps
        - Comparison to last decision (trend)

   2) Evidence weighting:
      - Reddit response with 10+ upvotes: 3x weight
      - Direct 'would pay' statement: 5x weight
      - Completed interview: 10x weight vs Reddit comment
      - Competitor mention 'already use X': -2x weight

   3) Edge cases:
      - < 5 total signals: INSUFFICIENT_DATA (don't recommend, wait)
      - All signals from same 2 users: LOW_DIVERSITY warning
      - Contradictory signals: flag for human review
      - Confidence exactly 0.7: round UP (bias toward action)

   CREATE config/decision-thresholds.json:
   {
     'continue_threshold': 0.7,
     'stop_threshold': 0.3,
     'min_signals_required': 5,
     'min_diversity': 3,
     'weights': {
       'sentiment': 0.3, 'buying_signal': 0.3,
       'willingness_to_pay': 0.2, 'interest_signal': 0.2
     },
     'upvote_multiplier': 3,
     'interview_multiplier': 10,
     'recalibrate_weekly': true
   }

   CREATE marketing/validation/DECISION.md (template):
   # AUTO-CEO Decision Report
   Generated: {date}
   ## Evidence Summary
   | Source | Count | Positive | Negative | Signals |
   ## Confidence Score: {score}
   ## Recommendation: {CONTINUE|PIVOT|STOP}
   ## Rationale
   ## Next Steps
   ## History (trend of past decisions)"
```
Expected Output: Decision engine with weighted scoring, edge case handling, markdown report
Validation:
```bash
npx tsx -e "
  import { DecisionEngine } from './src/automation/decision-engine';
  const de = new DecisionEngine();
  // Simulate data
  de.injectTestData({
    responses: 15, positivePct: 0.73, buyingSignals: 4,
    interviews: 5, willingToPay: 3, competitorMentions: 2
  });
  const result = de.recommend();
  console.log(result);
  // Expected: { decision: 'CONTINUE', confidence: ~0.72 }
"
```
Fallback #1: `claude --model claude-sonnet-4-20250514 --effort high -p "Build decision engine with confidence scoring..."`
Fallback #2: `codex --full-auto -m o1 exec "Implement evidence-weighted decision engine..."`
Fallback #3: `opencode run -m opencode/deepseek-r1-0528 -p "Build decision engine with weighted confidence calculation..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 74] CLAUDE — claude-sonnet-4-20250514
Task ID: V20-W74-CONTENT-DRAFTER
Objective: Build content drafting system — generates social media posts from data, queues for human approval
Target Files: src/automation/content-drafter.ts (NEW), content/queue/ (NEW dir), content/templates/ (NEW dir)
Why this lane: Creative content generation with templates. Sonnet for balanced quality.
Power Tier: BALANCED
Command:
```bash
claude --model claude-sonnet-4-20250514 --effort high -p \
  "Build content drafting system for Ultra-Dex AUTO-CEO.

   CREATE src/automation/content-drafter.ts:
   1) ContentDrafter class:
      - constructor(templates: TemplateDir)
      - draftTweet(insight): 280-char tweet from data point
      - draftLinkedInPost(topic): Professional post (200-300 words)
      - draftRedditReply(comment, context): Reply to interested user
      - draftDM(username, signal): Personalized DM draft
      - generateWeeklyBatch(): 7 tweets + 3 LinkedIn + drafts
      - Output: Save to content/queue/{platform}/{date}-{n}.md
        Each file: { platform, content, scheduledFor, status: 'draft', approvedBy: null }

   2) Content sources (read from local files, NOT external APIs):
      - marketing/validation/response-tracker.md → user quotes
      - .ultra-dex/automation/sentiment-reports/ → data points
      - git log → development progress
      - package.json → version/feature info

   3) Templates in content/templates/:
      - tweet-validation.md: 'Built [feature] for Ultra-Dex. [N] devs say [quote]. What do you think?'
      - tweet-progress.md: 'Day [X] building Ultra-Dex: [insight]. [metric].'
      - linkedin-technical.md: Deep dive on a feature (300 words)
      - linkedin-journey.md: Founder journey update (200 words)
      - reddit-reply.md: 'Thanks for the feedback! [personalized response]. Want early access?'
      - dm-outreach.md: 'Hey [name], saw your comment about [topic]. Would love 10 min of your time...'

   4) Safety:
      - All outputs go to content/queue/ as drafts
      - Nothing is posted automatically
      - Human reviews in dashboard, clicks 'Approve'
      - Approved content → scheduler picks up and posts

   NO external API calls. Uses template filling, not LLM generation.
   If LLM generation desired later, add optional flag to call Ultra-Dex's own AI layer."
```
Expected Output: Content drafter generating weekly social media queue
Validation:
```bash
npx tsx -e "
  import { ContentDrafter } from './src/automation/content-drafter';
  const cd = new ContentDrafter();
  console.log(cd.draftTweet({ feature: 'cost optimization', userQuote: 'saves me 30%' }));
  console.log(cd.draftDM({ username: 'user123', signal: 'buying_signal', comment: 'how much?' }));
"
# Verify: outputs properly formatted draft content
ls content/queue/twitter/ content/queue/linkedin/ content/queue/reddit/
```
Fallback #1: `gemini -y -p "Build content drafting system with templates..."`
Fallback #2: `codex --full-auto -m gpt-4o exec "Create content queue system for social media..."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Build content drafter with template system..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 75] GEMINI — gemini-2.5-pro
Task ID: V20-W75-OUTREACH-MANAGER
Objective: Build outreach management — identify interested users, draft personalized messages, track status
Target Files: src/automation/outreach-manager.ts (NEW), marketing/validation/outreach-tracker.md (NEW)
Why this lane: Structured data processing — Gemini for pipeline generation at free tier.
Power Tier: BALANCED
Command:
```bash
gemini -y -p \
  "Build outreach management system for Ultra-Dex AUTO-CEO.

   CREATE src/automation/outreach-manager.ts:
   1) OutreachManager class:
      - identifyLeads(sentimentReport): Filter for interested users
        Criteria: buying_signal OR interest_signal OR (positive AND asked_question)
      - prioritizeLeads(leads[]): Sort by signal strength
        Score: buying_signal=10, interest_signal=7, positive_question=5
      - generateDraft(lead): Create personalized outreach message
        Uses content-drafter's dm-outreach.md template
        Personalization: reference their specific comment
      - trackOutreach(lead, status): Update tracker
        Statuses: identified → drafted → approved → sent → replied → scheduled → interviewed
      - getStats(): Funnel metrics
        { identified, drafted, approved, sent, replied, scheduled, interviewed }

   2) Output: marketing/validation/outreach-tracker.md
      | Username | Signal | Score | Comment | Status | Draft | Sent Date |
      (Markdown table, auto-updated)

   3) Integration:
      - Reads from sentiment-analyzer output
      - Writes drafts to content/queue/dm/
      - Human approves in dashboard → system sends via Reddit API
      - After sending: track reply status

   4) Safety:
      - Max 5 outreach per day (anti-spam)
      - 48-hour cooldown between messages to same user
      - Respect 'not interested' responses
      - Auto-add declined users to do-not-contact list"
```
Expected Output: Outreach manager with lead scoring, draft generation, funnel tracking
Validation:
```bash
npx tsx -e "
  import { OutreachManager } from './src/automation/outreach-manager';
  const om = new OutreachManager();
  const leads = om.identifyLeads(mockSentimentReport);
  console.log('Leads found:', leads.length);
  console.log('Top lead:', leads[0]);
"
```
Fallback #1: `gemini -y --model gemini-2.5-flash -p "Build outreach management system..."`
Fallback #2: `claude --model claude-sonnet-4-20250514 --effort high -p "Build lead management pipeline..."`
Fallback #3: `opencode run -m opencode/llama-3.1-70b-instruct -p "Create outreach tracking system..."`
Cost Class: FREE

---

### [WINDOW 76] QWEN — qwen-max
Task ID: V20-W76-INTERVIEW-ANALYZER
Objective: Build interview analysis system — structured extraction from text transcripts, pattern detection
Target Files: src/automation/interview-analyzer.ts (NEW), config/interview-extraction-rules.json (NEW)
Why this lane: Structured text extraction — Qwen for template-based analysis at free tier.
Power Tier: LOW
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "Build interview transcript analyzer for Ultra-Dex AUTO-CEO.

   CREATE src/automation/interview-analyzer.ts:
   1) InterviewAnalyzer class:
      - parseTranscript(text): Extract Q&A pairs from text transcript
      - extractInsights(qa[]): Pull structured data
        - painPoints: string[] (what frustrates them)
        - currentTools: string[] (what they use now)
        - willingToPay: { amount: number, frequency: string, confidence: string }
        - featureRequests: string[] (what they want)
        - objections: string[] (why they wouldn't use it)
        - quotableLines: string[] (marketing gold)
      - compareInterviews(insights[]): Cross-interview patterns
        - commonPainPoints: ranked by frequency
        - commonFeatureRequests: ranked by frequency
        - priceRange: { min, max, median }
        - consensus: areas where 3+ users agree
      - generateSynthesis(): Write to marketing/validation/interview-synthesis.md
        - Executive summary
        - Pattern table
        - Key quotes
        - Recommended features to build
        - Recommended pricing

   2) Input: marketing/validation/transcripts/{name}.md (manual paste or auto from chat)
   3) Output: marketing/validation/interview-synthesis.md

   CREATE config/interview-extraction-rules.json:
   - Pain point triggers: 'frustrated', 'annoying', 'waste time', 'hate'
   - Price triggers: '$', 'per month', 'would pay', 'budget'
   - Feature triggers: 'wish it could', 'would be nice', 'can you add'
   - Objection triggers: 'already use', 'too expensive', 'don't need'"
```
Expected Output: Interview analyzer extracting structured insights from text transcripts
Validation:
```bash
npx tsx -e "
  import { InterviewAnalyzer } from './src/automation/interview-analyzer';
  const ia = new InterviewAnalyzer();
  const insights = ia.parseTranscript('Q: What tools do you use? A: I use LangChain but it frustrates me. Q: Would you pay for this? A: Maybe \$30/month if it saves time.');
  console.log(insights);
"
# Expected: { currentTools: ['LangChain'], painPoints: ['frustration with LangChain'], willingToPay: { amount: 30 } }
```
Fallback #1: `qwen --auth-type qwen-oauth --approval-mode yolo "Rebuild interview analyzer..."`
Fallback #2: `gemini -y --model gemini-2.5-flash -p "Build interview transcript analyzer..."`
Fallback #3: `opencode run -m opencode/llama-3.3-70b-instruct -p "Create interview analysis pipeline..."`
Cost Class: FREE

---

## ═══════════════════════════════════════════════
## DAY 3: INTEGRATION, SELF-IMPROVEMENT & GATE
## ═══════════════════════════════════════════════

### Day 3 Parallel: W77, W78, W79, W80
### Gate: Full system runs end-to-end, self-improvement loop works, all tests pass

---

### [WINDOW 77] CLAUDE — claude-opus-4
Task ID: V20-W77-REDDIT-POSTER
Objective: Build semi-automated Reddit poster — drafts from templates, human approves in dashboard, system posts
Target Files: src/automation/reddit-poster.ts (NEW)
Why this lane: Posting involves API write operations and ToS compliance. Opus for safety-critical code.
Power Tier: HIGH
Command:
```bash
claude --model opus --effort max -p \
  "Build semi-automated Reddit poster for Ultra-Dex AUTO-CEO.

   CREATE src/automation/reddit-poster.ts:
   1) RedditPoster class (extends RedditAuth):
      - draftPost(subreddit, template, data): Generate post content from template
        Templates from marketing/validation/reddit-posts.md
        Personalize with latest metrics (version, test count, features)
      - submitPost(subreddit, title, body): Post via snoowrap
        ONLY callable after human approval (checks approval flag in state)
      - replyToComment(commentId, body): Reply to a comment
        ONLY callable after human approval
      - sendDM(username, subject, body): Send private message
        ONLY callable after human approval
        Max 5 per day, 48hr cooldown per user

   2) Approval flow:
      - draft() → saves to content/queue/reddit/{id}.json
        { id, type: 'post'|'reply'|'dm', content, target, status: 'pending_approval' }
      - Dashboard shows pending items
      - Human clicks 'Approve' → status: 'approved'
      - Scheduler picks up approved items → posts them
      - After posting: status: 'posted', permalink saved

   3) Safety (NON-NEGOTIABLE):
      - CANNOT post without approval flag = true
      - Rate limit: 1 post per subreddit per 24 hours
      - DM limit: 5 per day total
      - Kill switch: set config.automation.posting = false → stops all
      - All posts logged to .ultra-dex/automation/post-log.jsonl
      - Account age check: warn if account < 30 days old
      - Karma check: warn if karma < 100

   4) A/B testing:
      - Generate 2 title variants per post
      - Human picks or system rotates
      - Track which titles get more engagement"
```
Expected Output: Semi-automated poster with mandatory human approval gate
Validation:
```bash
npx tsx -e "
  import { RedditPoster } from './src/automation/reddit-poster';
  const rp = new RedditPoster();
  const draft = rp.draftPost('LocalLLaMA', 'validation', { version: '6.0.0', features: 5 });
  console.log('Draft:', draft);
  // Verify: cannot post without approval
  try { rp.submitPost('test', 'title', 'body'); } catch(e) { console.log('Blocked:', e.message); }
"
```
Fallback #1: `claude --model claude-sonnet-4-20250514 --effort high -p "Build Reddit poster with approval gate..."`
Fallback #2: `codex --full-auto -m o1 exec "Create semi-automated Reddit poster..."`
Fallback #3: `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "Build Reddit posting system with human approval..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 78] CODEX — o1
Task ID: V20-W78-SELF-IMPROVEMENT
Objective: Build self-improvement loop — tracks prediction accuracy, adjusts thresholds, logs learnings
Target Files: src/automation/self-improvement.ts (NEW), .ultra-dex/automation/improvement-log.md (template)
Why this lane: Feedback loop design requires careful reasoning about convergence. Codex o1 for algorithmic correctness.
Power Tier: HIGH
Command:
```bash
codex --full-auto -m o1 exec \
  "Build self-improvement loop for Ultra-Dex AUTO-CEO.

   CREATE src/automation/self-improvement.ts:
   1) SelfImprovement class:
      - trackPrediction(predicted, actual): Log prediction accuracy
        - Tracks: sentiment accuracy, decision accuracy, content performance
      - calculateAccuracy(window: 7|30|90): Rolling accuracy scores
      - adjustThresholds(): Auto-tune decision-thresholds.json
        - If CONTINUE decisions lead to good outcomes: lower threshold slightly
        - If CONTINUE decisions lead to bad outcomes: raise threshold
        - Adjustment: ±0.05 per week, max drift ±0.2 from initial
        - Log every adjustment with reasoning
      - identifyPatterns(): What's working vs not
        - Best posting times (by engagement)
        - Best subreddits (by quality of responses)
        - Best content types (by conversion)
        - Best outreach messages (by reply rate)
      - generateWeeklyReport(): Improvement log
        - What changed this week
        - Accuracy trend (improving/declining)
        - Threshold adjustments made
        - Recommendations for next week
      - archiveFailures(): Document what didn't work
        - Why it failed
        - What to avoid
        - Store in .ultra-dex/automation/failures/

   2) Constraints:
      - Threshold drift cap: ±0.2 from initial values
      - Minimum 10 data points before any adjustment
      - Weekly adjustment cadence (not real-time)
      - All changes logged and reversible
      - Human override: can reset thresholds to defaults

   3) Output:
      - .ultra-dex/automation/improvement-log.md (append-only)
      - config/decision-thresholds.json (modified in place, git-diffable)"
```
Expected Output: Self-improvement loop with bounded threshold adjustment
Validation:
```bash
npx tsx -e "
  import { SelfImprovement } from './src/automation/self-improvement';
  const si = new SelfImprovement();
  // Simulate: 10 predictions, 8 correct
  for (let i = 0; i < 8; i++) si.trackPrediction('CONTINUE', 'CONTINUE');
  for (let i = 0; i < 2; i++) si.trackPrediction('CONTINUE', 'PIVOT');
  console.log('Accuracy:', si.calculateAccuracy(7));
  // Expected: 0.8
"
```
Fallback #1: `codex --full-auto -m gpt-4o exec "Build self-improvement feedback loop..."`
Fallback #2: `claude --model claude-sonnet-4-20250514 --effort high -p "Build self-tuning threshold system..."`
Fallback #3: `opencode run -m opencode/deepseek-r1-0528 -p "Create self-improvement loop with bounded threshold adjustment..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 79] GEMINI — gemini-2.5-pro
Task ID: V20-W79-INTEGRATION-TESTS
Objective: Write end-to-end tests for entire AUTO-CEO pipeline
Target Files: tests/automation/scheduler.test.ts (NEW), tests/automation/pipeline.test.ts (NEW), tests/automation/decision.test.ts (NEW)
Why this lane: Test generation — Gemini for comprehensive coverage at free tier.
Power Tier: BALANCED
Command:
```bash
gemini -y -p \
  "Write tests for Ultra-Dex AUTO-CEO automation system.

   CREATE tests/automation/scheduler.test.ts:
   - Test job scheduling with correct cron expressions
   - Test retry logic (3 retries with backoff)
   - Test dead letter queue after 3 failures
   - Test state persistence across restarts
   - Test graceful shutdown

   CREATE tests/automation/pipeline.test.ts:
   - SCENARIO: Full pipeline
     1) Inject mock Reddit comments into scraper
     2) Run sentiment analyzer on scraped data
     3) Run outreach manager to identify leads
     4) Run decision engine with accumulated data
     5) Verify: decision matches expected output
     6) Verify: content drafts generated
     7) Verify: metrics updated

   - SCENARIO: Edge cases
     1) Zero responses → INSUFFICIENT_DATA
     2) All negative → STOP recommendation
     3) All from same user → LOW_DIVERSITY warning
     4) Contradictory signals → human review flag

   CREATE tests/automation/decision.test.ts:
   - Test confidence calculation with known inputs
   - Test CONTINUE threshold (>= 0.7)
   - Test PIVOT threshold (0.3-0.7)
   - Test STOP threshold (< 0.3)
   - Test edge cases (exactly 0.7 = CONTINUE)
   - Test weight adjustments
   - Test self-improvement threshold drift cap

   Use Node's built-in test runner. Mock Reddit API calls.
   Mock file system for state persistence."
```
Expected Output: Comprehensive test suite for AUTO-CEO system
Validation:
```bash
npm test -- tests/automation/
# Verify: all tests pass, >80% coverage on decision-engine.ts
```
Fallback #1: `gemini -y --model gemini-2.5-flash -p "Write AUTO-CEO tests..."`
Fallback #2: `claude --model claude-sonnet-4-20250514 --effort high -p "Write automation pipeline tests..."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Write tests for AUTO-CEO system..."`
Cost Class: FREE

---

### [WINDOW 80] CODEX — o3
Task ID: V20-W80-FINAL-GATE
Objective: Final integration — wire all components together, verify full pipeline, update package.json scripts
Target Files: src/automation/index.ts (NEW), package.json (MODIFY)
Why this lane: Final integration requires highest reasoning for wiring correctness. Codex o3.
Power Tier: HIGH
Command:
```bash
codex --full-auto -m o3 exec \
  "Final integration of Ultra-Dex AUTO-CEO system.

   CREATE src/automation/index.ts:
   - Export all automation modules
   - AutoCEO class (facade):
     - start(): Initialize scheduler, load config, begin jobs
     - stop(): Graceful shutdown
     - status(): Health of all components
     - runOnce(): Execute full pipeline once (for testing)
     - CLI entry: npx tsx src/automation/index.ts [start|stop|status|run-once]

   MODIFY package.json — add scripts:
   - 'auto-ceo': 'npx tsx src/automation/index.ts start'
   - 'auto-ceo:status': 'npx tsx src/automation/index.ts status'
   - 'auto-ceo:once': 'npx tsx src/automation/index.ts run-once'
   - 'auto-ceo:decision': 'npx tsx src/automation/decision-engine.ts'
   - 'test:automation': 'node --test tests/automation/'

   VERIFY full pipeline:
   1) npm run auto-ceo:once (dry run with mock data)
   2) npm run auto-ceo:status → all jobs healthy
   3) npm run auto-ceo:decision → produces DECISION.md
   4) npm run test:automation → all tests pass
   5) Check content/queue/ → drafts generated
   6) Check marketing/validation/response-tracker.md → updated
   7) Check marketing/validation/DECISION.md → generated

   CREATE .env.example:
   REDDIT_CLIENT_ID=your_client_id
   REDDIT_CLIENT_SECRET=your_client_secret
   REDDIT_USERNAME=your_username
   REDDIT_PASSWORD=your_password
   ULTRA_DEX_AUTOMATION=true
   AUTOMATION_APPROVAL_REQUIRED=true"
```
Expected Output: Fully integrated AUTO-CEO system runnable via npm scripts
Validation:
```bash
npm run auto-ceo:once -- --dry-run
npm run auto-ceo:status
npm run test:automation
# Verify: pipeline completes, state updated, no errors
```
Fallback #1: `codex --full-auto -m o1 exec "Integrate AUTO-CEO components..."`
Fallback #2: `claude --model opus --effort max -p "Wire AUTO-CEO system together..."`
Fallback #3: `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "Integrate automation system modules..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

## WINDOW SUMMARY

| Window | Agent | Task | Day | Cost |
|--------|-------|------|-----|------|
| W69 | Claude Opus | Scheduler core | 1 | SUBSCRIPTION |
| W70 | Codex o1 | Reddit scraper | 1 | SUBSCRIPTION |
| W71 | Claude Sonnet | Sentiment analyzer | 1 | SUBSCRIPTION |
| W72 | Gemini Pro | Metrics dashboard | 1 | FREE |
| W73 | Claude Opus | Decision engine | 2 | SUBSCRIPTION |
| W74 | Claude Sonnet | Content drafter | 2 | SUBSCRIPTION |
| W75 | Gemini Pro | Outreach manager | 2 | FREE |
| W76 | Qwen Max | Interview analyzer | 2 | FREE |
| W77 | Claude Opus | Reddit poster (semi-auto) | 3 | SUBSCRIPTION |
| W78 | Codex o1 | Self-improvement loop | 3 | SUBSCRIPTION |
| W79 | Gemini Pro | Integration tests | 3 | FREE |
| W80 | Codex o3 | Final gate | 3 | SUBSCRIPTION |

**Total: 12 windows, 3 days | 8 SUBSCRIPTION, 4 FREE**

---

## DEPENDENCY GRAPH

```
DAY 1 (Data Collection — all parallel):
  W69 Scheduler ──┐
  W70 Scraper ────┤── No deps, build independently
  W71 Sentiment ──┤
  W72 Dashboard ──┘

DAY 2 (Analysis — depends on Day 1 interfaces, not implementations):
  W73 Decision Engine ──┐── Reads from W70/W71 output format
  W74 Content Drafter ──┤── Uses W71 sentiment data
  W75 Outreach Manager ─┤── Uses W71 lead identification
  W76 Interview Analyzer┘── Independent (text processing)

DAY 3 (Integration — depends on Day 1+2):
  W77 Reddit Poster ────┐── Uses W69 scheduler + W70 auth
  W78 Self-Improvement ──┤── Reads from W73 decision history
  W79 Tests ─────────────┤── Tests all Day 1+2 components
  W80 Final Gate ────────┘── Wires everything + validates
```

---

## HUMAN-IN-THE-LOOP GATES

| Action | Automated? | Human Approval? |
|--------|-----------|-----------------|
| Scrape Reddit responses | ✅ Fully auto | ❌ Not needed |
| Analyze sentiment | ✅ Fully auto | ❌ Not needed |
| Identify leads | ✅ Fully auto | ❌ Not needed |
| Calculate decision score | ✅ Fully auto | ❌ Not needed |
| Generate content drafts | ✅ Fully auto | ❌ Not needed |
| **Post to Reddit** | 🔸 Semi-auto | ✅ **One-click approve** |
| **Send DMs** | 🔸 Semi-auto | ✅ **One-click approve** |
| **Reply to comments** | 🔸 Semi-auto | ✅ **One-click approve** |
| **Execute decision (pivot/stop)** | 🔸 Semi-auto | ✅ **Human confirms** |
| Update metrics dashboard | ✅ Fully auto | ❌ Not needed |
| Adjust thresholds | ✅ Fully auto | ❌ (bounded ±0.2) |
| Generate weekly report | ✅ Fully auto | ❌ Not needed |

**Human time estimate: <30 min/week** (review drafts, click approve, read decision report)

---

## RISK MATRIX

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Reddit account banned for automation | Medium | High | Semi-auto with approval, respect rate limits, aged account |
| Sentiment analyzer misclassifies | Medium | Medium | Conservative thresholds, human review for edge cases |
| Decision engine wrong recommendation | Low | High | Bounded thresholds, human confirms irreversible decisions |
| Self-improvement loop diverges | Low | Medium | Drift cap ±0.2, weekly review, reset-to-defaults option |
| Reddit API rate limit hit | Medium | Low | Queue + backoff, 60 req/min hard cap |
| snoowrap library deprecated | Low | Low | Adapter pattern — swap to raw HTTP if needed |
| Zero responses after posting | Medium | Medium | Decision engine handles INSUFFICIENT_DATA, waits |
| All signals from bots/spam | Low | Medium | Account age filter, karma filter, manual spot-check |

---

## FILE TREE (What Gets Created)

```
src/automation/
├── index.ts              (W80) — Facade + CLI entry
├── scheduler.ts          (W69) — Cron job runner
├── job-runner.ts         (W69) — Individual job executor
├── state-store.ts        (W69) — State persistence
├── reddit-auth.ts        (W70) — Reddit OAuth
├── reddit-scraper.ts     (W70) — Comment scraper (read-only)
├── reddit-poster.ts      (W77) — Post/reply/DM (semi-auto)
├── sentiment-analyzer.ts (W71) — Local sentiment scoring
├── decision-engine.ts    (W73) — Continue/pivot/stop
├── content-drafter.ts    (W74) — Template-based content generation
├── outreach-manager.ts   (W75) — Lead identification + tracking
├── interview-analyzer.ts (W76) — Transcript extraction
└── self-improvement.ts   (W78) — Threshold auto-tuning

config/
├── automation-schedule.json   (W69)
├── reddit-config.json         (W70)
├── sentiment-lexicon.json     (W71)
├── decision-thresholds.json   (W73)
├── interview-extraction-rules.json (W76)

content/
├── queue/
│   ├── twitter/               (W74) — Draft tweets
│   ├── linkedin/              (W74) — Draft posts
│   ├── reddit/                (W77) — Draft posts/replies/DMs
│   └── dm/                    (W75) — Draft DMs
├── templates/                 (W74) — Content templates

apps/dashboard/app/auto-ceo/
├── page.tsx                   (W72) — Dashboard page

tests/automation/
├── scheduler.test.ts          (W79)
├── pipeline.test.ts           (W79)
├── decision.test.ts           (W79)

marketing/validation/
├── DECISION.md                (W73) — Auto-generated decision report
├── outreach-tracker.md        (W75) — Lead funnel tracker
├── interview-synthesis.md     (W76) — Cross-interview patterns
```

**Total new files: ~25 | Total estimated LOC: ~2,500**

---

## EXECUTION RECOVERY PROMPT

```
Read .protocol/state/v20-AUTO-CEO-dispatches.md
Check: which day am I on?
Verify: npm run auto-ceo:status
If scraper not built → start at W69-W72 (Day 1)
If analysis not built → start at W73-W76 (Day 2)
If integration not done → start at W77-W80 (Day 3)
If all built → npm run auto-ceo:once --dry-run → verify pipeline
```

---

*AUTO-CEO dispatches generated 2026-04-12 | 12 windows | 3 days | 8 SUBSCRIPTION, 4 FREE*
*Architecture: Semi-automated with human-in-the-loop for external actions*
*Ethics: Reddit ToS compliant, no AI voice deception, bounded self-improvement*
