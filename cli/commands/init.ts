/**
 * ultradex init [projectName]
 *
 * Creates a new DexGraph project scaffold:
 *   <project>/workflow.dex    — starter workflow template
 *   <project>/workflow/       — output directory for artifacts
 *   <project>/.gitignore      — ignores .ultra-dex/ state dir
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { c } from '../utils/display.js';

const DEX_TEMPLATE = `# DexGraph Workflow
version: dexgraph/v1
name: my-workflow
description: Describe what this workflow does

context:
  environment: development

on_failure:
  retry: 2
  rollback: true

tasks:
  - id: plan
    role: architect
    instruction: |
      Analyze requirements and produce an architecture plan.
      Define data models, component boundaries, and API surface.
    output: architecture-plan

  - id: implement
    role: engineer
    instruction: |
      Implement the plan from {{plan.output}}.
      Write clean, tested TypeScript code following existing patterns.
    depends_on:
      - plan
    output: implementation
    verify:
      type: unit_test
      command: npm test

  - id: review
    role: reviewer
    instruction: |
      Review the implementation at {{implement.output}}.
      Check for security issues, best practices, and production-readiness.
    depends_on:
      - implement
    verify:
      type: llm_check
      policy: Code must be secure, well-tested, and production-ready
`;

const GITIGNORE = `.ultra-dex/
node_modules/
*.log
`;

export interface InitOptions {
  template?: string;
}

export async function runInit(projectName: string, _opts: InitOptions = {}): Promise<void> {
  const dir = path.resolve(process.cwd(), projectName);
  const dexFile = path.join(dir, 'workflow.dex');
  const workflowDir = path.join(dir, 'workflow');

  // Fail fast if dir already exists
  try {
    await fs.access(dir);
    process.stderr.write(`${c.red('Error:')} directory "${projectName}" already exists\n`);
    process.exit(1);
  } catch {
    // Good — doesn't exist yet
  }

  await fs.mkdir(dir, { recursive: true });
  await fs.mkdir(workflowDir, { recursive: true });
  await fs.writeFile(dexFile, DEX_TEMPLATE, 'utf-8');
  await fs.writeFile(path.join(dir, '.gitignore'), GITIGNORE, 'utf-8');

  process.stdout.write(`${c.green('✓')} Initialized project ${c.bold(projectName)}\n`);
  process.stdout.write(`  ${c.gray(dexFile)}\n\n`);
  process.stdout.write(`Next steps:\n`);
  process.stdout.write(`  ${c.cyan('ultradex run')} ${projectName}/workflow.dex ${c.dim('--dry-run')}\n`);
  process.stdout.write(`  ${c.cyan('ultradex run')} ${projectName}/workflow.dex\n\n`);
}
