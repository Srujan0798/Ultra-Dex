// Copyright (c) 2026 Ultra-Dex

/**
 * ultra-dex commit command
 * Intelligent Git commit wrapper with AI-powered conventional commit messages
 */

import chalk from 'chalk';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { createProvider } from '../providers/index.js';
import { validateSafePath } from '../utils/validation.js';

const execAsync = promisify(exec);

// Conventional commit types
const COMMIT_TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
  'merge',
];

// AI prompt for generating conventional commit messages
const COMMIT_PROMPT = `You are an expert software engineer who writes excellent conventional commit messages.
Based on the provided git diff, write a concise and informative conventional commit message following the format:
<type>(<scope>): <description>

Where type is one of: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert, merge
Scope is optional and describes the scope of the change
Description is a concise summary of the changes in imperative mood (e.g. "add", "remove", "update", "fix")

The commit message should be:
- Concise (less than 72 characters)
- In imperative mood
- Descriptive enough to understand the change
- Focused on a single logical change

Here is the git diff:
`;

export async function commitChanges(options = {}) {
  printInfo(chalk.cyan('\n📝 Ultra-Dex Smart Commit\n'));

  // Validate current directory is a git repo
  try {
    await execAsync('git rev-parse --git-dir');
  } catch (error) {
    throw new Error('Not a git repository. Run this command from inside a git repository.');
  }

  // Stage files if requested
  if (options.all) {
    printInfo(chalk.gray('Staging all changes...'));
    await execAsync('git add .');
  } else if (options.patch) {
    printInfo(chalk.gray('Entering patch mode...'));
    await execAsync('git add -p');
  } else if (options.interactive) {
    printInfo(chalk.gray('Entering interactive mode...'));
    await execAsync('git add -i');
  }

  // Get the diff of staged changes
  let diffOutput;
  try {
    const { stdout } = await execAsync('git diff --cached');
    diffOutput = stdout;
  } catch (error) {
    printWarning(chalk.yellow('No staged changes found.'));

    // Ask if user wants to stage all changes
    const { stageAll } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'stageAll',
        message: 'No staged changes found. Stage all changes?',
        default: true,
      },
    ]);

    if (stageAll) {
      await execAsync('git add .');
      const { stdout } = await execAsync('git diff --cached');
      diffOutput = stdout;
    } else {
      printInfo(chalk.gray('Nothing to commit.'));
      return;
    }
  }

  if (!diffOutput.trim()) {
    printWarning(chalk.yellow('No changes to commit.'));
    return;
  }

  // Check for TODO comments in the diff
  const todoMatches = diffOutput.match(/TODO|FIXME|BUG/gi);
  if (todoMatches && todoMatches.length > 0) {
    printWarning(
      chalk.yellow(`⚠️  Found ${todoMatches.length} TODO/FIXME/Bug comment(s) in changes`)
    );
    const { continueCommit } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continueCommit',
        message: 'Continue with commit despite TODO comments?',
        default: true,
      },
    ]);

    if (!continueCommit) {
      printInfo(chalk.gray('Commit cancelled due to TODO comments.'));
      return;
    }
  }

  // Generate commit message using AI
  printInfo(chalk.gray('Analyzing changes with AI...'));

  let commitMessage = '';
  try {
    // Use the default provider for generating commit message
    const provider = createProvider('openai', { model: 'gpt-4o-mini' });
    const fullPrompt = COMMIT_PROMPT + diffOutput;

    const response = await provider.generate('', fullPrompt);
    commitMessage = (response.content || response).trim();

    // Validate the generated commit message
    if (!isValidConventionalCommit(commitMessage)) {
      printWarning(
        chalk.yellow('AI generated message does not follow conventional format. Using fallback.')
      );
      commitMessage = generateFallbackCommitMessage(diffOutput);
    }
  } catch (error) {
    printWarning(chalk.yellow(`AI generation failed: ${error.message}. Using fallback analysis.`));
    commitMessage = generateFallbackCommitMessage(diffOutput);
  }

  // Show the generated commit message and ask for confirmation
  printInfo(chalk.green(`\nGenerated commit message:\n  ${commitMessage}\n`));

  const { confirm, customMessage } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Use this commit message?',
      default: true,
    },
    {
      type: 'input',
      name: 'customMessage',
      message: 'Enter custom commit message:',
      when: (answers) => !answers.confirm,
      validate: (input) => input.trim().length > 0 || 'Commit message cannot be empty',
    },
  ]);

  const finalMessage = confirm ? commitMessage : customMessage.trim();

  // Show diff one more time before committing
  printInfo(chalk.gray('\nStaged changes:'));
  printInfo(
    chalk.gray(
      diffOutput.substring(0, 1000) + (diffOutput.length > 1000 ? '...\n[Diff truncated]' : '')
    )
  );

  const { reallyCommit } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'reallyCommit',
      message: `Commit ${finalMessage} ?`,
      default: true,
    },
  ]);

  if (!reallyCommit) {
    printInfo(chalk.gray('Commit cancelled.'));
    return;
  }

  // Perform the commit
  try {
    await execAsync(`git commit -m "${finalMessage.replace(/"/g, '\\"')}"`);
    printSuccess(chalk.green(`✅ Committed: ${finalMessage}`));

    // Show commit hash
    const { stdout: commitHash } = await execAsync('git rev-parse HEAD');
    printInfo(chalk.gray(`Commit: ${commitHash.trim().substring(0, 8)}`));
  } catch (error) {
    printError(chalk.red(`Git commit failed: ${error.message}`));
    throw error;
  }
}

/**
 * Validate if a commit message follows conventional format
 */
function isValidConventionalCommit(message) {
  const conventionalRegex =
    /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|merge)(\(.+\))?: .+/;
  return conventionalRegex.test(message);
}

/**
 * Generate a fallback commit message based on diff analysis
 */
function generateFallbackCommitMessage(diffOutput) {
  // Simple heuristic to determine commit type based on diff
  let type = 'chore';

  if (
    diffOutput.includes('new') ||
    diffOutput.includes('+function') ||
    diffOutput.includes('+class')
  ) {
    type = 'feat';
  } else if (
    diffOutput.includes('fix') ||
    diffOutput.includes('-bug') ||
    diffOutput.includes('error')
  ) {
    type = 'fix';
  } else if (diffOutput.includes('test') || diffOutput.includes('spec')) {
    type = 'test';
  } else if (diffOutput.includes('doc') || diffOutput.includes('README')) {
    type = 'docs';
  } else if (diffOutput.includes('refactor') || diffOutput.includes('rename')) {
    type = 'refactor';
  }

  // Generate a simple description based on file types changed
  const fileExtensions = extractFileExtensions(diffOutput);
  let description = 'Update code';

  if (fileExtensions.includes('.js') || fileExtensions.includes('.ts')) {
    description = 'Update JavaScript/TypeScript files';
  } else if (fileExtensions.includes('.md') || fileExtensions.includes('.txt')) {
    description = 'Update documentation';
  } else if (fileExtensions.includes('.css') || fileExtensions.includes('.scss')) {
    description = 'Update styles';
  } else if (fileExtensions.includes('.json') || fileExtensions.includes('.yml')) {
    description = 'Update configuration';
  }

  return `${type}: ${description}`;
}

/**
 * Extract file extensions from diff
 */
function extractFileExtensions(diffOutput) {
  const extensionRegex =
    /\.(js|ts|jsx|tsx|md|txt|css|scss|json|yml|yaml|html|py|go|java|cpp|c|h)/gi;
  const matches = diffOutput.match(extensionRegex) || [];
  return [...new Set(matches)]; // Return unique extensions
}

export function registerCommitCommand(program) {
  program
    .command('commit')
    .description('Intelligent Git commit with AI-powered conventional messages')
    .option('-a, --all', 'Stage all modified and deleted files')
    .option('-p, --patch', 'Interactively add changes')
    .option('-i, --interactive', 'Interactive mode')
    .option('-m, --message <message>', 'Use the given message as the commit message')
    .action(async (options) => {
      try {
        await commitChanges(options);
      } catch (error) {
        printError(chalk.red(`Commit failed: ${error.message}`));
        process.exit(1);
      }
    });
}

export default {
  commitChanges,
  registerCommitCommand,
};
