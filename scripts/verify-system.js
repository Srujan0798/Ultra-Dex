#!/usr/bin/env node

/**
 * Ultra-Dex v4.0.0 System Verification Script
 * 
 * This script verifies that all core systems are functioning properly
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

console.log(chalk.blue('\n🎮 Ultra-Dex v4.0.0 System Verification\n'));
console.log(chalk.gray('Verifying all core systems are operational...\n'));

const results = {
  passed: 0,
  failed: 0,
  total: 0
};

function check(condition, description, expected = true) {
  results.total++;
  
  if (condition === expected) {
    console.log(chalk.green('  ✅ ') + chalk.gray(description));
    results.passed++;
    return true;
  } else {
    console.log(chalk.red('  ❌ ') + chalk.gray(description));
    results.failed++;
    return false;
  }
}

async function verifyFileSystem() {
  console.log(chalk.yellow('\n📁 File System Verification\n'));
  
  // Check core directories exist
  const coreDirs = [
    '.ultra-dex',
    'cli/lib',
    'cli/lib/governance',
    'cli/lib/mcp',
    'cli/lib/memory',
    'cli/lib/commands',
    'agents'
  ];
  
  for (const dir of coreDirs) {
    const exists = await fs.access(path.join(process.cwd(), dir)).then(() => true).catch(() => false);
    check(exists, `Directory exists: ${dir}`);
  }
  
  // Check core files exist
  const coreFiles = [
    'cli/bin/ultra-dex.js',
    'cli/lib/governance/index.js',
    'cli/lib/mcp/server.js',
    'cli/lib/memory/titans.js',
    'cli/lib/commands/memory.js'
  ];
  
  for (const file of coreFiles) {
    const exists = await fs.access(path.join(process.cwd(), file)).then(() => true).catch(() => false);
    check(exists, `File exists: ${file}`);
  }
}

async function verifyMemorySystem() {
  console.log(chalk.yellow('\n🧠 Memory System Verification\n'));
  
  try {
    const { titansMemory } = await import('./cli/lib/memory/titans.js');
    check(!!titansMemory, 'Memory system can be imported');
    
    // Test basic memory operations
    const testEntry = await titansMemory.add('Test memory entry for verification', 'hot');
    check(!!testEntry.id, 'Can add entry to memory');
    
    const stats = await titansMemory.stats();
    check(stats.hot >= 0, 'Can retrieve memory statistics');
    
    console.log(chalk.gray(`    Memory stats: Hot=${stats.hot}, Warm=${stats.warm}, Cold=${stats.cold}`));
  } catch (error) {
    check(false, `Memory system error: ${error.message}`);
  }
}

async function verifyGovernanceSystem() {
  console.log(chalk.yellow('\n🛡️  Governance System Verification\n'));
  
  try {
    const { governance } = await import('./cli/lib/governance/index.js');
    check(!!governance, 'Governance system can be imported');
    
    // Test authorization
    const authResult = governance.authorize('default', 'read', 'test.txt');
    check(authResult.allowed !== undefined, 'Authorization system works');
    
    console.log(chalk.gray(`    Authorization test result: ${authResult.allowed ? 'ALLOWED' : 'DENIED'}`));
  } catch (error) {
    check(false, `Governance system error: ${error.message}`);
  }
}

async function verifyMCPSystem() {
  console.log(chalk.yellow('\n🔌 MCP System Verification\n'));
  
  try {
    const { createMcpServer } = await import('./cli/lib/mcp/server.js');
    check(typeof createMcpServer === 'function', 'MCP server factory exists');
    
    // Test server creation (without starting)
    const server = createMcpServer();
    check(!!server, 'MCP server can be created');
  } catch (error) {
    check(false, `MCP system error: ${error.message}`);
  }
}

async function verifyConfigSystem() {
  console.log(chalk.yellow('\n⚙️  Configuration System Verification\n'));
  
  try {
    const { configManager } = await import('./cli/lib/utils/config-manager.js');
    check(!!configManager, 'Config manager can be imported');
    
    // Test config loading
    const config = await configManager.load().catch(() => null);
    check(!!config, 'Configuration can be loaded');
    
    if (config) {
      const aiProvider = configManager.get('ai.defaultProvider');
      console.log(chalk.gray(`    AI Provider: ${aiProvider || 'not set'}`));
    }
  } catch (error) {
    check(false, `Config system error: ${error.message}`);
  }
}

async function verifyCapabilitySystem() {
  console.log(chalk.yellow('\n🔐 Capability System Verification\n'));
  
  try {
    const { validateCapabilities } = await import('./cli/lib/mcp/capability-router.js');
    check(typeof validateCapabilities === 'function', 'Capability validation function exists');
    
    // Test capability validation
    const result = await validateCapabilities('test-tool', {});
    check(result !== undefined, 'Capability validation works');
  } catch (error) {
    check(false, `Capability system error: ${error.message}`);
  }
}

async function verifyADRSysystem() {
  console.log(chalk.yellow('\n📋 ADR System Verification\n'));

  try {
    const { ADR_SCHEMA } = await import('./cli/lib/governance/adr-schema.js');
    check(!!ADR_SCHEMA, 'ADR schema can be imported');

    const { checkADRGovernance } = await import('./cli/lib/governance/adr-check.js');
    check(typeof checkADRGovernance === 'function', 'ADR governance checker exists');
  } catch (error) {
    check(false, `ADR system error: ${error.message}`);
  }
}

async function runVerification() {
  try {
    await verifyFileSystem();
    await verifyMemorySystem();
    await verifyGovernanceSystem();
    await verifyMCPSystem();
    await verifyConfigSystem();
    await verifyCapabilitySystem();
    await verifyADRSysystem();
    
    console.log(chalk.blue('\n📊 Verification Summary\n'));
    console.log(chalk.gray(`  Total checks: ${results.total}`));
    console.log(chalk.green(`  Passed: ${results.passed}`));
    console.log(chalk.red(`  Failed: ${results.failed}`));
    
    if (results.failed === 0) {
      console.log(chalk.green('\n🎉 All systems verified successfully! Ultra-Dex v4.0.0 is ready for use.'));
      console.log(chalk.blue('\n🚀 You can now run:'));
      console.log(chalk.gray('   ultra-dex init --enterprise'));
      console.log(chalk.gray('   ultra-dex scaffold "my feature"'));
      console.log(chalk.gray('   ultra-dex auto-implement --feature "my feature"'));
    } else {
      console.log(chalk.red('\n❌ Some systems failed verification. Please check the errors above.'));
    }
    
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error(chalk.red('\n💥 Verification script error:'), error.message);
    process.exit(1);
  }
}

// Run the verification
runVerification();