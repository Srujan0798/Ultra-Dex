/**
 * ultra-dex jira command
 * Lightweight Jira Ticket-to-Code integration
 */

import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { validateSafePath } from '../utils/validation.js';

const execAsync = promisify(exec);

// Mock Jira tickets for demonstration when no credentials are provided
const MOCK_TICKETS = {
  'TEST-123': {
    key: 'TEST-123',
    summary: 'Implement user authentication system',
    description:
      'Create a secure authentication system with login, logout, and password reset functionality.',
    type: 'Story',
    priority: 'High',
    assignee: 'Developer',
    reporter: 'Product Owner',
    status: 'To Do',
    components: ['Frontend', 'Backend', 'Security'],
    labels: ['security', 'authentication', 'feature'],
  },
  'TEST-456': {
    key: 'TEST-456',
    summary: 'Fix critical bug in payment processing',
    description:
      'Payment gateway occasionally fails to process transactions, resulting in failed orders.',
    type: 'Bug',
    priority: 'Critical',
    assignee: 'Developer',
    reporter: 'QA Engineer',
    status: 'To Do',
    components: ['Backend', 'Payments'],
    labels: ['bug', 'payments', 'critical'],
  },
};

export async function startJiraTicket(ticketKey, options = {}) {
  printInfo(chalk.cyan(`\n🎫 Starting work on Jira ticket: ${ticketKey}\n`));

  // Validate ticket key format
  if (!ticketKey || !/^[A-Z0-9]+-[0-9]+$/.test(ticketKey)) {
    throw new Error(`Invalid Jira ticket key format: ${ticketKey}. Expected format: PROJECT-123`);
  }

  // Check if Jira credentials are available
  const hasCredentials =
    process.env.JIRA_BASE_URL && (process.env.JIRA_API_TOKEN || process.env.JIRA_USERNAME);

  let ticketData;

  if (hasCredentials) {
    printInfo(chalk.gray('Fetching ticket details from Jira...'));
    ticketData = await fetchTicketFromJira(ticketKey);
  } else {
    printWarning(chalk.yellow('Jira credentials not found. Using mock data for demonstration.'));
    ticketData = MOCK_TICKETS[ticketKey] || {
      key: ticketKey,
      summary: `Work on ticket ${ticketKey}`,
      description: `Implement the requirements for Jira ticket ${ticketKey}`,
      type: 'Task',
      priority: 'Medium',
      assignee: 'Developer',
      reporter: 'System',
      status: 'To Do',
      components: ['Development'],
      labels: ['development'],
    };
  }

  if (!ticketData) {
    throw new Error(`Ticket ${ticketKey} not found in Jira (or mock data)`);
  }

  printSuccess(chalk.green(`✅ Fetched ticket: ${ticketData.summary}`));
  printInfo(
    chalk.gray(
      `Type: ${ticketData.type} | Priority: ${ticketData.priority} | Status: ${ticketData.status}`
    )
  );

  // Create a new branch for the ticket
  const branchName = `feature/${ticketKey.toLowerCase()}`;
  printInfo(chalk.gray(`\nCreating branch: ${branchName}`));

  try {
    // Check if git repo exists
    await execAsync('git rev-parse --git-dir');
  } catch (error) {
    throw new Error('Not a git repository. Run this command from inside a git repository.');
  }

  // Create and switch to the new branch
  try {
    await execAsync(`git checkout -b ${branchName}`);
    printSuccess(chalk.green(`✅ Created and switched to branch: ${branchName}`));
  } catch (error) {
    // If branch already exists, switch to it
    try {
      await execAsync(`git checkout ${branchName}`);
      printWarning(
        chalk.yellow(`⚠️  Branch ${branchName} already exists. Switched to existing branch.`)
      );
    } catch (switchError) {
      throw new Error(`Failed to create or switch to branch ${branchName}: ${error.message}`);
    }
  }

  // Generate a plan.md based on ticket requirements
  await generatePlanFromTicket(ticketData);

  // Show next steps
  printSuccess(chalk.green('\n🎉 Ticket setup complete!'));
  printInfo(chalk.gray(`Branch: ${branchName}`));
  printInfo(chalk.gray(`Plan: plan.md has been created with ticket details`));
  printInfo(chalk.cyan('\nNext steps:'));
  printInfo(chalk.gray(`  1. Review plan.md and adjust as needed`));
  printInfo(chalk.gray(`  2. Start implementing the requirements`));
  printInfo(chalk.gray(`  3. Commit changes with references to ${ticketKey}`));
  printInfo(chalk.gray(`  4. Create a pull request when ready`));
}

/**
 * Fetch ticket details from Jira API
 */
async function fetchTicketFromJira(ticketKey) {
  // In a real implementation, this would call the Jira API
  // For now, we'll simulate the API call
  try {
    // Check if we have credentials
    if (!process.env.JIRA_BASE_URL || (!process.env.JIRA_API_TOKEN && !process.env.JIRA_USERNAME)) {
      return null;
    }

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // For demo purposes, return mock data if it exists
    return MOCK_TICKETS[ticketKey] || null;
  } catch (error) {
    printWarning(chalk.yellow(`Failed to fetch ticket from Jira: ${error.message}`));
    return null;
  }
}

/**
 * Generate a plan.md file based on ticket requirements
 */
async function generatePlanFromTicket(ticketData) {
  const planContent = `# Implementation Plan for ${ticketData.key}

## Ticket Details
- **Key:** ${ticketData.key}
- **Summary:** ${ticketData.summary}
- **Type:** ${ticketData.type}
- **Priority:** ${ticketData.priority}
- **Status:** ${ticketData.status}
- **Assignee:** ${ticketData.assignee}
- **Reporter:** ${ticketData.reporter}

## Description
${ticketData.description}

## Requirements
Based on the ticket description, the following requirements need to be implemented:

1. [ ] Requirement 1 - Describe what needs to be done
2. [ ] Requirement 2 - Describe what needs to be done
3. [ ] Requirement 3 - Describe what needs to be done

## Technical Approach
- **Components:** ${ticketData.components.join(', ')}
- **Labels:** ${ticketData.labels.join(', ')}

## Implementation Steps
1. [ ] Step 1: Analyze requirements
2. [ ] Step 2: Design solution
3. [ ] Step 3: Implement core functionality
4. [ ] Step 4: Write tests
5. [ ] Step 5: Code review
6. [ ] Step 6: Deploy to staging
7. [ ] Step 7: Verify in production

## Acceptance Criteria
- [ ] Criteria 1: The solution meets the requirements
- [ ] Criteria 2: All tests pass
- [ ] Criteria 3: Code review approved
- [ ] Criteria 4: No regressions introduced

## Notes
- Any additional notes or considerations for implementation
`;

  await fs.writeFile('plan.md', planContent);
  printSuccess(chalk.green('✅ Generated plan.md with ticket details'));
}

export function registerJiraCommand(program) {
  program
    .command('jira')
    .description('Jira ticket-to-code integration')
    .argument('<action>', 'Action to perform (start)')
    .argument('[ticket]', 'Jira ticket key (e.g., PROJECT-123)')
    .action(async (action, ticket) => {
      try {
        if (action === 'start') {
          if (!ticket) {
            printError(chalk.red('Ticket key is required for start action'));
            return;
          }
          await startJiraTicket(ticket);
        } else {
          printError(chalk.red(`Unknown action: ${action}. Supported actions: start`));
        }
      } catch (error) {
        printError(chalk.red(`Jira command failed: ${error.message}`));
        process.exit(1);
      }
    });
}

export default {
  startJiraTicket,
  registerJiraCommand,
};
