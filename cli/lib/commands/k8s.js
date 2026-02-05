import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import { printInfo, printSuccess, printError } from '../utils/output.js';

const TEMPLATE_ROOT = path.resolve(process.cwd(), 'templates', 'k8s');

async function copyTemplate(name, targetDir) {
  const source = path.join(TEMPLATE_ROOT, name);
  const dest = path.join(targetDir, name);
  await fs.mkdir(targetDir, { recursive: true });
  await fs.copyFile(source, dest);
}

async function updateReplicas(filePath, replicas) {
  const content = await fs.readFile(filePath, 'utf8');
  const updated = content.replace(/replicas:\s*\d+/g, `replicas: ${replicas}`);
  await fs.writeFile(filePath, updated, 'utf8');
}

export function registerK8sCommand(program) {
  const cmd = program.command('k8s').description('Kubernetes manifest generator');

  cmd
    .command('init')
    .description('Generate Kubernetes deployment and service manifests')
    .option('--dir <dir>', 'Target directory', '.')
    .option('--replicas <count>', 'Replica count', '2')
    .action(async (options) => {
      try {
        const targetDir = path.resolve(options.dir);
        await copyTemplate('deployment.yaml', targetDir);
        await copyTemplate('service.yaml', targetDir);
        await updateReplicas(path.join(targetDir, 'deployment.yaml'), Number(options.replicas));
        printSuccess(chalk.green('✅ Kubernetes manifests generated.'));
      } catch (error) {
        printError(chalk.red(`Failed to generate manifests: ${error.message}`));
      }
    });

  cmd
    .command('deploy')
    .description('Update manifests with replica count')
    .option('--dir <dir>', 'Target directory', '.')
    .option('--replicas <count>', 'Replica count', '2')
    .action(async (options) => {
      try {
        const targetDir = path.resolve(options.dir);
        const deploymentPath = path.join(targetDir, 'deployment.yaml');
        await updateReplicas(deploymentPath, Number(options.replicas));
        printSuccess(chalk.green(`✅ Updated replicas to ${options.replicas}.`));
      } catch (error) {
        printError(chalk.red(`Failed to update deployment: ${error.message}`));
      }
    });

  cmd
    .command('templates')
    .description('Show template location')
    .action(() => {
      printInfo(`K8s templates: ${TEMPLATE_ROOT}`);
    });
}
