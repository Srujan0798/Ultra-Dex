import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { validateSafePath } from '../utils/validation.js';
import { githubWebUrl } from '../config/urls.js';

export function registerAuditCommand(program) {
  program
    .command('audit')
    .description('Audit your Ultra-Dex project for completeness')
    .option('-d, --dir <directory>', 'Project directory to audit', '.')
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

      async function checkFile(filePath, description, points) {
        maxScore += points;
        try {
          const content = await fs.readFile(path.join(projectDir, filePath), 'utf-8');
          if (content.length > 50) {
            score += points;
            results.push({ status: '✅', item: description, points: `+${points}` });
            return content;
          } else {
            results.push({ status: '⚠️', item: `${description} (empty/too short)`, points: '0' });
            return null;
          }
        } catch {
          results.push({ status: '❌', item: `${description} (missing)`, points: '0' });
          return null;
        }
      }

      function hasSection(content, sectionName, points) {
        maxScore += points;
        if (content && content.toLowerCase().includes(sectionName.toLowerCase())) {
          score += points;
          results.push({ status: '✅', item: `Has ${sectionName}`, points: `+${points}` });
          return true;
        } else {
          results.push({ status: '❌', item: `Missing ${sectionName}`, points: '0' });
          return false;
        }
      }

      console.log(chalk.bold('Checking project files...\n'));

      const quickStart = await checkFile('QUICK-START.md', 'QUICK-START.md', 10);
      const context = await checkFile('CONTEXT.md', 'CONTEXT.md', 5);
      const implPlan = await checkFile('IMPLEMENTATION-PLAN.md', 'IMPLEMENTATION-PLAN.md', 5);
      const fullTemplate = await checkFile('04-Imp-Template.md', '04-Imp-Template.md', 10);

      const readme = await checkFile('README.md', 'README.md', 5);

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
        results.push({ status: '✅', item: 'docs/ folder exists', points: '+5' });
      } catch {
        maxScore += 5;
        results.push({ status: '⚠️', item: 'docs/ folder (optional)', points: '0' });
      }

      console.log(chalk.bold('Audit Results:\n'));
      results.forEach(r => {
        const statusColor = r.status === '✅' ? chalk.green : r.status === '❌' ? chalk.red : chalk.yellow;
        console.log(`  ${statusColor(r.status)} ${r.item} ${chalk.gray(r.points)}`);
      });

      const percentage = Math.round((score / maxScore) * 100);

      console.log('\n' + chalk.bold('─'.repeat(50)));
      console.log(chalk.bold(`\nScore: ${score}/${maxScore} (${percentage}%)\n`));

      let grade, gradeColor, message;
      if (percentage >= 90) {
        grade = 'A';
        gradeColor = chalk.green;
        message = 'Excellent! Your project is well-documented.';
      } else if (percentage >= 75) {
        grade = 'B';
        gradeColor = chalk.green;
        message = 'Good! A few more sections would help.';
      } else if (percentage >= 60) {
        grade = 'C';
        gradeColor = chalk.yellow;
        message = 'Fair. Consider filling more sections before coding.';
      } else if (percentage >= 40) {
        grade = 'D';
        gradeColor = chalk.yellow;
        message = 'Needs work. Use QUICK-START.md to define your project.';
      } else {
        grade = 'F';
        gradeColor = chalk.red;
        message = 'Run "npx ultra-dex init" to get started properly.';
      }

      console.log(gradeColor(`Grade: ${grade}`));
      console.log(chalk.gray(message));

      const missing = results.filter(r => r.status === '❌');
      if (missing.length > 0) {
        console.log(chalk.bold('\n📋 To improve your score:\n'));
        missing.slice(0, 5).forEach(m => {
          console.log(chalk.cyan(`  → Add ${m.item.replace(' (missing)', '')}`));
        });
      }

      console.log(`\n${chalk.gray(`Learn more: ${githubWebUrl('')}`)}\n`);
    });
}
