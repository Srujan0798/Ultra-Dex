import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { githubBlobUrl } from '../config/urls.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { AppError, ValidationError } from '../utils/errors.js';

export const WORKFLOWS = {
  auth: {
    name: 'Authentication (General)',
    agents: ['@Planner', '@Research', '@CTO', '@Database', '@Backend', '@Frontend', '@Security', '@DevOps'],
    description: 'Complete authentication with email/password and OAuth',
    steps: [
      'Define auth strategy',
      'Set up database schema',
      'Implement API endpoints',
      'Build frontend pages',
      'Secure routes',
      'Verify email/OAuth flows'
    ]
  },
  supabase: {
    name: 'Supabase Authentication Setup',
    agents: ['@Planner', '@Research', '@CTO', '@Database', '@Backend', '@Frontend', '@Security', '@DevOps'],
    description: 'Set up Supabase auth with RLS policies and triggers',
    steps: [
      'Create Supabase project and get API keys',
      'Set up database schema with RLS policies',
      'Configure authentication providers',
      'Implement backend auth middleware',
      'Build frontend auth UI components',
      'Test authentication flow',
    ],
  },
  payments: {
    name: 'Payment Integration (Stripe)',
    agents: ['@Planner', '@Research', '@CTO', '@Database', '@Backend', '@Frontend', '@Testing', '@Security', '@DevOps'],
    description: 'Integrate Stripe for subscriptions and one-time payments',
    steps: [
      'Create Stripe account and get API keys',
      'Design subscription/payment schema',
      'Implement Stripe Checkout API',
      'Handle webhooks for payment events',
      'Build payment UI with checkout flow',
      'Test with Stripe test cards',
    ],
  },
  vercel: {
    name: 'Vercel Deployment Pipeline',
    agents: ['@Planner', '@CTO', '@Frontend', '@DevOps'],
    description: 'Deploy Next.js app to Vercel with staging/production',
    steps: [
      'Set up Vercel project and link Git repository',
      'Configure environment variables',
      'Set up custom domain and SSL',
      'Configure preview deployments',
      'Set up deployment protection rules',
      'Test deployment pipeline',
    ],
  },
  ai: {
    name: 'AI SaaS Integration',
    agents: ['@Planner', '@Research', '@CTO', '@Backend', '@Frontend', '@Security'],
    description: 'Integrate OpenAI/Anthropic with vector database and streaming',
    steps: [
      'Configure AI provider API keys',
      'Set up Vector Database (Pinecone/Supabase Vector)',
      'Implement RAG (Retrieval-Augmented Generation) pipeline',
      'Build streaming API endpoints',
      'Create interactive chat/AI UI components',
      'Implement usage monitoring and rate limiting',
    ],
  },
  analytics: {
    name: 'Analytics & Event Tracking',
    agents: ['@Planner', '@CTO', '@Frontend', '@Backend', '@DevOps'],
    description: 'Implement PostHog/Mixpanel tracking with custom dashboards',
    steps: [
      'Initialize analytics SDK in frontend',
      'Define core event schema',
      'Implement server-side event tracking',
      'Set up user identification and properties',
      'Create analytics dashboards and funnels',
      'Verify data accuracy and privacy compliance',
    ],
  },
  api: {
    name: 'API Platform Development',
    agents: ['@Planner', '@CTO', '@Backend', '@Security', '@Testing'],
    description: 'Build a production-ready API with documentation and rate limiting',
    steps: [
      'Design REST/GraphQL API schema',
      'Implement API Key/JWT authentication',
      'Set up Redis-based rate limiting',
      'Generate OpenAPI/Swagger documentation',
      'Implement versioning strategy',
      'Build API monitoring and logging',
    ],
  },
  microservices: {
    name: 'Microservices Architecture',
    agents: ['@Planner', '@CTO', '@Backend', '@DevOps', '@Security'],
    description: 'Set up a distributed microservices system with service mesh',
    steps: [
      'Define service boundaries and API contracts',
      'Set up Docker/Kubernetes orchestration',
      'Implement inter-service communication (gRPC/NATS)',
      'Configure API Gateway and service discovery',
      'Implement distributed tracing (Jaeger/Zipkin)',
      'Set up centralized logging and monitoring',
    ],
  },
  blockchain: {
    name: 'Blockchain & Web3 Integration',
    agents: ['@Planner', '@Research', '@CTO', '@Backend', '@Frontend', '@Security'],
    description: 'Integrate smart contracts and wallet authentication',
    steps: [
      'Set up blockchain development environment (Hardhat/Foundry)',
      'Develop and test smart contracts',
      'Deploy contracts to testnet/mainnet',
      'Implement wallet connection (RainbowKit/ConnectKit)',
      'Integrate contract interactions in frontend',
      'Implement backend transaction monitoring',
    ],
  },
  admin: {
    name: 'Internal Admin Dashboard',
    agents: ['@Planner', '@CTO', '@Backend', '@Frontend', '@Security'],
    description: 'Build a secure administrative dashboard for internal tools',
    steps: [
      'Define admin RBAC (Role-Based Access Control) policies',
      'Implement secure admin-only API routes',
      'Build data management tables and filters',
      'Implement audit logging for admin actions',
      'Build user/subscription management interface',
      'Set up monitoring and incident response tools',
    ],
  }
};

/**
 * Visualize the agent and step flow for a workflow
 */
export function visualizeWorkflow(workflow) {
    printInfo(chalk.bold.cyan(`\n📊 ${workflow.name} Flow\n`));
    
    printInfo(chalk.bold('Team Handoff:'));
    const agentFlow = workflow.agents.map((a) => {
       const color = ['@Planner', '@CTO'].includes(a) ? chalk.magenta : ['@Backend', '@Frontend'].includes(a) ? chalk.blue : chalk.yellow;
       return color(a);
    }).join(chalk.gray(' → '));
    printInfo('  ' + agentFlow + '\n');

    printInfo(chalk.bold('Execution Path:'));
    if (workflow.steps) {
        workflow.steps.forEach((step, i) => {
            const isLast = i === workflow.steps.length - 1;
            printInfo(`  ${chalk.green('●')} ${step}`);
            if (!isLast) printInfo(`  ${chalk.gray('│')}`);
        });
    }
    console.log('');
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

        const newSection = `\n## Workflow: ${workflow.name}\n` +
            workflow.steps.map(s => `- [ ] ${s}`).join('\n') +
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
  program
    .command('workflow <feature>')
    .description('Show or start workflow for common features (auth, payments, etc.)')
    .option('--viz', 'Visualize the workflow')
    .option('--start', 'Add workflow to implementation plan')
    .action(async (feature, options) => {
      try {
        const workflow = WORKFLOWS[feature.toLowerCase()];

        if (!workflow) {
            const available = Object.keys(WORKFLOWS).join(', ');
            throw new ValidationError(`Workflow "${feature}" not found.`, [`Available: ${available}`]);
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
      workflow.steps.forEach(step => {
        printInfo(chalk.gray(`  • ${step}`));
      });
    }

    printInfo(chalk.bold('\n📚 Documentation:\n'));
    printInfo(`  Guide: ${githubBlobUrl('guides/ADVANCED-WORKFLOWS.md')}\n`);
}