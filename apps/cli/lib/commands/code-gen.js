// Copyright (c) 2026 Ultra-Dex

// Copyright (c) 2026 Ultra-Dex

/**
 * Code Generator Command
 * Generates actual application code from IMPLEMENTATION-PLAN.md
 * Addresses devin_ceo_1.md Gap #1: No automated code generation infrastructure
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from '../utils/ora.js';
import { marked } from 'marked';
import { logger } from '../utils/logger.js';

// Parse IMPLEMENTATION-PLAN.md to extract structured data
async function parseImplementationPlan(planPath) {
  const content = await fs.readFile(planPath, 'utf-8');
  const tokens = marked.lexer(content);

  const sections = {
    techStack: {},
    dataModel: [],
    apiBlueprint: [],
    components: [],
    auth: {},
    payments: {},
  };

  let currentSection = null;

  for (const token of tokens) {
    if (token.type === 'heading' && token.depth === 2) {
      const title = token.text.toUpperCase();
      if (title.includes('TECH') && title.includes('STACK')) currentSection = 'techStack';
      else if (title.includes('DATA') && title.includes('MODEL')) currentSection = 'dataModel';
      else if (title.includes('API') && title.includes('BLUEPRINT'))
        currentSection = 'apiBlueprint';
      else currentSection = null;
      continue;
    }

    if (!currentSection) continue;

    if (currentSection === 'techStack' && token.type === 'text') {
      const frontendMatch = token.text.match(/Frontend:\s*([^\n]+)/i);
      const databaseMatch = token.text.match(/Database:\s*([^\n]+)/i);
      const authMatch = token.text.match(/Auth:\s*([^\n]+)/i);
      const paymentsMatch = token.text.match(/Payments?:\s*([^\n]+)/i);
      const hostingMatch = token.text.match(/Hosting:\s*([^\n]+)/i);

      if (frontendMatch) sections.techStack.frontend = frontendMatch[1].trim();
      if (databaseMatch) sections.techStack.database = databaseMatch[1].trim();
      if (authMatch) sections.techStack.auth = authMatch[1].trim();
      if (paymentsMatch) sections.techStack.payments = paymentsMatch[1].trim();
      if (hostingMatch) sections.techStack.hosting = hostingMatch[1].trim();
    }

    if (currentSection === 'dataModel' && token.type === 'text') {
      const entityMatch = token.text.match(/\*\*([^*]+) Entity:\*\*/i);
      if (entityMatch) {
        // The next token might be the code block
        const nextTokenIdx = tokens.indexOf(token) + 1;
        const nextToken = tokens[nextTokenIdx];
        if (nextToken && nextToken.type === 'code' && nextToken.lang === 'json') {
          try {
            sections.dataModel.push({
              name: entityMatch[1].trim(),
              schema: JSON.parse(nextToken.text),
            });
          } catch (e) {
            /* ignore invalid json */
          }
        }
      }
    }

    if (currentSection === 'apiBlueprint' && token.type === 'text') {
      const endpointMatch = token.text.match(/(GET|POST|PUT|DELETE|PATCH)\s+(`[^`]+`|\/[^\s]+)/i);
      if (endpointMatch) {
        sections.apiBlueprint.push({
          method: endpointMatch[1].toUpperCase(),
          path: endpointMatch[2].replace(/`/g, ''),
          description: token.text.split('\n')[1]?.substring(0, 100) || '',
        });
      }
    }
  }

  // Set defaults if missing
  if (!sections.techStack.frontend) sections.techStack.frontend = 'Next.js';
  if (!sections.techStack.database) sections.techStack.database = 'PostgreSQL';

  return sections;
}

// Generate Prisma schema
async function generatePrismaSchema(dataModel, outputPath) {
  let schema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;

  for (const entity of dataModel) {
    schema += `model ${entity.name} {
  id        String   @id @default(uuid())
`;

    for (const [field, type] of Object.entries(entity.schema)) {
      if (field === 'id') continue;

      let prismaType = 'String';
      let optional = '';
      let constraints = '';

      if (type.includes('uuid')) prismaType = 'String';
      else if (type.includes('boolean')) prismaType = 'Boolean';
      else if (type.includes('timestamp')) prismaType = 'DateTime';
      else if (type.includes('int')) prismaType = 'Int';
      else if (type.includes('float') || type.includes('decimal')) prismaType = 'Float';

      if (type.includes('nullable')) optional = '?';
      if (type.includes('unique')) constraints = ' @unique';

      schema += `  ${field} ${prismaType}${optional}${constraints}\n`;
    }

    schema += `  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

`;
  }

  await fs.writeFile(outputPath, schema);
  return schema;
}

// Generate API routes
async function generateAPIRoutes(apiBlueprint, techStack, outputPath) {
  const isNextJS = techStack.frontend?.toLowerCase().includes('next');

  if (isNextJS) {
    // Generate Next.js App Router API routes
    await fs.mkdir(path.join(outputPath, 'app', 'api'), { recursive: true });

    for (const endpoint of apiBlueprint) {
      const routePath = endpoint.path.replace(/^\/api/, '');
      const segments = routePath.split('/').filter(Boolean);

      if (segments.length === 0) continue;

      const routeDir = path.join(outputPath, 'app', 'api', ...segments);
      await fs.mkdir(routeDir, { recursive: true });

      const routeCode = `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ${endpoint.method} ${endpoint.path}
// ${endpoint.description}

export async function ${endpoint.method.toLowerCase()}(request: NextRequest) {
  try {
    // Implement ${endpoint.method} ${endpoint.path} logic here
    const body = await request.json();
    
    // Add your implementation here
    
    return NextResponse.json({ success: true, data: body }, { status: 200 });
  } catch (error) {
    logger.error('Error in ${endpoint.method} ${endpoint.path}:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
`;

      await fs.writeFile(path.join(routeDir, 'route.ts'), routeCode);
    }
  } else {
    // Generate Express routes
    let routesCode = `import express from 'express';
import { prisma } from '../prisma';

const router = express.Router();

`;

    for (const endpoint of apiBlueprint) {
      routesCode += `// ${endpoint.method} ${endpoint.path}
// ${endpoint.description}
router.${endpoint.method.toLowerCase()}('${endpoint.path}', async (req, res) => {
  try {
    // Implement ${endpoint.method} ${endpoint.path} logic here
    const data = req.body;
    
    // Add your implementation here
    
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

`;
    }

    routesCode += `export default router;\n`;

    await fs.mkdir(path.join(outputPath, 'routes'), { recursive: true });
    await fs.writeFile(path.join(outputPath, 'routes', 'api.ts'), routesCode);
  }
}

// Generate React components
async function generateComponents(components, techStack, outputPath) {
  const isNextJS = techStack.frontend?.toLowerCase().includes('next');
  const componentsDir = path.join(outputPath, isNextJS ? 'app/components' : 'src/components');

  await fs.mkdir(componentsDir, { recursive: true });

  // Generate base components
  const baseComponents = [
    {
      name: 'Button',
      code: `'use client';

import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false,
  type = 'button'
}: ButtonProps) {
  const baseStyles = 'px-4 py-2 rounded font-medium transition-colors';
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={\`\${baseStyles} \${variantStyles[variant]} \${disabled ? 'opacity-50 cursor-not-allowed' : ''}\`}
    >
      {children}
    </button>
  );
}
`,
    },
    {
      name: 'Input',
      code: `'use client';

import React from 'react';

interface InputProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function Input({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
  error
}: InputProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        placeholder={placeholder}
        required={required}
        className={\`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 \${
          error ? 'border-red-500' : 'border-gray-300'
        }\`}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
`,
    },
    {
      name: 'Card',
      code: `import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function Card({ children, title, className = '' }: CardProps) {
  return (
    <div className={\`bg-white rounded-lg shadow-md p-6 \${className}\`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      )}
      {children}
    </div>
  );
}
`,
    },
  ];

  for (const component of baseComponents) {
    await fs.writeFile(path.join(componentsDir, `${component.name}.tsx`), component.code);
  }

  // Generate index.ts
  const indexCode =
    baseComponents.map((c) => `export { ${c.name} } from './${c.name}';`).join('\n') + '\n';
  await fs.writeFile(path.join(componentsDir, 'index.ts'), indexCode);
}

// Generate auth system
async function generateAuthSystem(authProvider, techStack, outputPath) {
  const isNextJS = techStack.frontend?.toLowerCase().includes('next');
  const isClerk = authProvider.toLowerCase().includes('clerk');
  const isNextAuth = authProvider.toLowerCase().includes('nextauth');

  if (isNextJS && isClerk) {
    // Generate Clerk setup
    const clerkMiddleware = `import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
`;

    const authLayout = `import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  );
}
`;

    const signInPage = `import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return <SignIn />;
}
`;

    await fs.writeFile(path.join(outputPath, 'middleware.ts'), clerkMiddleware);

    const authDir = path.join(outputPath, 'app', '(auth)');
    await fs.mkdir(authDir, { recursive: true });
    await fs.writeFile(path.join(authDir, 'layout.tsx'), authLayout);

    const signInDir = path.join(authDir, 'sign-in', '[[...sign-in]]');
    await fs.mkdir(signInDir, { recursive: true });
    await fs.writeFile(path.join(signInDir, 'page.tsx'), signInPage);

    const signUpDir = path.join(authDir, 'sign-up', '[[...sign-up]]');
    await fs.mkdir(signUpDir, { recursive: true });
    await fs.writeFile(path.join(signUpDir, 'page.tsx'), signInPage.replace('SignIn', 'SignUp'));
  } else if (isNextJS && isNextAuth) {
    // Generate NextAuth setup
    const authConfig = `import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
`;

    const authRoute = `import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
`;

    await fs.mkdir(path.join(outputPath, 'lib'), { recursive: true });
    await fs.writeFile(path.join(outputPath, 'lib', 'auth.ts'), authConfig);

    const authRouteDir = path.join(outputPath, 'app', 'api', 'auth', '[...nextauth]');
    await fs.mkdir(authRouteDir, { recursive: true });
    await fs.writeFile(path.join(authRouteDir, 'route.ts'), authRoute);
  }
}

// Generate payment integration
async function generatePayments(paymentProvider, techStack, outputPath) {
  const isStripe = paymentProvider.toLowerCase().includes('stripe');

  if (isStripe) {
    const stripeConfig = `import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export const getStripeSession = async ({
  priceId,
  domainUrl,
  customerId,
}: {
  priceId: string;
  domainUrl: string;
  customerId?: string;
}) => {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    billing_address_collection: 'auto',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: \`\${domainUrl}/success?session_id={CHECKOUT_SESSION_ID}\`,
    cancel_url: \`\${domainUrl}/cancel\`,
    subscription_data: {
      trial_period_days: 14,
    },
  });
  
  return session;
};
`;

    const checkoutAPI = `import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { priceId } = await request.json();
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: \`\${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}\`,
      cancel_url: \`\${process.env.NEXT_PUBLIC_APP_URL}/cancel\`,
    });
    
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    logger.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
`;

    const webhookAPI = `import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    
    switch (event.type) {
      case 'checkout.session.completed':
        // Handle successful checkout
        break;
      case 'invoice.payment_succeeded':
        // Handle successful payment
        break;
      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        break;
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}
`;

    await fs.mkdir(path.join(outputPath, 'lib'), { recursive: true });
    await fs.writeFile(path.join(outputPath, 'lib', 'stripe.ts'), stripeConfig);

    const checkoutDir = path.join(outputPath, 'app', 'api', 'checkout');
    await fs.mkdir(checkoutDir, { recursive: true });
    await fs.writeFile(path.join(checkoutDir, 'route.ts'), checkoutAPI);

    const webhookDir = path.join(outputPath, 'app', 'api', 'webhooks', 'stripe');
    await fs.mkdir(webhookDir, { recursive: true });
    await fs.writeFile(path.join(webhookDir, 'route.ts'), webhookAPI);
  }
}

// Export registration function
export function registerCodeGenCommand(program) {
  const codeGen = program
    .command('code-gen')
    .description('Generate actual application code from IMPLEMENTATION-PLAN.md')
    .option('-p, --plan <path>', 'Path to implementation plan', 'IMPLEMENTATION-PLAN.md')
    .option('-o, --output <path>', 'Output directory', '.')
    .option('--db-only', 'Generate only database schema')
    .option('--api-only', 'Generate only API routes')
    .option('--components-only', 'Generate only React components')
    .option('--auth-only', 'Generate only auth system')
    .option('--payments-only', 'Generate only payments integration')
    .option('--preview', 'Preview what will be generated without creating files')
    .action(async (options) => {
      const spinner = ora('Reading implementation plan...').start();

      try {
        const planPath = path.resolve(options.plan);
        const outputPath = path.resolve(options.output);

        // Check if plan exists
        try {
          await fs.access(planPath);
        } catch {
          spinner.fail(chalk.red(`Implementation plan not found: ${planPath}`));
          logger.warn('Run "npx ultra-dex init" first to create an implementation plan.');
          process.exit(1);
        }

        // Parse plan
        const sections = await parseImplementationPlan(planPath);
        spinner.succeed('Parsed implementation plan');

        if (options.preview) {
          logger.header('Implementation Plan Analysis');
          logger.info('Tech Stack:');
          logger.info(`  Frontend: ${sections.techStack.frontend || 'Not specified'}`);
          logger.info(`  Database: ${sections.techStack.database || 'Not specified'}`);
          logger.info(`  Auth: ${sections.techStack.auth || 'Not specified'}`);
          logger.info(`  Payments: ${sections.techStack.payments || 'Not specified'}`);

          logger.info(`Data Models: ${sections.dataModel.length}`);
          sections.dataModel.forEach((entity) => {
            logger.info(`  - ${entity.name}`);
          });

          logger.info(`API Endpoints: ${sections.apiBlueprint.length}`);
          sections.apiBlueprint.slice(0, 5).forEach((api) => {
            logger.info(`  - ${api.method} ${api.path}`);
          });
          if (sections.apiBlueprint.length > 5) {
            logger.info(`  ... and ${sections.apiBlueprint.length - 5} more`);
          }

          logger.warn('\n✨ Run without --preview to create these files');
          return;
        }

        // Generate based on options
        const generationSpinner = ora('Generating code...').start();

        if (
          !options.apiOnly &&
          !options.componentsOnly &&
          !options.authOnly &&
          !options.paymentsOnly
        ) {
          // Generate database schema
          const schemaPath = path.join(outputPath, 'prisma', 'schema.prisma');
          await fs.mkdir(path.dirname(schemaPath), { recursive: true });
          await generatePrismaSchema(sections.dataModel, schemaPath);
        }

        if (
          !options.dbOnly &&
          !options.componentsOnly &&
          !options.authOnly &&
          !options.paymentsOnly
        ) {
          // Generate API routes
          await generateAPIRoutes(sections.apiBlueprint, sections.techStack, outputPath);
        }

        if (!options.dbOnly && !options.apiOnly && !options.authOnly && !options.paymentsOnly) {
          // Generate components
          await generateComponents(sections.components, sections.techStack, outputPath);
        }

        if (
          !options.dbOnly &&
          !options.apiOnly &&
          !options.componentsOnly &&
          !options.paymentsOnly
        ) {
          // Generate auth system
          await generateAuthSystem(sections.techStack.auth, sections.techStack, outputPath);
        }

        if (!options.dbOnly && !options.apiOnly && !options.componentsOnly && !options.authOnly) {
          // Generate payments
          await generatePayments(sections.techStack.payments, sections.techStack, outputPath);
        }

        generationSpinner.succeed(chalk.green('Code generated successfully!'));

        logger.log(chalk.blue('\n📁 Generated Files:'));
        if (
          !options.apiOnly &&
          !options.componentsOnly &&
          !options.authOnly &&
          !options.paymentsOnly
        ) {
          logger.log(chalk.gray('  - prisma/schema.prisma'));
        }
        if (
          !options.dbOnly &&
          !options.componentsOnly &&
          !options.authOnly &&
          !options.paymentsOnly
        ) {
          logger.log(chalk.gray('  - app/api/*/route.ts'));
        }
        if (!options.dbOnly && !options.apiOnly && !options.authOnly && !options.paymentsOnly) {
          logger.log(chalk.gray('  - app/components/*.tsx'));
        }
        if (
          !options.dbOnly &&
          !options.apiOnly &&
          !options.componentsOnly &&
          !options.paymentsOnly
        ) {
          logger.log(chalk.gray('  - middleware.ts (auth)'));
        }
        if (!options.dbOnly && !options.apiOnly && !options.componentsOnly && !options.authOnly) {
          logger.log(chalk.gray('  - lib/stripe.ts'));
        }

        logger.log(chalk.yellow('\n⚠️  Next Steps:'));
        logger.log(
          chalk.gray(
            '  1. Install dependencies: npm install @prisma/client next-auth @clerk/nextjs stripe'
          )
        );
        logger.log(chalk.gray('  2. Set up environment variables in .env'));
        logger.log(chalk.gray('  3. Run migrations: npx prisma migrate dev'));
        logger.log(chalk.gray('  4. Review and customize the generated code'));
      } catch (error) {
        spinner.fail(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}
