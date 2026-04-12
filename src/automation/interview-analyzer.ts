/**
 * Interview Analyzer - Extracts structured insights from interview transcripts
 * Pattern detection, cross-interview synthesis, actionable recommendations
 */

import fs from 'fs';
import path from 'path';

export interface TranscriptQAPair {
  question: string;
  answer: string;
}

export interface InterviewInsights {
  painPoints: string[];
  currentTools: string[];
  willingToPay: { amount: number; frequency: string; confidence: 'high' | 'medium' | 'low' } | null;
  featureRequests: string[];
  objections: string[];
  quotableLines: string[];
  decisionDrivers: string[];
  switchTriggers: string[];
  useCases: string[];
}

export interface InterviewSynthesis {
  totalInterviews: number;
  commonPainPoints: Array<{ text: string; frequency: number; examples: string[] }>;
  commonFeatureRequests: Array<{ text: string; frequency: number; examples: string[] }>;
  priceRange: { min: number; max: number; median: number };
  consensusAreas: string[];
  disagreements: string[];
  recommendedFeatures: Array<{
    feature: string;
    priority: 'high' | 'medium' | 'low';
    evidence: string;
  }>;
  recommendedPricing: { range: string; model: string; confidence: 'high' | 'medium' | 'low' };
  keyQuotes: string[];
  executiveSummary: string;
}

export interface ExtractionRule {
  pattern: RegExp;
  category: 'pain_point' | 'price' | 'feature' | 'objection' | 'tool' | 'quote' | 'switch_trigger';
  weight: number;
  extract: (match: RegExpMatchArray) => string;
}

export interface AnalysisConfig {
  minConsensusCount: number;
  priceConfidenceThreshold: number;
  quoteMinLength: number;
  similarityThreshold: number;
}

const DEFAULT_CONFIG: AnalysisConfig = {
  minConsensusCount: 3,
  priceConfidenceThreshold: 0.7,
  quoteMinLength: 40,
  similarityThreshold: 0.6,
};

const EXTRACTION_RULES: ExtractionRule[] = [
  // Pain points
  {
    pattern:
      /(?:frustrated|annoying|hate|waste|pain|struggle|difficult|hard to|impossible to|can't stand) (.+?)[.!?]/gi,
    category: 'pain_point',
    weight: 1,
    extract: (m) => m[1].trim(),
  },
  {
    pattern: /(?:biggest|main|major) (?:problem|issue|challenge|pain) (?:is|was) (.+?)[.!?]/gi,
    category: 'pain_point',
    weight: 1.5,
    extract: (m) => m[1].trim(),
  },
  // Price signals
  {
    pattern: /(?:\$|USD|dollars?)?\s*([0-9]+)\s*(?:\/|per|a|monthly|month)?/gi,
    category: 'price',
    weight: 1,
    extract: (m) => m[1].trim(),
  },
  {
    pattern: /(?:would pay|pay up to|budget|around|about) \$?([0-9]+)/gi,
    category: 'price',
    weight: 1.5,
    extract: (m) => m[1].trim(),
  },
  // Feature requests
  {
    pattern: /(?:wish|would be nice|should|could|add|feature) (.+?)[.!?]/gi,
    category: 'feature',
    weight: 1,
    extract: (m) => m[1].trim(),
  },
  {
    pattern: /(?:if you|if it|need) (?:could|had|supported|integrated) (.+?)[.!?]/gi,
    category: 'feature',
    weight: 1.2,
    extract: (m) => m[1].trim(),
  },
  // Objections
  {
    pattern:
      /(?:already use|using|stuck with|too expensive|don't need|not worth|pass) (.+?)[.!?]/gi,
    category: 'objection',
    weight: 1,
    extract: (m) => m[1].trim(),
  },
  // Tools
  {
    pattern:
      /(?:use|using|tried|switched from|coming from|migrating from) ([A-Za-z0-9\s]+?)(?:,|\.|\s+for|\s+and)/gi,
    category: 'tool',
    weight: 1,
    extract: (m) => m[1].trim(),
  },
  // Switch triggers
  {
    pattern: /(?:if|when) (.+?) (?:would|will|might|probably) (?:switch|move|migrate|change)/gi,
    category: 'switch_trigger',
    weight: 1.3,
    extract: (m) => m[1].trim(),
  },
  {
    pattern: /(?:only reason|main reason|why I|what would make me) (.+?)[.!?]/gi,
    category: 'switch_trigger',
    weight: 1.5,
    extract: (m) => m[1].trim(),
  },
];

export class InterviewAnalyzer {
  private config: AnalysisConfig;
  private insights: Map<string, InterviewInsights> = new Map();

  constructor(config?: Partial<AnalysisConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Parse a transcript into Q&A pairs
   */
  parseTranscript(transcript: string): TranscriptQAPair[] {
    const pairs: TranscriptQAPair[] = [];
    const lines = transcript
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    let currentQuestion = '';
    let currentAnswer = '';

    for (const line of lines) {
      // Match "Q: " or "Question: " or interviewer format
      if (/^(Q:|Question:|Interviewer:|INTERVIEWER:|\[Interviewer\])/i.test(line)) {
        // Save previous Q&A if exists
        if (currentQuestion && currentAnswer) {
          pairs.push({
            question: currentQuestion.replace(/^Q:\s*/i, '').replace(/^Question:\s*/i, ''),
            answer: currentAnswer.trim(),
          });
        }
        currentQuestion = line.replace(/^Q:\s*/i, '').replace(/^Question:\s*/i, '');
        currentAnswer = '';
      }
      // Match "A: " or "Answer: " or respondent format
      else if (
        /^(A:|Answer:|Interviewee:|INTERVIEWEE:|User:|Respondent:)/i.test(line) ||
        currentQuestion
      ) {
        const answer = line.replace(/^A:\s*/i, '').replace(/^Answer:\s*/i, '');
        if (currentAnswer) {
          currentAnswer += ' ' + answer;
        } else {
          currentAnswer = answer;
        }
      }
    }

    // Don't forget the last pair
    if (currentQuestion && currentAnswer) {
      pairs.push({
        question: currentQuestion,
        answer: currentAnswer.trim(),
      });
    }

    // Fallback: if no Q:A format detected, treat whole thing as one answer
    if (pairs.length === 0 && transcript.trim()) {
      pairs.push({ question: 'General', answer: transcript.trim() });
    }

    return pairs;
  }

  /**
   * Extract insights from a single interview
   */
  extractInsights(qaPairs: TranscriptQAPair[]): InterviewInsights {
    const fullText = qaPairs.map((p) => p.answer).join(' ');
    const insights: InterviewInsights = {
      painPoints: [],
      currentTools: [],
      willingToPay: null,
      featureRequests: [],
      objections: [],
      quotableLines: [],
      decisionDrivers: [],
      switchTriggers: [],
      useCases: [],
    };

    // Extract using regex patterns
    for (const rule of EXTRACTION_RULES) {
      const matches = fullText.matchAll(rule.pattern);
      for (const match of matches) {
        const extracted = rule.extract(match);
        if (!extracted || extracted.length < 3) continue;

        switch (rule.category) {
          case 'pain_point':
            insights.painPoints.push(this.cleanExtract(extracted));
            break;
          case 'price':
            const amount = parseInt(extracted, 10);
            if (amount > 0 && amount < 10000) {
              insights.willingToPay = {
                amount,
                frequency: fullText.toLowerCase().includes('year') ? 'yearly' : 'monthly',
                confidence: rule.weight > 1.2 ? 'high' : 'medium',
              };
            }
            break;
          case 'feature':
            insights.featureRequests.push(this.cleanExtract(extracted));
            break;
          case 'objection':
            insights.objections.push(this.cleanExtract(extracted));
            break;
          case 'tool':
            if (!['i', 'we', 'they'].includes(extracted.toLowerCase())) {
              insights.currentTools.push(this.cleanExtract(extracted));
            }
            break;
          case 'switch_trigger':
            insights.switchTriggers.push(this.cleanExtract(extracted));
            break;
        }
      }
    }

    // Extract quotable lines (passionate, specific, non-generic)
    const sentences = fullText
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= this.config.quoteMinLength);
    for (const sentence of sentences) {
      // Skip generic responses
      if (this.isGenericResponse(sentence)) continue;

      // Look for emotional language or specific numbers
      if (/(?:love|hate|perfect|exactly|finally|never|always|\d+%|\$\d+)/i.test(sentence)) {
        insights.quotableLines.push(sentence.slice(0, 200));
      }
    }

    // Deduplicate
    insights.painPoints = [...new Set(insights.painPoints)].slice(0, 10);
    insights.featureRequests = [...new Set(insights.featureRequests)].slice(0, 10);
    insights.quotableLines = [...new Set(insights.quotableLines)].slice(0, 5);

    return insights;
  }

  private cleanExtract(text: string): string {
    return text
      .replace(/^\s+/, '')
      .replace(/\s+$/, '')
      .replace(/\s+/g, ' ')
      .replace(/^(it|that|this|which)\s+/i, '')
      .slice(0, 100);
  }

  private isGenericResponse(text: string): boolean {
    const genericPatterns = [
      /^(it's|its)\s+(fine|okay|good|nice)/i,
      /^i\s+(think|guess|suppose)\s+it's/i,
      /^not\s+(sure|really)/i,
      /^maybe\s/i,
    ];
    return genericPatterns.some((p) => p.test(text));
  }

  /**
   * Compare multiple interviews to find patterns
   */
  compareInterviews(insights: InterviewInsights[]): InterviewSynthesis {
    const synthesis: InterviewSynthesis = {
      totalInterviews: insights.length,
      commonPainPoints: [],
      commonFeatureRequests: [],
      priceRange: { min: 0, max: 0, median: 0 },
      consensusAreas: [],
      disagreements: [],
      recommendedFeatures: [],
      recommendedPricing: { range: '', model: '', confidence: 'low' },
      keyQuotes: [],
      executiveSummary: '',
    };

    // Aggregate pain points
    const painPointFreq = this.aggregateWithSimilarity(insights.map((i) => i.painPoints));
    synthesis.commonPainPoints = Object.entries(painPointFreq)
      .map(([text, { count, examples }]) => ({ text, frequency: count, examples }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    // Aggregate feature requests
    const featureFreq = this.aggregateWithSimilarity(insights.map((i) => i.featureRequests));
    synthesis.commonFeatureRequests = Object.entries(featureFreq)
      .map(([text, { count, examples }]) => ({ text, frequency: count, examples }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    // Calculate price range
    const prices = insights
      .map((i) => i.willingToPay?.amount)
      .filter((p): p is number => p !== undefined && p > 0);

    if (prices.length > 0) {
      synthesis.priceRange.min = Math.min(...prices);
      synthesis.priceRange.max = Math.max(...prices);
      synthesis.priceRange.median = this.calculateMedian(prices);

      synthesis.recommendedPricing = {
        range: `$${synthesis.priceRange.min}-$${synthesis.priceRange.max}`,
        model: prices.length > 3 ? 'monthly subscription' : 'usage-based',
        confidence: prices.length >= 5 ? 'high' : prices.length >= 3 ? 'medium' : 'low',
      };
    }

    // Find consensus areas
    const allPainPoints = synthesis.commonPainPoints.filter(
      (p) => p.frequency >= this.config.minConsensusCount
    );
    const allFeatures = synthesis.commonFeatureRequests.filter(
      (f) => f.frequency >= this.config.minConsensusCount
    );

    if (allPainPoints.length > 0) {
      synthesis.consensusAreas.push(
        `Pain points: ${allPainPoints
          .map((p) => p.text)
          .join(', ')
          .slice(0, 100)}...`
      );
    }
    if (allFeatures.length > 0) {
      synthesis.consensusAreas.push(
        `Features: ${allFeatures
          .map((f) => f.text)
          .join(', ')
          .slice(0, 100)}...`
      );
    }

    // Generate recommended features
    synthesis.recommendedFeatures = synthesis.commonFeatureRequests
      .map((f) => ({
        feature: f.text,
        priority: (f.frequency >= 5 ? 'high' : f.frequency >= 3 ? 'medium' : 'low') as
          | 'high'
          | 'medium'
          | 'low',
        evidence: `${f.frequency} interviews mentioned: "${f.examples[0]}"`,
      }))
      .slice(0, 10);

    // Collect key quotes
    synthesis.keyQuotes = insights
      .flatMap((i) => i.quotableLines)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 10);

    // Generate executive summary
    synthesis.executiveSummary = this.generateExecutiveSummary(synthesis);

    return synthesis;
  }

  private aggregateWithSimilarity(
    arrays: string[][]
  ): Record<string, { count: number; examples: string[] }> {
    const result: Record<string, { count: number; examples: string[] }> = {};
    const allItems = arrays.flat();

    for (const item of allItems) {
      const normalized = item.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      let found = false;

      for (const [key, data] of Object.entries(result)) {
        const keyNormalized = key.toLowerCase().replace(/[^a-z0-9\s]/g, '');
        const similarity = this.calculateSimilarity(normalized, keyNormalized);
        if (similarity >= this.config.similarityThreshold) {
          data.count++;
          if (data.examples.length < 3 && !data.examples.includes(item)) {
            data.examples.push(item);
          }
          found = true;
          break;
        }
      }

      if (!found) {
        result[item] = { count: 1, examples: [item] };
      }
    }

    return result;
  }

  private calculateSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.split(/\s+/));
    const wordsB = new Set(b.split(/\s+/));
    const intersection = [...wordsA].filter((w) => wordsB.has(w));
    const union = new Set([...wordsA, ...wordsB]);
    return intersection.length / union.size;
  }

  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private generateExecutiveSummary(synthesis: InterviewSynthesis): string {
    const parts: string[] = [];

    parts.push(`Analysis of ${synthesis.totalInterviews} user interviews.`);

    if (synthesis.commonPainPoints.length > 0) {
      const topPain = synthesis.commonPainPoints[0];
      parts.push(
        `Top pain point (${topPain.frequency}/${synthesis.totalInterviews}): "${topPain.text}"`
      );
    }

    if (synthesis.recommendedPricing.confidence !== 'low') {
      parts.push(`Pricing comfort: ${synthesis.recommendedPricing.range}/month.`);
    }

    if (synthesis.commonFeatureRequests.length > 0) {
      const topFeature = synthesis.commonFeatureRequests[0];
      parts.push(`Most requested: "${topFeature.text}" (${topFeature.frequency} mentions).`);
    }

    return parts.join(' ');
  }

  /**
   * Generate synthesis markdown report
   */
  generateSynthesis(synthesis: InterviewSynthesis, outputPath?: string): string {
    const date = new Date().toISOString().split('T')[0];

    const report = `# Interview Analysis Synthesis

**Generated:** ${date}  
**Total Interviews:** ${synthesis.totalInterviews}

---

## Executive Summary

${synthesis.executiveSummary}

---

## Common Pain Points

| Rank | Pain Point | Frequency | Examples |
|------|-----------|-----------|----------|
${synthesis.commonPainPoints.map((p, i) => `| ${i + 1} | ${p.text} | ${p.frequency}/${synthesis.totalInterviews} | ${p.examples.slice(0, 2).join('; ').slice(0, 50)}... |`).join('\n')}

---

## Feature Requests (Prioritized)

| Priority | Feature | Evidence |
|----------|---------|----------|
${synthesis.recommendedFeatures.map((f) => `| ${f.priority.toUpperCase()} | ${f.feature} | ${f.evidence.slice(0, 60)}... |`).join('\n')}

---

## Pricing Insights

**Recommended Range:** ${synthesis.recommendedPricing.range}/month  
**Model:** ${synthesis.recommendedPricing.model}  
**Confidence:** ${synthesis.recommendedPricing.confidence}

---

## Consensus Areas

${synthesis.consensusAreas.map((c) => `- ${c}`).join('\n') || '- No strong consensus detected'}

---

## Key Quotes

${synthesis.keyQuotes.map((q, i) => `${i + 1}. "${q}"`).join('\n\n')}

---

## Recommended Next Steps

1. **Build first:** ${synthesis.recommendedFeatures[0]?.feature || 'Address top pain point'}
2. **Pricing:** Test at ${synthesis.priceRange.median > 0 ? `$${synthesis.priceRange.median}` : 'market rate'}/month
3. **Messaging:** Focus on "${synthesis.commonPainPoints[0]?.text.slice(0, 50) || 'user pain points'}..."
4. **Validate:** Run 3 more interviews specifically on pricing

---

*Generated by AUTO-CEO Interview Analyzer*
`;

    if (outputPath) {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(outputPath, report);
    }

    return report;
  }

  /**
   * Load and analyze a transcript file
   */
  analyzeTranscriptFile(filePath: string): InterviewInsights {
    const content = fs.readFileSync(filePath, 'utf-8');
    const qaPairs = this.parseTranscript(content);
    return this.extractInsights(qaPairs);
  }

  /**
   * Batch analyze all transcripts in a directory
   */
  analyzeDirectory(dirPath: string): InterviewSynthesis {
    const insights: InterviewInsights[] = [];
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.md') || f.endsWith('.txt'));

    for (const file of files) {
      try {
        const filePath = path.join(dirPath, file);
        const insight = this.analyzeTranscriptFile(filePath);
        insights.push(insight);
      } catch {}
    }

    return this.compareInterviews(insights);
  }
}

export default InterviewAnalyzer;
