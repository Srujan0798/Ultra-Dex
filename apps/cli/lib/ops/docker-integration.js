// Copyright (c) 2026 Ultra-Dex

/**
 * Docker Integration
 * Universal Docker orchestration layer
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import inquirer from 'inquirer';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

const execAsync = promisify(exec);

// Docker compose file template
const DOCKER_COMPOSE_TEMPLATE = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "\${PORT:-3000}:3000"
    environment:
      - NODE_ENV=\${NODE_ENV:-development}
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: \${DB_NAME:-myapp}
      POSTGRES_USER: \${DB_USER:-postgres}
      POSTGRES_PASSWORD: \${DB_PASS:-password}
    ports:
      - "\${DB_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "\${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
`;

// Dockerfile template
const DOCKERFILE_TEMPLATE = `FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:18-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy production dependencies
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nextjs:nodejs . .

# Switch to non-root user
USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
`;

class DockerManager {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
  }

  /**
   * Check if Docker is installed and running
   */
  async checkDockerStatus() {
    try {
      // Check if Docker daemon is running
      const { stdout: version } = await execAsync('docker --version');
      printInfo(chalk.gray(`Docker version: ${version.trim()}`));

      // Check if Docker daemon is running
      await execAsync('docker ps');
      printSuccess(chalk.green('✅ Docker is installed and running'));
      return true;
    } catch (_error) {
      printError(chalk.red('❌ Docker is not running or not installed'));
      return false;
    }
  }

  /**
   * Generate Dockerfile
   */
  async generateDockerfile(options = {}) {
    printInfo(chalk.cyan('\n🐳 Generating Dockerfile...\n'));

    const dockerfilePath = path.join(this.projectPath, 'Dockerfile');

    // Check if Dockerfile already exists
    try {
      await fs.access(dockerfilePath);
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: chalk.yellow('Dockerfile already exists. Overwrite?'),
          default: false,
        },
      ]);

      if (!overwrite) {
        printInfo(chalk.gray('Dockerfile generation cancelled.'));
        return dockerfilePath;
      }
    } catch (_error) {
      // Dockerfile doesn't exist, that's fine
    }

    // Use provided template or default
    const dockerfileContent = options.template || DOCKERFILE_TEMPLATE;

    await fs.writeFile(dockerfilePath, dockerfileContent);
    printSuccess(chalk.green(`✅ Dockerfile generated: ${dockerfilePath}`));

    return dockerfilePath;
  }

  /**
   * Generate docker-compose.yml
   */
  async generateComposeFile(options = {}) {
    printInfo(chalk.cyan('\n🐳 Generating docker-compose.yml...\n'));

    const composePath = path.join(this.projectPath, 'docker-compose.yml');

    // Check if docker-compose.yml already exists
    try {
      await fs.access(composePath);
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: chalk.yellow('docker-compose.yml already exists. Overwrite?'),
          default: false,
        },
      ]);

      if (!overwrite) {
        printInfo(chalk.gray('docker-compose.yml generation cancelled.'));
        return composePath;
      }
    } catch (_error) {
      // docker-compose.yml doesn't exist, that's fine
    }

    // Use provided template or default
    const composeContent = options.template || DOCKER_COMPOSE_TEMPLATE;

    await fs.writeFile(composePath, composeContent);
    printSuccess(chalk.green(`✅ docker-compose.yml generated: ${composePath}`));

    return composePath;
  }

  /**
   * Build Docker image
   */
  async buildImage(options = {}) {
    if (!(await this.checkDockerStatus())) {
      throw new Error('Docker is not available');
    }

    printInfo(chalk.cyan('\n🏗️  Building Docker image...\n'));

    const imageName = options.imageName || `ultra-dex-app:${Date.now()}`;
    const dockerfilePath = path.join(this.projectPath, 'Dockerfile');

    // Check if Dockerfile exists
    try {
      await fs.access(dockerfilePath);
    } catch (_error) {
      printWarning(chalk.yellow('Dockerfile not found. Generating default Dockerfile...'));
      await this.generateDockerfile();
    }

    const buildArgs = [
      'build',
      '-t',
      imageName,
      ...(options.dockerfile ? ['-f', options.dockerfile] : []),
      ...(options.noCache ? ['--no-cache'] : []),
      ...(options.platform ? ['--platform', options.platform] : []),
      '.',
    ];

    const buildCmd = `docker ${buildArgs.join(' ')}`;
    printInfo(chalk.gray(`Running: ${buildCmd}`));

    try {
      const { stdout, stderr } = await execAsync(buildCmd, {
        cwd: this.projectPath,
        maxBuffer: 10 * 1024 * 1024,
      }); // 10MB buffer

      if (stdout) printInfo(chalk.gray(stdout));
      if (stderr) printWarning(chalk.yellow(stderr));

      printSuccess(chalk.green(`✅ Docker image built: ${imageName}`));
      return { imageName, stdout, stderr };
    } catch (error) {
      printError(chalk.red(`Docker build failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * Run Docker container
   */
  async runContainer(options = {}) {
    if (!(await this.checkDockerStatus())) {
      throw new Error('Docker is not available');
    }

    printInfo(chalk.cyan('\n🏃 Running Docker container...\n'));

    const imageName = options.imageName || 'ultra-dex-app:latest';
    const containerName = options.containerName || `ultra-dex-${Date.now()}`;

    const runArgs = [
      'run',
      '-d', // Detached mode
      '--name',
      containerName,
      ...(options.port ? ['-p', `${options.port}:${options.port}`] : []),
      ...(options.envFile ? ['--env-file', options.envFile] : []),
      ...(options.volume ? ['-v', `${options.volume}`] : []),
      ...(options.network ? ['--network', options.network] : []),
      ...(options.rm ? ['--rm'] : []), // Remove after exit
      ...(options.interactive ? ['-i'] : []),
      ...(options.tty ? ['-t'] : []),
      ...(options.env ? options.env.flatMap((e) => ['-e', e]) : []),
      imageName,
    ];

    const runCmd = `docker ${runArgs.join(' ')}`;
    printInfo(chalk.gray(`Running: ${runCmd}`));

    try {
      const { stdout, stderr } = await execAsync(runCmd, { cwd: this.projectPath });

      printSuccess(chalk.green(`✅ Container running: ${containerName}`));
      printInfo(chalk.gray(`Container ID: ${stdout.trim()}`));

      return { containerName, containerId: stdout.trim(), stdout, stderr };
    } catch (error) {
      printError(chalk.red(`Docker run failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * Start services with docker-compose
   */
  async startServices(options = {}) {
    if (!(await this.checkDockerStatus())) {
      throw new Error('Docker is not available');
    }

    printInfo(chalk.cyan('\n🚢 Starting services with docker-compose...\n'));

    const composePath = path.join(this.projectPath, 'docker-compose.yml');

    // Check if docker-compose.yml exists
    try {
      await fs.access(composePath);
    } catch (_error) {
      printWarning(
        chalk.yellow('docker-compose.yml not found. Generating default compose file...')
      );
      await this.generateComposeFile();
    }

    const startArgs = [
      'docker-compose',
      ...(options.file ? ['-f', options.file] : ['-f', 'docker-compose.yml']),
      'up',
      ...(options.daemon ? ['-d'] : []), // Detached mode
      ...(options.build ? ['--build'] : []),
      ...(options.forceRecreate ? ['--force-recreate'] : []),
      ...(options.noDeps ? ['--no-deps'] : []),
    ];

    const startCmd = startArgs.join(' ');
    printInfo(chalk.gray(`Running: ${startCmd}`));

    try {
      const { stdout, stderr } = await execAsync(startCmd, { cwd: this.projectPath });

      if (stdout) printInfo(chalk.gray(stdout));
      if (stderr) printWarning(chalk.yellow(stderr));

      printSuccess(chalk.green('✅ Services started with docker-compose'));
      return { stdout, stderr };
    } catch (error) {
      printError(chalk.red(`Docker compose up failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * Stop services with docker-compose
   */
  async stopServices(options = {}) {
    if (!(await this.checkDockerStatus())) {
      throw new Error('Docker is not available');
    }

    printInfo(chalk.cyan('\n🛑 Stopping services with docker-compose...\n'));

    const stopArgs = [
      'docker-compose',
      ...(options.file ? ['-f', options.file] : ['-f', 'docker-compose.yml']),
      'down',
      ...(options.volumes ? ['-v'] : []), // Remove volumes
      ...(options.removeOrphans ? ['--remove-orphans'] : []),
    ];

    const stopCmd = stopArgs.join(' ');
    printInfo(chalk.gray(`Running: ${stopCmd}`));

    try {
      const { stdout, stderr } = await execAsync(stopCmd, { cwd: this.projectPath });

      if (stdout) printInfo(chalk.gray(stdout));
      if (stderr) printWarning(chalk.yellow(stderr));

      printSuccess(chalk.green('✅ Services stopped with docker-compose'));
      return { stdout, stderr };
    } catch (error) {
      printError(chalk.red(`Docker compose down failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * List running containers
   */
  async listContainers(options = {}) {
    if (!(await this.checkDockerStatus())) {
      throw new Error('Docker is not available');
    }

    const listArgs = [
      'ps',
      ...(options.all ? ['-a'] : []), // Show all containers
      '--format',
      '"{{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"',
    ];

    const listCmd = `docker ${listArgs.join(' ')}`;

    try {
      const { stdout } = await execAsync(listCmd);

      const containers = stdout
        .trim()
        .split('\n')
        .slice(1)
        .map((container) => {
          const [id, name, status, ports] = container.split('\t');
          return { id, name, status, ports };
        });

      printSuccess(chalk.green(`\n🐳 Running containers: ${containers.length}\n`));

      if (containers.length > 0) {
        containers.forEach((container) => {
          printInfo(
            chalk.gray(
              `${container.id.substring(0, 12)}\t${container.name}\t${container.status}\t${container.ports}`
            )
          );
        });
      }

      return containers;
    } catch (error) {
      printError(chalk.red(`Docker ps failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get container logs
   */
  async getContainerLogs(containerName, options = {}) {
    if (!(await this.checkDockerStatus())) {
      throw new Error('Docker is not available');
    }

    const logArgs = [
      'logs',
      ...(options.follow ? ['-f'] : []),
      ...(options.tail ? [`--tail=${options.tail}`] : []),
      ...(options.since ? [`--since=${options.since}`] : []),
      containerName,
    ];

    const logCmd = `docker ${logArgs.join(' ')}`;

    try {
      const { stdout, stderr } = await execAsync(logCmd);

      if (stdout) {
        printInfo(chalk.gray('\n📋 Container Logs:\n'));
        console.log(stdout);
      }

      if (stderr) printWarning(chalk.yellow(stderr));

      return { stdout, stderr };
    } catch (error) {
      printError(chalk.red(`Docker logs failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * Execute command in container
   */
  async execInContainer(containerName, command, options = {}) {
    if (!(await this.checkDockerStatus())) {
      throw new Error('Docker is not available');
    }

    const execArgs = [
      'exec',
      ...(options.interactive ? ['-i'] : []),
      ...(options.tty ? ['-t'] : []),
      ...(options.user ? ['--user', options.user] : []),
      containerName,
      ...(Array.isArray(command) ? command : command.split(' ')),
    ];

    const execCmd = `docker ${execArgs.join(' ')}`;
    printInfo(chalk.gray(`Executing in container: ${execCmd}`));

    try {
      const { stdout, stderr } = await execAsync(execCmd);

      if (stdout) console.log(stdout);
      if (stderr) printWarning(chalk.yellow(stderr));

      return { stdout, stderr };
    } catch (error) {
      printError(chalk.red(`Docker exec failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * Remove container
   */
  async removeContainer(containerName, options = {}) {
    if (!(await this.checkDockerStatus())) {
      throw new Error('Docker is not available');
    }

    const removeArgs = [
      'rm',
      ...(options.force ? ['-f'] : []),
      ...(options.volumes ? ['-v'] : []),
      containerName,
    ];

    const removeCmd = `docker ${removeArgs.join(' ')}`;

    try {
      const { stdout, stderr } = await execAsync(removeCmd);

      printSuccess(chalk.green(`✅ Container removed: ${containerName}`));
      return { stdout, stderr };
    } catch (error) {
      printError(chalk.red(`Docker rm failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * Remove image
   */
  async removeImage(imageName, options = {}) {
    if (!(await this.checkDockerStatus())) {
      throw new Error('Docker is not available');
    }

    const removeArgs = ['rmi', ...(options.force ? ['-f'] : []), imageName];

    const removeCmd = `docker ${removeArgs.join(' ')}`;

    try {
      const { stdout, stderr } = await execAsync(removeCmd);

      printSuccess(chalk.green(`✅ Image removed: ${imageName}`));
      return { stdout, stderr };
    } catch (error) {
      printError(chalk.red(`Docker rmi failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get Docker system info
   */
  async getSystemInfo() {
    if (!(await this.checkDockerStatus())) {
      throw new Error('Docker is not available');
    }

    try {
      const [version, info, images, containers] = await Promise.all([
        execAsync('docker version --format "{{json .}}"'),
        execAsync('docker info --format "{{json .}}"'),
        execAsync('docker images --format "{{json .}}"'),
        execAsync('docker ps -a --format "{{json .}}"'),
      ]);

      const systemInfo = {
        version: JSON.parse(version.stdout),
        info: JSON.parse(info.stdout),
        images: images.stdout
          .trim()
          .split('\n')
          .filter(Boolean)
          .map((img) => JSON.parse(img)),
        containers: containers.stdout
          .trim()
          .split('\n')
          .filter(Boolean)
          .map((cont) => JSON.parse(cont)),
      };

      printSuccess(chalk.green('\n🐳 Docker System Information:\n'));
      printInfo(chalk.gray(`Server Version: ${systemInfo.version.Server.Version}`));
      printInfo(chalk.gray(`Client Version: ${systemInfo.version.Client.Version}`));
      printInfo(chalk.gray(`Storage Driver: ${systemInfo.info.Driver}`));
      printInfo(chalk.gray(`Total Images: ${systemInfo.images.length}`));
      printInfo(chalk.gray(`Total Containers: ${systemInfo.containers.length}`));
      printInfo(
        chalk.gray(
          `Running Containers: ${systemInfo.containers.filter((c) => c.State === 'running').length}`
        )
      );

      return systemInfo;
    } catch (error) {
      printError(chalk.red(`Docker system info failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * Prune unused Docker objects
   */
  async pruneSystem(options = {}) {
    if (!(await this.checkDockerStatus())) {
      throw new Error('Docker is not available');
    }

    printInfo(chalk.cyan('\n🧹 Pruning Docker system...\n'));

    const pruneTasks = [];

    if (options.containers || options.all) {
      pruneTasks.push(execAsync('docker container prune -f'));
    }

    if (options.images || options.all) {
      pruneTasks.push(execAsync('docker image prune -f'));
    }

    if (options.volumes || options.all) {
      pruneTasks.push(execAsync('docker volume prune -f'));
    }

    if (options.networks || options.all) {
      pruneTasks.push(execAsync('docker network prune -f'));
    }

    if (pruneTasks.length === 0) {
      // Default to pruning just containers and images
      pruneTasks.push(execAsync('docker container prune -f'));
      pruneTasks.push(execAsync('docker image prune -f'));
    }

    try {
      const results = await Promise.allSettled(pruneTasks);

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          printSuccess(chalk.green(`✅ Pruned Docker objects ${index + 1}`));
        } else {
          printWarning(
            chalk.yellow(`⚠️  Prune task ${index + 1} failed: ${result.reason.message}`)
          );
        }
      });

      printSuccess(chalk.green('\n✅ Docker system pruned'));
      return results;
    } catch (error) {
      printError(chalk.red(`Docker prune failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * Check if a container is running
   */
  async isContainerRunning(containerName) {
    try {
      const { stdout } = await execAsync(
        `docker ps --filter "name=${containerName}" --format "{{.Names}}"`
      );
      return stdout.trim() === containerName;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Wait for container to be ready
   */
  async waitForContainer(containerName, options = {}) {
    const timeout = options.timeout || 60000; // 60 seconds default
    const interval = options.interval || 2000; // 2 seconds default
    const maxAttempts = Math.ceil(timeout / interval);

    printInfo(chalk.gray(`Waiting for container ${containerName} to be ready...`));

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const isRunning = await this.isContainerRunning(containerName);

      if (isRunning) {
        printSuccess(chalk.green(`✅ Container ${containerName} is ready`));
        return true;
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }

    throw new Error(`Container ${containerName} did not become ready within ${timeout}ms`);
  }

  /**
   * Generate Docker configuration based on project type
   */
  async generateDockerConfig(projectType = 'generic', _options = {}) {
    printInfo(chalk.cyan(`\n🐳 Generating Docker configuration for ${projectType} project...\n`));

    let dockerfileContent = '';
    let _composeContent = '';

    switch (projectType.toLowerCase()) {
      case 'nextjs':
        dockerfileContent = `FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./next.config.js

USER nextjs

EXPOSE 3000

ENV NEXT_TELEMETRY_DISABLED 1

CMD ["npm", "start"]
`;
        break;

      case 'express':
        dockerfileContent = `FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine

WORKDIR /app

RUN addgroup -g 1001 -S nodejs
RUN adduser -S expressjs -u 1001

COPY --from=builder --chown=expressjs:nodejs /app/node_modules ./node_modules
COPY --chown=expressjs:nodejs . .

USER expressjs

EXPOSE 3000

CMD ["npm", "start"]
`;
        break;

      case 'react':
        dockerfileContent = `FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;
        break;

      default:
        // Use generic template
        dockerfileContent = DOCKERFILE_TEMPLATE;
    }

    // Write Dockerfile
    const dockerfilePath = path.join(this.projectPath, 'Dockerfile');
    await fs.writeFile(dockerfilePath, dockerfileContent);
    printSuccess(
      chalk.green(`✅ Dockerfile generated for ${projectType} project: ${dockerfilePath}`)
    );

    // Write docker-compose.yml
    const composePath = path.join(this.projectPath, 'docker-compose.yml');
    await fs.writeFile(composePath, DOCKER_COMPOSE_TEMPLATE);
    printSuccess(chalk.green(`✅ docker-compose.yml generated: ${composePath}`));

    return { dockerfile: dockerfilePath, compose: composePath };
  }
}

// Global instance
const dockerManager = new DockerManager();

/**
 * Register Docker commands
 */
export function registerDockerCommand(program) {
  const dockerCmd = program
    .command('docker')
    .alias('container')
    .description('Universal Docker orchestration layer');

  dockerCmd
    .command('init')
    .description('Generate Docker configuration files')
    .option('-t, --type <type>', 'Project type (nextjs, express, react, generic)', 'generic')
    .option('-f, --force', 'Overwrite existing files')
    .action(async (options) => {
      try {
        await dockerManager.generateDockerConfig(options.type, { force: options.force });
      } catch (error) {
        printError(chalk.red(`Docker init failed: ${error.message}`));
        process.exit(1);
      }
    });

  dockerCmd
    .command('build')
    .description('Build Docker image')
    .option('-t, --tag <name>', 'Image name and tag')
    .option('--no-cache', 'Do not use cache when building')
    .option('--platform <platform>', 'Set platform if server is multi-platform capable')
    .action(async (options) => {
      try {
        await dockerManager.buildImage({
          imageName: options.tag,
          noCache: options.noCache,
          platform: options.platform,
        });
      } catch (error) {
        printError(chalk.red(`Docker build failed: ${error.message}`));
        process.exit(1);
      }
    });

  dockerCmd
    .command('run')
    .description('Run Docker container')
    .option('-n, --name <name>', 'Container name')
    .option('-p, --port <port>', 'Port to expose')
    .option('-e, --env <vars...>', 'Environment variables')
    .option('--volume <volume>', 'Volume to mount')
    .option('--network <network>', 'Network to connect to')
    .option('--rm', 'Remove container after exit')
    .action(async (options) => {
      try {
        await dockerManager.runContainer({
          imageName: options.image || 'ultra-dex-app:latest',
          containerName: options.name,
          port: options.port,
          env: options.env,
          volume: options.volume,
          network: options.network,
          rm: options.rm,
        });
      } catch (error) {
        printError(chalk.red(`Docker run failed: ${error.message}`));
        process.exit(1);
      }
    });

  dockerCmd
    .command('up')
    .description('Start services with docker-compose')
    .option('-d, --daemon', 'Run in detached mode')
    .option('-b, --build', 'Build images before starting')
    .option('--force-recreate', 'Recreate containers')
    .action(async (options) => {
      try {
        await dockerManager.startServices({
          daemon: options.daemon,
          build: options.build,
          forceRecreate: options.forceRecreate,
        });
      } catch (error) {
        printError(chalk.red(`Docker compose up failed: ${error.message}`));
        process.exit(1);
      }
    });

  dockerCmd
    .command('down')
    .description('Stop services with docker-compose')
    .option('-v, --volumes', 'Remove volumes')
    .option('--remove-orphans', 'Remove orphaned containers')
    .action(async (options) => {
      try {
        await dockerManager.stopServices({
          volumes: options.volumes,
          removeOrphans: options.removeOrphans,
        });
      } catch (error) {
        printError(chalk.red(`Docker compose down failed: ${error.message}`));
        process.exit(1);
      }
    });

  dockerCmd
    .command('ps')
    .description('List running containers')
    .option('-a, --all', 'Show all containers (including stopped)')
    .action(async (options) => {
      try {
        await dockerManager.listContainers({ all: options.all });
      } catch (error) {
        printError(chalk.red(`Docker ps failed: ${error.message}`));
        process.exit(1);
      }
    });

  dockerCmd
    .command('logs')
    .description('Get container logs')
    .argument('<container>', 'Container name or ID')
    .option('-f, --follow', 'Follow log output')
    .option('--tail <lines>', 'Number of lines to show from end', '100')
    .action(async (container, options) => {
      try {
        await dockerManager.getContainerLogs(container, {
          follow: options.follow,
          tail: parseInt(options.tail),
        });
      } catch (error) {
        printError(chalk.red(`Docker logs failed: ${error.message}`));
        process.exit(1);
      }
    });

  dockerCmd
    .command('exec')
    .description('Execute command in container')
    .argument('<container>', 'Container name or ID')
    .argument('<command...>', 'Command to run')
    .option('-i, --interactive', 'Keep STDIN open')
    .option('-t, --tty', 'Allocate a pseudo-TTY')
    .option('-u, --user <user>', 'Username or UID')
    .action(async (container, command, options) => {
      try {
        await dockerManager.execInContainer(container, command, {
          interactive: options.interactive,
          tty: options.tty,
          user: options.user,
        });
      } catch (error) {
        printError(chalk.red(`Docker exec failed: ${error.message}`));
        process.exit(1);
      }
    });

  dockerCmd
    .command('prune')
    .description('Prune unused Docker objects')
    .option('-c, --containers', 'Prune containers')
    .option('-i, --images', 'Prune images')
    .option('-v, --volumes', 'Prune volumes')
    .option('-n, --networks', 'Prune networks')
    .option('-a, --all', 'Prune all unused objects')
    .action(async (options) => {
      try {
        await dockerManager.pruneSystem({
          containers: options.containers,
          images: options.images,
          volumes: options.volumes,
          networks: options.networks,
          all: options.all,
        });
      } catch (error) {
        printError(chalk.red(`Docker prune failed: ${error.message}`));
        process.exit(1);
      }
    });

  dockerCmd
    .command('status')
    .description('Show Docker system status')
    .action(async () => {
      try {
        await dockerManager.getSystemInfo();
      } catch (error) {
        printError(chalk.red(`Docker status failed: ${error.message}`));
        process.exit(1);
      }
    });

  dockerCmd._examples = [
    { command: 'ultra-dex docker init', description: 'Generate Docker configuration files' },
    { command: 'ultra-dex docker build -t my-app:latest', description: 'Build Docker image' },
    { command: 'ultra-dex docker run -p 3000:3000 my-app', description: 'Run container' },
    { command: 'ultra-dex docker up', description: 'Start services with docker-compose' },
    { command: 'ultra-dex docker down', description: 'Stop services with docker-compose' },
    { command: 'ultra-dex docker ps', description: 'List containers' },
    { command: 'ultra-dex docker logs my-container', description: 'View container logs' },
    { command: 'ultra-dex docker prune --all', description: 'Clean up unused objects' },
    { command: 'ultra-dex docker status', description: 'Show Docker system info' },
  ];
}

export default {
  DockerManager,
  dockerManager,
  registerDockerCommand,
  DOCKERFILE_TEMPLATE,
  DOCKER_COMPOSE_TEMPLATE,
};
