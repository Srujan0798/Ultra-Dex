// Ultra-Dex CLI — Interactive TUI Mode
// Handles the "Omni-box" and Natural Language Intent Routing

import inquirer from 'inquirer';
import chalk from 'chalk';
import { renderer } from './renderer.js'; // Use the new renderer
import { theme, stripAnsi } from './theme.js';
import { execSync } from 'child_process';
import { routeIntent } from '../nlp/router.js';
import { context } from '../kernel/context.js'; // Import Intelligence
import { agent } from '../kernel/agent.js'; // Import Agent Runtime
import { tokenBudget } from './TokenBudget.js';

/**
 * Main Interactive Loop
 */
export async function startInteractiveMode() {
    renderer.clearScreen();
    
    // 1. Intelligence Phase: Scan the Environment
    await renderer.thinking('Initializing Neural Link', [
        'Scanning file system...',
        'Analyzing dependency graph...',
        'Checking git status...',
        'Loading token budget...'
    ]);

    const ctx = await context.scan(); // Real scan
    await tokenBudget.init();

    // 2. Pro-level greeting with Context Awareness
    const stackInfo = ctx.stack !== 'unknown' ? `I see we are working on a **${ctx.stack}** project.` : '';
    const gitInfo = ctx.git.branch ? `Active branch: \`${ctx.git.branch}\`` : '';

    await renderer.text(`**Welcome, User.**\n${stackInfo} ${gitInfo}`);
    
    // Display Status Dashboard
    console.log(theme.dim('  ┌' + '─'.repeat(56) + '┐'));
    const statusLine = (label, val) => {
        const padding = 54 - label.length - stripAnsi(val).length;
        console.log(`  │ ${theme.subtitle(label)} ${' '.repeat(Math.max(0, padding))} ${val} │`);
    };
    
    const budget = tokenBudget.getStatusBarData();

    statusLine('STACK', ctx.stack);
    statusLine('BRANCH', ctx.git.branch || 'none');
    statusLine('CHANGES', `${ctx.git.modifiedFiles || 0} files`);
    statusLine('AGENTS', theme.success('17 Online'));
    statusLine(budget.label, budget.value);
    console.log(theme.dim('  └' + '─'.repeat(56) + '┘'));
    console.log('');

    console.log(theme.dim('  (Type a command, ask a question, or use the menu below)'));
    console.log('');

    const choices = [
        { name: `${theme.primary('🚀')}  Start New Project`, value: 'init' },
        { name: `${theme.primary('🧠')}  Generate Implementation Plan`, value: 'generate' },
        { name: `${theme.primary('🔨')}  Start Build Swarm`, value: 'swarm' },
        { name: `${theme.primary('📊')}  Project Status Dashboard`, value: 'status' },
        { name: `${theme.primary('📂')}  Manage Workspaces`, value: 'workspace' },
        { name: `${theme.primary('🔐')}  Identity & Auth`, value: 'auth' },
        { name: `${theme.primary('🔍')}  Browse Agents`, value: 'agents' },
        { name: `${theme.primary('🚑')}  System Doctor`, value: 'doctor' },
        { name: `${theme.primary('📖')}  Read Documentation`, value: 'docs' },
        new inquirer.Separator(),
        { name: `${theme.error('✖')}  Exit`, value: 'exit' }
    ];

    while (true) {
        const { action } = await inquirer.prompt([
            {
                type: 'input',
                name: 'action',
                message: theme.primary('❯'),
                prefix: '',
                suffix: chalk.gray(' [Type or use ↓]')
            }
        ]);

        if (!action.trim()) {
            const { selection } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'selection',
                    message: 'Select an action:',
                    choices,
                    prefix: ''
                }
            ]);
            
            if (selection === 'exit') break;
            await executeCommand(selection);
        } else {
            const intent = routeIntent(action);
            if (intent) {
                if (intent === 'help') {
                    executeCommand('help');
                } else {
                    await executeCommand(intent, action);
                }
            } else {
                renderer.fail(`I didn't quite catch that. Try "init", "build", or "help".`);
                console.log(theme.dim(`  Your input: "${action}"\n`));
            }
        }
    }

    await renderer.text(`**Goodbye.**\nSystems remaining in standby.`);
}

async function executeCommand(cmd, originalInput = '') {
    // 3. Delegate to Intelligent Agent Runtime
    try {
        if (cmd === 'exit') process.exit(0);
        
        if (cmd === 'help') {
            execSync('npx ultra-dex --help', { stdio: 'inherit' });
        } else {
            // Trigger the "Pro" agent loop
            await agent.execute(cmd, originalInput || cmd);
            
            // Actually run the command (simulated integration)
            // execSync(`npx ultra-dex ${cmd}`, { stdio: 'inherit' });
        }
    } catch (e) {
        renderer.fail(`Command execution failed: ${e.message}`);
    }
    
    console.log('');
}