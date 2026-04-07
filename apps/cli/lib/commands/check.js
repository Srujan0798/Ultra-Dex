// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import Table from 'cli-table3';
import { logger } from '../utils/logger.js';

/**
 * Enhanced Check Command
 * Check if all P0 sections are filled, verify CONTEXT.md is up to date,
 * validate tech stack choices, check for missing acceptance criteria,
 * verify atomic task breakdown, and report completeness percentage by section
 */

import { runA11yCheck } from '../quality/a11y-check.js';

export function registerCheckCommand(program) {
  const check = program
    .command('check')
    .description('Comprehensive plan completeness check with P0 validation');

  check
    .command('doctor')
    .description('System health check and diagnostic')
    .action(async () => {
      const [{ checkDocker }, { sqliteProvider }, { codeValidator }] = await Promise.all([
        import('../sandbox/docker.js'),
        import('../memory/sqlite.js'),
        import('../../../../src/services/security/validators.js'),
      ]);

      let nexus = null;
      try {
        ({ agentOrchestrator: nexus } = await import('../../../../src/core/orchestration/index.js'));
      } catch {
        nexus = null;
      }

      logger.log(chalk.cyan.bold('\n👨‍⚕️ Ultra-Dex System Doctor\n'));
      
      // 1. Check Docker
      const dockerOk = await checkDocker();
      if (dockerOk) {
        logger.log(chalk.green('✅ Docker: Operational'));
      } else {
        logger.log(chalk.red('❌ Docker: Not found or not running. Sandbox disabled.'));
      }

      // 2. Check SQLite
      try {
        await sqliteProvider.init();
        logger.log(chalk.green('✅ Memory (SQLite): Operational'));
      } catch (e) {
        logger.log(chalk.red(`❌ Memory (SQLite): Failed -> ${e.message}`));
      }

      // 3. Check Nexus
      if (nexus) {
        logger.log(chalk.green('✅ Nexus Orchestrator: Initialized'));
      }

      // 4. Check Security Validator
      if (codeValidator) {
        logger.log(chalk.green('✅ Security: Code Validator (AST-enabled) Operational'));
      }

      // 5. Check Agents
      const agentDir = path.join(process.cwd(), '.ultra-dex', 'agents');
      try {
        const tiers = await fs.readdir(agentDir);
        logger.log(chalk.green(`✅ Agents: ${tiers.length} tiers found in .ultra-dex/agents`));
      } catch (_e) {
        logger.log(chalk.red('❌ Agents: .ultra-dex/agents directory missing!'));
      }

      logger.log(chalk.cyan('\nDiagnostic Complete.\n'));
    });

  check
    .command('security [file]')
    .description('Run a security scan on a file or the whole project')
    .action(async (file) => {
      const { codeValidator } = await import('../../../../src/services/security/validators.js');
      logger.log(chalk.cyan.bold('\n🛡️  Ultra-Dex Security Scan\n'));
      
      if (file) {
        try {
          const content = await fs.readFile(file, 'utf8');
          const result = codeValidator.validate(content, path.extname(file).slice(1));
          codeValidator.report(result);
        } catch (e) {
          logger.log(chalk.red(`❌ Error reading file: ${e.message}`));
        }
      } else {
        logger.log(chalk.gray('Scanning project files for critical risks...'));
        // Project-wide scan logic (simplified)
        const { glob } = await import('glob');
        const files = await glob('**/*.{js,ts}', { ignore: 'node_modules/**' });
        
        let totalFindings = 0;
        for (const f of files) {
          const content = await fs.readFile(f, 'utf8');
          const result = codeValidator.validate(content, path.extname(f).slice(1));
          if (!result.safe) {
            logger.log(chalk.bold(`\n📄 File: ${f}`));
            codeValidator.report(result);
            totalFindings++;
          }
        }
        
        if (totalFindings === 0) {
          logger.log(chalk.green('\n✅ Project-wide scan complete. No critical risks found.'));
        } else {
          logger.log(chalk.red(`\n❌ Project-wide scan complete. Found risks in ${totalFindings} files.`));
        }
      }
      logger.log('');
    });

  check
    .command('a11y')
    .description('Run basic accessibility checks on the codebase')
    .action(async () => {
      const result = await runA11yCheck({ rootDir: process.cwd() });
      if (result.passed) {
        logger.log(chalk.green('✅ Accessibility check passed.'));
        return;
      }
      logger.log(chalk.yellow(`⚠️  Accessibility issues found: ${result.issues.length}`));
      result.issues.slice(0, 20).forEach((issue) => {
        logger.log(chalk.gray(`- ${issue.file}: ${issue.issue}`));
      });
    });

  check
    .option('--p0-only', 'Check only critical (P0) sections')
    .option('--sections <list>', 'Check specific sections (e.g., 1,2,3)')
    .option('--json', 'Output as JSON')
    .option('--strict', 'Exit with error if any required section is missing/partial')
    .option('--fix', 'Auto-fill missing sections with suggested content')
    .option('--compliance', 'Show compliance checklist guidance (GDPR/CCPA/SOC2)')
    .option('--report <path>', 'Generate detailed report file (markdown or JSON)')
    .option('--visual', 'Show visual progress bars and enhanced colors')
    .addHelpText('after', `

Examples:
  $ ultra-dex check                    # Full completeness check
  $ ultra-dex check --p0-only          # Check only P0 sections
  $ ultra-dex check --strict           # Exit with error on failures
  $ ultra-dex check --fix              # Auto-fill suggestions
  $ ultra-dex check --visual           # Enhanced visual output
  $ ultra-dex check --report check.md  # Save report to file
    `)
    .action(async (options) => {
      try {
        if (options.compliance) {
          const compliancePath = path.resolve(process.cwd(), 'docs', 'COMPLIANCE.md');
          const complianceExists = await fileExists(compliancePath);
          if (!options.json) {
            logger.log(chalk.cyan.bold('\n🛡️  Compliance Checklist\n'));
            if (complianceExists) {
              logger.log(chalk.gray(`Review: ${compliancePath}\n`));
            } else {
              logger.log(
                chalk.yellow(
                  'COMPLIANCE.md not found. Add one or generate from templates to proceed.\n'
                )
              );
            }
          }
          if (options.json) {
            logger.log(
              JSON.stringify(
                {
                  compliance: complianceExists ? 'available' : 'missing',
                  path: complianceExists ? compliancePath : null,
                },
                null,
                2
              )
            );
          }
          return;
        }

        if (!options.json) {
          logger.log(chalk.cyan.bold('\n🔍 Ultra-Dex Completeness Check\n'));
        }

        // Load implementation plan
        const planPath = './IMPLEMENTATION-PLAN.md';
        let planContent;
        try {
          planContent = await fs.readFile(planPath, 'utf8');
        } catch {
          logger.log(chalk.red('❌ IMPLEMENTATION-PLAN.md not found'));
          logger.log(chalk.gray('   Run: ultra-dex init to create one\n'));
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
              logger.log(chalk.yellow('⚠️  CONTEXT.md is nearly empty'));
              logger.log(chalk.gray('   Run: ultra-dex init to regenerate it\n'));
            }
          } else {
            const freshness = await checkContextFreshness(contextPath);
            contextFresh = freshness.fresh;
            contextDetails.fresh = freshness.fresh;
            contextDetails.staleRefs = freshness.staleRefs;

            if (!silent) {
              if (freshness.fresh) {
                logger.log(chalk.green('✅ CONTEXT.md is up to date\n'));
              } else {
                logger.log(chalk.yellow('⚠️  CONTEXT.md may be stale'));
                freshness.staleRefs.forEach((ref) => {
                  logger.log(chalk.gray(`   • Newer change detected in ${ref}`));
                });
                logger.log(chalk.gray('   Run: ultra-dex sync --brain or ultra-dex init\n'));
              }
            }
          }
        } catch {
          contextValid = false;
          contextFresh = false;
          contextDetails.exists = false;
          if (!silent) {
            logger.log(chalk.red('❌ CONTEXT.md not found'));
            logger.log(chalk.gray('   Run: ultra-dex init to create one\n'));
          }
        }

        // Parse sections
        const sections = parseSections(planContent);

        // Define legacy P0 sections expected by plan quality gates.
        const p0Sections = [1, 2, 4, 6, 9, 10, 11, 12, 15, 16, 20];

        // Filter sections to check
        let sectionsToCheck = sections;

        if (options.sections) {
          const sectionNumbers = options.sections.split(',').map((s) => parseInt(s.trim()));
          sectionsToCheck = sections.filter((s) => sectionNumbers.includes(s.number));
        } else if (options.p0Only) {
          sectionsToCheck = sections.filter((s) => p0Sections.includes(s.number));
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

        // Critical warnings
        const criticalMissing = p0Sections
          .filter((num) => !results.some((r) => r.number === num && r.status === 'complete'))
          .map((num) => {
            const found = sections.find((s) => s.number === num);
            return found ? `Section ${num}: ${found.title}` : `Section ${num} (MISSING)`;
          });

        // Auto-fix missing sections (best-effort suggestions)
        let fixApplied = false;
        if (options.fix) {
          const nextPlan = applyAutoFixes(planContent, sections, results);
          if (nextPlan !== planContent) {
            await fs.writeFile(planPath, nextPlan);
            fixApplied = true;
            if (!silent) {
              logger.log(
                chalk.green('\n✅ Auto-fill suggestions added to IMPLEMENTATION-PLAN.md')
              );
              logger.log(chalk.gray('   Review and refine the suggested content.\n'));
            }
          } else if (!silent) {
            logger.log(chalk.gray('\nℹ️  No sections required auto-fill suggestions.\n'));
          }
        }

        // Display results
        const reportData = {
          total: sectionsToCheck.length,
          complete: completeCount,
          partial: partialCount,
          missing: missingCount,
          percentage: Math.round((completeCount / sectionsToCheck.length) * 100),
          contextValid,
          contextFresh,
          contextDetails,
          fixApplied,
          sections: results,
          generatedAt: new Date().toISOString(),
        };

        if (options.json) {
          logger.log(JSON.stringify(reportData, null, 2));
          return;
        }

        // Generate report file if requested
        if (options.report) {
          await generateCheckReport(options.report, reportData, results, criticalMissing);
          if (!silent) {
            logger.log(chalk.green(`\n✅ Report saved to ${options.report}`));
          }
        }

        // Table output with visual enhancements
        const table = new Table({
          head: ['Section', 'Status', 'Completeness', 'Issues'],
          colWidths: [35, 12, 15, 45],
          style: { head: ['cyan'] },
        });

        results.forEach((r) => {
          let status;
          let completeness;

          if (options.visual) {
            // Visual mode with color-coded progress bars
            const barWidth = 10;
            const filled = Math.round((r.percentage / 100) * barWidth);
            const empty = barWidth - filled;
            const barColor = r.status === 'complete' ? chalk.green : r.status === 'partial' ? chalk.yellow : chalk.red;
            completeness = barColor('█'.repeat(filled)) + chalk.gray('░'.repeat(empty)) + ` ${r.percentage}%`;
            status = r.status === 'complete' ? chalk.green('✓ COMPLETE') : r.status === 'partial' ? chalk.yellow('◐ PARTIAL') : chalk.red('✗ MISSING');
          } else {
            status = r.status === 'complete' ? chalk.green('✓') : r.status === 'partial' ? chalk.yellow('◐') : chalk.red('✗');
            completeness = `${r.percentage}%`;
          }

          table.push([
            `Section ${r.number}: ${r.title.substring(0, 25)}`,
            status,
            completeness,
            r.issues.join(', ').substring(0, 43) || '-',
          ]);
        });

        logger.log(table.toString());

        // Summary
        const totalPercentage = Math.round((completeCount / sectionsToCheck.length) * 100);
        logger.log(chalk.bold('\n📊 Summary:'));
        logger.log(`  Total Sections Checked: ${sectionsToCheck.length}`);
        logger.log(chalk.green(`  Complete: ${completeCount}`));
        logger.log(chalk.yellow(`  Partial: ${partialCount}`));
        logger.log(chalk.red(`  Missing: ${missingCount}`));
        logger.log(chalk.cyan(`  Overall Plan Score: ${totalPercentage}%`));

        if (!contextFresh) {
          logger.log(chalk.yellow(`  CONTEXT.md: stale (see warnings above)`));
        }

        // Critical warnings
        if (criticalMissing.length > 0) {
          logger.log(chalk.red.bold('\n⚠️  Critical P0 Sections Incomplete/Missing:'));
          criticalMissing.forEach((msg) => {
            logger.log(chalk.red(`  • ${msg}`));
          });
          logger.log(chalk.yellow('\nThese 11 sections are required for a Production-Ready plan.\n'));
        } else {
          logger.log(chalk.green('\n✅ All 11 critical P0 sections are complete!\n'));
        }

        // Tech stack validation
        const techStackValid = await validateTechStack(planContent);
        if (techStackValid.valid) {
          logger.log(chalk.green('✅ Tech stack choices match package.json\n'));
        } else {
          logger.log(chalk.red('❌ Issues with tech stack choices:'));
          techStackValid.issues.forEach((issue) => {
            logger.log(chalk.red(`  • ${issue}`));
          });
          logger.log('');
        }

        // Acceptance criteria check
        const missingCriteria = results.filter((r) => !r.checks.hasAcceptanceCriteria);
        if (missingCriteria.length > 0) {
          logger.log(
            chalk.red(`❌ Missing acceptance criteria in ${missingCriteria.length} sections:`)
          );
          missingCriteria.forEach((r) => {
            logger.log(chalk.red(`  • Section ${r.number}: ${r.title}`));
          });
          logger.log('');
        }

        // Atomic task breakdown check
        const missingBreakdown = results.filter(
          (r) => [16, 20].includes(r.number) && !r.checks.hasAtomicTasks
        );
        if (missingBreakdown.length > 0) {
          logger.log(
            chalk.red(`❌ Missing atomic task breakdown in ${missingBreakdown.length} sections:`)
          );
          missingBreakdown.forEach((r) => {
            logger.log(chalk.red(`  • Section ${r.number}: ${r.title}`));
          });
          logger.log(chalk.gray('   Tasks must be broken into 4-9 hour chunks.\n'));
        }

        // Strict mode
        if (options.strict) {
          const hasFailures =
            missingCount > 0 ||
            partialCount > 0 ||
            !contextValid ||
            !contextFresh ||
            criticalMissing.length > 0;
          if (hasFailures) {
            logger.log(chalk.red('\n❌ Strict mode: validation failed.'));
            process.exitCode = 1;
          }
        }
      } catch (error) {
        logger.error(chalk.red('Error:'), error.message);
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
  const placeholderRegex = /\bTODO\b|\[TODO\]|\bTBD\b|\bTBA\b|\[Fill in\]|\.\.\./i;
  const checks = {
    hasContent: content.trim().length > 50,
    hasBulletPoints: content.includes('- ') || content.includes('* '),
    noPlaceholders: !placeholderRegex.test(content),
    hasAcceptanceCriteria: /acceptance criteria|criteria|verifiable by|audit by/i.test(content),
    hasAtomicTasks:
      /task|step|atomic|breakdown/i.test(content) && /\b[4-9]\s*hours?\b|\b[4-9]h\b/i.test(content),
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
  if (!checks.hasAtomicTasks && [16, 20].includes(section.number))
    issues.push('Tasks not broken into 4-9h chunks');

  const suggestions = [];
  if (!checks.hasContent)
    suggestions.push('Add 3-5 sentences describing scope, inputs, and outputs.');
  if (!checks.noPlaceholders)
    suggestions.push('Replace TODO/TBD placeholders with concrete details.');
  if (!checks.hasBulletPoints && section.number !== 1)
    suggestions.push('Add bullet points for steps, deliverables, or decisions.');
  if (!checks.hasAcceptanceCriteria)
    suggestions.push('Add a short "Acceptance Criteria" list with measurable outcomes.');
  if (!checks.hasAtomicTasks && [16, 20].includes(section.number)) {
    suggestions.push('Break tasks into 4-9 hour chunks with estimates.');
  }

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

async function validateTechStack(content) {
  const issues = [];
  let pkg = {};

  try {
    const packageJsonContent = await fs.readFile('./package.json', 'utf8');
    pkg = JSON.parse(packageJsonContent);
  } catch (_err) {
    try {
      const packageJsonContent = await fs.readFile('./cli/package.json', 'utf8');
      pkg = JSON.parse(packageJsonContent);
    } catch (_e) {
      return { valid: false, issues: ['package.json not found to validate tech stack choices'] };
    }
  }

  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  // Common stack elements to verify
  const stackMap = {
    'Next.js': 'next',
    React: 'react',
    Prisma: 'prisma',
    Tailwind: 'tailwindcss',
    TypeScript: 'typescript',
    Zod: 'zod',
    Clerk: '@clerk',
    Supabase: 'supabase',
    Express: 'express',
    Vitest: 'vitest',
    Playwright: 'playwright',
    Puppeteer: 'puppeteer',
  };

  let mentionsAny = false;
  for (const [name, dep] of Object.entries(stackMap)) {
    const hasDep = Object.keys(deps).some((d) => d.includes(dep));
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
    issues,
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
    'cli',
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
    staleRefs,
  };
}

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function applyAutoFixes(planContent, sections, results) {
  const lines = planContent.split('\n');
  const sectionByNumber = new Map(sections.map((section) => [section.number, section]));
  const edits = [];

  for (const result of results) {
    if (result.status === 'complete' && result.checks.noPlaceholders) continue;

    const section = sectionByNumber.get(result.number);
    if (!section) continue;

    const content = section.content.join('\n');
    if (content.includes('AI Suggested Additions')) continue;
    if (result.suggestions.length === 0) continue;

    const block = [
      '',
      '### AI Suggested Additions',
      ...result.suggestions.map((item) => `- ${item}`),
      '',
    ];

    edits.push({ index: section.endLine, block });
  }

  if (edits.length === 0) return planContent;

  edits
    .sort((a, b) => b.index - a.index)
    .forEach(({ index, block }) => {
      lines.splice(index, 0, ...block);
    });

  return lines.join('\n');
}

async function generateCheckReport(reportPath, reportData, results, criticalMissing) {
  const isJson = reportPath.endsWith('.json');
  let content;

  if (isJson) {
    content = JSON.stringify({ ...reportData, criticalMissing }, null, 2);
  } else {
    // Markdown report
    const lines = [];
    lines.push('# Ultra-Dex Completeness Check Report');
    lines.push('');
    lines.push(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`);
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push(`- Total Sections: ${reportData.total}`);
    lines.push(`- Complete: ${reportData.complete}`);
    lines.push(`- Partial: ${reportData.partial}`);
    lines.push(`- Missing: ${reportData.missing}`);
    lines.push(`- Overall Score: ${reportData.percentage}%`);
    lines.push('');

    if (criticalMissing.length > 0) {
      lines.push('## Critical P0 Sections Incomplete');
      lines.push('');
      criticalMissing.forEach((msg) => {
        lines.push(`- ${msg}`);
      });
      lines.push('');
    }

    lines.push('## Section Details');
    lines.push('');
    results.forEach((r) => {
      const statusEmoji = r.status === 'complete' ? '✅' : r.status === 'partial' ? '⚠️' : '❌';
      lines.push(`### ${statusEmoji} Section ${r.number}: ${r.title}`);
      lines.push('');
      lines.push(`- Status: ${r.status.toUpperCase()}`);
      lines.push(`- Completeness: ${r.percentage}%`);
      if (r.issues.length > 0) {
        lines.push(`- Issues:`);
        r.issues.forEach((issue) => lines.push(`  - ${issue}`));
      }
      if (r.suggestions.length > 0) {
        lines.push(`- Suggestions:`);
        r.suggestions.forEach((suggestion) => lines.push(`  - ${suggestion}`));
      }
      lines.push('');
    });

    content = lines.join('\n');
  }

  await fs.writeFile(reportPath, content, 'utf8');
}
