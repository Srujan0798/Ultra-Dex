// Copyright (c) 2026 Ultra-Dex

/**
 * Scaffold from Plan Command
 * Generates project structure from IMPLEMENTATION-PLAN.md
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { AppError } from '../utils/errors.js';

function detectTechStack(content) {
  const stack = new Set();
  if (/next\.?js/i.test(content)) stack.add('Next.js');
  if (/remix/i.test(content)) stack.add('Remix');
  if (/sveltekit/i.test(content)) stack.add('SvelteKit');
  if (/prisma/i.test(content)) stack.add('Prisma');
  if (/drizzle/i.test(content)) stack.add('Drizzle');
  if (/clerk/i.test(content)) stack.add('Clerk');
  if (/supabase/i.test(content)) stack.add('Supabase');
  if (/postgres|postgresql/i.test(content)) stack.add('PostgreSQL');
  if (/mysql/i.test(content)) stack.add('MySQL');
  if (/mongo/i.test(content)) stack.add('MongoDB');
  return Array.from(stack);
}

/**
 * Parse IMPLEMENTATION-PLAN.md for folder structure and tasks
 */
async function parsePlanStructure() {
  try {
    const planPath = path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md');
    const planContent = await fs.readFile(planPath, 'utf8');

    // Extract sections that contain file/directory information
    const sections = planContent.split(/^##\s+/m);
    const structure = {
      directories: new Set(),
      files: [],
      configFiles: [],
      apiRoutes: [],
      dataModels: [],
      techStack: detectTechStack(planContent),
    };

    // Look for common patterns indicating file structure
    for (const section of sections) {
      const lines = section.split('\n');

      // Find directory structures
      for (const line of lines) {
        // Match directory patterns like "src/", "components/", etc.
        if (line.trim().endsWith('/') && !line.includes('http')) {
          const dirPath = line
            .trim()
            .replace(/[^\w\-_./]/g, '')
            .replace(/\/$/, '');
          if (dirPath) {
            structure.directories.add(dirPath);

            // Add parent directories
            let currentPath = '';
            const parts = dirPath.split('/');
            for (const part of parts) {
              if (part) {
                currentPath = currentPath ? path.join(currentPath, part) : part;
                structure.directories.add(currentPath);
              }
            }
          }
        }

        // Match file patterns like "*.js", "*.ts", etc.
        if (line.match(/\*\.[\w]+|[\w\-_.]+\.(js|ts|jsx|tsx|json|md|css|scss|html)$/)) {
          const filePath = line.trim().replace(/[^\w\-_./]/g, '');
          if (filePath && !filePath.includes('http')) {
            structure.files.push(filePath);
          }
        }

        // Look for API route patterns
        if (line.includes('API') || line.includes('Route') || line.includes('Endpoint')) {
          const apiMatch = line.match(/(GET|POST|PUT|DELETE|PATCH)\s+\/[\w\-_/]+/gi);
          if (apiMatch) {
            for (const match of apiMatch) {
              const [method, route] = match.split(' ');
              structure.apiRoutes.push({ method, route });
            }
          }
        }

        // Look for data model patterns
        if (line.includes('model') || line.includes('schema') || line.includes('table')) {
          structure.dataModels.push(line.trim());
        }
      }
    }

    return structure;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new AppError('IMPLEMENTATION-PLAN.md not found in current directory', {
        code: 'PLAN_NOT_FOUND',
      });
    }
    throw error;
  }
}

/**
 * Create directory structure
 */
async function createDirectories(directories) {
  const createdDirs = [];

  for (const dir of directories) {
    const dirPath = path.resolve(process.cwd(), dir);
    try {
      await fs.mkdir(dirPath, { recursive: true });
      createdDirs.push(dir);
    } catch (error) {
      printWarning(chalk.yellow(`⚠️  Could not create directory: ${dir} (${error.message})`));
    }
  }

  return createdDirs;
}

/**
 * Create empty files with TO-DO comments
 */
async function createFiles(files, options = {}) {
  const createdFiles = [];
  const force = Boolean(options.force);

  for (const filePath of files) {
    const fullPath = path.resolve(process.cwd(), filePath);

    // Skip if file already exists
    try {
      await fs.access(fullPath);
      if (!force) {
        printWarning(chalk.yellow(`⚠️  File already exists, skipping: ${filePath}`));
        continue;
      }
    } catch {
      // File doesn't exist, proceed to create
    }

    try {
      // Create directory if it doesn't exist
      const dirPath = path.dirname(fullPath);
      await fs.mkdir(dirPath, { recursive: true });

      // Create file with TO-DO comment
      const ext = path.extname(filePath).toLowerCase();
      let content = '';

      if (ext === '.js' || ext === '.ts' || ext === '.jsx' || ext === '.tsx') {
        content = `// TO-DO: Implement ${path.basename(filePath, ext)}
// Generated from IMPLEMENTATION-PLAN.md

`;
      } else if (ext === '.json') {
        content = '{}\n';
      } else if (ext === '.md') {
        content = `# ${path.basename(filePath, ext)}

<!-- Generated from IMPLEMENTATION-PLAN.md -->

`;
      } else {
        content = '# TO-DO: Implement this file\n# Generated from IMPLEMENTATION-PLAN.md\n\n';
      }

      await fs.writeFile(fullPath, content);
      createdFiles.push(filePath);
    } catch (error) {
      printWarning(chalk.yellow(`⚠️  Could not create file: ${filePath} (${error.message})`));
    }
  }

  return createdFiles;
}

/**
 * Create configuration files
 */
async function createConfigFiles(options = {}) {
  const configs = {
    '.env.example': `# Environment variables for the project
# Copy to .env and fill in values

NODE_ENV=development
PORT=3000
DATABASE_URL=
JWT_SECRET=
`,
    'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
`,
    'package.json': `{
  "name": "new-project",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "dev": "node index.js",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "keywords": [],
  "author": "",
  "license": "MIT"
}
`,
    '.gitignore': `node_modules
dist
build
.env
*.log
.DS_Store
`,
  };

  const createdConfigs = [];

  const force = Boolean(options.force);

  for (const [filename, content] of Object.entries(configs)) {
    const filePath = path.resolve(process.cwd(), filename);

    try {
      await fs.access(filePath);
      if (!force) {
        printWarning(chalk.yellow(`⚠️  Config file already exists, skipping: ${filename}`));
        continue;
      }
    } catch {
      // File doesn't exist, proceed to write
    }

    await fs.writeFile(filePath, content);
    createdConfigs.push(filename);
  }

  return createdConfigs;
}

/**
 * Generate Prisma schema from data model section
 */
async function generatePrismaSchema(dataModels, options = {}) {
  const allowDefault = Boolean(options.allowDefault);
  if (dataModels.length === 0 && !allowDefault) return null;

  const schemaPath = path.resolve(process.cwd(), 'prisma', 'schema.prisma');
  const force = Boolean(options.force);

  try {
    await fs.access(schemaPath);
    if (!force) {
      printWarning(chalk.yellow(`⚠️  Prisma schema already exists, skipping generation`));
      return null;
    }
  } catch {
    // Schema doesn't exist, proceed to create
  }

  // Create prisma directory
  await fs.mkdir(path.dirname(schemaPath), { recursive: true });

  let schemaContent = `// Generated from IMPLEMENTATION-PLAN.md data models
// Prisma schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;

  const models = dataModels.length > 0 ? dataModels : ['User'];

  // Generate basic models from data models
  for (const model of models) {
    const modelName = model
      .replace(/[^a-zA-Z0-9_]/g, ' ')
      .split(' ')
      .filter((word) => word.length > 0)
      .map((word, index) =>
        index === 0
          ? word.charAt(0).toUpperCase() + word.slice(1)
          : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join('');

    if (modelName) {
      schemaContent += `model ${modelName} {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // TO-DO: Add fields based on IMPLEMENTATION-PLAN.md
}

`;
    }
  }

  await fs.writeFile(schemaPath, schemaContent);
  return schemaPath;
}

/**
 * Create Prisma client helper if Prisma is detected
 */
async function ensurePrismaClientFile(options = {}) {
  const force = Boolean(options.force);
  const dbPath = path.resolve(process.cwd(), 'src', 'lib', 'db.ts');

  try {
    await fs.access(dbPath);
    if (!force) {
      return null;
    }
  } catch {
    // File doesn't exist, proceed to create
  }

  await fs.mkdir(path.dirname(dbPath), { recursive: true });

  const content = `import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
`;

  await fs.writeFile(dbPath, content);
  return dbPath;
}

/**
 * Create placeholder API routes from plan endpoints
 */
async function createApiRoutes(apiRoutes, options = {}) {
  if (apiRoutes.length === 0) return [];

  const routesDir = path.resolve(process.cwd(), 'src', 'routes');
  await fs.mkdir(routesDir, { recursive: true });

  const createdRoutes = [];
  const force = Boolean(options.force);

  for (const { method, route } of apiRoutes) {
    const cleanRoute = route
      .replace(/[{}]/g, '')
      .replace(/^\//, '')
      .replace(/\//g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .toLowerCase();

    const fileName = `${cleanRoute}.js`;
    const filePath = path.join(routesDir, fileName);

    try {
      await fs.access(filePath);
      if (!force) {
        printWarning(chalk.yellow(`⚠️  API route already exists, skipping: ${fileName}`));
        continue;
      }
    } catch {
      // File doesn't exist, proceed to create
    }

    const content = `// API Route: ${method} ${route}
// Generated from IMPLEMENTATION-PLAN.md

export default async function handler(req, res) {
  // TO-DO: Implement ${method} ${route} endpoint
  // Generated from IMPLEMENTATION-PLAN.md
  
  try {
    switch (req.method) {
      case '${method.toUpperCase()}':
        // TO-DO: Handle ${method.toUpperCase()} request
        res.status(200).json({ message: '${method.toUpperCase()} ${route} pending implementation' });
        break;
      default:
        res.setHeader('Allow', ['${method.toUpperCase()}']);
        res.status(405).end(\`Method \${req.method} Not Allowed\`);
    }
  } catch (error) {
    console.error('API Route Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
`;

    await fs.writeFile(filePath, content);
    createdRoutes.push(fileName);
  }

  return createdRoutes;
}

/**
 * Main scaffold command
 */
export async function scaffoldFromPlan(options = {}) {
  try {
    printInfo(chalk.cyan('\n🏗️  Ultra-Dex Plan-Based Scaffolding\n'));
    printInfo(chalk.cyan('Scaffolding from Implementation Plan...\n'));

    if (options.dryRun) {
      printInfo(chalk.yellow('📝 DRY RUN MODE - No files will be created\n'));
    }

    // Parse the plan structure
    printInfo(chalk.blue('🔍 Parsing IMPLEMENTATION-PLAN.md...'));
    const structure = await parsePlanStructure();
    const usesPrisma = (structure.techStack || []).some((tech) => tech.toLowerCase() === 'prisma');
    const detectedStack =
      structure.techStack && structure.techStack.length > 0
        ? structure.techStack.join(', ')
        : 'Unknown';
    printInfo(chalk.green(`✅ Detected Tech Stack: ${detectedStack}\n`));

    if (options.dryRun) {
      printInfo(chalk.green(`✅ Would create ${structure.directories.size} directories`));
      printInfo(chalk.green(`✅ Would create ${structure.files.length} files`));
      printInfo(chalk.green(`✅ Would create ${structure.configFiles.length} config files`));
      printInfo(chalk.green(`✅ Would create ${structure.apiRoutes.length} API routes`));
      printInfo(chalk.green(`✅ Would generate ${structure.dataModels.length} data models`));
      if (usesPrisma) {
        printInfo(chalk.green('✅ Would generate Prisma schema and db client'));
      }
      return;
    }

    if (options.prismaOnly) {
      printInfo(chalk.blue('🗄️  Generating Prisma schema (prisma-only)...'));
      const schemaPath = await generatePrismaSchema(structure.dataModels, {
        ...options,
        allowDefault: usesPrisma,
      });
      if (schemaPath) {
        printSuccess(chalk.green(`✅ Created Prisma schema at ${schemaPath}\n`));
      }
      if (usesPrisma) {
        const dbPath = await ensurePrismaClientFile(options);
        if (dbPath) {
          printSuccess(chalk.green(`✅ Created Prisma client at ${dbPath}\n`));
        }
      }
      return;
    }

    if (options.apiOnly) {
      printInfo(chalk.blue('🌐 Creating API route placeholders (api-only)...'));
      const createdRoutes = await createApiRoutes(structure.apiRoutes, options);
      printSuccess(chalk.green(`✅ Created ${createdRoutes.length} API route files\n`));
      return;
    }

    // Create directories
    printInfo(chalk.blue('📁 Creating directory structure...'));
    const createdDirs = await createDirectories(structure.directories);
    printSuccess(chalk.green(`✅ Created ${createdDirs.length} directories\n`));

    // Create files
    printInfo(chalk.blue('📄 Creating files with TO-DO comments...'));
    const createdFiles = await createFiles(structure.files, options);
    printSuccess(chalk.green(`✅ Created ${createdFiles.length} files\n`));

    // Create config files
    printInfo(chalk.blue('⚙️  Creating configuration files...'));
    const createdConfigs = await createConfigFiles(options);
    printSuccess(chalk.green(`✅ Created ${createdConfigs.length} config files\n`));

    // Generate Prisma schema
    if (structure.dataModels.length > 0 || usesPrisma) {
      printInfo(chalk.blue('🗄️  Generating Prisma schema...'));
      const schemaPath = await generatePrismaSchema(structure.dataModels, {
        ...options,
        allowDefault: usesPrisma,
      });
      if (schemaPath) {
        printSuccess(chalk.green(`✅ Created Prisma schema at ${schemaPath}\n`));
      } else {
        printInfo(chalk.gray('ℹ️  Skipped Prisma schema generation\n'));
      }
      if (usesPrisma) {
        const dbPath = await ensurePrismaClientFile(options);
        if (dbPath) {
          printSuccess(chalk.green(`✅ Created Prisma client at ${dbPath}\n`));
        }
      }
    }

    // Create API routes
    if (structure.apiRoutes.length > 0) {
      printInfo(chalk.blue('🌐 Creating API route placeholders...'));
      const createdRoutes = await createApiRoutes(structure.apiRoutes, options);
      printSuccess(chalk.green(`✅ Created ${createdRoutes.length} API route files\n`));
    }

    printSuccess(chalk.bold.green('✅ Scaffolding Complete'));
    printSuccess(chalk.bold.green('🎉 Scaffolding completed successfully!\n'));
    printInfo(chalk.gray('Next steps:'));
    printInfo(chalk.gray('  1. Review generated files and implement TO-DOs'));
    printInfo(chalk.gray('  2. Update configuration files with your values'));
    printInfo(chalk.gray('  3. Run your project to verify structure'));
  } catch (error) {
    await handleError(error, { command: 'scaffold', options });
    process.exit(error.exitCode || 1);
  }
}

/**
 * Register the scaffold command with Commander
 */
export function registerScaffoldPlanCommand(program) {
  program
    .command('scaffold-plan')
    .description('Generate project structure from IMPLEMENTATION-PLAN.md')
    .option('--dry-run', 'Show what would be created without making changes')
    .option('--prisma-only', 'Only generate Prisma schema from data models')
    .option('--api-only', 'Only generate API route placeholders')
    .option('--force', 'Overwrite existing files where possible')
    .action(async (options) => {
      await scaffoldFromPlan(options);
    });
}
