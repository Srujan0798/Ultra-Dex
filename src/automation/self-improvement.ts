import fs from 'fs';
import path from 'path';

export type PredictionCategory = 'decision' | 'sentiment' | 'content';

export interface PredictionMetadata {
  subreddit?: string;
  postingHour?: number;
  contentType?: string;
  outreachMessage?: string;
  engagementScore?: number;
  responseQuality?: number;
  conversionRate?: number;
  replyRate?: number;
  failureReason?: string;
  [key: string]: unknown;
}

export interface PredictionRecord {
  id: string;
  timestamp: string;
  category: PredictionCategory;
  predicted: string | number | boolean;
  actual: string | number | boolean;
  isCorrect: boolean;
  metadata: PredictionMetadata;
}

export interface ThresholdAdjustment {
  id: string;
  timestamp: string;
  previousContinueThreshold: number;
  newContinueThreshold: number;
  delta: number;
  reason: string;
  backupPath: string;
}

interface ImprovementState {
  version: number;
  createdAt: string;
  predictions: PredictionRecord[];
  adjustments: ThresholdAdjustment[];
  archivedFailureIds: string[];
  initialThresholds: {
    continueThreshold: number;
    stopThreshold: number;
  };
  lastAdjustmentAt?: string;
}

interface DecisionThresholdConfig {
  continue_threshold: number;
  stop_threshold: number;
  min_signals_required: number;
  min_diversity: number;
  weights: {
    sentiment: number;
    buying_signal: number;
    willingness_to_pay: number;
    interest_signal: number;
  };
  upvote_multiplier: number;
  interview_multiplier: number;
  recalibrate_weekly: boolean;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;
const THRESHOLD_STEP = 0.05;
const MAX_DRIFT = 0.2;
const MIN_DATA_POINTS = 10;

export class SelfImprovement {
  private readonly statePath: string;
  private readonly thresholdPath: string;
  private readonly logPath: string;
  private readonly failuresDir: string;
  private readonly backupsDir: string;
  private state: ImprovementState;

  constructor(
    statePath = path.join(process.cwd(), '.ultra-dex/automation/improvement-state.json'),
    thresholdPath = path.join(process.cwd(), 'config/decision-thresholds.json'),
    logPath = path.join(process.cwd(), '.ultra-dex/automation/improvement-log.md')
  ) {
    this.statePath = statePath;
    this.thresholdPath = thresholdPath;
    this.logPath = logPath;
    this.failuresDir = path.join(process.cwd(), '.ultra-dex/automation/failures');
    this.backupsDir = path.join(process.cwd(), '.ultra-dex/automation/threshold-backups');

    this.ensureDirectories();
    this.ensureLogTemplate();
    this.state = this.loadOrCreateState();
  }

  trackPrediction(
    predicted: string | number | boolean,
    actual: string | number | boolean,
    category: PredictionCategory = 'decision',
    metadata: PredictionMetadata = {}
  ): PredictionRecord {
    const record: PredictionRecord = {
      id: `pred-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      category,
      predicted,
      actual,
      isCorrect: this.isCorrectPrediction(predicted, actual),
      metadata,
    };

    this.state.predictions.push(record);
    this.saveState();
    return record;
  }

  calculateAccuracy(window: 7 | 30 | 90): number {
    const cutoff = Date.now() - window * ONE_DAY_MS;
    const records = this.state.predictions.filter((p) => new Date(p.timestamp).getTime() >= cutoff);
    if (records.length === 0) {
      return 0;
    }
    const correct = records.filter((p) => p.isCorrect).length;
    return Number((correct / records.length).toFixed(4));
  }

  adjustThresholds(now = new Date()): {
    adjusted: boolean;
    reason: string;
    previousThreshold: number;
    newThreshold: number;
  } {
    const lastAdjustment = this.state.lastAdjustmentAt
      ? new Date(this.state.lastAdjustmentAt).getTime()
      : undefined;
    const nowMs = now.getTime();
    const thresholds = this.readThresholds();

    if (lastAdjustment && nowMs - lastAdjustment < ONE_WEEK_MS) {
      return {
        adjusted: false,
        reason: 'Skipped: weekly cadence not reached yet.',
        previousThreshold: thresholds.continue_threshold,
        newThreshold: thresholds.continue_threshold,
      };
    }

    const decisionPoints = this.state.predictions.filter((p) => p.category === 'decision');
    if (decisionPoints.length < MIN_DATA_POINTS) {
      return {
        adjusted: false,
        reason: `Skipped: only ${decisionPoints.length} decision points (min ${MIN_DATA_POINTS}).`,
        previousThreshold: thresholds.continue_threshold,
        newThreshold: thresholds.continue_threshold,
      };
    }

    const continuePredictions = decisionPoints.filter((p) => this.normalizeValue(p.predicted) === 'continue');
    if (continuePredictions.length === 0) {
      return {
        adjusted: false,
        reason: 'Skipped: no CONTINUE predictions available to evaluate.',
        previousThreshold: thresholds.continue_threshold,
        newThreshold: thresholds.continue_threshold,
      };
    }

    const goodOutcomes = continuePredictions.filter((p) => this.normalizeValue(p.actual) === 'continue').length;
    const badOutcomes = continuePredictions.length - goodOutcomes;
    const successRate = goodOutcomes / continuePredictions.length;

    let delta = 0;
    if (successRate >= 0.7) {
      delta = -THRESHOLD_STEP;
    } else if (successRate <= 0.5) {
      delta = THRESHOLD_STEP;
    }

    if (delta === 0) {
      return {
        adjusted: false,
        reason: `Skipped: CONTINUE outcome quality is stable (${(successRate * 100).toFixed(1)}%).`,
        previousThreshold: thresholds.continue_threshold,
        newThreshold: thresholds.continue_threshold,
      };
    }

    const initial = this.state.initialThresholds.continueThreshold;
    const minAllowed = initial - MAX_DRIFT;
    const maxAllowed = initial + MAX_DRIFT;
    const previous = thresholds.continue_threshold;
    const next = this.clamp(Number((previous + delta).toFixed(4)), minAllowed, maxAllowed);

    if (next === previous) {
      return {
        adjusted: false,
        reason: 'Skipped: drift cap reached; threshold already at allowed boundary.',
        previousThreshold: previous,
        newThreshold: next,
      };
    }

    const backupPath = path.join(this.backupsDir, `decision-thresholds-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(thresholds, null, 2), 'utf-8');

    thresholds.continue_threshold = next;
    fs.writeFileSync(this.thresholdPath, JSON.stringify(thresholds, null, 2), 'utf-8');

    const reason =
      delta < 0
        ? `Lowered continue threshold by ${THRESHOLD_STEP} because CONTINUE outcomes were strong (${goodOutcomes}/${continuePredictions.length}).`
        : `Raised continue threshold by ${THRESHOLD_STEP} because CONTINUE outcomes underperformed (${badOutcomes}/${continuePredictions.length} bad).`;

    const adjustment: ThresholdAdjustment = {
      id: `adj-${Date.now()}`,
      timestamp: now.toISOString(),
      previousContinueThreshold: previous,
      newContinueThreshold: next,
      delta: Number((next - previous).toFixed(4)),
      reason,
      backupPath,
    };

    this.state.adjustments.push(adjustment);
    this.state.lastAdjustmentAt = now.toISOString();
    this.saveState();
    this.appendLogSection(
      `## Threshold Adjustment — ${adjustment.timestamp}\n\n- Previous continue threshold: \`${previous.toFixed(2)}\`\n- New continue threshold: \`${next.toFixed(2)}\`\n- Reason: ${reason}\n- Backup: \`${backupPath}\`\n`
    );

    return {
      adjusted: true,
      reason,
      previousThreshold: previous,
      newThreshold: next,
    };
  }

  identifyPatterns(): {
    postingTimes: { hour: number; engagement: number; samples: number }[];
    subreddits: { subreddit: string; quality: number; samples: number }[];
    contentTypes: { contentType: string; conversion: number; samples: number }[];
    outreachMessages: { outreachMessage: string; replyRate: number; samples: number }[];
  } {
    return {
      postingTimes: this.rankByAverage<number>('postingHour', 'engagementScore').map((item) => ({
        hour: Number(item.key),
        engagement: item.average,
        samples: item.samples,
      })),
      subreddits: this.rankByAverage<string>('subreddit', 'responseQuality').map((item) => ({
        subreddit: item.key,
        quality: item.average,
        samples: item.samples,
      })),
      contentTypes: this.rankByAverage<string>('contentType', 'conversionRate').map((item) => ({
        contentType: item.key,
        conversion: item.average,
        samples: item.samples,
      })),
      outreachMessages: this.rankByAverage<string>('outreachMessage', 'replyRate').map((item) => ({
        outreachMessage: item.key,
        replyRate: item.average,
        samples: item.samples,
      })),
    };
  }

  generateWeeklyReport(now = new Date()): string {
    const weekStart = now.getTime() - ONE_WEEK_MS;
    const previousWeekStart = weekStart - ONE_WEEK_MS;

    const thisWeek = this.state.predictions.filter((p) => new Date(p.timestamp).getTime() >= weekStart);
    const previousWeek = this.state.predictions.filter((p) => {
      const ts = new Date(p.timestamp).getTime();
      return ts >= previousWeekStart && ts < weekStart;
    });

    const thisWeekAccuracy = this.accuracyOf(thisWeek);
    const previousWeekAccuracy = this.accuracyOf(previousWeek);
    const trend =
      thisWeekAccuracy > previousWeekAccuracy
        ? 'improving'
        : thisWeekAccuracy < previousWeekAccuracy
          ? 'declining'
          : 'stable';

    const weeklyAdjustments = this.state.adjustments.filter(
      (a) => new Date(a.timestamp).getTime() >= weekStart
    );
    const patterns = this.identifyPatterns();
    const recommendations = this.buildRecommendations(trend, patterns);

    const report = `## Weekly Improvement Report — ${now.toISOString()}\n\n### What changed this week\n- Predictions logged: ${thisWeek.length}\n- Threshold adjustments: ${weeklyAdjustments.length}\n\n### Accuracy trend\n- This week: ${(thisWeekAccuracy * 100).toFixed(1)}%\n- Previous week: ${(previousWeekAccuracy * 100).toFixed(1)}%\n- Trend: **${trend}**\n\n### Threshold adjustments made\n${
      weeklyAdjustments.length > 0
        ? weeklyAdjustments
            .map(
              (a) =>
                `- ${a.timestamp}: continue threshold ${a.previousContinueThreshold.toFixed(2)} → ${a.newContinueThreshold.toFixed(2)} (${a.reason})`
            )
            .join('\n')
        : '- None this week'
    }\n\n### Recommendations for next week\n${recommendations.map((r) => `- ${r}`).join('\n')}\n`;

    this.appendLogSection(report);
    return report;
  }

  archiveFailures(now = new Date()): string | null {
    const unarchivedFailures = this.state.predictions.filter(
      (p) => !p.isCorrect && !this.state.archivedFailureIds.includes(p.id)
    );
    if (unarchivedFailures.length === 0) {
      return null;
    }

    const datePart = now.toISOString().split('T')[0];
    const failurePath = path.join(this.failuresDir, `${datePart}.md`);
    const lines = [
      `# Failure Archive — ${now.toISOString()}`,
      '',
      '| Timestamp | Category | Predicted | Actual | Why it failed | What to avoid |',
      '| --- | --- | --- | --- | --- | --- |',
    ];

    for (const failure of unarchivedFailures) {
      const why = failure.metadata.failureReason || this.defaultFailureReason(failure);
      const avoid = this.defaultAvoidance(failure);
      lines.push(
        `| ${failure.timestamp} | ${failure.category} | ${String(failure.predicted)} | ${String(failure.actual)} | ${this.escapeCell(String(why))} | ${this.escapeCell(avoid)} |`
      );
      this.state.archivedFailureIds.push(failure.id);
    }

    lines.push('');
    fs.writeFileSync(failurePath, `${lines.join('\n')}\n`, 'utf-8');
    this.saveState();
    this.appendLogSection(
      `## Failure Archive — ${now.toISOString()}\n\n- Archived ${unarchivedFailures.length} failures to \`${failurePath}\`.\n`
    );

    return failurePath;
  }

  resetThresholdsToDefaults(reason = 'manual override'): void {
    const thresholds = this.readThresholds();
    const previous = thresholds.continue_threshold;

    thresholds.continue_threshold = this.state.initialThresholds.continueThreshold;
    thresholds.stop_threshold = this.state.initialThresholds.stopThreshold;
    fs.writeFileSync(this.thresholdPath, JSON.stringify(thresholds, null, 2), 'utf-8');

    this.appendLogSection(
      `## Threshold Reset — ${new Date().toISOString()}\n\n- Action: reset thresholds to defaults (${reason})\n- continue threshold: ${previous.toFixed(2)} → ${thresholds.continue_threshold.toFixed(2)}\n`
    );
  }

  private loadOrCreateState(): ImprovementState {
    if (fs.existsSync(this.statePath)) {
      const content = fs.readFileSync(this.statePath, 'utf-8');
      return JSON.parse(content) as ImprovementState;
    }

    const thresholds = this.readThresholds();
    const initialState: ImprovementState = {
      version: 1,
      createdAt: new Date().toISOString(),
      predictions: [],
      adjustments: [],
      archivedFailureIds: [],
      initialThresholds: {
        continueThreshold: thresholds.continue_threshold,
        stopThreshold: thresholds.stop_threshold,
      },
    };

    fs.writeFileSync(this.statePath, JSON.stringify(initialState, null, 2), 'utf-8');
    return initialState;
  }

  private readThresholds(): DecisionThresholdConfig {
    const raw = fs.readFileSync(this.thresholdPath, 'utf-8');
    return JSON.parse(raw) as DecisionThresholdConfig;
  }

  private saveState(): void {
    this.state.version += 1;
    fs.writeFileSync(this.statePath, JSON.stringify(this.state, null, 2), 'utf-8');
  }

  private ensureDirectories(): void {
    for (const dir of [
      path.dirname(this.statePath),
      path.dirname(this.logPath),
      this.failuresDir,
      this.backupsDir,
    ]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  private ensureLogTemplate(): void {
    if (fs.existsSync(this.logPath)) {
      return;
    }

    const template = `# AUTO-CEO Self-Improvement Log\n\n> Append-only. Records threshold adjustments, weekly reports, archived failures, and rationale.\n\n## Baseline\n\n- Created: ${new Date().toISOString()}\n- Threshold drift cap: ±0.2 from initial values\n- Adjustment cadence: weekly\n- Minimum data points per adjustment: 10\n\n---\n`;
    fs.writeFileSync(this.logPath, template, 'utf-8');
  }

  private appendLogSection(markdown: string): void {
    fs.appendFileSync(this.logPath, `\n${markdown}\n`, 'utf-8');
  }

  private isCorrectPrediction(
    predicted: string | number | boolean,
    actual: string | number | boolean
  ): boolean {
    if (typeof predicted === 'number' && typeof actual === 'number') {
      return Math.abs(predicted - actual) <= 0.1;
    }
    return this.normalizeValue(predicted) === this.normalizeValue(actual);
  }

  private normalizeValue(value: string | number | boolean): string {
    return String(value).trim().toLowerCase();
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private accuracyOf(records: PredictionRecord[]): number {
    if (records.length === 0) {
      return 0;
    }
    return records.filter((r) => r.isCorrect).length / records.length;
  }

  private rankByAverage<T extends string | number>(
    dimension: keyof PredictionMetadata,
    metric: keyof PredictionMetadata
  ): Array<{ key: T; average: number; samples: number }> {
    const aggregates = new Map<T, { total: number; count: number }>();

    for (const prediction of this.state.predictions) {
      const key = prediction.metadata[dimension] as T | undefined;
      const metricValue = prediction.metadata[metric];
      if (key === undefined || typeof metricValue !== 'number' || Number.isNaN(metricValue)) {
        continue;
      }

      const current = aggregates.get(key) || { total: 0, count: 0 };
      current.total += metricValue;
      current.count += 1;
      aggregates.set(key, current);
    }

    return [...aggregates.entries()]
      .map(([key, values]) => ({
        key,
        average: Number((values.total / values.count).toFixed(4)),
        samples: values.count,
      }))
      .sort((a, b) => b.average - a.average);
  }

  private buildRecommendations(
    trend: 'improving' | 'declining' | 'stable',
    patterns: ReturnType<SelfImprovement['identifyPatterns']>
  ): string[] {
    const recommendations: string[] = [];

    if (trend === 'declining') {
      recommendations.push('Pause threshold changes for one week and collect more data diversity.');
    } else if (trend === 'improving') {
      recommendations.push('Keep current experimentation cadence; continue collecting high-signal samples.');
    } else {
      recommendations.push('Run one controlled content experiment to break accuracy stagnation.');
    }

    if (patterns.subreddits[0]) {
      recommendations.push(
        `Prioritize r/${patterns.subreddits[0].subreddit} (best response quality: ${(
          patterns.subreddits[0].quality * 100
        ).toFixed(1)}%).`
      );
    }
    if (patterns.contentTypes[0]) {
      recommendations.push(
        `Increase ${patterns.contentTypes[0].contentType} content (best conversion: ${(
          patterns.contentTypes[0].conversion * 100
        ).toFixed(1)}%).`
      );
    }
    if (patterns.postingTimes[0]) {
      recommendations.push(`Schedule posts around hour ${patterns.postingTimes[0].hour}:00 UTC.`);
    }

    return recommendations.slice(0, 4);
  }

  private defaultFailureReason(failure: PredictionRecord): string {
    if (failure.category === 'decision') {
      return 'Decision signal interpretation did not match observed outcome.';
    }
    if (failure.category === 'sentiment') {
      return 'Sentiment expectation diverged from actual audience reaction.';
    }
    return 'Content performance estimate missed actual conversion behavior.';
  }

  private defaultAvoidance(failure: PredictionRecord): string {
    if (failure.category === 'decision') {
      return 'Do not execute major roadmap moves on weak or single-source signals.';
    }
    if (failure.category === 'sentiment') {
      return 'Avoid broad sentiment assumptions without sufficient sample size.';
    }
    return 'Avoid repeating low-conversion content formats without adjustment.';
  }

  private escapeCell(value: string): string {
    return value.replaceAll('|', '\\|');
  }
}

