import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CLI_ENTRY = path.join(ROOT_DIR, 'apps', 'cli', 'bin', 'ultra-dex.js');

const WARMUP_RUNS = 2;
const PROFILE_RUNS = 5;

function runOnce(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [CLI_ENTRY, ...args], {
      cwd: ROOT_DIR,
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'test' },
      stdio: 'ignore',
    });

    child.on('exit', (code) => {
      resolve(code);
    });

    child.on('error', () => {
      resolve(-1);
    });
  });
}

async function main() {
  const args = ['status', '--help'];

  console.log('🔥 Warming up Ultra-Dex CLI for profiling...');
  for (let i = 0; i < WARMUP_RUNS; i++) {
     
    await runOnce(args);
  }

  console.log('🧪 Running profiled scenarios...');
  for (let i = 0; i < PROFILE_RUNS; i++) {
     
    const code = await runOnce(args);
    if (code !== 0) {
      console.error(`Run ${i + 1} exited with code ${code}`);
      process.exitCode = 1;
    }
  }

  console.log(
    '\n✅ Profiling workload complete. Inspect the generated V8 log via `node --prof-process`.',
  );
}

main().catch((error) => {
  console.error('❌ Profile script failed:', error);
  process.exitCode = 1;
});

