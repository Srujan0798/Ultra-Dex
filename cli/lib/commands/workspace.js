import chalk from 'chalk';
import path from 'path';
import { configManager } from '../utils/config-manager.js';
import fs from 'fs/promises';

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
        } catch {} // Ignore if file doesn't exist yet
        
        globalConfig.workspaces = globalConfig.workspaces || [];
        
        // Remove existing entry for this path
        globalConfig.workspaces = globalConfig.workspaces.filter(w => w.path !== targetDir);
        
        // Add new entry
        globalConfig.workspaces.push({ name, path: targetDir, lastUsed: new Date().toISOString() });
        
        await configManager.saveGlobal(globalConfig);
        console.log(chalk.green(`✅ Added workspace: ${name} (${targetDir})`));
    });

  ws.command('list')
    .description('List tracked workspaces')
    .action(async () => {
        const globalPath = configManager.globalConfigPath;
        try {
            const content = await fs.readFile(globalPath, 'utf8');
            const conf = JSON.parse(content);
            const workspaces = conf.workspaces || [];
            
            console.log(chalk.bold('\n📂 Ultra-Dex Workspaces\n'));
            if (workspaces.length === 0) {
                console.log(chalk.gray('No workspaces tracked. Run `ultra-dex ws add` to track this project.'));
                return;
            }
            
            // Format table nicely
            workspaces.forEach(w => {
                const isCurrent = process.cwd() === w.path;
                const prefix = isCurrent ? chalk.green('➜ ') : '  ';
                console.log(`${prefix}${chalk.bold(w.name)}`);
                console.log(`    Path: ${chalk.gray(w.path)}`);
                console.log(`    Last: ${w.lastUsed}`);
                console.log('');
            });
            
        } catch {
            console.log(chalk.gray('No global configuration found.'));
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
            console.log(chalk.red('No global configuration found.'));
            return;
        }
        
        const initialLen = globalConfig.workspaces?.length || 0;
        
        // Filter by path OR name
        globalConfig.workspaces = (globalConfig.workspaces || []).filter(w => 
            w.path !== path.resolve(target) && w.name !== target
        );
        
        if (globalConfig.workspaces.length < initialLen) {
            await configManager.saveGlobal(globalConfig);
            console.log(chalk.green(`✅ Workspace removed: ${target}`));
        } else {
            console.log(chalk.yellow(`Workspace not found: ${target}`));
        }
    });
}

export default { registerWorkspaceCommand };