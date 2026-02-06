// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import {
  fetchWorkflowRegistry,
  parseWorkflowSpecifier,
  selectWorkflowVersion,
} from './workflow-registry.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

const WORKFLOW_DIR = path.resolve(process.cwd(), '.ultra-dex', 'workflows');

async function ensureDir() {
  await fs.mkdir(WORKFLOW_DIR, { recursive: true });
}

export class WorkflowMarketplace {
  async search(query) {
    const registry = await fetchWorkflowRegistry();
    const list = registry.workflows || [];
    if (!query) return list;
    return list.filter(
      (entry) =>
        entry.name.toLowerCase().includes(query.toLowerCase()) ||
        entry.description.toLowerCase().includes(query.toLowerCase()) ||
        (entry.tags || []).some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
    );
  }

  async listInstalled() {
    await ensureDir();
    const files = await fs.readdir(WORKFLOW_DIR);
    const manifests = files.filter((file) => file.endsWith('.json'));
    const installed = [];
    for (const manifest of manifests) {
      try {
        const raw = await fs.readFile(path.join(WORKFLOW_DIR, manifest), 'utf8');
        installed.push(JSON.parse(raw));
      } catch {
        // ignore
      }
    }
    return installed;
  }

  async install(specifier) {
    const { name, version } = parseWorkflowSpecifier(specifier);
    const registry = await fetchWorkflowRegistry();
    const entry = registry.workflows.find((w) => w.name === name);
    if (!entry) throw new Error(`Workflow not found: ${name}`);
    const resolvedVersion = selectWorkflowVersion(entry, version);
    if (!resolvedVersion) throw new Error('Requested version unavailable');

    await ensureDir();
    const manifest = {
      name: entry.name,
      version: resolvedVersion,
      description: entry.description,
      tags: entry.tags || [],
    };
    const target = path.join(WORKFLOW_DIR, `${name.replace(/[@/]/g, '_')}.json`);
    await fs.writeFile(target, JSON.stringify(manifest, null, 2), 'utf8');
    return manifest;
  }

  async uninstall(name) {
    await ensureDir();
    const target = path.join(WORKFLOW_DIR, `${name.replace(/[@/]/g, '_')}.json`);
    await fs.rm(target, { force: true });
  }

  async run(name, planPath = path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md')) {
    const installed = await this.listInstalled();
    const workflow = installed.find((entry) => entry.name === name);
    if (!workflow) throw new Error(`Workflow not installed: ${name}`);

    const section = `\n## Workflow: ${workflow.name}\n- [ ] ${workflow.description}\n`;
    await fs.appendFile(planPath, section, 'utf8').catch(() => {});
    return workflow;
  }
}

export async function displayWorkflowSearch(query) {
  const marketplace = new WorkflowMarketplace();
  const results = await marketplace.search(query);
  if (!results.length) {
    printWarning(chalk.yellow('No workflows found.'));
    return;
  }
  results.forEach((result) => {
    printInfo(chalk.cyan(`${result.name} ${chalk.gray(result.latest || '')}`));
    printInfo(chalk.gray(`  ${result.description}`));
  });
}

export async function installWorkflow(specifier) {
  const marketplace = new WorkflowMarketplace();
  const manifest = await marketplace.install(specifier);
  printSuccess(chalk.green(`Installed ${manifest.name}@${manifest.version}`));
}

export async function uninstallWorkflow(name) {
  const marketplace = new WorkflowMarketplace();
  await marketplace.uninstall(name);
  printSuccess(chalk.green(`Uninstalled ${name}`));
}

export async function runWorkflow(name) {
  const marketplace = new WorkflowMarketplace();
  const workflow = await marketplace.run(name);
  printSuccess(chalk.green(`Workflow started: ${workflow.name}`));
}

export async function listWorkflows() {
  const marketplace = new WorkflowMarketplace();
  const installed = await marketplace.listInstalled();
  if (!installed.length) {
    printWarning(chalk.yellow('No workflows installed.'));
    return;
  }
  installed.forEach((workflow) => {
    printInfo(chalk.cyan(`${workflow.name} ${chalk.gray(workflow.version)}`));
  });
}

export async function infoWorkflow(name) {
  const marketplace = new WorkflowMarketplace();
  const installed = await marketplace.listInstalled();
  const workflow = installed.find((entry) => entry.name === name);
  if (!workflow) {
    printWarning(chalk.yellow(`Workflow not installed: ${name}`));
    return;
  }
  printInfo(chalk.cyan(`${workflow.name} ${chalk.gray(workflow.version)}`));
  printInfo(chalk.gray(workflow.description));
}
