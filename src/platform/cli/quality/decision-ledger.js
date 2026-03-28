// Copyright (c) 2026 Ultra-Dex

/**
 * Decision Ledger
 * Immutable log of architectural decisions
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { validateSafePath } from '../utils/validation.js';

// Decision ledger file path
const DECISION_LEDGER_PATH = path.join(process.cwd(), 'DECISION-LEDGER.md');

// ARFCAT decision framework
const DECISION_FRAMEWORK = {
  ASSUMPTIONS: 'Assumptions',
  RATIONALE: 'Rationale',
  FACTS: 'Facts',
  CONSTRAINTS: 'Constraints',
  ALTERNATIVES: 'Alternatives Considered',
  TRADEOFFS: 'Tradeoffs'
};

class DecisionLedger {
  constructor() {
    this.ledgerPath = DECISION_LEDGER_PATH;
  }

  /**
   * Initialize decision ledger file
   */
  async initializeLedger() {
    try {
      await fs.access(this.ledgerPath);
      printInfo(chalk.gray('📋 Decision ledger already exists'));
    } catch (error) {
      // File doesn't exist, create it
      const initialContent = `# Decision Ledger

This immutable log tracks all architectural and strategic decisions for this project.

## Legend
- **RFC**: Request for Comments (proposal stage)
- **DECIDED**: Decision made and implemented
- **DEPRECATED**: Decision was valid but is no longer applicable
- **SUPERSEDED**: Decision replaced by a newer decision

---

`;
      await fs.writeFile(this.ledgerPath, initialContent);
      printSuccess(chalk.green('✅ Created new decision ledger'));
    }
  }

  /**
   * Log a new decision
   */
  async logDecision(decisionData) {
    await this.initializeLedger();
    
    const decisionId = `DEC-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    // Format the decision according to ARFCAT framework
    const decisionEntry = `
## ${decisionId}: ${decisionData.title}

**Date:** ${timestamp}  
**Status:** ${decisionData.status || 'DECIDED'}  
**Author:** ${decisionData.author || process.env.USER || 'Anonymous'}  
**Reviewed by:** ${decisionData.reviewed_by || 'N/A'}  

### ${DECISION_FRAMEWORK.ASSUMPTIONS}
${decisionData.assumptions || 'No specific assumptions documented'}

### ${DECISION_FRAMEWORK.RATIONALE}
${decisionData.rationale || 'No rationale provided'}

### ${DECISION_FRAMEWORK.FACTS}
${decisionData.facts || 'No facts documented'}

### ${DECISION_FRAMEWORK.CONSTRAINTS}
${decisionData.constraints || 'No constraints identified'}

### ${DECISION_FRAMEWORK.ALTERNATIVES}
${decisionData.alternatives || 'No alternatives considered'}

### ${DECISION_FRAMEWORK.TRADEOFFS}
${decisionData.tradeoffs || 'No tradeoffs documented'}

### Consequences
**Positive:** ${decisionData.positive_consequences?.join(', ') || 'None identified'}  
**Negative:** ${decisionData.negative_consequences?.join(', ') || 'None identified'}  
**Neutral:** ${decisionData.neutral_consequences?.join(', ') || 'None identified'}

### Implementation Notes
${decisionData.implementation_notes || 'No implementation notes'}

### References
${decisionData.references?.map(ref => `- ${ref}`).join('\n') || 'No references'}

---
`;

    // Append the decision to the ledger
    await fs.appendFile(this.ledgerPath, decisionEntry);
    
    printSuccess(chalk.green(`✅ Decision logged: ${decisionId}`));
    printInfo(chalk.gray(`Title: ${decisionData.title}`));
    printInfo(chalk.gray(`File: ${this.ledgerPath}`));
    
    return { id: decisionId, timestamp, path: this.ledgerPath };
  }

  /**
   * Record a decision with interactive prompts
   */
  async recordDecision() {
    printInfo(chalk.cyan('\n📋 Recording New Decision\n'));
    
    const questions = [
      {
        type: 'input',
        name: 'title',
        message: 'Decision Title:',
        validate: input => input.trim().length > 0 || 'Title is required'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Brief Description:',
        validate: input => input.trim().length > 0 || 'Description is required'
      },
      {
        type: 'editor',
        name: 'rationale',
        message: 'What was the rationale for this decision?',
        default: 'Explain the reasoning behind this decision...'
      },
      {
        type: 'checkbox',
        name: 'constraints',
        message: 'What constraints influenced this decision?',
        choices: [
          { name: 'Time constraints', value: 'time' },
          { name: 'Resource limitations', value: 'resources' },
          { name: 'Technical debt', value: 'technical-debt' },
          { name: 'Team expertise', value: 'expertise' },
          { name: 'Budget limitations', value: 'budget' },
          { name: 'Security requirements', value: 'security' },
          { name: 'Performance requirements', value: 'performance' },
          { name: 'Compliance requirements', value: 'compliance' },
          { name: 'Other', value: 'other' }
        ]
      },
      {
        type: 'editor',
        name: 'alternatives',
        message: 'What alternatives were considered?',
        default: '- Alternative 1: ...\n- Alternative 2: ...\n- Alternative 3: ...'
      },
      {
        type: 'editor',
        name: 'tradeoffs',
        message: 'What tradeoffs were made?',
        default: '- Pros: ...\n- Cons: ...'
      },
      {
        type: 'checkbox',
        name: 'consequences',
        message: 'What are the consequences?',
        choices: [
          { name: 'Performance impact', value: 'performance' },
          { name: 'Security implications', value: 'security' },
          { name: 'Maintainability', value: 'maintainability' },
          { name: 'Scalability', value: 'scalability' },
          { name: 'Team productivity', value: 'productivity' },
          { name: 'Future flexibility', value: 'flexibility' }
        ]
      },
      {
        type: 'input',
        name: 'reviewed_by',
        message: 'Reviewed by (optional):'
      }
    ];

    const answers = await inquirer.prompt(questions);
    
    // Format constraints and consequences as strings
    const formattedDecision = {
      ...answers,
      constraints: answers.constraints?.join(', ') || 'None',
      consequences: answers.consequences?.join(', ') || 'None'
    };

    return await this.logDecision(formattedDecision);
  }

  /**
   * List all decisions
   */
  async listDecisions(filter = null) {
    try {
      await fs.access(this.ledgerPath);
      const content = await fs.readFile(this.ledgerPath, 'utf8');
      
      // Extract decision IDs and titles using regex
      const decisionRegex = /## (DEC-\d+): (.+?)\n\*\*Date:\*\* (.+?)\n\*\*Status:\*\* (.+?)\n/g;
      const decisions = [];
      let match;
      
      while ((match = decisionRegex.exec(content)) !== null) {
        const [, id, title, date, status] = match;
        if (!filter || status.toLowerCase().includes(filter.toLowerCase())) {
          decisions.push({ id, title, date, status });
        }
      }
      
      if (decisions.length === 0) {
        printInfo(chalk.gray('No decisions recorded yet.'));
        return [];
      }
      
      printSuccess(chalk.green(`\n📋 Found ${decisions.length} decisions:\n`));
      
      decisions.forEach((decision, index) => {
        const statusColor = decision.status === 'DECIDED' ? chalk.green :
                          decision.status === 'RFC' ? chalk.blue :
                          decision.status === 'DEPRECATED' ? chalk.red :
                          decision.status === 'SUPERSEDED' ? chalk.yellow : chalk.gray;
        
        printInfo(`${index + 1}. ${statusColor(decision.id)} - ${decision.title}`);
        printInfo(chalk.gray(`   Date: ${decision.date} | Status: ${decision.status}`));
        printInfo('');
      });
      
      return decisions;
    } catch (error) {
      printWarning(chalk.yellow('No decision ledger found. Run `ultra-dex decision record` to create one.'));
      return [];
    }
  }

  /**
   * Find decisions by keyword
   */
  async findDecisions(keyword) {
    try {
      await fs.access(this.ledgerPath);
      const content = await fs.readFile(this.ledgerPath, 'utf8');
      
      // Split content into individual decisions
      const decisionSections = content.split(/(?=## DEC-\d+:)/).filter(section => section.trim());
      
      const matches = [];
      for (const section of decisionSections) {
        if (section.toLowerCase().includes(keyword.toLowerCase())) {
          // Extract decision ID and title
          const idMatch = section.match(/## (DEC-\d+): (.+?)\n/);
          if (idMatch) {
            matches.push({
              id: idMatch[1],
              title: idMatch[2],
              snippet: section.substring(0, 200) + '...'
            });
          }
        }
      }
      
      if (matches.length === 0) {
        printInfo(chalk.gray(`No decisions found containing: ${keyword}`));
        return [];
      }
      
      printSuccess(chalk.green(`\n🔍 Found ${matches.length} decisions matching "${keyword}":\n`));
      
      matches.forEach((match, index) => {
        printInfo(`${index + 1}. ${chalk.cyan(match.id)} - ${match.title}`);
        printInfo(chalk.gray(`   Snippet: ${match.snippet}`));
        printInfo('');
      });
      
      return matches;
    } catch (error) {
      printWarning(chalk.yellow('No decision ledger found to search.'));
      return [];
    }
  }

  /**
   * Show decision details
   */
  async showDecision(decisionId) {
    try {
      await fs.access(this.ledgerPath);
      const content = await fs.readFile(this.ledgerPath, 'utf8');
      
      // Find the specific decision
      const decisionRegex = new RegExp(`## ${decisionId}: (.+?)\n.*?---`, 's');
      const match = content.match(decisionRegex);
      
      if (!match) {
        printError(chalk.red(`Decision not found: ${decisionId}`));
        return null;
      }
      
      printSuccess(chalk.green(`\n📋 Decision Details: ${decisionId}\n`));
      logger.log(match[0]);
      
      return match[0];
    } catch (error) {
      printError(chalk.red(`Failed to read decision: ${error.message}`));
      return null;
    }
  }

  /**
   * Generate decision summary report
   */
  async generateSummary() {
    try {
      await fs.access(this.ledgerPath);
      const content = await fs.readFile(this.ledgerPath, 'utf8');
      
      // Extract all decisions
      const decisionRegex = /## (DEC-\d+): (.+?)\n\*\*Date:\*\* (.+?)\n\*\*Status:\*\* (.+?)\n/g;
      const decisions = [];
      let match;
      
      while ((match = decisionRegex.exec(content)) !== null) {
        decisions.push({
          id: match[1],
          title: match[2],
          date: match[3],
          status: match[4]
        });
      }
      
      // Count by status
      const statusCounts = decisions.reduce((acc, dec) => {
        acc[dec.status] = (acc[dec.status] || 0) + 1;
        return acc;
      }, {});
      
      printSuccess(chalk.green('\n📊 Decision Ledger Summary\n'));
      printInfo(chalk.cyan(`Total Decisions: ${decisions.length}`));
      
      for (const [status, count] of Object.entries(statusCounts)) {
        const color = status === 'DECIDED' ? chalk.green :
                     status === 'RFC' ? chalk.blue :
                     status === 'DEPRECATED' ? chalk.red :
                     status === 'SUPERSEDED' ? chalk.yellow : chalk.gray;
        printInfo(color(`${status}: ${count}`));
      }
      
      // Show recent decisions
      if (decisions.length > 0) {
        printInfo(chalk.cyan('\nRecent Decisions:'));
        const recent = decisions.slice(-5).reverse(); // Last 5, most recent first
        recent.forEach(dec => {
          const statusColor = dec.status === 'DECIDED' ? chalk.green :
                            dec.status === 'RFC' ? chalk.blue :
                            dec.status === 'DEPRECATED' ? chalk.red :
                            dec.status === 'SUPERSEDED' ? chalk.yellow : chalk.gray;
          printInfo(`${statusColor(dec.id)} - ${dec.title} (${dec.date})`);
        });
      }
      
      return {
        total: decisions.length,
        byStatus: statusCounts,
        recent: decisions.slice(-5).reverse()
      };
    } catch (error) {
      printWarning(chalk.yellow('No decision ledger found to summarize.'));
      return { total: 0, byStatus: {}, recent: [] };
    }
  }

  /**
   * Validate decision ledger format
   */
  async validateLedger() {
    try {
      await fs.access(this.ledgerPath);
      const content = await fs.readFile(this.ledgerPath, 'utf8');
      
      // Check for basic structure
      const hasHeader = content.includes('# Decision Ledger');
      const decisionCount = (content.match(/## DEC-\d+:/g) || []).length;
      const hasFramework = Object.values(DECISION_FRAMEWORK).every(section => 
        content.includes(section)
      );
      
      const validationResult = {
        valid: hasHeader && decisionCount > 0,
        hasHeader,
        decisionCount,
        hasFramework,
        issues: []
      };
      
      if (!hasHeader) {
        validationResult.issues.push('Missing "# Decision Ledger" header');
      }
      
      if (decisionCount === 0) {
        validationResult.issues.push('No decisions found in ledger');
      }
      
      if (!hasFramework) {
        validationResult.issues.push('Missing ARFCAT framework sections');
      }
      
      if (validationResult.valid) {
        printSuccess(chalk.green('✅ Decision ledger format is valid'));
      } else {
        printWarning(chalk.yellow('⚠️  Decision ledger validation issues:'));
        validationResult.issues.forEach(issue => {
          printInfo(chalk.gray(`  - ${issue}`));
        });
      }
      
      return validationResult;
    } catch (error) {
      printError(chalk.red(`Ledger validation failed: ${error.message}`));
      return { valid: false, error: error.message };
    }
  }

  /**
   * Export decisions to JSON
   */
  async exportDecisions(format = 'json') {
    try {
      await fs.access(this.ledgerPath);
      const content = await fs.readFile(this.ledgerPath, 'utf8');
      
      // Extract all decisions with full details
      const decisionRegex = /## (DEC-\d+): (.+?)\n([\s\S]*?)(?=\n## DEC-\d+:|$)/g;
      const decisions = [];
      let match;
      
      while ((match = decisionRegex.exec(content)) !== null) {
        const [, id, title, details] = match;
        
        // Extract specific fields from details
        const statusMatch = details.match(/\*\*Status:\*\* (.+?)\n/);
        const dateMatch = details.match(/\*\*Date:\*\* (.+?)\n/);
        const authorMatch = details.match(/\*\*Author:\*\* (.+?)\n/);
        
        decisions.push({
          id,
          title,
          status: statusMatch ? statusMatch[1] : 'Unknown',
          date: dateMatch ? dateMatch[1] : 'Unknown',
          author: authorMatch ? authorMatch[1] : 'Unknown',
          details: details.trim()
        });
      }
      
      if (format === 'json') {
        const jsonPath = path.join(process.cwd(), 'DECISIONS-EXPORT.json');
        await fs.writeFile(jsonPath, JSON.stringify(decisions, null, 2));
        printSuccess(chalk.green(`✅ Decisions exported to: ${jsonPath}`));
        return jsonPath;
      } else if (format === 'csv') {
        const csvPath = path.join(process.cwd(), 'DECISIONS-EXPORT.csv');
        const csvContent = [
          ['ID', 'Title', 'Status', 'Date', 'Author'],
          ...decisions.map(d => [d.id, d.title, d.status, d.date, d.author])
        ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
        
        await fs.writeFile(csvPath, csvContent);
        printSuccess(chalk.green(`✅ Decisions exported to: ${csvPath}`));
        return csvPath;
      }
      
      return decisions;
    } catch (error) {
      printError(chalk.red(`Decision export failed: ${error.message}`));
      throw error;
    }
  }
}

// Global instance
const decisionLedger = new DecisionLedger();

/**
 * Register decision command
 */
export function registerDecisionCommand(program) {
  const decisionCmd = program
    .command('decision')
    .alias('decisions')
    .description('Immutable decision ledger for architectural choices');

  decisionCmd
    .command('record')
    .alias('add')
    .description('Record a new architectural decision')
    .action(async () => {
      try {
        await decisionLedger.recordDecision();
      } catch (error) {
        printError(chalk.red(`Decision recording failed: ${error.message}`));
        process.exit(1);
      }
    });

  decisionCmd
    .command('list')
    .alias('ls')
    .description('List all recorded decisions')
    .option('-s, --status <status>', 'Filter by status (DECIDED, RFC, DEPRECATED, SUPERSEDED)')
    .action(async (options) => {
      try {
        await decisionLedger.listDecisions(options.status);
      } catch (error) {
        printError(chalk.red(`Decision list failed: ${error.message}`));
        process.exit(1);
      }
    });

  decisionCmd
    .command('find')
    .description('Search decisions by keyword')
    .argument('<keyword>', 'Keyword to search for')
    .action(async (keyword) => {
      try {
        await decisionLedger.findDecisions(keyword);
      } catch (error) {
        printError(chalk.red(`Decision search failed: ${error.message}`));
        process.exit(1);
      }
    });

  decisionCmd
    .command('show')
    .description('Show details of a specific decision')
    .argument('<id>', 'Decision ID (e.g., DEC-1234567890)')
    .action(async (id) => {
      try {
        await decisionLedger.showDecision(id);
      } catch (error) {
        printError(chalk.red(`Show decision failed: ${error.message}`));
        process.exit(1);
      }
    });

  decisionCmd
    .command('summary')
    .alias('stats')
    .description('Generate decision summary report')
    .action(async () => {
      try {
        await decisionLedger.generateSummary();
      } catch (error) {
        printError(chalk.red(`Decision summary failed: ${error.message}`));
        process.exit(1);
      }
    });

  decisionCmd
    .command('validate')
    .description('Validate decision ledger format')
    .action(async () => {
      try {
        await decisionLedger.validateLedger();
      } catch (error) {
        printError(chalk.red(`Decision validation failed: ${error.message}`));
        process.exit(1);
      }
    });

  decisionCmd
    .command('export')
    .description('Export decisions to other formats')
    .option('-f, --format <format>', 'Export format (json, csv)', 'json')
    .action(async (options) => {
      try {
        await decisionLedger.exportDecisions(options.format);
      } catch (error) {
        printError(chalk.red(`Decision export failed: ${error.message}`));
        process.exit(1);
      }
    });

  decisionCmd._examples = [
    { command: 'ultra-dex decision record', description: 'Record a new architectural decision' },
    { command: 'ultra-dex decision list', description: 'List all decisions' },
    { command: 'ultra-dex decision list --status DECIDED', description: 'List only decided items' },
    { command: 'ultra-dex decision find database', description: 'Find decisions about databases' },
    { command: 'ultra-dex decision show DEC-1234567890', description: 'Show specific decision details' },
    { command: 'ultra-dex decision summary', description: 'Show decision statistics' },
    { command: 'ultra-dex decision validate', description: 'Validate ledger format' },
    { command: 'ultra-dex decision export --format csv', description: 'Export decisions to CSV' }
  ];
}

export default {
  DecisionLedger,
  decisionLedger,
  registerDecisionCommand
};