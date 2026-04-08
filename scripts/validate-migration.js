#!/usr/bin/env node
/**
 * Migration Validator
 * Comprehensive validation after all migrations complete
 * Run this to verify Diamond State integrity
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║         DIAMOND STATE MIGRATION VALIDATOR                    ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const results = { pass: 0, fail: 0, warnings: 0 };

function check(name, condition, warning = false) {
  if (condition) {
    console.log(`✅ ${name}`);
    results.pass++;
  } else if (warning) {
    console.log(`⚠️  ${name}`);
    results.warnings++;
  } else {
    console.log(`❌ ${name}`);
    results.fail++;
  }
}

// 1. Check all 6 pillars exist
console.log('💎 CHECKING 6 PILLARS');
console.log('────────────────────────────────────────');
check('Foundation: DI tokens exist', existsSync(join(rootDir, 'src/core/di/tokens.ts')));
check('Foundation: DI container exists', existsSync(join(rootDir, 'src/core/di/container.ts')));
check('Intelligence: Semantic router exists', existsSync(join(rootDir, 'src/core/routing/semantic-router.ts')));
check('Intelligence: Agent profiles exist', existsSync(join(rootDir, 'src/core/routing/agent-profiles.ts')));
check('Safety: IsolatedVM sandbox exists', existsSync(join(rootDir, 'src/core/sandbox/isolated-vm-sandbox.ts')));
check('Safety: Virtual FS exists', existsSync(join(rootDir, 'src/core/sandbox/virtual-fs.ts')));
check('Autonomy: Alert manager exists', existsSync(join(rootDir, 'src/core/monitoring/alert-manager.ts')));
check('Autonomy: Site reliability agent exists', existsSync(join(rootDir, 'src/core/reliability/site-reliability-agent.ts')));
check('Observability: Telemetry service exists', existsSync(join(rootDir, 'src/core/telemetry/telemetry-service.ts')));
check('Scale: Distributed mesh exists', existsSync(join(rootDir, 'src/core/mesh/distributed-mesh.ts')));
check('Scale: Streaming service exists', existsSync(join(rootDir, 'src/core/streaming/agent-stream.ts')));
check('Scale: App store exists', existsSync(join(rootDir, 'src/core/mcp/app-store.ts')));

// 2. Check interfaces
console.log('\n📋 CHECKING INTERFACES');
console.log('────────────────────────────────────────');
const interfaces = [
  'IAgentOrchestrator', 'IExecutionEngine', 'ITelemetryService',
  'IMemoryManager', 'IAIMetaLayer', 'IAgentRegistry'
];
const interfacesContent = readFileSync(join(rootDir, 'src/core/interfaces/index.ts'), 'utf-8');
for (const iface of interfaces) {
  check(`Interface: ${iface}`, interfacesContent.includes(iface));
}

// 3. Check DI tokens
console.log('\n🔑 CHECKING DI TOKENS');
console.log('────────────────────────────────────────');
const tokensContent = readFileSync(join(rootDir, 'src/core/di/tokens.ts'), 'utf-8');
const expectedTokens = [
  'AgentOrchestrator', 'ExecutionEngine', 'MemoryManager',
  'AIMetaLayer', 'AgentRegistry', 'SemanticRouter'
];
for (const token of expectedTokens) {
  check(`Token: ${token}`, tokensContent.includes(token));
}

// 4. Check exports
console.log('\n📦 CHECKING EXPORTS');
console.log('────────────────────────────────────────');
const indexContent = readFileSync(join(rootDir, 'src/core/index.ts'), 'utf-8');
check('Main export: initializeDiamondState', indexContent.includes('initializeDiamondState'));
check('Export: container', indexContent.includes('container'));
check('Export: DI_TOKENS', indexContent.includes('DI_TOKENS'));
check('Export: SemanticRouter', indexContent.includes('SemanticRouter'));
check('Export: AlertManager', indexContent.includes('AlertManager'));

// 5. Check legacy bridge
console.log('\n🌉 CHECKING LEGACY BRIDGE');
console.log('────────────────────────────────────────');
check('Legacy bridge exists', existsSync(join(rootDir, 'src/core/integration/legacy-bridge.ts')));

// 6. Check documentation
console.log('\n📚 CHECKING DOCUMENTATION');
console.log('────────────────────────────────────────');
check('Diamond State docs exist', existsSync(join(rootDir, 'docs/DIAMOND_STATE.md')));
check('Completion report exists', existsSync(join(rootDir, 'DIAMOND_STATE_COMPLETION_REPORT.md')));

// 7. Count files
console.log('\n📊 FILE STATISTICS');
console.log('────────────────────────────────────────');
const tsFiles = readdirSync(join(rootDir, 'src/core'), { recursive: true })
  .filter(f => f.endsWith('.ts') && !f.includes('node_modules')).length;
const jsFiles = readdirSync(join(rootDir, 'src/core'), { recursive: true })
  .filter(f => f.endsWith('.js') && !f.includes('node_modules') && !f.includes('.test.')).length;

console.log(`TypeScript files: ${tsFiles}`);
console.log(`JavaScript files: ${jsFiles}`);
console.log(`Progress: ${Math.round((tsFiles / (tsFiles + jsFiles)) * 100)}%`);

// Summary
console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║                      VALIDATION SUMMARY                      ║');
console.log('╠══════════════════════════════════════════════════════════════╣');
console.log(`║ ✅ Passed:   ${results.pass.toString().padEnd(45)} ║`);
console.log(`║ ⚠️  Warnings: ${results.warnings.toString().padEnd(45)} ║`);
console.log(`║ ❌ Failed:   ${results.fail.toString().padEnd(45)} ║`);
console.log('╚══════════════════════════════════════════════════════════════╝');

if (results.fail === 0) {
  console.log('\n🎉 All validation checks passed!\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${results.fail} validation checks failed\n`);
  process.exit(1);
}
