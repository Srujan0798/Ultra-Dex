// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';
import chalk from 'chalk';
import { printError, printInfo, printSuccess } from '../utils/output.js';
import { attachPluginCreateCommands } from './plugin-create.js';

const GLOBAL_PLUGIN_DIR = path.join(os.homedir(), '.ultra-dex', 'plugins');
const DEV_PLUGIN_DIR = path.join(process.cwd(), '.ultra-dex', 'plugins');
const REGISTRY_FILE = 'plugins.json';

function resolveInstallTarget(options = {}) {
  if (options.global && options.dev) {
    throw new Error('Use either --global or --dev, not both');
  }
  if (options.global) return { scope: 'global', dir: GLOBAL_PLUGIN_DIR };
  return { scope: 'dev', dir: DEV_PLUGIN_DIR };
}

async function ensureInstallDir(installDir) {
  await fs.mkdir(installDir, { recursive: true });
  const packageJsonPath = path.join(installDir, 'package.json');
  try {
    await fs.access(packageJsonPath);
  } catch {
    const pkg = { name: 'ultra-dex-plugin-host', private: true, version: '1.0.0' };
    await fs.writeFile(packageJsonPath, JSON.stringify(pkg, null, 2), 'utf8');
  }
}

async function readRegistry(installDir) {
  const registryPath = path.join(installDir, REGISTRY_FILE);
  try {
    const raw = await fs.readFile(registryPath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeRegistry(installDir, entries) {
  const registryPath = path.join(installDir, REGISTRY_FILE);
  await fs.writeFile(registryPath, JSON.stringify(entries, null, 2), 'utf8');
}

async function pathExists(inputPath) {
  try {
    await fs.access(inputPath);
    return true;
  } catch {
    return false;
  }
}

async function inferPluginName(source) {
  const sourcePath = path.resolve(source);
  if (await pathExists(sourcePath)) {
    try {
      const pkg = JSON.parse(await fs.readFile(path.join(sourcePath, 'package.json'), 'utf8'));
      if (pkg.name) return pkg.name;
    } catch {
      // Fall through to basename-derived name.
    }
    return path.basename(sourcePath);
  }

  if (source.startsWith('git+')) {
    const clean = source.replace(/^git\+/, '').replace(/\.git$/, '');
    return clean.split('/').pop() || source;
  }

  if (source.includes('github.com')) {
    const clean = source.replace(/\.git$/, '').replace(/\/+$/, '');
    return clean.split('/').pop() || source;
  }

  if (source.startsWith('@')) {
    const versionSep = source.indexOf('@', 1);
    return versionSep > -1 ? source.slice(0, versionSep) : source;
  }

  const versionSep = source.indexOf('@');
  return versionSep > -1 ? source.slice(0, versionSep) : source;
}

function runNpm(args, cwd) {
  const result = spawnSync('npm', args, {
    cwd,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `npm ${args.join(' ')} failed`);
  }
}

async function installPlugin(source, options = {}) {
  const target = resolveInstallTarget(options);
  await ensureInstallDir(target.dir);

  const pluginName = await inferPluginName(source);
  runNpm(['install', source, '--no-save'], target.dir);

  const registry = await readRegistry(target.dir);
  const next = registry.filter((entry) => entry.name !== pluginName);
  next.push({
    name: pluginName,
    source,
    scope: target.scope,
    installedAt: new Date().toISOString(),
  });
  await writeRegistry(target.dir, next);

  printSuccess(`Installed plugin "${pluginName}" (${target.scope})`);
}

async function uninstallPlugin(name, options = {}) {
  const target = resolveInstallTarget(options);
  await ensureInstallDir(target.dir);

  runNpm(['uninstall', name, '--no-save'], target.dir);

  const registry = await readRegistry(target.dir);
  const filtered = registry.filter((entry) => entry.name !== name);
  await writeRegistry(target.dir, filtered);
  printSuccess(`Uninstalled plugin "${name}" (${target.scope})`);
}

async function collectRegistryEntries() {
  const [globalEntries, devEntries] = await Promise.all([
    readRegistry(GLOBAL_PLUGIN_DIR),
    readRegistry(DEV_PLUGIN_DIR),
  ]);
  return [...devEntries, ...globalEntries];
}

async function listPlugins(options = {}) {
  const entries = await collectRegistryEntries();
  if (options.json) {
    process.stdout.write(`${JSON.stringify(entries, null, 2)}\n`);
    return;
  }

  if (entries.length === 0) {
    printInfo('No plugins installed');
    return;
  }

  for (const plugin of entries) {
    printInfo(`${plugin.name} (${plugin.scope}) - ${plugin.source}`);
  }
}

async function infoPlugin(name) {
  const entries = await collectRegistryEntries();
  const plugin = entries.find((entry) => entry.name === name);
  if (!plugin) {
    throw new Error(`Plugin "${name}" not found`);
  }
  process.stdout.write(`${JSON.stringify(plugin, null, 2)}\n`);
}

async function updatePlugins(name, options = {}) {
  const entries = await collectRegistryEntries();
  const targetEntries = options.all ? entries : entries.filter((entry) => entry.name === name);
  if (targetEntries.length === 0) {
    throw new Error('No matching plugins found for update');
  }

  for (const entry of targetEntries) {
    const installDir = entry.scope === 'global' ? GLOBAL_PLUGIN_DIR : DEV_PLUGIN_DIR;
    await ensureInstallDir(installDir);
    runNpm(['update', entry.name], installDir);
  }
  printSuccess(`Updated ${targetEntries.length} plugin(s)`);
}

export function registerPluginCommand(program) {
  const plugin = program.command('plugin').description('Manage Ultra-Dex plugins');

  plugin
    .command('install <source>')
    .description('Install plugin from npm package, git URL, or local path')
    .option('--global', 'Install to ~/.ultra-dex/plugins/')
    .option('--dev', 'Install to ./.ultra-dex/plugins/')
    .action(async (source, options) => {
      try {
        await installPlugin(source, options);
      } catch (error) {
        printError(chalk.red(`Plugin install failed: ${error.message}`), error);
        process.exitCode = 1;
      }
    });

  plugin
    .command('uninstall <name>')
    .description('Uninstall plugin by name')
    .option('--global', 'Uninstall from ~/.ultra-dex/plugins/')
    .option('--dev', 'Uninstall from ./.ultra-dex/plugins/')
    .action(async (name, options) => {
      try {
        await uninstallPlugin(name, options);
      } catch (error) {
        printError(chalk.red(`Plugin uninstall failed: ${error.message}`), error);
        process.exitCode = 1;
      }
    });

  plugin
    .command('list')
    .description('List installed plugins')
    .option('--json', 'Output JSON')
    .action(async (options) => {
      try {
        await listPlugins(options);
      } catch (error) {
        printError(chalk.red(`Plugin list failed: ${error.message}`), error);
        process.exitCode = 1;
      }
    });

  plugin
    .command('info <name>')
    .description('Show plugin metadata')
    .action(async (name) => {
      try {
        await infoPlugin(name);
      } catch (error) {
        printError(chalk.red(`Plugin info failed: ${error.message}`), error);
        process.exitCode = 1;
      }
    });

  plugin
    .command('update [name]')
    .description('Update plugin by name or all plugins with --all')
    .option('--all', 'Update all installed plugins')
    .action(async (name, options) => {
      try {
        await updatePlugins(name, options);
      } catch (error) {
        printError(chalk.red(`Plugin update failed: ${error.message}`), error);
        process.exitCode = 1;
      }
    });

  attachPluginCreateCommands(plugin);
}

