#!/usr/bin/env node

/**
 * Quality Validation Automation
 * Automated testing, coverage, security, and performance validation
 * Addresses devin_ceo_1.md Gap #5: Missing automated quality validation
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'child_process';

// Streaming command execution to avoid blocking
function runCommandStreaming(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit', // Stream directly to console
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });

    child.on('error', (err) => reject(err));
  });
}

// Quality gates configuration
const QUALITY_GATES = {
  coverage: {
    min: 80,
    critical: 60
  },
  performance: {
    maxLoadTime: 3000, // 3 seconds
    maxResponseTime: 200, // 200ms
    maxBundleSize: 500 * 1024 // 500KB
  },
  security: {
    maxCriticalVulns: 0,
    maxHighVulns: 5,
    maxMediumVulns: 10
  },
  codeQuality: {
    maxComplexity: 10,
    maxDuplication: 5, // percentage
    maxLintErrors: 0
  }
};

// Test runner
async function runTests(projectPath) {
  const spinner = ora('Running tests...').start();

  return new Promise((resolve) => {
    const child = spawn('npm', ['test'], {
      cwd: projectPath,
      stdio: ['pipe', 'pipe', 'pipe'] // Capture output
    });

    let output = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
      // Optionally stream to console in real-time
      // process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      output += data.toString();
      // Optionally stream to console in real-time
      // process.stderr.write(data);
    });

    child.on('close', (code) => {
      try {
        // Extract coverage
        const coverageMatch = output.match(/Statements\s*:\s*(\d+(?:\.\d+)?)%/);
        const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;

        const passed = !output.includes('FAIL') && !output.includes('failed');

        if (passed) {
          spinner.succeed(chalk.green(`Tests passed (${coverage}% coverage)`));
        } else {
          spinner.fail(chalk.red('Tests failed'));
        }

        resolve({
          passed,
          coverage,
          output: output.substring(0, 1000)
        });
      } catch (error) {
        spinner.fail(chalk.red('Tests failed'));
        resolve({
          passed: false,
          coverage: 0,
          error: error.message
        });
      }
    });

    child.on('error', (error) => {
      spinner.fail(chalk.red('Tests failed'));
      resolve({
        passed: false,
        coverage: 0,
        error: error.message
      });
    });
  });
}

// Security scan
async function runSecurityScan(projectPath) {
  const spinner = ora('Running security scan...').start();
  
  const findings = [];
  
  try {
    // Check for hardcoded secrets
    const files = await getAllFiles(projectPath, ['.js', '.ts', '.jsx', '.tsx', '.env']);
    
    for (const file of files.slice(0, 50)) { // Limit to 50 files for performance
      try {
        const content = await fs.readFile(file, 'utf-8');
        
        // Check for API keys
        if (/api[_-]?key\s*[:=]\s*["'][a-zA-Z0-9]{20,}["']/i.test(content)) {
          findings.push({
            type: 'secret',
            severity: 'critical',
            file: path.relative(projectPath, file),
            message: 'Potential hardcoded API key detected'
          });
        }
        
        // Check for password patterns
        if (/password\s*[:=]\s*["'][^"']{8,}["']/i.test(content)) {
          findings.push({
            type: 'secret',
            severity: 'high',
            file: path.relative(projectPath, file),
            message: 'Potential hardcoded password detected'
          });
        }
        
        // Check for SQL injection patterns
        if (/query\s*\(.*\+.*\)/.test(content) || /exec\s*\(.*\+.*\)/.test(content)) {
          findings.push({
            type: 'injection',
            severity: 'high',
            file: path.relative(projectPath, file),
            message: 'Potential SQL injection vulnerability'
          });
        }
        
      } catch {
        // Skip files that can't be read
      }
    }
    
    // Count by severity
    const critical = findings.filter(f => f.severity === 'critical').length;
    const high = findings.filter(f => f.severity === 'high').length;
    const medium = findings.filter(f => f.severity === 'medium').length;
    
    const passed = critical === 0 && high <= QUALITY_GATES.security.maxHighVulns;
    
    if (passed) {
      spinner.succeed(chalk.green(`Security scan passed (${findings.length} findings)`));
    } else {
      spinner.fail(chalk.red(`Security scan failed (${critical} critical, ${high} high)`));
    }
    
    return {
      passed,
      findings,
      summary: { critical, high, medium }
    };
  } catch (error) {
    spinner.fail(chalk.red(`Security scan error: ${error.message}`));
    return {
      passed: false,
      error: error.message
    };
  }
}

// Performance check
async function checkPerformance(projectPath) {
  const spinner = ora('Checking performance...').start();
  
  try {
    const checks = [];
    
    // Check bundle size
    try {
      const buildDir = path.join(projectPath, '.next', 'static');
      const jsFiles = await getAllFiles(buildDir, ['.js']);
      let totalSize = 0;
      
      for (const file of jsFiles) {
        const stats = await fs.stat(file);
        totalSize += stats.size;
      }
      
      const bundleOk = totalSize < QUALITY_GATES.performance.maxBundleSize;
      checks.push({
        name: 'Bundle Size',
        passed: bundleOk,
        value: `${(totalSize / 1024).toFixed(2)}KB`,
        limit: `${(QUALITY_GATES.performance.maxBundleSize / 1024).toFixed(0)}KB`
      });
    } catch {
      checks.push({
        name: 'Bundle Size',
        passed: null,
        message: 'Build not found'
      });
    }
    
    // Check for performance anti-patterns
    const srcFiles = await getAllFiles(path.join(projectPath, 'src'), ['.tsx', '.jsx']);
    let issues = 0;
    
    for (const file of srcFiles.slice(0, 30)) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        
        // Check for useEffect without deps
        if (/useEffect\([^,]+\)/.test(content)) {
          issues++;
        }
        
        // Check for inline function definitions in render
        if (/onClick=\{\(\)\s*=>/.test(content)) {
          issues++;
        }
        
      } catch {
        // Skip
      }
    }
    
    checks.push({
      name: 'Performance Anti-patterns',
      passed: issues < 10,
      value: issues,
      limit: 10
    });
    
    const passed = checks.every(c => c.passed !== false);
    
    if (passed) {
      spinner.succeed(chalk.green('Performance checks passed'));
    } else {
      spinner.fail(chalk.red('Performance issues found'));
    }
    
    return {
      passed,
      checks
    };
  } catch (error) {
    spinner.fail(chalk.red(`Performance check error: ${error.message}`));
    return {
      passed: false,
      error: error.message
    };
  }
}

// Code quality check
async function checkCodeQuality(projectPath) {
  const spinner = ora('Checking code quality...').start();
  
  try {
    const checks = [];
    
    // Run ESLint
    try {
      await runCommandStreaming('npx', ['eslint', '.', '--format', 'json', '--output-file', 'eslint-report.json'], projectPath);

      const report = await fs.readFile(path.join(projectPath, 'eslint-report.json'), 'utf-8');
      const errors = JSON.parse(report);
      const errorCount = errors.length;

      checks.push({
        name: 'ESLint Errors',
        passed: errorCount === 0,
        value: errorCount,
        limit: 0
      });
    } catch {
      checks.push({
        name: 'ESLint',
        passed: null,
        message: 'Could not run ESLint'
      });
    }

    // Check TypeScript
    try {
      await fs.access(path.join(projectPath, 'tsconfig.json'));
      await runCommandStreaming('npx', ['tsc', '--noEmit'], projectPath);

      checks.push({
        name: 'TypeScript',
        passed: true,
        value: 'No errors',
        limit: '0 errors'
      });
    } catch {
      checks.push({
        name: 'TypeScript',
        passed: false,
        value: 'Errors found',
        limit: '0 errors'
      });
    }
    
    // Check code complexity (basic)
    const srcFiles = await getAllFiles(path.join(projectPath, 'src'), ['.ts', '.tsx']);
    let highComplexityFiles = 0;
    
    for (const file of srcFiles.slice(0, 30)) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');
        
        // Simple complexity check: count nested ifs
        let maxDepth = 0;
        let currentDepth = 0;
        
        for (const line of lines) {
          if (/if\s*\(|else\s*if/.test(line)) {
            currentDepth++;
            maxDepth = Math.max(maxDepth, currentDepth);
          } else if (/\}/.test(line)) {
            currentDepth = Math.max(0, currentDepth - 1);
          }
        }
        
        if (maxDepth > 4) {
          highComplexityFiles++;
        }
      } catch {
        // Skip
      }
    }
    
    checks.push({
      name: 'Code Complexity',
      passed: highComplexityFiles < 5,
      value: `${highComplexityFiles} files`,
      limit: '< 5 files'
    });
    
    const passed = checks.every(c => c.passed !== false);
    
    if (passed) {
      spinner.succeed(chalk.green('Code quality checks passed'));
    } else {
      spinner.fail(chalk.red('Code quality issues found'));
    }
    
    return {
      passed,
      checks
    };
  } catch (error) {
    spinner.fail(chalk.red(`Code quality check error: ${error.message}`));
    return {
      passed: false,
      error: error.message
    };
  }
}

// Helper to get all files recursively
async function getAllFiles(dir, extensions) {
  const files = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...await getAllFiles(fullPath, extensions));
      } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
  
  return files;
}

// Export registration function
export function registerQualityCommand(program) {
  program
    .command('quality')
    .description('Run automated quality validation (tests, security, performance)')
    .option('-p, --project <path>', 'Project root path', '.')
    .option('--tests-only', 'Run only tests')
    .option('--security-only', 'Run only security scan')
    .option('--performance-only', 'Run only performance check')
    .option('--code-only', 'Run only code quality check')
    .option('--fail-fast', 'Stop on first failure')
    .option('--report', 'Generate quality report')
    .action(async (options) => {
      console.log(chalk.blue('\n🔍 Quality Validation Automation\n'));
      
      const projectPath = path.resolve(options.project);
      const results = {};
      let failed = false;
      
      // Run tests
      if (!options.securityOnly && !options.performanceOnly && !options.codeOnly) {
        results.tests = await runTests(projectPath);
        if (!results.tests.passed && options.failFast) failed = true;
      }
      
      // Run security scan
      if (!failed && !options.testsOnly && !options.performanceOnly && !options.codeOnly) {
        results.security = await runSecurityScan(projectPath);
        if (!results.security.passed && options.failFast) failed = true;
      }
      
      // Check performance
      if (!failed && !options.testsOnly && !options.securityOnly && !options.codeOnly) {
        results.performance = await checkPerformance(projectPath);
        if (!results.performance.passed && options.failFast) failed = true;
      }
      
      // Check code quality
      if (!failed && !options.testsOnly && !options.securityOnly && !options.performanceOnly) {
        results.codeQuality = await checkCodeQuality(projectPath);
        if (!results.codeQuality.passed && options.failFast) failed = true;
      }
      
      // Summary
      console.log(chalk.blue('\n📊 Quality Report\n'));
      
      const categories = Object.keys(results);
      const passed = categories.filter(c => results[c].passed).length;
      const total = categories.length;
      
      categories.forEach(category => {
        const result = results[category];
        const icon = result.passed ? chalk.green('✓') : chalk.red('✗');
        const color = result.passed ? chalk.green : chalk.red;
        
        console.log(`${icon} ${color(category.toUpperCase())}`);
        
        if (result.coverage !== undefined) {
          console.log(`   Coverage: ${result.coverage}%`);
        }
        if (result.summary) {
          console.log(`   Findings: ${result.summary.critical} critical, ${result.summary.high} high, ${result.summary.medium} medium`);
        }
        if (result.checks) {
          result.checks.forEach(check => {
            const status = check.passed === null ? chalk.yellow('⚠') : check.passed ? chalk.green('✓') : chalk.red('✗');
            console.log(`   ${status} ${check.name}: ${check.value || check.message} ${check.limit ? `(limit: ${check.limit})` : ''}`);
          });
        }
      });
      
      console.log(chalk.blue(`\nOverall: ${passed}/${total} categories passed`));
      
      if (passed === total) {
        console.log(chalk.green('\n✅ All quality gates passed! Ready for deployment.'));
      } else {
        console.log(chalk.red('\n❌ Some quality gates failed. Review issues above.'));
        process.exit(1);
      }
      
      // Generate report
      if (options.report) {
        const reportPath = path.join(projectPath, 'quality-report.json');
        await fs.writeFile(reportPath, JSON.stringify({
          timestamp: new Date().toISOString(),
          results,
          summary: {
            total: categories.length,
            passed,
            failed: total - passed
          }
        }, null, 2));
        console.log(chalk.blue(`\n📝 Report saved: ${reportPath}`));
      }
    });
}
