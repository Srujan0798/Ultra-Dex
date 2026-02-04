#!/usr/bin/env node

/**
 * Integration Automation
 * Automated SDK installation, configuration, and webhook setup
 * Addresses devin_ceo_1.md Gap #9: Missing integration automation
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

// Integration configurations
const INTEGRATIONS = {
  stripe: {
    name: 'Stripe',
    packages: ['stripe'],
    envVars: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PUBLISHABLE_KEY'],
    files: [
      {
        path: 'lib/stripe.ts',
        content: `import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export const getStripeSession = async (priceId: string, domainUrl: string) => {
  return await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: \`\${domainUrl}/success?session_id={CHECKOUT_SESSION_ID}\`,
    cancel_url: \`\${domainUrl}/cancel\`,
  });
};
`
      }
    ],
    webhooks: [
      {
        path: 'app/api/webhooks/stripe/route.ts',
        content: `import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  
  try {
    const event = stripe.webhooks.constructEvent(
      payload, 
      signature, 
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    switch (event.type) {
      case 'checkout.session.completed':
        // Handle successful checkout
        break;
      case 'invoice.payment_succeeded':
        // Handle successful payment
        break;
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }
}
`
      }
    ]
  },
  
  clerk: {
    name: 'Clerk Auth',
    packages: ['@clerk/nextjs'],
    envVars: ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'],
    files: [
      {
        path: 'middleware.ts',
        content: `import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: ['/((?!.+\\.[\\\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
`
      },
      {
        path: 'app/layout.tsx',
        content: `import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  );
}
`
      }
    ]
  },
  
  prisma: {
    name: 'Prisma ORM',
    packages: ['prisma', '@prisma/client'],
    devPackages: ['prisma'],
    envVars: ['DATABASE_URL'],
    scripts: {
      'db:generate': 'prisma generate',
      'db:migrate': 'prisma migrate dev',
      'db:deploy': 'prisma migrate deploy',
      'db:studio': 'prisma studio'
    },
    files: [
      {
        path: 'prisma/schema.prisma',
        content: `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`
      },
      {
        path: 'lib/prisma.ts',
        content: `import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
`
      }
    ]
  },
  
  resend: {
    name: 'Resend Email',
    packages: ['resend'],
    envVars: ['RESEND_API_KEY'],
    files: [
      {
        path: 'lib/email.ts',
        content: `import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
  return await resend.emails.send({
    from: 'onboarding@yourdomain.com',
    to,
    subject,
    html,
  });
}
`
      }
    ]
  },
  
  uploadthing: {
    name: 'UploadThing',
    packages: ['uploadthing', '@uploadthing/react'],
    envVars: ['UPLOADTHING_SECRET', 'UPLOADTHING_APP_ID'],
    files: [
      {
        path: 'lib/uploadthing.ts',
        content: `import { createUploadthing, type FileRouter } from 'uploadthing/next';

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: '4MB' } })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete:', file.url);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
`
      },
      {
        path: 'app/api/uploadthing/route.ts',
        content: `import { createRouteHandler } from 'uploadthing/next';
import { ourFileRouter } from '@/lib/uploadthing';

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
`
      }
    ]
  },
  
  posthog: {
    name: 'PostHog Analytics',
    packages: ['posthog-js'],
    envVars: ['NEXT_PUBLIC_POSTHOG_KEY', 'NEXT_PUBLIC_POSTHOG_HOST'],
    files: [
      {
        path: 'app/providers.tsx',
        content: `'use client';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
    });
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
`
      }
    ]
  },
  
  openai: {
    name: 'OpenAI',
    packages: ['openai'],
    envVars: ['OPENAI_API_KEY'],
    files: [
      {
        path: 'lib/openai.ts',
        content: `import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateCompletion(prompt: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });
  
  return completion.choices[0].message.content;
}
`
      }
    ]
  }
};

// Install packages
async function installPackages(packages, dev = false) {
  const spinner = ora(dev ? 'Installing dev dependencies...' : 'Installing dependencies...').start();
  
  try {
    const cmd = `npm install ${dev ? '--save-dev' : '--save'} ${packages.join(' ')}`;
    execSync(cmd, { stdio: 'pipe' });
    spinner.succeed(chalk.green(`${dev ? 'Dev dependencies' : 'Dependencies'} installed`));
    return true;
  } catch (error) {
    spinner.fail(chalk.red(`Installation failed: ${error.message}`));
    return false;
  }
}

// Create files
async function createFiles(projectPath, files) {
  for (const file of files) {
    const filePath = path.join(projectPath, file.path);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, file.content);
  }
}

// Update package.json scripts
async function updateScripts(projectPath, scripts) {
  const pkgPath = path.join(projectPath, 'package.json');
  const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
  
  pkg.scripts = { ...pkg.scripts, ...scripts };
  
  await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
}

// Update .env.example
async function updateEnvExample(projectPath, envVars) {
  const envPath = path.join(projectPath, '.env.example');
  let content = '';
  
  try {
    content = await fs.readFile(envPath, 'utf-8');
    content += '\n';
  } catch {
    // File doesn't exist yet
  }
  
  content += `# Added by ultra-dex integrate\n`;
  for (const envVar of envVars) {
    if (!content.includes(envVar)) {
      content += `${envVar}=\n`;
    }
  }
  
  await fs.writeFile(envPath, content);
}

// Integrate a service
async function integrateService(serviceKey, projectPath) {
  const integration = INTEGRATIONS[serviceKey];
  if (!integration) {
    throw new Error(`Unknown integration: ${serviceKey}`);
  }
  
  console.log(chalk.blue(`\n🔌 Setting up ${integration.name}...\n`));
  
  // Install packages
  if (integration.packages) {
    await installPackages(integration.packages);
  }
  
  if (integration.devPackages) {
    await installPackages(integration.devPackages, true);
  }
  
  // Create files
  if (integration.files) {
    const spinner = ora('Creating configuration files...').start();
    await createFiles(projectPath, integration.files);
    spinner.succeed(chalk.green('Configuration files created'));
  }
  
  // Create webhook handlers
  if (integration.webhooks) {
    const spinner = ora('Setting up webhook handlers...').start();
    await createFiles(projectPath, integration.webhooks);
    spinner.succeed(chalk.green('Webhook handlers created'));
  }
  
  // Update scripts
  if (integration.scripts) {
    const spinner = ora('Updating package.json scripts...').start();
    await updateScripts(projectPath, integration.scripts);
    spinner.succeed(chalk.green('Scripts updated'));
  }
  
  // Update .env.example
  if (integration.envVars) {
    await updateEnvExample(projectPath, integration.envVars);
  }
  
  console.log(chalk.green(`\n✅ ${integration.name} integrated successfully!`));
  console.log(chalk.yellow('\n⚠️  Next Steps:'));
  console.log(chalk.gray('  1. Add environment variables to .env'));
  if (integration.envVars) {
    integration.envVars.forEach(env => {
      console.log(chalk.gray(`     - ${env}`));
    });
  }
  console.log(chalk.gray('  2. Review and customize the generated files'));
  console.log(chalk.gray('  3. Test the integration'));
  
  return true;
}

// Export registration function
export function registerIntegrateCommand(program) {
  program
    .command('integrate <service>')
    .description('Integrate third-party service (stripe, clerk, prisma, etc.)')
    .option('-p, --project <path>', 'Project root path', '.')
    .option('--list', 'List available integrations')
    .action(async (service, options) => {
      // Validate project path to prevent path traversal
      const resolvedPath = path.resolve(options.project);
      const cwd = process.cwd();
      if (!resolvedPath.startsWith(cwd) && !path.isAbsolute(options.project)) {
        console.error(chalk.red('❌ Error: Invalid project path. Path traversal detected.'));
        process.exit(1);
      }
      
      if (options.list) {
        console.log(chalk.blue('\n📦 Available Integrations\n'));
        
        Object.entries(INTEGRATIONS).forEach(([key, integration]) => {
          console.log(`  ${chalk.cyan(key.padEnd(15))} ${integration.name}`);
          console.log(`     ${chalk.gray('Packages:')} ${integration.packages.join(', ')}`);
          console.log(`     ${chalk.gray('Env vars:')} ${integration.envVars.join(', ')}`);
          console.log();
        });
        
        console.log(chalk.blue('Usage:'));
        console.log(chalk.gray('  npx ultra-dex integrate stripe'));
        console.log(chalk.gray('  npx ultra-dex integrate prisma'));
        process.exit(0);
      }
      
      const projectPath = resolvedPath;
      
      if (!INTEGRATIONS[service]) {
        console.log(chalk.red(`\n❌ Unknown integration: ${service}`));
        console.log(chalk.blue(`\nRun ${chalk.cyan('npx ultra-dex integrate --list')} to see available integrations`));
        process.exit(1);
      }
      
      try {
        await integrateService(service, projectPath);
      } catch (error) {
        console.log(chalk.red(`\n❌ Integration failed: ${error.message}`));
        process.exit(1);
      }
    });
}
