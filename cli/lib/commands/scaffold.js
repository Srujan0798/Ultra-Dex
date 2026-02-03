import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';

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
};

async function copyDirectory(src, dest) {
  // Validate source and destination paths to prevent directory traversal
  const normalizedSrc = path.resolve(src);
  const normalizedDest = path.resolve(dest);

  // Ensure source is within expected assets directory
  const expectedSrcPrefix = path.resolve(__dirname, '../../assets/live-templates');

  const relative = path.relative(expectedSrcPrefix, normalizedSrc);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Source path is outside allowed directory');
  }

  // Ensure destination is not outside project root
  if (!normalizedDest.startsWith(process.cwd())) {
    throw new Error('Destination path is outside project root');
  }

  await fs.mkdir(normalizedDest, { recursive: true });

  const entries = await fs.readdir(normalizedSrc, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      console.warn(`Skipping symbolic link: ${entry.name}`);
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
  } catch (e) {
    return 'next15-prisma-clerk';
  }
}

export async function scaffoldCommand(templateName, options) {
  console.log(chalk.cyan('\n🏗️  Ultra-Dex Scaffold\n'));

  // Logic for --from-plan
  if (options.fromPlan) {
    console.log(chalk.blue('  Scaffolding from Implementation Plan...'));
    const detected = await detectStackFromPlan();
    if (detected) {
      console.log(chalk.green(`  Detected Tech Stack -> Template: ${TEMPLATES[detected].name}`));
      templateName = detected;
    } else {
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
    console.log(chalk.red(`\n❌ Template "${templateName}" not found.\n`));
    process.exit(1);
  }

  const outputDir = options.output || '.';

  const spinner = ora(`Scaffolding ${template.name}...`).start();

  try {
    const assetsDir = path.resolve(__dirname, '../../assets/live-templates', templateName);

    try {
      await fs.access(assetsDir);
    } catch {
      throw new Error(`Template files not found at ${assetsDir}`);
    }

    await copyDirectory(assetsDir, outputDir);

    spinner.succeed(`Scaffolded ${template.name}`);
    console.log(chalk.green('✅ Scaffolding Complete'));

    console.log(chalk.bold('\n📁 Created files:\n'));

    async function listFiles(dir, prefix = '') {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          console.log(chalk.gray(`  ${prefix}${entry.name}/`));
          await listFiles(path.join(dir, entry.name), prefix + '  ');
        } else {
          console.log(chalk.green(`  ${prefix}${entry.name}`));
        }
      }
    }
    await listFiles(outputDir);

    console.log(chalk.bold('\n🚀 Next steps:\n'));
    console.log(chalk.cyan(`  cd ${outputDir}`));
    console.log(chalk.cyan('  npm install'));
    console.log(chalk.cyan('  cp .env.example .env.local'));
    console.log(chalk.cyan('  npm run dev'));

    console.log(chalk.bold('\n📚 Stack:\n'));
    template.stack.forEach(tech => {
      console.log(chalk.gray(`  • ${tech}`));
    });

    console.log(chalk.bold('\n💡 Tips:\n'));
    console.log(chalk.gray('  • Run "ultra-dex init" to add Ultra-Dex planning docs'));
    console.log(chalk.gray('  • Run "ultra-dex generate" to create implementation plan'));
    console.log(chalk.gray('  • Run "ultra-dex agents" to see available AI agents\n'));

  } catch (error) {
    spinner.fail('Failed to scaffold');
    console.error(chalk.red(error.message));
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
        console.log(chalk.cyan('\n📦 Available Templates\n'));
        Object.entries(TEMPLATES).forEach(([key, val]) => {
          console.log(chalk.bold(`  ${key}`));
          console.log(chalk.gray(`    ${val.description}`));
          console.log(chalk.gray(`    Stack: ${val.stack.join(', ')}\n`));
        });
        return;
      }
      await scaffoldCommand(template, options);
    });
}
