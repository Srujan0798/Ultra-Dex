// Copyright (c) 2026 Ultra-Dex

/**
 * ultra-dex jira command
 * Jira Ticket-to-Code integration (real API)
 */

import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { JiraClient, validateJiraConfig, syncFromPlan } from '../integrations/jira.js';
import { parsePlanFromMarkdown } from './plan.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

const execAsync = promisify(exec);

function normalizeDomain(domain) {
  if (!domain) return '';
  return domain
    .replace(/^https?:\/\//, '')
    .replace(/\.atlassian\.net\/?.*$/, '')
    .trim();
}

function getJiraConfig(options = {}) {
  return {
    domain: normalizeDomain(options.domain || process.env.JIRA_DOMAIN || process.env.JIRA_BASE_URL),
    email: options.email || process.env.JIRA_EMAIL,
    apiToken: options.token || process.env.JIRA_API_TOKEN,
  };
}

function extractDescription(description) {
  if (!description) return '';
  if (typeof description === 'string') return description;
  if (!description.content) return '';
  const parts = [];
  const walk = (nodes = []) => {
    nodes.forEach((node) => {
      if (node.text) parts.push(node.text);
      if (node.content) walk(node.content);
    });
  };
  walk(description.content);
  return parts.join(' ').trim();
}

async function fetchTicketFromJira(client, ticketKey) {
  const issue = await client.getIssue(ticketKey);
  const fields = issue.fields || {};
  return {
    key: issue.key,
    summary: fields.summary || ticketKey,
    description: extractDescription(fields.description),
    type: fields.issuetype?.name || 'Task',
    priority: fields.priority?.name || 'Medium',
    assignee: fields.assignee?.displayName || 'Unassigned',
    reporter: fields.reporter?.displayName || 'Unknown',
    status: fields.status?.name || 'To Do',
    components: (fields.components || []).map((c) => c.name),
    labels: fields.labels || [],
  };
}

export async function startJiraTicket(ticketKey, options = {}) {
  printInfo(chalk.cyan(`\n🎫 Starting work on Jira ticket: ${ticketKey}\n`));

  if (!ticketKey || !/^[A-Z0-9]+-[0-9]+$/.test(ticketKey)) {
    throw new Error(`Invalid Jira ticket key format: ${ticketKey}. Expected format: PROJECT-123`);
  }

  const config = getJiraConfig(options);
  await validateJiraConfig(config);
  const client = new JiraClient(config);

  printInfo(chalk.gray('Fetching ticket details from Jira...'));
  const ticketData = await fetchTicketFromJira(client, ticketKey);

  printSuccess(chalk.green(`✅ Fetched ticket: ${ticketData.summary}`));
  printInfo(
    chalk.gray(
      `Type: ${ticketData.type} | Priority: ${ticketData.priority} | Status: ${ticketData.status}`
    )
  );

  const branchName = `feature/${ticketKey.toLowerCase()}`;
  printInfo(chalk.gray(`\nCreating branch: ${branchName}`));

  try {
    await execAsync('git rev-parse --git-dir');
  } catch {
    throw new Error('Not a git repository. Run this command from inside a git repository.');
  }

  try {
    await execAsync(`git checkout -b ${branchName}`);
    printSuccess(chalk.green(`✅ Created and switched to branch: ${branchName}`));
  } catch (error) {
    try {
      await execAsync(`git checkout ${branchName}`);
      printWarning(
        chalk.yellow(`⚠️  Branch ${branchName} already exists. Switched to existing branch.`)
      );
    } catch {
      throw new Error(`Failed to create or switch to branch ${branchName}: ${error.message}`);
    }
  }

  await generatePlanFromTicket(ticketData);

  printSuccess(chalk.green('\n🎉 Ticket setup complete!'));
  printInfo(chalk.gray(`Branch: ${branchName}`));
  printInfo(chalk.gray('Plan: plan.md has been created with ticket details'));
  printInfo(chalk.cyan('\nNext steps:'));
  printInfo(chalk.gray('  1. Review plan.md and adjust as needed'));
  printInfo(chalk.gray('  2. Start implementing the requirements'));
  printInfo(chalk.gray(`  3. Commit changes with references to ${ticketKey}`));
  printInfo(chalk.gray('  4. Create a pull request when ready'));
}

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
${ticketData.description || 'No description provided.'}

## Requirements
Based on the ticket description, the following requirements need to be implemented:

1. [ ] Requirement 1 - Describe what needs to be done
2. [ ] Requirement 2 - Describe what needs to be done
3. [ ] Requirement 3 - Describe what needs to be done

## Technical Approach
- **Components:** ${ticketData.components.join(', ') || 'N/A'}
- **Labels:** ${ticketData.labels.join(', ') || 'N/A'}

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
  const jira = program.command('jira').description('Jira ticket integration');

  jira
    .command('start <ticket>')
    .description('Start work on a Jira ticket')
    .option('--domain <domain>', 'Jira domain (e.g. mycompany)')
    .option('--email <email>', 'Jira account email')
    .option('--token <token>', 'Jira API token')
    .action(async (ticket, options) => {
      try {
        await startJiraTicket(ticket, options);
      } catch (error) {
        printError(chalk.red(`Jira start failed: ${error.message}`));
        process.exit(1);
      }
    });

  jira
    .command('status <ticket>')
    .description('Show status of a Jira ticket')
    .option('--domain <domain>', 'Jira domain (e.g. mycompany)')
    .option('--email <email>', 'Jira account email')
    .option('--token <token>', 'Jira API token')
    .action(async (ticket, options) => {
      try {
        const config = getJiraConfig(options);
        await validateJiraConfig(config);
        const client = new JiraClient(config);
        const ticketData = await fetchTicketFromJira(client, ticket);
        printInfo(chalk.cyan(`\n${ticketData.key}: ${ticketData.summary}`));
        printInfo(chalk.gray(`Status: ${ticketData.status} | Priority: ${ticketData.priority}`));
        if (ticketData.assignee) printInfo(chalk.gray(`Assignee: ${ticketData.assignee}`));
      } catch (error) {
        printError(chalk.red(`Jira status failed: ${error.message}`));
        process.exit(1);
      }
    });

  jira
    .command('sync')
    .description('Sync IMPLEMENTATION-PLAN.md to Jira issues')
    .option('--domain <domain>', 'Jira domain (e.g. mycompany)')
    .option('--email <email>', 'Jira account email')
    .option('--token <token>', 'Jira API token')
    .option('--project <key>', 'Jira project key (e.g. ULTRA)')
    .action(async (options) => {
      try {
        if (!options.project) {
          printError(chalk.red('Missing --project key (e.g. ULTRA).'));
          process.exit(1);
        }
        const config = getJiraConfig(options);
        await validateJiraConfig(config);
        const client = new JiraClient(config);
        const planSections = await parsePlanFromMarkdown();
        const mapped = planSections.map((section) => ({
          projectKey: options.project,
          name: section.name,
          description: (section.steps || []).map((s) => `- ${s.task}`).join('\n'),
          type: 'Story',
        }));

        const issues = await syncFromPlan(client, mapped);
        printSuccess(chalk.green(`✅ Created ${issues.length} Jira issues.`));
      } catch (error) {
        printError(chalk.red(`Jira sync failed: ${error.message}`));
        process.exit(1);
      }
    });
}

export default {
  startJiraTicket,
  registerJiraCommand,
};
