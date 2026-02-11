// Copyright (c) 2026 Ultra-Dex

/**
 * AI-Powered Code Review System v6.0
 * Automated intelligent code review with multiple review agents
 */

import EventEmitter from 'events';

/**
 * Review Agent - Specialized reviewer
 */
export class ReviewAgent extends EventEmitter {
  constructor(name, focus) {
    super();
    this.name = name;
    this.focus = focus;
    this.rules = [];
  }

  addRule(pattern, message, severity = 'warning') {
    this.rules.push({ pattern, message, severity });
  }

  async review(code, context = {}) {
    const findings = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const rule of this.rules) {
        if (rule.pattern.test(line)) {
          findings.push({
            line: i + 1,
            column: line.search(rule.pattern),
            message: rule.message,
            severity: rule.severity,
            code: line.trim(),
            agent: this.name,
          });
        }
      }
    }

    return {
      agent: this.name,
      focus: this.focus,
      findings,
      score: this.calculateScore(findings.length, lines.length),
    };
  }

  calculateScore(findings, totalLines) {
    const baseScore = 100;
    const deduction = findings * 5;
    return Math.max(0, baseScore - deduction);
  }
}

/**
 * Multi-Agent Review System
 */
export class CodeReviewSystem extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.initializeAgents();
    this.reviewHistory = [];
  }

  initializeAgents() {
    // Security Agent
    const securityAgent = new ReviewAgent('SecurityGuard', 'security');
    securityAgent.addRule(/eval\s*\(/, 'Avoid using eval() - security risk', 'critical');
    securityAgent.addRule(
      /innerHTML\s*=/,
      'Use textContent instead of innerHTML to prevent XSS',
      'high'
    );
    securityAgent.addRule(
      /document\.write/,
      'document.write can be exploited for XSS attacks',
      'high'
    );
    securityAgent.addRule(
      /password|secret|token|key.*=.*['"][^'"]+['"]/i,
      'Potential hardcoded secret detected',
      'critical'
    );
    this.agents.set('security', securityAgent);

    // Performance Agent
    const performanceAgent = new ReviewAgent('PerfOptimizer', 'performance');
    performanceAgent.addRule(
      /for\s*\(\s*let\s+i\s*=\s*0\s*;\s*i\s*<\s*\w+\.length/i,
      'Cache array.length for better performance',
      'medium'
    );
    performanceAgent.addRule(
      /console\.(log|warn|error)/,
      'Remove console statements in production code',
      'low'
    );
    performanceAgent.addRule(
      /new\s+Array\(\s*\d+\s*\)/,
      'Consider using Array.of() or literal notation',
      'low'
    );
    performanceAgent.addRule(
      /\.forEach\s*\(/,
      'Consider using for...of for better performance in hot paths',
      'info'
    );
    this.agents.set('performance', performanceAgent);

    // Quality Agent
    const qualityGuard = new ReviewAgent('QualityGuard', 'quality');
    qualityGuard.addRule(
      /TO_DO|FIXME|XXX|HACK/,
      'Address TO_DO/FIXME comments before merging',
      'medium'
    );
    qualityAgent.addRule(/var\s+/, 'Use const or let instead of var', 'low');
    qualityAgent.addRule(
      /catch\s*\([^)]*\)\s*\{\s*\}/,
      'Empty catch block - handle the error properly',
      'high'
    );
    qualityAgent.addRule(
      /function\s*\([^)]*\)\s*\{/,
      'Consider using arrow functions for consistency',
      'info'
    );
    this.agents.set('quality', qualityAgent);

    // Best Practices Agent
    const bestPracticesAgent = new ReviewAgent('BestPractice', 'best-practices');
    bestPracticesAgent.addRule(
      /==\s*(null|undefined)/,
      'Use === for strict equality checks',
      'medium'
    );
    bestPracticesAgent.addRule(
      /async\s+function.*\{[^}]*\}$/m,
      'Missing await or return in async function',
      'high'
    );
    bestPracticesAgent.addRule(
      /\.then\s*\([^)]*\)\s*\.then/,
      'Consider using async/await for better readability',
      'info'
    );
    this.agents.set('best-practices', bestPracticesAgent);

    // Accessibility Agent
    const accessibilityAgent = new ReviewAgent('A11yChecker', 'accessibility');
    accessibilityAgent.addRule(
      /<img[^>]*>(?!.*alt=)/,
      'Images must have alt text for accessibility',
      'high'
    );
    accessibilityAgent.addRule(
      /<button[^>]*>(?!.*aria-label)(?!.*aria-labelledby)/,
      'Buttons should have accessible labels',
      'medium'
    );
    accessibilityAgent.addRule(
      /onClick\s*=\s*["'][^"']*["'](?!.*role)/,
      'Interactive elements should have appropriate roles',
      'medium'
    );
    this.agents.set('accessibility', accessibilityAgent);
  }

  async review(code, options = {}) {
    const startTime = Date.now();
    const agentsToRun = options.agents || Array.from(this.agents.keys());

    this.emit('review:start', { agents: agentsToRun });

    const results = await Promise.all(
      agentsToRun.map(async (agentName) => {
        const agent = this.agents.get(agentName);
        if (!agent) return null;

        const result = await agent.review(code, options.context);
        this.emit('agent:complete', { agent: agentName, result });
        return result;
      })
    );

    const validResults = results.filter((r) => r !== null);

    const report = {
      timestamp: Date.now(),
      duration: Date.now() - startTime,
      agents: validResults.map((r) => r.agent),
      findings: validResults.flatMap((r) => r.findings),
      score: this.calculateOverallScore(validResults),
      summary: this.generateSummary(validResults),
      details: validResults,
    };

    this.reviewHistory.push(report);
    this.emit('review:complete', report);

    return report;
  }

  calculateOverallScore(results) {
    if (results.length === 0) return 0;
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    return Math.round(totalScore / results.length);
  }

  generateSummary(results) {
    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
      total: 0,
    };

    for (const result of results) {
      for (const finding of result.findings) {
        summary[finding.severity]++;
        summary.total++;
      }
    }

    return summary;
  }

  getReviewHistory(limit = 10) {
    return this.reviewHistory.slice(-limit);
  }

  getAgent(name) {
    return this.agents.get(name);
  }

  addCustomAgent(name, focus, rules) {
    const agent = new ReviewAgent(name, focus);
    for (const rule of rules) {
      agent.addRule(rule.pattern, rule.message, rule.severity);
    }
    this.agents.set(name.toLowerCase().replace(/\s+/g, '-'), agent);
  }
}

/**
 * Smart Diff Analyzer
 */
export class SmartDiffAnalyzer extends EventEmitter {
  constructor() {
    super();
    this.patterns = new Map();
  }

  analyzeDiff(oldCode, newCode) {
    const oldLines = oldCode.split('\n');
    const newLines = newCode.split('\n');

    const changes = {
      added: [],
      removed: [],
      modified: [],
      stats: {
        linesAdded: 0,
        linesRemoved: 0,
        filesChanged: 1,
      },
    };

    // Simple diff algorithm
    const maxLen = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (oldLine === undefined) {
        changes.added.push({ line: i + 1, code: newLine });
        changes.stats.linesAdded++;
      } else if (newLine === undefined) {
        changes.removed.push({ line: i + 1, code: oldLine });
        changes.stats.linesRemoved++;
      } else if (oldLine !== newLine) {
        changes.modified.push({
          line: i + 1,
          old: oldLine,
          new: newLine,
        });
      }
    }

    // Analyze change impact
    changes.impact = this.assessImpact(changes);
    changes.suggestions = this.generateSuggestions(changes);

    return changes;
  }

  assessImpact(changes) {
    let impact = 'low';

    // Check for API changes
    const hasApiChanges = changes.modified.some(
      (m) => m.old.includes('export') || m.new.includes('export')
    );

    // Check for breaking changes
    const hasBreakingChanges = changes.removed.some(
      (r) => r.code.includes('export') || r.code.includes('class')
    );

    if (hasBreakingChanges) {
      impact = 'breaking';
    } else if (hasApiChanges) {
      impact = 'medium';
    }

    return impact;
  }

  generateSuggestions(changes) {
    const suggestions = [];

    if (changes.stats.linesAdded > changes.stats.linesRemoved * 2) {
      suggestions.push({
        type: 'complexity',
        message: 'Significant code addition - consider breaking into smaller functions',
      });
    }

    if (changes.modified.some((m) => m.new.includes('TO_DO'))) {
      suggestions.push({
        type: 'todo',
        message: 'New TO_DOs added - ensure they are tracked',
      });
    }

    return suggestions;
  }
}

/**
 * Continuous Review Monitor
 */
export class ContinuousReviewMonitor extends EventEmitter {
  constructor(codeReviewSystem) {
    super();
    this.reviewSystem = codeReviewSystem;
    this.watchedFiles = new Map();
    this.thresholds = {
      critical: 0,
      high: 5,
      medium: 10,
      low: 20,
    };
  }

  watchFile(filePath, code) {
    this.watchedFiles.set(filePath, {
      code,
      lastReview: null,
      reviewCount: 0,
    });
  }

  async runReview(filePath) {
    const file = this.watchedFiles.get(filePath);
    if (!file) return null;

    const report = await this.reviewSystem.review(file.code);
    file.lastReview = report;
    file.reviewCount++;

    // Check thresholds
    const summary = report.summary;
    for (const [severity, threshold] of Object.entries(this.thresholds)) {
      if (summary[severity] > threshold) {
        this.emit('threshold:exceeded', {
          file: filePath,
          severity,
          count: summary[severity],
          threshold,
        });
      }
    }

    return report;
  }

  async reviewAll() {
    const results = [];

    for (const [filePath] of this.watchedFiles) {
      const result = await this.runReview(filePath);
      if (result) results.push({ file: filePath, ...result });
    }

    return results;
  }

  getQualityTrend() {
    const history = this.reviewSystem.getReviewHistory(20);

    if (history.length < 2) return null;

    const scores = history.map((h) => h.score);
    const avgFirst = scores.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
    const avgLast = scores.slice(-5).reduce((a, b) => a + b, 0) / 5;

    return {
      direction: avgLast > avgFirst ? 'improving' : avgLast < avgFirst ? 'declining' : 'stable',
      change: avgLast - avgFirst,
      currentAverage: avgLast,
    };
  }
}

export default {
  CodeReviewSystem,
  ReviewAgent,
  SmartDiffAnalyzer,
  ContinuousReviewMonitor,
};
