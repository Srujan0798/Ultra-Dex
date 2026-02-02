/**
 * Ultra-Dex Workspace Command
 * Manage multi-project workspaces and cross-project operations
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import ora from 'ora';
import { execSync } from 'child_process';
import Table from 'cli-table3';

const WORKSPACE_FILE = '.ultra-workspace.json';

async function loadWorkspace() {
  try {
    const content = await fs.readFile(path.resolve(process.cwd(), WORKSPACE_FILE), 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function saveWorkspace(data) {
  await fs.writeFile(
    path.resolve(process.cwd(), WORKSPACE_FILE),
    JSON.stringify(data, null, 2)
  );
}

export function registerWorkspaceCommand(program) {
  const workspace = program
    .command('workspace')
    .alias('ws')
    .description('Manage multi-project workspaces');

  workspace
    .command('init <name>')
    .description('Initialize a new multi-project workspace')
    .action(async (name) => {
      console.log(chalk.cyan(`\n🏗️  Initializing Workspace: ${name}\n`));
      
      const wsData = {
        name,
        created: new Date().toISOString(),
        projects: [],
        config: {
          parallel: false
        }
      };

      await saveWorkspace(wsData);
      console.log(chalk.green(`✅ Workspace configuration created: ${WORKSPACE_FILE}`));
    });

  workspace
    .command('add <projectPath>')
    .description('Add an existing project to the workspace')
    .action(async (projectPath) => {
      const ws = await loadWorkspace();
      if (!ws) return console.log(chalk.red('❌ No workspace found. Run "ultra-dex workspace init" first.'));

      const fullPath = path.resolve(projectPath);
      const projectName = path.basename(fullPath);

      // Check if it's an Ultra-Dex project
      try {
        await fs.access(path.join(fullPath, 'CONTEXT.md'));
      } catch {
        console.log(chalk.yellow(`⚠️  Warning: ${projectPath} does not look like an Ultra-Dex project (missing CONTEXT.md)`));
      }

      if (ws.projects.find(p => p.path === fullPath)) {
        return console.log(chalk.yellow('ℹ️  Project already in workspace.'));
      }

      ws.projects.push({
        name: projectName,
        path: fullPath,
        added: new Date().toISOString()
      });

      await saveWorkspace(ws);
      console.log(chalk.green(`✅ Added project "${projectName}" to workspace.`));
    });

  workspace
    .command('list')
    .description('List all projects in the workspace')
    .action(async () => {
      const ws = await loadWorkspace();
      if (!ws) return console.log(chalk.red('❌ No workspace found.'));

      console.log(chalk.bold.blue(`\n📂 Workspace: ${ws.name}\n`));
      
      const table = new Table({
        head: [chalk.cyan('Project'), chalk.cyan('Path'), chalk.cyan('Status'), chalk.cyan('Deps')],
        colWidths: [20, 30, 10, 20]
      });

      for (const p of ws.projects) {
        let status = chalk.green('OK');
        if (p.name === ws.activeProject) status = chalk.blue('ACTIVE');
        
        try {
          await fs.access(p.path);
        } catch {
          status = chalk.red('MISSING');
        }
        
        const deps = p.dependencies?.join(', ') || '-';
        table.push([p.name, p.path, status, deps]);
      }

      console.log(table.toString());
      console.log(chalk.gray(`Total projects: ${ws.projects.length}\n`));
    });

  workspace
    .command('switch <projectName>')
    .alias('use')
    .description('Set the active project in the workspace')
    .action(async (projectName) => {
      const ws = await loadWorkspace();
      if (!ws) return;

      const project = ws.projects.find(p => p.name === projectName);
      if (!project) {
        return console.log(chalk.red(`❌ Project "${projectName}" not found in workspace.`));
      }

      ws.activeProject = projectName;
      await saveWorkspace(ws);
      console.log(chalk.green(`✅ Active project set to: ${projectName}`));
    });

  workspace
    .command('dep <project> <dependency>')
    .description('Add a cross-project dependency')
    .action(async (projectName, depName) => {
      const ws = await loadWorkspace();
      if (!ws) return;

      const project = ws.projects.find(p => p.name === projectName);
      const dependency = ws.projects.find(p => p.name === depName);

      if (!project || !dependency) {
        return console.log(chalk.red('❌ One or both projects not found.'));
      }

      if (!project.dependencies) project.dependencies = [];
      if (!project.dependencies.includes(depName)) {
        project.dependencies.push(depName);
      }

      await saveWorkspace(ws);
      console.log(chalk.green(`✅ Added dependency: ${projectName} depends on ${depName}`));
    });

  workspace
    .command('run <command...>')
    .description('Run an Ultra-Dex command across all projects in the workspace')
    .option('--parallel', 'Run in parallel')
    .action(async (commandParts, options) => {
      const ws = await loadWorkspace();
      if (!ws) return console.log(chalk.red('❌ No workspace found.'));

      const fullCommand = commandParts.join(' ');
      console.log(chalk.cyan(`\n🚀 Running "${fullCommand}" across ${ws.projects.length} projects...\n`));

      const tasks = ws.projects.map(p => async () => {
        console.log(chalk.bold.yellow(`\n📦 Project: ${p.name}`));
        console.log(chalk.gray(`Path: ${p.path}`));
        
        try {
          const cmd = fullCommand.startsWith('ultra-dex') ? fullCommand : `npx ultra-dex ${fullCommand}`;
          execSync(cmd, { cwd: p.path, stdio: 'inherit' });
          return { name: p.name, success: true };
        } catch (e) {
          return { name: p.name, success: false, error: e.message };
        }
      });

      if (options.parallel) {
        await Promise.all(tasks.map(t => t()));
      } else {
        const results = [];
        for (const task of tasks) {
          results.push(await task());
        }
        
        console.log(chalk.bold.blue('\n📊 Summary:'));
        results.forEach(r => {
          const status = r.success ? chalk.green('PASSED') : chalk.red('FAILED');
          console.log(`  - ${r.name.padEnd(20)}: ${status}`);
        });
      }
    });

  workspace
    .command('audit')
    .description('Run audit across all projects in workspace')
    .action(async () => {
      const ws = await loadWorkspace();
      if (!ws) return;
      
      console.log(chalk.cyan(`\n🔍 Auditing all projects in workspace: ${ws.name}\n`));
      
      for (const p of ws.projects) {
        console.log(chalk.bold.yellow(`\n[ AUDIT: ${p.name} ]`));
        try {
          execSync('npx ultra-dex audit --json', { cwd: p.path, stdio: 'pipe' });
          // We could parse JSON and show a nice summary, but for now just run it
          console.log(chalk.green('✅ Audit passed'));
        } catch (e) {
          console.log(chalk.red('❌ Audit failed issues found'));
        }
      }
    });
}

export default { registerWorkspaceCommand };
