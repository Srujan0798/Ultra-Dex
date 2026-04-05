// Copyright (c) 2026 Ultra-Dex

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from '../utils/ora.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { QUICK_START_TEMPLATE } from '../templates/quick-start.js';
import { CONTEXT_TEMPLATE } from '../templates/context.js';
import { ULTRA_TEMPLATE } from '../templates/ultra.js';
import { validateProjectName, validateSafePath } from '../utils/validation.js';
import { ASSETS_ROOT, ROOT_FALLBACK, LIVE_TEMPLATES_ROOT } from '../config/paths.js';
import { copyWithFallback, listWithFallback, readWithFallback } from '../utils/fallback.js';
import { copyDirectory, pathExists } from '../utils/files.js';
import { getRandomMessage } from '../utils/messages.js';
import { showBanner } from './banner.js';
import { logger } from '../utils/logger.js';
import { handleError } from '../utils/error-handler.js';
import { AppError, ValidationError } from '../utils/errors.js';
import { runAutoContext } from '../auto-context/index.js';
import { ensureTelemetryConsent, recordTelemetryEvent } from '../utils/telemetry.js';
import { sqliteProvider } from '../memory/sqlite.js';

const LIVE_STACKS = {
  'next15-saas': 'Next.js 15 SaaS (Clerk + Stripe + Prisma + Admin)',
  'next15-prisma-clerk': 'Next.js 15 + Prisma + Clerk',
  'remix-saas': 'Remix SaaS (Clerk + Stripe + Prisma)',
  'remix-supabase': 'Remix + Supabase',
  'sveltekit-saas': 'SvelteKit SaaS (Clerk + Stripe + Prisma)',
  'sveltekit-drizzle': 'SvelteKit + Drizzle',
  'fastapi-api': 'FastAPI API Starter',
  'ecommerce-next': 'Next.js E-commerce Starter',
  'ai-saas': 'AI SaaS Starter',
  'astro-sanity': 'Astro + Sanity CMS',
  'nuxt3-supabase': 'Nuxt 3 + Supabase',
  'tauri-desktop': 'Tauri Desktop App',
  'solid-drizzle': 'SolidStart + Drizzle',
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_ROOT = path.resolve(__dirname, '../../templates');
const TEMPLATE_FALLBACK = path.join(ROOT_FALLBACK, 'cli', 'templates');
const SYSTEM_DIRS = new Set(['.ultra-dex', '.ultra', '.DS_Store']);

function filterNonSystemEntries(entries) {
  return entries.filter((entry) => !SYSTEM_DIRS.has(entry));
}

import { scaffoldCommand } from './scaffold.js';

const scaffolder = { scaffold: scaffoldCommand };

/**
 * Register the init command with Commander
 * @param {Command} program Commander program instance
 */
export function registerInitCommand(program) {
  program
    .command('init [objective]')
    .description('Initialize a new Ultra-Dex Project')
    .option('-n, --name <name>', 'Project name')
    .option('-d, --dir <directory>', 'Output directory', '.')
    .option('--preview', 'Preview files without creating them')
    .option('--live', 'Generate a runnable scaffold')
    .option('--enterprise', 'Initialize with enterprise defaults')
    .option('--template <name>', 'Copy a starter template from cli/templates')
    .option(
      '--stack <preset>',
      'Preset: next15-saas, remix-saas, sveltekit-saas, fastapi-api, ecommerce-next, ai-saas (plus others)'
    )
    .action(async (objective, options) => {
      try {
        showBanner();
        logger.info('⚡ ACTIVATING NEXUS INTELLIGENCE...');
        logger.spacer();

        if (objective) {
          const targetDir = path.resolve(options.dir, options.name || 'new-project');
          await scaffolder.scaffold(objective, targetDir);
          return;
        }

        if (options.preview) {
          return handlePreview();
        }

        const dirValidation = validateSafePath(options.dir, 'Output directory');
        if (dirValidation !== true) {
          throw new ValidationError(dirValidation);
        }

        if (options.template) {
          return await handleTemplateInit(options);
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
 * @returns {void}
 */
function handlePreview() {
  logger.header('PREVIEW MODE: ARCHITECTURAL BLUEPRINT');
  logger.info('Planned files:');
  logger.info('  ├── QUICK-START.md        (Foundation)');
  logger.info('  ├── CONTEXT.md            (Project Memory)');
  logger.info('  ├── ULTRA.md              (Agent Synchronization)');
  logger.info('  ├── IMPLEMENTATION-PLAN.md (Execution Path)');
  logger.info('  ├── docs/CHECKLIST.md     (21-Step Verification)');
  logger.info('  └── docs/AI-PROMPTS.md    (Agent Instructions)');
  logger.spacer();
  logger.success('Blueprint Validated. Ready to Execute.');
}

/**
 * Handle project initialization from a template
 * @param {Object} options - Command options
 * @param {string} options.template - Template name
 * @param {string} options.dir - Output directory
 * @param {boolean} [options.enterprise] - Enterprise mode flag
 * @returns {Promise<void>}
 */
async function handleTemplateInit(options) {
  const templateName = options.template;
  const outputDir = path.resolve(options.dir);
  const validation = validateSafePath(templateName, 'Template name');
  if (validation !== true) {
    throw new ValidationError(validation);
  }

  if (await pathExists(outputDir, 'dir')) {
    const existing = filterNonSystemEntries(await fs.readdir(outputDir));
    if (existing.length > 0) {
      throw new AppError('Target sector is occupied. Execution halted to prevent data loss.', {
        code: 'DIR_NOT_EMPTY',
        suggestions: ['Choose a different directory', 'Empty the target directory'],
      });
    }
  }

  const primary = path.join(TEMPLATE_ROOT, templateName);
  const fallback = path.join(TEMPLATE_FALLBACK, templateName);
  let sourcePath = primary;
  try {
    await fs.access(primary);
  } catch {
    sourcePath = fallback;
  }

  await copyDirectory(sourcePath, outputDir);
  if (options.enterprise) {
    await applyEnterprisePreset(outputDir);
  }
  logger.success(`Template "${templateName}" deployed to ${outputDir}`);
  logger.info('Next steps:', { detail: 'Execution Path' });
  logger.info(`  1. cd ${outputDir}`);
  logger.info('  2. npm install');
  logger.info('  3. npm run dev');
  await maybePromptTelemetry({
    mode: 'template',
    template: templateName,
    enterprise: options.enterprise,
  });
}

/**
 * Handle live scaffolding for specific tech stacks
 * @param {Object} options - Command options
 * @param {string} [options.stack] - Stack preset name
 * @param {string} options.dir - Output directory
 * @param {boolean} [options.enterprise] - Enterprise mode flag
 * @returns {Promise<void>}
 */
async function handleLiveScaffold(options) {
  const preset = options.stack || 'next15-saas';
  if (!options.stack) {
    logger.info(`No --stack provided. Defaulting to ${preset}. Use --stack to select a preset.`);
  }
  if (!LIVE_STACKS[preset]) {
    throw new ValidationError(`Unknown frequency modulation: ${preset}`, [
      `Available presets: ${Object.keys(LIVE_STACKS).join(', ')}`,
    ]);
  }

  const outputDir = path.resolve(options.dir);
  if (await pathExists(outputDir, 'dir')) {
    const existing = filterNonSystemEntries(await fs.readdir(outputDir));
    if (existing.length > 0) {
      throw new AppError('Target sector is occupied. Execution halted to prevent data loss.', {
        code: 'DIR_NOT_EMPTY',
        suggestions: ['Choose a different directory', 'Empty the target directory'],
      });
    }
  }

  // Handle next15-saas stack with programmatic generation
  if (preset === 'next15-saas') {
    return await generateNext15SaaSStack(outputDir, options);
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
    if (options.enterprise) {
      await applyEnterprisePreset(outputDir);
    }
    spinner.succeed(chalk.green('Infrastructure deployment complete.'));

    try {
      await runAutoContext(outputDir);
      logger.success('Auto-context generated.');
    } catch (autoError) {
      logger.error(`Auto-context failed: ${autoError.message}`);
    }

    logger.info(`Stack: ${preset}`);
    logger.info('Next steps:');
    logger.info(`  1. cd ${outputDir}`);
    logger.info('  2. npm install');
    logger.info('  3. npm run dev');
    await maybePromptTelemetry({ mode: 'live', stack: preset, enterprise: options.enterprise });
  } catch (error) {
    spinner.fail(chalk.red('Infrastructure deployment failed'));
    throw error;
  }
}

/**
 * Handle interactive project initialization
 * @param {Object} options - Command options
 * @returns {Promise<void>}
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

  const finalAnswers = { ...answers };
  if (options.enterprise) {
    finalAnswers.database = 'PostgreSQL';
    finalAnswers.auth = 'Auth0';
    finalAnswers.payments = 'Stripe';
  }

  logger.spacer();
  const spinner = ora(chalk.hex('#8b5cf6')('Compiling project matrix...')).start();

  try {
    const outputDir = path.resolve(options.dir, finalAnswers.projectName);
    await scaffoldProject(outputDir, finalAnswers);
    if (options.enterprise) {
      await applyEnterprisePreset(outputDir);
    }

    try {
      await runAutoContext(outputDir);
      logger.success('Auto-context generated.');
    } catch (autoError) {
      logger.error(`Auto-context failed: ${autoError.message}`);
    }

    spinner.succeed(chalk.green('Protocol initialization complete.'));
    showFinalInstructions(outputDir, finalAnswers);
    await maybePromptTelemetry({
      mode: 'interactive',
      template: finalAnswers.frontend,
      enterprise: options.enterprise,
    });
  } catch (error) {
    spinner.fail(chalk.red('Initialization failed'));
    throw error;
  }
}

/**
 * Prompt for telemetry consent if not already set
 * @param {Object} context - Telemetry context
 * @returns {Promise<void>}
 */
async function maybePromptTelemetry(context = {}) {
  try {
    const enabled = await ensureTelemetryConsent({ prompt: true, source: 'init' });
    if (enabled) {
      await recordTelemetryEvent({ event: 'init', ...context });
    }
  } catch {
    // Telemetry should never block initialization
  }
}

/**
 * Apply enterprise preset configuration
 * @param {string} outputDir - Target directory
 * @returns {Promise<void>}
 */
async function applyEnterprisePreset(outputDir) {
  const enterpriseDir = path.join(TEMPLATE_ROOT, 'enterprise');
  const fallbackDir = path.join(TEMPLATE_FALLBACK, 'enterprise');
  let sourceDir = enterpriseDir;
  try {
    await fs.access(enterpriseDir);
  } catch {
    sourceDir = fallbackDir;
  }

  const docsOpsDir = path.join(outputDir, 'docs', 'ops');
  await fs.mkdir(docsOpsDir, { recursive: true });
  const drSource = path.join(sourceDir, 'disaster-recovery.md');
  const drTarget = path.join(docsOpsDir, 'DISASTER-RECOVERY.md');
  try {
    const drContent = await fs.readFile(drSource, 'utf8');
    await fs.writeFile(drTarget, drContent);
  } catch {
    // ignore missing template
  }

  const prismaDir = path.join(outputDir, 'prisma');
  await fs.mkdir(prismaDir, { recursive: true });
  const schemaSource = path.join(sourceDir, 'schema-multitenant.prisma');
  const schemaTarget = path.join(prismaDir, 'schema.prisma');
  const fallbackTarget = path.join(prismaDir, 'schema.enterprise.prisma');
  try {
    const schemaContent = await fs.readFile(schemaSource, 'utf8');
    if (await pathExists(schemaTarget, 'file')) {
      await fs.writeFile(fallbackTarget, schemaContent);
    } else {
      await fs.writeFile(schemaTarget, schemaContent);
    }
  } catch {
    // ignore missing template
  }

  const enterpriseDoc = path.join(outputDir, 'docs', 'ENTERPRISE-PRESET.md');
  const enterpriseContent =
    `# Enterprise Preset\n\n` +
    `Applied defaults:\n` +
    `- Multi-tenant database schema\n` +
    `- SOC2 + compliance focus\n` +
    `- SSO authentication ready\n` +
    `- High-scale architecture planning\n`;
  await fs.mkdir(path.dirname(enterpriseDoc), { recursive: true });
  await fs.writeFile(enterpriseDoc, enterpriseContent);

  const planPath = path.join(outputDir, 'IMPLEMENTATION-PLAN.md');
  try {
    const plan = await fs.readFile(planPath, 'utf8');
    const header =
      `# Enterprise Preset\\n\\n` +
      `This project was initialized with **--enterprise** defaults.\\n` +
      `- Multi-tenant DB\\n- SOC2 Compliance\\n- SSO Authentication\\n\\n`;
    if (!plan.startsWith('# Enterprise Preset')) {
      await fs.writeFile(planPath, header + plan);
    }
  } catch {
    // ignore missing plan
  }
}

/**
 * Scaffold the project files based on answers
 * @param {string} outputDir - Target directory
 * @param {Object} answers - User answers from inquirer
 * @returns {Promise<void>}
 */
async function scaffoldProject(outputDir, answers) {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(path.join(outputDir, 'docs'), { recursive: true });
  await ensureProviderConfig(outputDir);

  // Initialize v6.0.0 Relational Memory for this project
  try {
    const dbPath = path.join(outputDir, '.ultra-dex', 'memory.db');
    const ProjectSQLiteProvider = sqliteProvider.constructor;
    const projectDb = new ProjectSQLiteProvider(dbPath);
    await projectDb.init();
    logger.success('Relational Memory initialized.', { context: 'Memory' });
  } catch (memoryError) {
    // Relational memory should not block project initialization; surface as a soft warning
    logger.warn(`Relational Memory initialization skipped: ${memoryError.message}`, {
      context: 'Memory',
    });
  }

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
  let ultra = ULTRA_TEMPLATE;

  for (const [key, value] of Object.entries(replacements)) {
    quickStart = quickStart.replace(new RegExp(key, 'g'), value);
    context = context.replace(new RegExp(key, 'g'), value);
    ultra = ultra.replace(new RegExp(key, 'g'), value);
  }

  await fs.writeFile(path.join(outputDir, 'QUICK-START.md'), quickStart);
  await fs.writeFile(path.join(outputDir, 'CONTEXT.md'), context);
  await fs.writeFile(path.join(outputDir, 'ULTRA.md'), ultra);

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
}

async function ensureProviderConfig(outputDir) {
  const provider = detectProviderFromEnv();
  if (!provider) return;
  const configDir = path.join(outputDir, '.ultra-dex');
  const configPath = path.join(configDir, 'config.json');
  try {
    await fs.mkdir(configDir, { recursive: true });
    const payload = {
      ai: {
        defaultProvider: provider,
      },
    };
    await fs.writeFile(configPath, JSON.stringify(payload, null, 2));
  } catch {
    // ignore
  }
}

function detectProviderFromEnv() {
  if (process.env.ANTHROPIC_API_KEY) return 'claude';
  if (process.env.NVIDIA_API_KEY) return 'nvidia';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GOOGLE_AI_KEY || process.env.GEMINI_API_KEY) return 'google';
  return null;
}

async function deployCursorRules(outputDir) {
  const rulesDir = path.join(outputDir, '.cursor', 'rules');
  await fs.mkdir(rulesDir, { recursive: true });

  const cursorRulesPath = path.join(ASSETS_ROOT, 'cursor-rules');
  const fallbackRulesPath = path.join(ROOT_FALLBACK, 'cursor-rules');
  try {
    const { files: ruleFiles, sourcePath } = await listWithFallback(
      cursorRulesPath,
      fallbackRulesPath
    );
    for (const file of ruleFiles.filter((f) => f.endsWith('.mdc'))) {
      await fs.copyFile(path.join(sourcePath, file), path.join(rulesDir, file));
    }

    const coreRulePath = path.join(sourcePath, '00-ultra-dex-core.mdc');
    try {
      const coreContent = await readWithFallback(coreRulePath, null, 'utf-8');
      const dotGithub = path.join(outputDir, '.github');
      await fs.mkdir(dotGithub, { recursive: true });
      await fs.writeFile(path.join(dotGithub, 'copilot-instructions.md'), coreContent);
    } catch (coreError) {
      logger.warn(`Could not deploy core rule file: ${coreError.message}`);
    }
  } catch (error) {
    logger.warn(`Could not deploy cursor rules: ${error.message}`);
  }
}

async function deployMasterPlan(outputDir) {
  const templatePath = path.join(ASSETS_ROOT, 'saas-plan', '04-Imp-Template.md');
  const fallbackTemplatePath = path.join(
    ROOT_FALLBACK,
    '@ ultra-dex',
    'Saas plan',
    '04-Imp-Template.md'
  );
  try {
    await copyWithFallback(
      templatePath,
      fallbackTemplatePath,
      path.join(outputDir, 'docs', 'MASTER-PLAN.md')
    );
  } catch (error) {
    logger.warn(`Could not deploy master plan template: ${error.message}`);
  }
}

async function deployDocs(outputDir) {
  const verificationPath = path.join(ASSETS_ROOT, 'docs', 'VERIFICATION.md');
  const agentPath = path.join(ASSETS_ROOT, 'agents', 'AGENT-INSTRUCTIONS.md');
  const fallbackVerificationPath = path.join(ROOT_FALLBACK, 'docs', 'VERIFICATION.md');
  const fallbackAgentPath = path.join(ROOT_FALLBACK, 'agents', 'AGENT-INSTRUCTIONS.md');
  try {
    await copyWithFallback(
      verificationPath,
      fallbackVerificationPath,
      path.join(outputDir, 'docs', 'CHECKLIST.md')
    );
    await copyWithFallback(
      agentPath,
      fallbackAgentPath,
      path.join(outputDir, 'docs', 'AI-PROMPTS.md')
    );
  } catch (error) {
    logger.warn(`Could not deploy documentation files: ${error.message}`);
  }
}

async function deployAgents(outputDir) {
  const agentsDir = path.join(outputDir, '.agents');
  await fs.mkdir(agentsDir, { recursive: true });

  const agentsSourcePath = path.join(ASSETS_ROOT, 'agents');
  const fallbackAgentsPath = path.join(ROOT_FALLBACK, 'agents');
  try {
    const tiers = [
      '1-leadership',
      '2-development',
      '3-security',
      '4-devops',
      '5-quality',
      '6-specialist',
    ];
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
      for (const file of tierFiles.filter((f) => f.endsWith('.md'))) {
        await fs.copyFile(path.join(tierPath, file), path.join(tierDir, file));
      }
    }

    await fs.copyFile(
      path.join(sourceRoot, '00-AGENT_INDEX.md'),
      path.join(agentsDir, '00-AGENT_INDEX.md')
    );
    await fs.copyFile(path.join(sourceRoot, 'README.md'), path.join(agentsDir, 'README.md'));
  } catch (error) {
    logger.warn(`Could not deploy agent configurations: ${error.message}`);
  }
}

/**
 * Show final success instructions to the user
 * @param {string} outputDir - Project directory
 * @param {Object} answers - User choices
 */
function showFinalInstructions(outputDir, answers) {
  logger.header('Artifacts deployed to:');
  logger.info(`  ${outputDir}/`);
  logger.info('  ├── QUICK-START.md');
  logger.info('  ├── CONTEXT.md');
  logger.info('  ├── ULTRA.md');
  logger.info('  ├── IMPLEMENTATION-PLAN.md');
  if (answers.includeFullTemplate) {
    logger.info('  ├── docs/MASTER-PLAN.md');
  }
  if (answers.includeDocs) {
    logger.info('  ├── docs/CHECKLIST.md');
    logger.info('  ├── docs/AI-PROMPTS.md');
  }
  if (answers.includeCursorRules) {
    logger.info('  ├── .cursor/rules/');
  }

  logger.spacer();
  logger.header('Mission Directives:');
  logger.info(`  1. cd ${answers.projectName}`);
  logger.info('  2. Open QUICK-START.md');
  logger.info('  3. ultra-dex swarm "Analyze requirements"');

  logger.success('SYSTEM ONLINE.');
}

/**
 * Generate full Next.js 15 SaaS stack with Clerk, Stripe, Prisma, Admin Dashboard
 * Uses template directory instead of inline templates for maintainability
 * @param {string} outputDir Target directory
 */
async function generateNext15SaaSStack(outputDir, options = {}) {
  const spinner = ora('Generating Next.js 15 SaaS infrastructure...').start();

  try {
    // Copy from next15-saas template directory
    const templatePath = path.join(LIVE_TEMPLATES_ROOT, 'next15-saas');
    const fallbackPath = path.join(ROOT_FALLBACK, 'cli', 'assets', 'live-templates', 'next15-saas');

    let sourcePath = templatePath;
    try {
      await fs.access(templatePath);
    } catch {
      sourcePath = fallbackPath;
    }

    await copyDirectory(sourcePath, outputDir);
    if (options.enterprise) {
      await applyEnterprisePreset(outputDir);
    }

    spinner.succeed(chalk.green('Next.js 15 SaaS infrastructure deployed!'));

    // Show instructions
    logger.info(`Stack: Next.js 15 + Clerk + Stripe + Prisma`, { detail: 'SaaS' });
    logger.spacer();
    logger.info('Features included:');
    logger.info('  • Clerk authentication with middleware');
    logger.info('  • Stripe payments with checkout & webhooks');
    logger.info('  • Prisma ORM with User, Subscription, Invoice, Feature, Usage models');
    logger.info('  • Email integration with Resend');
    logger.info('  • S3 file upload utilities');
    logger.info('  • Tailwind CSS styling');

    logger.spacer();
    logger.header('Next steps:');
    logger.info(`  1. cd ${outputDir}`);
    logger.info('  2. npm install');
    logger.info('  3. cp .env.example .env.local');
    logger.info('  4. # Add your API keys to .env.local');
    logger.info('  5. npx prisma migrate dev');
    logger.info('  6. npm run dev');
  } catch (error) {
    spinner.fail(chalk.red('Failed to generate SaaS infrastructure'));
    throw error;
  }
}
