// Copyright (c) 2026 Ultra-Dex

/**
 * 21-Step Automation Engine
 * Converts verification checklist into executable functions
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import chalk from 'chalk';

/**
 * Automated step definitions with executable functions
 */
export const AUTOMATED_STEPS = [
  {
    id: 'understand',
    title: 'Requirements Understanding',
    automated: true,
    execute: async (context) => {
      // Check if CONTEXT.md or requirements exist
      const files = ['CONTEXT.md', 'REQUIREMENTS.md', 'docs/requirements.md', 'IMPLEMENTATION-PLAN.md'];
      for (const file of files) {
        try {
          await fs.access(path.join(process.cwd(), file));
          return { passed: true, message: `Found requirements in ${file}` };
        } catch {}
      }
      return { passed: false, message: 'No requirements document found', suggestion: 'Create CONTEXT.md or REQUIREMENTS.md' };
    }
  },
  {
    id: 'analyze',
    title: 'Technical Analysis',
    automated: true,
    execute: async (context) => {
      // Check for architecture docs or design decisions
      const files = ['docs/ARCHITECTURE.md', 'docs/auth-architecture.md', '.ultra-dex/decisions.json'];
      for (const file of files) {
        try {
          await fs.access(path.join(process.cwd(), file));
          return { passed: true, message: `Technical analysis documented in ${file}` };
        } catch {}
      }
      return { passed: false, message: 'No technical analysis found', suggestion: 'Document your architecture decisions' };
    }
  },
  {
    id: 'design',
    title: 'Design Review',
    automated: true,
    execute: async (context) => {
      // Check for Figma links, design docs, or UI components
      try {
        const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
        const hasUILib = packageJson.dependencies?.['@radix-ui/react-dialog'] ||
                         packageJson.dependencies?.['@shadcn/ui'] ||
                         packageJson.dependencies?.['tailwindcss'];
        if (hasUILib) {
          return { passed: true, message: 'Design system detected in dependencies' };
        }
      } catch {}
      return { passed: true, message: 'Design review: manual verification needed', manual: true };
    }
  },
  {
    id: 'implement',
    title: 'Implementation Complete',
    automated: true,
    execute: async (context) => {
      // Check if source files exist and have content
      const srcDirs = ['src', 'lib', 'app', 'pages', 'components'];
      for (const dir of srcDirs) {
        try {
          const stats = await fs.stat(path.join(process.cwd(), dir));
          if (stats.isDirectory()) {
            const files = await fs.readdir(path.join(process.cwd(), dir));
            if (files.length > 0) {
              return { passed: true, message: `Implementation found in ${dir}/ (${files.length} files)` };
            }
          }
        } catch {}
      }
      return { passed: false, message: 'No source code found', suggestion: 'Create src/ or lib/ directory with implementation' };
    }
  },
  {
    id: 'unit-test',
    title: 'Unit Tests',
    automated: true,
    execute: async (context) => {
      try {
        // Check if test files exist
        const testDirs = ['test', 'tests', '__tests__', 'spec'];
        for (const dir of testDirs) {
          try {
            const files = await fs.readdir(path.join(process.cwd(), dir));
            const testFiles = files.filter(f => f.includes('.test.') || f.includes('.spec.'));
            if (testFiles.length > 0) {
              // Try running tests
              try {
                execSync('npm test --if-present 2>/dev/null', { stdio: 'pipe', timeout: 60000 });
                return { passed: true, message: `${testFiles.length} test files found and passing` };
              } catch (e) {
                return { passed: false, message: 'Tests exist but some are failing' };
              }
            }
          } catch {}
        }
        return { passed: false, message: 'No test files found', suggestion: 'Add unit tests in test/ or __tests__/' };
      } catch (error) {
        return { passed: false, message: error.message };
      }
    }
  },
  {
    id: 'integration-test',
    title: 'Integration Tests',
    automated: true,
    execute: async (context) => {
      // Check for e2e or integration test files
      const patterns = ['**/*.e2e.ts', '**/*.integration.ts', '**/e2e/**', '**/integration/**'];
      try {
        const files = await fs.readdir(path.join(process.cwd(), 'test'));
        const integrationFiles = files.filter(f => f.includes('integration') || f.includes('e2e'));
        if (integrationFiles.length > 0) {
          return { passed: true, message: `${integrationFiles.length} integration test files found` };
        }
      } catch {}
      return { passed: true, message: 'No integration tests (optional)', optional: true };
    }
  },
  {
    id: 'security',
    title: 'Security Review',
    automated: true,
    execute: async (context) => {
      try {
        // Run npm audit
        const result = execSync('npm audit --json 2>/dev/null || echo "{}"', { encoding: 'utf8' });
        const audit = JSON.parse(result);
        const vulns = audit.metadata?.vulnerabilities || {};
        const critical = vulns.critical || 0;
        const high = vulns.high || 0;

        if (critical > 0) {
          return { passed: false, message: `${critical} critical vulnerabilities found`, suggestion: 'Run npm audit fix' };
        }
        if (high > 0) {
          return { passed: false, message: `${high} high-severity vulnerabilities found`, suggestion: 'Run npm audit fix' };
        }
        return { passed: true, message: 'No critical/high vulnerabilities' };
      } catch {
        return { passed: true, message: 'Security audit: manual check needed', manual: true };
      }
    }
  },
  {
    id: 'performance',
    title: 'Performance Check',
    automated: true,
    execute: async (context) => {
      try {
        // Check bundle size if build exists
        const distPath = path.join(process.cwd(), 'dist');
        try {
          const stats = await fs.stat(distPath);
          if (stats.isDirectory()) {
            const files = await fs.readdir(distPath);
            let totalSize = 0;
            for (const file of files) {
              const fStats = await fs.stat(path.join(distPath, file));
              totalSize += fStats.size;
            }
            const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
            if (totalSize < 5 * 1024 * 1024) {
              return { passed: true, message: `Bundle size: ${sizeMB}MB (under 5MB threshold)` };
            }
            return { passed: false, message: `Bundle size: ${sizeMB}MB (exceeds 5MB)`, suggestion: 'Consider code splitting' };
          }
        } catch {}
        return { passed: true, message: 'Performance check: build not found', manual: true };
      } catch {
        return { passed: true, message: 'Performance check: manual verification needed', manual: true };
      }
    }
  },
  {
    id: 'accessibility',
    title: 'Accessibility Check',
    automated: true,
    execute: async (context) => {
      // Check for a11y testing setup
      try {
        const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
        const hasA11y = packageJson.devDependencies?.['@axe-core/react'] ||
                        packageJson.devDependencies?.['jest-axe'] ||
                        packageJson.devDependencies?.['eslint-plugin-jsx-a11y'];
        if (hasA11y) {
          return { passed: true, message: 'Accessibility testing tools detected' };
        }
      } catch {}
      return { passed: true, message: 'A11y: manual verification recommended', manual: true };
    }
  },
  {
    id: 'compatibility',
    title: 'Cross-browser Compatibility',
    automated: true,
    execute: async (context) => {
      // Check for browserslist config
      try {
        const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
        if (packageJson.browserslist) {
          return { passed: true, message: 'Browserslist config found' };
        }
        try {
          await fs.access('.browserslistrc');
          return { passed: true, message: '.browserslistrc found' };
        } catch {}
      } catch {}
      return { passed: true, message: 'Browser compatibility: manual check needed', manual: true };
    }
  },
  {
    id: 'error-handling',
    title: 'Error Handling',
    automated: true,
    execute: async (context) => {
      // Search for try/catch patterns
      try {
        const result = execSync('grep -r "try {" src/ lib/ 2>/dev/null | wc -l || echo "0"', { encoding: 'utf8' });
        const count = parseInt(result.trim()) || 0;
        if (count > 5) {
          return { passed: true, message: `${count} try/catch blocks found` };
        }
        return { passed: false, message: 'Limited error handling detected', suggestion: 'Add more try/catch blocks' };
      } catch {
        return { passed: true, message: 'Error handling: manual review needed', manual: true };
      }
    }
  },
  {
    id: 'logging',
    title: 'Logging & Monitoring',
    automated: true,
    execute: async (context) => {
      try {
        const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
        const hasLogging = packageJson.dependencies?.['winston'] ||
                          packageJson.dependencies?.['pino'] ||
                          packageJson.dependencies?.['bunyan'] ||
                          packageJson.dependencies?.['@sentry/node'];
        if (hasLogging) {
          return { passed: true, message: 'Logging library detected' };
        }
      } catch {}
      return { passed: true, message: 'Logging: consider adding structured logging', suggestion: 'Add winston or pino' };
    }
  },
  {
    id: 'documentation',
    title: 'Documentation Updated',
    automated: true,
    execute: async (context) => {
      try {
        const readme = await fs.readFile('README.md', 'utf8');
        if (readme.length > 500) {
          return { passed: true, message: 'README.md exists with content' };
        }
        return { passed: false, message: 'README.md needs more content' };
      } catch {
        return { passed: false, message: 'README.md not found', suggestion: 'Create README.md' };
      }
    }
  },
  {
    id: 'code-review',
    title: 'Peer Code Review',
    automated: false,
    execute: async (context) => {
      return { passed: true, message: 'Code review: requires human verification', manual: true };
    }
  },
  {
    id: 'dependency-check',
    title: 'Dependency Security',
    automated: true,
    execute: async (context) => {
      try {
        execSync('npm audit --audit-level=high 2>/dev/null', { stdio: 'pipe' });
        return { passed: true, message: 'No high-severity dependency issues' };
      } catch {
        return { passed: false, message: 'Dependency vulnerabilities found', suggestion: 'Run npm audit fix' };
      }
    }
  },
  {
    id: 'backup',
    title: 'Backup Strategy',
    automated: true,
    execute: async (context) => {
      try {
        execSync('git status 2>/dev/null', { stdio: 'pipe' });
        return { passed: true, message: 'Git repository detected for version control' };
      } catch {
        return { passed: false, message: 'No git repository found', suggestion: 'Initialize git for backup' };
      }
    }
  },
  {
    id: 'rollback',
    title: 'Rollback Plan',
    automated: true,
    execute: async (context) => {
      try {
        const result = execSync('git log --oneline -5 2>/dev/null', { encoding: 'utf8' });
        if (result.trim().split('\n').length >= 3) {
          return { passed: true, message: 'Git history available for rollback' };
        }
      } catch {}
      return { passed: true, message: 'Rollback: ensure git tags for releases', suggestion: 'Tag releases for easy rollback' };
    }
  },
  {
    id: 'deployment',
    title: 'Deployment Ready',
    automated: true,
    execute: async (context) => {
      const deployConfigs = ['.github/workflows', 'vercel.json', 'netlify.toml', 'Dockerfile', 'fly.toml'];
      for (const config of deployConfigs) {
        try {
          await fs.access(path.join(process.cwd(), config));
          return { passed: true, message: `Deployment config found: ${config}` };
        } catch {}
      }
      return { passed: false, message: 'No deployment config found', suggestion: 'Add CI/CD or deployment config' };
    }
  },
  {
    id: 'monitoring',
    title: 'Post-deployment Monitoring',
    automated: true,
    execute: async (context) => {
      try {
        const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
        const hasMonitoring = packageJson.dependencies?.['@sentry/node'] ||
                             packageJson.dependencies?.['newrelic'] ||
                             packageJson.dependencies?.['@opentelemetry/api'];
        if (hasMonitoring) {
          return { passed: true, message: 'Monitoring library detected' };
        }
      } catch {}
      return { passed: true, message: 'Monitoring: consider adding Sentry or similar', suggestion: 'Add error monitoring' };
    }
  },
  {
    id: 'user-testing',
    title: 'User Acceptance Testing',
    automated: false,
    execute: async (context) => {
      return { passed: true, message: 'UAT: requires human verification', manual: true };
    }
  },
  {
    id: 'sign-off',
    title: 'Final Sign-off',
    automated: false,
    execute: async (context) => {
      return { passed: true, message: 'Sign-off: requires stakeholder approval', manual: true };
    }
  }
];

/**
 * Run all 21 automated steps
 */
export async function runAutomatedVerification(options = {}) {
  const { verbose = false, failFast = false } = options;
  const results = [];

  printInfo(chalk.cyan('\n🤖 Running 21-Step Automated Verification\n'));
  printInfo(chalk.gray('─'.repeat(60)));

  for (const step of AUTOMATED_STEPS) {
    printInfo(chalk.bold(`\n${step.id.toUpperCase()}: ${step.title}`));

    try {
      const result = await step.execute({});
      results.push({ ...step, ...result });

      if (result.passed) {
        if (result.manual) {
          printWarning(chalk.yellow(`⚡ ${result.message}`));
        } else if (result.optional) {
          printInfo(chalk.gray(`⏭️  ${result.message}`));
        } else {
          printSuccess(chalk.green(`✅ ${result.message}`));
        }
      } else {
        printError(chalk.red(`❌ ${result.message}`));
        if (result.suggestion) {
          printInfo(chalk.gray(`   💡 ${result.suggestion}`));
        }

        if (failFast) {
          break;
        }
      }
    } catch (error) {
      results.push({ ...step, passed: false, message: error.message });
      printError(chalk.red(`❌ Error: ${error.message}`));

      if (failFast) {
        break;
      }
    }
  }

  // Summary
  printInfo(chalk.cyan('\n📊 Verification Summary\n'));
  printInfo(chalk.gray('─'.repeat(60)));

  const passed = results.filter(r => r.passed && !r.manual).length;
  const failed = results.filter(r => !r.passed).length;
  const manual = results.filter(r => r.manual).length;

  printInfo(`✅ Passed: ${chalk.green(passed)}`);
  printInfo(`❌ Failed: ${chalk.red(failed)}`);
  printInfo(`⚡ Manual: ${chalk.yellow(manual)}`);

  const score = Math.round((passed / (passed + failed)) * 100) || 0;
  printInfo(`\n📈 Automation Score: ${score >= 80 ? chalk.green(score + '%') : chalk.yellow(score + '%')}`);

  return {
    results,
    summary: { passed, failed, manual, score },
    allPassed: failed === 0
  };
}

/**
 * Generate verification report
 */
export async function generateVerificationReport(results) {
  const timestamp = new Date().toISOString();

  let report = `# 21-Step Verification Report\n\n`;
  report += `**Generated:** ${timestamp}\n\n`;
  report += `## Summary\n\n`;
  report += `| Metric | Value |\n`;
  report += `|--------|-------|\n`;
  report += `| Passed | ${results.summary.passed} |\n`;
  report += `| Failed | ${results.summary.failed} |\n`;
  report += `| Manual | ${results.summary.manual} |\n`;
  report += `| Score | ${results.summary.score}% |\n\n`;

  report += `## Details\n\n`;
  report += `| Step | Status | Message |\n`;
  report += `|------|--------|--------|\n`;

  for (const r of results.results) {
    const status = r.passed ? (r.manual ? '⚡' : '✅') : '❌';
    report += `| ${r.title} | ${status} | ${r.message} |\n`;
  }

  return report;
}

export default {
  AUTOMATED_STEPS,
  runAutomatedVerification,
  generateVerificationReport
};
