// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { AppError, ValidationError } from '../utils/errors.js';
import { validateSafePath } from '../utils/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES = {
  'next15-prisma-clerk': {
    name: 'Next.js 15 + Prisma + Clerk',
    description: 'Full-stack SaaS with App Router, Prisma ORM, and Clerk auth',
    stack: ['Next.js 15', 'Prisma', 'Clerk', 'PostgreSQL', 'Tailwind CSS'],
  },
  'remix-supabase': {
    name: 'Remix + Supabase',
    description: 'Full-stack app with Remix and Supabase backend',
    stack: ['Remix', 'Supabase', 'PostgreSQL', 'Tailwind CSS'],
  },
  'sveltekit-drizzle': {
    name: 'SvelteKit + Drizzle',
    description: 'SvelteKit app with Drizzle ORM',
    stack: ['SvelteKit', 'Drizzle', 'PostgreSQL', 'Tailwind CSS'],
  },
  'astro-sanity': {
    name: 'Astro + Sanity CMS',
    description: 'High-performance content-driven websites with Astro and Sanity',
    stack: ['Astro', 'Sanity CMS', 'React', 'TypeScript'],
  },
  'nuxt3-supabase': {
    name: 'Nuxt 3 + Supabase',
    description: 'Full-stack applications with Nuxt 3 and Supabase',
    stack: ['Nuxt 3', 'Supabase', 'Vue 3', 'TypeScript'],
  },
  'tauri-desktop': {
    name: 'Tauri Desktop App',
    description: 'Cross-platform native desktop apps with web technologies',
    stack: ['Tauri', 'Rust', 'Any Web Frontend', 'TypeScript'],
  },
  'solid-drizzle': {
    name: 'SolidStart + Drizzle',
    description: 'Reactive full-stack apps with SolidStart and Drizzle ORM',
    stack: ['SolidStart', 'Drizzle ORM', 'PostgreSQL', 'TypeScript'],
  },
};

const DEFAULT_PAGE_SIZE = 10;

function parsePositiveInt(value, fallback) {
  if (value === undefined || value === null) return fallback;
  const parsed = parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function paginate(items, page, limit) {
  const safeLimit = Math.max(1, limit);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIdx = (safePage - 1) * safeLimit;
  const endIdx = Math.min(startIdx + safeLimit, total);
  return {
    total,
    totalPages,
    page: safePage,
    start: total === 0 ? 0 : startIdx + 1,
    end: endIdx,
    items: items.slice(startIdx, endIdx),
  };
}

function printPaginationSummary(pageData) {
  if (pageData.totalPages <= 1) return;
  printInfo(
    chalk.gray(
      `Showing ${pageData.start}-${pageData.end} of ${pageData.total} (page ${pageData.page}/${pageData.totalPages}).`
    )
  );
}

async function copyDirectory(src, dest) {
  // Validate source and destination paths to prevent directory traversal
  const normalizedSrc = path.resolve(src);
  const normalizedDest = path.resolve(dest);

  // Ensure source is within expected assets directory
  const expectedSrcPrefix = path.resolve(__dirname, '../../assets/live-templates');
  if (!normalizedSrc.startsWith(expectedSrcPrefix)) {
    throw new Error('Source path is outside allowed directory');
  }

  // Ensure destination is not outside project root
  if (!normalizedDest.startsWith(process.cwd())) {
    throw new Error('Destination path is outside project root');
  }

  await fs.mkdir(normalizedDest, { recursive: true });
  const entries = await fs.readdir(normalizedSrc, { withFileTypes: true });

  for (const entry of entries) {
    // Prevent any potential symbolic link issues
    if (entry.isSymbolicLink()) {
      printWarning(`Skipping symbolic link: ${entry.name}`);
      continue;
    }

    const srcPath = path.join(normalizedSrc, entry.name);
    const destPath = path.join(normalizedDest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function detectStackFromPlan() {
  try {
    const planPath = path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md');
    const content = await fs.readFile(planPath, 'utf-8');

    if (content.match(/remix/i) && content.match(/supabase/i)) return 'remix-supabase';
    if (content.match(/svelte/i) && content.match(/drizzle/i)) return 'sveltekit-drizzle';

    return 'next15-prisma-clerk';
  } catch {
    return null;
  }
}

import { scaffoldFromPlan } from './scaffold-plan.js';

export async function scaffoldCommand(templateName, options) {
  if (options.fromPlan) {
    await scaffoldFromPlan(options);
    return;
  }

  printInfo(chalk.cyan('\n🏗️  Ultra-Dex Scaffold\n'));

  // If no template specified, show selection
  if (!templateName) {
    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: 'Select a template:',
        choices: Object.entries(TEMPLATES).map(([key, val]) => ({
          name: `${val.name} - ${val.description}`,
          value: key,
        })),
      },
    ]);
    templateName = selected;
  }

  const template = TEMPLATES[templateName];
  if (!template) {
    printError(chalk.red(`\n❌ Template "${templateName}" not found.\n`));
    printInfo(chalk.gray('Available templates:'));
    Object.entries(TEMPLATES).forEach(([key, val]) => {
      printInfo(chalk.cyan(`  - ${key}`) + chalk.gray(` (${val.name})`));
    });
    process.exit(1);
  }

  const outputDir = options.output || templateName;
  if (outputDir) {
    const outputValidation = validateSafePath(outputDir, 'Output directory');
    if (outputValidation !== true) {
      printError(chalk.red(outputValidation));
      process.exit(1);
    }
  }
  const spinner = ora(`Scaffolding ${template.name}...`).start();

  try {
    // Find template directory
    const assetsDir = path.resolve(__dirname, '../../assets/live-templates', templateName);

    try {
      await fs.access(assetsDir);
    } catch {
      spinner.fail('Template files not found in assets');
      printInfo(chalk.yellow('\n💡 Templates are bundled with the npm package.'));
      printInfo(chalk.gray('   Make sure you have the full package installed.\n'));
      process.exit(1);
    }

    // Copy template
    await copyDirectory(assetsDir, outputDir);

    spinner.succeed(`Scaffolded ${template.name}`);

    printInfo(chalk.bold('\n📁 Created files:\n'));

    async function listFiles(dir, prefix = '') {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          printInfo(chalk.gray(`  ${prefix}${entry.name}/`));
          await listFiles(path.join(dir, entry.name), prefix + '  ');
        } else {
          printInfo(chalk.green(`  ${prefix}${entry.name}`));
        }
      }
    }
    await listFiles(outputDir);

    printInfo(chalk.bold('\n🚀 Next steps:\n'));
    printInfo(chalk.cyan(`  cd ${outputDir}`));
    printInfo(chalk.cyan('  npm install'));
    printInfo(chalk.cyan('  cp .env.example .env.local'));
    printInfo(chalk.cyan('  npm run dev'));

    printInfo(chalk.bold('\n📚 Stack:\n'));
    template.stack.forEach((tech) => {
      printInfo(chalk.gray(`  • ${tech}`));
    });

    printInfo(chalk.bold('\n💡 Tips:\n'));
    printInfo(chalk.gray('  • Run "ultra-dex init" to add Ultra-Dex planning docs'));
    printInfo(chalk.gray('  • Run "ultra-dex generate" to create implementation plan'));
    printInfo(chalk.gray('  • Run "ultra-dex agents" to see available AI agents\n'));
  } catch (error) {
    spinner.fail('Failed to scaffold');
    printError(chalk.red(error.message));
    process.exit(1);
  }
}

export function registerScaffoldCommand(program) {
  const scaffoldCmd = program
    .command('scaffold [template]')
    .description('Generate a production-ready project from a template')
    .option('-o, --output <dir>', 'Output directory')
    .option('--list', 'List available templates')
    .option('--from-plan', 'Scaffold based on Implementation Plan')
    .option('--dry-run', 'Show what would be created when using --from-plan')
    .option('--force', 'Overwrite existing files when using --from-plan')
    .option('--prisma-only', 'Only generate Prisma schema when using --from-plan')
    .option('--api-only', 'Only generate API routes when using --from-plan')
    .option('--page <number>', 'Page number for --list', String(1))
    .option('--limit <number>', 'Items per page for --list', String(DEFAULT_PAGE_SIZE))
    .option('--json', 'Output list data as JSON')
    .action(async (template, options) => {
      if (options.list) {
        const items = Object.entries(TEMPLATES).map(([key, val]) => ({
          key,
          name: val.name,
          description: val.description,
          stack: val.stack,
        }));
        const page = parsePositiveInt(options.page, 1);
        const limit = parsePositiveInt(options.limit, DEFAULT_PAGE_SIZE);
        const pageData = paginate(items, page, limit);

        if (options.json) {
          process.stdout.write(
            JSON.stringify(
              {
                total: pageData.total,
                page: pageData.page,
                totalPages: pageData.totalPages,
                templates: pageData.items,
              },
              null,
              2
            ) + '\n'
          );
          return;
        }

        printInfo(chalk.cyan('\n📦 Available Templates\n'));
        pageData.items.forEach((item) => {
          printInfo(chalk.bold(`  ${item.key}`));
          printInfo(chalk.gray(`    ${item.description}`));
          printInfo(chalk.gray(`    Stack: ${item.stack.join(', ')}\n`));
        });
        printPaginationSummary(pageData);
        return;
      }
      await scaffoldCommand(template, options);
    });

  scaffoldCmd._examples = [
    {
      command: 'ultra-dex scaffold next15-prisma-clerk',
      description: 'Scaffold a Next.js + Prisma + Clerk project',
    },
    {
      command: 'ultra-dex scaffold --from-plan',
      description: 'Select template based on implementation plan',
    },
    {
      command: 'ultra-dex scaffold --from-plan --dry-run',
      description: 'Preview plan-based scaffolding without changes',
    },
    {
      command: 'ultra-dex scaffold --from-plan --prisma-only',
      description: 'Generate only Prisma schema from plan',
    },
    {
      command: 'ultra-dex scaffold --list --page 1 --limit 5',
      description: 'List available templates with pagination',
    },
  ];
}
