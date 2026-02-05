import chalk from 'chalk';
import fs from 'fs/promises';
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
    .option('--json', 'Output as JSON')
    .option('--sections <numbers>', 'Check specific sections only (comma-separated numbers)')
    .action(async (options) => {
      try {
        console.log(chalk.cyan.bold('\n🔍 Ultra-Dex Completeness Check\n'));

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
        let contextValid = true;
        let contextFresh = true;
        let contextDetails = { exists: true, fresh: true, updatedAt: null, staleRefs: [] };
        try {
          const contextContent = await fs.readFile(contextPath, 'utf8');
          const contextStat = await fs.stat(contextPath);
          contextDetails.updatedAt = contextStat.mtime.toISOString();

          if (contextContent.trim().length < 50) {
            contextValid = false;
            console.log(chalk.yellow('⚠️  CONTEXT.md is nearly empty'));
            console.log(chalk.gray('   Run: ultra-dex init to regenerate it\n'));
          } else {
            const freshness = await checkContextFreshness(contextPath);
            contextFresh = freshness.fresh;
            contextDetails.fresh = freshness.fresh;
            contextDetails.staleRefs = freshness.staleRefs;

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
        } catch {
          contextValid = false;
          contextFresh = false;
          contextDetails.exists = false;
          console.log(chalk.red('❌ CONTEXT.md not found'));
          console.log(chalk.gray('   Run: ultra-dex init to create one\n'));
        }

        // Parse sections
        const sections = parseSections(planContent);

        // Define P0 sections (critical for MVP)
        const p0Sections = [1, 2, 4, 6, 9, 10, 11, 12, 15, 16, 19, 20, 21];

        // Filter sections to check
        let sectionsToCheck = sections;

        if (options.sections) {
          // Parse the sections option (comma-separated numbers)
          const sectionNumbers = options.sections.split(',').map(s => parseInt(s.trim()));
          sectionsToCheck = sections.filter(s => sectionNumbers.includes(s.number));
        } else if (options.p0Only) {
          sectionsToCheck = sections.filter(s => p0Sections.includes(s.number));
        }

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
          console.log(JSON.stringify({
            total: sectionsToCheck.length,
            complete,
            partial,
            missing,
            percentage: Math.round((complete / sectionsToCheck.length) * 100),
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
          colWidths: [30, 12, 15, 40],
          style: { head: ['cyan'] }
        });

        results.forEach(r => {
          const status = r.status === 'complete' ? chalk.green('✓') :
                        r.status === 'partial' ? chalk.yellow('◐') :
                        chalk.red('✗');

          table.push([
            `Section ${r.number}: ${r.title.substring(0, 20)}`,
            status,
            `${r.percentage}%`,
            r.issues.join(', ').substring(0, 38) || '-'
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

        if (!contextFresh) {
          console.log(chalk.yellow(`  CONTEXT.md: stale (see warnings above)`));
        }

        // Critical warnings
        const criticalMissing = results.filter(r =>
          p0Sections.includes(r.number) && r.status === 'missing'
        );

        if (criticalMissing.length > 0) {
          console.log(chalk.red.bold('\n⚠️  Critical P0 Sections Missing:'));
          criticalMissing.forEach(r => {
            console.log(chalk.red(`  • Section ${r.number}: ${r.title}`));
          });
          console.log(chalk.yellow('\nThese sections are required for MVP.\n'));
        } else {
          console.log(chalk.green('\n✅ All critical P0 sections present!\n'));
        }

        // Tech stack validation
        const techStackValid = await validateTechStack(planContent);
        if (techStackValid.valid) {
          console.log(chalk.green('✅ Tech stack choices validated\n'));
        } else {
          console.log(chalk.red('❌ Issues with tech stack choices:'));
          techStackValid.issues.forEach(issue => {
            console.log(chalk.red(`  • ${issue}`));
          });
          console.log('');
        }

        // Acceptance criteria check
        const missingCriteria = checkAcceptanceCriteria(sectionsToCheck);
        if (missingCriteria.length > 0) {
          console.log(chalk.red(`❌ Missing acceptance criteria in ${missingCriteria.length} sections:`));
          missingCriteria.forEach(section => {
            console.log(chalk.red(`  • Section ${section.number}: ${section.title}`));
          });
          console.log('');
        } else {
          console.log(chalk.green('✅ All sections have acceptance criteria\n'));
        }

        // Atomic task breakdown check
        const missingBreakdown = checkAtomicTaskBreakdown(sectionsToCheck);
        if (missingBreakdown.length > 0) {
          console.log(chalk.red(`❌ Missing atomic task breakdown in ${missingBreakdown.length} sections:`));
          missingBreakdown.forEach(section => {
            console.log(chalk.red(`  • Section ${section.number}: ${section.title}`));
          });
          console.log('');
        } else {
          console.log(chalk.green('✅ All sections have atomic task breakdown\n'));
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
    hasTables: content.includes('|'),
    hasCodeBlocks: content.includes('```'),
    hasNumbers: /\d+/.test(content),
    noPlaceholders: !content.includes('[TODO]') && !content.includes('TBD') && !content.includes('...'),
    hasAcceptanceCriteria: content.toLowerCase().includes('acceptance criteria') || content.toLowerCase().includes('criteria'),
    hasEstimates: content.toLowerCase().includes('hours') || content.toLowerCase().includes('estimate') || content.toLowerCase().includes('time'),
    hasDependencies: content.toLowerCase().includes('depends on') || content.toLowerCase().includes('dependency')
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
  const lines = content.split('\n');
  let hasTechStack = false;
  const issues = [];

  for (const line of lines) {
    if (line.toLowerCase().includes('tech stack') || line.toLowerCase().includes('technology stack')) {
      hasTechStack = true;
      break;
    }
  }

  if (!hasTechStack) {
    issues.push('No technology stack section found');
  }

  // Check for common tech stack elements
  const hasBackend = /backend|server|api|database|prisma|drizzle|typeorm|sequelize|express|fastify|nestjs|django|flask|rails|laravel/i.test(content);
  const hasFrontend = /frontend|client|ui|react|vue|angular|svelte|next|nuxt|remix|astro|gatsby/i.test(content);
  const hasDatabase = /database|sql|postgres|mysql|mongodb|sqlite|supabase|firebase|prisma|drizzle/i.test(content);
  const hasAuth = /auth|authentication|authorization|login|signup|clerk|nextauth|supabase auth/i.test(content);

  if (!hasBackend) issues.push('No backend technology specified');
  if (!hasFrontend) issues.push('No frontend technology specified');
  if (!hasDatabase) issues.push('No database technology specified');
  if (!hasAuth) issues.push('No authentication method specified');

  // Check against package.json if it exists
  try {
    const packageJsonPath = './package.json';
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);

    // Check if declared tech stack matches package.json dependencies
    const dependencies = {...packageJson.dependencies, ...packageJson.devDependencies};

    // Check for common mismatches
    if (hasFrontend && !dependencies.react && !dependencies.vue && !dependencies.angular && !dependencies.svelte) {
      issues.push('Declared frontend tech not found in package.json dependencies');
    }

    if (hasBackend && !dependencies.express && !dependencies.fastify && !dependencies['@nestjs/core'] &&
        !dependencies.flask && !dependencies.django) {
      issues.push('Declared backend tech not found in package.json dependencies');
    }

    if (hasDatabase && !dependencies.prisma && !dependencies.knex && !dependencies.sequelize &&
        !dependencies['@prisma/client'] && !dependencies.sqlite3 && !dependencies.pg && !dependencies.mysql) {
      issues.push('Declared database tech not found in package.json dependencies');
    }
  } catch (err) {
    // If package.json doesn't exist, add a warning
    issues.push('package.json not found to validate tech stack choices');
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

function checkAcceptanceCriteria(sections) {
  return sections.filter(section => {
    const content = section.content.join('\n').toLowerCase();
    return !content.includes('acceptance criteria') && !content.includes('criteria');
  });
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
    'packages'
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

function checkAtomicTaskBreakdown(sections) {
  return sections.filter(section => {
    const content = section.content.join('\n');
    // Look for task-like structures (bullet points with time estimates)
    const hasTasks = /- \[.\]|\*\*task|\*\*step|hours|time estimate|implementation steps|4-9 hours|atomic tasks/i.test(content);

    // Additionally check if tasks are properly broken down into 4-9 hour chunks
    const taskMatches = content.match(/- \[.\]|\*\*task|\*\*step/g);
    if (taskMatches && taskMatches.length > 0) {
      // Check if each task has time estimates in the 4-9 hour range
      const hasTimeEstimates = /4-9 hours|4 to 9 hours|[4-9]\s*hours|[4-9]\s*h/i.test(content);
      if (!hasTimeEstimates) {
        return true; // Missing proper time estimates
      }
    }

    return !hasTasks;
  });
}
