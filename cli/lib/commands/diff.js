// cli/lib/commands/diff.js
import chalk from 'chalk';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import { execSync } from 'child_process';
import { loadConfig } from './config.js';
import { projectGraph } from '../mcp/graph.js';
import { loadState } from './state.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';

const STATUS = {
  DONE: 'done',
  PARTIAL: 'partial',
  MISSING: 'missing',
  PLANNED: 'planned'
};

export async function diffCommand(options) {
  if (!options.json) {
    printInfo(chalk.cyan.bold('\n📊 Ultra-Dex Diff - Plan vs Reality v3.5\n'));
  }

  const planPath = join(process.cwd(), 'IMPLEMENTATION-PLAN.md');
  if (!existsSync(planPath)) {
    if (options.json) {
      process.stdout.write(JSON.stringify({ error: 'No IMPLEMENTATION-PLAN.md found', sections: [], alignment: 0 }) + '\n');
    } else {
      printError(chalk.red('❌ No IMPLEMENTATION-PLAN.md found'));
      printInfo(chalk.gray('   Run: ultra-dex generate "your idea" to create one\n'));
    }
    return;
  }

  // Load project graph for enhanced analysis
  let graphSummary = null;
  if (!options.json) {
    printInfo(chalk.gray('🔍 Analyzing codebase structure...'));
  }

  try {
    await projectGraph.scan();
    graphSummary = projectGraph.getSummary();
  } catch (e) {
    // Graph analysis failed, continue without it
  }

  // Load state for task tracking
  const state = await loadState();
  
  const plan = readFileSync(planPath, 'utf-8');
  
  // Extract planned sections
  const plannedSections = extractSections(plan);
  
  if (plannedSections.length === 0) {
    if (options.json) {
      console.log(JSON.stringify({ error: 'No sections found', sections: [], alignment: 0 }));
    } else {
      printWarning(chalk.yellow('⚠️  No sections found in IMPLEMENTATION-PLAN.md'));
      printInfo(chalk.gray('   Looking for ## or ### headings\n'));
    }
    return;
  }

  // Check implementation status
  const config = loadConfig();
  const results = checkImplementationStatus(plannedSections, config, state);
  
  // Calculate alignment with weighted scoring
  const doneCount = results.filter(r => r.status === STATUS.DONE).length;
  const partialCount = results.filter(r => r.status === STATUS.PARTIAL).length;
  const missingCount = results.filter(r => r.status === STATUS.MISSING).length;
  const plannedCount = results.filter(r => r.status === STATUS.PLANNED).length;
  
  // Weight: Done = 1.0, Partial = 0.5, Planned = 0.25
  const alignment = Math.round(
    ((doneCount * 1.0 + partialCount * 0.5 + plannedCount * 0.25) / results.length) * 100
  );

  if (options.json) {
    process.stdout.write(JSON.stringify({
      alignment,
      totalSections: results.length,
      done: doneCount,
      partial: partialCount,
      missing: missingCount,
      planned: plannedCount,
      graphStats: graphSummary,
      stateStats: state ? {
        phases: state.phases?.length || 0,
        completedTasks: state.phases?.reduce((acc, p) =>
          acc + p.steps?.filter(s => s.status === 'completed').length, 0) || 0
      } : null,
      sections: results.map(r => ({
        title: r.title,
        status: r.status,
        confidence: r.confidence,
        matches: r.matches,
        taskStatus: r.taskStatus
      }))
    }, null, 2) + '\n');
    return;
  }

  // Enhanced visual output
  printInfo(chalk.white.bold('📋 Implementation Analysis:\n'));

  // Show stats
  if (graphSummary) {
    printInfo(chalk.gray(`Codebase: ${graphSummary.nodeCount} files, ${graphSummary.edgeCount} dependencies`));
  }
  if (state?.phases) {
    const completedTasks = state.phases.reduce((acc, p) =>
      acc + p.steps?.filter(s => s.status === 'completed').length, 0);
    const totalTasks = state.phases.reduce((acc, p) => acc + p.steps?.length, 0);
    printInfo(chalk.gray(`Tasks: ${completedTasks}/${totalTasks} completed`));
  }
  process.stdout.write('\n');

  // Show results by status
  const statusOrder = [STATUS.DONE, STATUS.PARTIAL, STATUS.PLANNED, STATUS.MISSING];

  for (const status of statusOrder) {
    const statusResults = results.filter(r => r.status === status);
    if (statusResults.length === 0) continue;

    const statusConfig = {
      [STATUS.DONE]: { icon: '✅', color: 'green', label: 'Implemented' },
      [STATUS.PARTIAL]: { icon: '⚠️', color: 'yellow', label: 'Partial' },
      [STATUS.PLANNED]: { icon: '📝', color: 'blue', label: 'Planned' },
      [STATUS.MISSING]: { icon: '❌', color: 'red', label: 'Missing' }
    }[status];

    printInfo(chalk.bold(`${statusConfig.icon} ${statusConfig.label} (${statusResults.length}):`));

    statusResults.forEach(({ title, matches, confidence, taskStatus }) => {
      const confidenceIndicator = confidence >= 80 ? '●' : confidence >= 50 ? '◐' : '○';
      const taskIndicator = taskStatus === 'completed' ? '✓' : taskStatus === 'in_progress' ? '⋯' : '○';

      printInfo(`   ${chalk[statusConfig.color](title)} ${chalk.gray(confidenceIndicator)} ${chalk.gray(taskIndicator)}`);

      if (matches && matches.length > 0 && status !== STATUS.MISSING) {
        matches.slice(0, 2).forEach(m => {
          printInfo(chalk.gray(`      └─ ${m}`));
        });
      }
    });
    process.stdout.write('\n');
  }

  // Summary
  printInfo(chalk.white.bold('─────────────────────────────────────'));
  const alignColor = alignment >= 80 ? 'green' : alignment >= 50 ? 'yellow' : 'red';
  const alignEmoji = alignment >= 80 ? '🎯' : alignment >= 50 ? '🔧' : '🚨';

  printInfo(`${alignEmoji} ${chalk[alignColor].bold(`Alignment Score: ${alignment}%`)}`);
  printInfo(chalk.gray(`   ${chalk.green(`● Done: ${doneCount}`)} | ${chalk.yellow(`◐ Partial: ${partialCount}`)} | ${chalk.blue(`○ Planned: ${plannedCount}`)} | ${chalk.red(`○ Missing: ${missingCount}`)}`));

  // Recommendations
  process.stdout.write('\n');
  if (alignment < 50) {
    printInfo(chalk.yellow('💡 Recommendation: Focus on core features first'));
  } else if (alignment < 80) {
    printInfo(chalk.yellow('💡 Recommendation: Continue implementation, polish partial features'));
  } else {
    printSuccess(chalk.green('✨ Excellent alignment! Consider testing and optimization'));
  }

  process.stdout.write('\n');
}

export function registerDiffCommand(program) {
  program
    .command('diff')
    .description('Compare implementation plan vs actual code')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        await diffCommand(options);
      } catch (error) {
        await handleError(error, { command: 'diff', options });
        process.exitCode = error.exitCode || 1;
        process.exit(process.exitCode);
      }
    });
}

function extractSections(plan) {
  const sections = [];
  const lines = plan.split('\n');
  let currentSection = null;
  let sectionContent = [];
  
  lines.forEach(line => {
    const headingMatch = line.match(/^(#{2,3})\s+(.+)$/);
    if (headingMatch) {
      if (currentSection) {
        sections.push({
          level: currentSection.level,
          title: currentSection.title,
          content: sectionContent.join('\n'),
          keywords: extractKeywords(currentSection.title, sectionContent.join('\n'))
        });
      }
      currentSection = {
        level: headingMatch[1].length,
        title: headingMatch[2].trim()
      };
      sectionContent = [];
    } else if (currentSection) {
      sectionContent.push(line);
    }
  });
  
  if (currentSection) {
    sections.push({
      level: currentSection.level,
      title: currentSection.title,
      content: sectionContent.join('\n'),
      keywords: extractKeywords(currentSection.title, sectionContent.join('\n'))
    });
  }
  
  return sections;
}

function extractKeywords(title, content) {
  const combined = `${title} ${content}`.toLowerCase();
  const words = combined.match(/\b[a-z][a-z0-9]+\b/g) || [];
  
  // Filter common words and keep meaningful ones
  const stopwords = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'from', 'will', 'have', 'has', 'are', 'was', 'were', 'been', 'being', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'shall', 'need', 'use', 'used', 'using', 'make', 'made', 'get', 'set', 'add', 'new', 'each', 'all', 'any', 'some', 'one', 'two']);
  
  return [...new Set(words.filter(w => w.length > 3 && !stopwords.has(w)))];
}

function checkImplementationStatus(sections, config = {}, state = null) {
  // Use configured directories or fallback to defaults
  const searchDirs = config.includeDirs || [config.srcDir || (
                 existsSync(join(process.cwd(), 'src')) ? 'src' : 
                 existsSync(join(process.cwd(), 'app')) ? 'app' :
                 existsSync(join(process.cwd(), 'lib')) ? 'lib' : 
                 existsSync(join(process.cwd(), 'pages')) ? 'pages' : null
  )].filter(Boolean);
  
  return sections.map(section => {
    const { keywords, title } = section;
    const matches = [];
    let matchCount = 0;
    let confidence = 0;
    
    // Check if this section has corresponding tasks in state
    let taskStatus = 'not_tracked';
    if (state?.phases) {
      for (const phase of state.phases) {
        const matchingTask = phase.steps?.find(step => 
          step.task?.toLowerCase().includes(title.toLowerCase()) ||
          title.toLowerCase().includes(step.task?.toLowerCase())
        );
        if (matchingTask) {
          taskStatus = matchingTask.status;
          break;
        }
      }
    }
    
    if (searchDirs.length > 0 && keywords.length > 0) {
      // Search codebase for keywords
      for (const keyword of keywords.slice(0, 5)) {
        for (const dir of searchDirs) {
          try {
            const result = execSync(`grep -ril "${keyword}" ${dir} 2>/dev/null || true`, {
              encoding: 'utf-8',
              maxBuffer: 1024 * 1024
            }).trim();
            
            if (result) {
              const files = result.split('\n').filter(Boolean);
              if (files.length > 0) {
                matchCount++;
                confidence += files.length * 10; // More files = higher confidence
                matches.push(...files.slice(0, 2).map(f => relative(process.cwd(), f)));
              }
            }
          } catch (e) {
            // grep failed, continue
          }
        }
      }
    }
    
    // Also check for matching file names
    for (const dir of searchDirs) {
      if (!existsSync(join(process.cwd(), dir))) continue;
      try {
        const files = readdirSync(join(process.cwd(), dir), { recursive: true });
        const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        titleWords.forEach(word => {
          const matchingFiles = files.filter(f => f.toLowerCase().includes(word));
          if (matchingFiles.length > 0) {
            matchCount++;
            confidence += matchingFiles.length * 15; // Filename match = higher confidence
            matches.push(...matchingFiles.slice(0, 2).map(f => `${dir}/${f}`));
          }
        });
      } catch (e) {
        // Error reading dir
      }
    }
    
    // Boost confidence for completed tasks
    if (taskStatus === 'completed') confidence += 50;
    if (taskStatus === 'in_progress') confidence += 25;
    
    // Cap confidence at 100
    confidence = Math.min(confidence, 100);
    
    // Determine status based on matches and task status
    const uniqueMatches = [...new Set(matches)];
    let status;
    
    if (taskStatus === 'completed' || (matchCount >= 3 && uniqueMatches.length >= 3)) {
      status = STATUS.DONE;
    } else if (taskStatus === 'in_progress' || (matchCount >= 2 || uniqueMatches.length >= 2)) {
      status = STATUS.PARTIAL;
    } else if (matchCount > 0 || uniqueMatches.length > 0 || taskStatus !== 'not_tracked') {
      status = STATUS.PLANNED;
    } else {
      status = STATUS.MISSING;
    }
    
    return {
      title: section.title,
      status,
      confidence,
      matches: uniqueMatches.slice(0, 3),
      taskStatus
    };
  });
}

// eslint-disable-next-line no-unused-vars
function searchInCode(keyword, dir) {
  try {
    const files = readdirSync(join(process.cwd(), dir), { recursive: true });
    return files.some(f => f.toLowerCase().includes(keyword));
  } catch (e) {
    return false;
  }
}