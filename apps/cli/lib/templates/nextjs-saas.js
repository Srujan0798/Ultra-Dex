// Copyright (c) 2026 Ultra-Dex

/**
 * Next.js SaaS Template
 * Next.js 15 + Tailwind + Shadcn + NextAuth + Prisma + Stripe
 */

import fs from 'fs/promises';
import path from 'path';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import chalk from 'chalk';

class NextJSSaaSTemplate {
  constructor() {
    this.templateName = 'nextjs-saas';
    this.templateDir = path.join(process.cwd(), '.ultra', 'templates', this.templateName);
  }

  /**
   * Generate the Next.js SaaS template
   */
  async generate(projectName, options = {}) {
    const projectDir = path.join(process.cwd(), projectName);

    printInfo(chalk.cyan(`🚀 Generating Next.js SaaS Template: ${projectName}`));

    // Create project directory
    await fs.mkdir(projectDir, { recursive: true });

    // Create directory structure
    await this.createDirectoryStructure(projectDir);

    // Create package.json
    await this.createPackageJson(projectDir, projectName);

    // Create Next.js configuration
    await this.createNextConfig(projectDir);

    // Create Tailwind configuration
    await this.createTailwindConfig(projectDir);

    // Create Prisma schema
    await this.createPrismaSchema(projectDir);

    // Create NextAuth configuration
    await this.createNextAuthConfig(projectDir);

    // Create main application files
    await this.createApplicationFiles(projectDir);

    // Create sample components
    await this.createComponents(projectDir);

    // Create sample pages
    await this.createPages(projectDir);

    // Create utility files
    await this.createUtils(projectDir);

    printSuccess(chalk.green(`✅ Next.js SaaS template generated successfully!`));
    printInfo(chalk.gray(`Project location: ${projectDir}`));

    return {
      success: true,
      projectDir,
      dependencies: [
        'next',
        'react',
        'react-dom',
        'tailwindcss',
        '@shadcn/ui',
        'next-auth',
        'prisma',
        'stripe',
      ],
    };
  }

  /**
   * Create directory structure
   */
  async createDirectoryStructure(baseDir) {
    const directories = [
      path.join(baseDir, 'app'),
      path.join(baseDir, 'app', 'api'),
      path.join(baseDir, 'app', 'api', 'auth', '[...nextauth]'),
      path.join(baseDir, 'app', 'api', 'stripe'),
      path.join(baseDir, 'app', 'dashboard'),
      path.join(baseDir, 'app', 'pricing'),
      path.join(baseDir, 'app', 'auth'),
      path.join(baseDir, 'components'),
      path.join(baseDir, 'components', 'ui'),
      path.join(baseDir, 'lib'),
      path.join(baseDir, 'prisma'),
      path.join(baseDir, 'public'),
      path.join(baseDir, 'styles'),
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Create package.json
   */
  async createPackageJson(baseDir, projectName) {
    const packageJson = {
      name: projectName,
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
        'db:push': 'prisma db push',
        'db:studio': 'prisma studio',
        'stripe:listen': 'stripe listen --forward-to=localhost:3000/api/stripe/webhook',
      },
      dependencies: {
        next: '^15.0.0',
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        '@types/node': 'latest',
        '@types/react': 'latest',
        '@types/react-dom': 'latest',
        typescript: 'latest',
        tailwindcss: '^3.4.0',
        autoprefixer: '^10.4.16',
        postcss: '^8.4.31',
        prisma: '^5.6.0',
        '@prisma/client': '^5.6.0',
        'next-auth': '^4.24.5',
        '@auth/prisma-adapter': '^2.0.0',
        stripe: '^14.5.0',
        '@radix-ui/react-slot': '^1.0.2',
        '@radix-ui/react-dropdown-menu': '^2.0.6',
        '@radix-ui/react-navigation-menu': '^1.1.4',
        'class-variance-authority': '^0.7.0',
        clsx: '^2.0.0',
        'tailwind-merge': '^2.0.0',
        'lucide-react': '^0.294.0',
      },
      devDependencies: {
        '@types/bcryptjs': '^2.4.6',
        bcryptjs: '^2.4.3',
      },
    };

    await fs.writeFile(path.join(baseDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  }

  /**
   * Create next.config.js
   */
  async createNextConfig(baseDir) {
    const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
  },
};

module.exports = nextConfig;
`;

    await fs.writeFile(path.join(baseDir, 'next.config.js'), nextConfig);
  }

  /**
   * Create tailwind.config.js
   */
  async createTailwindConfig(baseDir) {
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
`;

    await fs.writeFile(path.join(baseDir, 'tailwind.config.js'), tailwindConfig);
  }

  /**
   * Create Prisma schema
   */
  async createPrismaSchema(baseDir) {
    const prismaSchema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String   @id @default(cuid())
  name           String?
  email          String   @unique
  emailVerified  DateTime?
  image          String?
  password       String?
  role           String   @default("USER")
  stripeId       String?
  credits        Int      @default(10)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  accounts       Account[]
  sessions       Session[]
  subscriptions  Subscription[]
}

model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String?
  access_token       String?
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String?
  session_state      String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  id         String @id @default(cuid())
  identifier String
  token      String @unique
  expires    DateTime
}

model Subscription {
  id            String   @id @default(cuid())
  userId        String
  stripeId      String   @unique
  stripePriceId String
  stripeCustomerId String
  status        String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
`;

    await fs.mkdir(path.join(baseDir, 'prisma'), { recursive: true });
    await fs.writeFile(path.join(baseDir, 'prisma', 'schema.prisma'), prismaSchema);
  }

  /**
   * Create NextAuth configuration
   */
  async createNextAuthConfig(baseDir) {
    const authConfig = `import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await compare(credentials.password as string, user.password);

        if (!isValid) {
          return null;
        }

        return user;
      }
    })
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.role = user.role;
      session.user.stripeId = user.stripeId;
      session.user.credits = user.credits;
      return session;
    }
  },
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/auth/login',
  }
});
`;

    await fs.writeFile(
      path.join(baseDir, 'app', 'api', 'auth', '[...nextauth]', 'route.ts'),
      authConfig
    );
  }

  /**
   * Create main application files
   */
  async createApplicationFiles(baseDir) {
    // Create middleware
    const middleware = `import { auth } from '@/auth';
import NextAuth from 'next-auth';

const { auth: middleware } = NextAuth({});

export default middleware;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
`;

    await fs.writeFile(path.join(baseDir, 'middleware.ts'), middleware);

    // Create auth helper
    const authHelper = `import { auth } from '@/auth';

export const currentUser = async () => {
  const session = await auth();
  return session?.user;
};

export const currentRole = async () => {
  const session = await auth();
  return session?.user?.role;
};
`;

    await fs.writeFile(path.join(baseDir, 'auth.ts'), authHelper);
  }

  /**
   * Create sample components
   */
  async createComponents(baseDir) {
    // Create a sample button component
    const buttonComponent = `import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
`;

    await fs.writeFile(path.join(baseDir, 'components', 'ui', 'button.tsx'), buttonComponent);
  }

  /**
   * Create sample pages
   */
  async createPages(baseDir) {
    // Create main page
    const mainPage = `import { Button } from "@/components/ui/button";
import { currentUser } from "@/auth";
import Link from "next/link";

export default async function HomePage() {
  const user = await currentUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to Your SaaS
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            A modern SaaS application built with Next.js, Tailwind CSS, and more.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <>
                <Button asChild size="lg">
                  <Link href="/auth/register">Get Started</Link>
                </Button>
                <Button variant="outline" asChild size="lg">
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </>
            ) : (
              <Button asChild size="lg">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
`;

    await fs.writeFile(path.join(baseDir, 'app', 'page.tsx'), mainPage);
  }

  /**
   * Create utility files
   */
  async createUtils(baseDir) {
    const utilsContent = `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`;

    await fs.writeFile(path.join(baseDir, 'lib', 'utils.ts'), utilsContent);
  }
}

/**
 * Register Next.js SaaS template command
 */
export function registerNextJSSaaSTemplateCommand(program) {
  program
    .command('nextjs-saas')
    .description('Generate Next.js SaaS template')
    .argument('<name>', 'Project name')
    .option('-d, --directory <path>', 'Project directory')
    .action(async (name, options) => {
      try {
        const generator = new NextJSSaaSTemplate();
        const result = await generator.generate(name, options);

        printSuccess(chalk.green(`\n🎉 Next.js SaaS template created successfully!`));
        printInfo(chalk.gray(`Project: ${result.projectDir}`));
        printInfo(chalk.gray(`Dependencies: ${result.dependencies.join(', ')}`));

        printInfo(chalk.cyan(`\nNext steps:`));
        printInfo(chalk.gray(`  cd ${name}`));
        printInfo(chalk.gray(`  npm install`));
        printInfo(chalk.gray(`  npx prisma db push`));
        printInfo(chalk.gray(`  npm run dev`));
      } catch (error) {
        printError(chalk.red(`Template generation failed: ${error.message}`));
      }
    });
}

export default {
  NextJSSaaSTemplate,
  registerNextJSSaaSTemplateCommand,
};
