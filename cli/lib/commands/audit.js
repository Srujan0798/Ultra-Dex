// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { pathExists } from '../utils/files.js';
import { githubWebUrl } from '../config/urls.js';
import { runQualityScan } from '../quality/scanner.js';
import { exportAuditLog } from '../governance/audit.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { ValidationError } from '../utils/errors.js';

/**
 * Register the audit command with Commander
 * @param {Command} program Commander program instance
 */
export function registerAuditCommand(program) {
  program
    .command('audit')
    .description('Comprehensive project audit for completeness, quality, and security')
    .option('-d, --dir <directory>', 'Project directory to audit', '.')
    .option('--report', 'Generate a detailed JSON report')
    .option('--fix', 'Attempt to fix missing documentation files')
    .option('--governance-export [format]', 'Export governance audit log (json|csv)')
    .option('--governance-since <date>', 'Export governance events since date (ISO)')
    .option('--governance-until <date>', 'Export governance events until date (ISO)')
    .option('--governance-output <file>', 'Write governance export to file')
    .action(async (options) => {
      try {
        if (options.governanceExport !== undefined) {
          const format =
            options.governanceExport === true ? 'json' : options.governanceExport || 'json';
          const exportResult = await exportAuditLog({
            format,
            since: options.governanceSince,
            until: options.governanceUntil,
            outputPath: options.governanceOutput,
          });

          if (exportResult.outputPath) {
            printSuccess(
              `\n✅ Governance audit exported to ${exportResult.outputPath} (${exportResult.count} events)\n`
            );
          } else {
            printInfo(exportResult.data);
          }
          return;
        }

        printInfo('\n🔍 Ultra-Dex Project Audit\n');

        const projectDir = path.resolve(options.dir ?? '.');
        try {
          const stat = await fs.stat(projectDir);
          if (!stat.isDirectory()) {
            throw new ValidationError('Project directory must be a folder');
          }
        } catch (error) {
          throw new ValidationError(`Project directory not found: ${projectDir}`);
        }

        if (options.fix) {
          await runAutoFixes(projectDir);
        }

        const auditContext = {
          score: 0,
          maxScore: 0,
          results: [],
          projectDir,
        };

        // 1. Structure Audit
        printInfo(chalk.bold('📊 STRUCTURE AUDIT\n'));
        await runStructureAudit(auditContext);

        // 2. Documentation Audit
        printInfo(chalk.bold('\n📄 DOCUMENTATION AUDIT\n'));
        await runDocumentationAudit(auditContext);

        // 2.5. Glass Box Drift Audit
        printInfo(chalk.bold('\n🔍 CONTEXT DRIFT AUDIT\n'));
        await runContextDriftAudit(auditContext);

        // 3. Security Audit
        printInfo(chalk.bold('\n🛡️  SECURITY SCAN\n'));
        await runSecurityAudit(auditContext);

        // 4. Summarize Results
        displayResults(auditContext);

        if (options.report) {
          await saveReport(auditContext);
        }

        process.exit(0);
      } catch (error) {
        await handleError(error, { command: 'audit', options });
        process.exitCode = error.exitCode || 1;
        process.exit(process.exitCode);
      }
    });
}

async function runContextDriftAudit(ctx) {
  try {
    const { execSync } = await import('child_process');
    const contextTime = execSync('git log -1 --format=%ct -- CONTEXT.md', {
      encoding: 'utf8',
    }).trim();
    const repoTime = execSync('git log -1 --format=%ct', { encoding: 'utf8' }).trim();

    ctx.maxScore += 10;

    if (!contextTime || !repoTime) {
      ctx.results.push({
        name: 'Context Drift',
        status: 'warn',
        detail: 'No git history available',
        points: 0,
      });
      return;
    }

    if (Number(repoTime) > Number(contextTime)) {
      ctx.results.push({
        name: 'Context Drift',
        status: 'warn',
        detail: 'Code changed after last CONTEXT.md update',
        points: 4,
      });
      ctx.score += 4;
    } else {
      ctx.results.push({
        name: 'Context Drift',
        status: 'ok',
        detail: 'CONTEXT.md is current',
        points: 10,
      });
      ctx.score += 10;
    }
  } catch (error) {
    ctx.results.push({
      name: 'Context Drift',
      status: 'warn',
      detail: `Git audit failed: ${error.message}`,
      points: 0,
    });
  }
}
/**
 * Automatically create missing required files
 */
async function runAutoFixes(projectDir) {
  printWarning('🛠️  Running auto-fixes...\n');
  const missingFiles = [
    'QUICK-START.md',
    'IMPLEMENTATION-PLAN.md',
    'CONTEXT.md',
    '.gitignore',
    '.env.example',
  ];
  for (const file of missingFiles) {
    const fullPath = path.join(projectDir, file);
    try {
      await fs.access(fullPath);
    } catch {
      printInfo(`   Creating ${file}...`);
      let content = `# ${file.replace('.md', '')}\n\nGenerated by ultra-dex audit --fix\n`;
      if (file === '.gitignore')
        content = 'node_modules\n.env\n.ultra-dex/logs\n.ultra-dex/state.lock\n';
      if (file === '.env.example')
        content = 'OPENAI_API_KEY=\nANTHROPIC_API_KEY=\nGEMINI_API_KEY=\n';

      await fs.writeFile(fullPath, content);
    }
  }
  printSuccess('\n✅ Auto-fixes complete.\n');
}

/**
 * Audit project structure and existence of key directories/files
 */
async function runStructureAudit(ctx) {
  const checks = [
    { file: 'package.json', desc: 'Node.js project manifest', points: 10 },
    { file: 'src', desc: 'Source directory', points: 5, type: 'dir' },
    { file: 'lib', desc: 'Library directory', points: 5, type: 'dir' },
    { file: 'test', desc: 'Test directory', points: 5, type: 'dir' },
    { file: '.gitignore', desc: 'Git ignore file', points: 5 },
    { file: '.env.example', desc: 'Environment template', points: 5 },
    { file: 'LICENSE', desc: 'Project license', points: 2 },
  ];

  for (const check of checks) {
    ctx.maxScore += check.points;
    const exists =
      check.type === 'dir'
        ? await pathExists(path.join(ctx.projectDir, check.file), 'dir')
        : await pathExists(path.join(ctx.projectDir, check.file), 'file');

    const displayName = check.type === 'dir' ? `${check.file}/` : check.file;
    if (exists) {
      ctx.score += check.points;
      ctx.results.push({
        category: 'Structure',
        status: '✅',
        item: check.desc,
        points: `+${check.points}`,
      });
      printSuccess(`  ✅ ${displayName} present`);
    } else {
      // Optional directories don't penalize as heavily if others exist
      const isOptionalDir = ['src', 'lib'].includes(check.file);
      const status = isOptionalDir ? '⚠️' : '❌';
      ctx.results.push({
        category: 'Structure',
        status,
        item: `${check.desc} (Missing)`,
        points: '0',
      });
      if (status === '❌') printError(`  ❌ ${displayName} missing`);
      else printWarning(`  ⚠️  ${displayName} missing (recommended)`);
    }
  }
}

/**
 * Audit documentation quality and content
 */
async function runDocumentationAudit(ctx) {
  const docs = [
    {
      file: 'README.md',
      desc: 'Main Readme',
      points: 10,
      sections: ['installation', 'usage', 'features'],
    },
    {
      file: 'QUICK-START.md',
      desc: 'Onboarding Guide',
      points: 10,
      sections: ['idea', 'tech stack', 'mvp'],
    },
    { file: 'CONTEXT.md', desc: 'Project Memory', points: 5, sections: ['purpose', 'state'] },
    {
      file: 'IMPLEMENTATION-PLAN.md',
      desc: 'Execution Path',
      points: 5,
      sections: ['phase', 'step'],
    },
  ];

  for (const doc of docs) {
    ctx.maxScore += doc.points;
    try {
      const fullPath = path.join(ctx.projectDir, doc.file);
      const content = await fs.readFile(fullPath, 'utf-8');

      if (content.trim().length > 50) {
        ctx.score += doc.points;
        ctx.results.push({
          category: 'Docs',
          status: '✅',
          item: doc.desc,
          points: `+${doc.points}`,
        });
        printSuccess(`  ✅ ${doc.file} is healthy`);

        // Check sections
        for (const section of doc.sections) {
          ctx.maxScore += 2;
          if (content.toLowerCase().includes(section.toLowerCase())) {
            ctx.score += 2;
            ctx.results.push({
              category: 'Docs',
              status: '✅',
              item: `Section: ${section} in ${doc.file}`,
              points: '+2',
            });
          } else {
            ctx.results.push({
              category: 'Docs',
              status: '⚠️',
              item: `Missing section: ${section} in ${doc.file}`,
              points: '0',
            });
          }
        }
      } else {
        ctx.results.push({
          category: 'Docs',
          status: '⚠️',
          item: `${doc.desc} is too short`,
          points: '0',
        });
        printWarning(`  ⚠️  ${doc.file} is too sparse`);
      }
    } catch {
      ctx.results.push({
        category: 'Docs',
        status: '❌',
        item: `${doc.desc} (Missing)`,
        points: '0',
      });
      printError(`  ❌ ${doc.file} missing`);
    }
  }
}

/**
 * Audit code quality and security
 */
async function runSecurityAudit(ctx) {
  try {
    const scanResults = await runQualityScan(ctx.projectDir);
    const scanMaxPoints = 50;
    ctx.maxScore += scanMaxPoints;

    let codeScore = scanMaxPoints;
    const issues = scanResults.details || [];

    issues.forEach((issue) => {
      if (issue.severity === 'critical') codeScore -= 10;
      else if (issue.severity === 'error') codeScore -= 5;
      else if (issue.severity === 'warning') codeScore -= 2;
    });

    codeScore = Math.max(0, codeScore);
    ctx.score += codeScore;
    ctx.scanResults = scanResults;

    if (issues.length === 0) {
      printSuccess('  ✅ No security vulnerabilities or quality issues found.');
    } else {
      const criticals = issues.filter((i) => i.severity === 'critical' || i.severity === 'error');
      if (criticals.length > 0) {
        printError(`  ❌ Found ${criticals.length} critical issues!`);
      } else {
        printWarning(`  ⚠️  Found ${issues.length} minor issues.`);
      }

      issues.slice(0, 5).forEach((issue) => {
        const icon = issue.severity === 'critical' || issue.severity === 'error' ? '❌' : '⚠️';
        printError(
          `     ${icon} [${issue.severity.toUpperCase()}] ${issue.file}:${issue.line || ''} - ${issue.message}`
        );
      });
    }
  } catch (error) {
    printError('  ❌ Security scan failed to execute.');
    ctx.maxScore += 50;
  }
}

/**
 * Display the audit summary and grade
 */
function displayResults(ctx) {
  printInfo(chalk.bold('\nAudit Summary:\n'));

  const percentage = Math.round((ctx.score / ctx.maxScore) * 100);

  let grade, gradeColor, message;
  if (percentage >= 90) {
    grade = 'A';
    gradeColor = chalk.green;
    message = 'Excellent! Your project is production-ready.';
  } else if (percentage >= 75) {
    grade = 'B';
    gradeColor = chalk.green;
    message = 'Good! Solid foundation, a few minor gaps.';
  } else if (percentage >= 60) {
    grade = 'C';
    gradeColor = chalk.yellow;
    message = 'Fair. Address highlighted issues.';
  } else if (percentage >= 40) {
    grade = 'D';
    gradeColor = chalk.yellow;
    message = 'Needs work. Focus on documentation and security.';
  } else {
    grade = 'F';
    gradeColor = chalk.red;
    message = 'Critical gaps found. Highly recommend a re-init.';
  }

  printInfo(chalk.bold('─'.repeat(50)));
  printInfo(`\nScore: ${ctx.score}/${ctx.maxScore} (${percentage}%)`);
  printInfo(gradeColor(`Grade: ${grade}`));
  printInfo(chalk.gray(message));
  printInfo('');

  const criticalItems = ctx.results.filter((r) => r.status === '❌');
  if (criticalItems.length > 0) {
    printInfo(chalk.bold('Top Priorities:'));
    criticalItems.slice(0, 3).forEach((item) => {
      printInfo(chalk.cyan(`  → Fix: ${item.item}`));
    });
  }

  printInfo(`\n${chalk.gray(`Documentation: ${githubWebUrl()}`)}\n`);
}

/**
 * Save audit results to a JSON file
 */
async function saveReport(ctx) {
  const reportPath = path.join(ctx.projectDir, 'audit-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    score: ctx.score,
    maxScore: ctx.maxScore,
    percentage: Math.round((ctx.score / ctx.maxScore) * 100),
    results: ctx.results,
    security: ctx.scanResults,
  };
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  printSuccess(`\n📝 Detailed report saved to: ${reportPath}`);
}
