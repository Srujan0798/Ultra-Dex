/**
 * AUTO-CEO Scheduler
 * Cron-based job runner with health monitoring and state persistence
 */

import cron from 'node-cron';
import { AutoCEOState } from './state-store.js';
import { JobRunner } from './job-runner.js';
import type { ScheduledTask } from 'node-cron';
import * as fs from 'fs';
import * as path from 'path';

export interface JobConfig {
  id: string;
  cronExpression: string;
  handler: string;
  enabled: boolean;
  timeoutMs: number;
  maxRetries: number;
  requiresApproval: boolean;
}

export interface JobState {
  id: string;
  status: 'idle' | 'running' | 'failed' | 'paused';
  lastRun: string | null;
  nextRun: string | null;
  errorCount: number;
  lastError: string | null;
  consecutiveFailures: number;
}

export interface SchedulerStatus {
  isRunning: boolean;
  startedAt: string | null;
  jobs: JobState[];
  deadLetterQueue: DeadLetterJob[];
}

export interface DeadLetterJob {
  jobId: string;
  failedAt: string;
  error: string;
  retryCount: number;
}

export interface AutomationConfig {
  jobs: JobConfig[];
  featureFlags: Record<string, boolean>;
  rateLimits: Record<string, { requestsPerHour: number; burstLimit: number }>;
  approvalGates: Record<string, boolean>;
}

const DEFAULT_JOBS: JobConfig[] = [
  {
    id: 'reddit-scraper',
    cronExpression: '*/30 * * * *',
    handler: 'scrapeReddit',
    enabled: true,
    timeoutMs: 300000,
    maxRetries: 3,
    requiresApproval: false,
  },
  {
    id: 'sentiment-analyzer',
    cronExpression: '*/30 * * * *',
    handler: 'analyzeSentiment',
    enabled: true,
    timeoutMs: 300000,
    maxRetries: 3,
    requiresApproval: false,
  },
  {
    id: 'decision-engine',
    cronExpression: '0 9 * * *',
    handler: 'runDecisionEngine',
    enabled: true,
    timeoutMs: 300000,
    maxRetries: 3,
    requiresApproval: false,
  },
  {
    id: 'content-drafter',
    cronExpression: '0 7 * * *',
    handler: 'draftContent',
    enabled: true,
    timeoutMs: 300000,
    maxRetries: 3,
    requiresApproval: true,
  },
  {
    id: 'metrics-updater',
    cronExpression: '0 * * * *',
    handler: 'updateMetrics',
    enabled: true,
    timeoutMs: 300000,
    maxRetries: 3,
    requiresApproval: false,
  },
  {
    id: 'self-improvement',
    cronExpression: '0 6 * * 0',
    handler: 'runSelfImprovement',
    enabled: true,
    timeoutMs: 600000,
    maxRetries: 2,
    requiresApproval: false,
  },
];

const RETRY_DELAYS = [1000, 5000, 30000];

export class AutoCEOScheduler {
  private stateStore: AutoCEOState;
  private jobRunner: JobRunner;
  private config: AutomationConfig;
  private jobs: Map<string, JobConfig> = new Map();
  private jobStates: Map<string, JobState> = new Map();
  private scheduledTasks: Map<string, ScheduledTask> = new Map();
  private deadLetterQueue: DeadLetterJob[] = [];
  private isRunning = false;
  private startedAt: string | null = null;
  private configPath: string;
  private humanNotifier: (jobId: string, error: string) => void;

  constructor(configPath = 'config/automation-schedule.json') {
    this.configPath = configPath;
    this.config = {
      jobs: DEFAULT_JOBS,
      featureFlags: {
        redditScraper: true,
        sentimentAnalyzer: true,
        decisionEngine: true,
        contentDrafter: true,
        metricsUpdater: true,
        selfImprovement: true,
      },
      rateLimits: {
        'reddit-scraper': { requestsPerHour: 60, burstLimit: 10 },
        'sentiment-analyzer': { requestsPerHour: 120, burstLimit: 20 },
        'decision-engine': { requestsPerHour: 10, burstLimit: 5 },
        'content-drafter': { requestsPerHour: 30, burstLimit: 5 },
        'metrics-updater': { requestsPerHour: 60, burstLimit: 10 },
        'self-improvement': { requestsPerHour: 5, burstLimit: 2 },
      },
      approvalGates: {
        posting: true,
        dming: true,
        interviews: false,
      },
    };
    this.stateStore = new AutoCEOState();
    this.jobRunner = new JobRunner();
    this.humanNotifier = this.defaultHumanNotifier;
    this.initializeJobs();
  }

  async init(): Promise<void> {
    await this.loadConfig();
    this.initializeJobs();
  }

  private async loadConfig(): Promise<void> {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf-8');
      const parsed = JSON.parse(configData);
      this.config = {
        jobs: parsed.jobs || DEFAULT_JOBS,
        featureFlags: parsed.featureFlags || this.config.featureFlags,
        rateLimits: parsed.rateLimits || this.config.rateLimits,
        approvalGates: parsed.approvalGates || this.config.approvalGates,
      };
    } catch {
      // Use defaults already set in constructor
    }
  }

  private initializeJobs(): void {
    for (const jobConfig of this.config.jobs) {
      this.jobs.set(jobConfig.id, jobConfig);
      this.jobStates.set(jobConfig.id, {
        id: jobConfig.id,
        status: 'idle',
        lastRun: null,
        nextRun: null,
        errorCount: 0,
        lastError: null,
        consecutiveFailures: 0,
      });
    }
  }

  private defaultHumanNotifier(jobId: string, error: string): void {
    const notificationDir = path.join('.ultra-dex', 'automation', 'notifications');

    if (!fs.existsSync(notificationDir)) {
      fs.mkdirSync(notificationDir, { recursive: true });
    }

    const notification = {
      jobId,
      error,
      timestamp: new Date().toISOString(),
      type: 'dead-letter',
    };

    const fileName = `${jobId}-${Date.now()}.json`;
    fs.writeFileSync(path.join(notificationDir, fileName), JSON.stringify(notification, null, 2));

    console.error(
      `[AUTO-CEO] CRITICAL: Job ${jobId} failed permanently and requires human attention`
    );
    console.error(`[AUTO-CEO] Error: ${error}`);
    console.error(`[AUTO-CEO] Notification written to ${path.join(notificationDir, fileName)}`);
  }

  setHumanNotifier(notifier: (jobId: string, error: string) => void): void {
    this.humanNotifier = notifier;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Scheduler is already running');
    }

    if (!this.stateStore.isLoaded()) {
      await this.stateStore.load();
    }

    const savedState = this.stateStore.get<any>('scheduler');
    if (savedState && savedState.startedAt) {
      this.startedAt = savedState.startedAt;
      if (savedState.deadLetterQueue) {
        this.deadLetterQueue = savedState.deadLetterQueue;
      }
      if (savedState.jobStates) {
        for (const [id, state] of Object.entries(savedState.jobStates)) {
          this.jobStates.set(id, state as JobState);
        }
      }
    } else {
      this.startedAt = new Date().toISOString();
    }

    this.isRunning = true;

    for (const [jobId, jobConfig] of this.jobs) {
      if (!jobConfig.enabled || !this.isFeatureEnabled(jobId)) {
        continue;
      }

      const task = cron.schedule(jobConfig.cronExpression, () => this.executeJob(jobId));

      this.scheduledTasks.set(jobId, task);

      const state = this.jobStates.get(jobId);
      if (state) {
        state.nextRun = this.getNextRunTime(jobConfig.cronExpression);
      }
    }

    await this.persistState();
    console.log('[AUTO-CEO] Scheduler started with', this.scheduledTasks.size, 'active jobs');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('[AUTO-CEO] Stopping scheduler...');

    for (const [jobId, task] of this.scheduledTasks) {
      task.stop();
      const state = this.jobStates.get(jobId);
      if (state && state.status === 'running') {
        state.status = 'paused';
      }
    }

    this.scheduledTasks.clear();
    this.isRunning = false;
    await this.persistState();

    console.log('[AUTO-CEO] Scheduler stopped');
  }

  status(): SchedulerStatus {
    const jobs: JobState[] = [];

    for (const [jobId, state] of this.jobStates) {
      const jobConfig = this.jobs.get(jobId);
      if (jobConfig && this.isRunning && this.scheduledTasks.has(jobId)) {
        state.nextRun = this.getNextRunTime(jobConfig.cronExpression);
      }
      jobs.push({ ...state });
    }

    return {
      isRunning: this.isRunning,
      startedAt: this.startedAt,
      jobs,
      deadLetterQueue: [...this.deadLetterQueue],
    };
  }

  private async executeJob(jobId: string): Promise<void> {
    const jobConfig = this.jobs.get(jobId);
    const state = this.jobStates.get(jobId);

    if (!jobConfig || !state) {
      console.error(`[AUTO-CEO] Unknown job: ${jobId}`);
      return;
    }

    if (state.status === 'running') {
      console.log(`[AUTO-CEO] Job ${jobId} already running, skipping`);
      return;
    }

    state.status = 'running';
    state.lastRun = new Date().toISOString();
    state.nextRun = this.getNextRunTime(jobConfig.cronExpression);

    console.log(`[AUTO-CEO] Executing job: ${jobId}`);

    let success = false;
    let lastError: string | null = null;

    for (let attempt = 0; attempt <= jobConfig.maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = RETRY_DELAYS[Math.min(attempt - 1, RETRY_DELAYS.length - 1)];
        console.log(
          `[AUTO-CEO] Retrying job ${jobId} in ${delay}ms (attempt ${attempt + 1}/${jobConfig.maxRetries + 1})`
        );
        await this.sleep(delay);
      }

      try {
        const result = await this.jobRunner.run(jobId, jobConfig.handler, jobConfig.timeoutMs);
        if (result.success) {
          success = true;
          state.consecutiveFailures = 0;
          break;
        } else {
          lastError = result.error || 'Unknown error';
          console.error(`[AUTO-CEO] Job ${jobId} failed: ${lastError}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        console.error(`[AUTO-CEO] Job ${jobId} threw exception: ${lastError}`);
      }
    }

    if (success) {
      state.status = 'idle';
      state.errorCount = 0;
      state.lastError = null;
      console.log(`[AUTO-CEO] Job ${jobId} completed successfully`);
    } else {
      state.status = 'failed';
      state.errorCount++;
      state.lastError = lastError;
      state.consecutiveFailures++;

      if (state.consecutiveFailures >= 3) {
        this.addToDeadLetterQueue(jobId, lastError || 'Unknown error', jobConfig.maxRetries + 1);
        state.consecutiveFailures = 0;
      }
    }

    await this.persistState();
  }

  private addToDeadLetterQueue(jobId: string, error: string, retryCount: number): void {
    const deadJob: DeadLetterJob = {
      jobId,
      failedAt: new Date().toISOString(),
      error,
      retryCount,
    };

    this.deadLetterQueue.push(deadJob);

    if (this.deadLetterQueue.length > 100) {
      this.deadLetterQueue = this.deadLetterQueue.slice(-100);
    }

    this.humanNotifier(jobId, error);
  }

  private async persistState(): Promise<void> {
    if (!this.stateStore.isLoaded()) {
      await this.stateStore.load();
    }

    const schedulerState = {
      isRunning: this.isRunning,
      startedAt: this.startedAt,
      jobStates: Object.fromEntries(this.jobStates),
      deadLetterQueue: this.deadLetterQueue,
      timestamp: new Date().toISOString(),
    };

    await this.stateStore.set('scheduler', schedulerState);
    await this.stateStore.save();
  }

  private getNextRunTime(cronExpression: string): string | null {
    try {
      const nextDate = new Date(Date.now() + 60000);
      return nextDate.toISOString();
    } catch {
      return null;
    }
  }

  private isFeatureEnabled(jobId: string): boolean {
    const camelCaseId = jobId.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    return this.config.featureFlags[camelCaseId] !== false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async runJobNow(jobId: string): Promise<boolean> {
    await this.executeJob(jobId);
    const state = this.jobStates.get(jobId);
    return state?.status === 'idle' && !state.lastError;
  }

  getJobState(jobId: string): JobState | undefined {
    const state = this.jobStates.get(jobId);
    return state ? { ...state } : undefined;
  }

  pauseJob(jobId: string): boolean {
    const task = this.scheduledTasks.get(jobId);
    if (!task) return false;

    task.stop();
    const state = this.jobStates.get(jobId);
    if (state) {
      state.status = 'paused';
    }
    return true;
  }

  resumeJob(jobId: string): boolean {
    const jobConfig = this.jobs.get(jobId);
    if (!jobConfig || !this.isRunning) return false;

    const task = cron.schedule(jobConfig.cronExpression, () => this.executeJob(jobId));

    this.scheduledTasks.set(jobId, task);
    const state = this.jobStates.get(jobId);
    if (state) {
      state.status = 'idle';
      state.nextRun = this.getNextRunTime(jobConfig.cronExpression);
    }
    return true;
  }

  clearDeadLetterQueue(): void {
    this.deadLetterQueue = [];
  }

  getDeadLetterQueue(): DeadLetterJob[] {
    return [...this.deadLetterQueue];
  }
}

export default AutoCEOScheduler;
