// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import path from 'path';
import { configManager } from '../utils/config-manager.js';
import fs from 'fs/promises';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';

export function registerWorkspaceCommand(program) {
  const ws = program
    .command('workspace')
    .alias('ws')
    .description('Manage multiple Ultra-Dex projects');

  ws.command('add [path]')
    .description('Add current or specified directory to workspaces')
    .action(async (dir) => {
      const targetDir = path.resolve(dir || process.cwd());
      const name = path.basename(targetDir);

      const globalPath = configManager.globalConfigPath;
      let globalConfig = {};
      try {
        const content = await fs.readFile(globalPath, 'utf8');
        globalConfig = JSON.parse(content);
      } catch {
        // Ignore if file doesn't exist yet, but warn if invalid JSON
        if (globalPath) {
          try {
            await fs.access(globalPath);
            printWarning(
              chalk.yellow('Global config exists but is invalid JSON. Resetting workspace list.')
            );
          } catch {}
        }
      }

      globalConfig.workspaces = globalConfig.workspaces || [];

      // Remove existing entry for this path
      globalConfig.workspaces = globalConfig.workspaces.filter((w) => w.path !== targetDir);

      // Add new entry
      globalConfig.workspaces.push({ name, path: targetDir, lastUsed: new Date().toISOString() });

      try {
        await configManager.saveGlobal(globalConfig);
        printSuccess(chalk.green(`✅ Added workspace: ${name} (${targetDir})`));
      } catch (e) {
        printError(chalk.red(`Failed to save workspace config: ${e.message}`));
      }
    });

  ws.command('list')
    .description('List tracked workspaces')
    .action(async () => {
      const globalPath = configManager.globalConfigPath;
      try {
        const content = await fs.readFile(globalPath, 'utf8');
        const conf = JSON.parse(content);
        const workspaces = conf.workspaces || [];

        printInfo(chalk.bold('\n📂 Ultra-Dex Workspaces\n'));
        if (workspaces.length === 0) {
          printInfo(
            chalk.gray('No workspaces tracked. Run `ultra-dex ws add` to track this project.')
          );
          return;
        }

        // Format table nicely
        workspaces.forEach((w) => {
          const isCurrent = process.cwd() === w.path;
          const prefix = isCurrent ? chalk.green('➜ ') : '  ';
          printInfo(`${prefix}${chalk.bold(w.name)}`);
          printInfo(`    Path: ${chalk.gray(w.path)}`);
          printInfo(`    Last: ${w.lastUsed}`);
          printInfo('');
        });
      } catch (error) {
        printError(chalk.red('Failed to load global configuration.'));
        if (process.env.DEBUG) printError(error.message);
      }
    });

  ws.command('remove <path_or_name>')
    .description('Remove a workspace')
    .action(async (target) => {
      const globalPath = configManager.globalConfigPath;
      let globalConfig = {};
      try {
        const content = await fs.readFile(globalPath, 'utf8');
        globalConfig = JSON.parse(content);
      } catch {
        printError(chalk.red('No global configuration found.'));
        return;
      }

      const initialLen = globalConfig.workspaces?.length || 0;

      // Filter by path OR name
      globalConfig.workspaces = (globalConfig.workspaces || []).filter(
        (w) => w.path !== path.resolve(target) && w.name !== target
      );

      if (globalConfig.workspaces.length < initialLen) {
        await configManager.saveGlobal(globalConfig);
        printSuccess(chalk.green(`✅ Workspace removed: ${target}`));
      } else {
        printWarning(chalk.yellow(`Workspace not found: ${target}`));
      }
    });

  ws.command('switch <name>')
    .description('Switch active project context to a workspace')
    .action(async (name) => {
      const globalConfig = await configManager.loadGlobal();
      if (!globalConfig?.workspaces) {
        printError(chalk.red('No workspaces tracked.'));
        return;
      }

      const workspace = globalConfig.workspaces.find((w) => w.name === name);
      if (!workspace) {
        printError(chalk.red(`Workspace "${name}" not found.`));
        return;
      }

      // Update lastUsed
      workspace.lastUsed = new Date().toISOString();
      globalConfig.activeWorkspace = workspace.path;

      await configManager.saveGlobal(globalConfig);

      printSuccess(chalk.green(`✅ Switched to workspace: ${name}`));
      printInfo(chalk.gray(`Active path: ${workspace.path}`));
      printInfo(chalk.cyan(`Note: New commands will use this context if supported.`));
    });
}

export default { registerWorkspaceCommand };
