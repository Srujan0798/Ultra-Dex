// Copyright (c) 2026 Ultra-Dex

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

const DEFAULT_IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.ultra',
  '.vscode',
  'dist',
  'build',
]);
const DEFAULT_IGNORED_FILES = new Set(['IMPLEMENTATION-PLAN.md', 'CONTEXT.md', 'ULTRA.md']);
const SOURCE_EXTENSIONS = new Set([
  '.js',
  '.ts',
  '.jsx',
  '.tsx',
  '.py',
  '.go',
  '.rb',
  '.java',
  '.md',
  '.json',
  '.yaml',
  '.yml',
]);

/**
 * Parse IMPLEMENTATION-PLAN.md for expected tasks
 */
async function parseImplementationPlan(sectionFilter = null) {
  try {
    const planPath = path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md');
    const planContent = await fs.readFile(planPath, 'utf8');

    // Extract tasks from the plan
    const tasks = [];
    const lines = planContent.split('\n');
    let currentSection = '';
    let currentSectionNumber = null;

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      // Identify sections
      const sectionMatch = line.match(/^##\s+(?:SECTION\s+)?(\d+)[:.]?\s*(.*)/i);
      if (sectionMatch) {
        currentSectionNumber = parseInt(sectionMatch[1], 10);
        currentSection = sectionMatch[2]
          ? sectionMatch[2].trim()
          : `Section ${currentSectionNumber}`;
        continue;
      }

      // Identify tasks (checkboxes or bullet points)
      const taskMatch = line.match(/^- \[([ x])\]\s+(.*)|- (.*)/);
      if (taskMatch) {
        const isCompleted = taskMatch[1] === 'x';
        const taskDesc = taskMatch[2] || taskMatch[3];

        if (
          sectionFilter &&
          currentSectionNumber &&
          !sectionFilter.includes(currentSectionNumber)
        ) {
          continue;
        }

        tasks.push({
          section: currentSection,
          sectionNumber: currentSectionNumber,
          description: taskDesc.trim(),
          completed: isCompleted,
          line: line.trim(),
          lineNumber: index + 1,
        });
      }
    }

    return tasks;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new AppError('IMPLEMENTATION-PLAN.md not found in current directory', {
        code: 'PLAN_NOT_FOUND',
      });
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

      if (DEFAULT_IGNORED_FILES.has(item.name)) continue;

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
      size: content.length,
    });
  }

  return files;
}

/**
 * Compare plan vs implementation
 */
async function comparePlanVsImplementation(options = {}) {
  const sectionFilter = options.sections ? parseSectionRanges(options.sections) : null;
  const planTasks = await parseImplementationPlan(sectionFilter);
  const implementationFiles = await scanImplementation();

  const results = {
    completedTasks: 0,
    pendingTasks: 0,
    missingImplementations: [],
    extraImplementations: [],
    fileMatches: [],
    driftAnalysis: [],
    implementationFilesCount: implementationFiles.length,
    sectionStats: {},
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
          section: task.section,
        });
        break;
      }
    }

    if (!isImplemented) {
      results.missingImplementations.push({
        task: task.description,
        section: task.section,
        sectionNumber: task.sectionNumber,
        line: task.line,
        lineNumber: task.lineNumber,
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
        file: file.path,
      });
    }
  }

  // Section-level drift stats
  const sectionStats = {};
  for (const task of planTasks) {
    const key = task.sectionNumber || task.section || 'Uncategorized';
    if (!sectionStats[key]) {
      sectionStats[key] = {
        section: task.section,
        sectionNumber: task.sectionNumber,
        total: 0,
        completed: 0,
        missing: 0,
      };
    }
    sectionStats[key].total += 1;
    if (task.completed) sectionStats[key].completed += 1;
  }

  for (const missing of results.missingImplementations) {
    const key = missing.sectionNumber || missing.section || 'Uncategorized';
    if (sectionStats[key]) sectionStats[key].missing += 1;
  }

  results.sectionStats = sectionStats;

  return results;
}

/**
 * Generate drift analysis report (terminal-friendly)
 */
function generateDriftReport(results) {
  const report = [];
  const totalTasks = results.completedTasks + results.pendingTasks;
  const alignment = totalTasks > 0 ? Math.round((results.completedTasks / totalTasks) * 100) : 0;

  report.push(chalk.bold.cyan('\n🔍 DRIFT ANALYSIS REPORT\n'));
  report.push(`📊 Total Tasks: ${totalTasks}`);
  report.push(`✅ Completed: ${results.completedTasks}`);
  report.push(`⏳ Pending: ${results.pendingTasks}`);
  report.push(`📈 Alignment: ${alignment}%`);
  report.push(`❌ Missing Implementations: ${results.missingImplementations.length}`);
  report.push(`➕ Extra Implementations: ${results.extraImplementations.length}\n`);

  const sectionEntries = Object.values(results.sectionStats || {});
  if (sectionEntries.length > 0) {
    report.push(chalk.bold.cyan('📌 Section Drift Summary\n'));
    sectionEntries.slice(0, 12).forEach((entry) => {
      const completed = entry.completed || 0;
      const total = entry.total || 0;
      const missing = entry.missing || 0;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      report.push(
        `  • [${entry.sectionNumber ?? 'N/A'}] ${entry.section || 'Uncategorized'}: ${percentage}% (${completed}/${total}) missing ${missing}`
      );
    });
    report.push('');
  }

  if (results.missingImplementations.length > 0) {
    report.push(chalk.bold.red('❌ MISSING IMPLEMENTATIONS\n'));
    for (const missing of results.missingImplementations.slice(0, 10)) {
      report.push(`  • [${missing.section}] ${missing.task}`);
      const location = missing.lineNumber
        ? `IMPLEMENTATION-PLAN.md:${missing.lineNumber}`
        : 'IMPLEMENTATION-PLAN.md';
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
  const completionPercentage =
    totalTasks > 0 ? Math.round((results.completedTasks / totalTasks) * 100) : 0;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalTasks,
      completedTasks: results.completedTasks,
      pendingTasks: results.pendingTasks,
      completionPercentage,
      missingImplementations: results.missingImplementations.length,
      extraImplementations: results.extraImplementations.length,
      implementedPending: results.fileMatches.length,
      implementationFilesCount: results.implementationFilesCount,
    },
    missingImplementations: results.missingImplementations,
    extraImplementations: results.extraImplementations,
    implementedPending: results.fileMatches,
    sectionStats: results.sectionStats,
    exampleComparison,
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

  if (data.sectionStats) {
    lines.push('## Section Drift Summary');
    lines.push('');
    Object.values(data.sectionStats).forEach((entry) => {
      const total = entry.total || 0;
      const completed = entry.completed || 0;
      const missing = entry.missing || 0;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      lines.push(
        `- [${entry.sectionNumber ?? 'N/A'}] ${entry.section || 'Uncategorized'}: ${percentage}% (${completed}/${total}) missing ${missing}`
      );
    });
    lines.push('');
  }

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
      lines.push(
        `Sample common files: ${data.exampleComparison.samples.common.join(', ') || 'None'}`
      );
      lines.push(
        `Sample unique to example: ${data.exampleComparison.samples.uniqueToExample.join(', ') || 'None'}`
      );
      lines.push(
        `Sample unique to current: ${data.exampleComparison.samples.uniqueToCurrent.join(', ') || 'None'}`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

function parseSectionRanges(rangesString) {
  if (!rangesString) return null;
  const sections = new Set();
  const parts = rangesString.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(Number);
      if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
        return null;
      }
      for (let i = start; i <= end; i += 1) sections.add(i);
    } else {
      const num = Number(trimmed);
      if (Number.isNaN(num)) return null;
      sections.add(num);
    }
  }

  return Array.from(sections).sort((a, b) => a - b);
}

async function writeDeltaReport(reportPath, data) {
  const resolvedPath = path.resolve(process.cwd(), reportPath);
  const cwd = process.cwd();
  if (!resolvedPath.startsWith(cwd)) {
    throw new AppError('Invalid report path. Path traversal detected.', {
      code: 'REPORT_PATH_INVALID',
    });
  }

  const extension = path.extname(resolvedPath).toLowerCase();
  const format = extension === '.json' ? 'json' : extension === '.html' ? 'html' : 'md';
  const content =
    format === 'json'
      ? JSON.stringify(data, null, 2)
      : format === 'html'
        ? renderDeltaReportHtml(data)
        : renderDeltaReportMarkdown(data);

  await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
  await fs.writeFile(resolvedPath, content, 'utf8');

  return { path: resolvedPath, format };
}

function renderDeltaReportHtml(data) {
  const rows = Object.values(data.sectionStats || {})
    .map((entry) => {
      const total = entry.total || 0;
      const completed = entry.completed || 0;
      const missing = entry.missing || 0;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      const status = percentage >= 80 ? 'good' : percentage >= 50 ? 'warn' : 'bad';
      return `<tr class="${status}">
      <td>${entry.sectionNumber ?? 'N/A'}</td>
      <td>${entry.section || 'Uncategorized'}</td>
      <td>${percentage}%</td>
      <td>${completed}/${total}</td>
      <td>${missing}</td>
    </tr>`;
    })
    .join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ultra-Dex Drift Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; background: #0f172a; color: #e2e8f0; }
    h1 { color: #38bdf8; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #334155; padding: 8px; text-align: left; }
    tr.good { background: #0f3d2e; }
    tr.warn { background: #4a3f0f; }
    tr.bad { background: #4a1010; }
    .summary { margin-top: 16px; }
  </style>
</head>
<body>
  <h1>Ultra-Dex Drift Report</h1>
  <div class="summary">
    <p>Generated: ${new Date(data.generatedAt).toLocaleString()}</p>
    <p>Completion: ${data.summary.completionPercentage}% (${data.summary.completedTasks}/${data.summary.totalTasks})</p>
  </div>
  <h2>Section Drift Summary</h2>
  <table>
    <thead>
      <tr><th>Section</th><th>Title</th><th>Completion</th><th>Done</th><th>Missing</th></tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="5">No section data</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;
}

/**
 * Compare with example project
 */
async function compareWithExample(exampleName) {
  const examplesDir = path.resolve(process.cwd(), 'examples');

  try {
    const entries = await fs.readdir(examplesDir, { withFileTypes: true });
    const exampleDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

    const matchingExample = exampleDirs.find(
      (dir) => dir.toLowerCase() === exampleName.toLowerCase()
    );
    if (!matchingExample) {
      return {
        error: `Example project not found: ${exampleName}`,
        available: exampleDirs,
      };
    }

    const examplePath = path.join(examplesDir, matchingExample);
    const exampleFiles = (await listFilesRecursive(examplePath)).map((file) =>
      path.relative(examplePath, file)
    );

    const currentFiles = (await listFilesRecursive(process.cwd())).map((file) =>
      path.relative(process.cwd(), file)
    );

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
        uniqueToCurrent: uniqueToCurrent.slice(0, 5),
      },
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

    if (options.analyzeDrift && !options.drift) {
      options.drift = true;
    }

    const resolvedReport = options.report || options.output || null;

    if (options.sections) {
      const parsed = parseSectionRanges(options.sections);
      if (!parsed || parsed.length === 0) {
        throw new AppError('Invalid --sections list. Use comma-separated numbers or ranges.', {
          code: 'SECTIONS_INVALID',
        });
      }
    }

    const results = await comparePlanVsImplementation(options);
    const exampleComparison = options.withExample
      ? await compareWithExample(options.withExample)
      : null;
    const reportData = buildDeltaReportData(results, exampleComparison);

    let reportInfo = null;
    if (resolvedReport) {
      reportInfo = await writeDeltaReport(resolvedReport, reportData);
      printSuccess(chalk.green(`✅ Delta report saved to ${reportInfo.path}`));
    }

    if (options.json) {
      process.stdout.write(
        JSON.stringify(
          {
            alignment: reportData.summary.completionPercentage,
            sections: reportData.sectionStats,
            ...reportData,
            report: reportInfo,
          },
          null,
          2
        ) + '\n'
      );
      return;
    }

    if (options.drift || (!options.detailed && !options.summary)) {
      printInfo(generateDriftReport(results));
    } else if (options.detailed) {
      // Generate detailed report with color-coded output
      const totalTasks = reportData.summary.totalTasks;
      const completedTasks = reportData.summary.completedTasks;
      const completionPercentage = reportData.summary.completionPercentage;

      printSuccess(chalk.green(`\n✅ Found ${totalTasks} tasks in plan`));
      printSuccess(
        chalk.green(`✅ Found ${reportData.summary.implementationFilesCount} implementation files`)
      );

      printInfo(
        chalk.blue(
          `\n📈 Overall Completion: ${completionPercentage}% (${completedTasks}/${totalTasks})`
        )
      );

      // Show color-coded status
      if (completionPercentage >= 80) {
        printSuccess(chalk.green('🎉 Project is highly aligned with plan'));
      } else if (completionPercentage >= 50) {
        printInfo(chalk.yellow('⚠️  Moderate alignment with plan - review discrepancies'));
      } else {
        printWarning(chalk.red('🚨 Low alignment with plan - significant drift detected'));
      }

      // Show missing implementations in red
      if (reportData.missingImplementations.length > 0) {
        printInfo(chalk.red.bold('\n❌ MISSING IMPLEMENTATIONS\n'));
        reportData.missingImplementations.slice(0, 10).forEach((missing) => {
          const location = missing.lineNumber ? ` (Line ${missing.lineNumber})` : '';
          printInfo(chalk.red(`  • [${missing.section}] ${missing.task}${location}`));
        });

        if (reportData.missingImplementations.length > 10) {
          printInfo(chalk.red(`  ... and ${reportData.missingImplementations.length - 10} more`));
        }
      }

      // Show extra implementations in yellow
      if (reportData.extraImplementations.length > 0) {
        printInfo(chalk.yellow.bold('\n➕ EXTRA IMPLEMENTATIONS (not in plan)\n'));
        reportData.extraImplementations.slice(0, 10).forEach((extra) => {
          printInfo(chalk.yellow(`  • ${extra.todo} (in ${extra.file})`));
        });

        if (reportData.extraImplementations.length > 10) {
          printInfo(chalk.yellow(`  ... and ${reportData.extraImplementations.length - 10} more`));
        }
      }

      // Show implemented but pending in green
      if (reportData.implementedPending.length > 0) {
        printInfo(chalk.green.bold('\n✅ IMPLEMENTED BUT MARKED PENDING\n'));
        reportData.implementedPending.slice(0, 10).forEach((match) => {
          printInfo(chalk.green(`  • ${match.task} (found in ${match.file})`));
        });

        if (reportData.implementedPending.length > 10) {
          printInfo(chalk.green(`  ... and ${reportData.implementedPending.length - 10} more`));
        }
      }
    } else {
      const totalTasks = reportData.summary.totalTasks;
      const completedTasks = reportData.summary.completedTasks;
      const completionPercentage = reportData.summary.completionPercentage;

      printSuccess(chalk.green(`\n✅ Found ${totalTasks} tasks in plan`));
      printSuccess(
        chalk.green(`✅ Found ${reportData.summary.implementationFilesCount} implementation files`)
      );

      printInfo(
        chalk.blue(
          `\n📈 Overall Completion: ${completionPercentage}% (${completedTasks}/${totalTasks})`
        )
      );

      if (completionPercentage >= 80) {
        printSuccess(chalk.green('🎉 Project is highly aligned with plan'));
      } else if (completionPercentage >= 50) {
        printInfo(chalk.yellow('⚠️  Moderate alignment with plan - review discrepancies'));
      } else {
        printWarning(chalk.red('🚨 Low alignment with plan - significant drift detected'));
      }

      if (reportData.missingImplementations.length > 0) {
        printWarning(
          chalk.red(`\n❌ Missing Implementations (${reportData.missingImplementations.length})`)
        );
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
    .option('--analyze-drift', 'Alias for --drift')
    .option('--detailed', 'Show detailed diff report with color-coded output')
    .option('--with-example <name>', 'Compare with example project')
    .option('--sections <list>', 'Limit diff analysis to specific sections (e.g., 1-3,5)')
    .option('--json', 'Output as JSON')
    .option('--report <path>', 'Write delta report to a file (json or md)')
    .option('--output <path>', 'Alias for --report')
    .action(async (options) => {
      await diffCommand(options);
    });
}
