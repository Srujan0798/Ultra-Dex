/**
 * Ultra-Dex Module Health Check
 * Tests that every core module can be loaded without errors
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const mods = [
  ['config-validator', 'src/core/system/config-validator.js'],
  ['health-monitor', 'src/core/system/health-monitor.js'],
  ['agent-autopsy', 'src/core/reliability/agent-autopsy.js'],
  ['circuit-breaker', 'src/core/reliability/circuit-breaker.js'],
  ['provider-fallback', 'src/core/reliability/provider-fallback.js'],
  ['queue-processor', 'src/core/queue/queue-processor.js'],
  ['health-service', 'src/core/system/health-service.js'],
  ['health-checker', 'src/core/system/health-checker.js'],
  ['config-manager', 'src/core/system/config-manager.js'],
  ['error-handler', 'src/core/utils/error-handler.js'],
  ['error-translator', 'src/core/utils/error-translator.js'],
  ['audit-logger', 'src/core/audit/audit-logger.js'],
  ['rbac', 'src/core/auth/rbac.js'],
  ['rbac-manager', 'src/core/auth/rbac-manager.js'],
  ['sso', 'src/core/auth/sso.js'],
  ['token-guard', 'src/core/optimization/token-guard.js'],
  ['trace-collector', 'src/core/observability/trace-collector.js'],
  ['chaos-engine', 'src/core/chaos/chaos-engine.js'],
  ['webhook-manager', 'src/core/webhooks/webhook-manager.js'],
  ['rate-limiter', 'src/core/rate-limiting/rate-limiter.js'],
  ['streaming-pipeline', 'src/core/streaming/pipeline.js'],
  ['plugin-lifecycle', 'src/core/plugins/lifecycle-manager.js'],
  ['governance-manager', 'src/core/governance/governance-manager.js'],
  ['multi-tenancy', 'src/core/enterprise/multi-tenancy.js'],
  ['agent-mesh', 'src/core/coordination/agent-mesh.js'],
  ['memory-manager', 'src/core/memory/manager.js'],
  ['memory-index', 'src/core/memory/index.js'],
  ['agents-index', 'src/platform/cli/agents/index.js'],
  ['orchestration-index', 'src/core/orchestration/index.js'],
];

const results = { pass: 0, fail: 0, missing: 0, errors: [] };

async function run() {
  for (const [name, modPath] of mods) {
    const fullPath = path.join(process.cwd(), modPath);
    if (!fs.existsSync(fullPath)) {
      console.log('  MISS:', name, '(' + modPath + ')');
      results.missing++;
      continue;
    }
    try {
      await import(pathToFileURL(fullPath).href);
      console.log('  PASS:', name);
      results.pass++;
    } catch (e) {
      const msg = e.message.split('\n')[0].substring(0, 80);
      console.log('  FAIL:', name, '-', msg);
      results.fail++;
      results.errors.push({ name, modPath, error: msg });
    }
  }

  console.log('\n=== RESULTS ===');
  console.log(results.pass + ' pass / ' + results.fail + ' fail / ' + results.missing + ' missing');

  if (results.errors.length > 0) {
    console.log('\n=== ERRORS ===');
    for (const err of results.errors) {
      console.log(err.name + ': ' + err.error);
    }
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
