// Copyright (c) 2026 Ultra-Dex

/**
 * Template Pack Manager
 * ultra-dex template install [name] - Download verified templates from remote
 */

import fs from 'fs/promises';
import path from 'path';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import https from 'https';

const execAsync = promisify(exec);

// Official Ultra-Dex templates
const OFFICIAL_TEMPLATES = {
  'nextjs-saas': {
    name: 'Next.js SaaS Template',
    description: 'Next.js 15 + Tailwind + Shadcn + NextAuth + Prisma + Stripe',
    repo: 'Srujan0798/Ultra-Dex-Templates',
    branch: 'main',
    path: 'nextjs-saas',
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
    tags: ['nextjs', 'saas', 'fullstack', 'auth', 'payments'],
  },
  'express-api': {
    name: 'Express API Template',
    description: 'Express.js + TypeScript + Prisma + JWT Auth',
    repo: 'Srujan0798/Ultra-Dex-Templates',
    branch: 'main',
    path: 'express-api',
    dependencies: ['express', 'typescript', 'prisma', 'jsonwebtoken', 'bcryptjs'],
    tags: ['express', 'api', 'typescript', 'auth'],
  },
  'react-dashboard': {
    name: 'React Dashboard Template',
    description: 'React + TypeScript + Tailwind + Chart.js + Shadcn',
    repo: 'Srujan0798/Ultra-Dex-Templates',
    branch: 'main',
    path: 'react-dashboard',
    dependencies: ['react', 'react-dom', 'typescript', 'tailwindcss', '@shadcn/ui', 'chart.js'],
    tags: ['react', 'dashboard', 'ui', 'charts'],
  },
  'python-fastapi': {
    name: 'Python FastAPI Template',
    description: 'FastAPI + SQLAlchemy + Pydantic + JWT Auth',
    repo: 'Srujan0798/Ultra-Dex-Templates',
    branch: 'main',
    path: 'python-fastapi',
    dependencies: ['fastapi', 'sqlalchemy', 'pydantic', 'uvicorn', 'python-jose'],
    tags: ['python', 'fastapi', 'api', 'sqlalchemy'],
  },
  'vue-ecommerce': {
    name: 'Vue E-commerce Template',
    description: 'Vue 3 + Vite + Pinia + Tailwind + Stripe',
    repo: 'Srujan0798/Ultra-Dex-Templates',
    branch: 'main',
    path: 'vue-ecommerce',
    dependencies: ['vue', 'vite', 'pinia', 'tailwindcss', 'stripe'],
    tags: ['vue', 'ecommerce', 'shopping', 'payments'],
  },
  minimal: {
    name: 'Minimal Template',
    description: 'Barebones starter with essential files',
    repo: 'Srujan0798/Ultra-Dex-Templates',
    branch: 'main',
    path: 'minimal',
    dependencies: [],
    tags: ['minimal', 'starter', 'basic'],
  },
};

class TemplateManager {
  constructor() {
    this.templatesDir = path.join(process.cwd(), '.ultra', 'templates');
    this.installedTemplates = new Map();
  }

  /**
   * Initialize the template manager
   */
  async initialize() {
    await fs.mkdir(this.templatesDir, { recursive: true });
    await this.loadInstalledTemplates();
  }

  /**
   * Load installed templates from local storage
   */
  async loadInstalledTemplates() {
    try {
      const installedFile = path.join(this.templatesDir, 'installed.json');
      const content = await fs.readFile(installedFile, 'utf8');
      const installed = JSON.parse(content);

      for (const [name, data] of Object.entries(installed)) {
        this.installedTemplates.set(name, data);
      }
    } catch (_error) {
      // File doesn't exist, initialize with empty map
      this.installedTemplates = new Map();
    }
  }

  /**
   * Save installed templates to local storage
   */
  async saveInstalledTemplates() {
    const installedFile = path.join(this.templatesDir, 'installed.json');
    const data = Object.fromEntries(this.installedTemplates);
    await fs.writeFile(installedFile, JSON.stringify(data, null, 2));
  }

  /**
   * Check if a template exists
   */
  templateExists(templateName) {
    return OFFICIAL_TEMPLATES[templateName] || this.installedTemplates.has(templateName);
  }

  /**
   * Get template info
   */
  getTemplateInfo(templateName) {
    return OFFICIAL_TEMPLATES[templateName] || this.installedTemplates.get(templateName);
  }

  /**
   * Install a template from remote repository
   */
  async installTemplate(templateName, options = {}) {
    const template = OFFICIAL_TEMPLATES[templateName];
    if (!template) {
      throw new Error(
        `Template not found: ${templateName}. Use 'ultra-dex template list' to see available templates.`
      );
    }

    const targetDir = options.directory || path.join(process.cwd(), templateName);

    printInfo(chalk.cyan(`📥 Installing template: ${template.name}`));
    printInfo(chalk.gray(`Repository: ${template.repo}`));
    printInfo(chalk.gray(`Target directory: ${targetDir}`));

    // Create target directory
    await fs.mkdir(targetDir, { recursive: true });

    try {
      // Download the template using git clone
      printInfo(chalk.gray('Downloading template files...'));

      const repoUrl = `https://github.com/${template.repo}.git`;
      const tempDir = path.join(this.templatesDir, `temp_${templateName}_${Date.now()}`);

      // Clone the specific branch/path
      const cloneCmd = `git clone --branch ${template.branch} --single-branch --depth 1 --filter=blob:none --sparse "${repoUrl}" "${tempDir}"`;
      await execAsync(cloneCmd);

      // Configure sparse checkout to get only the template path
      await execAsync(`cd "${tempDir}" && git sparse-checkout set "${template.path}"`);

      // Move the template files to target directory
      const templateSrc = path.join(tempDir, template.path);
      const files = await fs.readdir(templateSrc);

      for (const file of files) {
        const srcPath = path.join(templateSrc, file);
        const destPath = path.join(targetDir, file);
        await fs.cp(srcPath, destPath, { recursive: true, force: true });
      }

      // Clean up temp directory
      await fs.rm(tempDir, { recursive: true, force: true });

      // Mark as installed
      const installInfo = {
        name: template.name,
        description: template.description,
        repo: template.repo,
        branch: template.branch,
        path: template.path,
        installedAt: new Date().toISOString(),
        directory: targetDir,
        dependencies: template.dependencies,
      };

      this.installedTemplates.set(templateName, installInfo);
      await this.saveInstalledTemplates();

      printSuccess(chalk.green(`✅ Template installed successfully: ${templateName}`));
      printInfo(chalk.gray(`Location: ${targetDir}`));

      // Install dependencies if requested
      if (options.installDeps) {
        await this.installDependencies(targetDir);
      }

      return {
        success: true,
        template: templateName,
        directory: targetDir,
        dependencies: template.dependencies,
      };
    } catch (error) {
      // Clean up on error
      try {
        await fs.rm(targetDir, { recursive: true, force: true });
      } catch (_cleanupError) {
        // Ignore cleanup errors
      }

      throw new Error(`Failed to install template: ${error.message}`);
    }
  }

  /**
   * Install dependencies for a template
   */
  async installDependencies(projectDir) {
    printInfo(chalk.gray('Installing dependencies...'));

    try {
      // Check if package.json exists
      const packageJsonPath = path.join(projectDir, 'package.json');
      await fs.access(packageJsonPath);

      // Determine package manager
      const hasYarn = await this.checkFileExists(path.join(projectDir, 'yarn.lock'));
      const hasPnpm = await this.checkFileExists(path.join(projectDir, 'pnpm-lock.yaml'));
      const _hasNpm = await this.checkFileExists(path.join(projectDir, 'package-lock.json'));

      let installCmd;
      if (hasYarn) {
        installCmd = 'yarn install';
      } else if (hasPnpm) {
        installCmd = 'pnpm install';
      } else {
        installCmd = 'npm install';
      }

      printInfo(chalk.gray(`Running: ${installCmd}`));
      await execAsync(installCmd, { cwd: projectDir });

      printSuccess(chalk.green('✅ Dependencies installed successfully'));
    } catch (error) {
      printWarning(chalk.yellow(`⚠️  Could not install dependencies: ${error.message}`));
    }
  }

  /**
   * Check if a file exists
   */
  async checkFileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List available templates
   */
  listTemplates(filter = null) {
    let templates = Object.entries(OFFICIAL_TEMPLATES);

    if (filter) {
      templates = templates.filter(
        ([name, template]) =>
          name.toLowerCase().includes(filter.toLowerCase()) ||
          template.name.toLowerCase().includes(filter.toLowerCase()) ||
          template.description.toLowerCase().includes(filter.toLowerCase()) ||
          template.tags.some((tag) => tag.toLowerCase().includes(filter.toLowerCase()))
      );
    }

    return templates.map(([name, template]) => ({
      name,
      ...template,
    }));
  }

  /**
   * List installed templates
   */
  listInstalledTemplates() {
    return Array.from(this.installedTemplates.entries()).map(([name, data]) => ({
      name,
      ...data,
    }));
  }

  /**
   * Search templates by tag
   */
  searchTemplatesByTag(tag) {
    return Object.entries(OFFICIAL_TEMPLATES)
      .filter(([_name, template]) => template.tags.includes(tag))
      .map(([name, template]) => ({
        name,
        ...template,
      }));
  }

  /**
   * Get template details
   */
  async getTemplateDetails(templateName) {
    const template = OFFICIAL_TEMPLATES[templateName];
    if (!template) {
      return null;
    }

    // Try to get additional details from GitHub API
    try {
      const details = await this.fetchTemplateDetails(template);
      return { ...template, ...details };
    } catch (_error) {
      // If GitHub API fails, return basic template info
      return template;
    }
  }

  /**
   * Fetch template details from GitHub API
   */
  async fetchTemplateDetails(template) {
    return new Promise((resolve, reject) => {
      const url = `https://api.github.com/repos/${template.repo}/contents/${template.path}?ref=${template.branch}`;

      https
        .get(
          url,
          {
            headers: {
              'User-Agent': 'Ultra-Dex-CLI',
            },
          },
          (res) => {
            let data = '';

            res.on('data', (chunk) => {
              data += chunk;
            });

            res.on('end', () => {
              try {
                const files = JSON.parse(data);
                resolve({
                  files: files.length,
                  lastUpdated: res.headers['last-modified'] || 'unknown',
                });
              } catch (error) {
                reject(error);
              }
            });
          }
        )
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * Update an installed template
   */
  async updateTemplate(templateName) {
    const installed = this.installedTemplates.get(templateName);
    if (!installed) {
      throw new Error(`Template not installed: ${templateName}`);
    }

    printInfo(chalk.cyan(`🔄 Updating template: ${templateName}`));

    // For now, just reinstall the template
    // In a real implementation, this would pull updates from the repo
    await this.uninstallTemplate(templateName);
    return await this.installTemplate(templateName);
  }

  /**
   * Uninstall a template
   */
  async uninstallTemplate(templateName) {
    const installed = this.installedTemplates.get(templateName);
    if (!installed) {
      throw new Error(`Template not installed: ${templateName}`);
    }

    printInfo(chalk.yellow(`🗑️  Uninstalling template: ${templateName}`));

    // Remove from installed list
    this.installedTemplates.delete(templateName);
    await this.saveInstalledTemplates();

    printSuccess(chalk.green(`✅ Template uninstalled: ${templateName}`));
  }
}

// Global instance
const templateManager = new TemplateManager();

/**
 * Register template command
 */
export function registerTemplateCommand(program) {
  const templateCmd = program
    .command('template')
    .alias('tmpl')
    .description('Template pack manager for project templates');

  templateCmd
    .command('install')
    .description('Install a template from remote')
    .argument('<name>', 'Template name')
    .option('-d, --directory <path>', 'Target directory for template')
    .option('-i, --install-deps', 'Install dependencies after template installation')
    .action(async (name, options) => {
      try {
        await templateManager.initialize();

        if (!templateManager.templateExists(name)) {
          printError(chalk.red(`Template not found: ${name}`));
          printInfo(chalk.gray('Use "ultra-dex template list" to see available templates'));
          return;
        }

        const result = await templateManager.installTemplate(name, options);

        printSuccess(chalk.green(`\n🎉 Template installed successfully!`));
        printInfo(chalk.gray(`Name: ${result.template}`));
        printInfo(chalk.gray(`Directory: ${result.directory}`));
        if (result.dependencies.length > 0) {
          printInfo(chalk.gray(`Dependencies: ${result.dependencies.join(', ')}`));
        }

        printInfo(chalk.cyan(`\nNext steps:`));
        printInfo(chalk.gray(`  cd ${path.basename(result.directory)}`));
        printInfo(chalk.gray(`  npm install  # if not installed with --install-deps`));
        printInfo(chalk.gray(`  npm run dev`));
      } catch (error) {
        printError(chalk.red(`Template installation failed: ${error.message}`));
      }
    });

  templateCmd
    .command('list')
    .description('List available templates')
    .option('-t, --tag <tag>', 'Filter by tag')
    .option('-s, --search <query>', 'Search templates')
    .action(async (options) => {
      try {
        const filter = options.search || options.tag || null;
        const templates = templateManager.listTemplates(filter);

        if (templates.length === 0) {
          printWarning(chalk.yellow('No templates found.'));
          return;
        }

        printSuccess(chalk.green(`Available Templates (${templates.length} found):\n`));

        for (const template of templates) {
          printInfo(chalk.cyan(`${template.name}`));
          printInfo(chalk.gray(`  ${template.description}`));
          printInfo(chalk.gray(`  Tags: ${template.tags.join(', ')}`));
          if (template.dependencies.length > 0) {
            printInfo(
              chalk.gray(
                `  Dependencies: ${template.dependencies.slice(0, 5).join(', ')}${template.dependencies.length > 5 ? '...' : ''}`
              )
            );
          }
          console.log('');
        }
      } catch (error) {
        printError(chalk.red(`Template listing failed: ${error.message}`));
      }
    });

  templateCmd
    .command('installed')
    .description('List installed templates')
    .action(async () => {
      try {
        await templateManager.initialize();
        const installed = templateManager.listInstalledTemplates();

        if (installed.length === 0) {
          printInfo(chalk.gray('No templates installed.'));
          return;
        }

        printSuccess(chalk.green(`Installed Templates (${installed.length}):\n`));

        for (const template of installed) {
          printInfo(chalk.cyan(`${template.name}`));
          printInfo(chalk.gray(`  ${template.description}`));
          printInfo(chalk.gray(`  Location: ${template.directory}`));
          printInfo(
            chalk.gray(`  Installed: ${new Date(template.installedAt).toLocaleDateString()}`)
          );
          console.log('');
        }
      } catch (error) {
        printError(chalk.red(`Installed templates listing failed: ${error.message}`));
      }
    });

  templateCmd
    .command('info')
    .description('Show template details')
    .argument('<name>', 'Template name')
    .action(async (name) => {
      try {
        const details = await templateManager.getTemplateDetails(name);

        if (!details) {
          printError(chalk.red(`Template not found: ${name}`));
          return;
        }

        printSuccess(chalk.green(`${details.name}\n`));
        printInfo(chalk.gray(details.description));
        printInfo(chalk.gray(`Repository: ${details.repo}`));
        printInfo(chalk.gray(`Branch: ${details.branch}`));
        printInfo(chalk.gray(`Tags: ${details.tags.join(', ')}`));
        if (details.dependencies && details.dependencies.length > 0) {
          printInfo(chalk.gray(`Dependencies: ${details.dependencies.join(', ')}`));
        }
        console.log('');
      } catch (error) {
        printError(chalk.red(`Template info retrieval failed: ${error.message}`));
      }
    });

  templateCmd._examples = [
    {
      command: 'ultra-dex template install nextjs-saas',
      description: 'Install Next.js SaaS template',
    },
    { command: 'ultra-dex template list', description: 'List all available templates' },
    { command: 'ultra-dex template list --tag react', description: 'List React-based templates' },
    { command: 'ultra-dex template installed', description: 'Show installed templates' },
    { command: 'ultra-dex template info nextjs-saas', description: 'Show template details' },
  ];
}

export default {
  TemplateManager,
  templateManager,
  OFFICIAL_TEMPLATES,
  registerTemplateCommand,
};
