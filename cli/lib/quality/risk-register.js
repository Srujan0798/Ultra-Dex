// Copyright (c) 2026 Ultra-Dex

/**
 * Risk Register Module
 * CLI to manage project risks
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';

// Risk levels
const RISK_LEVELS = {
  LOW: { value: 1, color: chalk.green, label: 'Low' },
  MEDIUM: { value: 2, color: chalk.yellow, label: 'Medium' },
  HIGH: { value: 3, color: chalk.red, label: 'High' },
  CRITICAL: { value: 4, color: chalk.redBright, label: 'Critical' },
};

// Risk probability values
const PROBABILITY_VALUES = {
  LOW: 0.2,
  MEDIUM: 0.5,
  HIGH: 0.8,
};

// Risk impact values
const IMPACT_VALUES = {
  LOW: 1,
  MEDIUM: 3,
  HIGH: 5,
};

// Load existing risks
async function loadRisks() {
  const riskFile = path.join(process.cwd(), 'RISK-REGISTER.md');

  try {
    const content = await fs.readFile(riskFile, 'utf8');

    // Parse the risks from the markdown file
    const risks = [];
    const lines = content.split('\n');
    let inRiskTable = false;

    for (const line of lines) {
      if (line.trim().startsWith('| ID |')) {
        inRiskTable = true;
        continue;
      }

      if (inRiskTable && line.trim().startsWith('|') && !line.includes('---')) {
        const parts = line
          .split('|')
          .map((p) => p.trim())
          .filter((p) => p);
        if (parts.length >= 5) {
          const [
            id,
            description,
            probability,
            impact,
            mitigation,
            status = 'Active',
            owner = 'Unassigned',
          ] = parts;
          risks.push({
            id: id,
            description: description,
            probability: probability,
            impact: impact,
            mitigation: mitigation,
            status: status,
            owner: owner,
          });
        }
      }

      if (inRiskTable && !line.trim().startsWith('|')) {
        inRiskTable = false;
      }
    }

    return risks;
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

// Save risks to RISK-REGISTER.md
async function saveRisks(risks) {
  const riskFile = path.join(process.cwd(), 'RISK-REGISTER.md');

  let content = `# Risk Register

This document tracks all identified risks for the project.

Last updated: ${new Date().toISOString()}

## Risks

| ID | Description | Probability | Impact | Mitigation | Status | Owner |
|----|-------------|-------------|--------|------------|--------|-------|
`;

  risks.forEach((risk) => {
    content += `| ${risk.id} | ${risk.description} | ${risk.probability} | ${risk.impact} | ${risk.mitigation} | ${risk.status} | ${risk.owner} |\n`;
  });

  content += `

## Risk Assessment Legend

- **Probability**: Low (20%), Medium (50%), High (80%)
- **Impact**: Low (1), Medium (3), High (5)
- **Risk Score** = Probability × Impact
  - Score 1-2: Low Risk
  - Score 3-4: Medium Risk  
  - Score 5-8: High Risk
  - Score 9-10: Critical Risk

## Status Definitions

- **Active**: Risk is currently present and being monitored
- **Mitigated**: Risk has been reduced through mitigation actions
- **Closed**: Risk is no longer relevant or has occurred
- **Escalated**: Risk requires management attention

`;

  await fs.writeFile(riskFile, content);
}

// Calculate risk score
function calculateRiskScore(probability, impact) {
  const probValue = PROBABILITY_VALUES[probability.toUpperCase()] || 0;
  const impactValue = IMPACT_VALUES[impact.toUpperCase()] || 0;
  return probValue * impactValue;
}

// Get risk level based on score
function getRiskLevel(score) {
  if (score >= 4) return RISK_LEVELS.CRITICAL;
  if (score >= 2.5) return RISK_LEVELS.HIGH;
  if (score >= 1) return RISK_LEVELS.MEDIUM;
  return RISK_LEVELS.LOW;
}

// Add a new risk
export async function addRisk(
  description = null,
  probability = null,
  impact = null,
  mitigation = null
) {
  let riskData;

  if (!description) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Risk Description:',
        validate: (input) => input.trim().length > 0 || 'Description is required',
      },
      {
        type: 'list',
        name: 'probability',
        message: 'Probability:',
        choices: ['Low', 'Medium', 'High'],
      },
      {
        type: 'list',
        name: 'impact',
        message: 'Impact:',
        choices: ['Low', 'Medium', 'High'],
      },
      {
        type: 'input',
        name: 'mitigation',
        message: 'Mitigation Strategy:',
        validate: (input) => input.trim().length > 0 || 'Mitigation strategy is required',
      },
      {
        type: 'input',
        name: 'owner',
        message: 'Risk Owner:',
        default: process.env.USER || 'Unassigned',
      },
    ]);

    riskData = answers;
  } else {
    riskData = {
      description: description,
      probability: probability || 'Medium',
      impact: impact || 'Medium',
      mitigation: mitigation || 'To be determined',
      owner: process.env.USER || 'Unassigned',
    };
  }

  // Load existing risks
  const risks = await loadRisks();

  // Generate new risk ID
  const nextId =
    risks.length > 0 ? Math.max(...risks.map((r) => parseInt(r.id.replace('R', '')))) + 1 : 1;
  const riskId = `R${nextId.toString().padStart(3, '0')}`;

  // Create new risk object
  const newRisk = {
    id: riskId,
    description: riskData.description,
    probability: riskData.probability,
    impact: riskData.impact,
    mitigation: riskData.mitigation,
    status: 'Active',
    owner: riskData.owner,
  };

  // Add to risks array
  risks.push(newRisk);

  // Save to file
  await saveRisks(risks);

  // Calculate risk score
  const score = calculateRiskScore(riskData.probability, riskData.impact);
  const level = getRiskLevel(score);

  printSuccess(chalk.green(`\n✅ Risk ${riskId} added successfully!`));
  printInfo(chalk.gray(`Description: ${riskData.description}`));
  printInfo(chalk.gray(`Probability: ${riskData.probability}, Impact: ${riskData.impact}`));
  printInfo(chalk.gray(`Risk Score: ${score.toFixed(2)} (${level.label})`));
  printInfo(chalk.gray(`Mitigation: ${riskData.mitigation}`));

  return newRisk;
}

// List all risks
export async function listRisks(filterByStatus = null) {
  const risks = await loadRisks();

  if (risks.length === 0) {
    printInfo(chalk.gray('No risks registered yet.'));
    return;
  }

  printInfo(chalk.cyan('\n📋 Risk Register:\n'));

  // Filter risks if status is specified
  const filteredRisks = filterByStatus
    ? risks.filter((r) => r.status.toLowerCase() === filterByStatus.toLowerCase())
    : risks;

  if (filteredRisks.length === 0) {
    printInfo(chalk.gray(`No risks with status: ${filterByStatus}`));
    return;
  }

  // Sort by risk score (descending)
  filteredRisks.sort((a, b) => {
    const scoreA = calculateRiskScore(a.probability, a.impact);
    const scoreB = calculateRiskScore(b.probability, b.impact);
    return scoreB - scoreA;
  });

  filteredRisks.forEach((risk) => {
    const score = calculateRiskScore(risk.probability, risk.impact);
    const level = getRiskLevel(score);

    printInfo(`${level.color(`${risk.id} - ${level.label} Risk (${score.toFixed(2)})`)}`);
    printInfo(chalk.gray(`  Description: ${risk.description}`));
    printInfo(chalk.gray(`  Probability: ${risk.probability}, Impact: ${risk.impact}`));
    printInfo(chalk.gray(`  Mitigation: ${risk.mitigation}`));
    printInfo(chalk.gray(`  Status: ${risk.status}, Owner: ${risk.owner}`));
    printInfo('');
  });
}

// Update risk status
export async function updateRiskStatus(riskId, newStatus) {
  const risks = await loadRisks();

  const riskIndex = risks.findIndex((r) => r.id === riskId);
  if (riskIndex === -1) {
    throw new Error(`Risk ${riskId} not found`);
  }

  const oldStatus = risks[riskIndex].status;
  risks[riskIndex].status = newStatus;

  await saveRisks(risks);

  printSuccess(
    chalk.green(`\n✅ Risk ${riskId} status updated from "${oldStatus}" to "${newStatus}"`)
  );
}

// Check for critical risks
export async function checkCriticalRisks() {
  const risks = await loadRisks();

  const criticalRisks = risks.filter((risk) => {
    const score = calculateRiskScore(risk.probability, risk.impact);
    return score >= 4; // Critical threshold
  });

  if (criticalRisks.length > 0) {
    printWarning(chalk.redBright('\n🚨 CRITICAL RISKS DETECTED!'));
    printWarning(chalk.yellow('These risks require immediate attention before deployment:\n'));

    criticalRisks.forEach((risk) => {
      const score = calculateRiskScore(risk.probability, risk.impact);
      printWarning(
        chalk.redBright(`• ${risk.id}: ${risk.description} (Score: ${score.toFixed(2)})`)
      );
      printInfo(chalk.gray(`  Mitigation: ${risk.mitigation}`));
      printInfo('');
    });

    return true;
  }

  return false;
}

export function registerRiskCommand(program) {
  const riskCmd = program.command('risk').description('Manage project risks and register');

  riskCmd
    .command('add')
    .description('Add a new risk to the register')
    .action(async () => {
      try {
        await addRisk();
      } catch (error) {
        printError(chalk.red(`Failed to add risk: ${error.message}`));
        process.exit(1);
      }
    });

  riskCmd
    .command('list')
    .alias('ls')
    .description('List all risks in the register')
    .option('-s, --status <status>', 'Filter by status (Active, Mitigated, Closed, Escalated)')
    .action(async (options) => {
      try {
        await listRisks(options.status);
      } catch (error) {
        printError(chalk.red(`Failed to list risks: ${error.message}`));
        process.exit(1);
      }
    });

  riskCmd
    .command('update')
    .description('Update risk status')
    .argument('<id>', 'Risk ID to update')
    .argument('<status>', 'New status (Active, Mitigated, Closed, Escalated)')
    .action(async (id, status) => {
      try {
        await updateRiskStatus(id, status);
      } catch (error) {
        printError(chalk.red(`Failed to update risk: ${error.message}`));
        process.exit(1);
      }
    });

  riskCmd
    .command('check')
    .description('Check for critical risks')
    .action(async () => {
      try {
        const hasCriticalRisks = await checkCriticalRisks();
        if (!hasCriticalRisks) {
          printSuccess(chalk.green('✅ No critical risks detected'));
        }
      } catch (error) {
        printError(chalk.red(`Failed to check risks: ${error.message}`));
        process.exit(1);
      }
    });

  riskCmd._examples = [
    { command: 'ultra-dex risk add', description: 'Add a new risk to the register' },
    { command: 'ultra-dex risk list', description: 'List all risks' },
    { command: 'ultra-dex risk list --status Active', description: 'List active risks only' },
    { command: 'ultra-dex risk update R001 Mitigated', description: 'Update risk status' },
    { command: 'ultra-dex risk check', description: 'Check for critical risks' },
  ];
}

export default {
  addRisk,
  listRisks,
  updateRiskStatus,
  checkCriticalRisks,
  registerRiskCommand,
};
