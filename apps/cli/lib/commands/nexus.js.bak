// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Nexus module
 * @module commands/nexus
 */
// Project Nexus CLI Command

import { wasmRuntime } from '../wasm/runtime.js';
import { pluginRegistry } from '../plugins/index.js';
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
            logger.log(chalk.blue(`🔗 Loading Nexus core...`));
            logger.log(chalk.dim(`   Target: ${absolutePath}`));

            try {
                const plugin = await wasmRuntime.load(absolutePath);
                logger.log(chalk.green('✅ Plugin loaded successfully.'));
                logger.log(chalk.yellow('▶️ Executing plugin...'));

                const result = plugin.run();

                logger.log(chalk.green(`\n✨ Execution complete. Result: ${result}`));
            } catch (error) {
                logger.error(chalk.red(`❌ Nexus Error: ${error.message}`));
                process.exit(1);
            }
        });

    nexusCommand
        .command('list')
        .description('List installed Nexus plugins')
        .action(async () => {
            await pluginRegistry.initialize();
            const plugins = pluginRegistry.getInstalledPlugins();

            if (!plugins.length) {
                logger.log('No Nexus plugins installed yet.');
                return;
            }

            logger.log(chalk.cyan('\nInstalled Nexus Plugins:\n'));
            plugins.forEach((plugin) => {
                if (!plugin) return;
                const name = plugin.name || 'unknown-plugin';
                const version = plugin.version ? `@${plugin.version}` : '';
                const location = plugin.local ? 'local' : 'registry';
                logger.log(`- ${name}${version} (${location})`);
            });
        });
}

export default registerNexusCommand;
