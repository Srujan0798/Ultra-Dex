/**
 * AUTO-CEO Decision Engine
 * Weighs evidence, calculates confidence, recommends continue/pivot/stop
 */

import fs from 'fs';
import path from 'path';

export interface Evidence {
  source: 'reddit' | 'interview' | 'content' | 'competitor' | 'other';
  timestamp: string;
  type:
    | 'sentiment'
    | 'buying_signal'
    | 'willingness_to_pay'
    | 'interest_signal'
    | 'competitor_mention'
    | 'contradiction';
  value: number; // 1 = positive/supporting, -1 = negative/opposing, 0 = neutral
  weight: number;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface RedditData {
  sentimentScores: { positive: number; negative: number; neutral: number };
  totalResponses: number;
  buyingSignals: number;
  highUpvoteComments: number; // 10+ upvotes
  interestSignals: number;
}

export interface InterviewData {
  totalInterviews: number;
  completedInterviews: number;
  willingToPay: number;
  painPoints: string[];
  quotes: string[];
}

export interface ContentData {
  engagementRate: number;
  followerGrowth: number;
  viralPosts: number;
}

export interface CompetitorData {
  mentions: number;
  betterAlternativeMentions: number;
  alreadyUsingMentions: number;
}

export interface DecisionData {
  reddit?: RedditData;
  interviews?: InterviewData;
  content?: ContentData;
  competitors?: CompetitorData;
  customEvidence?: Evidence[];
}

export interface Thresholds {
  continueThreshold: number;
  stopThreshold: number;
  minSignalsRequired: number;
  minDiversity: number;
  weights: {
    sentiment: number;
    buyingSignal: number;
    willingnessToPay: number;
    interestSignal: number;
  };
  upvoteMultiplier: number;
  interviewMultiplier: number;
  recalibrateWeekly: boolean;
}

export interface DecisionResult {
  decision: 'CONTINUE' | 'PIVOT' | 'STOP' | 'INSUFFICIENT_DATA';
  confidence: number;
  evidence: EvidenceSummary;
  rationale: string;
  nextSteps: string[];
  warnings: string[];
  breakdown: ConfidenceBreakdown;
}

export interface EvidenceSummary {
  totalSignals: number;
  redditResponses: number;
  interviewsCompleted: number;
  buyingSignals: number;
  willingnessToPay: number;
  competitorMentions: number;
  uniqueUsers: number;
}

export interface ConfidenceBreakdown {
  sentimentComponent: number;
  buyingSignalComponent: number;
  willingnessToPayComponent: number;
  interestSignalComponent: number;
  penaltyComponent: number;
  baseScore: number;
  finalScore: number;
}

export interface DecisionHistory {
  date: string;
  decision: string;
  confidence: number;
  rationale: string;
}

const DEFAULT_THRESHOLDS: Thresholds = {
  continueThreshold: 0.7,
  stopThreshold: 0.3,
  minSignalsRequired: 5,
  minDiversity: 3,
  weights: {
    sentiment: 0.3,
    buyingSignal: 0.3,
    willingnessToPay: 0.2,
    interestSignal: 0.2,
  },
  upvoteMultiplier: 3,
  interviewMultiplier: 10,
  recalibrateWeekly: true,
};

export class DecisionEngine {
  private thresholds: Thresholds;
  private evidence: Evidence[] = [];
  private data: DecisionData = {};
  private history: DecisionHistory[] = [];
  private historyFile: string;

  constructor(
    thresholds?: Partial<Thresholds>,
    historyFile = 'marketing/validation/decision-history.json'
  ) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    this.historyFile = historyFile;
    this.loadHistory();
  }

  private loadHistory(): void {
    try {
      if (fs.existsSync(this.historyFile)) {
        const content = fs.readFileSync(this.historyFile, 'utf-8');
        this.history = JSON.parse(content);
      }
    } catch {
      this.history = [];
    }
  }

  private saveHistory(): void {
    const dir = path.dirname(this.historyFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.historyFile, JSON.stringify(this.history, null, 2));
  }

  /**
   * Collect evidence from all data sources
   */
  collectEvidence(data: DecisionData): Evidence[] {
    this.data = data;
    this.evidence = [];

    // Reddit evidence
    if (data.reddit) {
      this.collectRedditEvidence(data.reddit);
    }

    // Interview evidence
    if (data.interviews) {
      this.collectInterviewEvidence(data.interviews);
    }

    // Content evidence
    if (data.content) {
      this.collectContentEvidence(data.content);
    }

    // Competitor evidence (negative weight)
    if (data.competitors) {
      this.collectCompetitorEvidence(data.competitors);
    }

    // Custom evidence
    if (data.customEvidence) {
      this.evidence.push(...data.customEvidence);
    }

    return this.evidence;
  }

  private collectRedditEvidence(reddit: RedditData): void {
    const total =
      reddit.sentimentScores.positive +
      reddit.sentimentScores.negative +
      reddit.sentimentScores.neutral;
    const positivePct = total > 0 ? reddit.sentimentScores.positive / total : 0;

    // Sentiment evidence (weighted by upvotes)
    for (let i = 0; i < reddit.totalResponses; i++) {
      const isHighUpvote = i < reddit.highUpvoteComments;
      const weight = isHighUpvote ? this.thresholds.upvoteMultiplier : 1;

      this.evidence.push({
        source: 'reddit',
        timestamp: new Date().toISOString(),
        type: 'sentiment',
        value: positivePct > 0.5 ? 1 : positivePct < 0.3 ? -1 : 0,
        weight,
        metadata: { highUpvote: isHighUpvote },
      });
    }

    // Buying signals
    for (let i = 0; i < reddit.buyingSignals; i++) {
      this.evidence.push({
        source: 'reddit',
        timestamp: new Date().toISOString(),
        type: 'buying_signal',
        value: 1,
        weight: 5, // Direct "would pay" statement multiplier
      });
    }

    // Interest signals
    for (let i = 0; i < reddit.interestSignals; i++) {
      this.evidence.push({
        source: 'reddit',
        timestamp: new Date().toISOString(),
        type: 'interest_signal',
        value: 1,
        weight: 1,
      });
    }
  }

  private collectInterviewEvidence(interviews: InterviewData): void {
    const multiplier = this.thresholds.interviewMultiplier;

    // Completed interviews carry significant weight
    for (let i = 0; i < interviews.completedInterviews; i++) {
      this.evidence.push({
        source: 'interview',
        timestamp: new Date().toISOString(),
        type: 'interest_signal',
        value: 1,
        weight: multiplier,
        metadata: { type: 'completed_interview' },
      });
    }

    // Willingness to pay (strongest signal)
    for (let i = 0; i < interviews.willingToPay; i++) {
      this.evidence.push({
        source: 'interview',
        timestamp: new Date().toISOString(),
        type: 'willingness_to_pay',
        value: 1,
        weight: multiplier * 2, // Extra weight for payment intent
      });
    }
  }

  private collectContentEvidence(content: ContentData): void {
    // High engagement indicates interest
    if (content.engagementRate > 0.05) {
      this.evidence.push({
        source: 'content',
        timestamp: new Date().toISOString(),
        type: 'interest_signal',
        value: 1,
        weight: Math.min(content.engagementRate * 100, 5),
        metadata: { engagementRate: content.engagementRate },
      });
    }

    // Viral posts amplify signals
    for (let i = 0; i < content.viralPosts; i++) {
      this.evidence.push({
        source: 'content',
        timestamp: new Date().toISOString(),
        type: 'interest_signal',
        value: 1,
        weight: 3,
        metadata: { viral: true },
      });
    }
  }

  private collectCompetitorEvidence(competitors: CompetitorData): void {
    // "Already use X" mentions are strong negative signals
    for (let i = 0; i < competitors.alreadyUsingMentions; i++) {
      this.evidence.push({
        source: 'competitor',
        timestamp: new Date().toISOString(),
        type: 'competitor_mention',
        value: -1,
        weight: 2, // -2x weight
        metadata: { type: 'already_using' },
      });
    }

    // "Better alternative" mentions
    for (let i = 0; i < competitors.betterAlternativeMentions; i++) {
      this.evidence.push({
        source: 'competitor',
        timestamp: new Date().toISOString(),
        type: 'competitor_mention',
        value: -1,
        weight: 1.5,
        metadata: { type: 'better_alternative' },
      });
    }
  }

  /**
   * Calculate confidence score (0.0 to 1.0)
   */
  calculateConfidence(): { score: number; breakdown: ConfidenceBreakdown } {
    if (this.evidence.length === 0) {
      return {
        score: 0,
        breakdown: {
          sentimentComponent: 0,
          buyingSignalComponent: 0,
          willingnessToPayComponent: 0,
          interestSignalComponent: 0,
          penaltyComponent: 0,
          baseScore: 0,
          finalScore: 0,
        },
      };
    }

    const reddit = this.data.reddit;
    const interviews = this.data.interviews;
    const competitors = this.data.competitors;

    // Calculate base components
    let sentimentComponent = 0;
    let buyingSignalComponent = 0;
    let willingnessToPayComponent = 0;
    let interestSignalComponent = 0;
    let penaltyComponent = 0;

    // Sentiment: positive_sentiment_pct × weight
    if (reddit && reddit.totalResponses > 0) {
      const total =
        reddit.sentimentScores.positive +
        reddit.sentimentScores.negative +
        reddit.sentimentScores.neutral;
      const positivePct = total > 0 ? reddit.sentimentScores.positive / total : 0;
      sentimentComponent = positivePct * this.thresholds.weights.sentiment;
    }

    // Buying signals: buying_signals / total_responses × weight
    if (reddit && reddit.totalResponses > 0) {
      buyingSignalComponent =
        (reddit.buyingSignals / reddit.totalResponses) * this.thresholds.weights.buyingSignal;
    }

    // Willingness to pay: willing_to_pay_count / interview_count × weight
    if (interviews && interviews.totalInterviews > 0) {
      willingnessToPayComponent =
        (interviews.willingToPay / interviews.totalInterviews) *
        this.thresholds.weights.willingnessToPay;
    }

    // Interest signals: interest_signals / total_responses × weight
    if (reddit && reddit.totalResponses > 0) {
      interestSignalComponent =
        (reddit.interestSignals / reddit.totalResponses) * this.thresholds.weights.interestSignal;
    }

    // Penalty: competitor_better_mentions × 0.1
    if (competitors) {
      penaltyComponent = competitors.betterAlternativeMentions * 0.1;
    }

    const baseScore =
      sentimentComponent +
      buyingSignalComponent +
      willingnessToPayComponent +
      interestSignalComponent;
    let confidence = Math.max(0, Math.min(1, baseScore - penaltyComponent));

    // Edge case: exactly 0.7 rounds UP (bias toward action)
    if (confidence >= 0.699 && confidence < 0.701) {
      confidence = 0.71;
    }

    return {
      score: confidence,
      breakdown: {
        sentimentComponent,
        buyingSignalComponent,
        willingnessToPayComponent,
        interestSignalComponent,
        penaltyComponent,
        baseScore,
        finalScore: confidence,
      },
    };
  }

  /**
   * Generate recommendation based on confidence and evidence
   */
  recommend(): DecisionResult {
    const warnings: string[] = [];

    // Edge case: insufficient data
    const totalSignals = this.evidence.length;
    if (totalSignals < this.thresholds.minSignalsRequired) {
      return {
        decision: 'INSUFFICIENT_DATA',
        confidence: 0,
        evidence: this.summarizeEvidence(),
        rationale: `Only ${totalSignals} signals collected. Minimum ${this.thresholds.minSignalsRequired} required for a valid recommendation.`,
        nextSteps: [
          'Continue collecting data from Reddit and interviews',
          'Wait for at least 5 meaningful signals before making a decision',
          'Review data collection channels for gaps',
        ],
        warnings: [
          `Signal count (${totalSignals}) below minimum threshold (${this.thresholds.minSignalsRequired})`,
        ],
        breakdown: this.calculateConfidence().breakdown,
      };
    }

    // Edge case: low diversity
    const uniqueUsers = this.countUniqueUsers();
    if (uniqueUsers < this.thresholds.minDiversity) {
      warnings.push(
        `Low diversity: only ${uniqueUsers} unique sources (min: ${this.thresholds.minDiversity})`
      );
    }

    // Edge case: contradictory signals
    const contradictory = this.detectContradictions();
    if (contradictory.length > 0) {
      warnings.push(
        `Contradictory signals detected: ${contradictory.length} conflicting evidence pairs`
      );
    }

    const { score: confidence, breakdown } = this.calculateConfidence();

    // Determine decision
    let decision: 'CONTINUE' | 'PIVOT' | 'STOP';
    let rationale: string;
    let nextSteps: string[];

    if (confidence >= this.thresholds.continueThreshold) {
      decision = 'CONTINUE';
      rationale = this.generateContinueRationale(confidence, breakdown);
      nextSteps = [
        'Proceed with current product direction',
        'Schedule next milestone review in 1 week',
        'Increase marketing spend by 20%',
        'Begin customer acquisition scaling',
      ];
    } else if (confidence >= this.thresholds.stopThreshold) {
      decision = 'PIVOT';
      rationale = this.generatePivotRationale(confidence, breakdown);
      nextSteps = [
        'Reassess product-market fit hypothesis',
        'Interview 5 more potential customers with adjusted questions',
        'Analyze specific objections from negative signals',
        'Consider feature adjustments based on feedback',
        'Schedule pivot decision review in 3 days',
      ];
    } else {
      decision = 'STOP';
      rationale = this.generateStopRationale(confidence, breakdown);
      nextSteps = [
        'Halt current product development',
        'Document lessons learned',
        'Analyze why market signals are weak',
        'Consider complete pivot or new idea',
        'Review decision in 1 week if new evidence emerges',
      ];
    }

    const result: DecisionResult = {
      decision,
      confidence,
      evidence: this.summarizeEvidence(),
      rationale,
      nextSteps,
      warnings,
      breakdown,
    };

    // Save to history
    this.history.push({
      date: new Date().toISOString(),
      decision,
      confidence,
      rationale: rationale.slice(0, 200),
    });
    this.saveHistory();

    return result;
  }

  private summarizeEvidence(): EvidenceSummary {
    const reddit = this.data.reddit;
    const interviews = this.data.interviews;
    const competitors = this.data.competitors;

    return {
      totalSignals: this.evidence.length,
      redditResponses: reddit?.totalResponses || 0,
      interviewsCompleted: interviews?.completedInterviews || 0,
      buyingSignals: reddit?.buyingSignals || 0,
      willingnessToPay: interviews?.willingToPay || 0,
      competitorMentions: competitors?.mentions || 0,
      uniqueUsers: this.countUniqueUsers(),
    };
  }

  private countUniqueUsers(): number {
    const users = new Set<string>();
    this.evidence.forEach((e) => {
      if (e.userId) {
        users.add(e.userId);
      }
    });
    // If no user IDs, estimate from sources
    if (users.size === 0) {
      const sources = new Set(this.evidence.map((e) => e.source));
      return Math.max(sources.size, Math.ceil(this.evidence.length / 3));
    }
    return users.size;
  }

  private detectContradictions(): Array<{ positive: Evidence; negative: Evidence }> {
    const contradictions: Array<{ positive: Evidence; negative: Evidence }> = [];
    const bySource = new Map<string, Evidence[]>();

    // Group evidence by approximate source/topic
    this.evidence.forEach((e) => {
      const key = (e.metadata?.topic as string) || e.source;
      if (!bySource.has(key)) {
        bySource.set(key, []);
      }
      bySource.get(key)!.push(e);
    });

    // Look for strong positive + strong negative in same group
    bySource.forEach((group) => {
      const positive = group.filter((e) => e.value > 0 && e.weight >= 2);
      const negative = group.filter((e) => e.value < 0 && e.weight >= 2);

      if (positive.length > 0 && negative.length > 0) {
        contradictions.push({
          positive: positive[0],
          negative: negative[0],
        });
      }
    });

    return contradictions;
  }

  private generateContinueRationale(confidence: number, breakdown: ConfidenceBreakdown): string {
    const parts: string[] = [];
    parts.push(
      `Strong confidence (${(confidence * 100).toFixed(1)}%) indicates product-market fit is validated.`
    );

    if (breakdown.willingnessToPayComponent > 0.1) {
      parts.push(
        'Customers are explicitly willing to pay, which is the strongest validation signal.'
      );
    }
    if (breakdown.buyingSignalComponent > 0.15) {
      parts.push('High volume of organic buying signals suggests strong organic demand.');
    }
    if (breakdown.sentimentComponent > 0.2) {
      parts.push('Positive sentiment dominates community discussions.');
    }

    return parts.join(' ');
  }

  private generatePivotRationale(confidence: number, breakdown: ConfidenceBreakdown): string {
    const parts: string[] = [];
    parts.push(
      `Moderate confidence (${(confidence * 100).toFixed(1)}%) suggests potential, but significant adjustments may be needed.`
    );

    if (breakdown.willingnessToPayComponent < 0.1) {
      parts.push('Low willingness to pay indicates pricing or value proposition concerns.');
    }
    if (breakdown.penaltyComponent > 0.05) {
      parts.push('Competitor mentions suggest alternatives are being considered.');
    }
    if (breakdown.buyingSignalComponent < 0.1) {
      parts.push('Weak buying signals indicate messaging or product fit issues.');
    }

    return parts.join(' ');
  }

  private generateStopRationale(confidence: number, breakdown: ConfidenceBreakdown): string {
    const parts: string[] = [];
    parts.push(
      `Low confidence (${(confidence * 100).toFixed(1)}%) indicates insufficient market validation.`
    );

    if (breakdown.sentimentComponent < 0.1) {
      parts.push('Negative or neutral sentiment dominates discussions.');
    }
    if (breakdown.interestSignalComponent < 0.05) {
      parts.push('Minimal organic interest signals from target audience.');
    }
    if (breakdown.penaltyComponent > 0.1) {
      parts.push('Strong competitor preference suggests market saturation or misalignment.');
    }

    return parts.join(' ');
  }

  /**
   * Generate markdown report
   */
  generateReport(outputPath = 'marketing/validation/DECISION.md'): string {
    const result = this.recommend();
    const date = new Date().toISOString().split('T')[0];

    const report = `# AUTO-CEO Decision Report

**Generated:** ${date}
**Decision:** ${result.decision}
**Confidence:** ${(result.confidence * 100).toFixed(1)}%

---

## Evidence Summary

| Source | Count | Signals | Weight |
|--------|-------|---------|--------|
| Reddit Responses | ${result.evidence.redditResponses} | ${this.data.reddit?.buyingSignals || 0} buying | ${result.evidence.redditResponses > 0 ? 'High (upvotes)' : 'N/A'} |
| Interviews | ${result.evidence.interviewsCompleted} | ${result.evidence.willingnessToPay} willing to pay | ${result.evidence.interviewsCompleted > 0 ? 'Very High (10x)' : 'N/A'} |
| Competitor Mentions | ${result.evidence.competitorMentions} | - | Negative penalty |

**Total Signals:** ${result.evidence.totalSignals}  
**Unique Sources:** ${result.evidence.uniqueUsers}

---

## Confidence Score Breakdown

| Component | Score | Weight | Contribution |
|-----------|-------|--------|--------------|
| Sentiment (Positive %) | ${((result.breakdown.sentimentComponent / this.thresholds.weights.sentiment) * 100).toFixed(0)}% | ${(this.thresholds.weights.sentiment * 100).toFixed(0)}% | ${result.breakdown.sentimentComponent.toFixed(3)} |
| Buying Signals | ${this.data.reddit?.buyingSignals || 0}/${this.data.reddit?.totalResponses || 0} | ${(this.thresholds.weights.buyingSignal * 100).toFixed(0)}% | ${result.breakdown.buyingSignalComponent.toFixed(3)} |
| Willingness to Pay | ${result.evidence.willingnessToPay}/${result.evidence.interviewsCompleted || 1} | ${(this.thresholds.weights.willingnessToPay * 100).toFixed(0)}% | ${result.breakdown.willingnessToPayComponent.toFixed(3)} |
| Interest Signals | ${this.data.reddit?.interestSignals || 0}/${this.data.reddit?.totalResponses || 0} | ${(this.thresholds.weights.interestSignal * 100).toFixed(0)}% | ${result.breakdown.interestSignalComponent.toFixed(3)} |
| **Base Score** | | | **${result.breakdown.baseScore.toFixed(3)}** |
| Competitor Penalty | -${result.breakdown.penaltyComponent.toFixed(3)} | | |
| **Final Confidence** | | | **${result.breakdown.finalScore.toFixed(3)}** |

---

## Recommendation: ${result.decision}

### Rationale

${result.rationale}

### Warnings
${result.warnings.length > 0 ? result.warnings.map((w) => `- ⚠️ ${w}`).join('\n') : '- None'}

---

## Next Steps

${result.nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

---

## Decision History (Trend)

| Date | Decision | Confidence |
|------|----------|------------|
${this.history
  .slice(-5)
  .map((h) => `| ${h.date.split('T')[0]} | ${h.decision} | ${(h.confidence * 100).toFixed(1)}% |`)
  .join('\n')}

---

*This report was generated automatically by AUTO-CEO Decision Engine.*
*Manual review recommended before major strategic decisions.*
`;

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, report);
    return report;
  }

  /**
   * Get decision history
   */
  getHistory(): DecisionHistory[] {
    return [...this.history];
  }

  /**
   * Compare current decision to previous
   */
  getTrend(): 'improving' | 'stable' | 'declining' | 'insufficient' {
    if (this.history.length < 2) {
      return 'insufficient';
    }

    const current = this.history[this.history.length - 1].confidence;
    const previous = this.history[this.history.length - 2].confidence;

    if (current > previous + 0.1) return 'improving';
    if (current < previous - 0.1) return 'declining';
    return 'stable';
  }

  /**
   * Test helper: Inject test data
   */
  injectTestData(data: {
    responses: number;
    positivePct: number;
    buyingSignals: number;
    interviews: number;
    willingToPay: number;
    competitorMentions: number;
  }): void {
    this.data = {
      reddit: {
        sentimentScores: {
          positive: Math.round(data.responses * data.positivePct),
          negative: Math.round(data.responses * (1 - data.positivePct) * 0.5),
          neutral: Math.round(data.responses * (1 - data.positivePct) * 0.5),
        },
        totalResponses: data.responses,
        buyingSignals: data.buyingSignals,
        highUpvoteComments: Math.floor(data.responses * 0.2),
        interestSignals: Math.floor(data.responses * 0.4),
      },
      interviews: {
        totalInterviews: data.interviews,
        completedInterviews: data.interviews,
        willingToPay: data.willingToPay,
        painPoints: [],
        quotes: [],
      },
      competitors: {
        mentions: data.competitorMentions,
        betterAlternativeMentions: Math.floor(data.competitorMentions * 0.5),
        alreadyUsingMentions: Math.floor(data.competitorMentions * 0.5),
      },
    };

    this.collectEvidence(this.data);
  }

  /**
   * Clear all evidence and data
   */
  reset(): void {
    this.evidence = [];
    this.data = {};
  }
}

export default DecisionEngine;
