// Copyright (c) 2026 Ultra-Dex

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  PredictiveDebugger,
  BackgroundLLM,
  BugPrediction,
  CodePattern,
} from '../lib/debugging/predictive.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Predictive Debugging v5.1', () => {
  describe('CodePattern', () => {
    it('should create a code pattern', () => {
      const pattern = new CodePattern('bug-prone', { file: 'test.js', line: 10, column: 5 }, 0.85, {
        issue: 'Test issue',
        message: 'Test message',
      });

      assert.strictEqual(pattern.type, 'bug-prone');
      assert.strictEqual(pattern.location.file, 'test.js');
      assert.strictEqual(pattern.confidence, 0.85);
      assert.strictEqual(pattern.resolved, false);
      assert.ok(pattern.id);
    });

    it('should serialize to JSON', () => {
      const pattern = new CodePattern('security', { file: 'auth.js', line: 20 }, 0.95, {
        issue: 'Hardcoded secret',
      });

      const json = pattern.toJSON();
      assert.strictEqual(json.type, 'security');
      assert.strictEqual(json.confidence, 0.95);
      assert.ok(json.id);
    });
  });

  describe('BugPrediction', () => {
    it('should create a bug prediction', () => {
      const pattern = new CodePattern('bug-prone', { file: 'test.js', line: 10 }, 0.9, {
        issue: 'Empty catch',
      });

      const prediction = new BugPrediction(pattern, 'high', 'Potential bug detected', {
        description: 'Add error handling',
        replacement: 'catch (e) { console.error(e); }',
      });

      assert.strictEqual(prediction.severity, 'high');
      assert.strictEqual(prediction.validated, false);
      assert.ok(prediction.id);
    });
  });

  describe('BackgroundLLM', () => {
    it('should start and stop', async () => {
      const llm = new BackgroundLLM();

      await llm.start();
      assert.strictEqual(llm.isRunning, true);

      await llm.stop();
      assert.strictEqual(llm.isRunning, false);
    });

    it('should analyze code for empty catch blocks', async () => {
      const llm = new BackgroundLLM({ analysisInterval: 1000 });
      await llm.start();

      const code = `
        try {
          doSomething();
        } catch (e) {}
      `;

      const result = await llm.analyze({
        type: 'file',
        filePath: 'test.js',
        content: code,
      });

      const bugPronePatterns = result.patterns.filter((p) => p.type === 'bug-prone');
      assert.strictEqual(bugPronePatterns.length >= 1, true);
      assert.ok(bugPronePatterns.some((p) => p.details.issue === 'Empty catch block'));

      await llm.stop();
    });

    it('should analyze code for console statements', async () => {
      const llm = new BackgroundLLM();
      await llm.start();

      const code = `
        function test() {
          console.log('debug message');
          return true;
        }
      `;

      const result = await llm.analyze({
        type: 'file',
        filePath: 'test.js',
        content: code,
      });

      const maintainabilityPatterns = result.patterns.filter((p) => p.type === 'maintainability');
      assert.ok(
        maintainabilityPatterns.some(
          (p) => p.details.issue === 'Console statement in production code'
        )
      );

      await llm.stop();
    });

    it('should analyze code for hardcoded secrets', async () => {
      const llm = new BackgroundLLM();
      await llm.start();

      const code = `
        const API_KEY = "sk-1234567890abcdef";
        const password = "secret123";
      `;

      const result = await llm.analyze({
        type: 'file',
        filePath: 'test.js',
        content: code,
      });

      const securityPatterns = result.patterns.filter((p) => p.type === 'security');
      assert.ok(securityPatterns.some((p) => p.details.issue === 'Potential hardcoded secret'));

      await llm.stop();
    });

    it('should generate predictions from patterns', async () => {
      const llm = new BackgroundLLM({ confidenceThreshold: 0.7 });
      await llm.start();

      const patterns = [
        new CodePattern('bug-prone', { file: 'test.js', line: 1 }, 0.95, {
          issue: 'Empty catch block',
          message: 'Exceptions are silently ignored',
        }),
        new CodePattern('security', { file: 'auth.js', line: 5 }, 0.9, {
          issue: 'Potential hardcoded secret',
          message: 'Move secrets to environment variables',
        }),
      ];

      const predictions = llm.generatePredictions(patterns);

      assert.strictEqual(predictions.length, 2);
      assert.ok(predictions.some((p) => p.severity === 'critical'));
      assert.ok(predictions.some((p) => p.severity === 'high'));

      await llm.stop();
    });
  });

  describe('PredictiveDebugger', () => {
    it('should create debugger', () => {
      const debugger_ = new PredictiveDebugger();
      assert.strictEqual(debugger_.options.enableBackgroundAnalysis, true);
      assert.strictEqual(debugger_.predictions.size, 0);
    });

    it('should start and stop', async () => {
      const debugger_ = new PredictiveDebugger({ enableBackgroundAnalysis: false });
      const testProject = path.join(__dirname, 'fixtures', 'test-project');

      await debugger_.start(testProject);
      assert.strictEqual(debugger_.isRunning, true);

      await debugger_.stop();
      assert.strictEqual(debugger_.isRunning, false);
    });

    it('should add and retrieve predictions', () => {
      const debugger_ = new PredictiveDebugger();

      const pattern = new CodePattern('bug-prone', { file: 'test.js', line: 1 }, 0.9, {
        issue: 'Test issue',
      });

      const prediction = new BugPrediction(pattern, 'high', 'Test prediction');
      debugger_.addPrediction(prediction);

      assert.strictEqual(debugger_.predictions.size, 1);

      const predictions = debugger_.getPredictions();
      assert.strictEqual(predictions.length, 1);
      assert.strictEqual(predictions[0].severity, 'high');
    });

    it('should filter predictions by severity', () => {
      const debugger_ = new PredictiveDebugger();

      // Add critical prediction
      const pattern1 = new CodePattern('security', { file: 'auth.js', line: 1 }, 0.95, {
        issue: 'Hardcoded secret',
      });
      debugger_.addPrediction(new BugPrediction(pattern1, 'critical', 'Critical issue'));

      // Add low prediction
      const pattern2 = new CodePattern('maintainability', { file: 'utils.js', line: 5 }, 0.8, {
        issue: 'Console log',
      });
      debugger_.addPrediction(new BugPrediction(pattern2, 'low', 'Low priority'));

      const criticalOnly = debugger_.getPredictions({ severity: 'critical' });
      assert.strictEqual(criticalOnly.length, 1);
      assert.strictEqual(criticalOnly[0].severity, 'critical');
    });

    it('should validate predictions', () => {
      const debugger_ = new PredictiveDebugger();

      const pattern = new CodePattern('bug-prone', { file: 'test.js', line: 1 }, 0.9, {
        issue: 'Test',
      });
      const prediction = new BugPrediction(pattern, 'high', 'Test');
      debugger_.addPrediction(prediction);

      debugger_.validatePrediction(prediction.id, true);

      assert.strictEqual(prediction.validated, true);
      assert.strictEqual(prediction.occurred, true);
      assert.strictEqual(debugger_.validatedPredictions.size, 1);
    });

    it('should calculate accuracy stats', () => {
      const debugger_ = new PredictiveDebugger();

      // Add and validate predictions
      const pattern1 = new CodePattern('bug', { file: 'a.js', line: 1 }, 0.9, { issue: 'Bug' });
      const pred1 = new BugPrediction(pattern1, 'high', 'Bug 1');
      debugger_.addPrediction(pred1);
      debugger_.validatePrediction(pred1.id, true); // True positive

      const pattern2 = new CodePattern('bug', { file: 'b.js', line: 1 }, 0.8, { issue: 'Bug' });
      const pred2 = new BugPrediction(pattern2, 'high', 'Bug 2');
      debugger_.addPrediction(pred2);
      debugger_.validatePrediction(pred2.id, false); // False positive

      const stats = debugger_.getAccuracyStats();
      assert.strictEqual(stats.total, 2);
      assert.strictEqual(stats.accuracy, 50); // 1 true positive out of 2
      assert.strictEqual(stats.truePositives, 1);
      assert.strictEqual(stats.falsePositives, 1);
    });

    it('should export report', () => {
      const debugger_ = new PredictiveDebugger();
      debugger_.projectPath = '/test/project';

      // Add some predictions
      const pattern1 = new CodePattern('critical', { file: 'a.js', line: 1 }, 0.95, {
        issue: 'Critical',
      });
      debugger_.addPrediction(new BugPrediction(pattern1, 'critical', 'Critical bug'));

      const pattern2 = new CodePattern('high', { file: 'b.js', line: 2 }, 0.85, { issue: 'High' });
      debugger_.addPrediction(new BugPrediction(pattern2, 'high', 'High bug'));

      const report = debugger_.exportReport();

      assert.ok(report.generatedAt);
      assert.strictEqual(report.projectPath, '/test/project');
      assert.strictEqual(report.summary.totalPredictions, 2);
      assert.strictEqual(report.summary.bySeverity.critical, 1);
      assert.strictEqual(report.summary.bySeverity.high, 1);
      assert.strictEqual(report.predictions.length, 2);
    });
  });
});
