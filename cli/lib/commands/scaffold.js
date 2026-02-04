import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { AppError, ValidationError } from '../utils/errors.js';

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

export async function scaffoldCommand(templateName, options) {
  printInfo(chalk.cyan('\n🏗️  Ultra-Dex Scaffold\n'));

  if (options.fromPlan) {
    printInfo(chalk.blue('  Scaffolding from Implementation Plan...'));
    const detected = await detectStackFromPlan();
    if (detected && TEMPLATES[detected]) {
      printInfo(chalk.green(`  Detected Tech Stack -> Template: ${TEMPLATES[detected].name}`));
      templateName = detected;
    } else {
      printWarning(chalk.yellow('  Could not detect a stack from the plan. Falling back to Next.js template.'));
      templateName = 'next15-prisma-clerk';
    }
  }

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
    template.stack.forEach(tech => {
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
  program
    .command('scaffold [template]')
    .description('Generate a production-ready project from a template')
    .option('-o, --output <dir>', 'Output directory')
    .option('--list', 'List available templates')
    .option('--from-plan', 'Scaffold based on Implementation Plan')
    .action(async (template, options) => {
      if (options.list) {
        printInfo(chalk.cyan('\n📦 Available Templates\n'));
        Object.entries(TEMPLATES).forEach(([key, val]) => {
          printInfo(chalk.bold(`  ${key}`));
          printInfo(chalk.gray(`    ${val.description}`));
          printInfo(chalk.gray(`    Stack: ${val.stack.join(', ')}\n`));
        });
        return;
      }
      await scaffoldCommand(template, options);
    });
}
