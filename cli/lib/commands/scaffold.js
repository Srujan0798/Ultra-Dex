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

export async function scaffoldCommand(templateName, options) {
  console.log(chalk.cyan('\n🏗️  Ultra-Dex Scaffold\n'));

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
    console.log(chalk.gray('Available templates:'));
    Object.entries(TEMPLATES).forEach(([key, val]) => {
      console.log(chalk.cyan(`  - ${key}`) + chalk.gray(` (${val.name})`));
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
      console.log(chalk.yellow('\n💡 Templates are bundled with the npm package.'));
      console.log(chalk.gray('   Make sure you have the full package installed.\n'));
      process.exit(1);
    }

    // Copy template
    await copyDirectory(assetsDir, outputDir);

    spinner.succeed(`Scaffolded ${template.name}`);

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
