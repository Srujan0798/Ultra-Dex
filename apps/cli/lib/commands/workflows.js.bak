// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { githubBlobUrl } from '../config/urls.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { AppError, ValidationError } from '../utils/errors.js';
import {
  displayWorkflowSearch,
  installWorkflow,
  uninstallWorkflow,
  runWorkflow,
  listWorkflows,
  infoWorkflow,
} from '../marketplace/workflows.js';

export const WORKFLOWS = {
  auth: {
    name: 'Authentication',
    agents: [
      '@Planner',
      '@Research',
      '@CTO',
      '@Database',
      '@Backend',
      '@Frontend',
      '@Security',
      '@DevOps',
    ],
    description: 'Complete authentication with email/password and OAuth',
    example: 'supabase',
    steps: [
      '1. Define the authentication strategy and user flows',
      '2. Design and apply the database schema for users and sessions',
      '3. Implement authentication API endpoints and middleware',
      '4. Build frontend login, signup, and reset password pages',
      '5. Secure protected routes and session handling',
      '6. Verify email/OAuth flows and edge cases',
    ],
  },
  supabase: {
    name: 'Supabase Authentication Setup',
    agents: [
      '@Planner',
      '@Research',
      '@CTO',
      '@Database',
      '@Backend',
      '@Frontend',
      '@Security',
      '@DevOps',
    ],
    description: 'Set up Supabase auth with RLS policies and triggers',
    steps: [
      '1. Create Supabase project and capture API keys',
      '2. Define database schema and apply RLS policies',
      '3. Configure authentication providers and redirects',
      '4. Implement backend auth middleware and session helpers',
      '5. Build frontend auth UI components and flows',
      '6. Test the end-to-end authentication lifecycle',
    ],
  },
  payments: {
    name: 'Payment Integration (Stripe)',
    agents: [
      '@Planner',
      '@Research',
      '@CTO',
      '@Database',
      '@Backend',
      '@Frontend',
      '@Testing',
      '@Security',
      '@DevOps',
    ],
    description: 'Integrate Stripe for subscriptions and one-time payments',
    example: 'vercel',
    steps: [
      '1. Create Stripe account and obtain API keys',
      '2. Design subscription and payment database schema',
      '3. Implement Stripe Checkout session creation API',
      '4. Handle webhook events with signature verification',
      '5. Build payment UI and subscription management views',
      '6. Test with Stripe test cards and webhook events',
    ],
  },
  vercel: {
    name: 'Vercel Deployment Pipeline',
    agents: ['@Planner', '@CTO', '@Frontend', '@DevOps'],
    description: 'Deploy Next.js app to Vercel with staging/production',
    steps: [
      '1. Set up Vercel project and link the Git repository',
      '2. Configure environment variables and secrets',
      '3. Set up custom domain and SSL certificates',
      '4. Configure preview deployments for pull requests',
      '5. Set up deployment protection and access rules',
      '6. Test the deployment pipeline end to end',
    ],
  },
  ai: {
    name: 'AI SaaS Integration',
    agents: ['@Planner', '@Research', '@CTO', '@Backend', '@Frontend', '@Security'],
    description: 'Integrate OpenAI/Anthropic with vector database and streaming',
    steps: [
      '1. Configure AI provider API keys and model settings',
      '2. Set up a vector database for embeddings and retrieval',
      '3. Implement the RAG pipeline for context enrichment',
      '4. Build streaming API endpoints for responses',
      '5. Create interactive chat and AI UI components',
      '6. Implement usage monitoring and rate limiting',
    ],
  },
  analytics: {
    name: 'Analytics & Event Tracking',
    agents: ['@Planner', '@CTO', '@Frontend', '@Backend', '@DevOps'],
    description: 'Implement PostHog/Mixpanel tracking with custom dashboards',
    steps: [
      '1. Initialize analytics SDK in the frontend app',
      '2. Define a core event schema and naming standards',
      '3. Implement server-side event tracking endpoints',
      '4. Set up user identification and properties',
      '5. Create analytics dashboards, funnels, and cohorts',
      '6. Verify data accuracy and privacy compliance',
    ],
  },
  api: {
    name: 'API Platform Development',
    agents: ['@Planner', '@CTO', '@Backend', '@Security', '@Testing'],
    description: 'Build a production-ready API with documentation and rate limiting',
    steps: [
      '1. Design REST/GraphQL API schema and contracts',
      '2. Implement API key or JWT authentication',
      '3. Set up Redis-based rate limiting and abuse protection',
      '4. Generate OpenAPI/Swagger documentation',
      '5. Implement versioning strategy and deprecation plan',
      '6. Build API monitoring and logging dashboard',
    ],
  },
  microservices: {
    name: 'Microservices Architecture',
    agents: ['@Planner', '@CTO', '@Backend', '@DevOps', '@Security'],
    description: 'Set up a distributed microservices system with service mesh',
    steps: [
      '1. Define service boundaries and API contracts',
      '2. Set up Docker/Kubernetes orchestration environment',
      '3. Implement inter-service communication (gRPC/NATS)',
      '4. Configure API gateway and service discovery',
      '5. Implement distributed tracing (Jaeger/Zipkin)',
      '6. Set up centralized logging and monitoring',
    ],
  },
  blockchain: {
    name: 'Blockchain & Web3 Integration',
    agents: ['@Planner', '@Research', '@CTO', '@Backend', '@Frontend', '@Security'],
    description: 'Integrate smart contracts and wallet authentication',
    steps: [
      '1. Set up blockchain dev environment (Hardhat/Foundry)',
      '2. Develop and test smart contracts with unit tests',
      '3. Deploy contracts to testnet or mainnet',
      '4. Implement wallet connection (RainbowKit/ConnectKit)',
      '5. Integrate contract interactions into the frontend',
      '6. Implement backend transaction monitoring and alerts',
    ],
  },
  admin: {
    name: 'Internal Admin Dashboard',
    agents: ['@Planner', '@CTO', '@Backend', '@Frontend', '@Security'],
    description: 'Build a secure administrative dashboard for internal tools',
    steps: [
      '1. Define admin RBAC (Role-Based Access Control) policies',
      '2. Implement secure admin-only API routes and middleware',
      '3. Build data management tables, filters, and bulk actions',
      '4. Implement audit logging for admin actions',
      '5. Build user and subscription management interface',
      '6. Set up monitoring and incident response tooling',
    ],
  },
  deployment: {
    name: 'Deployment Readiness',
    agents: ['@Planner', '@CTO', '@DevOps', '@Security'],
    description: 'Prepare production deployment with safe rollback and monitoring',
    steps: [
      '1. Select hosting platform and deployment strategy',
      '2. Configure environment variables and secrets management',
      '3. Add health checks, logging, and monitoring hooks',
      '4. Define rollback plan and deployment verification',
    ],
  },
  cicd: {
    name: 'CI/CD Pipeline',
    agents: ['@Planner', '@CTO', '@DevOps', '@Testing'],
    description: 'Create automated validation, testing, and deployment workflows',
    steps: [
      '1. Configure CI pipeline to run lint and tests',
      '2. Add build and artifact generation steps',
      '3. Define deployment stage with environment approvals',
      '4. Add status notifications and failure alerts',
    ],
  },
  database: {
    name: 'Database Migrations',
    agents: ['@Planner', '@CTO', '@Database', '@Backend'],
    description: 'Plan and execute safe database migrations with backups',
    steps: [
      '1. Review schema changes and migration impact',
      '2. Generate migration scripts and backup strategy',
      '3. Apply migrations in staging and validate data',
      '4. Roll out to production with monitoring and rollback',
    ],
  },
  email: {
    name: 'Email Notifications',
    agents: ['@Planner', '@Research', '@Backend', '@Frontend', '@DevOps'],
    description: 'Implement transactional email flows with provider integration',
    steps: [
      '1. Select email provider and configure API keys',
      '2. Design transactional templates and content',
      '3. Implement backend email dispatch with retries',
      '4. Validate deliverability and logging analytics',
    ],
  },
  realtime: {
    name: 'Real-Time Features',
    agents: ['@Planner', '@CTO', '@Backend', '@Frontend', '@DevOps'],
    description: 'Add WebSocket or realtime data updates with scaling strategy',
    steps: [
      '1. Choose realtime transport (WebSocket/SSE) and providers',
      '2. Implement server-side realtime gateway and auth',
      '3. Build client subscriptions and UI updates',
      '4. Add scaling, rate limits, and monitoring',
    ],
  },
};

/**
 * Visualize the agent and step flow for a workflow
 */
export function visualizeWorkflow(workflow) {
  printInfo(chalk.bold.cyan(`\n📊 ${workflow.name} Flow\n`));

  printInfo(chalk.bold('Team Handoff:'));
  const agentFlow = workflow.agents
    .map((a) => {
      const color = ['@Planner', '@CTO'].includes(a)
        ? chalk.magenta
        : ['@Backend', '@Frontend'].includes(a)
          ? chalk.blue
          : chalk.yellow;
      return color(a);
    })
    .join(chalk.gray(' → '));
  printInfo('  ' + agentFlow + '\n');

  printInfo(chalk.bold('Execution Path:'));
  if (workflow.steps) {
    workflow.steps.forEach((step, i) => {
      const isLast = i === workflow.steps.length - 1;
      printInfo(`  ${chalk.green('●')} ${step}`);
      if (!isLast) printInfo(`  ${chalk.gray('│')}`);
    });
  }
  logger.log('');
}

/**
 * Add a workflow to the project implementation plan
 */
export async function startWorkflow(feature) {
  const workflow = WORKFLOWS[feature.toLowerCase()];
  if (!workflow) throw new ValidationError(`Workflow "${feature}" not found.`);

  const planPath = path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md');
  try {
    let content = await fs.readFile(planPath, 'utf8');

    if (content.includes(`## Workflow: ${workflow.name}`)) {
      printWarning(`Workflow "${workflow.name}" already exists in the plan.`);
      return;
    }

    const newSection =
      `\n## Workflow: ${workflow.name}\n` +
      workflow.steps.map((s) => `- [ ] ${s}`).join('\n') +
      '\n';

    await fs.appendFile(planPath, newSection);
    printSuccess(`✅ Added "${workflow.name}" workflow to IMPLEMENTATION-PLAN.md`);
  } catch (e) {
    throw new AppError('Failed to update implementation plan', { cause: e });
  }
}

/**
 * Register the workflow command with Commander
 */
export function registerWorkflowCommand(program) {
  const workflowCmd = program.command('workflow').description('Show or manage workflows');

  workflowCmd
    .argument('[feature]')
    .option('--viz', 'Visualize the workflow')
    .option('--start', 'Add workflow to implementation plan')
    .action(async (feature, options, command) => {
      try {
        if (!feature) {
          command.help();
          return;
        }

        const workflow = WORKFLOWS[feature.toLowerCase()];

        if (!workflow) {
          const available = Object.keys(WORKFLOWS).join(', ');
          throw new ValidationError(`Workflow "${feature}" not found.`, [
            `Available: ${available}`,
          ]);
        }

        if (options.viz) {
          visualizeWorkflow(workflow);
          return;
        }

        if (options.start) {
          await startWorkflow(feature);
          return;
        }

        displayWorkflowSummary(workflow);
      } catch (error) {
        await handleError(error, { command: 'workflow', feature, options });
        process.exit(error.exitCode || 1);
      }
    });

  workflowCmd
    .command('search <query>')
    .description('Search workflow marketplace')
    .action(async (query) => {
      await displayWorkflowSearch(query);
    });

  workflowCmd
    .command('install <name>')
    .description('Install workflow from marketplace')
    .action(async (name) => {
      await installWorkflow(name);
    });

  workflowCmd
    .command('uninstall <name>')
    .description('Uninstall workflow')
    .action(async (name) => {
      await uninstallWorkflow(name);
    });

  workflowCmd
    .command('run <name>')
    .description('Run installed workflow')
    .action(async (name) => {
      await runWorkflow(name);
    });

  workflowCmd
    .command('list')
    .description('List installed workflows')
    .action(async () => {
      await listWorkflows();
    });

  workflowCmd
    .command('info <name>')
    .description('Show workflow details')
    .action(async (name) => {
      await infoWorkflow(name);
    });

  workflowCmd
    .command('validate')
    .description('Validate multi-tool handoff documentation')
    .option('--file <path>', 'Handoff file', 'HANDOFF.md')
    .action(async (options) => {
      try {
        const target = path.resolve(process.cwd(), options.file);
        const content = await fs.readFile(target, 'utf8');
        const required = ['## Handoff', '### What I Built', '### API Contract', '### Next Steps'];
        const missing = required.filter((section) => !content.includes(section));
        if (missing.length) {
          printWarning(chalk.yellow(`Missing sections: ${missing.join(', ')}`));
          process.exitCode = 1;
          return;
        }
        printSuccess(chalk.green('✅ Handoff documentation looks complete.'));
      } catch {
        printWarning(chalk.yellow(`Handoff file not found.`));
        process.exitCode = 1;
      }
    });
}

function displayWorkflowSummary(workflow) {
  printInfo(chalk.bold(`\n📋 ${workflow.name} Workflow\n`));
  printInfo(chalk.gray(workflow.description));

  printInfo(chalk.bold('\n🤖 Agents Involved:\n'));
  workflow.agents.forEach((agent, i) => {
    printInfo(chalk.cyan(`  ${i + 1}. ${agent}`));
  });

  if (workflow.steps) {
    printInfo(chalk.bold('\n📝 Implementation Steps:\n'));
    workflow.steps.forEach((step) => {
      printInfo(chalk.gray(`  • ${step}`));
    });
  }

  printInfo(chalk.bold('\n📚 Documentation:\n'));
  printInfo(`  Guide: ${githubBlobUrl('guides/ADVANCED-WORKFLOWS.md')}\n`);
}
