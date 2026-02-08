# 🚀 ULTRA-DEX V4.2.0 - AI CODE REVIEW BOT

## 🎯 Automated Code Review System

### Objective
Create an AI-powered code review bot that automatically reviews pull requests, identifies issues, and suggests improvements with security, performance, and best practice checks.

### Implementation Plan

#### 1. Code Review Engine
```javascript
// File: cli/lib/review/code-review-engine.js
import fs from 'fs/promises';
import path from 'path';
import { runAgentLoop } from '../commands/run.js';
import { getDefaultProvider, createProvider } from '../providers/index.js';

export class CodeReviewEngine {
  constructor(options = {}) {
    this.rules = this.loadDefaultRules();
    this.provider = createProvider(getDefaultProvider(), {
      maxTokens: 4000,
      temperature: 0.3 // Lower temperature for consistent reviews
    });
  }

  loadDefaultRules() {
    return {
      security: [
        { pattern: /eval\s*\(/, severity: 'critical', message: 'Use of eval() is dangerous' },
        { pattern: /new Function\s*\(/, severity: 'high', message: 'Dynamic function creation is risky' },
        { pattern: /innerHTML\s*=/, severity: 'high', message: 'Potential XSS vulnerability' },
        { pattern: /document\.cookie/, severity: 'medium', message: 'Cookie manipulation without HttpOnly flag' },
        { pattern: /password|secret|key/i, severity: 'medium', message: 'Hardcoded credentials detected' }
      ],
      performance: [
        { pattern: /for\s*\(\s*i\s*=\s*0\s*;\s*i\s*<\s*\w+\s*;\s*i\+\+\s*\)\s*{\s*for/, severity: 'medium', message: 'Nested loops may cause performance issues' },
        { pattern: /SELECT \*/, severity: 'medium', message: 'Avoid SELECT * in database queries' },
        { pattern: /await.*await.*await/, severity: 'medium', message: 'Sequential awaits in loop - consider Promise.all()' },
        { pattern: /JSON\.parse/, severity: 'low', message: 'Consider input validation for JSON.parse' }
      ],
      bestPractices: [
        { pattern: /console\.log/, severity: 'low', message: 'Remove console.log statements before production' },
        { pattern: /TODO|FIXME|BUG/, severity: 'medium', message: 'Outstanding TODO/FIXME comments found' },
        { pattern: /function \w+\s*\(\s*\w+\s*,\s*\w+\s*,\s*\w+\s*,\s*\w+\s*,/, severity: 'medium', message: 'Function has too many parameters (>4)' },
        { pattern: /var\s+\w+/, severity: 'low', message: 'Use const/let instead of var' }
      ],
      style: [
        { pattern: /;\s*$/, severity: 'low', message: 'Trailing semicolon found' },
        { pattern: /\s+$/, severity: 'low', message: 'Trailing whitespace found' },
        { pattern: /\t/, severity: 'low', message: 'Use spaces instead of tabs' }
      ]
    };
  }

  async reviewCode(code, options = {}) {
    const findings = [];
    
    // Rule-based scanning
    for (const [category, rules] of Object.entries(this.rules)) {
      for (const rule of rules) {
        const matches = code.match(new RegExp(rule.pattern, 'g'));
        if (matches) {
          findings.push({
            category,
            severity: rule.severity,
            message: rule.message,
            matches: matches.length,
            lines: this.extractLines(code, rule.pattern)
          });
        }
      }
    }

    // AI-powered analysis
    const aiFindings = await this.aiReview(code, options);
    
    return {
      findings: [...findings, ...aiFindings],
      summary: this.generateSummary(findings),
      score: this.calculateScore(findings)
    };
  }

  extractLines(code, pattern) {
    const lines = code.split('\n');
    const matchingLines = [];
    
    lines.forEach((line, index) => {
      if (line.match(pattern)) {
        matchingLines.push({
          number: index + 1,
          content: line.trim()
        });
      }
    });
    
    return matchingLines;
  }

  async aiReview(code, options) {
    const prompt = `
You are an expert code reviewer. Analyze this code for:

1. Security vulnerabilities
2. Performance issues
3. Code quality problems
4. Best practice violations
5. Maintainability concerns

Code to review:
\`\`\`
${code}
\`\`\`

Provide specific, actionable feedback. Focus on real issues, not minor stylistic concerns.
Return findings in JSON format with category, severity, message, and line numbers.
`;

    try {
      const response = await this.provider.call(prompt);
      const aiFindings = this.parseAIResponse(response.content);
      return aiFindings;
    } catch (error) {
      console.error('AI review failed:', error.message);
      return [];
    }
  }

  parseAIResponse(response) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: create findings from text
      return [{
        category: 'ai-analysis',
        severity: 'info',
        message: response,
        lines: []
      }];
    } catch {
      return [{
        category: 'ai-analysis',
        severity: 'info',
        message: 'AI analysis completed',
        lines: []
      }];
    }
  }

  generateSummary(findings) {
    const summary = {
      total: findings.length,
      critical: findings.filter(f => f.severity === 'critical').length,
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length,
      info: findings.filter(f => f.severity === 'info').length
    };

    return summary;
  }

  calculateScore(findings) {
    const weights = {
      critical: 10,
      high: 7,
      medium: 4,
      low: 1,
      info: 0
    };

    const totalPoints = findings.reduce((sum, finding) => {
      return sum + weights[finding.severity] || 0;
    }, 0);

    // Score from 0-100, lower is better
    const score = Math.max(0, 100 - totalPoints);
    return Math.round(score);
  }

  async reviewFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    return await this.reviewCode(content, { filePath });
  }

  async reviewDirectory(directoryPath) {
    const findings = {};
    const files = await this.getAllCodeFiles(directoryPath);
    
    for (const file of files) {
      const review = await this.reviewFile(file);
      findings[file] = review;
    }
    
    return findings;
  }

  async getAllCodeFiles(directoryPath) {
    const files = [];
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directoryPath, entry.name);
      
      if (entry.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
          files.push(...await this.getAllCodeFiles(fullPath));
        }
      } else if (this.isCodeFile(entry.name)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  isCodeFile(filename) {
    const extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs', '.java', '.cpp', '.c', '.h', '.rb', '.php', '.cs'];
    return extensions.some(ext => filename.endsWith(ext));
  }
}
```

#### 2. GitHub Integration
```javascript
// File: cli/lib/review/github-integration.js
import { Octokit } from 'octokit';

export class GitHubReviewBot {
  constructor(token) {
    this.octokit = new Octokit({ auth: token });
  }

  async reviewPullRequest(owner, repo, pullNumber) {
    // Get PR details
    const { data: pr } = await this.octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pullNumber
    });

    // Get PR files
    const { data: files } = await this.octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber
    });

    const reviewEngine = new CodeReviewEngine();
    const comments = [];

    for (const file of files) {
      if (this.isCodeFile(file.filename)) {
        const review = await reviewEngine.reviewCode(file.patch || '');
        
        // Create review comments
        for (const finding of review.findings) {
          if (finding.lines && finding.lines.length > 0) {
            const line = finding.lines[0]; // Use first line
            comments.push({
              path: file.filename,
              line: line.number,
              body: this.formatFindingComment(finding),
              start_line: line.number,
              side: 'RIGHT'
            });
          }
        }
      }
    }

    // Submit review
    if (comments.length > 0) {
      await this.octokit.rest.pulls.createReview({
        owner,
        repo,
        pull_number: pullNumber,
        event: 'COMMENT',
        comments
      });
    }

    return {
      pr: pr.title,
      filesReviewed: files.length,
      totalFindings: comments.length,
      comments
    };
  }

  formatFindingComment(finding) {
    const severityEmoji = {
      critical: '🚨',
      high: '⚠️',
      medium: '💡',
      low: '📝',
      info: 'ℹ️'
    };

    return `${severityEmoji[finding.severity] || '❓'} **${finding.category.toUpperCase()}**: ${finding.message}`;
  }

  isCodeFile(filename) {
    const extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs', '.java', '.cpp', '.c', '.h', '.rb', '.php', '.cs'];
    return extensions.some(ext => filename.endsWith(ext));
  }

  async reviewCommit(owner, repo, commitSha) {
    const { data: commit } = await this.octokit.rest.repos.getCommit({
      owner,
      repo,
      ref: commitSha
    });

    // Get changed files in commit
    const { data: commitFiles } = await this.octokit.rest.repos.getCommit({
      owner,
      repo,
      ref: commitSha
    });

    const reviewEngine = new CodeReviewEngine();
    const results = [];

    for (const file of commitFiles.files || []) {
      if (file.patch && this.isCodeFile(file.filename)) {
        const review = await reviewEngine.reviewCode(file.patch);
        results.push({
          file: file.filename,
          review,
          additions: file.additions,
          deletions: file.deletions
        });
      }
    }

    return results;
  }
}
```

#### 3. CLI Commands for Code Review
```javascript
// File: cli/lib/commands/code-review.js
import { CodeReviewEngine } from '../review/code-review-engine.js';
import { GitHubReviewBot } from '../review/github-integration.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import fs from 'fs/promises';
import path from 'path';

export async function registerCodeReviewCommand(program) {
  const reviewCmd = program
    .command('review')
    .alias('code-review')
    .description('AI-powered code review tools');

  const reviewEngine = new CodeReviewEngine();

  reviewCmd
    .command('file <filePath>')
    .description('Review a single file')
    .action(async (filePath) => {
      try {
        const review = await reviewEngine.reviewFile(filePath);
        
        printInfo(`🔍 Code Review for: ${filePath}`);
        printInfo(`📊 Score: ${review.score}/100`);
        printInfo(`📋 Findings: ${review.summary.total}`);
        
        if (review.findings.length === 0) {
          printSuccess('✅ No issues found! Code looks great.');
          return;
        }

        review.findings.forEach((finding, index) => {
          const severityColor = {
            critical: 'red',
            high: 'yellow',
            medium: 'orange',
            low: 'blue',
            info: 'gray'
          };
          
          printInfo(`\n${index + 1}. ${finding.severity.toUpperCase()}: ${finding.message}`);
          printInfo(`   Category: ${finding.category}`);
          if (finding.lines && finding.lines.length > 0) {
            printInfo(`   Lines: ${finding.lines.map(l => l.number).join(', ')}`);
          }
        });
      } catch (error) {
        printError(`Review failed: ${error.message}`);
      }
    });

  reviewCmd
    .command('dir <directoryPath>')
    .description('Review all code files in directory')
    .action(async (directoryPath) => {
      try {
        const findings = await reviewEngine.reviewDirectory(directoryPath);
        
        let totalFindings = 0;
        let totalScore = 0;
        let fileCount = 0;

        for (const [file, review] of Object.entries(findings)) {
          totalFindings += review.summary.total;
          totalScore += review.score;
          fileCount++;
          
          printInfo(`\n📄 ${file}: ${review.score}/100 (${review.summary.total} issues)`);
        }

        const avgScore = fileCount > 0 ? Math.round(totalScore / fileCount) : 0;
        
        printInfo(`\n📈 Overall Summary:`);
        printInfo(`   Files reviewed: ${fileCount}`);
        printInfo(`   Total findings: ${totalFindings}`);
        printInfo(`   Average score: ${avgScore}/100`);
      } catch (error) {
        printError(`Directory review failed: ${error.message}`);
      }
    });

  reviewCmd
    .command('github <owner> <repo> <prNumber>')
    .description('Review GitHub pull request')
    .option('-t, --token <token>', 'GitHub token for authentication')
    .action(async (owner, repo, prNumber, options) => {
      try {
        const token = options.token || process.env.GITHUB_TOKEN;
        if (!token) {
          printError('GitHub token required. Use --token or set GITHUB_TOKEN env var');
          return;
        }

        const githubBot = new GitHubReviewBot(token);
        const result = await githubBot.reviewPullRequest(owner, repo, prNumber);
        
        printSuccess(`GitHub PR Review completed!`);
        printInfo(`PR: ${result.pr}`);
        printInfo(`Files reviewed: ${result.filesReviewed}`);
        printInfo(`Total findings: ${result.totalFindings}`);
        
        if (result.comments.length > 0) {
          printInfo(`Comments posted to PR`);
        }
      } catch (error) {
        printError(`GitHub review failed: ${error.message}`);
      }
    });

  reviewCmd
    .command('summary')
    .description('Generate code review summary')
    .option('-f, --format <format>', 'Output format (json, markdown, text)', 'text')
    .option('-o, --output <file>', 'Output file')
    .action(async (options) => {
      try {
        // This would typically run on current project
        const findings = await reviewEngine.reviewDirectory(process.cwd());
        
        let output;
        if (options.format === 'json') {
          output = JSON.stringify(findings, null, 2);
        } else if (options.format === 'markdown') {
          output = this.generateMarkdownReport(findings);
        } else {
          output = this.generateTextReport(findings);
        }

        if (options.output) {
          await fs.writeFile(options.output, output);
          printSuccess(`Report saved to: ${options.output}`);
        } else {
          console.log(output);
        }
      } catch (error) {
        printError(`Summary generation failed: ${error.message}`);
      }
    });

  reviewCmd
    .command('auto')
    .description('Run automatic code review on staged changes')
    .action(async () => {
      try {
        // Check for git repository
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        try {
          const { stdout } = await execAsync('git diff --name-only --cached');
          const files = stdout.trim().split('\n').filter(f => f);
          
          if (files.length === 0) {
            printInfo('No staged files to review');
            return;
          }

          printInfo(`Reviewing ${files.length} staged files...`);
          
          for (const file of files) {
            if (reviewEngine.isCodeFile(file)) {
              const review = await reviewEngine.reviewFile(file);
              
              if (review.findings.length > 0) {
                printWarning(`⚠️  ${file}: ${review.findings.length} issues found`);
                
                review.findings.slice(0, 3).forEach(finding => {
                  printInfo(`   ${finding.severity.toUpperCase()}: ${finding.message}`);
                });
                
                if (review.findings.length > 3) {
                  printInfo(`   ... and ${review.findings.length - 3} more`);
                }
              } else {
                printSuccess(`✅ ${file}: No issues`);
              }
            }
          }
        } catch (gitError) {
          printError('Not in a git repository or git command failed');
        }
      } catch (error) {
        printError(`Auto review failed: ${error.message}`);
      }
    });
}

function generateMarkdownReport(findings) {
  let md = '# Code Review Report\n\n';
  
  for (const [file, review] of Object.entries(findings)) {
    md += `## ${file}\n`;
    md += `- Score: ${review.score}/100\n`;
    md += `- Issues: ${review.summary.total}\n\n`;
    
    if (review.findings.length > 0) {
      md += '### Issues Found:\n';
      review.findings.forEach(finding => {
        md += `- **${finding.severity.toUpperCase()}** (${finding.category}): ${finding.message}\n`;
      });
      md += '\n';
    }
  }
  
  return md;
}

function generateTextReport(findings) {
  let text = 'Code Review Report\n';
  text += '='.repeat(50) + '\n\n';
  
  for (const [file, review] of Object.entries(findings)) {
    text += `File: ${file}\n`;
    text += `Score: ${review.score}/100\n`;
    text += `Issues: ${review.summary.total}\n`;
    
    if (review.findings.length > 0) {
      text += 'Issues:\n';
      review.findings.forEach(finding => {
        text += `  - ${finding.severity.toUpperCase()}: ${finding.message}\n`;
      });
    }
    text += '\n';
  }
  
  return text;
}
```

#### 4. Update Main CLI Registration
```javascript
// Add to cli/bin/ultra-dex.js
import { registerCodeReviewCommand } from './lib/commands/code-review.js';

// Add after other registrations
registerCodeReviewCommand(program);
```

#### 5. Git Hook Integration
```javascript
// File: cli/lib/hooks/pre-commit-review.js
import { CodeReviewEngine } from '../review/code-review-engine.js';

export async function preCommitReview() {
  const reviewEngine = new CodeReviewEngine();
  
  // Get staged files
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    const { stdout } = await execAsync('git diff --name-only --cached');
    const files = stdout.trim().split('\n').filter(f => f);
    
    let hasIssues = false;
    
    for (const file of files) {
      if (reviewEngine.isCodeFile(file)) {
        const review = await reviewEngine.reviewFile(file);
        
        if (review.findings.length > 0) {
          console.log(`⚠️  ${file}: ${review.findings.length} issues found`);
          hasIssues = true;
          
          // Show top 3 issues
          review.findings.slice(0, 3).forEach(finding => {
            console.log(`   ${finding.severity.toUpperCase()}: ${finding.message}`);
          });
        }
      }
    }
    
    if (hasIssues) {
      console.log('\n⚠️  Code review found issues. Please address them before committing.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Pre-commit review failed:', error.message);
    // Don't block commit if review fails
  }
}
```

### Testing Plan
1. Test rule-based scanning with various code samples
2. Verify AI-powered analysis works
3. Test GitHub integration
4. Validate file type detection
5. Benchmark performance with large codebases

### Success Criteria
- ✅ Rule-based scanning detects common issues
- ✅ AI analysis provides meaningful feedback
- ✅ GitHub integration posts reviews
- ✅ File type detection works correctly
- ✅ Performance acceptable for large projects

---

**Estimated Timeline:** 1 week
**Priority:** 🟡 HIGH
**Status:** Ready for implementation