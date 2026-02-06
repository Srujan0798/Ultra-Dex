// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import fs from 'fs/promises';
import Table from 'cli-table3';
import { loadState } from './state.js';

/**
 * Enhanced Check Command v2.0
 * Comprehensive completeness validation with 21-step verification integration
 */

export function registerEnhancedCheckCommand(program) {
  program
    .command('check')
    .description('Comprehensive plan completeness check with 21-step verification')
    .option('--p0-only', 'Check only critical (P0) sections')
    .option('--section <num>', 'Check specific section number')
    .option('--json', 'Output as JSON')
    .option('--fix', 'Suggest fixes for missing content')
    .option('--verify', 'Run 21-step verification alongside check')
    .action(async (options) => {
      try {
        console.log(chalk.cyan.bold('\n🔍 Ultra-Dex Completeness & Verification Check\n'));

        // Load implementation plan
        const planPath = './IMPLEMENTATION-PLAN.md';
        let planContent;
        try {
          planContent = await fs.readFile(planPath, 'utf8');
        } catch {
          console.log(chalk.red('❌ IMPLEMENTATION-PLAN.md not found'));
          console.log(chalk.gray('   Run: ultra-dex init to create one\n'));
          return;
        }

        // Check CONTEXT.md
        const contextPath = './CONTEXT.md';
        try {
          const contextContent = await fs.readFile(contextPath, 'utf8');
          if (contextContent.trim().length < 50) {
            console.log(chalk.yellow('⚠️  CONTEXT.md is nearly empty'));
            console.log(chalk.gray('   Run: ultra-dex init to regenerate it\n'));
          }
        } catch {
          console.log(chalk.red('❌ CONTEXT.md not found'));
          console.log(chalk.gray('   Run: ultra-dex init to create one\n'));
        }

        // Parse sections
        const sections = parseSections(planContent);

        // Define P0 sections (critical for MVP)
        const p0Sections = [1, 2, 4, 6, 9, 10, 11, 12, 15, 16, 19, 20, 21];

        // Filter sections to check
        const sectionsToCheck = options.p0Only
          ? sections.filter((s) => p0Sections.includes(s.number))
          : sections;

        // Check each section
        const results = [];
        let complete = 0;
        let partial = 0;
        let missing = 0;

        for (const section of sectionsToCheck) {
          const result = analyzeSection(section);
          results.push(result);

          if (result.status === 'complete') complete++;
          else if (result.status === 'partial') partial++;
          else missing++;
        }

        // Display results
        if (options.json) {
          console.log(
            JSON.stringify(
              {
                total: sectionsToCheck.length,
                complete,
                partial,
                missing,
                percentage: Math.round((complete / sectionsToCheck.length) * 100),
                sections: results,
                verification: options.verify ? await runVerification() : null,
              },
              null,
              2
            )
          );
          return;
        }

        // Table output
        const table = new Table({
          head: ['Section', 'Status', 'Completeness', 'Issues'],
          colWidths: [30, 12, 15, 40],
          style: { head: ['cyan'] },
        });

        results.forEach((r) => {
          const status =
            r.status === 'complete'
              ? chalk.green('✓')
              : r.status === 'partial'
                ? chalk.yellow('◐')
                : chalk.red('✗');

          table.push([
            `Section ${r.number}: ${r.title.substring(0, 20)}`,
            status,
            `${r.percentage}%`,
            r.issues.join(', ').substring(0, 38) || '-',
          ]);
        });

        console.log(table.toString());

        // Summary
        const totalPercentage = Math.round((complete / sectionsToCheck.length) * 100);
        console.log(chalk.bold('\n📊 Summary:'));
        console.log(`  Total Sections: ${sectionsToCheck.length}`);
        console.log(chalk.green(`  Complete: ${complete}`));
        console.log(chalk.yellow(`  Partial: ${partial}`));
        console.log(chalk.red(`  Missing: ${missing}`));
        console.log(chalk.cyan(`  Overall: ${totalPercentage}%`));

        // Critical warnings
        const criticalMissing = results.filter(
          (r) => p0Sections.includes(r.number) && r.status === 'missing'
        );

        if (criticalMissing.length > 0) {
          console.log(chalk.red.bold('\n⚠️  Critical Sections Missing:'));
          criticalMissing.forEach((r) => {
            console.log(chalk.red(`  • Section ${r.number}: ${r.title}`));
          });
          console.log(chalk.yellow('\nThese sections are required for MVP.\n'));
        } else {
          console.log(chalk.green('\n✅ All critical sections present!\n'));
        }

        // 21-Step Verification Integration
        if (options.verify) {
          console.log(chalk.cyan.bold('\n📋 21-Step Verification Integration\n'));
          await runVerification();
        }

        // Recommendations
        if (options.fix && (partial > 0 || missing > 0)) {
          console.log(chalk.bold('\n💡 Suggested Actions:'));
          const incomplete = results.filter((r) => r.status !== 'complete');
          incomplete.forEach((r) => {
            console.log(chalk.white(`\n  Section ${r.number}: ${r.title}`));
            r.suggestions.forEach((s) => {
              console.log(chalk.gray(`    → ${s}`));
            });
          });
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
}

async function runVerification() {
  try {
    const verifyPath = './VERIFICATION-REPORT.md';
    let verifyContent;
    try {
      verifyContent = await fs.readFile(verifyPath, 'utf8');
    } catch {
      console.log(chalk.yellow('⚠️  VERIFICATION-REPORT.md not found'));
      console.log(chalk.gray('   Run: ultra-dex verify to generate it\n'));
      return;
    }

    // Parse verification report
    const lines = verifyContent.split('\n');
    let passed = 0,
      failed = 0,
      skipped = 0,
      autofixed = 0;

    for (let line of lines) {
      if (line.includes('✅ PASS')) passed++;
      else if (line.includes('❌ FAIL')) failed++;
      else if (line.includes('⚪ SKIP')) skipped++;
      else if (line.includes('Auto-fixed')) autofixed++;
    }

    const totalSteps = passed + failed + skipped;
    const score = Math.round((passed / totalSteps) * 100);

    console.log(chalk.cyan(`Verification Score: ${score}% (${passed}/${totalSteps})`));
    console.log(chalk.green(`  ✅ Passed: ${passed}`));
    console.log(chalk.red(`  ❌ Failed: ${failed}`));
    console.log(chalk.yellow(`  ⚪ Skipped: ${skipped}`));
    console.log(chalk.blue(`  🛠️ Auto-fixed: ${autofixed}`));

    // Show top issues
    if (failed > 0) {
      console.log(chalk.red.bold('\nCritical Issues:'));
      const issueLines = lines.filter(
        (line) => line.includes('❌ FAIL') || line.includes('Recommendation')
      );
      issueLines.slice(0, 3).forEach((line) => {
        if (line.trim()) console.log(chalk.red(`  • ${line.trim()}`));
      });
    }

    return { passed, failed, skipped, autofixed, score };
  } catch (error) {
    console.error(chalk.red('Verification check error:'), error.message);
    return null;
  }
}

function parseSections(content) {
  const sections = [];
  const lines = content.split('\n');
  let currentSection = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match section headers like "## SECTION 1: TITLE" or "## 1. Title"
    const match = line.match(/^##\s+(?:SECTION\s+)?(\d+)[:.]?\s*(.+)/i);
    if (match) {
      if (currentSection) {
        currentSection.endLine = i;
        sections.push(currentSection);
      }
      currentSection = {
        number: parseInt(match[1]),
        title: match[2].trim(),
        startLine: i,
        content: [],
      };
    } else if (currentSection) {
      currentSection.content.push(line);
    }
  }

  if (currentSection) {
    currentSection.endLine = lines.length;
    sections.push(currentSection);
  }

  return sections;
}

function analyzeSection(section) {
  const content = section.content.join('\n');
  const checks = {
    hasContent: content.trim().length > 50,
    hasBulletPoints: content.includes('- ') || content.includes('* '),
    hasTables: content.includes('|'),
    hasCodeBlocks: content.includes('```'),
    hasNumbers: /\d+/.test(content),
    noPlaceholders:
      !content.includes('[TODO]') && !content.includes('TBD') && !content.includes('...'),
    hasAcceptanceCriteria:
      content.toLowerCase().includes('acceptance criteria') ||
      content.toLowerCase().includes('criteria'),
    hasEstimates:
      content.toLowerCase().includes('hours') ||
      content.toLowerCase().includes('estimate') ||
      content.toLowerCase().includes('time'),
    hasDependencies:
      content.toLowerCase().includes('depends on') || content.toLowerCase().includes('dependency'),
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  const percentage = Math.round((passedChecks / totalChecks) * 100);

  let status = 'missing';
  if (percentage >= 80) status = 'complete';
  else if (percentage >= 40) status = 'partial';

  const issues = [];
  if (!checks.hasContent) issues.push('empty');
  if (!checks.noPlaceholders) issues.push('placeholders');
  if (!checks.hasBulletPoints && section.number !== 1) issues.push('no details');
  if (!checks.hasAcceptanceCriteria) issues.push('no acceptance criteria');
  if (!checks.hasEstimates) issues.push('no time estimates');

  const suggestions = [];
  if (!checks.hasContent) suggestions.push('Fill in section content');
  if (!checks.noPlaceholders) suggestions.push('Replace [TODO]/TBD with actual content');
  if (!checks.hasBulletPoints) suggestions.push('Add bullet points with specific details');
  if (!checks.hasAcceptanceCriteria) suggestions.push('Add acceptance criteria for this section');
  if (!checks.hasEstimates) suggestions.push('Add time estimates for implementation');
  if (!checks.hasDependencies) suggestions.push('Specify dependencies for this section');

  return {
    number: section.number,
    title: section.title,
    status,
    percentage,
    checks,
    issues,
    suggestions,
  };
}

function checkSection(section, options) {
  console.log(chalk.cyan(`\n📋 Checking Section ${section.number}: ${section.title}\n`));

  const result = analyzeSection(section);

  console.log(
    chalk.bold('Status:'),
    result.status === 'complete'
      ? chalk.green('✓ Complete')
      : result.status === 'partial'
        ? chalk.yellow('◐ Partial')
        : chalk.red('✗ Missing')
  );
  console.log(chalk.bold('Completeness:'), `${result.percentage}%`);

  if (result.issues.length > 0) {
    console.log(chalk.red('\nIssues:'));
    result.issues.forEach((issue) => console.log(chalk.red(`  • ${issue}`)));
  }

  if (options.fix && result.suggestions.length > 0) {
    console.log(chalk.cyan('\nSuggestions:'));
    result.suggestions.forEach((s) => console.log(chalk.white(`  → ${s}`)));
  }

  console.log();
}

// Export the enhanced check command
export { registerEnhancedCheckCommand as registerCheckCommand };
