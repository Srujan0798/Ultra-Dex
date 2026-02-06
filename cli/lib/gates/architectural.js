// Copyright (c) 2026 Ultra-Dex

/**
 * Architectural Pattern Enforcement Gates
 * Provides semantic analysis for code quality and security
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { glob } from 'glob';

export async function runArchitecturalGates(projectDir = process.cwd()) {
  console.log(chalk.bold('\n🏛️  Running Architectural Gates...\n'));

  const files = await glob('**/*.{js,ts,py,go}', {
    ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
    nodir: true,
    cwd: projectDir,
  });

  const violations = [];

  for (const file of files) {
    const fullPath = path.join(projectDir, file);
    const content = await fs.readFile(fullPath, 'utf8');

    // 1. Banned Patterns (Forbidden imports/code)
    if (content.includes('console.log')) {
      violations.push({ file, type: 'BANNED_PATTERN', message: 'Forbidden console.log found' });
    }

    // 2. Required Patterns (Must have try/catch for async functions)
    if (
      content.includes('async function') &&
      !content.includes('try') &&
      !content.includes('catch')
    ) {
      violations.push({
        file,
        type: 'REQUIRED_PATTERN',
        message: 'Async function missing error handling (try/catch)',
      });
    }

    // 3. Security (Secret Scanning)
    const secretRegex =
      /(?:key|secret|password|token|api_key)\s*[:=]\s*['"][a-zA-Z0-9_\-\.]{10,}['"]/i;
    if (secretRegex.test(content)) {
      violations.push({
        file,
        type: 'SECURITY_RISK',
        message: 'Potential hardcoded secret or API key detected',
      });
    }
  }

  if (violations.length > 0) {
    console.error(chalk.red(`\n✕ Architectural violations detected (${violations.length}):`));
    violations.slice(0, 10).forEach((v) => {
      console.error(chalk.red(`  • [${v.type}] ${v.file}: ${v.message}`));
    });
    if (violations.length > 10)
      console.log(chalk.gray(`    ... and ${violations.length - 10} more`));
    return { ok: false, violations };
  }

  console.log(chalk.green('\n✅ Architectural patterns verified.\n'));
  return { ok: true };
}
