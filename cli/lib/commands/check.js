import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import Table from 'cli-table3';

/**
 * Enhanced Check Command
 * Check if all P0 sections are filled, verify CONTEXT.md is up to date,
 * validate tech stack choices, check for missing acceptance criteria,
 * verify atomic task breakdown, and report completeness percentage by section
 */

export function registerCheckCommand(program) {
  program
    .command('check')
    .description('Comprehensive plan completeness check with P0 validation')
    .option('--p0-only', 'Check only critical (P0) sections')
    .option('--sections <list>', 'Check specific sections (e.g., 1,2,3)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        if (!options.json) {
          console.log(chalk.cyan.bold('\n🔍 Ultra-Dex Completeness Check\n'));
        }

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

        const silent = options.json;

        // Check CONTEXT.md
        const contextPath = './CONTEXT.md';
        let contextValid = true;
        let contextFresh = true;
        let contextDetails = { exists: true, fresh: true, updatedAt: null, staleRefs: [] };
        try {
          const contextContent = await fs.readFile(contextPath, 'utf8');
          const contextStat = await fs.stat(contextPath);
          contextDetails.updatedAt = contextStat.mtime.toISOString();

          if (contextContent.trim().length < 50) {
            contextValid = false;
            if (!silent) {
              console.log(chalk.yellow('⚠️  CONTEXT.md is nearly empty'));
              console.log(chalk.gray('   Run: ultra-dex init to regenerate it\n'));
            }
          } else {
            const freshness = await checkContextFreshness(contextPath);
            contextFresh = freshness.fresh;
            contextDetails.fresh = freshness.fresh;
            contextDetails.staleRefs = freshness.staleRefs;

            if (!silent) {
              if (freshness.fresh) {
                console.log(chalk.green('✅ CONTEXT.md is up to date\n'));
              } else {
                console.log(chalk.yellow('⚠️  CONTEXT.md may be stale'));
                freshness.staleRefs.forEach(ref => {
                  console.log(chalk.gray(`   • Newer change detected in ${ref}`));
                });
                console.log(chalk.gray('   Run: ultra-dex sync --brain or ultra-dex init\n'));
              }
            }
          }
        } catch {
          contextValid = false;
          contextFresh = false;
          contextDetails.exists = false;
          if (!silent) {
            console.log(chalk.red('❌ CONTEXT.md not found'));
            console.log(chalk.gray('   Run: ultra-dex init to create one\n'));
          }
        }

        // Parse sections
        const sections = parseSections(planContent);

        // Define P0 sections (11 critical sections as per requirements)
        // Foundation: 1, 2, 4, 6, 10, 11, 12, 15
        // Core Development: 9, 16, 20
        const p0Sections = [1, 2, 4, 6, 9, 10, 11, 12, 15, 16, 20];

        // Filter sections to check
        let sectionsToCheck = sections;

        if (options.sections) {
          const sectionNumbers = options.sections.split(',').map(s => parseInt(s.trim()));
          sectionsToCheck = sections.filter(s => sectionNumbers.includes(s.number));
        } else if (options.p0Only) {
          sectionsToCheck = sections.filter(s => p0Sections.includes(s.number));
        }

        // Check each section
        const results = [];
        let completeCount = 0;
        let partialCount = 0;
        let missingCount = 0;

        for (const section of sectionsToCheck) {
          const result = analyzeSection(section);
          results.push(result);

          if (result.status === 'complete') completeCount++;
          else if (result.status === 'partial') partialCount++;
          else missingCount++;
        }

        // Display results
        if (options.json) {
          console.log(JSON.stringify({
            total: sectionsToCheck.length,
            complete: completeCount,
            partial: partialCount,
            missing: missingCount,
            percentage: Math.round((completeCount / sectionsToCheck.length) * 100),
            contextValid,
            contextFresh,
            contextDetails,
            sections: results
          }, null, 2));
          return;
        }

        // Table output
        const table = new Table({
          head: ['Section', 'Status', 'Completeness', 'Issues'],
          colWidths: [35, 12, 15, 45],
          style: { head: ['cyan'] }
        });

        results.forEach(r => {
          const status = r.status === 'complete' ? chalk.green('✓') :
                        r.status === 'partial' ? chalk.yellow('◐') :
                        chalk.red('✗');

          table.push([
            `Section ${r.number}: ${r.title.substring(0, 25)}`,
            status,
            `${r.percentage}%`,
            r.issues.join(', ').substring(0, 43) || '-'
          ]);
        });

        console.log(table.toString());

        // Summary
        const totalPercentage = Math.round((completeCount / sectionsToCheck.length) * 100);
        console.log(chalk.bold('\n📊 Summary:'));
        console.log(`  Total Sections Checked: ${sectionsToCheck.length}`);
        console.log(chalk.green(`  Complete: ${completeCount}`));
        console.log(chalk.yellow(`  Partial: ${partialCount}`));
        console.log(chalk.red(`  Missing: ${missingCount}`));
        console.log(chalk.cyan(`  Overall Plan Score: ${totalPercentage}%`));

        if (!contextFresh) {
          console.log(chalk.yellow(`  CONTEXT.md: stale (see warnings above)`));
        }

        // Critical warnings
        const criticalMissing = p0Sections.filter(num => 
          !results.some(r => r.number === num && r.status === 'complete')
        ).map(num => {
          const found = sections.find(s => s.number === num);
          return found ? `Section ${num}: ${found.title}` : `Section ${num} (MISSING)`;
        });

        if (criticalMissing.length > 0) {
          console.log(chalk.red.bold('\n⚠️  Critical P0 Sections Incomplete/Missing:'));
          criticalMissing.forEach(msg => {
            console.log(chalk.red(`  • ${msg}`));
          });
          console.log(chalk.yellow('\nThese 11 sections are required for a Production-Ready plan.\n'));
        } else {
          console.log(chalk.green('\n✅ All 11 critical P0 sections are complete!\n'));
        }

        // Tech stack validation
        const techStackValid = await validateTechStack(planContent);
        if (techStackValid.valid) {
          console.log(chalk.green('✅ Tech stack choices match package.json\n'));
        } else {
          console.log(chalk.red('❌ Issues with tech stack choices:'));
          techStackValid.issues.forEach(issue => {
            console.log(chalk.red(`  • ${issue}`));
          });
          console.log('');
        }

        // Acceptance criteria check
        const missingCriteria = results.filter(r => !r.checks.hasAcceptanceCriteria);
        if (missingCriteria.length > 0) {
          console.log(chalk.red(`❌ Missing acceptance criteria in ${missingCriteria.length} sections:`));
          missingCriteria.forEach(r => {
            console.log(chalk.red(`  • Section ${r.number}: ${r.title}`));
          });
          console.log('');
        }

        // Atomic task breakdown check
        const missingBreakdown = results.filter(r => [16, 20].includes(r.number) && !r.checks.hasAtomicTasks);
        if (missingBreakdown.length > 0) {
          console.log(chalk.red(`❌ Missing atomic task breakdown in ${missingBreakdown.length} sections:`));
          missingBreakdown.forEach(r => {
            console.log(chalk.red(`  • Section ${r.number}: ${r.title}`));
          });
          console.log(chalk.gray('   Tasks must be broken into 4-9 hour chunks.\n'));
        }

      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
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
        content: []
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
    noPlaceholders: !content.includes('[TODO]') && !content.includes('TBD') && !content.includes('...'),
    hasAcceptanceCriteria: /acceptance criteria|criteria|verifiable by|audit by/i.test(content),
    hasAtomicTasks: /task|step|atomic|breakdown/i.test(content) && /\b[4-9]\s*hours?\b|\b[4-9]h\b/i.test(content)
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  const percentage = Math.round((passedChecks / totalChecks) * 100);

  let status = 'missing';
  if (percentage >= 80) status = 'complete';
  else if (percentage >= 40) status = 'partial';

  const issues = [];
  if (!checks.hasContent) issues.push('Empty content');
  if (!checks.noPlaceholders) issues.push('Contains placeholders ([TODO]/TBD)');
  if (!checks.hasBulletPoints && section.number !== 1) issues.push('No bullet point details');
  if (!checks.hasAcceptanceCriteria) issues.push('Missing measurable acceptance criteria');
  if (!checks.hasAtomicTasks && [16, 20].includes(section.number)) issues.push('Tasks not broken into 4-9h chunks');

  return {
    number: section.number,
    title: section.title,
    status,
    percentage,
    checks,
    issues
  };
}

async function validateTechStack(content) {
  const issues = [];
  let pkg = {};
  
  try {
    const packageJsonContent = await fs.readFile('./package.json', 'utf8');
    pkg = JSON.parse(packageJsonContent);
  } catch (err) {
    try {
      const packageJsonContent = await fs.readFile('./cli/package.json', 'utf8');
      pkg = JSON.parse(packageJsonContent);
    } catch (e) {
      return { valid: false, issues: ['package.json not found to validate tech stack choices'] };
    }
  }

  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  
  // Common stack elements to verify
  const stackMap = {
    'Next.js': 'next',
    'React': 'react',
    'Prisma': 'prisma',
    'Tailwind': 'tailwindcss',
    'TypeScript': 'typescript',
    'Zod': 'zod',
    'Clerk': '@clerk',
    'Supabase': 'supabase',
    'Express': 'express',
    'Vitest': 'vitest',
    'Playwright': 'playwright',
    'Puppeteer': 'puppeteer'
  };

  let mentionsAny = false;
  for (const [name, dep] of Object.entries(stackMap)) {
    const hasDep = Object.keys(deps).some(d => d.includes(dep));
    const mentions = content.toLowerCase().includes(name.toLowerCase());
    
    if (hasDep && !mentions) {
      issues.push(`${name} found in package.json but not mentioned in implementation plan`);
    }
    if (mentions) mentionsAny = true;
  }

  if (!mentionsAny) {
    issues.push('No primary tech stack elements identified in implementation plan');
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

async function checkContextFreshness(contextPath) {
  const contextStat = await fs.stat(contextPath);
  const contextTime = contextStat.mtimeMs;
  const references = [
    'IMPLEMENTATION-PLAN.md',
    'package.json',
    'README.md',
    'src',
    'app',
    'lib',
    'server',
    'api',
    'cli'
  ];

  const staleRefs = [];

  for (const ref of references) {
    try {
      const refStat = await fs.stat(ref);
      if (refStat.mtimeMs > contextTime) {
        staleRefs.push(ref);
      }
    } catch {
      // Ignore missing paths
    }
  }

  return {
    fresh: staleRefs.length === 0,
    staleRefs
  };
}
