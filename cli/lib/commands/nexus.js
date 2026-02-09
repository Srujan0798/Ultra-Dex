// Copyright (c) 2026 Ultra-Dex
// Project Nexus CLI Command

import { wasmRuntime } from '../wasm/runtime.js';
import path from 'path';
import chalk from 'chalk';

export function registerNexusCommand(program) {
    const nexusCommand = program
        .command('nexus')
        .description('Manage WASM Plugins (Project Nexus)');

    nexusCommand
        .command('run')
        .description('Run a local WASM plugin')
        .argument('<file>', 'Path to .wasm file')
        .action(async (file) => {
            const absolutePath = path.resolve(process.cwd(), file);
            console.log(chalk.blue(`🔗 Loading Nexus core...`));
            console.log(chalk.dim(`   Target: ${absolutePath}`));

            try {
                const plugin = await wasmRuntime.load(absolutePath);
                console.log(chalk.green('✅ Plugin loaded successfully.'));
                console.log(chalk.yellow('▶️ Executing plugin...'));

                const result = plugin.run();

                console.log(chalk.green(`\n✨ Execution complete. Result: ${result}`));
            } catch (error) {
                console.error(chalk.red(`❌ Nexus Error: ${error.message}`));
                process.exit(1);
            }
        });

    nexusCommand
        .command('list')
        .description('List installed plugins (Not implemented)')
        .action(() => {
            console.log('No global plugins installed yet.');
        });
}

export default registerNexusCommand;
