import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { githubBlobUrl } from '../config/urls.js';

export const WORKFLOWS = {
  auth: {
    name: 'Authentication',
    agents: ['@Planner', '@Research', '@CTO', '@Database', '@Backend', '@Frontend', '@Security', '@DevOps'],
    description: 'Complete authentication with email/password and OAuth',
    example: 'supabase',
    steps: [
      '1. Define auth strategy',
      '2. Set up database schema',
      '3. Implement API endpoints',
      '4. Build frontend pages',
      '5. Secure routes',
      '6. Verify email/OAuth flows'
    ]
  },
  supabase: {
    name: 'Supabase Authentication Setup',
    agents: ['@Planner', '@Research', '@CTO', '@Database', '@Backend', '@Frontend', '@Security', '@DevOps'],
    description: 'Set up Supabase auth with RLS policies',
    steps: [
      '1. Create Supabase project and get API keys',
      '2. Set up database schema with RLS policies',
      '3. Configure authentication providers (email + Google OAuth)',
      '4. Implement backend auth middleware',
      '5. Build frontend auth UI components',
      '6. Test authentication flow',
    ],
  },
  payments: {
    name: 'Payment Integration (Stripe)',
    agents: ['@Planner', '@Research', '@CTO', '@Database', '@Backend', '@Frontend', '@Testing', '@Security', '@DevOps'],
    description: 'Integrate Stripe for subscriptions and one-time payments',
    steps: [
      '1. Create Stripe account and get API keys',
      '2. Design subscription/payment schema',
      '3. Implement Stripe Checkout API',
      '4. Handle webhooks for payment events',
      '5. Build payment UI with checkout flow',
      '6. Test with Stripe test cards',
    ],
  },
  deployment: {
    name: 'Deployment Pipeline',
    agents: ['@Planner', '@CTO', '@Frontend', '@DevOps'],
    description: 'Deploy to Vercel with staging and production environments',
    example: 'vercel',
    steps: [
        '1. Configure environment',
        '2. Set up CI/CD',
        '3. Deploy to staging',
        '4. Verify staging',
        '5. Promote to production'
    ]
  },
  vercel: {
    name: 'Vercel Deployment Pipeline',
    agents: ['@Planner', '@CTO', '@Frontend', '@DevOps'],
    description: 'Deploy Next.js app to Vercel',
    steps: [
      '1. Set up Vercel project and link Git repository',
      '2. Configure environment variables for staging/production',
      '3. Set up custom domain',
      '4. Configure preview deployments for PRs',
      '5. Set up deployment protection rules',
      '6. Test deployment pipeline',
    ],
  },
  cicd: {
    name: 'GitHub Actions CI/CD',
    agents: ['@Planner', '@CTO', '@Testing', '@DevOps'],
    description: 'Automated testing and deployment with GitHub Actions',
    steps: [
      '1. Create workflow file for CI (tests + lint)',
      '2. Add build verification job',
      '3. Add deployment job for production',
      '4. Configure secrets for deployment',
      '5. Add status badges to README',
      '6. Test workflow on PR',
    ],
  },
  database: {
    name: 'Database Migration',
    agents: ['@Planner', '@CTO', '@Database', '@Backend', '@Testing'],
    description: 'Database schema migration and data sync',
    steps: [
      '1. Design new schema changes',
      '2. Write migration scripts',
      '3. Test migrations in staging',
      '4. Back up production database',
      '5. Run migrations in production',
      '6. Verify data integrity',
    ],
  },
  email: {
    name: 'Email Notification System',
    agents: ['@Planner', '@Research', '@CTO', '@Backend', '@Frontend', '@Testing'],
    description: 'Transactional emails with templates',
    steps: [
      '1. Choose email service (Resend, SendGrid)',
      '2. Set up email templates',
      '3. Implement email API endpoints',
      '4. Add email queue for async sending',
      '5. Test email delivery',
      '6. Monitor deliverability',
    ],
  },
  realtime: {
    name: 'Real-Time Features',
    agents: ['@Planner', '@CTO', '@Backend', '@Frontend', '@Testing'],
    description: 'Live notifications with WebSockets',
    steps: [
      '1. Choose WebSocket library (Socket.io, Pusher)',
      '2. Set up WebSocket server',
      '3. Implement event broadcasting',
      '4. Build frontend listeners',
      '5. Test real-time updates',
      '6. Handle reconnection logic',
    ],
  },
  sentry: {
    name: 'Sentry Error Tracking',
    agents: ['@Planner', '@Research', '@CTO', '@Backend', '@Frontend', '@DevOps'],
    description: 'Error monitoring with Sentry',
    steps: [
      '1. Create Sentry account and project',
      '2. Install Sentry SDKs for frontend and backend',
      '3. Configure error boundaries for React',
      '4. Set up source maps for debugging',
      '5. Configure alerts and notifications',
      '6. Test error capture in development',
    ],
  },
  shopify: {
    name: 'Shopify Product Integration',
    agents: ['@Planner', '@Research', '@CTO', '@Database', '@Backend', '@DevOps'],
    description: 'Sync products from Shopify store',
    steps: [
      '1. Create Shopify Partner account and development store',
      '2. Set up Shopify app with Admin API access',
      '3. Design database schema for products',
      '4. Build product sync endpoint',
      '5. Implement webhook handlers for product updates',
      '6. Schedule full product sync (cron job)',
    ],
  },
  analytics: {
    name: 'PostHog Analytics Integration',
    agents: ['@Planner', '@Research', '@CTO', '@Backend', '@Frontend', '@DevOps'],
    description: 'Track user behavior with PostHog',
    steps: [
      '1. Create PostHog account and project',
      '2. Install PostHog SDKs for frontend and backend',
      '3. Set up core event tracking (signup, login, feature usage)',
      '4. Create conversion funnel dashboard',
      '5. Set up feature flags (optional)',
      '6. Configure user identification',
    ],
  },
};

export function visualizeWorkflow(workflow) {
    console.log(chalk.bold.cyan(`\n📊 ${workflow.name} Flow\n`));
    
    // Agent Flow
    console.log(chalk.bold('Team Handoff:'));
    const agentFlow = workflow.agents.map((a, i) => {
       const color = ['@Planner', '@CTO'].includes(a) ? chalk.magenta : ['@Backend', '@Frontend'].includes(a) ? chalk.blue : chalk.yellow;
       return color(a);
    }).join(chalk.gray(' → '));
    console.log('  ' + agentFlow + '\n');

    // Step Flow
    console.log(chalk.bold('Execution Path:'));
    if (workflow.steps) {
        workflow.steps.forEach((step, i) => {
            const isLast = i === workflow.steps.length - 1;
            const stepName = step.replace(/^\d+\.\s+/, '');
            console.log(`  ${chalk.green('●')} ${stepName}`);
            if (!isLast) console.log(`  ${chalk.gray('│')}`);
        });
    }
    console.log('');
}

export async function startWorkflow(feature) {
    const workflow = WORKFLOWS[feature.toLowerCase()];
    if (!workflow) return false;

    const planPath = path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md');
    try {
        let content = await fs.readFile(planPath, 'utf8');
        
        // Check if already exists
        if (content.includes(`## Workflow: ${workflow.name}`)) {
            console.log(chalk.yellow(`Workflow "${workflow.name}" already exists in the plan.`));
            return true;
        }

        const newSection = `\n## Workflow: ${workflow.name}\n` +
            workflow.steps.map(s => `- [ ] ${s.replace(/^\d+\.\s+/, '')}`).join('\n') +
            '\n';

        await fs.appendFile(planPath, newSection);
        console.log(chalk.green(`✅ Added "${workflow.name}" workflow to IMPLEMENTATION-PLAN.md`));
        return true;
    } catch (e) {
        console.error(chalk.red(`Failed to update plan: ${e.message}`));
        return false;
    }
}

export function registerWorkflowCommand(program) {
  program
    .command('workflow <feature>')
    .description('Show or start workflow for common features (auth, payments, etc.)')
    .option('--viz', 'Visualize the workflow')
    .option('--start', 'Add workflow to implementation plan')
    .action(async (feature, options) => {
      const workflow = WORKFLOWS[feature.toLowerCase()];

      if (!workflow) {
        console.log(chalk.red(`\n❌ Workflow "${feature}" not found.\n`));
        console.log(chalk.gray('Available workflows:'));
        Object.keys(WORKFLOWS).forEach(key => {
          console.log(chalk.cyan(`  - ${key}`) + chalk.gray(` (${WORKFLOWS[key].name})`));
        });
        console.log('\n' + chalk.gray('Usage: ultra-dex workflow <feature>\n'));
        process.exit(1);
      }

      if (options.viz) {
          visualizeWorkflow(workflow);
          return;
      }

      if (options.start) {
          await startWorkflow(feature);
          return;
      }

      // Default View
      console.log(chalk.bold(`\n📋 ${workflow.name} Workflow\n`));
      console.log(chalk.gray(workflow.description));

      console.log(chalk.bold('\n🤖 Agents Involved:\n'));
      workflow.agents.forEach((agent, i) => {
        console.log(chalk.cyan(`  ${i + 1}. ${agent}`));
      });

      if (workflow.steps) {
        console.log(chalk.bold('\n📝 Implementation Steps:\n'));
        workflow.steps.forEach(step => {
          console.log(chalk.gray(`  ${step}`));
        });
      }

      console.log(chalk.bold('\n📚 Full Example:\n'));
      console.log(chalk.blue(`  ${githubBlobUrl('guides/ADVANCED-WORKFLOWS.md')}`));
      console.log(chalk.gray(`  (Search for "Example: ${workflow.name}")\n`));
    });
}
