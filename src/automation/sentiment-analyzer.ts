import * as fs from 'fs';
import * as path from 'path';

interface Lexicon {
  positive: string[];
  negative: string[];
  intensifiers: string[];
  negators: string[];
}

export interface SentimentResult {
  score: number;
  label: 'positive' | 'negative' | 'neutral';
  signals: string[];
}

export interface Comment {
  id?: string;
  text: string;
  author?: string;
  date?: string;
  sentiment?: SentimentResult;
}

export interface SentimentReport {
  totalComments: number;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
  buyingSignals: number;
  featureRequests: number;
  competitorMentions: number;
  topPositive: Comment[];
  topNegative: Comment[];
  interestedUsers: string[];
}

export class SentimentAnalyzer {
  private lexicon: Lexicon;

  constructor(lexiconPath: string = path.join(process.cwd(), 'config', 'sentiment-lexicon.json')) {
    try {
      this.lexicon = JSON.parse(fs.readFileSync(lexiconPath, 'utf-8'));
    } catch (error) {
      console.error('Failed to load lexicon, using empty defaults', error);
      this.lexicon = { positive: [], negative: [], intensifiers: [], negators: [] };
    }
  }

  public analyze(text: string): SentimentResult {
    const tokens = this.tokenize(text);
    let score = 0;
    const signals = this.extractSignals(text);

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      let tokenScore = 0;

      if (this.lexicon.positive.includes(token)) {
        tokenScore = 1;
      } else if (this.lexicon.negative.includes(token)) {
        tokenScore = -1;
      }

      if (tokenScore !== 0) {
        // Negation handling
        if (i > 0 && this.lexicon.negators.includes(tokens[i - 1])) {
          tokenScore *= -1;
        }
        // Intensifier handling
        if (i > 0 && this.lexicon.intensifiers.includes(tokens[i - 1])) {
          tokenScore *= 1.5;
        }
        score += tokenScore;
      }
    }

    // Normalize score between -1 and 1
    const normalizedScore = tokens.length > 0 ? Math.max(-1, Math.min(1, score / (tokens.length * 0.2 || 1))) : 0;

    let label: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (normalizedScore > 0.1) label = 'positive';
    if (normalizedScore < -0.1) label = 'negative';

    return {
      score: Math.round(normalizedScore * 100) / 100,
      label,
      signals
    };
  }

  public analyzeBatch(comments: Comment[]): Comment[] {
    return comments.map(comment => ({
      ...comment,
      sentiment: this.analyze(comment.text)
    }));
  }

  public extractSignals(text: string): string[] {
    const signals: string[] = [];
    const lowerText = text.toLowerCase();

    const patterns = {
      BUYING_SIGNAL: [/would pay/i, /take my money/i, /how much/i, /price/i, /cost/i, /subscription/i],
      COMPETITOR_MENTION: [/already use/i, /switched to/i, /langchain/i, /llamaindex/i, /autogen/i, /crewai/i],
      PAIN_POINT: [/doesn't work/i, /tried and failed/i, /error/i, /bug/i, /frustrating/i, /difficult/i],
      FEATURE_REQUEST: [/can you add/i, /would be nice/i, /should support/i, /feature/i, /missing/i],
      INTEREST_SIGNAL: [/dm me/i, /link\?/i, /where can i try/i, /demo/i, /beta/i]
    };

    for (const [signal, regexes] of Object.entries(patterns)) {
      if (regexes.some(regex => regex.test(lowerText))) {
        signals.push(signal);
      }
    }

    return signals;
  }

  public generateReport(comments: Comment[]): SentimentReport {
    const analyzed = this.analyzeBatch(comments);
    const total = analyzed.length;
    const positive = analyzed.filter(c => c.sentiment?.label === 'positive').length;
    const negative = analyzed.filter(c => c.sentiment?.label === 'negative').length;
    const neutral = total - positive - negative;

    const buyingSignals = analyzed.filter(c => c.sentiment?.signals.includes('BUYING_SIGNAL')).length;
    const featureRequests = analyzed.filter(c => c.sentiment?.signals.includes('FEATURE_REQUEST')).length;
    const competitorMentions = analyzed.filter(c => c.sentiment?.signals.includes('COMPETITOR_MENTION')).length;

    const topPositive = [...analyzed]
      .sort((a, b) => (b.sentiment?.score || 0) - (a.sentiment?.score || 0))
      .slice(0, 5);

    const topNegative = [...analyzed]
      .sort((a, b) => (a.sentiment?.score || 0) - (b.sentiment?.score || 0))
      .slice(0, 5);

    const interestedUsers = analyzed
      .filter(c => c.sentiment?.signals.includes('INTEREST_SIGNAL') || c.sentiment?.signals.includes('BUYING_SIGNAL'))
      .map(c => c.author || 'unknown')
      .filter((v, i, a) => a.indexOf(v) === i);

    const report: SentimentReport = {
      totalComments: total,
      positivePercentage: total > 0 ? (positive / total) * 100 : 0,
      negativePercentage: total > 0 ? (negative / total) * 100 : 0,
      neutralPercentage: total > 0 ? (neutral / total) * 100 : 0,
      buyingSignals,
      featureRequests,
      competitorMentions,
      topPositive,
      topNegative,
      interestedUsers
    };

    this.saveReport(report);
    this.updateResponseTracker(analyzed);

    return report;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 0);
  }

  private saveReport(report: SentimentReport): void {
    const date = new Date().toISOString().split('T')[0];
    const reportPath = path.join(process.cwd(), '.ultra-dex', 'automation', 'sentiment-reports', `${date}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  }

  private updateResponseTracker(comments: Comment[]): void {
    const trackerPath = path.join(process.cwd(), 'marketing', 'validation', 'response-tracker.md');
    if (!fs.existsSync(trackerPath)) return;

    let content = fs.readFileSync(trackerPath, 'utf-8');
    
    // Check if sentiment column already exists in header
    const lines = content.split('\n');
    if (lines.length > 0 && !lines[0].includes('Sentiment')) {
      lines[0] = lines[0].trim() + ' | Sentiment | Signals |';
      if (lines[1]) lines[1] = lines[1].trim() + ' | --- | --- |';
      
      for (let i = 2; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        const commentText = lines[i].split('|')[2]?.trim() || '';
        if (commentText) {
          const sentiment = this.analyze(commentText);
          lines[i] = lines[i].trim() + ` | ${sentiment.label} (${sentiment.score}) | ${sentiment.signals.join(', ')} |`;
        } else {
          lines[i] = lines[i].trim() + ' | | |';
        }
      }
      content = lines.join('\n');
      fs.writeFileSync(trackerPath, content);
    }
  }
}
