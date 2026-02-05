/**
 * Enhanced diff command with drift analysis
 * Compares IMPLEMENTATION-PLAN.md vs actual implementation
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { AppError } from '../utils/errors.js';

const DEFAULT_IGNORED_DIRS = new Set(['node_modules', '.git', '.ultra', '.vscode', 'dist', 'build']);
const SOURCE_EXTENSIONS = new Set(['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rb', '.java', '.md', '.json', '.yaml', '.yml']);

/**
 * Parse IMPLEMENTATION-PLAN.md for expected tasks
 */
async function parseImplementationPlan() {
  try {
    const planPath = path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md');
    const planContent = await fs.readFile(planPath, 'utf8');

    // Extract tasks from the plan
    const tasks = [];
    const lines = planContent.split('\n');
    let currentSection = '';

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      // Identify sections
      const sectionMatch = line.match(/^##\s+(.*)/);
      if (sectionMatch) {
        currentSection = sectionMatch[1].trim();
        continue;
      }

      // Identify tasks (checkboxes or bullet points)
      const taskMatch = line.match(/^- \[([ x])\]\s+(.*)|- (.*)/);
      if (taskMatch) {
        const isCompleted = taskMatch[1] === 'x';
        const taskDesc = taskMatch[2] || taskMatch[3];

        tasks.push({
          section: currentSection,
          description: taskDesc.trim(),
          completed: isCompleted,
          line: line.trim(),
          lineNumber: index + 1
        });
      }
    }

    return tasks;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new AppError('IMPLEMENTATION-PLAN.md not found in current directory', { code: 'PLAN_NOT_FOUND' });
    }
    throw error;
  }
}

async function listFilesRecursive(rootDir) {
  const files = [];

  async function scanDir(dirPath) {
    const items = await fs.readdir(dirPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);

      if (item.isDirectory()) {
        if (!DEFAULT_IGNORED_DIRS.has(item.name)) {
          await scanDir(fullPath);
        }
        continue;
      }

      if (!item.isFile()) continue;

      const ext = path.extname(item.name);
      if (!SOURCE_EXTENSIONS.has(ext)) continue;

      files.push(fullPath);
    }
  }

  await scanDir(rootDir);
  return files;
}

/**
 * Scan actual implementation files
 */
async function scanImplementation() {
  const filePaths = await listFilesRecursive(process.cwd());
  const files = [];

  for (const filePath of filePaths) {
    const content = await fs.readFile(filePath, 'utf8');
    files.push({
      path: path.relative(process.cwd(), filePath),
      content,
      size: content.length
    });
  }

  return files;
}

/**
 * Compare plan vs implementation
 */
async function comparePlanVsImplementation() {
  const planTasks = await parseImplementationPlan();
  const implementationFiles = await scanImplementation();

  const results = {
    completedTasks: 0,
    pendingTasks: 0,
    missingImplementations: [],
    extraImplementations: [],
    fileMatches: [],
    driftAnalysis: []
  };

  // Count completed vs pending tasks from plan
  for (const task of planTasks) {
    if (task.completed) {
      results.completedTasks++;
      continue;
    }

    results.pendingTasks++;

    // Check if this task has been implemented elsewhere
    let isImplemented = false;
    for (const file of implementationFiles) {
      if (file.content.toLowerCase().includes(task.description.toLowerCase())) {
        isImplemented = true;
        results.fileMatches.push({
          task: task.description,
          file: file.path,
          section: task.section
        });
        break;
      }
    }

    if (!isImplemented) {
      results.missingImplementations.push({
        task: task.description,
        section: task.section,
        line: task.line,
        lineNumber: task.lineNumber
      });
    }
  }

  // Look for code that might implement tasks not in the plan
  for (const file of implementationFiles) {
    const todoMatches = file.content.match(/TODO:?\s*(.+)/gi);
    if (!todoMatches) continue;

    for (const match of todoMatches) {
      results.extraImplementations.push({
        todo: match,
        file: file.path
      });
    }
  }

  return results;
}

/**
 * Generate drift analysis report (terminal-friendly)
 */
function generateDriftReport(results) {
  const report = [];

  report.push(chalk.bold.cyan('\n🔍 DRIFT ANALYSIS REPORT\n'));
  report.push(`📊 Total Tasks: ${results.completedTasks + results.pendingTasks}`);
  report.push(`✅ Completed: ${results.completedTasks}`);
  report.push(`⏳ Pending: ${results.pendingTasks}`);
  report.push(`❌ Missing Implementations: ${results.missingImplementations.length}`);
  report.push(`➕ Extra Implementations: ${results.extraImplementations.length}\n`);

  if (results.missingImplementations.length > 0) {
    report.push(chalk.bold.red('❌ MISSING IMPLEMENTATIONS\n'));
    for (const missing of results.missingImplementations.slice(0, 10)) {
      report.push(`  • [${missing.section}] ${missing.task}`);
      const location = missing.lineNumber ? `IMPLEMENTATION-PLAN.md:${missing.lineNumber}` : 'IMPLEMENTATION-PLAN.md';
      report.push(`    Location: ${location}\n`);
    }

    if (results.missingImplementations.length > 10) {
      report.push(`  ... and ${results.missingImplementations.length - 10} more\n`);
    }
  }

  if (results.extraImplementations.length > 0) {
    report.push(chalk.bold.yellow('➕ EXTRA IMPLEMENTATIONS (not in plan)\n'));
    for (const extra of results.extraImplementations.slice(0, 10)) {
      report.push(`  • ${extra.todo}`);
      report.push(`    File: ${extra.file}\n`);
    }

    if (results.extraImplementations.length > 10) {
      report.push(`  ... and ${results.extraImplementations.length - 10} more\n`);
    }
  }

  if (results.fileMatches.length > 0) {
    report.push(chalk.bold.green('✅ IMPLEMENTED BUT MARKED PENDING\n'));
    for (const match of results.fileMatches.slice(0, 10)) {
      report.push(`  • ${match.task}`);
      report.push(`    Section: ${match.section}`);
      report.push(`    Found in: ${match.file}\n`);
    }

    if (results.fileMatches.length > 10) {
      report.push(`  ... and ${results.fileMatches.length - 10} more\n`);
    }
  }

  return report.join('\n');
}

function buildDeltaReportData(results, exampleComparison) {
  const totalTasks = results.completedTasks + results.pendingTasks;
  const completionPercentage = totalTasks > 0
    ? Math.round((results.completedTasks / totalTasks) * 100)
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalTasks,
      completedTasks: results.completedTasks,
      pendingTasks: results.pendingTasks,
      completionPercentage,
      missingImplementations: results.missingImplementations.length,
      extraImplementations: results.extraImplementations.length,
      implementedPending: results.fileMatches.length
    },
    missingImplementations: results.missingImplementations,
    extraImplementations: results.extraImplementations,
    implementedPending: results.fileMatches,
    exampleComparison
  };
}

function renderDeltaReportMarkdown(data) {
  const lines = [];
  lines.push('# Ultra-Dex Delta Report');
  lines.push('');
  lines.push(`Generated: ${new Date(data.generatedAt).toLocaleString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Total Tasks: ${data.summary.totalTasks}`);
  lines.push(`- Completed: ${data.summary.completedTasks}`);
  lines.push(`- Pending: ${data.summary.pendingTasks}`);
  lines.push(`- Completion: ${data.summary.completionPercentage}%`);
  lines.push(`- Missing Implementations: ${data.summary.missingImplementations}`);
  lines.push(`- Extra Implementations: ${data.summary.extraImplementations}`);
  lines.push(`- Implemented but Pending: ${data.summary.implementedPending}`);
  lines.push('');

  if (data.missingImplementations.length > 0) {
    lines.push('## Missing Implementations');
    lines.push('');
    data.missingImplementations.forEach((missing) => {
      const location = missing.lineNumber ? ` (IMPLEMENTATION-PLAN.md:${missing.lineNumber})` : '';
      lines.push(`- [${missing.section}] ${missing.task}${location}`);
    });
    lines.push('');
  }

  if (data.extraImplementations.length > 0) {
    lines.push('## Extra Implementations');
    lines.push('');
    data.extraImplementations.forEach((extra) => {
      lines.push(`- ${extra.todo} (${extra.file})`);
    });
    lines.push('');
  }

  if (data.implementedPending.length > 0) {
    lines.push('## Implemented but Pending');
    lines.push('');
    data.implementedPending.forEach((match) => {
      lines.push(`- ${match.task} (${match.file})`);
    });
    lines.push('');
  }

  if (data.exampleComparison) {
    lines.push('## Example Comparison');
    lines.push('');
    lines.push(`- Example: ${data.exampleComparison.example || 'unknown'}`);
    lines.push(`- Common files: ${data.exampleComparison.commonFiles || 0}`);
    lines.push(`- Unique to example: ${data.exampleComparison.uniqueToExample || 0}`);
    lines.push(`- Unique to current: ${data.exampleComparison.uniqueToCurrent || 0}`);
    if (data.exampleComparison.samples) {
      lines.push('');
      lines.push(`Sample common files: ${data.exampleComparison.samples.common.join(', ') || 'None'}`);
      lines.push(`Sample unique to example: ${data.exampleComparison.samples.uniqueToExample.join(', ') || 'None'}`);
      lines.push(`Sample unique to current: ${data.exampleComparison.samples.uniqueToCurrent.join(', ') || 'None'}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

async function writeDeltaReport(reportPath, data) {
  const resolvedPath = path.resolve(process.cwd(), reportPath);
  const cwd = process.cwd();
  if (!resolvedPath.startsWith(cwd)) {
    throw new AppError('Invalid report path. Path traversal detected.', { code: 'REPORT_PATH_INVALID' });
  }

  const extension = path.extname(resolvedPath).toLowerCase();
  const format = extension === '.json' ? 'json' : 'md';
  const content = format === 'json' ? JSON.stringify(data, null, 2) : renderDeltaReportMarkdown(data);

  await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
  await fs.writeFile(resolvedPath, content, 'utf8');

  return { path: resolvedPath, format };
}

/**
 * Compare with example project
 */
async function compareWithExample(exampleName) {
  const examplesDir = path.resolve(process.cwd(), 'examples');

  try {
    const entries = await fs.readdir(examplesDir, { withFileTypes: true });
    const exampleDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

    const matchingExample = exampleDirs.find((dir) => dir.toLowerCase() === exampleName.toLowerCase());
    if (!matchingExample) {
      return {
        error: `Example project not found: ${exampleName}`,
        available: exampleDirs
      };
    }

    const examplePath = path.join(examplesDir, matchingExample);
    const exampleFiles = (await listFilesRecursive(examplePath))
      .map((file) => path.relative(examplePath, file));

    const currentFiles = (await listFilesRecursive(process.cwd()))
      .map((file) => path.relative(process.cwd(), file));

    const commonFiles = exampleFiles.filter((f) => currentFiles.includes(f));
    const uniqueToExample = exampleFiles.filter((f) => !currentFiles.includes(f));
    const uniqueToCurrent = currentFiles.filter((f) => !exampleFiles.includes(f));

    return {
      example: matchingExample,
      commonFiles: commonFiles.length,
      uniqueToExample: uniqueToExample.length,
      uniqueToCurrent: uniqueToCurrent.length,
      samples: {
        common: commonFiles.slice(0, 5),
        uniqueToExample: uniqueToExample.slice(0, 5),
        uniqueToCurrent: uniqueToCurrent.slice(0, 5)
      }
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Main diff command
 */
export async function diffCommand(options = {}) {
  try {
    printInfo(chalk.cyan.bold('\n🔍 Ultra-Dex Smart Diff\n'));

    const resolvedReport = options.report || options.output || null;

    const results = await comparePlanVsImplementation();
    const exampleComparison = options.withExample ? await compareWithExample(options.withExample) : null;
    const reportData = buildDeltaReportData(results, exampleComparison);

    let reportInfo = null;
    if (resolvedReport) {
      reportInfo = await writeDeltaReport(resolvedReport, reportData);
      printSuccess(chalk.green(`✅ Delta report saved to ${reportInfo.path}`));
    }

    if (options.json) {
      process.stdout.write(JSON.stringify({
        ...reportData,
        report: reportInfo
      }, null, 2) + '\n');
      return;
    }

    if (options.drift) {
      printInfo(generateDriftReport(results));
    } else {
      const totalTasks = reportData.summary.totalTasks;
      const completedTasks = reportData.summary.completedTasks;
      const completionPercentage = reportData.summary.completionPercentage;

      printSuccess(chalk.green(`\n✅ Found ${totalTasks} tasks in plan`));
      printInfo(chalk.blue(`📈 Overall Completion: ${completionPercentage}% (${completedTasks}/${totalTasks})`));

      if (completionPercentage >= 80) {
        printSuccess(chalk.green('🎉 Project is highly aligned with plan'));
      } else if (completionPercentage >= 50) {
        printInfo(chalk.yellow('⚠️  Moderate alignment with plan - review discrepancies'));
      } else {
        printWarning(chalk.red('🚨 Low alignment with plan - significant drift detected'));
      }

      if (reportData.missingImplementations.length > 0) {
        printWarning(chalk.red(`\n❌ Missing Implementations (${reportData.missingImplementations.length})`));
        reportData.missingImplementations.slice(0, 10).forEach((missing) => {
          const location = missing.lineNumber ? ` (${missing.lineNumber})` : '';
          printWarning(chalk.red(`  • [${missing.section}] ${missing.task}${location}`));
        });
      }
    }

    if (exampleComparison) {
      if (exampleComparison.error) {
        printWarning(chalk.yellow(`\n⚠️  ${exampleComparison.error}`));
        if (exampleComparison.available) {
          printInfo(chalk.gray(`   Available: ${exampleComparison.available.join(', ')}`));
        }
      } else {
        printInfo(chalk.cyan.bold('\n📋 Example Comparison'));
        printInfo(chalk.gray(`  Example: ${exampleComparison.example}`));
        printInfo(chalk.gray(`  Common files: ${exampleComparison.commonFiles}`));
        printInfo(chalk.gray(`  Unique to example: ${exampleComparison.uniqueToExample}`));
        printInfo(chalk.gray(`  Unique to current: ${exampleComparison.uniqueToCurrent}`));
      }
    }
  } catch (error) {
    await handleError(error, { command: 'diff', options });
    process.exitCode = error.exitCode || 1;
    process.exit(process.exitCode);
  }
}

/**
 * Register the diff command with Commander
 */
export function registerDiffCommand(program) {
  program
    .command('diff')
    .description('Compare IMPLEMENTATION-PLAN.md vs actual implementation')
    .option('--drift', 'Show detailed drift analysis between plan and implementation')
    .option('--with-example <name>', 'Compare with example project')
    .option('--json', 'Output as JSON')
    .option('--report <path>', 'Write delta report to a file (json or md)')
    .option('--output <path>', 'Alias for --report')
    .action(async (options) => {
      await diffCommand(options);
    });
}
