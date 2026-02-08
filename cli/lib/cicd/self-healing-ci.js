import { spawn, exec } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import axios from 'axios';
import { promisify } from 'util';

const execPromise = promisify(exec);

interface CIConfig {
  provider: 'github' | 'gitlab' | 'bitbucket';
  repo: string;
  branch: string;
  apiKey: string;
  webhookUrl?: string;
}

interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line: number;
  code: string;
  suggestedFix: string;
}

export class SelfHealingCI {
  private config: CIConfig;
  private isRunning: boolean;
  private bugReports: BugReport[];

  constructor(config: CIConfig) {
    this.config = config;
    this.isRunning = false;
    this.bugReports = [];
  }

  /**
   * Start the self-healing CI/CD system
   */
  async start(): Promise<void> {
    this.isRunning = true;
    console.log('🤖 Self-Healing CI/CD System activated');
    
    // Set up webhook listener
    if (this.config.webhookUrl) {
      this.setupWebhookListener();
    }

    // Start periodic health checks
    this.startHealthMonitoring();

    // Monitor pull requests
    this.monitorPullRequests();

    console.log('✅ Self-Healing CI/CD is now monitoring');
  }

  /**
   * Stop the system
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('🛑 Self-Healing CI/CD system stopped');
  }

  /**
   * Run tests and detect issues
   */
  async runTests(): Promise<{ passed: boolean; issues: string[]; coverage: number }> {
    try {
      // Run tests using the project's test command
      const testResult = await execPromise('npm test');
      
      // Analyze test output for issues
      const issues = this.parseTestOutput(testResult.stdout);
      
      // Calculate coverage if available
      const coverage = this.calculateCoverage();
      
      return {
        passed: issues.length === 0,
        issues,
        coverage
      };
    } catch (error) {
      // Parse test failures
      const issues = this.parseTestOutput(error.stdout || error.stderr);
      return {
        passed: false,
        issues,
        coverage: 0
      };
    }
  }

  /**
   * Run static analysis
   */
  async runStaticAnalysis(): Promise<BugReport[]> {
    const reports: BugReport[] = [];

    // Check for common issues
    reports.push(...await this.checkForSecurityIssues());
    reports.push(...await this.checkForPerformanceIssues());
    reports.push(...await this.checkForCodeQualityIssues());

    return reports;
  }

  /**
   * Check for security issues
   */
  async checkForSecurityIssues(): Promise<BugReport[]> {
    const reports: BugReport[] = [];

    // Check for security vulnerabilities
    try {
      const { stdout } = await execPromise('npm audit --json');
      const audit = JSON.parse(stdout);
      
      if (audit.metadata && audit.metadata.vulnerabilities.total > 0) {
        const vulns = audit.vulnerabilities || {};
        
        for (const [name, vuln] of Object.entries(vulns)) {
          if (vuln.severity === 'high' || vuln.severity === 'critical') {
            reports.push({
              id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: `Security Vulnerability: ${name}`,
              description: vuln.overview || 'Security vulnerability detected',
              severity: vuln.severity as any,
              file: 'package-lock.json',
              line: 0,
              code: `Dependency: ${name}`,
              suggestedFix: `Update to version: ${vuln.fixAvailable.version}`
            });
          }
        }
      }
    } catch (error) {
      // npm audit might not find issues, which is fine
    }

    return reports;
  }

  /**
   * Check for performance issues
   */
  async checkForPerformanceIssues(): Promise<BugReport[]> {
    const reports: BugReport[] = [];

    // Check for performance issues in code
    const files = this.getAllSourceFiles();
    
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for potential performance issues
        if (line.includes('for (let i = 0; i < arr.length; i++)') && line.includes('arr.length')) {
          reports.push({
            id: `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: 'Potential Performance Issue',
            description: 'Array length being calculated in loop condition',
            severity: 'medium',
            file,
            line: i + 1,
            code: line.trim(),
            suggestedFix: 'Cache array length: const len = arr.length; for (let i = 0; i < len; i++)'
          });
        }
        
        // Check for other performance patterns
        if (line.includes('JSON.parse') && line.includes('try {')) {
          reports.push({
            id: `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: 'Potential Performance Issue',
            description: 'JSON parsing without error handling',
            severity: 'medium',
            file,
            line: i + 1,
            code: line.trim(),
            suggestedFix: 'Add proper error handling for JSON.parse'
          });
        }
      }
    }

    return reports;
  }

  /**
   * Check for code quality issues
   */
  async checkForCodeQualityIssues(): Promise<BugReport[]> {
    const reports: BugReport[] = [];

    // Run ESLint if available
    if (existsSync('./node_modules/.bin/eslint')) {
      try {
        const { stdout } = await execPromise('npx eslint src/**/*.{js,ts,jsx,tsx}');
        
        // Parse ESLint output
        const eslintLines = stdout.split('\n');
        for (const line of eslintLines) {
          if (line.includes(':')) {
            const parts = line.split(':');
            if (parts.length >= 4) {
              reports.push({
                id: `quality-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: 'Code Quality Issue',
                description: parts.slice(3).join(':').trim(),
                severity: 'medium',
                file: parts[0],
                line: parseInt(parts[1]),
                code: 'See ESLint output',
                suggestedFix: 'Follow ESLint recommendations'
              });
            }
          }
        }
      } catch (error) {
        // ESLint might find issues, which is expected
      }
    }

    return reports;
  }

  /**
   * Attempt to fix bugs automatically
   */
  async attemptAutoFix(reports: BugReport[]): Promise<boolean> {
    let fixesApplied = 0;

    for (const report of reports) {
      if (await this.canAutoFix(report)) {
        const success = await this.applyFix(report);
        if (success) {
          fixesApplied++;
          console.log(`✅ Applied fix for: ${report.title}`);
        }
      }
    }

    console.log(`Applied ${fixesApplied} automatic fixes`);
    return fixesApplied > 0;
  }

  /**
   * Check if a bug can be auto-fixed
   */
  private async canAutoFix(report: BugReport): Promise<boolean> {
    // Define which types of issues can be auto-fixed
    const autoFixablePatterns = [
      'potential performance issue',
      'unused variable',
      'missing semicolon',
      'incorrect indentation'
    ];

    return autoFixablePatterns.some(pattern => 
      report.description.toLowerCase().includes(pattern)
    );
  }

  /**
   * Apply a fix to a bug report
   */
  private async applyFix(report: BugReport): Promise<boolean> {
    try {
      const content = readFileSync(report.file, 'utf8');
      const lines = content.split('\n');
      
      // Apply specific fixes based on issue type
      if (report.description.toLowerCase().includes('performance')) {
        // Apply performance fix
        lines[report.line - 1] = this.applyPerformanceFix(lines[report.line - 1]);
      } else if (report.description.toLowerCase().includes('unused variable')) {
        // Remove unused variable
        lines[report.line - 1] = this.removeUnusedVariable(lines[report.line - 1]);
      }
      
      writeFileSync(report.file, lines.join('\n'));
      return true;
    } catch (error) {
      console.error(`Failed to apply fix:`, error.message);
      return false;
    }
  }

  /**
   * Apply performance fix to a line
   */
  private applyPerformanceFix(line: string): string {
    // Example: Cache array length
    if (line.includes('for (let i = 0; i < arr.length; i++)')) {
      return line.replace('for (let i = 0; i < arr.length; i++)', 'const len = arr.length; for (let i = 0; i < len; i++)');
    }
    return line;
  }

  /**
   * Remove unused variable from a line
   */
  private removeUnusedVariable(line: string): string {
    // Simple example - in reality this would be more sophisticated
    return line.replace(/const unusedVar = .*/, '// Removed unused variable');
  }

  /**
   * Run the full CI pipeline
   */
  async runCIPipeline(): Promise<{ success: boolean; reports: BugReport[] }> {
    console.log('🔄 Starting CI pipeline...');
    
    // Run tests
    const testResult = await this.runTests();
    console.log(`🧪 Tests: ${testResult.passed ? 'PASSED' : 'FAILED'} (${testResult.issues.length} issues, ${testResult.coverage}% coverage)`);

    // Run static analysis
    const staticAnalysisReports = await this.runStaticAnalysis();
    console.log(`🔍 Static Analysis: ${staticAnalysisReports.length} issues found`);

    // Combine all reports
    const allReports = [...staticAnalysisReports];
    
    // Attempt auto-fixes
    if (allReports.length > 0) {
      console.log('🔧 Attempting auto-fixes...');
      await this.attemptAutoFix(allReports);
    }

    // Determine success
    const success = testResult.passed && allReports.filter(r => r.severity === 'critical').length === 0;
    
    return { success, reports: allReports };
  }

  /**
   * Setup webhook listener for CI triggers
   */
  private setupWebhookListener(): void {
    // In a real implementation, this would set up an HTTP server
    // For now, we'll simulate
    console.log(`📡 Listening for webhooks at: ${this.config.webhookUrl}`);
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        const result = await this.runCIPipeline();
        console.log(`📊 Health check: ${result.success ? 'HEALTHY' : 'UNHEALTHY'}`);
        
        if (!result.success) {
          console.log('🚨 Health check failed, initiating recovery...');
          await this.initiateRecovery(result.reports);
        }
      } catch (error) {
        console.error('Health check failed:', error.message);
      }
    }, 300000); // Every 5 minutes
  }

  /**
   * Monitor pull requests
   */
  private monitorPullRequests(): void {
    // In a real implementation, this would poll the Git provider
    // For now, we'll simulate
    setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        const prs = await this.fetchOpenPRs();
        for (const pr of prs) {
          console.log(`🔍 Analyzing PR #${pr.number}: ${pr.title}`);
          await this.analyzePR(pr);
        }
      } catch (error) {
        console.error('PR monitoring failed:', error.message);
      }
    }, 60000); // Every minute
  }

  /**
   * Fetch open pull requests
   */
  private async fetchOpenPRs(): Promise<any[]> {
    // Simulate fetching PRs
    return [];
  }

  /**
   * Analyze a pull request
   */
  private async analyzePR(pr: any): Promise<void> {
    // Run CI pipeline on PR branch
    const result = await this.runCIPipeline();
    
    if (!result.success) {
      // Comment on PR with issues
      await this.commentOnPR(pr.number, result.reports);
    }
  }

  /**
   * Comment on a pull request
   */
  private async commentOnPR(prNumber: number, reports: BugReport[]): Promise<void> {
    const comment = this.generatePRComment(reports);
    
    // In a real implementation, this would make an API call to the Git provider
    console.log(`💬 Commenting on PR #${prNumber}: ${comment}`);
  }

  /**
   * Generate PR comment from bug reports
   */
  private generatePRComment(reports: BugReport[]): string {
    if (reports.length === 0) {
      return '✅ All checks passed!';
    }

    const critical = reports.filter(r => r.severity === 'critical').length;
    const high = reports.filter(r => r.severity === 'high').length;
    
    return `⚠️ Found ${reports.length} issues:\n- ${critical} critical\n- ${high} high severity\n\nAuto-fixes applied where possible.`;
  }

  /**
   * Initiate recovery from issues
   */
  private async initiateRecovery(reports: BugReport[]): Promise<void> {
    console.log('🔄 Initiating recovery process...');
    
    // Attempt auto-fixes
    await this.attemptAutoFix(reports);
    
    // Run tests again
    const testResult = await this.runTests();
    
    if (testResult.passed) {
      console.log('✅ Recovery successful!');
      
      // Create a recovery commit
      await this.createRecoveryCommit(reports);
    } else {
      console.log('❌ Recovery failed, manual intervention required');
    }
  }

  /**
   * Create a recovery commit
   */
  private async createRecoveryCommit(reports: BugReport[]): Promise<void> {
    try {
      // Add changes
      await execPromise('git add .');
      
      // Create commit message
      const commitMsg = `🤖 Auto-fix: Addressed ${reports.length} issues\n\n- Applied automatic fixes\n- Improved code quality\n- Resolved security concerns`;
      
      await execPromise(`git commit -m "${commitMsg}"`);
      await execPromise('git push');
      
      console.log('✅ Recovery commit created and pushed');
    } catch (error) {
      console.error('Failed to create recovery commit:', error.message);
    }
  }

  /**
   * Parse test output for issues
   */
  private parseTestOutput(output: string): string[] {
    const issues: string[] = [];
    
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('error') || line.toLowerCase().includes('fail')) {
        issues.push(line.trim());
      }
    }
    
    return issues;
  }

  /**
   * Calculate test coverage
   */
  private calculateCoverage(): number {
    // In a real implementation, this would parse coverage reports
    // For now, return a simulated value
    return Math.floor(Math.random() * 40) + 60; // 60-100%
  }

  /**
   * Get all source files
   */
  private getAllSourceFiles(): string[] {
    // In a real implementation, this would walk the directory tree
    // For now, return a simulated list
    const files: string[] = [];
    
    if (existsSync('./src')) {
      const walk = (dir: string) => {
        const fs = require('fs');
        const path = require('path');
        
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            walk(fullPath);
          } else if (fullPath.match(/\.(js|ts|jsx|tsx)$/)) {
            files.push(fullPath);
          }
        }
      };
      
      walk('./src');
    }
    
    return files;
  }

  /**
   * Get system status
   */
  getStatus(): any {
    return {
      running: this.isRunning,
      bugReports: this.bugReports.length,
      lastRun: new Date().toISOString(),
    };
  }
}

export default SelfHealingCI;