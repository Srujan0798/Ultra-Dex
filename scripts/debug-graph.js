// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Debug Graph module
 * @module ./debug-graph
 */


import { projectGraph } from './cli/lib/mcp/graph.js';

async function deepDebug() {
    console.log('Starting Deep Graph Debug (Check Files)...');
    try {
        const result = await projectGraph.scan();
        const summary = projectGraph.getSummary();
        console.log('Summary files count:', summary.files.length);

        const dashboard = summary.files.find(f => f.includes('commands/dashboard.js'));
        console.log('Found dashboard.js:', dashboard);

        const hasCli = summary.files.some((f) => f.startsWith('cli/'));
        console.log('Has cli/ prefix:', hasCli);

        const apiFiles = summary.files.filter((f) =>
            (f.includes('api/') || f.includes('routes/') || f.includes('commands/')) &&
            !f.includes('node_modules') &&
            !f.includes('templates/') &&
            !f.includes('examples/') &&
            !f.includes('assets/')
        );
        console.log('API Files found:', apiFiles.length);
        if (apiFiles.length > 0) {
            console.log('First 5 API files:', apiFiles.slice(0, 5));
        }

    } catch (error) {
        console.error('DEBUG: Graph Scan Failed:', error);
    }
}

deepDebug();
