// Copyright (c) 2026 Ultra-Dex

/**
 * Decision Ledger
 * Immutable log of architectural decisions
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { printError, printInfo, printSuccess } from '../utils/output.js';

// Load existing decisions
async function loadDecisions() {
  const decisionFile = path.join(process.cwd(), 'DECISION_LOG.md');

  try {
    const content = await fs.readFile(decisionFile, 'utf8');

    // Parse decisions from markdown
    const decisions = [];
    const lines = content.split('\n');
    let currentDecision = null;

    for (const line of lines) {
      // Look for decision headers
      if (line.trim().match(/^### Decision \d+: /)) {
        if (currentDecision) {
          decisions.push(currentDecision);
        }

        currentDecision = {
          id: parseInt(line.match(/Decision (\d+):/)[1]),
          title: line.match(/: (.+)/)[1],
          date: null,
          context: '',
          decision: '',
          consequences: '',
          status: 'Accepted',
          commitHash: null,
        };
      }
      // Parse other fields
      else if (currentDecision) {
        if (line.startsWith('**Date:**')) {
          currentDecision.date = line.replace('**Date:**', '').trim();
        } else if (line.startsWith('**Status:**')) {
          currentDecision.status = line.replace('**Status:**', '').trim();
        } else if (line.startsWith('**Commit Hash:**')) {
          currentDecision.commitHash = line.replace('**Commit Hash:**', '').trim();
        } else if (line.startsWith('#### Context')) {
          currentDecision.context = getNextNonHeaderLine(lines, lines.indexOf(line));
        } else if (line.startsWith('#### Decision')) {
          currentDecision.decision = getNextNonHeaderLine(lines, lines.indexOf(line));
        } else if (line.startsWith('#### Consequences')) {
          currentDecision.consequences = getNextNonHeaderLine(lines, lines.indexOf(line));
        }
      }
    }

    if (currentDecision) {
      decisions.push(currentDecision);
    }

    return decisions;
  } catch (_error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

// Helper function to get the next non-header line
function getNextNonHeaderLine(lines, startIndex) {
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('#') && !line.startsWith('**') && !line.startsWith('|')) {
      return line;
    }
  }
  return '';
}

// Save decisions to DECISION_LOG.md
async function saveDecisions(decisions) {
  const decisionFile = path.join(process.cwd(), 'DECISION_LOG.md');

  let content = `# Decision Log

This document records all architectural and significant technical decisions made during the project lifecycle.

## Legend
- **Accepted**: Decision implemented and in effect
- **Rejected**: Decision considered but deferred
- **Deprecated**: Decision was accepted but is no longer in effect
- **Superseded**: Decision replaced by a newer decision

---

`;

  // Sort decisions by ID (most recent first)
  decisions.sort((a, b) => b.id - a.id);

  for (const decision of decisions) {
    content += `### Decision ${decision.id}: ${decision.title}

**Date:** ${decision.date || new Date().toISOString().split('T')[0]}  
**Status:** ${decision.status || 'Accepted'}  
**Commit Hash:** ${decision.commitHash || 'N/A'}  

#### Context
${decision.context || 'Not specified'}

#### Decision
${decision.decision || 'Not specified'}

#### Consequences
${decision.consequences || 'Not specified'}

---

`;
  }

  await fs.writeFile(decisionFile, content);
}

// Add a new decision
export async function addDecision(
  title = null,
  context = null,
  decision = null,
  consequences = null,
  status = 'Accepted',
  commitHash = null
) {
  let decisionData;

  if (!title) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'Decision Title:',
        validate: (input) => input.trim().length > 0 || 'Title is required',
      },
      {
        type: 'editor',
        name: 'context',
        message: 'Context (situation, problem, factors)',
        default: 'Describe the situation, problem, or factors that led to this decision.',
      },
      {
        type: 'editor',
        name: 'decision',
        message: 'Decision (what was decided)',
        default: 'Describe what was decided and why.',
      },
      {
        type: 'editor',
        name: 'consequences',
        message: 'Consequences (pros, cons, impacts)',
        default: 'Describe the positive and negative consequences, including any trade-offs.',
      },
      {
        type: 'list',
        name: 'status',
        message: 'Status:',
        choices: ['Accepted', 'Rejected', 'Deprecated', 'Superseded'],
        default: 'Accepted',
      },
      {
        type: 'input',
        name: 'commitHash',
        message: 'Git Commit Hash (optional):',
        default: '',
      },
    ]);

    decisionData = answers;
  } else {
    decisionData = {
      title: title,
      context: context || 'Not specified',
      decision: decision || 'Not specified',
      consequences: consequences || 'Not specified',
      status: status,
      commitHash: commitHash || null,
    };
  }

  // Load existing decisions
  const decisions = await loadDecisions();

  // Generate new decision ID
  const nextId = decisions.length > 0 ? Math.max(...decisions.map((d) => d.id)) + 1 : 1;

  // Create new decision object
  const newDecision = {
    id: nextId,
    title: decisionData.title,
    date: new Date().toISOString().split('T')[0],
    context: decisionData.context,
    decision: decisionData.decision,
    consequences: decisionData.consequences,
    status: decisionData.status,
    commitHash: decisionData.commitHash || null,
  };

  // Add to decisions array
  decisions.push(newDecision);

  // Save to file
  await saveDecisions(decisions);

  printSuccess(chalk.green(`\n✅ Decision ${nextId} added successfully!`));
  printInfo(chalk.gray(`Title: ${decisionData.title}`));
  printInfo(chalk.gray(`Status: ${decisionData.status}`));
  printInfo(chalk.gray(`Date: ${newDecision.date}`));

  return newDecision;
}

// List all decisions
export async function listDecisions(filterByStatus = null) {
  const decisions = await loadDecisions();

  if (decisions.length === 0) {
    printInfo(chalk.gray('No decisions recorded yet.'));
    return;
  }

  printInfo(chalk.cyan('\n📋 Decision Log:\n'));

  // Filter decisions if status is specified
  const filteredDecisions = filterByStatus
    ? decisions.filter((d) => d.status.toLowerCase() === filterByStatus.toLowerCase())
    : decisions;

  if (filteredDecisions.length === 0) {
    printInfo(chalk.gray(`No decisions with status: ${filterByStatus}`));
    return;
  }

  // Sort by ID (most recent first)
  filteredDecisions.sort((a, b) => b.id - a.id);

  for (const decision of filteredDecisions) {
    printInfo(chalk.yellow(`Decision ${decision.id}: ${decision.title}`));
    printInfo(chalk.gray(`  Status: ${decision.status} | Date: ${decision.date}`));
    printInfo(
      chalk.gray(
        `  Context: ${decision.context.substring(0, 100)}${decision.context.length > 100 ? '...' : ''}`
      )
    );
    printInfo(chalk.gray(`  Commit: ${decision.commitHash || 'N/A'}`));
    printInfo('');
  }
}

// Find decisions by keyword
export async function findDecisions(keyword) {
  const decisions = await loadDecisions();

  if (!keyword) {
    printError(chalk.red('Keyword is required'));
    return [];
  }

  const matches = decisions.filter(
    (decision) =>
      decision.title.toLowerCase().includes(keyword.toLowerCase()) ||
      decision.context.toLowerCase().includes(keyword.toLowerCase()) ||
      decision.decision.toLowerCase().includes(keyword.toLowerCase()) ||
      decision.consequences.toLowerCase().includes(keyword.toLowerCase())
  );

  if (matches.length === 0) {
    printInfo(chalk.gray(`No decisions found containing: ${keyword}`));
    return [];
  }

  printInfo(chalk.cyan(`\n🔍 Found ${matches.length} decision(s) containing "${keyword}":\n`));

  for (const decision of matches) {
    printInfo(chalk.yellow(`Decision ${decision.id}: ${decision.title}`));
    printInfo(chalk.gray(`  Status: ${decision.status} | Date: ${decision.date}`));
    printInfo(
      chalk.gray(
        `  Context: ${decision.context.substring(0, 100)}${decision.context.length > 100 ? '...' : ''}`
      )
    );
    printInfo('');
  }

  return matches;
}

// Update decision status
export async function updateDecisionStatus(decisionId, newStatus) {
  const decisions = await loadDecisions();

  const decisionIndex = decisions.findIndex((d) => d.id === decisionId);
  if (decisionIndex === -1) {
    throw new Error(`Decision ${decisionId} not found`);
  }

  const oldStatus = decisions[decisionIndex].status;
  decisions[decisionIndex].status = newStatus;
  decisions[decisionIndex].date = new Date().toISOString().split('T')[0]; // Update date when status changes

  await saveDecisions(decisions);

  printSuccess(
    chalk.green(`\n✅ Decision ${decisionId} status updated from "${oldStatus}" to "${newStatus}"`)
  );
}

export function registerDecisionLedgerCommand(program) {
  const decisionCmd = program
    .command('ledger')
    .alias('decision')
    .description('Manage immutable decision ledger');

  decisionCmd
    .command('add')
    .description('Add a new decision to the ledger')
    .action(async () => {
      try {
        await addDecision();
      } catch (error) {
        printError(chalk.red(`Failed to add decision: ${error.message}`));
        process.exit(1);
      }
    });

  decisionCmd
    .command('list')
    .alias('ls')
    .description('List all decisions in the ledger')
    .option(
      '-s, --status <status>',
      'Filter by status (Accepted, Rejected, Deprecated, Superseded)'
    )
    .action(async (options) => {
      try {
        await listDecisions(options.status);
      } catch (error) {
        printError(chalk.red(`Failed to list decisions: ${error.message}`));
        process.exit(1);
      }
    });

  decisionCmd
    .command('find')
    .description('Find decisions by keyword')
    .argument('<keyword>', 'Keyword to search for')
    .action(async (keyword) => {
      try {
        await findDecisions(keyword);
      } catch (error) {
        printError(chalk.red(`Failed to find decisions: ${error.message}`));
        process.exit(1);
      }
    });

  decisionCmd
    .command('update')
    .description('Update decision status')
    .argument('<id>', 'Decision ID to update')
    .argument('<status>', 'New status (Accepted, Rejected, Deprecated, Superseded)')
    .action(async (id, status) => {
      try {
        await updateDecisionStatus(parseInt(id), status);
      } catch (error) {
        printError(chalk.red(`Failed to update decision: ${error.message}`));
        process.exit(1);
      }
    });

  decisionCmd._examples = [
    { command: 'ultra-dex ledger add', description: 'Add a new architectural decision' },
    { command: 'ultra-dex ledger list', description: 'List all decisions' },
    {
      command: 'ultra-dex ledger list --status Accepted',
      description: 'List accepted decisions only',
    },
    {
      command: 'ultra-dex ledger find database',
      description: 'Find decisions related to "database"',
    },
    {
      command: 'ultra-dex ledger update 1 Deprecated',
      description: 'Update decision #1 status to deprecated',
    },
  ];
}

export default {
  addDecision,
  listDecisions,
  findDecisions,
  updateDecisionStatus,
  registerDecisionLedgerCommand,
};
