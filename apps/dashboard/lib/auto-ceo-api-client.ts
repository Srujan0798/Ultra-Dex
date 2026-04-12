// Client-safe AUTO-CEO API wrapper
// Uses fetch to call server API routes

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

export interface DashboardData {
  state: AutomationState;
  sentiment: SentimentReport;
  scraper: ScraperResult;
  scheduler: SchedulerJob[];
  draftPost: DraftPost | null;
  draftDM: DraftDM | null;
}

const API_BASE = '/api/auto-ceo';

export async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  return response.json();
}

export async function approvePost(postId: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'approvePost', payload: { postId } }),
  });
  return response.json();
}

export async function approveDM(
  userId: string,
  message: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'approveDM', payload: { userId, message } }),
  });
  return response.json();
}

export async function overrideDecision(
  decision: 'continue' | 'pivot' | 'stop'
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'overrideDecision', payload: { decision } }),
  });
  return response.json();
}

export async function toggleKillSwitch(
  enabled: boolean
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'toggleKillSwitch', payload: { enabled } }),
  });
  return response.json();
}

// Re-export types for convenience
export type { DashboardData as AutoCEOData };
