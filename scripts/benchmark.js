import { spawn } from 'child_process';
import { performance } from 'perf_hooks';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CLI_ENTRY = path.join(ROOT_DIR, 'apps', 'cli', 'bin', 'ultra-dex.js');

const scenarios = [
  { name: 'version', args: ['--version'] },
  { name: 'help-root', args: ['--help'] },
  { name: 'agents-list-help', args: ['agents', 'list', '--help'] },
  { name: 'status-help', args: ['status', '--help'] },
];

function runScenario({ name, args }) {
  return new Promise((resolve) => {
    const start = performance.now();
    const child = spawn(process.execPath, [CLI_ENTRY, ...args], {
      cwd: ROOT_DIR,
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'test' },
      stdio: 'ignore',
    });

    child.on('exit', (code) => {
      const durationMs = performance.now() - start;
      resolve({ name, args, code, durationMs });
    });

    child.on('error', (error) => {
      const durationMs = performance.now() - start;
      resolve({ name, args, code: -1, durationMs, error });
    });
  });
}

async function main() {
  console.log('⚙️  Running Ultra-Dex CLI micro-benchmarks...\n');
  const results = [];

  for (const scenario of scenarios) {
    // Run each scenario a few times to smooth out noise
    const runs = [];
    for (let i = 0; i < 3; i++) {
      runs.push(await runScenario(scenario));
    }

    const successfulRuns = runs.filter((r) => r.code === 0);
    const avg =
      successfulRuns.reduce((sum, r) => sum + r.durationMs, 0) / (successfulRuns.length || 1);

    results.push({
      name: scenario.name,
      avgMs: Math.round(avg),
      runs,
    });
  }

  console.log('📊 Benchmark summary (wall-clock, ms):\n');
  for (const r of results) {
    console.log(`  - ${r.name.padEnd(16)} ${String(r.avgMs).padStart(5)} ms`);
  }

  const failures = results.flatMap((r) => r.runs).filter((r) => r.code !== 0);
  if (failures.length > 0) {
    console.error('\n❌ Some benchmark runs failed:');
    for (const f of failures) {
      console.error(
        `  - ${f.name} ${f.args.join(' ')} (exit ${f.code}, ${Math.round(f.durationMs)} ms)`
      );
      if (f.error) {
        console.error(`    Error: ${f.error.message}`);
      }
    }
    process.exitCode = 1;
  } else {
    console.log('\n✅ All benchmark runs completed successfully.');
  }
}

main().catch((error) => {
  console.error('❌ Benchmark script failed:', error);
  process.exitCode = 1;
});
