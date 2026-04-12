/**
 * AUTO-CEO Automation Module
 * Cron-based job runner with health monitoring and state persistence
 */

export {
  AutoCEOScheduler,
  type SchedulerStatus,
  type JobState,
  type DeadLetterJob,
} from './scheduler.js';
export {
  JobRunner,
  type JobResult,
  type JobMetrics,
  type JobHandler,
  type JobContext,
} from './job-runner.js';
export { AutoCEOState, type StateValue, type StoredState } from './state-store.js';
export {
  DecisionEngine,
  type DecisionResult,
  type DecisionData,
  type Evidence,
  type EvidenceSummary,
  type ConfidenceBreakdown,
  type Thresholds,
  type DecisionHistory,
} from './decision-engine.js';
export {
  RedditPoster,
  type DraftContent,
  type PostTemplate,
  type PostConfig,
  type PostLog,
  type PostLimits,
} from './reddit-poster.js';
export { RedditAuth, type RedditCredentials, type RateLimitSnapshot } from './reddit-auth.js';
export { RedditScraper, type ScrapedComment, type ScrapedPostResult } from './reddit-scraper.js';
export {
  SentimentAnalyzer,
  type SentimentReport,
  type Comment,
  type SentimentResult,
} from './sentiment-analyzer.js';
export {
  OutreachManager,
  type Lead,
  type OutreachStatus,
  type OutreachStats,
} from './outreach-manager.js';
export {
  SelfImprovement,
  type PredictionCategory,
  type PredictionMetadata,
  type PredictionRecord,
  type ThresholdAdjustment,
} from './self-improvement.js';
export {
  ContentDrafter,
  type ContentDraft,
  type ContentTemplate,
  type DraftConfig,
} from './content-drafter.js';
export {
  InterviewAnalyzer,
  type TranscriptQAPair,
  type InterviewInsights,
  type InterviewSynthesis,
  type AnalysisConfig,
} from './interview-analyzer.js';
