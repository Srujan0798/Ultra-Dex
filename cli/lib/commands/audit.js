import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { validateSafePath } from '../utils/validation.js';
import { githubWebUrl } from '../config/urls.js';
import { runQualityScan } from '../quality/scanner.js';

export function registerAuditCommand(program) {
  program
    .command('audit')
    .description('Audit your Ultra-Dex project for completeness, quality, and security')
    .option('-d, --dir <directory>', 'Project directory to audit', '.')
    .option('--report', 'Generate a detailed JSON report')
    .action(async (options) => {
      console.log(chalk.cyan('\n🔍 Ultra-Dex Project Audit\n'));

      const dirValidation = validateSafePath(options.dir, 'Project directory');
      if (dirValidation !== true) {
        console.log(chalk.red(dirValidation));
        process.exit(1);
      }

      const projectDir = path.resolve(options.dir);
      let score = 0;
      let maxScore = 0;
      const results = [];

      // --- DOCUMENTATION AUDIT ---
      async function checkFile(filePath, description, points) {
        maxScore += points;
        try {
          const content = await fs.readFile(path.join(projectDir, filePath), 'utf-8');
          if (content.length > 50) {
            score += points;
            results.push({ category: 'Docs', status: '✅', item: description, points: `+${points}` });
            return content;
          } else {
            results.push({ category: 'Docs', status: '⚠️', item: `${description} (empty/too short)`, points: '0' });
            return null;
          }
        } catch {
          results.push({ category: 'Docs', status: '❌', item: `${description} (missing)`, points: '0' });
          return null;
        }
      }

      function hasSection(content, sectionName, points) {
        maxScore += points;
        if (content && content.toLowerCase().includes(sectionName.toLowerCase())) {
          score += points;
          results.push({ category: 'Docs', status: '✅', item: `Has ${sectionName}`, points: `+${points}` });
          return true;
        } else {
          results.push({ category: 'Docs', status: '❌', item: `Missing ${sectionName}`, points: '0' });
          return false;
        }
      }

      console.log(chalk.bold('1. Documentation Audit\n'));

      const quickStart = await checkFile('QUICK-START.md', 'QUICK-START.md', 10);
      await checkFile('CONTEXT.md', 'CONTEXT.md', 5);
      const implPlan = await checkFile('IMPLEMENTATION-PLAN.md', 'IMPLEMENTATION-PLAN.md', 5);
      await checkFile('04-Imp-Template.md', '04-Imp-Template.md', 10);
      await checkFile('README.md', 'README.md', 5);

      if (quickStart) {
        hasSection(quickStart, 'idea', 5);
        hasSection(quickStart, 'problem', 5);
        hasSection(quickStart, 'mvp', 5);
        hasSection(quickStart, 'tech stack', 10);
        hasSection(quickStart, 'feature', 5);
      }

      if (implPlan) {
        hasSection(implPlan, 'database', 5);
        hasSection(implPlan, 'api', 5);
        hasSection(implPlan, 'auth', 5);
      }

      try {
        await fs.access(path.join(projectDir, 'docs'));
        score += 5;
        maxScore += 5;
        results.push({ category: 'Docs', status: '✅', item: 'docs/ folder exists', points: '+5' });
      } catch {
        maxScore += 5;
        results.push({ category: 'Docs', status: '⚠️', item: 'docs/ folder (optional)', points: '0' });
      }

      // --- CODE QUALITY & SECURITY AUDIT ---
      console.log(chalk.bold('\n2. Code Quality & Security Scan\n'));
      
      const scanResults = await runQualityScan(projectDir);
      const scanMaxPoints = 50;
      maxScore += scanMaxPoints;
      
      // Calculate code score: Start with full points, deduct for issues
      // Critical: -5, Error: -3, Warning: -1
      let codeScore = scanMaxPoints;
      const issues = [];

      scanResults.details.forEach(issue => {
          if (issue.severity === 'critical') codeScore -= 5;
          else if (issue.severity === 'error') codeScore -= 3;
          else if (issue.severity === 'warning') codeScore -= 1;
          issues.push(issue);
      });
      codeScore = Math.max(0, codeScore);
      score += codeScore;

      if (scanResults.failed === 0 && scanResults.warnings === 0) {
          results.push({ category: 'Code', status: '✅', item: 'Clean Code Scan', points: `+${scanMaxPoints}` });
          console.log(chalk.green('  ✅ No issues found. Clean code!'));
      } else {
          results.push({ category: 'Code', status: scanResults.failed > 0 ? '❌' : '⚠️', item: `Code Issues (${scanResults.failed} failed, ${scanResults.warnings} warnings)`, points: `+${codeScore}` });
          
          issues.forEach(issue => {
              const icon = issue.severity === 'critical' || issue.severity === 'error' ? '❌' : '⚠️';
              const color = issue.severity === 'critical' ? chalk.red.bold : issue.severity === 'error' ? chalk.red : chalk.yellow;
              console.log(`  ${icon} ${color(`[${issue.severity.toUpperCase()}]`)} ${issue.file}: ${issue.message}`);
          });
      }

      // --- RESULTS ---
      console.log(chalk.bold('\nAudit Results:\n'));
      results.forEach(r => {
        const statusColor = r.status === '✅' ? chalk.green : r.status === '❌' ? chalk.red : chalk.yellow;
        console.log(`  ${statusColor(r.status)} [${r.category}] ${r.item} ${chalk.gray(r.points)}`);
      });

      const percentage = Math.round((score / maxScore) * 100);

      console.log('\n' + chalk.bold('─'.repeat(50)));
      console.log(chalk.bold(`\nScore: ${score}/${maxScore} (${percentage}%)\n`));

      let grade, gradeColor, message;
      if (percentage >= 90) {
        grade = 'A';
        gradeColor = chalk.green;
        message = 'Excellent! Your project is well-documented and secure.';
      } else if (percentage >= 75) {
        grade = 'B';
        gradeColor = chalk.green;
        message = 'Good! A few improvements needed.';
      } else if (percentage >= 60) {
        grade = 'C';
        gradeColor = chalk.yellow;
        message = 'Fair. Address critical issues and documentation gaps.';
      } else if (percentage >= 40) {
        grade = 'D';
        gradeColor = chalk.yellow;
        message = 'Needs work. Focus on structure and basic quality.';
      } else {
        grade = 'F';
        gradeColor = chalk.red;
        message = 'Run "npx ultra-dex init" and fix critical errors.';
      }

      console.log(gradeColor(`Grade: ${grade}`));
      console.log(chalk.gray(message));

      if (options.report) {
          const report = {
              timestamp: new Date().toISOString(),
              score,
              maxScore,
              percentage,
              grade,
              results,
              scanDetails: scanResults.details
          };
          const reportPath = path.join(projectDir, 'audit-report.json');
          await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
          console.log(chalk.blue(`\n📝 Report saved to: ${reportPath}`));
      }

      const missing = results.filter(r => r.status === '❌');
      if (missing.length > 0 || issues.length > 0) {
        console.log(chalk.bold('\n📋 Action Items:\n'));
        missing.slice(0, 3).forEach(m => {
          console.log(chalk.cyan(`  → Add ${m.item.replace(' (missing)', '')}`));
        });
        if (issues.length > 0) {
            console.log(chalk.cyan(`  → Fix ${issues.length} code issues (run 'ultra-dex validate --scan')`));
        }
      }

      console.log(`\n${chalk.gray(`Learn more: ${githubWebUrl()}`)}\n`);
    });
}
