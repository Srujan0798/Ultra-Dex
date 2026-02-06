// Copyright (c) 2026 Ultra-Dex

/**
 * Interactive Docs TUI
 * Terminal-based documentation browser
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { glob } from 'glob';
import { printInfo, printError, printSuccess } from '../utils/output.js';

/**
 * Find documentation files in the project
 */
async function findDocs() {
  const docPatterns = [
    'docs/**/*.md',
    'DOCUMENTATION.md',
    'README.md',
    'CONTRIBUTING.md',
    'CHANGELOG.md',
    'LICENSE',
    'docs/**/*.txt',
    'guides/**/*.md',
    'tutorials/**/*.md',
    'examples/**/*.md',
  ];

  const docs = [];

  for (const pattern of docPatterns) {
    try {
      const files = await glob(pattern, { cwd: process.cwd(), absolute: true });
      for (const file of files) {
        const stat = await fs.stat(file);
        if (stat.isFile()) {
          docs.push({
            path: file,
            relativePath: path.relative(process.cwd(), file),
            size: stat.size,
            modified: stat.mtime,
          });
        }
      }
    } catch (error) {
      // Pattern didn't match any files, continue
    }
  }

  // Sort by path for consistent ordering
  docs.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  return docs;
}

/**
 * Read and format a documentation file
 */
async function readDocFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');

    // Simple markdown formatting for terminal
    return formatMarkdown(content);
  } catch (error) {
    throw new Error(`Could not read documentation file: ${error.message}`);
  }
}

/**
 * Simple markdown formatter for terminal
 */
function formatMarkdown(mdContent) {
  // This is a simplified markdown formatter
  // In a real implementation, this would be more sophisticated

  return (
    mdContent
      // Headers
      .replace(/^### (.*$)/gm, chalk.bold.cyan('$1'))
      .replace(/^## (.*$)/gm, chalk.bold.yellow('$1'))
      .replace(/^# (.*$)/gm, chalk.bold.red('$1'))
      // Bold
      .replace(/\*\*(.*?)\*\*/g, chalk.bold('$1'))
      .replace(/__(.*?)__/g, chalk.bold('$1'))
      // Italic
      .replace(/\*(.*?)\*/g, chalk.italic('$1'))
      .replace(/_(.*?)_/g, chalk.italic('$1'))
      // Code blocks
      .replace(/`(.*?)`/g, chalk.bgBlack.white('$1'))
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
        return `${chalk.blue.underline(text)} ${chalk.gray(`(${url})`)}`;
      })
      // Lists
      .replace(/^\s*-\s+(.*$)/gm, chalk.gray('• $1'))
      .replace(/^\s*\*\s+(.*$)/gm, chalk.gray('• $1'))
      .replace(/^\s*\d+\.\s+(.*$)/gm, chalk.gray('$&'))
  );
}

/**
 * Search documentation content
 */
async function searchDocs(query) {
  const docs = await findDocs();
  const results = [];

  for (const doc of docs) {
    try {
      const content = await fs.readFile(doc.path, 'utf8');
      const lowerContent = content.toLowerCase();
      const lowerQuery = query.toLowerCase();

      if (lowerContent.includes(lowerQuery)) {
        // Find context around the match
        const lines = content.split('\n');
        const matchingLines = [];

        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(lowerQuery)) {
            // Include the matching line and surrounding context
            const start = Math.max(0, i - 2);
            const end = Math.min(lines.length, i + 3);

            for (let j = start; j < end; j++) {
              const line = lines[j];
              if (j === i) {
                // Highlight the matching line
                const highlighted = line.replace(
                  new RegExp(`(${query})`, 'gi'),
                  chalk.bgYellow.black('$1')
                );
                matchingLines.push(`  ${j + 1}: ${highlighted}`);
              } else {
                matchingLines.push(`  ${j + 1}: ${line}`);
              }
            }

            // Limit to first few matches per file
            break;
          }
        }

        results.push({
          ...doc,
          matches: matchingLines,
          matchCount: matchingLines.length,
        });
      }
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }

  return results;
}

/**
 * Show documentation browser menu
 */
async function showDocsBrowser() {
  console.log(chalk.cyan('\n📖 Ultra-Dex Documentation Browser\n'));

  while (true) {
    try {
      const docs = await findDocs();

      if (docs.length === 0) {
        console.log(chalk.yellow('No documentation files found in this project.'));
        return;
      }

      const choices = [
        ...docs.map((doc, index) => ({
          name: `${doc.relativePath} (${(doc.size / 1024).toFixed(1)}KB)`,
          value: doc.path,
        })),
        new inquirer.Separator(),
        { name: '🔍 Search Documentation', value: 'search' },
        { name: '🏠 Back to Main Menu', value: 'back' },
      ];

      const { selected } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selected',
          message: chalk.green('Select a documentation file to view:'),
          choices,
          pageSize: 15,
        },
      ]);

      if (selected === 'back') {
        return;
      } else if (selected === 'search') {
        await showSearchInterface();
      } else {
        await showDocContent(selected);
      }
    } catch (error) {
      printError(chalk.red(`Error browsing documentation: ${error.message}`));
      break;
    }
  }
}

/**
 * Show search interface
 */
async function showSearchInterface() {
  console.log(chalk.cyan('\n🔍 Search Documentation\n'));

  const { query } = await inquirer.prompt([
    {
      type: 'input',
      name: 'query',
      message: chalk.green('Enter search term:'),
      validate: (input) => input.trim().length > 0 || 'Search term is required',
    },
  ]);

  console.log(chalk.yellow(`\nSearching for: "${query}"\n`));

  const results = await searchDocs(query);

  if (results.length === 0) {
    console.log(chalk.yellow('No matches found.'));
    await inquirer.prompt([{ type: 'input', name: 'done', message: 'Press Enter to continue...' }]);
    return;
  }

  console.log(chalk.green(`Found ${results.length} file(s) matching "${query}":\n`));

  for (const result of results) {
    console.log(chalk.bold.blue(result.relativePath));
    console.log(
      chalk.gray(
        `Size: ${(result.size / 1024).toFixed(1)}KB | Modified: ${result.modified.toLocaleDateString()}`
      )
    );

    if (result.matches && result.matches.length > 0) {
      console.log(chalk.gray('\nContext:'));
      for (const match of result.matches.slice(0, 5)) {
        // Show first 5 matches
        console.log(match);
      }
      if (result.matches.length > 5) {
        console.log(chalk.gray(`... and ${result.matches.length - 5} more matches`));
      }
    }
    console.log('');
  }

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: chalk.green('What would you like to do?'),
      choices: [
        { name: '📖 View Full Document', value: 'view' },
        { name: '🔍 Search Again', value: 'search' },
        { name: '🏠 Back to Browser', value: 'back' },
      ],
    },
  ]);

  if (action === 'view') {
    // Prompt to select which document to view if multiple results
    if (results.length > 1) {
      const choices = results.map((result) => ({
        name: result.relativePath,
        value: result.path,
      }));

      const { docPath } = await inquirer.prompt([
        {
          type: 'list',
          name: 'docPath',
          message: chalk.green('Select document to view:'),
          choices,
        },
      ]);

      await showDocContent(docPath);
    } else {
      await showDocContent(results[0].path);
    }
  } else if (action === 'search') {
    await showSearchInterface();
  }
}

/**
 * Show documentation content
 */
async function showDocContent(filePath) {
  try {
    console.log(chalk.cyan(`\n📖 Viewing: ${path.relative(process.cwd(), filePath)}\n`));
    console.log(chalk.gray('─'.repeat(80)));

    const content = await readDocFile(filePath);

    // Split content into pages for easier reading
    const lines = content.split('\n');
    const pageSize = 20;

    for (let i = 0; i < lines.length; i += pageSize) {
      const page = lines.slice(i, i + pageSize);
      console.log(page.join('\n'));

      if (i + pageSize < lines.length) {
        const { continueReading } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'continueReading',
            message: chalk.yellow('Continue reading?'),
            default: true,
          },
        ]);

        if (!continueReading) {
          break;
        }

        console.log(chalk.gray('─'.repeat(80)));
      }
    }

    console.log(chalk.gray('─'.repeat(80)));
    console.log(chalk.green('\nEnd of document\n'));

    await inquirer
      .prompt([
        {
          type: 'list',
          name: 'action',
          message: chalk.green('What would you like to do?'),
          choices: [
            { name: '🔄 View Again', value: 'view' },
            { name: '🔍 Search Documentation', value: 'search' },
            { name: '🏠 Back to Browser', value: 'back' },
            { name: '🚪 Exit', value: 'exit' },
          ],
        },
      ])
      .then(async (answer) => {
        if (answer.action === 'view') {
          await showDocContent(filePath);
        } else if (answer.action === 'search') {
          await showSearchInterface();
        } else if (answer.action === 'back') {
          await showDocsBrowser();
        }
      });
  } catch (error) {
    printError(chalk.red(`Error displaying documentation: ${error.message}`));
  }
}

/**
 * Register docs command
 */
export function registerDocsCommand(program) {
  const docsCmd = program.command('docs').description('Interactive documentation browser');

  docsCmd.action(async () => {
    try {
      await showDocsBrowser();
    } catch (error) {
      printError(chalk.red(`Documentation browser error: ${error.message}`));
    }
  });

  docsCmd
    .command('search')
    .description('Search documentation')
    .argument('<query>', 'Search query')
    .action(async (query) => {
      try {
        console.log(chalk.cyan(`\n🔍 Searching documentation for: "${query}"\n`));

        const results = await searchDocs(query);

        if (results.length === 0) {
          console.log(chalk.yellow('No matches found.'));
          return;
        }

        console.log(chalk.green(`Found ${results.length} result(s):\n`));

        for (const result of results) {
          console.log(chalk.bold.blue(result.relativePath));
          console.log(chalk.gray(`Size: ${(result.size / 1024).toFixed(1)}KB`));

          if (result.matches && result.matches.length > 0) {
            console.log(chalk.gray('Sample matches:'));
            for (const match of result.matches.slice(0, 3)) {
              console.log(match);
            }
            console.log('');
          }
        }
      } catch (error) {
        printError(chalk.red(`Search error: ${error.message}`));
      }
    });

  docsCmd
    .command('list')
    .description('List all documentation files')
    .action(async () => {
      try {
        const docs = await findDocs();

        if (docs.length === 0) {
          console.log(chalk.yellow('No documentation files found.'));
          return;
        }

        console.log(chalk.cyan(`\n📋 Found ${docs.length} documentation file(s):\n`));

        for (const doc of docs) {
          console.log(
            `${chalk.blue(doc.relativePath)} ${chalk.gray(`(${(doc.size / 1024).toFixed(1)}KB)`)}`
          );
        }
      } catch (error) {
        printError(chalk.red(`List error: ${error.message}`));
      }
    });

  docsCmd._examples = [
    { command: 'ultra-dex docs', description: 'Browse documentation interactively' },
    { command: 'ultra-dex docs search "deployment"', description: 'Search for deployment docs' },
    { command: 'ultra-dex docs list', description: 'List all documentation files' },
  ];
}

export default {
  findDocs,
  readDocFile,
  searchDocs,
  showDocsBrowser,
  registerDocsCommand,
};
