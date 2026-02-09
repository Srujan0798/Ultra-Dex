// Copyright (c) 2026 Ultra-Dex
// Project Ghost CLI Command

import { ghostAgent } from '../ghost/agent.js';

export function registerGhostCommand(program) {
    program
        .command('ghost')
        .description('Autonomous Computer Use Agent (Project Ghost)')
        .argument('<goal>', 'Goal for the agent (e.g., "Check emails")')
        .option('--unsafe', 'Disable user confirmation (DANGEROUS)', false)
        .option('--debug', 'Show distinct debug info', false)
        .action(async (goal, options) => {
            console.log('👻 Initializing Ghost Agent...');

            // Configure agent
            ghostAgent.safetyMode = !options.unsafe;
            ghostAgent.debug = options.debug;

            await ghostAgent.run(goal);
        });
}

export default registerGhostCommand;
