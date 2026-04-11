import { singleton } from 'tsyringe';

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

/**
 * Environment Detector for Ultra-Dex
 * Detects system capabilities and available tools
 */
@singleton()
export class EnvironmentDetector {
  constructor() {
    this.systemInfo = null;
  }

  /**
   * Get comprehensive system information
   * @returns {Promise<object>} System information
   */
  async getSystemInfo(): Promise<Record<string, unknown>> {
    if (this.systemInfo) {
      return this.systemInfo;
    }

    this.systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length,
      uptime: os.uptime(),
      userInfo: os.userInfo(),
      hostname: os.hostname(),
      tempDir: os.tmpdir(),
      homeDir: os.homedir(),
    };

    return this.systemInfo;
  }

  /**
   * Check if a command-line tool is available
   * @param {string} command - Command to check
   * @returns {Promise<boolean>} True if available
   */
  async isCommandAvailable(command: string): Promise<boolean> {
    try {
      await execAsync(`which ${command} || true`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get version of a command-line tool
   * @param {string} command - Command to check
   * @param {string} versionFlag - Version flag (e.g., '--version', '-v')
   * @returns {Promise<string|null>} Version string or null if not available
   */
  async getCommandVersion(
    command: string,
    versionFlag: string = '--version'
  ): Promise<string | null> {
    try {
      const { stdout } = await execAsync(`${command} ${versionFlag}`);
      return stdout.trim().split('\n')[0]; // Take first line to avoid extra output
    } catch {
      return null;
    }
  }

  /**
   * Detect development environment
   * @returns {Promise<object>} Environment details
   */
  async detectDevEnvironment(): Promise<Record<string, unknown>> {
    const env = {
      node: await this.getNodeInfo(),
      npm: await this.getNpmInfo(),
      git: await this.getGitInfo(),
      docker: await this.getDockerInfo(),
      python: await this.getPythonInfo(),
      system: await this.getSystemInfo(),
      capabilities: {},
    };

    // Detect capabilities
    env.capabilities = await this.detectCapabilities(env);

    return env;
  }

  /**
   * Get Node.js information
   * @returns {Promise<object>} Node info
   */
  async getNodeInfo(): Promise<Record<string, unknown>> {
    const available = await this.isCommandAvailable('node');
    if (!available) {
      return { available: false };
    }

    const version = await this.getCommandVersion('node', '--version');
    const npmVersion = await this.getCommandVersion('npm', '--version');

    return {
      available: true,
      version,
      npmVersion,
      nodePath: await this.getCommandPath('node'),
      packageManager: npmVersion ? 'npm' : null,
    };
  }

  /**
   * Get NPM information
   * @returns {Promise<object>} NPM info
   */
  async getNpmInfo(): Promise<Record<string, unknown>> {
    const available = await this.isCommandAvailable('npm');
    if (!available) {
      return { available: false };
    }

    const version = await this.getCommandVersion('npm', '--version');

    return {
      available: true,
      version,
      npmPath: await this.getCommandPath('npm'),
    };
  }

  /**
   * Get Git information
   * @returns {Promise<object>} Git info
   */
  async getGitInfo(): Promise<Record<string, unknown>> {
    const available = await this.isCommandAvailable('git');
    if (!available) {
      return { available: false };
    }

    const version = await this.getCommandVersion('git', '--version');
    let userEmail = null;
    let userName = null;

    try {
      const { stdout: emailOut } = await execAsync('git config --get user.email');
      userEmail = emailOut.trim();

      const { stdout: nameOut } = await execAsync('git config --get user.name');
      userName = nameOut.trim();
    } catch {
      // Ignore errors if git config isn't set up
    }

    return {
      available: true,
      version,
      userEmail,
      userName,
      gitPath: await this.getCommandPath('git'),
    };
  }

  /**
   * Get Docker information
   * @returns {Promise<object>} Docker info
   */
  async getDockerInfo(): Promise<Record<string, unknown>> {
    const available = await this.isCommandAvailable('docker');
    if (!available) {
      return { available: false };
    }

    let version = null;
    let daemonRunning = false;

    try {
      version = await this.getCommandVersion('docker', '--version');

      // Check if daemon is running
      await execAsync('docker ps');
      daemonRunning = true;
    } catch {
      daemonRunning = false;
    }

    return {
      available: true,
      version,
      daemonRunning,
      dockerPath: await this.getCommandPath('docker'),
    };
  }

  /**
   * Get Python information
   * @returns {Promise<object>} Python info
   */
  async getPythonInfo(): Promise<Record<string, unknown>> {
    const py3Available = await this.isCommandAvailable('python3');
    const py2Available = await this.isCommandAvailable('python');

    if (py3Available) {
      const version = await this.getCommandVersion('python3', '--version');
      return {
        available: true,
        version,
        command: 'python3',
        path: await this.getCommandPath('python3'),
      };
    } else if (py2Available) {
      const version = await this.getCommandVersion('python', '--version');
      return {
        available: true,
        version,
        command: 'python',
        path: await this.getCommandPath('python'),
      };
    }

    return { available: false };
  }

  /**
   * Detect system capabilities
   * @param {object} env - Environment info
   * @returns {Promise<object>} Capabilities
   */
  async detectCapabilities(env: Record<string, unknown>): Promise<Record<string, boolean>> {
    const capabilities = {
      canRunDocker: env.docker?.available && env.docker.daemonRunning,
      canRunNode: env.node?.available,
      canRunPython: env.python?.available,
      hasGit: env.git?.available,
      hasNetwork: await this.checkNetworkConnectivity(),
      hasEnoughMemory: env.system.totalMemory > 1024 * 1024 * 1024, // 1GB
      canWriteFiles: await this.checkWritePermissions(),
      canAccessInternet: await this.checkInternetAccess(),
    };

    return capabilities;
  }

  /**
   * Check network connectivity
   * @returns {Promise<boolean>} True if network is accessible
   */
  async checkNetworkConnectivity(): Promise<boolean> {
    try {
      await execAsync('ping -c 1 -W 1 8.8.8.8 || ping -c 1 -t 1 8.8.8.8');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check internet access
   * @returns {Promise<boolean>} True if internet is accessible
   */
  async checkInternetAccess(): Promise<boolean> {
    try {
      await execAsync('curl -s --connect-timeout 5 https://www.google.com');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check write permissions in current directory
   * @returns {Promise<boolean>} True if writable
   */
  async checkWritePermissions(): Promise<boolean> {
    const testFile = path.join(process.cwd(), '.ultra-dex-write-test');
    try {
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the path of a command
   * @param {string} command - Command to find
   * @returns {Promise<string|null>} Path or null if not found
   */
  async getCommandPath(command: string): Promise<string | null> {
    try {
      const { stdout } = await execAsync(`which ${command}`);
      return stdout.trim();
    } catch {
      return null;
    }
  }

  /**
   * Detect project type based on files in current directory
   * @returns {Promise<string>} Project type
   */
  async detectProjectType(): Promise<string> {
    try {
      const files = await fs.readdir(process.cwd());

      if (files.includes('package.json')) {
        const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));

        if (packageJson.dependencies?.react || packageJson.devDependencies?.react) {
          return 'react';
        }
        if (packageJson.dependencies?.vue || packageJson.devDependencies?.vue) {
          return 'vue';
        }
        if (packageJson.dependencies?.angular || packageJson.devDependencies?.angular) {
          return 'angular';
        }
        if (packageJson.dependencies?.express || packageJson.dependencies?.fastify) {
          return 'express';
        }
        if (packageJson.dependencies?.next) {
          return 'nextjs';
        }
        if (packageJson.dependencies?.nuxt) {
          return 'nuxt';
        }
        if (packageJson.dependencies?.svelte || packageJson.devDependencies?.svelte) {
          return 'svelte';
        }
        return 'node';
      }

      if (files.includes('requirements.txt') || files.includes('setup.py')) {
        return 'python';
      }

      if (files.includes('go.mod')) {
        return 'go';
      }

      if (files.includes('Cargo.toml')) {
        return 'rust';
      }

      if (files.includes('Gemfile')) {
        return 'ruby';
      }

      if (files.includes('composer.json')) {
        return 'php';
      }

      return 'generic';
    } catch {
      return 'generic';
    }
  }

  /**
   * Get detailed environment report
   * @returns {Promise<string>} Environment report
   */
  async getEnvironmentReport(): Promise<string> {
    const env = await this.detectDevEnvironment();
    const projectType = await this.detectProjectType();

    let report = '# Ultra-Dex Environment Report\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n\n`;

    report += '## System Information\n';
    report += `- Platform: ${env.system.platform}\n`;
    report += `- Architecture: ${env.system.arch}\n`;
    report += `- CPUs: ${env.system.cpus}\n`;
    report += `- Total Memory: ${(env.system.totalMemory / (1024 * 1024 * 1024)).toFixed(2)} GB\n`;
    report += `- Free Memory: ${(env.system.freeMemory / (1024 * 1024 * 1024)).toFixed(2)} GB\n\n`;

    report += '## Development Tools\n';
    report += `- Node.js: ${env.node.available ? env.node.version : 'Not found'}\n`;
    report += `- NPM: ${env.npm.available ? env.npm.version : 'Not found'}\n`;
    report += `- Git: ${env.git.available ? env.git.version : 'Not found'}\n`;
    report += `- Docker: ${env.docker.available ? (env.docker.daemonRunning ? env.docker.version : `${env.docker.version} (daemon not running)`) : 'Not found'}\n`;
    report += `- Python: ${env.python.available ? env.python.version : 'Not found'}\n\n`;

    report += '## Capabilities\n';
    report += `- Can run Docker containers: ${env.capabilities.canRunDocker ? 'Yes' : 'No'}\n`;
    report += `- Has network connectivity: ${env.capabilities.hasNetwork ? 'Yes' : 'No'}\n`;
    report += `- Has internet access: ${env.capabilities.canAccessInternet ? 'Yes' : 'No'}\n`;
    report += `- Has sufficient memory: ${env.capabilities.hasEnoughMemory ? 'Yes' : 'No'}\n`;
    report += `- Can write files: ${env.capabilities.canWriteFiles ? 'Yes' : 'No'}\n\n`;

    report += `## Project Type\n`;
    report += `- Detected: ${projectType}\n\n`;

    return report;
  }
}

// Export singleton instance
export const environmentDetector = new EnvironmentDetector();
