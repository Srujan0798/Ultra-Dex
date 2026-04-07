// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import ora from '../utils/ora.js';
import fs from 'fs';
import { resolve, basename, join } from 'path';
import yaml from 'js-yaml';
import { printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { AppError } from '../utils/errors.js';

export const IMPORT_EXAMPLES = [
  {
    command: 'ultra-dex import --file project-export.json',
    description: 'Import project context from JSON file',
  },
  {
    command: 'ultra-dex import --file backup.yaml --merge',
    description: 'Merge imported data with existing files',
  },
  {
    command: 'ultra-dex import --file external-plan.md --target plan',
    description: 'Import specifically into IMPLEMENTATION-PLAN.md',
  },
];

export async function importCommand(options) {
  if (!options.file) {
    throw new AppError('Import file path is required. Use --file <path>', {
      code: 'MISSING_FILE',
    });
  }

  const filePath = resolve(options.file);
  if (!fs.existsSync(filePath)) {
    throw new AppError(`File not found: ${options.file}`, {
      code: 'FILE_NOT_FOUND',
    });
  }

  printInfo(
    chalk.cyan.bold(`
📥 Ultra-Dex Import
`)
  );
  const spinner = ora(`Reading ${basename(filePath)}...`).start();

  try {
    const ext = filePath.split('.').pop().toLowerCase();
    const rawContent = fs.readFileSync(filePath, 'utf8');
    let data = {};

    if (ext === 'json') {
      data = JSON.parse(rawContent);
    } else if (ext === 'yaml' || ext === 'yml') {
      data = yaml.load(rawContent);
    } else if (ext === 'md' || ext === 'markdown') {
      data = parseMarkdownImport(rawContent);
    } else {
      throw new AppError(`Unsupported file format: .${ext}. Use JSON, YAML, or Markdown.`, {
        code: 'UNSUPPORTED_FORMAT',
      });
    }

    spinner.succeed('Data parsed successfully');

    if (options.target === 'plan') {
      await importIntoPlan(data, options.merge);
    } else if (options.target === 'context') {
      await importIntoContext(data, options.merge);
    } else {
      // Default behavior: Import all available core files
      await importFullContext(data, options.merge);
    }

    printSuccess(chalk.green('\n✅ Import completed successfully'));
  } catch (error) {
    spinner.fail('Import failed');
    await handleError(error, { command: 'import', options });
    process.exit(1);
  }
}

function parseMarkdownImport(content) {
  const sections = {};
  const lines = content.split('\n');
  let currentFile = null;
  let currentContent = [];

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.*)/);
    if (headingMatch) {
      if (currentFile) {
        sections[currentFile] = currentContent.join('\n').trim();
      }
      currentFile = headingMatch[1].trim();
      currentContent = [];
    } else if (currentFile) {
      // Strip code blocks if they wrap the content (exported format uses ```markdown)
      if (line.trim() !== '```markdown' && line.trim() !== '```') {
        currentContent.push(line);
      }
    }
  }

  if (currentFile) {
    sections[currentFile] = currentContent.join('\n').trim();
  }

  return { files: sections };
}

async function importIntoPlan(data, merge) {
  const planPath = resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md');
  const content = data.files?.['IMPLEMENTATION-PLAN.md'] || data.content || '';

  if (!content) throw new Error('No implementation plan content found in source.');

  if (fs.existsSync(planPath) && !merge) {
    printWarning(chalk.yellow('   Overwriting existing IMPLEMENTATION-PLAN.md'));
  }

  fs.writeFileSync(planPath, content);
  printInfo(chalk.gray('   Written: IMPLEMENTATION-PLAN.md'));
}

async function importIntoContext(data, merge) {
  const contextPath = resolve(process.cwd(), 'CONTEXT.md');
  const content = data.files?.['CONTEXT.md'] || data.content || '';

  if (!content) throw new Error('No context content found in source.');

  if (fs.existsSync(contextPath) && !merge) {
    printWarning(chalk.yellow('   Overwriting existing CONTEXT.md'));
  }

  fs.writeFileSync(contextPath, content);
  printInfo(chalk.gray('   Written: CONTEXT.md'));
}

async function importFullContext(data, merge) {
  const files = data.files || {};
  for (const [filename, content] of Object.entries(files)) {
    const targetPath = resolve(process.cwd(), filename);
    if (fs.existsSync(targetPath) && !merge) {
      printWarning(chalk.yellow(`   Overwriting existing ${filename}`));
    }
    fs.writeFileSync(targetPath, content);
    printInfo(chalk.gray(`   Written: ${filename}`));
  }

  if (data.state) {
    const stateDir = resolve(process.cwd(), '.ultra');
    if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });
    fs.writeFileSync(join(stateDir, 'state.json'), JSON.stringify(data.state, null, 2));
    printInfo(chalk.gray('   Restored: .ultra/state.json'));
  }
}

export function registerImportCommand(program) {
  program
    .command('import')
    .description('Import project context from a file')
    .option('-f, --file <path>', 'Source file to import (JSON, YAML, or MD)')
    .option('-m, --merge', 'Merge with existing files instead of overwriting', false)
    .option('-t, --target <type>', 'Target specific component: plan, context, or all', 'all')
    .addHelpText(
      'after',
      `
Examples:
  $ ultra-dex import --file export.json
  $ ultra-dex import --file backup.yaml --merge
  $ ultra-dex import --file plan.md --target plan
    `
    )
    .action(async (options) => {
      await importCommand(options);
    });
}
