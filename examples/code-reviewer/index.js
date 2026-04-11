#!/usr/bin/env node

/**
 * Ultra-Dex Code Reviewer
 *
 * This example demonstrates how to create an AI-powered code review system using Ultra-Dex.
 * The system can automatically review code for quality, security, and best practices.
 *
 * Features:
 * - Automated code quality assessment
 * - Security vulnerability detection
 * - Best practice enforcement
 * - Style guide compliance
 * - Performance optimization suggestions
 */

import { UltraDex } from '@ultra-dex/sdk';
import fs from 'fs/promises';
import path from 'path';

class CodeReviewer {
  constructor(config) {
    this.ultraDex = new UltraDex(config.ultraDex);

    // Initialize specialized agents
    this.agents = {
      qualityAssessor: this.ultraDex.createAgent({
        name: 'quality-assessor',
        role: 'Assesses code quality, complexity, and maintainability',
        tools: [
          'complexity-analyzer',
          'maintainability-checker',
          'duplication-detector',
          'readability-assessor',
        ],
      }),

      securityScanner: this.ultraDex.createAgent({
        name: 'security-scanner',
        role: 'Scans code for security vulnerabilities and risks',
        tools: [
          'vulnerability-detector',
          'injection-checker',
          'auth-checker',
          'data-leakage-preventer',
        ],
      }),

      bestPracticeEnforcer: this.ultraDex.createAgent({
        name: 'best-practice-enforcer',
        role: 'Ensures code follows best practices and design patterns',
        tools: [
          'pattern-analyzer',
          'anti-pattern-detector',
          'design-principle-checker',
          'architecture-reviewer',
        ],
      }),

      styleChecker: this.ultraDex.createAgent({
        name: 'style-checker',
        role: 'Ensures code follows style guides and formatting standards',
        tools: [
          'formatter',
          'naming-convention-checker',
          'comment-analyzer',
          'documentation-checker',
        ],
      }),

      performanceOptimizer: this.ultraDex.createAgent({
        name: 'performance-optimizer',
        role: 'Identifies performance bottlenecks and optimization opportunities',
        tools: [
          'bottleneck-detector',
          'algorithm-analyzer',
          'memory-usage-checker',
          'efficiency-suggester',
        ],
      }),
    };

    this.reviewHistory = [];
    this.codeStandards = config.codeStandards || {};
    this.securityRules = config.securityRules || {};
    this.performanceThresholds = config.performanceThresholds || {};
  }

  /**
   * Review code file
   */
  async reviewCode(filePath, options = {}) {
    const reviewId = `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Read code file
      const code = await fs.readFile(filePath, 'utf8');

      // Analyze code with multiple agents
      const qualityResult = await this.agents.qualityAssessor.execute({
        code,
        language: this.detectLanguage(filePath),
        filePath,
        standards: this.codeStandards.quality || {},
        threshold: options.qualityThreshold || 80,
      });

      const securityResult = await this.agents.securityScanner.execute({
        code,
        language: this.detectLanguage(filePath),
        filePath,
        rules: this.securityRules,
        severityThreshold: options.securitySeverity || 'medium',
      });

      const bestPracticeResult = await this.agents.bestPracticeEnforcer.execute({
        code,
        language: this.detectLanguage(filePath),
        filePath,
        standards: this.codeStandards.practices || {},
        patterns: options.allowedPatterns || [],
      });

      const styleResult = await this.agents.styleChecker.execute({
        code,
        language: this.detectLanguage(filePath),
        filePath,
        styleGuide: this.codeStandards.style || {},
        strictness: options.styleStrictness || 'medium',
      });

      const performanceResult = await this.agents.performanceOptimizer.execute({
        code,
        language: this.detectLanguage(filePath),
        filePath,
        thresholds: this.performanceThresholds,
        optimizationTargets: options.optimizationTargets || ['speed', 'memory'],
      });

      // Aggregate results
      const review = {
        id: reviewId,
        filePath,
        language: this.detectLanguage(filePath),
        completedAt: new Date().toISOString(),
        results: {
          quality: qualityResult,
          security: securityResult,
          bestPractices: bestPracticeResult,
          style: styleResult,
          performance: performanceResult,
        },
        summary: this.generateSummary({
          quality: qualityResult,
          security: securityResult,
          bestPractices: bestPracticeResult,
          style: styleResult,
          performance: performanceResult,
        }),
        metadata: {
          linesOfCode: code.split('\n').length,
          fileSize: Buffer.byteLength(code),
          reviewOptions: options,
        },
      };

      this.reviewHistory.push(review);
      return review;
    } catch (error) {
      console.error('Error reviewing code:', error);
      throw error;
    }
  }

  /**
   * Review code patch/diff
   */
  async reviewDiff(diffContent, options = {}) {
    const reviewId = `diff-review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Analyze diff with multiple agents
      const qualityResult = await this.agents.qualityAssessor.execute({
        diff: diffContent,
        type: 'diff',
        standards: this.codeStandards.quality || {},
        threshold: options.qualityThreshold || 80,
      });

      const securityResult = await this.agents.securityScanner.execute({
        diff: diffContent,
        type: 'diff',
        rules: this.securityRules,
        severityThreshold: options.securitySeverity || 'medium',
      });

      const bestPracticeResult = await this.agents.bestPracticeEnforcer.execute({
        diff: diffContent,
        type: 'diff',
        standards: this.codeStandards.practices || {},
        patterns: options.allowedPatterns || [],
      });

      const styleResult = await this.agents.styleChecker.execute({
        diff: diffContent,
        type: 'diff',
        styleGuide: this.codeStandards.style || {},
        strictness: options.styleStrictness || 'medium',
      });

      const performanceResult = await this.agents.performanceOptimizer.execute({
        diff: diffContent,
        type: 'diff',
        thresholds: this.performanceThresholds,
        optimizationTargets: options.optimizationTargets || ['speed', 'memory'],
      });

      // Aggregate results
      const review = {
        id: reviewId,
        type: 'diff',
        diffContent,
        completedAt: new Date().toISOString(),
        results: {
          quality: qualityResult,
          security: securityResult,
          bestPractices: bestPracticeResult,
          style: styleResult,
          performance: performanceResult,
        },
        summary: this.generateSummary({
          quality: qualityResult,
          security: securityResult,
          bestPractices: bestPracticeResult,
          style: styleResult,
          performance: performanceResult,
        }),
        metadata: {
          addedLines: this.countAddedLines(diffContent),
          removedLines: this.countRemovedLines(diffContent),
          reviewOptions: options,
        },
      };

      this.reviewHistory.push(review);
      return review;
    } catch (error) {
      console.error('Error reviewing diff:', error);
      throw error;
    }
  }

  /**
   * Generate review summary
   */
  generateSummary(results) {
    const issues = [];

    // Collect issues from all categories
    if (results.quality.issues && results.quality.issues.length > 0) {
      issues.push(...results.quality.issues.map((issue) => ({ ...issue, category: 'quality' })));
    }

    if (results.security.issues && results.security.issues.length > 0) {
      issues.push(...results.security.issues.map((issue) => ({ ...issue, category: 'security' })));
    }

    if (results.bestPractices.issues && results.bestPractices.issues.length > 0) {
      issues.push(
        ...results.bestPractices.issues.map((issue) => ({ ...issue, category: 'best-practices' }))
      );
    }

    if (results.style.issues && results.style.issues.length > 0) {
      issues.push(...results.style.issues.map((issue) => ({ ...issue, category: 'style' })));
    }

    if (results.performance.issues && results.performance.issues.length > 0) {
      issues.push(
        ...results.performance.issues.map((issue) => ({ ...issue, category: 'performance' }))
      );
    }

    // Calculate overall score
    const totalIssues = issues.length;
    const criticalIssues = issues.filter((i) => i.severity === 'critical').length;
    const highIssues = issues.filter((i) => i.severity === 'high').length;
    const mediumIssues = issues.filter((i) => i.severity === 'medium').length;
    const lowIssues = issues.filter((i) => i.severity === 'low').length;

    const score = Math.max(
      0,
      100 - (criticalIssues * 25 + highIssues * 10 + mediumIssues * 5 + lowIssues * 1)
    );

    return {
      overallScore: Math.round(score),
      totalIssues,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      issues,
      recommendation: this.getRecommendation(score, criticalIssues, highIssues),
    };
  }

  /**
   * Get recommendation based on score
   */
  getRecommendation(score, critical, high) {
    if (critical > 0) return 'REJECT - Critical security or correctness issues found';
    if (high > 2) return 'REQUEST_CHANGES - Too many high severity issues';
    if (score < 70) return 'REQUEST_CHANGES - Code quality needs improvement';
    if (score < 85) return 'COMMENT - Several issues need attention';
    if (score < 95) return 'APPROVE_CONDITIONALLY - Minor issues but generally good';
    return 'APPROVE - Code meets all standards';
  }

  /**
   * Detect programming language from file extension
   */
  detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.jsx': 'javascript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
      '.cpp': 'c++',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.scala': 'scala',
      '.sql': 'sql',
      '.html': 'html',
      '.css': 'css',
      '.vue': 'vue',
      '.svelte': 'svelte',
    };

    return languageMap[ext] || 'unknown';
  }

  /**
   * Count added lines in diff
   */
  countAddedLines(diffContent) {
    return diffContent.split('\n').filter((line) => line.startsWith('+')).length;
  }

  /**
   * Count removed lines in diff
   */
  countRemovedLines(diffContent) {
    return diffContent.split('\n').filter((line) => line.startsWith('-')).length;
  }

  /**
   * Batch review multiple files
   */
  async batchReview(filePaths, options = {}) {
    const results = {
      reviews: [],
      summary: {
        totalFiles: filePaths.length,
        completed: 0,
        failed: 0,
        averageScore: 0,
        criticalIssues: 0,
        highIssues: 0,
      },
    };

    let totalScore = 0;

    for (const filePath of filePaths) {
      try {
        const review = await this.reviewCode(filePath, options);
        results.reviews.push(review);
        results.summary.completed++;

        totalScore += review.summary.overallScore;
        results.summary.criticalIssues += review.summary.criticalIssues;
        results.summary.highIssues += review.summary.highIssues;
      } catch (error) {
        results.summary.failed++;
        console.error(`Failed to review ${filePath}:`, error.message);
      }
    }

    results.summary.averageScore =
      results.summary.completed > 0 ? Math.round(totalScore / results.summary.completed) : 0;

    return results;
  }

  /**
   * Get review statistics
   */
  getStats() {
    const totalReviews = this.reviewHistory.length;
    const totalIssues = this.reviewHistory.reduce(
      (sum, review) => sum + review.summary.totalIssues,
      0
    );
    const criticalIssues = this.reviewHistory.reduce(
      (sum, review) => sum + review.summary.criticalIssues,
      0
    );
    const averageScore =
      totalReviews > 0
        ? Math.round(
            this.reviewHistory.reduce((sum, review) => sum + review.summary.overallScore, 0) /
              totalReviews
          )
        : 0;

    const byLanguage = this.reviewHistory.reduce((acc, review) => {
      const lang = review.language || 'unknown';
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {});

    const byRecommendation = this.reviewHistory.reduce((acc, review) => {
      const rec = review.summary.recommendation.split(' - ')[0]; // Get just the action part
      acc[rec] = (acc[rec] || 0) + 1;
      return acc;
    }, {});

    return {
      totalReviews,
      totalIssues,
      criticalIssues,
      averageScore,
      byLanguage,
      byRecommendation,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Update code standards
   */
  updateCodeStandards(standards) {
    this.codeStandards = { ...this.codeStandards, ...standards };
  }

  /**
   * Update security rules
   */
  updateSecurityRules(rules) {
    this.securityRules = { ...this.securityRules, ...rules };
  }

  /**
   * Update performance thresholds
   */
  updatePerformanceThresholds(thresholds) {
    this.performanceThresholds = { ...this.performanceThresholds, ...thresholds };
  }

  /**
   * Export review results
   */
  async exportResults(format = 'json', outputPath) {
    const results = {
      reviews: this.reviewHistory,
      stats: this.getStats(),
      exportedAt: new Date().toISOString(),
    };

    if (format === 'json') {
      await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
    } else if (format === 'sarif') {
      // Convert to SARIF format for integration with tools
      const sarif = this.convertToSarif(results);
      await fs.writeFile(outputPath, JSON.stringify(sarif, null, 2));
    } else if (format === 'html') {
      // Generate HTML report
      const htmlReport = this.generateHtmlReport(results);
      await fs.writeFile(outputPath, htmlReport);
    }

    return { success: true, outputPath, format };
  }

  /**
   * Convert to SARIF format (simplified)
   */
  convertToSarif(results) {
    // Simplified SARIF generation
    // In a real implementation, this would follow SARIF specification
    return {
      $schema:
        'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'Ultra-Dex Code Reviewer',
              informationUri: 'https://ultra-dex.ai',
              rules: [], // Would populate with actual rules
            },
          },
          results: results.reviews.flatMap((review) =>
            review.summary.issues.map((issue) => ({
              ruleId: issue.rule || 'general',
              level:
                issue.severity === 'critical' || issue.severity === 'high' ? 'error' : 'warning',
              message: {
                text: issue.description || issue.message,
              },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: {
                      uri: review.filePath,
                    },
                  },
                },
              ],
            }))
          ),
        },
      ],
    };
  }

  /**
   * Generate HTML report (simplified)
   */
  generateHtmlReport(results) {
    // Simplified HTML report generation
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Ultra-Dex Code Review Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .stats { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .review { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
    .issue { margin: 5px 0; padding: 5px; border-left: 3px solid #ccc; }
    .critical { border-left-color: #f44336; }
    .high { border-left-color: #ff9800; }
    .medium { border-left-color: #ffeb3b; }
    .low { border-left-color: #4caf50; }
  </style>
</head>
<body>
  <h1>Ultra-Dex Code Review Report</h1>
  <div class="stats">
    <h2>Statistics</h2>
    <p>Total Reviews: ${results.stats.totalReviews}</p>
    <p>Average Score: ${results.stats.averageScore}/100</p>
    <p>Critical Issues: ${results.stats.criticalIssues}</p>
    <p>Total Issues: ${results.stats.totalIssues}</p>
  </div>
  
  <h2>Recent Reviews</h2>
  ${results.reviews
    .slice(0, 5)
    .map(
      (review) => `
    <div class="review">
      <h3>${review.filePath} (${review.language})</h3>
      <p>Score: ${review.summary.overallScore}/100 | Recommendation: ${review.summary.recommendation}</p>
      <h4>Issues:</h4>
      ${review.summary.issues
        .slice(0, 5)
        .map(
          (issue) => `
        <div class="issue ${issue.severity}">
          <strong>[${issue.severity.toUpperCase()}]</strong> ${issue.description || issue.message}
          ${issue.line ? ` (Line: ${issue.line})` : ''}
        </div>
      `
        )
        .join('')}
    </div>
  `
    )
    .join('')}
</body>
</html>`;
  }

  /**
   * Get recommendations for code improvements
   */
  async getImprovementRecommendations(filePath) {
    const review = await this.reviewCode(filePath);

    // Group issues by category and severity
    const recommendations = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };

    review.summary.issues.forEach((issue) => {
      if (recommendations[issue.severity]) {
        recommendations[issue.severity].push({
          description: issue.description,
          suggestion: issue.suggestion || 'Consider refactoring this section',
          location: issue.location || { file: filePath, line: issue.line },
        });
      }
    });

    return {
      filePath,
      recommendations,
      overallScore: review.summary.overallScore,
      totalIssues: review.summary.totalIssues,
    };
  }
}

// Example usage
async function main() {
  const codeReviewer = new CodeReviewer({
    ultraDex: {
      apiKey: process.env.ULTRA_DEX_API_KEY,
      endpoint: process.env.ULTRA_DEX_ENDPOINT || 'https://api.ultra-dex.ai',
    },
    codeStandards: {
      quality: {
        maxComplexity: 10,
        maxFunctionLength: 50,
        maxParameters: 5,
      },
      practices: {
        allowConsoleLogs: false,
        requireJSDoc: true,
        maxNestedIfs: 3,
      },
      style: {
        indentSize: 2,
        useSemicolons: true,
        maxLineLength: 100,
      },
    },
    securityRules: {
      disableEval: true,
      validateInput: true,
      escapeOutput: true,
      useHTTPS: true,
    },
    performanceThresholds: {
      maxFunctionTime: 100, // ms
      maxMemoryUsage: 100, // MB
      minEfficiencyRating: 80,
    },
  });

  // Example of how to use the code reviewer
  try {
    console.log('Code reviewer initialized. Use reviewCode() to review files.');

    // Example of reviewing a file (would need actual file):
    /*
    const review = await codeReviewer.reviewCode('./path/to/code/file.js', {
      qualityThreshold: 85,
      securitySeverity: 'high',
      styleStrictness: 'strict'
    });
    
    console.log('Review completed:', review);
    */

    // Print review statistics
    console.log('Review Stats:', codeReviewer.getStats());
  } catch (error) {
    console.error('Error in main:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default CodeReviewer;
