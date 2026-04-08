#!/usr/bin/env -S node --import=tsx

import 'reflect-metadata';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..', '..');
const envLocalPath = path.join(projectRoot, '.env.local');
const envPath = path.join(projectRoot, '.env');

const dotenv = require('dotenv');
const shouldLoadDotenv =
  process.env.ULTRA_DEX_LOAD_DOTENV === '1' || process.env.NODE_ENV !== 'test';
if (shouldLoadDotenv) {
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath, override: true });
  } else {
    dotenv.config({ path: envPath, override: true });
  }
}

const args = process.argv.slice(2);
const versionFlags = new Set(['-V', '--version']);
const helpFlags = new Set(['-h', '--help']);
const fastCommandSet = new Set([
  'run',
  'swarm',
  'distributed',
  'config',
  'doctor',
  'quality',
  'mcp-remote',
  'mcp',
]);

const wantsVersion = args.length > 0 && args.every((arg) => versionFlags.has(arg));
const wantsTopLevelHelp =
  args.length === 0 || (args.length === 1 && args.every((arg) => helpFlags.has(arg)));

if (wantsVersion) {
  const { VERSION } = await import('../lib/utils/version.js');
  console.log(VERSION);
  process.exit(0);
}

if (wantsTopLevelHelp || (args.length > 0 && fastCommandSet.has(args[0]))) {
  const [{ Command }, { VERSION }] = await Promise.all([
    import('commander'),
    import('../lib/utils/version.js'),
  ]);

  const program = new Command();
  program
    .name('ultra-dex')
    .description('AI Orchestration Meta-Layer for SaaS Development')
    .version(VERSION);

  const registerRunBundle = async () => {
    const runCommands = await import('../lib/commands/run.js');
    runCommands.registerRunCommand(program);
    runCommands.registerSwarmCommand(program);
    runCommands.registerDistributedCommand(program);
  };

  if (wantsTopLevelHelp) {
    await Promise.all([
      registerRunBundle(),
      import('../lib/commands/config.js').then(({ registerConfigCommand }) =>
        registerConfigCommand(program)
      ),
      import('../lib/commands/doctor.js').then(({ registerDoctorCommand }) =>
        registerDoctorCommand(program)
      ),
      import('../lib/commands/quality.js').then(({ registerQualityCommand }) =>
        registerQualityCommand(program)
      ),
      import('../lib/commands/mcp-remote.js').then(({ registerMcpRemoteCommand }) =>
        registerMcpRemoteCommand(program)
      ),
      import('../lib/commands/mcp.js').then(({ registerMcpCommand }) =>
        registerMcpCommand(program)
      ),
    ]);
  } else if (new Set(['run', 'swarm', 'distributed']).has(args[0])) {
    await registerRunBundle();
  } else if (args[0] === 'config') {
    const { registerConfigCommand } = await import('../lib/commands/config.js');
    registerConfigCommand(program);
  } else if (args[0] === 'doctor') {
    const { registerDoctorCommand } = await import('../lib/commands/doctor.js');
    registerDoctorCommand(program);
  } else if (args[0] === 'quality') {
    const { registerQualityCommand } = await import('../lib/commands/quality.js');
    registerQualityCommand(program);
  } else if (args[0] === 'mcp-remote') {
    const { registerMcpRemoteCommand } = await import('../lib/commands/mcp-remote.js');
    registerMcpRemoteCommand(program);
  } else if (args[0] === 'mcp') {
    const { registerMcpCommand } = await import('../lib/commands/mcp.js');
    registerMcpCommand(program);
  }

  const argv = wantsTopLevelHelp && args.length === 0 ? [...process.argv, '--help'] : process.argv;
  await program.parseAsync(argv);
  process.exit(process.exitCode ?? 0);
}

await import('./ultra-dex-full.js');
