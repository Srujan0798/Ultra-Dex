import { gitIntegration } from '../../src/core/integrations/git.js';
import { aiMetaLayer } from '../../src/core/ai/ai-meta-layer.js';
import { interactiveCLI } from '../lib/interactive-cli.js';
import { createSpinner } from '../lib/spinner.js';
import { colors } from '../lib/colors.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Generate semantic commit message using AI
 * @param {Array<string>} changedFiles - List of changed files
 * @param {string} diffSummary - Summary of changes
 * @returns {Promise<string>} Generated commit message
 */
async function generateCommitMessage(changedFiles, diffSummary) {
  const spinner = createSpinner('Generating semantic commit message...');
  spinner.start();

  try {
    // Create a prompt for the AI to generate a semantic commit message
    const prompt = `Based on the following changes, generate a semantic commit message following the Conventional Commits specification (https://www.conventionalcommits.org/).

Format: <type>[optional scope]: <description>

Types:
- feat: A new feature
- fix: A bug fix
- docs: Documentation only changes
- style: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- refactor: A code change that neither fixes a bug nor adds a feature
- perf: A code change that improves performance
- test: Adding missing tests or correcting existing tests
- build: Changes that affect the build system or external dependencies
- ci: Changes to our CI configuration files and scripts
- chore: Other changes that don't modify src or test files
- revert: Reverts a previous commit

Changed files: ${changedFiles.join(', ')}
Diff summary: ${diffSummary}

Generate only the commit message, nothing else:`;

    const response = await aiMetaLayer.call(
      null,
      [
        { role: 'system', content: 'You are an expert at writing semantic commit messages following the Conventional Commits specification.' },
        { role: 'user', content: prompt }
      ],
      {
        temperature: 0.3,
        maxTokens: 100
      }
    );

    spinner.succeed('Commit message generated');
    return response.text.trim();
  } catch (error) {
    spinner.fail('Failed to generate commit message');
    throw error;
  }
}

/**
 * Get diff summary for the AI
 * @returns {Promise<string>} Diff summary
 */
async function getDiffSummary() {
  try {
    const diff = await gitIntegration.getWorkingDiff();
    // Summarize the diff for the AI (first 1000 characters to avoid token limits)
    return diff.substring(0, 1000);
  } catch (error) {
    return 'Could not retrieve diff summary';
  }
}

/**
 * Commit command handler
 * @param {object} options - Command options
 */
export async function commitCommand(options = {}) {
  try {
    // Check if we're in a Git repository
    if (!(await gitIntegration.isGitRepository())) {
      throw new Error('Not a Git repository');
    }

    // Get Git status
    const status = await gitIntegration.getStatus();
    
    if (status.files.length === 0) {
      console.log(colors.info('Nothing to commit. Working directory clean.'));
      return;
    }

    console.log(colors.info(`Found ${status.files.length} changed files:`));
    status.files.forEach(file => {
      const statusSymbol = file.index === '?' ? '.untracked' : 
                          file.index === 'A' ? 'added' : 
                          file.index === 'M' ? 'modified' : 
                          file.index === 'D' ? 'deleted' : 'changed';
      console.log(`  ${colors.subtle(file.index)} ${file.path} (${statusSymbol})`);
    });

    // Get diff summary
    const diffSummary = await getDiffSummary();

    // Generate commit message if not provided
    let commitMessage = options.message;
    if (!commitMessage) {
      if (options.ai || options.semantic) {
        commitMessage = await generateCommitMessage(status.files.map(f => f.path), diffSummary);
      } else {
        // Ask user for commit message
        commitMessage = await interactiveCLI.promptInput('Enter commit message:', '');
        if (!commitMessage.trim()) {
          console.log(colors.warning('No commit message provided. Exiting.'));
          return;
        }
      }
    }

    console.log(colors.info(`Commit message: ${colors.highlight(commitMessage)}`));

    // Confirm before committing
    if (!options.force) {
      const confirmed = await interactiveCLI.promptConfirm('Commit changes?', true);
      if (!confirmed) {
        console.log(colors.info('Commit cancelled.'));
        return;
      }
    }

    // Stage all changes if auto-stage is enabled
    if (options.all || options.a) {
      console.log(colors.info('Staging all changes...'));
      await gitIntegration.stageFiles(['.']);
    }

    // Perform the commit
    const spinner = createSpinner('Committing changes...');
    spinner.start();

    try {
      const result = await gitIntegration.commitChanges(commitMessage);
      spinner.succeed(`Changes committed: ${result.commit}`);
      
      // Show commit result
      console.log(colors.success(`✓ Successfully committed ${status.files.length} files`));
      console.log(colors.subtle(`Commit: ${result.commit}`));
      
      // Push if requested
      if (options.push) {
        console.log(colors.info('Pushing changes...'));
        await gitIntegration.pushChanges();
        console.log(colors.success('✓ Changes pushed successfully'));
      }
    } catch (error) {
      spinner.fail('Commit failed');
      throw error;
    }
  } catch (error) {
    console.error(colors.error(`Commit failed: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Register the commit command with Commander
 * @param {Command} program - Commander program instance
 */
export function registerCommitCommand(program) {
  program
    .command('commit')
    .description('Commit changes with AI-powered semantic messages')
    .option('-m, --message <message>', 'Commit message')
    .option('-a, --all', 'Stage all modified and deleted files')
    .option('--ai', 'Generate commit message using AI')
    .option('--semantic', 'Generate semantic commit message')
    .option('--push', 'Push changes after commit')
    .option('--force', 'Skip confirmation prompt')
    .action(commitCommand);
}