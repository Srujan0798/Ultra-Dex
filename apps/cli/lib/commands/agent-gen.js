// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Agent Gen module
 * @module commands/agent-gen
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { validateSafePath } from '../utils/validation.js';

const DOMAIN_CONFIG = {
  healthcare: {
    agentName: '@HealthCompliance',
    responsibilities: ['HIPAA compliance', 'Patient data handling', 'Audit logging'],
    businessLogic: ['Ensure PHI is encrypted', 'Track consent', 'Restrict access by role'],
    constraints: ['No PHI in logs', 'Minimum necessary access'],
    edgeCases: ['Emergency access flows', 'Consent revocation'],
    codePatterns: ['Use field-level encryption', 'Redact sensitive fields'],
  },
  fintech: {
    agentName: '@PaymentLogic',
    responsibilities: ['Fraud detection', 'Payment reconciliation', 'Ledger integrity'],
    businessLogic: ['Idempotent transactions', 'Risk scoring'],
    constraints: ['PCI-DSS compliance', 'Immutable audit trail'],
    edgeCases: ['Chargebacks', 'Partial refunds'],
    codePatterns: ['Use idempotency keys', 'Double-entry ledger'],
  },
  ecommerce: {
    agentName: '@CatalogManager',
    responsibilities: ['Inventory control', 'Pricing rules', 'Promotions'],
    businessLogic: ['Stock reservation', 'Discount stacking rules'],
    constraints: ['Prevent overselling', 'Enforce minimum price'],
    edgeCases: ['Backorders', 'Flash sale throttling'],
    codePatterns: ['Inventory locking', 'Price rule engine'],
  },
  booking: {
    agentName: '@BookingEngine',
    responsibilities: ['Availability checks', 'Conflict prevention', 'Cancellation policies'],
    businessLogic: ['Hold slots', 'Buffer times'],
    constraints: ['24h notice', '2h max duration'],
    edgeCases: ['Overlapping bookings', 'Reschedules'],
    codePatterns: ['Transactional booking', 'Optimistic concurrency'],
  },
  legal: {
    agentName: '@LegalCompliance',
    responsibilities: ['Contract generation', 'Clause validation', 'Audit trails'],
    businessLogic: ['Approval workflow', 'Versioned clauses'],
    constraints: ['No unapproved templates', 'Immutable history'],
    edgeCases: ['Amendments', 'Jurisdiction differences'],
    codePatterns: ['Template registry', 'Clause diffing'],
  },
};

function fillTemplate(template, data) {
  return template
    .replace('{{AGENT_NAME}}', data.agentName)
    .replace('{{RESPONSIBILITIES}}', data.responsibilities.map((r) => `- ${r}`).join('\n'))
    .replace('{{BUSINESS_LOGIC}}', data.businessLogic.map((r) => `- ${r}`).join('\n'))
    .replace('{{CONSTRAINTS}}', data.constraints.map((r) => `- ${r}`).join('\n'))
    .replace('{{EDGE_CASES}}', data.edgeCases.map((r) => `- ${r}`).join('\n'))
    .replace('{{CODE_PATTERNS}}', data.codePatterns.map((r) => `- ${r}`).join('\n'));
}

export async function generateDomainAgent(domain) {
  const normalized = domain.toLowerCase();
  const config = DOMAIN_CONFIG[normalized];
  if (!config) {
    throw new Error(`Unknown domain: ${domain}`);
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const templatePath = path.resolve(__dirname, '../../templates/domain-agent.md');
  const fallbackPath = path.resolve(process.cwd(), 'templates', 'domain-agent.md');
  let template = '';
  try {
    template = await fs.readFile(templatePath, 'utf8');
  } catch {
    template = await fs.readFile(fallbackPath, 'utf8');
  }

  const output = fillTemplate(template, config);
  const targetDir = path.resolve(process.cwd(), 'agents', '7-domain');
  await fs.mkdir(targetDir, { recursive: true });

  const filename = `${normalized}.md`;
  const target = path.join(targetDir, filename);
  await fs.writeFile(target, output, 'utf8');

  return { target, agentName: config.agentName };
}

export function registerAgentGenerator(agentsCmd) {
  agentsCmd
    .command('generate')
    .description('Generate a domain-specific agent')
    .option('--domain <domain>', 'Domain name (healthcare, fintech, ecommerce, booking, legal)')
    .action(async (options) => {
      try {
        if (!options.domain) {
          printWarning(chalk.yellow('Provide --domain to generate an agent.'));
          return;
        }
        const validation = validateSafePath(options.domain, 'Domain');
        if (validation !== true) {
          printError(chalk.red(validation));
          return;
        }
        const result = await generateDomainAgent(options.domain);
        printSuccess(chalk.green(`✅ Generated ${result.agentName} at ${result.target}`));
      } catch (error) {
        printError(chalk.red(`Agent generation failed: ${error.message}`));
      }
    });
}
