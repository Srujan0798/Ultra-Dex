import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { printWarning, printInfo } from '../utils/output.js';

export const GOLDEN_FLOW = [
  'Read CONTEXT.md',
  'Read AI-AGENT-PLAN.md',
  'Check agents/00-AGENT_INDEX.md',
  'Execute task',
  'Update CONTEXT.md'
];

export async function runPreflight(projectRoot) {
  const preflight = {
    contextLoaded: false,
    agentSelected: false,
    cursorRulesChecked: false,
    noConflicts: true
  };

  try {
    await fs.access(path.join(projectRoot, 'CONTEXT.md'));
    preflight.contextLoaded = true;
  } catch {}

  try {
    await fs.access(path.join(projectRoot, 'AI-AGENT-PLAN.md'));
    preflight.agentSelected = true;
  } catch {}

  try {
    await fs.access(path.join(projectRoot, 'agents', '00-AGENT_INDEX.md'));
    preflight.cursorRulesChecked = true;
  } catch {}

  return preflight;
}

export function warnIfSkipping(preflight) {
  const missing = [];
  if (!preflight.contextLoaded) missing.push('CONTEXT.md');
  if (!preflight.agentSelected) missing.push('AI-AGENT-PLAN.md');
  if (!preflight.cursorRulesChecked) missing.push('agents/00-AGENT_INDEX.md');

  if (missing.length) {
    printWarning(chalk.yellow('⚠️  Agent workflow steps missing:'));
    missing.forEach(item => printWarning(`- ${item}`));
    printInfo(chalk.gray('Golden flow:'));
    GOLDEN_FLOW.forEach(step => printInfo(chalk.gray(`  • ${step}`)));
  }
}
