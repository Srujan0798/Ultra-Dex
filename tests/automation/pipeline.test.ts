import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { SentimentAnalyzer } from '../../src/automation/sentiment-analyzer';
import { OutreachManager } from '../../src/automation/outreach-manager';
import { DecisionEngine } from '../../src/automation/decision-engine';

describe('AUTO-CEO Pipeline', () => {
  test('Full Pipeline: from raw comments to decision and outreach', async () => {
    // 1. Setup mock data
    const mockComments = [
      { author: 'user1', text: 'This is amazing! Exactly what I need. Take my money.' },
      { author: 'user2', text: 'Another wrapper, but maybe useful if it has X.' },
      { author: 'user3', text: 'I already use LangChain, why would I switch?' },
      { author: 'user4', text: 'How much does this cost? I want to try the beta.' },
      { author: 'user5', text: 'Finally a tool that solves the boring parts. DM me!' }
    ];

    // 2. Run Sentiment Analyzer
    const sa = new SentimentAnalyzer();
    const analyzedComments = sa.analyzeBatch(mockComments.map(c => ({ ...c })));
    const report = sa.generateReport(analyzedComments);

    assert.strictEqual(report.totalComments, 5);
    assert.ok(report.buyingSignals >= 1);

    // 3. Run Outreach Manager
    const om = new OutreachManager();
    const leads = om.identifyLeads(report);
    
    assert.ok(leads.length >= 2); // user1 and user5 should be leads
    const draft = om.generateDraft(leads[0]);
    assert.ok(draft.includes(leads[0].author!));

    // 4. Run Decision Engine
    const de = new DecisionEngine();
    de.collectEvidence({
      reddit: {
        sentimentScores: {
          positive: analyzedComments.filter(c => c.sentiment?.label === 'positive').length,
          negative: analyzedComments.filter(c => c.sentiment?.label === 'negative').length,
          neutral: analyzedComments.filter(c => c.sentiment?.label === 'neutral').length,
        },
        totalResponses: analyzedComments.length,
        buyingSignals: report.buyingSignals,
        highUpvoteComments: 0,
        interestSignals: report.interestedUsers.length,
      }
    });

    const result = de.recommend();
    assert.ok(['CONTINUE', 'PIVOT', 'INSUFFICIENT_DATA'].includes(result.decision));
    
    // Verify report generation
    const reportContent = de.generateReport(path.join('.ultra-dex', 'test-DECISION.md'));
    assert.ok(fs.existsSync(path.join('.ultra-dex', 'test-DECISION.md')));
    assert.ok(reportContent.includes(result.decision));
  });

  test('Edge Case: Zero responses', () => {
    const de = new DecisionEngine();
    de.collectEvidence({
      reddit: {
        sentimentScores: { positive: 0, negative: 0, neutral: 0 },
        totalResponses: 0,
        buyingSignals: 0,
        highUpvoteComments: 0,
        interestSignals: 0
      }
    });

    const result = de.recommend();
    assert.strictEqual(result.decision, 'INSUFFICIENT_DATA');
  });

  test('Edge Case: All negative', () => {
    const mockComments = [
      { author: 'hater1', text: 'This sucks, waste of time.' },
      { author: 'hater2', text: 'Already exists and it is better.' },
      { author: 'hater3', text: 'Terrible implementation, slow.' },
      { author: 'hater4', text: 'Useless garbage.' },
      { author: 'hater5', text: 'Another unnecessary wrapper.' }
    ];

    const sa = new SentimentAnalyzer();
    const analyzed = sa.analyzeBatch(mockComments.map(c => ({ ...c })));
    const report = sa.generateReport(analyzed);

    const de = new DecisionEngine();
    de.collectEvidence({
      reddit: {
        sentimentScores: {
          positive: analyzed.filter(c => c.sentiment?.label === 'positive').length,
          negative: analyzed.filter(c => c.sentiment?.label === 'negative').length,
          neutral: analyzed.filter(c => c.sentiment?.label === 'neutral').length,
        },
        totalResponses: analyzed.length,
        buyingSignals: report.buyingSignals,
        highUpvoteComments: 0,
        interestSignals: 0,
      }
    });

    const result = de.recommend();
    assert.strictEqual(result.decision, 'STOP');
  });
});
