// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import inquirer from 'inquirer';
import { spawnSync } from 'child_process';
import chalk from 'chalk';
import { printError, printInfo, printSuccess } from '../utils/output.js';

const REGISTRY_PATH = path.join(os.homedir(), '.ultra-dex', 'marketplace.json');
const PLUGIN_DIR = path.join(os.homedir(), '.ultra-dex', 'plugins');

const MARKETPLACE_SEED = [
  {
    name: '@ultra-dex/github',
    description: 'GitHub PR and issue workflows',
    downloads: 13240,
    rating: 4.8,
    version: '1.2.0',
    category: 'integration',
    author: 'ultra-dex',
    dependencies: [],
    installCount: 8810,
    publishedAt: '2026-04-01',
  },
  {
    name: '@ultra-dex/testing',
    description: 'Test generation and coverage automation',
    downloads: 8750,
    rating: 4.6,
    version: '1.1.3',
    category: 'quality',
    author: 'ultra-dex',
    dependencies: [],
    installCount: 5221,
    publishedAt: '2026-04-03',
  },
];

async function ensureMarketplaceStore() {
  await fs.mkdir(path.dirname(REGISTRY_PATH), { recursive: true });
  try {
    await fs.access(REGISTRY_PATH);
  } catch {
    await fs.writeFile(REGISTRY_PATH, JSON.stringify(MARKETPLACE_SEED, null, 2), 'utf8');
  }
}

async function readMarketplace() {
  await ensureMarketplaceStore();
  const raw = await fs.readFile(REGISTRY_PATH, 'utf8');
  return JSON.parse(raw);
}

async function writeMarketplace(data) {
  await ensureMarketplaceStore();
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function sortEntries(entries, sortBy) {
  const key = sortBy || 'downloads';
  const copy = [...entries];
  if (key === 'rating') return copy.sort((a, b) => b.rating - a.rating);
  if (key === 'recent') return copy.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
  return copy.sort((a, b) => b.downloads - a.downloads);
}

function renderTable(entries) {
  printInfo(chalk.bold('Name                          Description                         Downloads  Rating  Version'));
  printInfo('------------------------------------------------------------------------------------------------');
  for (const entry of entries) {
    const name = entry.name.padEnd(30).slice(0, 30);
    const description = entry.description.padEnd(35).slice(0, 35);
    const downloads = String(entry.downloads).padStart(9);
    const rating = String(entry.rating.toFixed(1)).padStart(6);
    printInfo(`${name} ${description} ${downloads} ${rating}  ${entry.version}`);
  }
}

async function installPackage(name, version) {
  await fs.mkdir(PLUGIN_DIR, { recursive: true });
  const pkg = version ? `${name}@${version}` : name;
  const result = spawnSync('npm', ['install', pkg, '--prefix', PLUGIN_DIR, '--no-save'], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'Install failed');
  }
}

export function registerMarketplaceCommand(program) {
  const marketplace = program.command('marketplace').description('Plugin marketplace commands');

  marketplace
    .command('search <query>')
    .option('--category <category>', 'Filter by category')
    .option('--sort <sort>', 'Sort: downloads|rating|recent', 'downloads')
    .description('Search marketplace plugins')
    .action(async (query, options) => {
      try {
        const all = await readMarketplace();
        const filtered = all.filter((entry) => {
          const matchesQuery =
            entry.name.toLowerCase().includes(query.toLowerCase()) ||
            entry.description.toLowerCase().includes(query.toLowerCase());
          const matchesCategory = !options.category || entry.category === options.category;
          return matchesQuery && matchesCategory;
        });
        renderTable(sortEntries(filtered, options.sort));
      } catch (error) {
        printError(`Marketplace search failed: ${error.message}`, error);
        process.exitCode = 1;
      }
    });

  marketplace
    .command('install <name>')
    .option('--version <version>', 'Specific version')
    .description('Install package from marketplace')
    .action(async (name, options) => {
      try {
        await installPackage(name, options.version);
        printSuccess(`Installed ${name}${options.version ? `@${options.version}` : ''}`);
      } catch (error) {
        printError(`Marketplace install failed: ${error.message}`, error);
        process.exitCode = 1;
      }
    });

  marketplace
    .command('uninstall <name>')
    .description('Uninstall marketplace package')
    .action(async (name) => {
      try {
        const answer = await inquirer.prompt([
          { type: 'confirm', name: 'confirm', message: `Uninstall ${name}?`, default: false },
        ]);
        if (!answer.confirm) {
          printInfo('Uninstall cancelled');
          return;
        }
        const result = spawnSync('npm', ['uninstall', name, '--prefix', PLUGIN_DIR, '--no-save'], {
          encoding: 'utf8',
        });
        if (result.status !== 0) {
          throw new Error(result.stderr || result.stdout || 'Uninstall failed');
        }
        printSuccess(`Uninstalled ${name}`);
      } catch (error) {
        printError(`Marketplace uninstall failed: ${error.message}`, error);
        process.exitCode = 1;
      }
    });

  marketplace
    .command('publish <dir>')
    .description('Publish local package to marketplace registry')
    .action(async (dir) => {
      try {
        if (!process.env.ULTRA_DEX_MARKETPLACE_TOKEN) {
          throw new Error('ULTRA_DEX_MARKETPLACE_TOKEN is required');
        }
        const answer = await inquirer.prompt([
          { type: 'confirm', name: 'confirm', message: `Publish package from ${dir}?`, default: false },
        ]);
        if (!answer.confirm) {
          printInfo('Publish cancelled');
          return;
        }

        const pkgPath = path.join(path.resolve(dir), 'package.json');
        const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
        if (!pkg.name || !pkg.version) {
          throw new Error('Manifest validation failed: name and version required');
        }

        const pack = spawnSync('npm', ['pack'], { cwd: path.resolve(dir), encoding: 'utf8' });
        if (pack.status !== 0) {
          throw new Error(pack.stderr || pack.stdout || 'npm pack failed');
        }

        const market = await readMarketplace();
        const next = market.filter((entry) => entry.name !== pkg.name);
        next.push({
          name: pkg.name,
          description: pkg.description || 'No description',
          downloads: 0,
          rating: 0,
          version: pkg.version,
          category: pkg.category || 'custom',
          author: pkg.author || 'unknown',
          dependencies: Object.keys(pkg.dependencies || {}),
          installCount: 0,
          publishedAt: new Date().toISOString(),
        });
        await writeMarketplace(next);
        printSuccess(`Published ${pkg.name}@${pkg.version}`);
      } catch (error) {
        printError(`Marketplace publish failed: ${error.message}`, error);
        process.exitCode = 1;
      }
    });

  marketplace
    .command('rate <name>')
    .requiredOption('--stars <stars>', 'Stars 1-5')
    .option('--review <text>', 'Optional review')
    .description('Rate marketplace package')
    .action(async (name, options) => {
      try {
        const stars = Number(options.stars);
        if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
          throw new Error('stars must be an integer 1-5');
        }
        const market = await readMarketplace();
        const target = market.find((entry) => entry.name === name);
        if (!target) throw new Error(`Package "${name}" not found`);
        target.rating = Number(((target.rating + stars) / 2).toFixed(1));
        await writeMarketplace(market);
        printSuccess(`Rated ${name} with ${stars} star(s)`);
        if (options.review) printInfo(`Review: ${options.review}`);
      } catch (error) {
        printError(`Marketplace rating failed: ${error.message}`, error);
        process.exitCode = 1;
      }
    });

  marketplace
    .command('info <name>')
    .description('Show package details')
    .action(async (name) => {
      try {
        const market = await readMarketplace();
        const target = market.find((entry) => entry.name === name);
        if (!target) throw new Error(`Package "${name}" not found`);
        printInfo(JSON.stringify(target, null, 2));
      } catch (error) {
        printError(`Marketplace info failed: ${error.message}`, error);
        process.exitCode = 1;
      }
    });

  marketplace
    .command('update [name]')
    .option('--all', 'Update all installed marketplace packages')
    .description('Update one package or all installed packages')
    .action(async (name, options) => {
      try {
        const args = options.all ? ['update', '--prefix', PLUGIN_DIR] : ['update', name, '--prefix', PLUGIN_DIR];
        const result = spawnSync('npm', args, { encoding: 'utf8' });
        if (result.status !== 0) {
          throw new Error(result.stderr || result.stdout || 'Update failed');
        }
        printSuccess(options.all ? 'Updated all marketplace packages' : `Updated ${name}`);
      } catch (error) {
        printError(`Marketplace update failed: ${error.message}`, error);
        process.exitCode = 1;
      }
    });
}

export default registerMarketplaceCommand;

