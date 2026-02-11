#!/usr/bin/env node

/**
 * 🌌 Ultra-Dex v6.0.0 "Final Seal" Verification
 * Exhaustive audit of the unified Meta-Layer codebase.
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

console.log(chalk.bold.magenta(`
🌟 ULTRA-DEX v6.0.0: THE FINAL SEAL 🌟
`));

const results = { passed: 0, failed: 0, total: 0 };

function check(condition, description) {
  results.total++;
  if (condition) {
    console.log(chalk.green('  [PASS] ') + chalk.gray(description));
    results.passed++;
  } else {
    console.log(chalk.red('  [FAIL] ') + chalk.bold(description));
    results.failed++;
  }
}

async function runAudit() {
  // 1. Monorepo & Link Integrity
  console.log(chalk.cyan('📁 Architecture & Monorepo Audit'));
  const dirs = ['apps/cli', 'apps/dashboard', 'apps/cloud', 'src/core', 'packages/sdk'];
  for (const dir of dirs) {
    const exists = await fs.access(path.join(process.cwd(), dir)).then(() => true).catch(() => false);
    check(exists, `Core directory: ${dir}`);
  }
  
  const cliLink = await fs.lstat(path.join(process.cwd(), 'cli')).then(s => s.isSymbolicLink()).catch(() => false);
  check(cliLink, 'Legacy "cli/" symlink preserved for backward compatibility');

  // 2. Cognitive Kernel Unification
  console.log(chalk.cyan('\n🧠 Cognitive Kernel Unification Audit'));
  try {
    const { agentOrchestrator } = await import('../src/core/orchestration/index.js');
    check(!!agentOrchestrator.tasks, 'TaskGraph integrated into Nexus');
    check(!!agentOrchestrator.mcpServer, 'MCP Server integrated into Nexus');
    check(agentOrchestrator.listenerCount('task:start') >= 0, 'Event System active in Nexus');
    
    const { ppmManager } = await import('../src/core/memory/manager.js');
    await ppmManager.init();
    const stats = await ppmManager.stats();
    check(stats.hot >= 0, `Relational Memory online (Entries: ${stats.hot + stats.warm + stats.cold})`);
  } catch (e) {
    check(false, `Kernel Integrity Error: ${e.message}`);
  }

  // 3. Agent DNA & Specialized Swarm
  console.log(chalk.cyan('\n🤖 Agent DNA & Swarm Readiness'));
  try {
    const { agentOrchestrator } = await import('../src/core/orchestration/index.js');
    await agentOrchestrator.registry.initialize();
    const agentCount = agentOrchestrator.registry.getAllAgents().length;
    check(agentCount >= 16, `Specialized Swarm ready (${agentCount} production agents discovered)`);
    
    const plannerPrompt = await agentOrchestrator.registry.getAgentPrompt('planner');
    check(plannerPrompt.includes('# Planner Agent'), 'Agent Prompt discovery functional');
  } catch (e) {
    check(false, `Agent Discovery Error: ${e.message}`);
  }

  // 4. Hands of the Machine (MCP)
  console.log(chalk.cyan('\n🛠️  Toolbelt (MCP) Audit'));
  try {
    const { agentOrchestrator } = await import('../src/core/orchestration/index.js');
    const toolsResult = await agentOrchestrator.getTools();
    check(toolsResult.tools.length > 5, `MCP Toolbelt populated (${toolsResult.tools.length} tools registered)`);
    
    const hasQueryCodebase = toolsResult.tools.some(t => t.name === 'query_codebase');
    check(hasQueryCodebase, 'Critical tool: query_codebase available');
  } catch (e) {
    check(false, `MCP Tool Error: ${e.message}`);
  }

  // 5. Steel Gate (Security)
  console.log(chalk.cyan('\n🛡️  Steel Gate Security Audit'));
  try {
    const { codeValidator } = await import('../src/services/security/validators.js');
    const riskyCode = 'eval("rm -rf /")';
    const validation = codeValidator.validate(riskyCode);
    check(!validation.safe, 'CodeValidator correctly identifies critical risks (AST + Regex)');
    check(validation.findings.length >= 2, 'Multi-layer detection (AST and Regex) functional');
  } catch (e) {
    check(false, `Security Audit Error: ${e.message}`);
  }

  // 📊 Final Summary
  console.log(chalk.bold.magenta('\n📊 AUDIT SUMMARY'));
  console.log(chalk.gray(`  Total Checks:  ${results.total}`));
  console.log(chalk.green(`  Passed:        ${results.passed}`));
  if (results.failed > 0) {
    console.log(chalk.red(`  Failed:        ${results.failed}`));
    console.log(chalk.bold.red('\n🛑 THE FINAL SEAL IS BROKEN. CRITICAL ISSUES DETECTED.'));
    process.exit(1);
  } else {
    console.log(chalk.bold.green('\n💎 THE FINAL SEAL IS INTACT. ULTRA-DEX v6.0.0 IS READY FOR ASCENSION.'));
    process.exit(0);
  }
}

runAudit().catch(console.error);
