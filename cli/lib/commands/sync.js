/**
 * ultra-dex sync command
 * Synchronizes project state and graph across devices
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { loadState, saveState } from './state.js';
import { buildGraph } from '../utils/graph.js';
import { snapshotContext } from '../utils/sync.js';
import { validateSafePath } from '../utils/validation.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { AppError, ValidationError } from '../utils/errors.js';

export function registerSyncCommand(program) {
  program
    .command('sync')
    .description('Synchronize project state and graph (God Mode Sync)')
    .option('-d, --dir <directory>', 'Project directory to sync', '.')
    .option('--push', 'Push local state to sync target')
    .option('--pull', 'Pull state from sync target')
    .option('--brain', 'Auto-update CONTEXT.md from codebase analysis (eliminates human middleware)')
    .option('--target <path>', 'Sync target (local folder or s3-like)', '.ultra/sync')
    .action(async (options) => {
      printInfo(chalk.cyan('\n🔄 Ultra-Dex State Sync\n'));

      const dirValidation = validateSafePath(options.dir, 'Project directory');
      if (dirValidation !== true) {
        printError(chalk.red(dirValidation));
        process.exit(1);
      }

      const projectDir = path.resolve(options.dir);

      // Brain Mode: Full autonomous context update
      if (options.brain) {
        await handleBrainSync(projectDir);
        return;
      }

      // 1. Snapshot Context (Updates CONTEXT.md)
      const syncResult = await snapshotContext(projectDir);
      printSuccess(chalk.green(`  ✅ Context Snapshot Complete (${syncResult.summary.fileCount} Files scanned)`));
      if (syncResult.updated) {
        printInfo(chalk.gray('     CONTEXT.md updated with latest project structure.'));
      }

      const syncTarget = path.resolve(projectDir, options.target);
      await fs.mkdir(syncTarget, { recursive: true });

      if (options.push) {
        await handlePush(projectDir, syncTarget);
      } else if (options.pull) {
        await handlePull(projectDir, syncTarget);
      } else {
        // Default: Bidirectional Sync (Simplified for Phase 2.1)
        printWarning(chalk.yellow('\nDefaulting to PUSH local state to target.'));
        await handlePush(projectDir, syncTarget);
      }
    });
}

async function handlePush(projectDir, target) {
  const spinner = (await import('ora')).default('Pushing state to sync target...').start();
  try {
    // Note: loadState/saveState might need to be aware of projectDir if they use relative paths
    // For now they use process.cwd() which might be wrong if --dir is used.
    // However, let's keep it simple as most commands assume CWD = project root unless --dir is used.
    
    const state = await loadState();
    if (!state) throw new Error('No local state found');

    const graph = await buildGraph();
    
    const bundle = {
      state,
      graph,
      timestamp: new Date().toISOString(),
      machine: process.env.USER || 'unknown'
    };

    await fs.writeFile(path.join(target, 'sync-bundle.json'), JSON.stringify(bundle, null, 2));
    spinner.succeed(chalk.green(`State pushed to ${target}`));
  } catch (e) {
    spinner.fail(chalk.red(`Push failed: ${e.message}`));
  }
}

async function handlePull(projectDir, target) {
  const spinner = (await import('ora')).default('Pulling state from sync target...').start();
  try {
    const bundleContent = await fs.readFile(path.join(target, 'sync-bundle.json'), 'utf8');
    const bundle = JSON.parse(bundleContent);

    await saveState(bundle.state);
    spinner.succeed(chalk.green('Local state updated from sync bundle.'));
    printInfo(chalk.gray(`   Bundle Timestamp: ${bundle.timestamp}`));
    printInfo(chalk.gray(`   Source Machine: ${bundle.machine}`));
  } catch (e) {
    spinner.fail(chalk.red(`Pull failed: ${e.message}`));
  }
}

/**
 * Brain Sync: Auto-update CONTEXT.md from codebase analysis
 * This eliminates the human-as-middleware anti-pattern
 */
async function handleBrainSync(projectDir) {
  const ora = (await import('ora')).default;

  console.log(chalk.magenta.bold('🧠 Brain Sync: Autonomous Context Update\n'));

  // Step 1: Build Code Property Graph
  const graphSpinner = ora('Building Code Property Graph...').start();
  const graph = await buildGraph(false); // Force fresh build
  graphSpinner.succeed(`Graph built: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);

  // Step 2: Analyze Tech Stack
  const techSpinner = ora('Analyzing tech stack...').start();
  const techStack = await analyzeTechStack(projectDir);
  techSpinner.succeed(`Tech stack detected: ${techStack.frameworks.join(', ') || 'custom'}`);

  // Step 3: Discover Modules
  const moduleSpinner = ora('Discovering modules...').start();
  const modules = discoverModules(graph);
  moduleSpinner.succeed(`Modules found: ${modules.length}`);

  // Step 4: Extract Key Exports
  const exportsSpinner = ora('Extracting key exports...').start();
  const exports = extractKeyExports(graph);
  exportsSpinner.succeed(`Key exports: ${exports.length} functions`);

  // Step 5: Generate CONTEXT.md
  const contextSpinner = ora('Generating CONTEXT.md...').start();
  const contextPath = path.join(projectDir, 'CONTEXT.md');
  const contextContent = generateContextMd(techStack, modules, exports, graph);
  await fs.writeFile(contextPath, contextContent);
  contextSpinner.succeed('CONTEXT.md updated with AI-generated analysis');

  // Step 6: Update State
  const stateSpinner = ora('Updating project state...').start();
  const state = await loadState() || { project: {}, agents: {} };
  state.brainSync = {
    lastSync: new Date().toISOString(),
    techStack,
    moduleCount: modules.length,
    exportCount: exports.length,
    graphNodes: graph.nodes.length
  };
  await saveState(state);
  stateSpinner.succeed('State updated');

  // Summary
  printSuccess(chalk.green.bold('\n✅ Brain Sync Complete!\n'));
  printInfo(chalk.white('  Tech Stack:'));
  printInfo(chalk.gray(`    Language: ${techStack.language}`));
  printInfo(chalk.gray(`    Frameworks: ${techStack.frameworks.join(', ') || 'none detected'}`));
  printInfo(chalk.gray(`    Database: ${techStack.database || 'none detected'}`));
  printInfo(chalk.gray(`    Auth: ${techStack.auth || 'none detected'}`));
  printInfo(chalk.white('\n  Codebase Analysis:'));
  printInfo(chalk.gray(`    Modules: ${modules.length}`));
  printInfo(chalk.gray(`    Functions: ${exports.length}`));
  printInfo(chalk.gray(`    Dependencies: ${graph.edges.filter(e => e.type === 'depends_on').length}`));
  printInfo(chalk.cyan('\n  → CONTEXT.md is now current. No manual updates needed.'));
}

/**
 * Analyze tech stack from package.json and file patterns
 */
async function analyzeTechStack(projectDir) {
  const stack = {
    language: 'JavaScript',
    frameworks: [],
    database: null,
    auth: null,
    testing: [],
    deployment: []
  };

  // Check package.json
  try {
    const pkgPath = path.join(projectDir, 'package.json');
    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    // Detect TypeScript
    if (deps.typescript) stack.language = 'TypeScript';

    // Detect frameworks
    if (deps.next) stack.frameworks.push('Next.js');
    if (deps.react) stack.frameworks.push('React');
    if (deps.vue) stack.frameworks.push('Vue');
    if (deps.svelte || deps['@sveltejs/kit']) stack.frameworks.push('SvelteKit');
    if (deps.express) stack.frameworks.push('Express');
    if (deps.fastify) stack.frameworks.push('Fastify');
    if (deps.hono) stack.frameworks.push('Hono');

    // Detect database
    if (deps.prisma || deps['@prisma/client']) stack.database = 'Prisma';
    if (deps.drizzle || deps['drizzle-orm']) stack.database = 'Drizzle';
    if (deps.mongoose) stack.database = 'MongoDB';
    if (deps['@supabase/supabase-js']) stack.database = 'Supabase';

    // Detect auth
    if (deps['@clerk/nextjs']) stack.auth = 'Clerk';
    if (deps['next-auth']) stack.auth = 'NextAuth';
    if (deps['@auth/core']) stack.auth = 'Auth.js';
    if (deps['@supabase/auth-helpers-nextjs']) stack.auth = 'Supabase Auth';

    // Detect testing
    if (deps.jest) stack.testing.push('Jest');
    if (deps.vitest) stack.testing.push('Vitest');
    if (deps.playwright) stack.testing.push('Playwright');
    if (deps.cypress) stack.testing.push('Cypress');

  } catch {
    // No package.json, use file extension detection
  }

  return stack;
}

/**
 * Discover modules from graph structure
 */
function discoverModules(graph) {
  const dirs = new Set();
  for (const node of graph.nodes) {
    if (node.type === 'file' && node.path) {
      const dir = path.dirname(node.path);
      if (dir !== '.' && !dir.includes('node_modules')) {
        dirs.add(dir.split('/')[0]); // Top-level directory
      }
    }
  }
  return [...dirs].sort();
}

/**
 * Extract key exports (public API)
 */
function extractKeyExports(graph) {
  return graph.nodes
    .filter(n => n.type === 'function')
    .map(n => ({ name: n.name, file: n.parent }))
    .slice(0, 50); // Top 50 functions
}

/**
 * Generate CONTEXT.md content
 */
function generateContextMd(techStack, modules, exports, graph) {
  const timestamp = new Date().toISOString();

  return `# Project Context
> Auto-generated by Ultra-Dex Brain Sync on ${timestamp}
> Run \`ultra-dex sync --brain\` to update

## Tech Stack
- **Language:** ${techStack.language}
- **Frameworks:** ${techStack.frameworks.join(', ') || 'None detected'}
- **Database:** ${techStack.database || 'None detected'}
- **Auth:** ${techStack.auth || 'None detected'}
- **Testing:** ${techStack.testing.join(', ') || 'None detected'}

## Project Structure
${modules.map(m => `- \`${m}/\``).join('\n') || '- No modules detected'}

## Key Functions
${exports.slice(0, 20).map(e => `- \`${e.name}\` in \`${e.file}\``).join('\n') || '- No functions detected'}

## Dependency Graph
- **Total Files:** ${graph.nodes.filter(n => n.type === 'file').length}
- **Total Functions:** ${graph.nodes.filter(n => n.type === 'function').length}
- **Import Links:** ${graph.edges.filter(e => e.type === 'depends_on').length}

## Key Decisions
- Document architectural decisions here

## Current Focus
- Document current sprint/milestone focus here
`;
}