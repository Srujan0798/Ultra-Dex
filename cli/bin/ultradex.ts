#!/usr/bin/env node
/**
 * Ultra-Dex v2.0 CLI Entry Point
 *
 * Thin entry point — all logic lives in cli/commands/.
 * Lazy-loads commands to keep startup fast.
 *
 * Usage:
 *   ultradex init [project]
 *   ultradex run <workflow.dex> [--dry-run] [--timeout <ms>]
 *   ultradex status [workflowId]
 *   ultradex resume <workflowId>
 *   ultradex inspect <workflowId> [--json]
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dir, '../../package.json'), 'utf8')) as { version: string };

const program = new Command();

program
  .name('ultradex')
  .description('Ultra-Dex v2.0 — DexGraph workflow orchestration CLI')
  .version(pkg.version);

// ── Commands (lazy-loaded for fast startup) ────────────────────────────────

program
  .command('init [projectName]')
  .description('Initialize a new DexGraph project with a workflow template')
  .option('-t, --template <name>', 'starter template (linear|diamond|parallel)', 'linear')
  .action(async (projectName: string | undefined, opts: { template: string }) => {
    const { runInit } = await import('../commands/init.js');
    await runInit(projectName ?? 'my-workflow', opts);
  });

program
  .command('run <workflow>')
  .description('Parse, build graph, and execute a .dex workflow file')
  .option('--dry-run', 'Show execution plan without running')
  .option('--timeout <ms>', 'Per-task timeout in milliseconds', '300000')
  .option('--concurrency <n>', 'Max concurrent tasks', '4')
  .option('--on-failure <mode>', 'halt | continue | rollback', 'rollback')
  .action(async (workflow: string, opts: { dryRun?: boolean; timeout: string; concurrency: string; onFailure: string }) => {
    const { runWorkflow } = await import('../commands/run.js');
    await runWorkflow(workflow, {
      dryRun: opts.dryRun ?? false,
      timeoutMs: parseInt(opts.timeout, 10),
      maxConcurrent: parseInt(opts.concurrency, 10),
      onFailure: opts.onFailure as 'halt' | 'continue' | 'rollback',
    });
  });

program
  .command('status [workflowId]')
  .description('Show current state of a workflow (or all recent workflows)')
  .option('--json', 'Output as JSON')
  .action(async (workflowId: string | undefined, opts: { json?: boolean }) => {
    const { runStatus } = await import('../commands/status.js');
    await runStatus(workflowId, opts);
  });

program
  .command('resume <workflowId>')
  .description('Resume a workflow from the last FAILED or BLOCKED node')
  .action(async (workflowId: string) => {
    const { runResume } = await import('../commands/resume.js');
    await runResume(workflowId);
  });

program
  .command('inspect <workflowId>')
  .description('Show full graph topology + execution history for a workflow')
  .option('--json', 'Output as JSON')
  .action(async (workflowId: string, opts: { json?: boolean }) => {
    const { runInspect } = await import('../commands/inspect.js');
    await runInspect(workflowId, opts);
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  process.stderr.write(`\nFatal: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
