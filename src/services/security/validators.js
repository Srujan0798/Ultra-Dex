// Copyright (c) 2026 Ultra-Dex

/**
 * Security Validators
 * Performs static analysis on agent-generated code before execution.
 */

import chalk from 'chalk';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

/**
 * Security Validators
 * Performs static analysis on agent-generated code before execution.
 */
export class CodeValidator {
  constructor() {
    this.riskyPatterns = [
      { pattern: /eval\s*\(/, name: 'Eval Usage', severity: 'HIGH', description: 'Execution of arbitrary strings as code' },
      { pattern: /process\.env/, name: 'Environment Access', severity: 'MEDIUM', description: 'Accessing sensitive environment variables' },
      { pattern: /child_process/, name: 'Subprocess Execution', severity: 'HIGH', description: 'Spawning shell commands' },
      { pattern: /rm\s+-rf/, name: 'Recursive Deletion', severity: 'CRITICAL', description: 'Dangerous filesystem deletion' },
      { pattern: /axios|fetch|http|https/, name: 'Network Activity', severity: 'MEDIUM', description: 'Outbound network requests' },
      { pattern: /[a-zA-Z0-9+/]{40,}/, name: 'Possible Secret Leak', severity: 'HIGH', description: 'High-entropy string detected' },
    ];
  }

  /**
   * Validate code for security risks
   */
  validate(code, language = 'javascript') {
    const findings = [];

    // 1. Regex-based Scan (Generic)
    for (const rule of this.riskyPatterns) {
      if (rule.pattern.test(code)) {
        findings.push(rule);
      }
    }

    // 2. AST-based Scan (JavaScript/TypeScript specific)
    if (language === 'javascript' || language === 'typescript') {
      try {
        const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
        
        walk.simple(ast, {
          CallExpression(node) {
            if (node.callee.name === 'eval') {
              findings.push({ name: 'AST: eval() call', severity: 'HIGH', description: 'Direct call to eval function detected in AST' });
            }
            if (node.callee.name === 'require' && node.arguments[0]?.value === 'child_process') {
              findings.push({ name: 'AST: child_process import', severity: 'HIGH', description: 'Importing child_process via require' });
            }
          },
          MemberExpression(node) {
            if (node.object.name === 'process' && node.property.name === 'exit') {
              findings.push({ name: 'AST: process.exit()', severity: 'LOW', description: 'Agent attempting to terminate process' });
            }
          }
        });
      } catch (e) {
        // If parsing fails, we rely on regex scan (parsing might fail for snippets or TS)
        findings.push({ name: 'AST Parse Warning', severity: 'LOW', description: 'Could not perform full AST scan (syntax issue or TS)' });
      }
    }

    return {
      safe: findings.filter(f => ['HIGH', 'CRITICAL'].includes(f.severity)).length === 0,
      findings: this.deduplicateFindings(findings)
    };
  }

  deduplicateFindings(findings) {
    const seen = new Set();
    return findings.filter(f => {
      const key = `${f.name}-${f.severity}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Print validation report
   */
  report(validationResult) {
    if (validationResult.safe) {
      if (validationResult.findings.length > 0) {
        console.log(chalk.yellow('⚠️ Code validation passed with warnings:'));
        for (const finding of validationResult.findings) {
          console.log(chalk.gray(`  - [${finding.severity}] ${finding.name}: ${finding.description}`));
        }
      } else {
        console.log(chalk.green('✅ Code validation passed. No risks found.'));
      }
    } else {
      console.log(chalk.red('❌ Code validation failed! Critical security risks detected:'));
      for (const finding of validationResult.findings) {
        const color = finding.severity === 'CRITICAL' ? chalk.red.bold : chalk.red;
        console.log(color(`  - [${finding.severity}] ${finding.name}`));
        console.log(chalk.gray(`    ${finding.description}`));
      }
    }
  }
}

export const codeValidator = new CodeValidator();