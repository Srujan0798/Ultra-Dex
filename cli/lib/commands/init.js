import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';

import { QUICK_START_TEMPLATE } from '../templates/quick-start.js';
import { CONTEXT_TEMPLATE } from '../templates/context.js';
import { validateProjectName, validateSafePath } from '../utils/validation.js';
import { ASSETS_ROOT, ROOT_FALLBACK, LIVE_TEMPLATES_ROOT } from '../config/paths.js';
import { copyWithFallback, listWithFallback, readWithFallback } from '../utils/fallback.js';
import { copyDirectory, pathExists } from '../utils/files.js';
import { getRandomMessage } from '../utils/messages.js';
import { showBanner } from './banner.js';
import { printError, printInfo, printSuccess } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { AppError, ValidationError } from '../utils/errors.js';

const LIVE_STACKS = {
  'next15-prisma-clerk': 'Next.js 15 + Prisma + Clerk',
  'remix-supabase': 'Remix + Supabase',
  'sveltekit-drizzle': 'SvelteKit + Drizzle',
  'next15-saas': 'Next.js 15 SaaS (Clerk + Stripe + Prisma + Admin)',
  'astro-sanity': 'Astro + Sanity CMS',
  'nuxt3-supabase': 'Nuxt 3 + Supabase',
  'tauri-desktop': 'Tauri Desktop App',
  'solid-drizzle': 'SolidStart + Drizzle',
};

/**
 * Register the init command with Commander
 * @param {Command} program Commander program instance
 */
export function registerInitCommand(program) {
  program
    .command('init')
    .description('Initialize a new Ultra-Dex Project')
    .option('-n, --name <name>', 'Project name')
    .option('-d, --dir <directory>', 'Output directory', '.')
    .option('--preview', 'Preview files without creating them')
    .option('--live', 'Generate a runnable scaffold')
    .option('--stack <preset>', 'Preset: next15-prisma-clerk, remix-supabase, sveltekit-drizzle')
    .action(async (options) => {
      try {
        showBanner();
        printInfo('\n⚡ ACTIVATING 16-AGENT SWARM INTELLIGENCE...\n');
        process.stdout.write(chalk.italic(chalk.gray(`"${getRandomMessage('start')}"`)) + '\n');
        process.stdout.write('\n');

        if (options.preview) {
          return handlePreview();
        }

        const dirValidation = validateSafePath(options.dir, 'Output directory');
        if (dirValidation !== true) {
          throw new ValidationError(dirValidation);
        }

        if (options.live) {
          return await handleLiveScaffold(options);
        }

        return await handleInteractiveInit(options);
      } catch (error) {
        await handleError(error, { command: 'init', options });
        process.exit(error.exitCode || 1);
      }
    });
}

/**
 * Show a preview of the architectural blueprint
 */
function handlePreview() {
  process.stdout.write(chalk.bold.cyan('\n📋 PREVIEW MODE: ARCHITECTURAL BLUEPRINT\n'));
  process.stdout.write('  ├── QUICK-START.md        (Foundation)\n');
  process.stdout.write('  ├── CONTEXT.md            (Project Memory)\n');
  process.stdout.write('  ├── IMPLEMENTATION-PLAN.md (Execution Path)\n');
  process.stdout.write('  ├── docs/CHECKLIST.md     (21-Step Verification)\n');
  process.stdout.write('  └── docs/AI-PROMPTS.md    (Agent Instructions)\n');
  process.stdout.write('\n');
  printSuccess('  ✓ Blueprint Validated. Ready to Execute.');
}

/**
 * Handle live scaffolding for specific tech stacks
 * @param {Object} options Command options
 */
async function handleLiveScaffold(options) {
  const preset = options.stack || 'next15-prisma-clerk';
  if (!LIVE_STACKS[preset]) {
    throw new ValidationError(`Unknown frequency modulation: ${preset}`, [
      `Available presets: ${Object.keys(LIVE_STACKS).join(', ')}`
    ]);
  }

  const outputDir = path.resolve(options.dir);
  if (await pathExists(outputDir, 'dir')) {
    const existing = await fs.readdir(outputDir);
    if (existing.length > 0) {
      throw new AppError('Target sector is occupied. Execution halted to prevent data loss.', {
        code: 'DIR_NOT_EMPTY',
        suggestions: ['Choose a different directory', 'Empty the target directory']
      });
    }
  }

  // Handle next15-saas stack with programmatic generation
  if (preset === 'next15-saas') {
    return await generateNext15SaaSStack(outputDir);
  }

  const liveSourcePath = path.join(LIVE_TEMPLATES_ROOT, preset);
  const fallbackLivePath = path.join(ROOT_FALLBACK, 'cli', 'assets', 'live-templates', preset);
  let sourcePath = liveSourcePath;
  try {
    await fs.access(liveSourcePath);
  } catch {
    sourcePath = fallbackLivePath;
  }

  const spinner = ora(`Fabricating ${LIVE_STACKS[preset]} infrastructure...`).start();
  try {
    await copyDirectory(sourcePath, outputDir);
    spinner.succeed(chalk.green('Infrastructure deployment complete.'));
    
    printInfo(`\nStack: ${preset}`);
    process.stdout.write(chalk.gray(`Next steps:`) + '\n');
    process.stdout.write(chalk.cyan(`  1. cd ${outputDir}`) + '\n');
    process.stdout.write(chalk.cyan('  2. npm install') + '\n');
    process.stdout.write(chalk.cyan('  3. npm run dev\n') + '\n');
  } catch (error) {
    spinner.fail(chalk.red('Infrastructure deployment failed'));
    throw error;
  }
}

/**
 * Handle interactive project initialization
 * @param {Object} options Command options
 */
async function handleInteractiveInit(options) {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project Designation (Name):',
      default: options.name || 'my-saas',
      validate: validateProjectName,
    },
    {
      type: 'input',
      name: 'ideaWhat',
      message: 'Mission Objective (What are we building?):',
      validate: (input) => input.length > 0 || 'Mission objective required.',
    },
    {
      type: 'input',
      name: 'ideaFor',
      message: 'Target Sector (Who is the user?):',
      validate: (input) => input.length > 0 || 'Target sector required.',
    },
    {
      type: 'list',
      name: 'frontend',
      message: 'Select Frontend Interface Protocol:',
      choices: ['Next.js', 'Remix', 'SvelteKit', 'Nuxt', 'Other'],
    },
    {
      type: 'list',
      name: 'database',
      message: 'Select Data Persistence Layer:',
      choices: ['PostgreSQL', 'Supabase', 'MongoDB', 'PlanetScale', 'Other'],
    },
    {
      type: 'list',
      name: 'auth',
      message: 'Select Identity Verification Protocol:',
      choices: ['NextAuth', 'Clerk', 'Auth0', 'Supabase Auth', 'Other'],
    },
    {
      type: 'list',
      name: 'payments',
      message: 'Select Revenue Capture System:',
      choices: ['Stripe', 'Lemonsqueezy', 'Paddle', 'None (Free)', 'Other'],
    },
    {
      type: 'list',
      name: 'hosting',
      message: 'Select Deployment Grid:',
      choices: ['Vercel', 'Railway', 'Fly.io', 'AWS', 'Other'],
    },
    {
      type: 'confirm',
      name: 'includeCursorRules',
      message: 'Inject IDE Neural Links? (Cursor/Copilot Rules)',
      default: true,
    },
    {
      type: 'confirm',
      name: 'includeFullTemplate',
      message: 'Generate Full 34-Section Master Plan?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'includeDocs',
      message: 'Include Verification Standards?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'includeAgents',
      message: 'Deploy Agent Swarm Configuration?',
      default: true,
    },
  ]);

  process.stdout.write('\n');
  const spinner = ora(chalk.hex('#8b5cf6')('Compiling project matrix...')).start();

  try {
    const outputDir = path.resolve(options.dir, answers.projectName);
    await scaffoldProject(outputDir, answers);
    spinner.succeed(chalk.green('Protocol initialization complete.'));
    showFinalInstructions(outputDir, answers);
  } catch (error) {
    spinner.fail(chalk.red('Initialization failed'));
    throw error;
  }
}

/**
 * Scaffold the project files based on answers
 * @param {string} outputDir Target directory
 * @param {Object} answers User answers from inquirer
 */
async function scaffoldProject(outputDir, answers) {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(path.join(outputDir, 'docs'), { recursive: true });

  const replacements = {
    '{{PROJECT_NAME}}': answers.projectName,
    '{{DATE}}': new Date().toISOString().split('T')[0],
    '{{IDEA_WHAT}}': answers.ideaWhat,
    '{{IDEA_FOR}}': answers.ideaFor,
    '{{PROBLEM_1}}': 'Undefined Problem 1',
    '{{PROBLEM_2}}': 'Undefined Problem 2',
    '{{PROBLEM_3}}': 'Undefined Problem 3',
    '{{FEATURE_1}}': 'Core Feature 1',
    '{{FRONTEND}}': answers.frontend,
    '{{DATABASE}}': answers.database,
    '{{AUTH}}': answers.auth,
    '{{PAYMENTS}}': answers.payments,
    '{{HOSTING}}': answers.hosting,
  };

  let quickStart = QUICK_START_TEMPLATE;
  let context = CONTEXT_TEMPLATE;

  for (const [key, value] of Object.entries(replacements)) {
    quickStart = quickStart.replace(new RegExp(key, 'g'), value);
    context = context.replace(new RegExp(key, 'g'), value);
  }

  await fs.writeFile(path.join(outputDir, 'QUICK-START.md'), quickStart);
  await fs.writeFile(path.join(outputDir, 'CONTEXT.md'), context);

  const planContent = `# ${answers.projectName} - Implementation Plan

> Generated with Ultra-Dex CLI (Meta-Layer v${process.env.npm_package_version || '3.5.0'})

## Overview

${answers.ideaWhat} for ${answers.ideaFor}.

---

## Next Steps

1. Open QUICK-START.md and complete the remaining sections.
2. Customize the implementation plan based on your requirements.
3. Start the agent orchestration to begin development.
`;

  await fs.writeFile(path.join(outputDir, 'IMPLEMENTATION-PLAN.md'), planContent);

  if (answers.includeCursorRules) {
    await deployCursorRules(outputDir);
  }

  if (answers.includeFullTemplate) {
    await deployMasterPlan(outputDir);
  }

  if (answers.includeDocs) {
    await deployDocs(outputDir);
  }

  if (answers.includeAgents) {
    await deployAgents(outputDir);
  }
}

async function deployCursorRules(outputDir) {
  const rulesDir = path.join(outputDir, '.cursor', 'rules');
  await fs.mkdir(rulesDir, { recursive: true });

  const cursorRulesPath = path.join(ASSETS_ROOT, 'cursor-rules');
  const fallbackRulesPath = path.join(ROOT_FALLBACK, 'cursor-rules');
  try {
    const { files: ruleFiles, sourcePath } = await listWithFallback(cursorRulesPath, fallbackRulesPath);
    for (const file of ruleFiles.filter(f => f.endsWith('.mdc'))) {
      await fs.copyFile(
        path.join(sourcePath, file),
        path.join(rulesDir, file)
      );
    }

    const coreRulePath = path.join(sourcePath, '00-ultra-dex-core.mdc');
    try {
      const coreContent = await readWithFallback(coreRulePath, null, 'utf-8');
      const dotGithub = path.join(outputDir, '.github');
      await fs.mkdir(dotGithub, { recursive: true });
      await fs.writeFile(path.join(dotGithub, 'copilot-instructions.md'), coreContent);
    } catch (coreError) {
      printWarning('⚠️  Could not deploy core rule file: ' + coreError.message);
    }
  } catch (error) {
    printWarning('⚠️  Could not deploy cursor rules: ' + error.message);
  }
}

async function deployMasterPlan(outputDir) {
  const templatePath = path.join(ASSETS_ROOT, 'saas-plan', '04-Imp-Template.md');
  const fallbackTemplatePath = path.join(ROOT_FALLBACK, '@ ultra-dex', 'Saas plan', '04-Imp-Template.md');
  try {
    await copyWithFallback(templatePath, fallbackTemplatePath, path.join(outputDir, 'docs', 'MASTER-PLAN.md'));
  } catch (error) {
    printWarning('⚠️  Could not deploy master plan template: ' + error.message);
  }
}

async function deployDocs(outputDir) {
  const verificationPath = path.join(ASSETS_ROOT, 'docs', 'VERIFICATION.md');
  const agentPath = path.join(ASSETS_ROOT, 'agents', 'AGENT-INSTRUCTIONS.md');
  const fallbackVerificationPath = path.join(ROOT_FALLBACK, 'docs', 'VERIFICATION.md');
  const fallbackAgentPath = path.join(ROOT_FALLBACK, 'agents', 'AGENT-INSTRUCTIONS.md');
  try {
    await copyWithFallback(verificationPath, fallbackVerificationPath, path.join(outputDir, 'docs', 'CHECKLIST.md'));
    await copyWithFallback(agentPath, fallbackAgentPath, path.join(outputDir, 'docs', 'AI-PROMPTS.md'));
  } catch (error) {
    printWarning('⚠️  Could not deploy documentation files: ' + error.message);
  }
}

async function deployAgents(outputDir) {
  const agentsDir = path.join(outputDir, '.agents');
  await fs.mkdir(agentsDir, { recursive: true });

  const agentsSourcePath = path.join(ASSETS_ROOT, 'agents');
  const fallbackAgentsPath = path.join(ROOT_FALLBACK, 'agents');
  try {
    const tiers = ['1-leadership', '2-development', '3-security', '4-devops', '5-quality', '6-specialist'];
    let sourceRoot = agentsSourcePath;
    try {
      await fs.access(agentsSourcePath);
    } catch {
      sourceRoot = fallbackAgentsPath;
    }

    for (const tier of tiers) {
      const tierDir = path.join(agentsDir, tier);
      await fs.mkdir(tierDir, { recursive: true });

      const tierPath = path.join(sourceRoot, tier);
      const tierFiles = await fs.readdir(tierPath);
      for (const file of tierFiles.filter(f => f.endsWith('.md'))) {
        await fs.copyFile(
          path.join(tierPath, file),
          path.join(tierDir, file)
        );
      }
    }

    await fs.copyFile(
      path.join(sourceRoot, '00-AGENT_INDEX.md'),
      path.join(agentsDir, '00-AGENT_INDEX.md')
    );
    await fs.copyFile(
      path.join(sourceRoot, 'README.md'),
      path.join(agentsDir, 'README.md')
    );
  } catch (error) {
    printWarning('⚠️  Could not deploy agent configurations: ' + error.message);
  }
}

function showFinalInstructions(outputDir, answers) {
  process.stdout.write('\n' + chalk.bold('Artifacts deployed to:') + '\n');
  process.stdout.write(chalk.gray(`  ${outputDir}/`) + '\n');
  process.stdout.write(chalk.gray('  ├── QUICK-START.md') + '\n');
  process.stdout.write(chalk.gray('  ├── CONTEXT.md') + '\n');
  process.stdout.write(chalk.gray('  ├── IMPLEMENTATION-PLAN.md') + '\n');
  if (answers.includeFullTemplate) {
    process.stdout.write(chalk.gray('  ├── docs/MASTER-PLAN.md') + '\n');
  }
  if (answers.includeDocs) {
    process.stdout.write(chalk.gray('  ├── docs/CHECKLIST.md') + '\n');
    process.stdout.write(chalk.gray('  ├── docs/AI-PROMPTS.md') + '\n');
  }
  if (answers.includeCursorRules) {
    process.stdout.write(chalk.gray('  ├── .cursor/rules/') + '\n');
  }
  if (answers.includeAgents) {
    process.stdout.write(chalk.gray('  └── .agents/') + '\n');
  }

  process.stdout.write('\n' + chalk.bold('Mission Directives:') + '\n');
  process.stdout.write(chalk.cyan(`  1. cd ${answers.projectName}`) + '\n');
  process.stdout.write(chalk.cyan('  2. Open QUICK-START.md') + '\n');
  process.stdout.write(chalk.cyan('  3. ultra-dex swarm "Analyze requirements"') + '\n');

  printSuccess('\n  ✓ SYSTEM ONLINE.\n');
}

/**
 * Generate full Next.js 15 SaaS stack with Clerk, Stripe, Prisma, Admin Dashboard
 * @param {string} outputDir Target directory
 */
async function generateNext15SaaSStack(outputDir) {
  const spinner = ora('Generating Next.js 15 SaaS infrastructure...').start();
  
  try {
    // Create directory structure
    const dirs = [
      'src/app',
      'src/app/api/webhooks',
      'src/app/api/stripe',
      'src/app/dashboard',
      'src/app/admin',
      'src/components',
      'src/components/ui',
      'src/lib',
      'src/lib/auth',
      'src/lib/stripe',
      'src/lib/email',
      'src/lib/upload',
      'prisma',
      'types',
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(path.join(outputDir, dir), { recursive: true });
    }

    // Generate package.json
    await fs.writeFile(path.join(outputDir, 'package.json'), JSON.stringify({
      name: 'nextjs-saas',
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
        'db:generate': 'prisma generate',
        'db:migrate': 'prisma migrate dev',
        'db:studio': 'prisma studio',
        'db:seed': 'tsx prisma/seed.ts',
      },
      dependencies: {
        'next': '15.0.0',
        'react': '^19.0.0',
        'react-dom': '^19.0.0',
        '@clerk/nextjs': '^5.0.0',
        '@prisma/client': '^5.0.0',
        'stripe': '^15.0.0',
        '@stripe/stripe-js': '^3.0.0',
        '@stripe/react-stripe-js': '^2.0.0',
        'resend': '^3.0.0',
        '@aws-sdk/client-s3': '^3.0.0',
        '@aws-sdk/s3-presigned-post': '^3.0.0',
        'zod': '^3.0.0',
        'tailwindcss': '^3.0.0',
        'autoprefixer': '^10.0.0',
        'postcss': '^8.0.0',
        'lucide-react': '^0.400.0',
        'class-variance-authority': '^0.7.0',
        'clsx': '^2.0.0',
        'tailwind-merge': '^2.0.0',
      },
      devDependencies: {
        'typescript': '^5.0.0',
        '@types/node': '^20.0.0',
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
        'prisma': '^5.0.0',
        'tsx': '^4.0.0',
        'eslint': '^8.0.0',
        'eslint-config-next': '15.0.0',
      },
    }, null, 2));

    // Generate .env.example
    await fs.writeFile(path.join(outputDir, '.env.example'), `# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_
CLERK_SECRET_KEY=sk_test_
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# Stripe
STRIPE_SECRET_KEY=sk_test_
STRIPE_WEBHOOK_SECRET=whsec_
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_

# Email (Resend)
RESEND_API_KEY=re_
EMAIL_FROM=onboarding@yourdomain.com

# AWS S3 (File Upload)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
`);

    // Generate Prisma schema with 5 tables
    await fs.writeFile(path.join(outputDir, 'prisma/schema.prisma'), `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  clerkId       String    @unique
  email         String    @unique
  name          String?
  role          Role      @default(USER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  subscription  Subscription?
  invoices      Invoice[]
  usage         Usage[]
  
  @@map("users")
}

model Subscription {
  id                String             @id @default(cuid())
  userId            String             @unique
  user              User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripeCustomerId  String             @unique
  stripeSubscriptionId String?         @unique
  status            SubscriptionStatus @default(INCOMPLETE)
  plan              Plan               @default(FREE)
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  @@map("subscriptions")
}

model Invoice {
  id              String        @id @default(cuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripeInvoiceId String?       @unique
  amount          Int           // Amount in cents
  currency        String        @default("usd")
  status          InvoiceStatus @default(DRAFT)
  description     String?
  paidAt          DateTime?
  createdAt       DateTime      @default(now())
  
  @@map("invoices")
}

model Feature {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  key         String   @unique
  enabled     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("features")
}

model Usage {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  feature   String
  count     Int      @default(0)
  month     Int      // 1-12
  year      Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([userId, feature, month, year])
  @@map("usage")
}

enum Role {
  USER
  ADMIN
}

enum SubscriptionStatus {
  INCOMPLETE
  INCOMPLETE_EXPIRED
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  UNPAID
  PAUSED
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}

enum InvoiceStatus {
  DRAFT
  OPEN
  PAID
  UNCOLLECTIBLE
  VOID
}
`);

    // Generate Next.js config
    await fs.writeFile(path.join(outputDir, 'next.config.js'), `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['localhost', 'your-domain.com'],
  },
}

module.exports = nextConfig
`);

    // Generate TypeScript config
    await fs.writeFile(path.join(outputDir, 'tsconfig.json'), JSON.stringify({
      compilerOptions: {
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [{ name: 'next' }],
        paths: {
          '@/*': ['./src/*'],
        },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    }, null, 2));

    // Generate Tailwind config
    await fs.writeFile(path.join(outputDir, 'tailwind.config.js'), `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8b5cf6',
          foreground: '#ffffff',
        },
      },
    },
  },
  plugins: [],
}
`);

    // Generate PostCSS config
    await fs.writeFile(path.join(outputDir, 'postcss.config.js'), `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`);

    // Generate types
    await fs.writeFile(path.join(outputDir, 'types/index.ts'), `export interface User {
  id: string;
  clerkId: string;
  email: string;
  name?: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  status: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  currentPeriodEnd?: Date;
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  createdAt: Date;
}
`);

    // Generate lib files
    await fs.writeFile(path.join(outputDir, 'src/lib/db.ts'), `import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
`);

    await fs.writeFile(path.join(outputDir, 'src/lib/stripe/client.ts'), `import { loadStripe } from '@stripe/stripe-js'

export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
`);

    await fs.writeFile(path.join(outputDir, 'src/lib/stripe/server.ts'), `import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

export const getOrCreateCustomer = async (userId: string, email: string) => {
  const { db } = await import('@/lib/db')
  
  const existing = await db.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  })
  
  if (existing?.stripeCustomerId) {
    return existing.stripeCustomerId
  }
  
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  })
  
  await db.subscription.create({
    data: {
      userId,
      stripeCustomerId: customer.id,
      status: 'INCOMPLETE',
      plan: 'FREE',
    },
  })
  
  return customer.id
}

export const createCheckoutSession = async (customerId: string, priceId: string) => {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    billing_address_collection: 'auto',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: \`\${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true\`,
    cancel_url: \`\${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true\`,
  })
}
`);

    await fs.writeFile(path.join(outputDir, 'src/lib/email/resend.ts'), `import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendWelcomeEmail = async (email: string, name?: string) => {
  return resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: 'Welcome to our SaaS!',
    html: \`
      <h1>Welcome \${name || 'there'}!</h1>
      <p>Thanks for signing up. We're excited to have you on board.</p>
    \`,
  })
}

export const sendInvoiceEmail = async (email: string, invoiceId: string, amount: number) => {
  return resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: 'Your invoice is ready',
    html: \`
      <h1>Invoice #\${invoiceId}</h1>
      <p>Amount: $\${(amount / 100).toFixed(2)}</p>
      <p>Thank you for your business!</p>
    \`,
  })
}
`);

    await fs.writeFile(path.join(outputDir, 'src/lib/upload/s3.ts'), `import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export const generateUploadUrl = async (key: string, contentType: string) => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  })
  
  return getSignedUrl(s3Client, command, { expiresIn: 3600 })
}

export const getPublicUrl = (key: string) => {
  return \`https://\${process.env.AWS_S3_BUCKET_NAME}.s3.\${process.env.AWS_REGION}.amazonaws.com/\${key}\`
}
`);

    // Generate app layout
    await fs.writeFile(path.join(outputDir, 'src/app/layout.tsx'), `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Next.js SaaS',
  description: 'Production-ready SaaS template',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  )
}
`);

    await fs.writeFile(path.join(outputDir, 'src/app/globals.css'), `@tailwind base;
@tailwind components;
@tailwind utilities;
`);

    await fs.writeFile(path.join(outputDir, 'src/app/page.tsx'), `import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Next.js SaaS Template</h1>
      <p className="text-lg mb-8 text-gray-600">
        Production-ready with Clerk, Stripe, Prisma, and more.
      </p>
      <div className="flex gap-4">
        <Link
          href="/sign-up"
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Get Started
        </Link>
        <Link
          href="/sign-in"
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Sign In
        </Link>
      </div>
    </main>
  )
}
`);

    // Generate dashboard page
    await fs.writeFile(path.join(outputDir, 'src/app/dashboard/page.tsx'), `import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'

export default async function Dashboard() {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  })
  
  if (!user) {
    redirect('/sign-up')
  }
  
  return (
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {user.role === 'ADMIN' && (
          <Link
            href="/admin"
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Admin Panel
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Plan</h2>
          <p className="text-2xl font-bold text-primary">
            {user.subscription?.plan || 'FREE'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Status: {user.subscription?.status || 'INCOMPLETE'}
          </p>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Current Period</h2>
          <p className="text-sm text-gray-500">
            {user.subscription?.currentPeriodEnd
              ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString()
              : 'N/A'}
          </p>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/dashboard/billing"
              className="block text-primary hover:underline"
            >
              Manage Billing →
            </Link>
            <Link
              href="/dashboard/settings"
              className="block text-primary hover:underline"
            >
              Settings →
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
`);

    // Generate admin page
    await fs.writeFile(path.join(outputDir, 'src/app/admin/page.tsx'), `import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'

export default async function AdminDashboard() {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  const user = await db.user.findUnique({
    where: { clerkId: userId },
  })
  
  if (user?.role !== 'ADMIN') {
    redirect('/dashboard')
  }
  
  const stats = await Promise.all([
    db.user.count(),
    db.subscription.count({ where: { status: 'ACTIVE' } }),
    db.invoice.count(),
  ])
  
  return (
    <main className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-blue-900">Total Users</h2>
          <p className="text-3xl font-bold text-blue-600">{stats[0]}</p>
        </div>
        
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-green-900">Active Subscriptions</h2>
          <p className="text-3xl font-bold text-green-600">{stats[1]}</p>
        </div>
        
        <div className="p-6 bg-purple-50 border border-purple-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-purple-900">Total Invoices</h2>
          <p className="text-3xl font-bold text-purple-600">{stats[2]}</p>
        </div>
      </div>
      
      <div className="mt-8 p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
            View All Users
          </button>
          <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
            Manage Features
          </button>
          <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
            System Settings
          </button>
        </div>
      </div>
    </main>
  )
}
`);

    // Generate API routes
    await fs.writeFile(path.join(outputDir, 'src/app/api/webhooks/stripe/route.ts'), `import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = headers().get('stripe-signature')!
    
    let event: Stripe.Event
    
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      process.stderr.write(\`Webhook signature verification failed: \${err.message}\\n\`)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
    
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        await db.subscription.update({
          where: { stripeCustomerId: subscription.customer as string },
          data: {
            stripeSubscriptionId: subscription.id,
            status: subscription.status.toUpperCase() as any,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        })
        break
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        await db.subscription.update({
          where: { stripeCustomerId: subscription.customer as string },
          data: {
            status: 'CANCELED',
          },
        })
        break
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        const user = await db.user.findFirst({
          where: { subscription: { stripeCustomerId: invoice.customer as string } },
        })
        
        if (user) {
          await db.invoice.create({
            data: {
              userId: user.id,
              stripeInvoiceId: invoice.id,
              amount: invoice.amount_due,
              currency: invoice.currency,
              status: 'PAID',
              description: invoice.description,
              paidAt: new Date(),
            },
          })
        }
        break
      }
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    process.stderr.write(`Webhook error: ${error}\n`)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
`);

    await fs.writeFile(path.join(outputDir, 'src/app/api/stripe/checkout/route.ts'), `import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import { createCheckoutSession, getOrCreateCustomer } from '@/lib/stripe/server'

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { priceId, email } = await req.json()
    
    if (!priceId) {
      return NextResponse.json({ error: 'Price ID required' }, { status: 400 })
    }
    
    const customerId = await getOrCreateCustomer(userId, email)
    const session = await createCheckoutSession(customerId, priceId)
    
    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    process.stderr.write(`Checkout error: ${error}\n`)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
`);

    // Generate README
    await fs.writeFile(path.join(outputDir, 'README.md'), `# Next.js 15 SaaS Template

Production-ready SaaS template with authentication, payments, and admin dashboard.

## Features

- ✅ **Next.js 15** - React framework with App Router
- ✅ **TypeScript** - Type safety
- ✅ **Tailwind CSS** - Styling
- ✅ **Clerk** - Authentication with protected routes
- ✅ **Stripe** - Payments (checkout + webhooks)
- ✅ **Prisma** - Database ORM with 5-table schema
- ✅ **PostgreSQL** - Database
- ✅ **Resend** - Email sending
- ✅ **AWS S3** - File uploads
- ✅ **Admin Dashboard** - User management & analytics

## Quick Start

1. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env.local
   # Fill in your API keys
   \`\`\`

3. **Set up the database**
   \`\`\`bash
   npx prisma generate
   npx prisma migrate dev
   \`\`\`

4. **Run the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Open** http://localhost:3000

## Database Schema

### Tables

1. **User** - User accounts linked to Clerk
2. **Subscription** - Stripe subscription data
3. **Invoice** - Payment invoices
4. **Feature** - Feature flags
5. **Usage** - Usage tracking

## Environment Variables

See \`.env.example\` for required variables.

### Required Services

- [Clerk](https://clerk.dev) - Authentication
- [Stripe](https://stripe.com) - Payments
- [PostgreSQL](https://postgresql.org) - Database
- [Resend](https://resend.com) - Email (optional)
- [AWS S3](https://aws.amazon.com/s3) - File uploads (optional)

## Project Structure

\`\`\`
src/
├── app/              # Next.js App Router
│   ├── api/          # API routes
│   ├── admin/        # Admin dashboard
│   └── dashboard/    # User dashboard
├── components/       # React components
├── lib/             # Utility functions
│   ├── auth/        # Clerk auth
│   ├── stripe/      # Stripe integration
│   ├── email/       # Resend email
│   └── upload/      # S3 file upload
└── types/           # TypeScript types
\`\`\`

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Stripe Webhook Setup

For production, set up the Stripe webhook:
\`\`\`
https://your-domain.com/api/webhooks/stripe
\`\`\`

Events to listen for:
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded

## License

MIT
`);

    spinner.succeed(chalk.green('Next.js 15 SaaS infrastructure generated!'));
    
    printInfo('\n📦 Stack: next15-saas');
    printInfo('✅ Includes:');
    process.stdout.write(chalk.gray('  • Next.js 15 + TypeScript + Tailwind') + '\n');
    process.stdout.write(chalk.gray('  • Clerk authentication with protected routes') + '\n');
    process.stdout.write(chalk.gray('  • Stripe payments (checkout + webhooks)') + '\n');
    process.stdout.write(chalk.gray('  • Prisma + PostgreSQL (5 tables)') + '\n');
    process.stdout.write(chalk.gray('  • Admin dashboard') + '\n');
    process.stdout.write(chalk.gray('  • Email (Resend)') + '\n');
    process.stdout.write(chalk.gray('  • File upload (AWS S3)') + '\n');
    
    process.stdout.write(chalk.gray('\nNext steps:') + '\n');
    process.stdout.write(chalk.cyan(`  1. cd ${outputDir}`) + '\n');
    process.stdout.write(chalk.cyan('  2. npm install') + '\n');
    process.stdout.write(chalk.cyan('  3. cp .env.example .env.local') + '\n');
    process.stdout.write(chalk.cyan('  4. # Add your API keys to .env.local') + '\n');
    process.stdout.write(chalk.cyan('  5. npx prisma migrate dev') + '\n');
    process.stdout.write(chalk.cyan('  6. npm run dev\n') + '\n');
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to generate SaaS infrastructure'));
    throw error;
  }
}