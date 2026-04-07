// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';



/**
 * Risk Register Module
 * Track and mitigate project-level threats
 */
export class RiskRegister {
  constructor() {
    this.risksPath = path.resolve(process.cwd(), '.ultra/risks.json');
  }

  async addRisk(risk) {
    const risks = await this.loadRisks();
    risks.push({
      id: Date.now().toString(36),
      timestamp: new Date().toISOString(),
      ...risk
    });
    await this.saveRisks(risks);
    await this.generateReport(risks);
  }

  async loadRisks() {
    try {
      const content = await fs.readFile(this.risksPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  async saveRisks(risks) {
    await fs.mkdir(path.dirname(this.risksPath), { recursive: true });
    await fs.writeFile(this.risksPath, JSON.stringify(risks, null, 2));
  }

  async generateReport(risks) {
    const reportPath = path.resolve(process.cwd(), 'RISK-REGISTER.md');
    let md = '# 🛡️ Project Risk Register\n\n';
    md += '| ID | Risk | Probability | Impact | Mitigation | Status |\n';
    md += '| :--- | :--- | :--- | :--- | :--- | :--- |\n';
    
    risks.forEach(r => {
      md += `| ${r.id} | ${r.description} | ${r.probability} | ${r.impact} | ${r.mitigation} | ${r.status || 'Active'} |\n`;
    });

    await fs.writeFile(reportPath, md);
  }
}

/**
 * Register risk command
 * @param {Command} program
 */
export function registerRiskCommand(program) {
  program
    .command('risk')
    .description('Manage project risks')
    .option('-a, --add', 'Add a new risk')
    .option('-l, --list', 'List all risks')
    .action(async (options) => {
      const rr = new RiskRegister();
      if (options.add) {
        // In a real app, use inquirer to get details
        console.log('Use interactive mode to add risks (Coming soon)');
      } else {
        const risks = await rr.loadRisks();
        console.table(risks);
        await rr.generateReport(risks);
        console.log('Risk register updated: RISK-REGISTER.md');
      }
    });
}