// Copyright (c) 2026 Ultra-Dex

/**
 * Security Validators
 * Performs static analysis on agent-generated code before execution.
 */

import chalk from 'chalk';

export class CodeValidator {
  constructor() {
    this.riskyPatterns = [
      { pattern: /eval\s*\(/, name: 'Eval Usage', severity: 'HIGH' },
      { pattern: /process\.env/, name: 'Environment Access', severity: 'MEDIUM' },
      { pattern: /child_process/, name: 'Subprocess Execution', severity: 'HIGH' },
      { pattern: /fs\.\w*Sync/, name: 'Synchronous File I/O', severity: 'LOW' },
      { pattern: /rm\s+-rf/, name: 'Recursive Deletion', severity: 'CRITICAL' },
    ];
  }

  /**
   * Validate code for security risks
   */
  validate(code, language = 'javascript') {
    const findings = [];

    for (const rule of this.riskyPatterns) {
      if (rule.pattern.test(code)) {
        findings.push(rule);
      }
    }

    return {
      safe: findings.filter(f => ['HIGH', 'CRITICAL'].includes(f.severity)).length === 0,
      findings
    };
  }

  /**
   * Print validation report
   */
  report(validationResult) {
    if (validationResult.safe) {
      console.log(chalk.green('✅ Code validation passed. No critical risks found.'));
    } else {
      console.log(chalk.red('❌ Code validation failed! Critical security risks detected:'));
      for (const finding of validationResult.findings) {
        console.log(chalk.yellow(`  - [${finding.severity}] ${finding.name}`));
      }
    }
  }
}

export const codeValidator = new CodeValidator();