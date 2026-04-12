// AUTO-CEO API Client — reads from local JSON state files

export interface AutomationState {
  running: boolean;
  lastRun: string | null;
  nextRun: string | null;
  totalResponses: number;
  positiveSentiment: number;
  interestedUsers: InterestedUser[];
  buyingSignals: number;
  decisionConfidence: number;
  decision: 'continue' | 'pivot' | 'stop';
  killSwitch: boolean;
}

export interface InterestedUser {
  username: string;
  signalType: 'buying' | 'interest' | 'feature-request' | 'pain-point';
  status: 'contacted' | 'not-contacted';
  comment?: string;
}

export interface SentimentDataPoint {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
}

export interface SentimentReport {
  data: SentimentDataPoint[];
  overallPositive: number;
  generatedAt: string;
}

export interface ScraperResult {
  responsesBySubreddit: { subreddit: string; count: number }[];
  signalDistribution: {
    buying: number;
    interest: number;
    featureRequest: number;
    painPoint: number;
  };
  recentResponses: RecentResponse[];
  featureRequests: FeatureRequest[];
}

export interface RecentResponse {
  id: string;
  author: string;
  commentPreview: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  signals: string[];
  subreddit: string;
  timestamp: string;
}

export interface FeatureRequest {
  feature: string;
  count: number;
  exampleComment: string;
}

export interface SchedulerJob {
  name: string;
  lastRun: string | null;
  nextRun: string | null;
  status: 'success' | 'error' | 'pending';
  errorCount: number;
}

export interface DraftPost {
  id: string;
  title: string;
  content: string;
  subreddit: string;
  scheduledAt: string;
}

export interface DraftDM {
  userId: string;
  username: string;
  message: string;
  scheduledAt: string;
}

// --- Mock data generators (replace with real file reads) ---

function generateMockState(): AutomationState {
  return {
    running: true,
    lastRun: new Date(Date.now() - 3600000).toISOString(),
    nextRun: new Date(Date.now() + 3600000).toISOString(),
    totalResponses: 247,
    positiveSentiment: 68,
    interestedUsers: [
      { username: 'dev_sarah', signalType: 'buying', status: 'contacted', comment: 'This looks exactly like what I need for my team.' },
      { username: 'startup_mike', signalType: 'buying', status: 'not-contacted', comment: 'How much does this cost? I want to try it.' },
      { username: 'code_ninja', signalType: 'interest', status: 'contacted', comment: 'Interesting approach to AI routing.' },
      { username: 'tech_lead_amy', signalType: 'feature-request', status: 'not-contacted', comment: 'Would love Slack integration.' },
      { username: 'founder_joe', signalType: 'buying', status: 'not-contacted', comment: 'Can I get enterprise pricing?' },
      { username: 'pm_lisa', signalType: 'pain-point', status: 'contacted', comment: 'We waste so much money on unused API calls.' },
      { username: 'dev_alex', signalType: 'interest', status: 'not-contacted', comment: 'How does this compare to LangChain?' },
      { username: 'cto_sam', signalType: 'buying', status: 'not-contacted', comment: 'Book a demo for our team.' },
    ],
    buyingSignals: 23,
    decisionConfidence: 87,
    decision: 'continue',
    killSwitch: false,
  };
}

function generateMockSentimentReport(): SentimentReport {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data: SentimentDataPoint[] = days.map((day) => ({
    date: day,
    positive: Math.floor(Math.random() * 30) + 50,
    neutral: Math.floor(Math.random() * 20) + 15,
    negative: Math.floor(Math.random() * 15) + 5,
  }));

  return {
    data,
    overallPositive: 68,
    generatedAt: new Date().toISOString(),
  };
}

function generateMockScraperResults(): ScraperResult {
  return {
    responsesBySubreddit: [
      { subreddit: 'r/startups', count: 45 },
      { subreddit: 'r/SaaS', count: 38 },
      { subreddit: 'r/programming', count: 32 },
      { subreddit: 'r/Entrepreneur', count: 28 },
      { subreddit: 'r/artificial', count: 24 },
      { subreddit: 'r/webdev', count: 19 },
      { subreddit: 'r/devops', count: 15 },
      { subreddit: 'r/technology', count: 12 },
    ],
    signalDistribution: {
      buying: 23,
      interest: 45,
      featureRequest: 31,
      painPoint: 18,
    },
    recentResponses: [
      { id: '1', author: 'dev_sarah', commentPreview: 'This looks exactly like what I need for my team. We spend way too much on OpenAI...', sentiment: 'positive', signals: ['buying'], subreddit: 'r/startups', timestamp: new Date(Date.now() - 300000).toISOString() },
      { id: '2', author: 'startup_mike', commentPreview: 'How much does this cost? I want to try it for my startup.', sentiment: 'positive', signals: ['buying'], subreddit: 'r/SaaS', timestamp: new Date(Date.now() - 600000).toISOString() },
      { id: '3', author: 'code_ninja', commentPreview: 'Interesting approach to AI routing. Have you considered...', sentiment: 'neutral', signals: ['interest'], subreddit: 'r/programming', timestamp: new Date(Date.now() - 900000).toISOString() },
      { id: '4', author: 'tech_lead_amy', commentPreview: 'Would love Slack integration. Our team lives in Slack.', sentiment: 'positive', signals: ['feature-request'], subreddit: 'r/startups', timestamp: new Date(Date.now() - 1200000).toISOString() },
      { id: '5', author: 'frustrated_dev', commentPreview: 'I keep hitting rate limits and wasting money. This is so annoying...', sentiment: 'negative', signals: ['pain-point'], subreddit: 'r/webdev', timestamp: new Date(Date.now() - 1500000).toISOString() },
      { id: '6', author: 'founder_joe', commentPreview: 'Can I get enterprise pricing? We have 50+ developers.', sentiment: 'positive', signals: ['buying'], subreddit: 'r/Entrepreneur', timestamp: new Date(Date.now() - 1800000).toISOString() },
      { id: '7', author: 'pm_lisa', commentPreview: 'We waste so much money on unused API calls every month.', sentiment: 'neutral', signals: ['pain-point'], subreddit: 'r/SaaS', timestamp: new Date(Date.now() - 2100000).toISOString() },
      { id: '8', author: 'dev_alex', commentPreview: 'How does this compare to LangChain or LiteLLM?', sentiment: 'neutral', signals: ['interest'], subreddit: 'r/artificial', timestamp: new Date(Date.now() - 2400000).toISOString() },
    ],
    featureRequests: [
      { feature: 'Slack Integration', count: 12, exampleComment: 'Would love Slack integration. Our team lives in Slack.' },
      { feature: 'Custom Routing Rules', count: 8, exampleComment: 'I want to set my own rules for which model handles what.' },
      { feature: 'Team Dashboard', count: 7, exampleComment: 'Can we get a shared dashboard for the whole team?' },
      { feature: 'API Rate Limit Alerts', count: 6, exampleComment: 'Alert me before I hit my rate limits please.' },
      { feature: 'Open Source Models', count: 5, exampleComment: 'Do you support self-hosted models like Llama?' },
    ],
  };
}

function generateMockSchedulerJobs(): SchedulerJob[] {
  return [
    { name: 'Reddit Scraper', lastRun: new Date(Date.now() - 1800000).toISOString(), nextRun: new Date(Date.now() + 1800000).toISOString(), status: 'success', errorCount: 0 },
    { name: 'Sentiment Analysis', lastRun: new Date(Date.now() - 1200000).toISOString(), nextRun: new Date(Date.now() + 2400000).toISOString(), status: 'success', errorCount: 0 },
    { name: 'Signal Detection', lastRun: new Date(Date.now() - 600000).toISOString(), nextRun: new Date(Date.now() + 3000000).toISOString(), status: 'success', errorCount: 1 },
    { name: 'Auto Post Scheduler', lastRun: new Date(Date.now() - 3600000).toISOString(), nextRun: new Date(Date.now() + 7200000).toISOString(), status: 'error', errorCount: 2 },
    { name: 'DM Outreach', lastRun: new Date(Date.now() - 2400000).toISOString(), nextRun: new Date(Date.now() + 4800000).toISOString(), status: 'success', errorCount: 0 },
    { name: 'Decision Engine', lastRun: new Date(Date.now() - 900000).toISOString(), nextRun: new Date(Date.now() + 5400000).toISOString(), status: 'success', errorCount: 0 },
  ];
}

function generateMockDraftPost(): DraftPost {
  return {
    id: 'draft-1',
    title: 'How we cut our AI API costs by 68% with smart routing',
    content: 'After months of burning through API credits, we built an intelligent routing system that automatically picks the best/cheapest model for each task. Here\'s how it works...\n\n[Full post content with code examples and benchmarks]',
    subreddit: 'r/startups',
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
  };
}

function generateMockDraftDM(): DraftDM {
  return {
    userId: 'user-123',
    username: 'startup_mike',
    message: 'Hey! Saw your comment about wanting to try Ultra-Dex. We\'d love to give you early access. Here\'s a link to get started: [link]. Let me know if you have any questions!',
    scheduledAt: new Date(Date.now() + 3600000).toISOString(),
  };
}

// --- API Functions ---

export async function readState(): Promise<AutomationState> {
  // TODO: Read from .ultra-dex/automation/state.json
  // For now, return mock data
  return generateMockState();
}

export async function readSentimentReport(): Promise<SentimentReport> {
  // TODO: Read from .ultra-dex/automation/sentiment.json
  return generateMockSentimentReport();
}

export async function readScraperResults(): Promise<ScraperResult> {
  // TODO: Read from .ultra-dex/automation/scraper-results.json
  return generateMockScraperResults();
}

export async function readSchedulerJobs(): Promise<SchedulerJob[]> {
  // TODO: Read from .ultra-dex/automation/scheduler.json
  return generateMockSchedulerJobs();
}

export async function readDraftPost(): Promise<DraftPost> {
  return generateMockDraftPost();
}

export async function readDraftDM(): Promise<DraftDM> {
  return generateMockDraftDM();
}

export async function approvePost(postId: string): Promise<{ success: boolean; message: string }> {
  // TODO: POST /api/auto-ceo/approve-post
  console.log(`[AUTO-CEO] Approving post: ${postId}`);
  return { success: true, message: `Post ${postId} approved and scheduled for publishing.` };
}

export async function approveDM(userId: string, message: string): Promise<{ success: boolean; message: string }> {
  // TODO: POST /api/auto-ceo/approve-dm
  console.log(`[AUTO-CEO] Approving DM to ${userId}`);
  return { success: true, message: `DM approved and scheduled for ${userId}.` };
}

export async function overrideDecision(decision: 'continue' | 'pivot' | 'stop'): Promise<{ success: boolean; message: string }> {
  // TODO: POST /api/auto-ceo/override-decision
  console.log(`[AUTO-CEO] Decision overridden to: ${decision}`);
  return { success: true, message: `Decision overridden to "${decision}".` };
}

export async function toggleKillSwitch(enabled: boolean): Promise<{ success: boolean; message: string }> {
  // TODO: POST /api/auto-ceo/kill-switch
  console.log(`[AUTO-CEO] Kill switch ${enabled ? 'activated' : 'deactivated'}`);
  return { success: true, message: `Kill switch ${enabled ? 'activated — all automation stopped' : 'deactivated — automation resumed'}.` };
}
