// Copyright (c) 2026 Ultra-Dex

/**
 * Package Manager Integration
 * Universal package manager abstraction layer
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

const execAsync = promisify(exec);

// Supported package managers
const PACKAGE_MANAGERS = {
  npm: {
    name: 'npm',
    command: 'npm',
    lockFile: 'package-lock.json',
    installCmd: 'npm install',
    addCmd: 'npm install',
    removeCmd: 'npm uninstall',
    runCmd: 'npm run',
    listCmd: 'npm list',
    outdatedCmd: 'npm outdated',
    auditCmd: 'npm audit',
  },
  yarn: {
    name: 'yarn',
    command: 'yarn',
    lockFile: 'yarn.lock',
    installCmd: 'yarn install',
    addCmd: 'yarn add',
    removeCmd: 'yarn remove',
    runCmd: 'yarn',
    listCmd: 'yarn list',
    outdatedCmd: 'yarn outdated',
    auditCmd: 'yarn audit',
  },
  pnpm: {
    name: 'pnpm',
    command: 'pnpm',
    lockFile: 'pnpm-lock.yaml',
    installCmd: 'pnpm install',
    addCmd: 'pnpm add',
    removeCmd: 'pnpm remove',
    runCmd: 'pnpm',
    listCmd: 'pnpm list',
    outdatedCmd: 'pnpm outdated',
    auditCmd: 'pnpm audit',
  },
};

class PackageManager {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.detectedManager = null;
  }

  /**
   * Detect which package manager is being used in the project
   */
  async detectPackageManager() {
    const files = await fs.readdir(this.projectPath);

    // Check for lock files in order of preference
    if (files.includes('pnpm-lock.yaml')) {
      this.detectedManager = PACKAGE_MANAGERS.pnpm;
      return 'pnpm';
    } else if (files.includes('yarn.lock')) {
      this.detectedManager = PACKAGE_MANAGERS.yarn;
      return 'yarn';
    } else if (files.includes('package-lock.json')) {
      this.detectedManager = PACKAGE_MANAGERS.npm;
      return 'npm';
    } else {
      // Default to npm if no lock file found
      this.detectedManager = PACKAGE_MANAGERS.npm;
      return 'npm';
    }
  }

  /**
   * Execute a package manager command
   */
  async executeCommand(command, args = [], options = {}) {
    if (!this.detectedManager) {
      await this.detectPackageManager();
    }

    const fullCommand = `${this.detectedManager.command} ${args.join(' ')}`;
    printInfo(chalk.gray(`Executing: ${fullCommand}`));

    try {
      const result = await execAsync(fullCommand, {
        cwd: this.projectPath,
        ...options,
      });

      return result;
    } catch (error) {
      throw new Error(`Command failed: ${fullCommand}\n${error.stderr || error.message}`);
    }
  }

  /**
   * Install dependencies
   */
  async install(options = {}) {
    if (!this.detectedManager) {
      await this.detectPackageManager();
    }

    printInfo(chalk.cyan(`\n📦 Installing dependencies with ${this.detectedManager.name}...`));

    const installArgs = ['install'];
    if (options.frozenLockfile) {
      if (this.detectedManager.name === 'npm') installArgs.push('--frozen-lockfile');
      else if (this.detectedManager.name === 'yarn') installArgs.push('--frozen-lockfile');
      else if (this.detectedManager.name === 'pnpm') installArgs.push('--frozen-lockfile');
    }

    if (options.production) {
      installArgs.push('--production');
    }

    if (options.ignoreScripts) {
      installArgs.push('--ignore-scripts');
    }

    const { stdout, stderr } = await this.executeCommand(this.detectedManager.command, installArgs);

    if (stdout) printInfo(chalk.gray(stdout));
    if (stderr) printWarning(chalk.yellow(stderr));

    printSuccess(chalk.green(`✅ Dependencies installed with ${this.detectedManager.name}`));
    return { stdout, stderr };
  }

  /**
   * Add a dependency
   */
  async addDependency(packageName, options = {}) {
    if (!this.detectedManager) {
      await this.detectPackageManager();
    }

    printInfo(chalk.cyan(`\n➕ Adding dependency: ${packageName}`));

    const addArgs = [this.detectedManager.name === 'npm' ? 'install' : 'add'];

    if (options.dev) {
      if (this.detectedManager.name === 'npm' || this.detectedManager.name === 'pnpm') {
        addArgs.push('--save-dev');
      } else if (this.detectedManager.name === 'yarn') {
        addArgs.push('--dev');
      }
    }

    if (options.global) {
      addArgs.push('-g');
    }

    if (options.exact) {
      if (this.detectedManager.name === 'npm' || this.detectedManager.name === 'pnpm') {
        addArgs.push('--save-exact');
      } else if (this.detectedManager.name === 'yarn') {
        addArgs.push('--exact');
      }
    }

    if (options.peer) {
      if (this.detectedManager.name === 'yarn') {
        addArgs.push('--peer');
      } else {
        printWarning(chalk.yellow('Peer dependencies only supported with yarn'));
      }
    }

    addArgs.push(packageName);

    const { stdout, stderr } = await this.executeCommand(this.detectedManager.command, addArgs);

    if (stdout) printInfo(chalk.gray(stdout));
    if (stderr) printWarning(chalk.yellow(stderr));

    printSuccess(chalk.green(`✅ Added dependency: ${packageName}`));
    return { stdout, stderr };
  }

  /**
   * Remove a dependency
   */
  async removeDependency(packageName, options = {}) {
    if (!this.detectedManager) {
      await this.detectPackageManager();
    }

    printInfo(chalk.cyan(`\n➖ Removing dependency: ${packageName}`));

    const removeArgs = [this.detectedManager.name === 'npm' ? 'uninstall' : 'remove'];

    if (options.dev) {
      if (this.detectedManager.name === 'yarn') {
        removeArgs.push('--dev');
      } else {
        printWarning(chalk.yellow('Dev flag only applicable to yarn for removal'));
      }
    }

    if (options.global) {
      removeArgs.push('-g');
    }

    removeArgs.push(packageName);

    const { stdout, stderr } = await this.executeCommand(this.detectedManager.command, removeArgs);

    if (stdout) printInfo(chalk.gray(stdout));
    if (stderr) printWarning(chalk.yellow(stderr));

    printSuccess(chalk.green(`✅ Removed dependency: ${packageName}`));
    return { stdout, stderr };
  }

  /**
   * Run a script
   */
  async runScript(scriptName, args = [], options = {}) {
    if (!this.detectedManager) {
      await this.detectPackageManager();
    }

    printInfo(chalk.cyan(`\n🏃 Running script: ${scriptName}`));

    const runArgs = [this.detectedManager.name === 'npm' ? 'run' : '', scriptName, ...args];

    const { stdout, stderr } = await this.executeCommand(this.detectedManager.command, runArgs, {
      stdio: 'inherit', // Pass through stdio for interactive scripts
      ...options,
    });

    return { stdout, stderr };
  }

  /**
   * List installed packages
   */
  async listPackages(options = {}) {
    if (!this.detectedManager) {
      await this.detectPackageManager();
    }

    const listArgs = ['list'];

    if (options.depth !== undefined) {
      listArgs.push(`--depth=${options.depth}`);
    }

    if (options.global) {
      listArgs.push('--global');
    }

    const { stdout } = await this.executeCommand(this.detectedManager.command, listArgs);
    return stdout;
  }

  /**
   * Check for outdated packages
   */
  async checkOutdated(options = {}) {
    if (!this.detectedManager) {
      await this.detectPackageManager();
    }

    const outdatedArgs = [this.detectedManager.name === 'npm' ? 'outdated' : 'outdated'];

    if (options.json) {
      outdatedArgs.push('--json');
    }

    const { stdout } = await this.executeCommand(this.detectedManager.command, outdatedArgs);
    return JSON.parse(stdout);
  }

  /**
   * Audit for security vulnerabilities
   */
  async audit(options = {}) {
    if (!this.detectedManager) {
      await this.detectPackageManager();
    }

    printInfo(chalk.cyan('\n🔍 Auditing for security vulnerabilities...'));

    const auditArgs = [this.detectedManager.name === 'npm' ? 'audit' : 'audit'];

    if (options.auditLevel) {
      if (this.detectedManager.name === 'npm') {
        auditArgs.push(`--audit-level=${options.auditLevel}`); // low, moderate, high, critical
      }
    }

    if (options.json) {
      auditArgs.push('--json');
    }

    const { stdout, _stderr } = await this.executeCommand(this.detectedManager.command, auditArgs);

    const auditResult = options.json ? JSON.parse(stdout) : stdout;

    if (auditResult.vulnerabilities && auditResult.vulnerabilities.length > 0) {
      printWarning(chalk.yellow(`⚠️  Found ${auditResult.vulnerabilities.length} vulnerabilities`));
    } else {
      printSuccess(chalk.green('✅ No security vulnerabilities found'));
    }

    return auditResult;
  }

  /**
   * Update packages
   */
  async update(packages = [], options = {}) {
    if (!this.detectedManager) {
      await this.detectPackageManager();
    }

    printInfo(chalk.cyan('\n🔄 Updating packages...'));

    let updateArgs = [];

    if (this.detectedManager.name === 'npm') {
      updateArgs = ['update', ...packages];
      if (options.global) updateArgs.push('--global');
      if (options.lerna) updateArgs.push('--workspaces'); // For lerna-style updates
    } else if (this.detectedManager.name === 'yarn') {
      if (packages.length > 0) {
        updateArgs = ['up', ...packages];
      } else {
        updateArgs = ['upgrade'];
      }
      if (options.interactive) updateArgs.push('--interactive');
    } else if (this.detectedManager.name === 'pnpm') {
      if (packages.length > 0) {
        updateArgs = ['update', ...packages];
      } else {
        updateArgs = ['update'];
      }
      if (options.global) updateArgs.push('--global');
    }

    const { stdout, stderr } = await this.executeCommand(this.detectedManager.command, updateArgs);

    if (stdout) printInfo(chalk.gray(stdout));
    if (stderr) printWarning(chalk.yellow(stderr));

    printSuccess(chalk.green(`✅ Packages updated with ${this.detectedManager.name}`));
    return { stdout, stderr };
  }

  /**
   * Get current package manager
   */
  getCurrentManager() {
    return this.detectedManager;
  }

  /**
   * Check if a specific package manager is available
   */
  static async isPackageManagerAvailable(managerName) {
    try {
      const { stdout } = await execAsync(`${managerName} --version`);
      return {
        available: true,
        version: stdout.trim(),
      };
    } catch (error) {
      return {
        available: false,
        error: error.message,
      };
    }
  }

  /**
   * Get all available package managers on the system
   */
  static async getAvailableManagers() {
    const available = [];

    for (const [name, config] of Object.entries(PACKAGE_MANAGERS)) {
      const result = await this.isPackageManagerAvailable(config.command);
      if (result.available) {
        available.push({
          name,
          version: result.version,
          command: config.command,
        });
      }
    }

    return available;
  }

  /**
   * Get project dependencies
   */
  async getProjectDependencies() {
    // Read package.json to get declared dependencies
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

    return {
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {},
      peerDependencies: packageJson.peerDependencies || {},
      optionalDependencies: packageJson.optionalDependencies || {},
    };
  }

  /**
   * Get installed package versions
   */
  async getInstalledVersions() {
    const packages = await this.listPackages({ depth: 0 });

    // Parse the output to extract package names and versions
    // This is a simplified parsing - in a real implementation, you'd want more robust parsing
    const lines = packages.split('\n');
    const installed = {};

    for (const line of lines) {
      const match = line.match(/├──\s+([^@]+)@(.+)/);
      if (match) {
        installed[match[1]] = match[2].trim();
      }
    }

    return installed;
  }

  /**
   * Check for dependency conflicts
   */
  async checkConflicts() {
    if (!this.detectedManager) {
      await this.detectPackageManager();
    }

    printInfo(chalk.cyan('\n🔍 Checking for dependency conflicts...'));

    try {
      // Different package managers have different ways to check conflicts
      if (this.detectedManager.name === 'npm') {
        const { stdout } = await execAsync('npm ls --depth=0', { cwd: this.projectPath });

        // Look for error/warning indicators in the output
        const hasErrors =
          stdout.includes('UNMET') || stdout.includes('extraneous') || stdout.includes('invalid');

        if (hasErrors) {
          printWarning(chalk.yellow('⚠️  Potential dependency conflicts detected'));
          return { conflicts: true, details: stdout };
        } else {
          printSuccess(chalk.green('✅ No dependency conflicts detected'));
          return { conflicts: false, details: stdout };
        }
      } else if (this.detectedManager.name === 'yarn') {
        const { stdout } = await execAsync('yarn check --integrity', { cwd: this.projectPath });

        if (!stdout.includes('success')) {
          printWarning(chalk.yellow('⚠️  Potential dependency integrity issues'));
          return { conflicts: true, details: stdout };
        } else {
          printSuccess(chalk.green('✅ Dependency integrity verified'));
          return { conflicts: false, details: stdout };
        }
      } else if (this.detectedManager.name === 'pnpm') {
        const { stdout } = await execAsync('pnpm audit', { cwd: this.projectPath });

        // Check for vulnerabilities in the audit output
        const hasVulnerabilities = stdout.includes('vulnerabilities');

        if (hasVulnerabilities) {
          printWarning(chalk.yellow('⚠️  Potential dependency vulnerabilities detected'));
          return { conflicts: true, details: stdout };
        } else {
          printSuccess(chalk.green('✅ Dependencies verified'));
          return { conflicts: false, details: stdout };
        }
      }
    } catch (error) {
      printError(`Dependency conflict check failed: ${error.message}`);
      return { conflicts: true, error: error.message };
    }
  }

  /**
   * Generate dependency report
   */
  async generateDependencyReport() {
    printInfo(chalk.cyan('\n📋 Generating dependency report...'));

    const [projectDeps, installedVersions, auditResult] = await Promise.all([
      this.getProjectDependencies(),
      this.getInstalledVersions(),
      this.audit({ json: true }).catch(() => ({})), // Don't fail if audit fails
    ]);

    const report = {
      projectPath: this.projectPath,
      packageManager: this.detectedManager.name,
      dependencies: {
        declared: {
          dependencies: Object.keys(projectDeps.dependencies),
          devDependencies: Object.keys(projectDeps.devDependencies),
          peerDependencies: Object.keys(projectDeps.peerDependencies),
          optionalDependencies: Object.keys(projectDeps.optionalDependencies),
        },
        installed: installedVersions,
        mismatched: [],
      },
      audit: auditResult,
      timestamp: new Date().toISOString(),
    };

    // Check for version mismatches
    for (const [pkg, declaredVersion] of Object.entries(projectDeps.dependencies)) {
      const installedVersion = installedVersions[pkg];
      if (installedVersion && !this.satisfiesVersion(declaredVersion, installedVersion)) {
        report.dependencies.mismatched.push({
          package: pkg,
          declared: declaredVersion,
          installed: installedVersion,
        });
      }
    }

    // Generate report in markdown format
    const reportContent = this.formatDependencyReport(report);

    // Save report to file
    const reportPath = path.join(this.projectPath, 'DEPENDENCY-REPORT.md');
    await fs.writeFile(reportPath, reportContent);

    printSuccess(chalk.green(`✅ Dependency report generated: ${reportPath}`));
    return report;
  }

  /**
   * Check if installed version satisfies declared version
   */
  satisfiesVersion(declared, installed) {
    // Simple version check - in a real implementation, you'd want to use semver
    if (declared.startsWith('^')) {
      // Caret range - compatible within major version
      const declaredMajor = declared.slice(1).split('.')[0];
      const installedMajor = installed.split('.')[0];
      return declaredMajor === installedMajor;
    } else if (declared.startsWith('~')) {
      // Tilde range - compatible within minor version
      const declaredParts = declared.slice(1).split('.');
      const installedParts = installed.split('.');
      return declaredParts[0] === installedParts[0] && declaredParts[1] === installedParts[1];
    } else {
      // Exact version match
      return declared === installed;
    }
  }

  /**
   * Format dependency report as markdown
   */
  formatDependencyReport(report) {
    let content = `# Dependency Report\n\n`;
    content += `**Generated:** ${report.timestamp}\n`;
    content += `**Package Manager:** ${report.packageManager}\n`;
    content += `**Project:** ${report.projectPath}\n\n`;

    content += `## Dependencies Declared in package.json\n\n`;

    content += `### Production Dependencies\n`;
    if (report.dependencies.declared.dependencies.length > 0) {
      content += report.dependencies.declared.dependencies
        .map((pkg) => `- ${pkg}: ${report.dependencies.declared.dependencies[pkg] || 'latest'}\n`)
        .join('');
    } else {
      content += `- None\n`;
    }

    content += `\n### Development Dependencies\n`;
    if (report.dependencies.declared.devDependencies.length > 0) {
      content += report.dependencies.declared.devDependencies
        .map(
          (pkg) => `- ${pkg}: ${report.dependencies.declared.devDependencies[pkg] || 'latest'}\n`
        )
        .join('');
    } else {
      content += `- None\n`;
    }

    content += `\n## Installed Versions\n`;
    content += `**Total Packages Installed:** ${Object.keys(report.dependencies.installed).length}\n\n`;

    // Show first 20 packages
    const installedPkgs = Object.entries(report.dependencies.installed).slice(0, 20);
    for (const [pkg, version] of installedPkgs) {
      content += `- ${pkg}: ${version}\n`;
    }

    if (Object.keys(report.dependencies.installed).length > 20) {
      content += `\n... and ${Object.keys(report.dependencies.installed).length - 20} more packages\n`;
    }

    if (report.dependencies.mismatched.length > 0) {
      content += `\n## Version Mismatches\n`;
      content += `**Packages with version mismatches:** ${report.dependencies.mismatched.length}\n\n`;

      for (const mismatch of report.dependencies.mismatched) {
        content += `- **${mismatch.package}**: declared ${mismatch.declared} vs installed ${mismatch.installed}\n`;
      }
    }

    if (report.audit && report.audit.vulnerabilities) {
      content += `\n## Security Audit\n`;
      content += `**Vulnerabilities Found:** ${report.audit.metadata?.vulnerabilities?.total || 0}\n`;

      const vulns = report.audit.metadata?.vulnerabilities || {};
      if (vulns.low) content += `- Low: ${vulns.low}\n`;
      if (vulns.moderate) content += `- Moderate: ${vulns.moderate}\n`;
      if (vulns.high) content += `- High: ${vulns.high}\n`;
      if (vulns.critical) content += `- Critical: ${vulns.critical}\n`;
    }

    content += `\n---\n`;
    content += `*Report generated by Ultra-Dex Package Manager Integration*\n`;

    return content;
  }

  /**
   * Clean install (remove node_modules and reinstall)
   */
  async cleanInstall() {
    printInfo(chalk.cyan('\n🧹 Performing clean install...'));

    // Remove node_modules
    const nodeModulesPath = path.join(this.projectPath, 'node_modules');
    try {
      await fs.rm(nodeModulesPath, { recursive: true, force: true });
      printInfo(chalk.gray('Removed node_modules directory'));
    } catch (_error) {
      printWarning(chalk.yellow('node_modules directory not found, continuing...'));
    }

    // Remove package manager cache
    if (this.detectedManager.name === 'npm') {
      try {
        await execAsync('npm cache clean --force');
        printInfo(chalk.gray('Cleared npm cache'));
      } catch (_error) {
        printWarning(chalk.yellow('Could not clear npm cache'));
      }
    } else if (this.detectedManager.name === 'yarn') {
      try {
        await execAsync('yarn cache clean');
        printInfo(chalk.gray('Cleared yarn cache'));
      } catch (_error) {
        printWarning(chalk.yellow('Could not clear yarn cache'));
      }
    }

    // Reinstall dependencies
    await this.install();

    printSuccess(chalk.green('✅ Clean install completed'));
  }

  /**
   * Migrate between package managers
   */
  async migrateTo(targetManager) {
    if (!PACKAGE_MANAGERS[targetManager]) {
      throw new Error(`Unsupported package manager: ${targetManager}`);
    }

    printInfo(
      chalk.cyan(`\n🔄 Migrating from ${this.detectedManager.name} to ${targetManager}...`)
    );

    // Get current dependencies
    const _projectDeps = await this.getProjectDependencies();

    // Remove current lock file and node_modules
    const lockFile = this.detectedManager.lockFile;
    const lockFilePath = path.join(this.projectPath, lockFile);

    try {
      await fs.unlink(lockFilePath);
      printInfo(chalk.gray(`Removed ${lockFile}`));
    } catch (_error) {
      printWarning(chalk.yellow(`${lockFile} not found, continuing...`));
    }

    // Remove node_modules
    const nodeModulesPath = path.join(this.projectPath, 'node_modules');
    try {
      await fs.rm(nodeModulesPath, { recursive: true, force: true });
      printInfo(chalk.gray('Removed node_modules'));
    } catch (_error) {
      printWarning(chalk.yellow('node_modules directory not found'));
    }

    // Update detected manager
    this.detectedManager = PACKAGE_MANAGERS[targetManager];

    // Install dependencies with new package manager
    await this.install();

    printSuccess(chalk.green(`✅ Migrated to ${targetManager}`));
  }
}

// Global instance
const packageManager = new PackageManager();

/**
 * Register package manager commands
 */
export function registerPackageManagerCommand(program) {
  const pmCmd = program
    .command('package')
    .alias('pkg')
    .description('Universal package manager abstraction');

  pmCmd
    .command('install')
    .description('Install dependencies with detected package manager')
    .option('--frozen-lockfile', 'Fail if lockfile needs updating')
    .option('--production', 'Install production dependencies only')
    .option('--ignore-scripts', 'Skip pre/post install scripts')
    .action(async (options) => {
      try {
        await packageManager.install(options);
      } catch (error) {
        printError(chalk.red(`Install failed: ${error.message}`));
        process.exit(1);
      }
    });

  pmCmd
    .command('add')
    .description('Add a dependency')
    .argument('<package>', 'Package name to add')
    .option('-D, --dev', 'Add as dev dependency')
    .option('-g, --global', 'Add globally')
    .option('-E, --exact', 'Add exact version')
    .option('--peer', 'Add as peer dependency (yarn only)')
    .action(async (pkg, options) => {
      try {
        await packageManager.addDependency(pkg, options);
      } catch (error) {
        printError(chalk.red(`Add dependency failed: ${error.message}`));
        process.exit(1);
      }
    });

  pmCmd
    .command('remove')
    .alias('rm')
    .description('Remove a dependency')
    .argument('<package>', 'Package name to remove')
    .option('-D, --dev', 'Remove from dev dependencies')
    .option('-g, --global', 'Remove globally')
    .action(async (pkg, options) => {
      try {
        await packageManager.removeDependency(pkg, options);
      } catch (error) {
        printError(chalk.red(`Remove dependency failed: ${error.message}`));
        process.exit(1);
      }
    });

  pmCmd
    .command('run')
    .description('Run a script')
    .argument('<script>', 'Script name to run')
    .argument('[args...]', 'Arguments to pass to the script')
    .action(async (script, args) => {
      try {
        await packageManager.runScript(script, args);
      } catch (error) {
        printError(chalk.red(`Run script failed: ${error.message}`));
        process.exit(1);
      }
    });

  pmCmd
    .command('audit')
    .description('Audit dependencies for security vulnerabilities')
    .option('--level <level>', 'Minimum audit level (low, moderate, high, critical)', 'low')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        const result = await packageManager.audit(options);
        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        }
      } catch (error) {
        printError(chalk.red(`Audit failed: ${error.message}`));
        process.exit(1);
      }
    });

  pmCmd
    .command('outdated')
    .description('Check for outdated packages')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        const result = await packageManager.checkOutdated(options);
        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(result);
        }
      } catch (error) {
        printError(chalk.red(`Check outdated failed: ${error.message}`));
        process.exit(1);
      }
    });

  pmCmd
    .command('conflicts')
    .description('Check for dependency conflicts')
    .action(async () => {
      try {
        const result = await packageManager.checkConflicts();
        if (result.conflicts) {
          process.exit(1);
        }
      } catch (error) {
        printError(chalk.red(`Check conflicts failed: ${error.message}`));
        process.exit(1);
      }
    });

  pmCmd
    .command('report')
    .description('Generate dependency report')
    .action(async () => {
      try {
        await packageManager.generateDependencyReport();
      } catch (error) {
        printError(chalk.red(`Generate report failed: ${error.message}`));
        process.exit(1);
      }
    });

  pmCmd
    .command('clean-install')
    .description('Clean install (remove node_modules and reinstall)')
    .action(async () => {
      try {
        await packageManager.cleanInstall();
      } catch (error) {
        printError(chalk.red(`Clean install failed: ${error.message}`));
        process.exit(1);
      }
    });

  pmCmd._examples = [
    {
      command: 'ultra-dex package install',
      description: 'Install dependencies with detected package manager',
    },
    { command: 'ultra-dex package add react --dev', description: 'Add React as dev dependency' },
    { command: 'ultra-dex package remove lodash', description: 'Remove Lodash dependency' },
    { command: 'ultra-dex package run dev', description: 'Run dev script' },
    { command: 'ultra-dex package audit', description: 'Audit for security vulnerabilities' },
    { command: 'ultra-dex package outdated', description: 'Check for outdated packages' },
    { command: 'ultra-dex package conflicts', description: 'Check for dependency conflicts' },
    { command: 'ultra-dex package report', description: 'Generate dependency report' },
    { command: 'ultra-dex package clean-install', description: 'Perform clean install' },
  ];
}

export default {
  PackageManager,
  packageManager,
  registerPackageManagerCommand,
  PACKAGE_MANAGERS,
};
