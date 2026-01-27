import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { validateSafePath } from '../utils/validation.js';
import { runQualityScan } from '../quality/scanner.js';

export function registerValidateCommand(program) {
  program
    .command('validate')
    .description('Validate project structure against Ultra-Dex standards')
    .option('-d, --dir <directory>', 'Project directory to validate', '.')
    .option('--scan', 'Run deep code quality scan')
    .action(async (options) => {
      console.log(chalk.cyan('\n✅ Ultra-Dex Structure Validator\n'));

      const dirValidation = validateSafePath(options.dir, 'Project directory');
      if (dirValidation !== true) {
        console.log(chalk.red(dirValidation));
        process.exit(1);
      }

      const projectDir = path.resolve(options.dir);
      let passed = 0;
      let failed = 0;
      const warnings = [];

      async function checkExists(itemPath, type = 'file') {
        try {
          const stats = await fs.stat(path.join(projectDir, itemPath));
          if (type === 'file' && stats.isFile()) return true;
          if (type === 'dir' && stats.isDirectory()) return true;
          return false;
        } catch {
          return false;
        }
      }

      console.log(chalk.bold('Checking required files...\n'));

      const coreFiles = [
        { path: 'QUICK-START.md', required: true },
        { path: 'IMPLEMENTATION-PLAN.md', required: true },
        { path: 'CONTEXT.md', required: false },
        { path: 'README.md', required: false },
      ];

      for (const file of coreFiles) {
        const exists = await checkExists(file.path);
        if (exists) {
          passed++;
          console.log(chalk.green(`  ✅ ${file.path}`));
        } else if (file.required) {
          failed++;
          console.log(chalk.red(`  ❌ ${file.path} (required)`));
        } else {
          warnings.push(file.path);
          console.log(chalk.yellow(`  ⚠️  ${file.path} (recommended)`));
        }
      }

      console.log(chalk.bold('\nChecking directory structure...\n'));

      const directories = [
        { path: 'docs', required: false },
        { path: '.agents', required: false },
        { path: '.cursor/rules', required: false },
      ];

      for (const dir of directories) {
        const exists = await checkExists(dir.path, 'dir');
        if (exists) {
          passed++;
          console.log(chalk.green(`  ✅ ${dir.path}/`));
        } else {
          warnings.push(dir.path);
          console.log(chalk.yellow(`  ⚠️  ${dir.path}/ (optional)`));
        }
      }

      console.log(chalk.bold('\nValidating content quality...\n'));

      try {
        const quickStart = await fs.readFile(path.join(projectDir, 'QUICK-START.md'), 'utf-8');

        const sections = ['idea', 'problem', 'feature', 'tech stack', 'tasks'];
        let sectionsFound = 0;

        sections.forEach(section => {
          if (quickStart.toLowerCase().includes(section)) {
            sectionsFound++;
          }
        });

        if (sectionsFound >= 4) {
          passed++;
          console.log(chalk.green(`  ✅ QUICK-START.md has ${sectionsFound}/${sections.length} key sections`));
        } else {
          failed++;
          console.log(chalk.red(`  ❌ QUICK-START.md missing key sections (${sectionsFound}/${sections.length})`));
        }
      } catch {
        console.log(chalk.gray('  ⊘  Could not validate QUICK-START.md content'));
      }

      try {
        const implPlan = await fs.readFile(path.join(projectDir, 'IMPLEMENTATION-PLAN.md'), 'utf-8');

        if (implPlan.length > 500) {
          passed++;
          console.log(chalk.green('  ✅ IMPLEMENTATION-PLAN.md has substantial content'));
        } else {
          warnings.push('IMPLEMENTATION-PLAN.md needs more detail');
          console.log(chalk.yellow(`  ⚠️  IMPLEMENTATION-PLAN.md is sparse (${implPlan.length} chars)`));
        }
      } catch {
        console.log(chalk.gray('  ⊘  Could not validate IMPLEMENTATION-PLAN.md content'));
      }

      // Deep Code Scan
      if (options.scan) {
        console.log(chalk.bold('\nRunning Deep Code Scan (Active State Tracking)...\n'));
        const scanResults = await runQualityScan(projectDir);
        
        if (scanResults.failed > 0) {
          failed += scanResults.failed;
          console.log(chalk.red(`  ❌ Code Scan Failed: ${scanResults.failed} critical issues found.`));
        } else {
          passed++;
          console.log(chalk.green(`  ✅ Code Scan Passed (${scanResults.filesScanned} files scanned).`));
        }

        if (scanResults.warnings > 0) {
          console.log(chalk.yellow(`  ⚠️  ${scanResults.warnings} code warnings found.`));
        }

        if (scanResults.details.length > 0) {
          console.log(chalk.gray('\n  Scan Details:'));
          scanResults.details.forEach(issue => {
            const icon = issue.severity === 'error' || issue.severity === 'critical' ? '❌' : '⚠️';
            console.log(`    ${icon} [${issue.ruleName}] ${issue.file}: ${issue.message}`);
          });
        }
      } else {
        console.log(chalk.gray('\nℹ️  Run with --scan to enable Deep Code Quality Scan.'));
      }

      console.log('\n' + chalk.bold('─'.repeat(50)));
      console.log(chalk.bold('\nValidation Summary:\n'));
      console.log(chalk.green(`  ✅ Passed: ${passed}`));
      console.log(chalk.red(`  ❌ Failed: ${failed}`));
      console.log(chalk.yellow(`  ⚠️  Warnings: ${warnings.length}`));

      if (failed === 0) {
        console.log(chalk.bold.green('\n✅ VALIDATION PASSED\n'));
        console.log(chalk.gray('Your project structure follows Ultra-Dex standards.'));
      } else {
        console.log(chalk.bold.yellow('\n⚠️  VALIDATION INCOMPLETE\n'));
        console.log(chalk.gray('Fix required files to meet Ultra-Dex standards.'));
        if (options.scan && failed > 0) {
           console.log(chalk.red('Code quality gates failed. Commit rejected (if in pre-commit).'));
        }
        process.exit(1);
      }

      if (warnings.length > 0) {
        console.log(chalk.bold('\n💡 Recommendations:\n'));
        warnings.slice(0, 3).forEach(w => {
          console.log(chalk.cyan(`  → Consider adding ${w}`));
        });
      }

      console.log('\n' + chalk.gray('Run "ultra-dex init" to set up a proper Ultra-Dex project.\n'));
    });
}
