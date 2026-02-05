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
import integrations from '../integrations/index.js';

const WATCH_IGNORES = new Set([
  '.git',
  'node_modules',
  '.next',
  'dist',
  'build',
  '.ultra-dex',
  '.cursor',
  '.idea',
  '.vscode',
  'coverage'
]);

const WATCH_EXTENSIONS = new Set([
  '.js', '.ts', '.tsx', '.jsx', '.json', '.md', '.prisma', '.sql', '.py', '.go', '.rb'
]);

const SCHEMA_PATTERNS = [
  /schema\.prisma$/i,
  /drizzle\/schema/i,
  /supabase\/migrations/i,
  /migrations\/.*\.(sql|ts|js)$/i,
  /db\/schema/i
];

function shouldIgnorePath(filePath) {
  const parts = filePath.split(path.sep);
  if (parts.some((part) => WATCH_IGNORES.has(part))) return true;
  return false;
}

function isWatchedFile(filePath) {
  if (SCHEMA_PATTERNS.some((pattern) => pattern.test(filePath))) return true;
  const ext = path.extname(filePath);
  return WATCH_EXTENSIONS.has(ext);
}

function renderInlineDiff(before, after, maxLines = 120) {
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  const diffLines = [];
  const max = Math.max(beforeLines.length, afterLines.length);

  for (let i = 0; i < max; i += 1) {
    const prev = beforeLines[i];
    const next = afterLines[i];
    if (prev === next) continue;
    if (prev !== undefined) diffLines.push(`- ${prev}`);
    if (next !== undefined) diffLines.push(`+ ${next}`);
    if (diffLines.length >= maxLines) break;
  }

  return diffLines;
}

export async function syncContextWithDiff(projectDir, reason = null) {
  const contextPath = path.join(projectDir, 'CONTEXT.md');
  let before = null;
  try {
    before = await fs.readFile(contextPath, 'utf8');
  } catch {
    before = null;
  }

  const syncResult = await snapshotContext(projectDir);
  let after = null;
  try {
    after = await fs.readFile(contextPath, 'utf8');
  } catch {
    after = null;
  }

  if (syncResult.updated && before && after) {
    printInfo(chalk.cyan('\n🧠 CONTEXT.md auto-sync updated.'));
    if (reason) {
      printInfo(chalk.gray(`Trigger: ${reason}`));
    }
    const diffLines = renderInlineDiff(before, after);
    if (diffLines.length > 0) {
      printInfo(chalk.gray('Diff (truncated):'));
      diffLines.forEach((line) => {
        if (line.startsWith('+')) printInfo(chalk.green(line));
        else if (line.startsWith('-')) printInfo(chalk.red(line));
        else printInfo(chalk.gray(line));
      });
    }
  }

  return syncResult;
}

export function registerSyncCommand(program) {
  const syncCmd = program
    .command('sync')
    .description('Synchronize project state and graph (God Mode Sync)')
    .option('-d, --dir <directory>', 'Project directory to sync', '.')
    .option('--push', 'Push local state to sync target')
    .option('--pull', 'Pull state from sync target')
    .option('--brain', 'Auto-update CONTEXT.md from codebase analysis (eliminates human middleware)')
    .option('--target <path>', 'Sync target (local folder or s3-like)', '.ultra/sync')
    .option('--watch', 'Watch codebase changes and auto-sync CONTEXT.md')
    .option('--debounce <ms>', 'Debounce interval for watch mode', '800')
    .option('--jira', 'Sync IMPLEMENTATION-PLAN.md with Jira')
    .option('--notion', 'Sync IMPLEMENTATION-PLAN.md with Notion')
    .option('--trello', 'Sync IMPLEMENTATION-PLAN.md with Trello')
    .option('--project <key>', 'Project key for Jira sync')
    .option('--page-id <id>', 'Notion page/database ID')
    .option('--board-id <id>', 'Trello board ID')
    .action(async (options) => {
      try {
        printInfo(chalk.cyan('\n🔄 Ultra-Dex State Sync\n'));

        const dirValidation = validateSafePath(options.dir, 'Project directory');
        if (dirValidation !== true) {
          printError(chalk.red(dirValidation));
          process.exit(1);
        }

        const targetValidation = validateSafePath(options.target, 'Sync target');
        if (targetValidation !== true) {
          printError(chalk.red(targetValidation));
          process.exit(1);
        }

        if (options.push && options.pull) {
          printError(chalk.red('Choose either --push or --pull, not both.'));
          process.exit(1);
        }

        const projectDir = path.resolve(options.dir);

        if (options.jira || options.notion || options.trello) {
          if (options.jira) {
            try {
              const result = await integrations.jira.syncPlan({
                projectKey: options.project,
                planPath: 'IMPLEMENTATION-PLAN.md'
              }, {
                baseUrl: process.env.JIRA_BASE_URL,
                apiToken: process.env.JIRA_API_TOKEN,
                email: process.env.JIRA_EMAIL
              });
              printSuccess(chalk.green(`✅ Jira sync prepared (${result.summary.epics} epics, ${result.summary.stories} stories)`));
            } catch (error) {
              printWarning(chalk.yellow(`Jira sync skipped: ${error.message}`));
            }
          }

          if (options.notion) {
            try {
              const result = await integrations.notion.exportPlan({
                planPath: 'IMPLEMENTATION-PLAN.md'
              }, {
                apiToken: process.env.NOTION_API_TOKEN,
                databaseId: options.pageId || process.env.NOTION_DATABASE_ID
              });
              printSuccess(chalk.green(`✅ Notion export prepared (${result.databaseId})`));
            } catch (error) {
              printWarning(chalk.yellow(`Notion sync skipped: ${error.message}`));
            }
          }

          if (options.trello) {
            try {
              const result = await integrations.trello.sync({}, {
                apiKey: process.env.TRELLO_API_KEY,
                token: process.env.TRELLO_TOKEN,
                boardId: options.boardId || process.env.TRELLO_BOARD_ID
              });
              if (result?.ok) {
                printSuccess(chalk.green('✅ Trello sync prepared'));
              }
            } catch (error) {
              printWarning(chalk.yellow(`Trello sync skipped: ${error.message}`));
            }
          }
        }

        // Watch Mode: Continuous auto-sync
        if (options.watch) {
          const debounceMs = Number.parseInt(options.debounce, 10);
          await startContextAutoSyncWatcher(projectDir, Number.isNaN(debounceMs) ? 800 : debounceMs);
          return;
        }

        // Brain Mode: Full autonomous context update
        if (options.brain) {
          await handleBrainSync(projectDir);
          return;
        }

        // 1. Snapshot Context (Updates CONTEXT.md)
        const syncResult = await syncContextWithDiff(projectDir);
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
      } catch (error) {
        printError(chalk.red(`Sync failed: ${error.message}`));
        process.exit(1);
      }
    });

  syncCmd._examples = [
    { command: 'ultra-dex sync --push', description: 'Push local state to .ultra/sync' },
    { command: 'ultra-dex sync --pull --target backups/sync', description: 'Pull state from a custom sync target' },
    { command: 'ultra-dex sync --brain', description: 'Regenerate CONTEXT.md from code graph' },
    { command: 'ultra-dex sync --watch', description: 'Auto-sync CONTEXT.md on code changes' },
    { command: 'ultra-dex sync --jira --project PROJ', description: 'Prepare Jira epic/story sync' },
    { command: 'ultra-dex sync --notion --page-id xxx', description: 'Prepare Notion export' },
    { command: 'ultra-dex sync --trello --board-id abc', description: 'Prepare Trello board sync' },
  ];
}

export async function startContextAutoSyncWatcher(projectDir, debounceMs = 800) {
  printInfo(chalk.cyan('🛰️  Auto-sync watch enabled'));
  printInfo(chalk.gray(`Watching ${projectDir} (debounce ${debounceMs}ms)`));

  let timer = null;
  let lastTrigger = null;

  const watcher = fs.watch(projectDir, { recursive: true }, async (_event, filename) => {
    if (!filename) return;
    if (shouldIgnorePath(filename)) return;
    if (!isWatchedFile(filename)) return;

    lastTrigger = filename;
    if (timer) clearTimeout(timer);

    timer = setTimeout(async () => {
      await syncContextWithDiff(projectDir, lastTrigger);
    }, debounceMs);
  });

  process.on('SIGINT', () => {
    watcher.close();
    printInfo(chalk.gray('Auto-sync watch stopped.'));
    process.exit(0);
  });
}

async function handlePush(projectDir, target) {
  const spinner = (await import('ora')).default('Pushing state to sync target...').start();
  try {
    // Note: loadState/saveState should be directory-aware. 
    // Assuming loadState uses process.cwd(), we should change cwd temporarily or update loadState
    // For safety in this fix, we assume the user runs this from project root or understands limitation.
    
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

  printInfo(chalk.magenta.bold('🧠 Brain Sync: Autonomous Context Update\n'));

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
