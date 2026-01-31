// Ultra-Dex CLI — NLP Intent Router
// Maps natural language to internal CLI commands

/**
 * Enhanced Intent Router
 */
export function routeIntent(input) {
    if (!input) return null;
    
    const text = input.toLowerCase().trim();
    
    // Command Mapping Table
    const mappings = [
        { intent: 'init', keywords: ['init', 'new project', 'create project', 'start project', 'setup'] },
        { intent: 'generate', keywords: ['generate', 'plan', 'idea', 'blueprint', 'design'] },
        { intent: 'build', keywords: ['build', 'develop', 'implement', 'code', 'make'] },
        { intent: 'agents', keywords: ['agent', 'specialist', 'who', 'list agents', 'browse'] },
        { intent: 'swarm', keywords: ['swarm', 'pipeline', 'autonomous', 'workflow', 'auto'] },
        { intent: 'status', keywords: ['status', 'how is', 'progress', 'score', 'alignment'] },
        { intent: 'dashboard', keywords: ['dashboard', 'gui', 'web', 'monitor', 'visualize'] },
        { intent: 'doctor', keywords: ['doctor', 'health', 'fix system', 'check system', 'diagnose'] },
        { intent: 'help', keywords: ['help', 'what can', 'how to', 'commands', 'usage'] },
        { intent: 'audit', keywords: ['audit', 'security', 'review', 'check code'] },
        { intent: 'serve', keywords: ['serve', 'mcp', 'server', 'connect'] },
        { intent: 'exit', keywords: ['exit', 'quit', 'bye', 'stop', 'close'] }
    ];

    for (const mapping of mappings) {
        if (mapping.keywords.some(kw => text.includes(kw))) {
            return mapping.intent;
        }
    }

    // Default: check for direct command names
    const directCommands = mappings.map(m => m.intent);
    const firstWord = text.split(' ')[0];
    if (directCommands.includes(firstWord)) {
        return firstWord;
    }

    return null;
}

/**
 * Extract parameters from NLP input (basic implementation)
 * e.g., "create project my-saas" -> { name: "my-saas" }
 */
export function extractParams(intent, input) {
    const text = input.toLowerCase().trim();
    const params = {};

    if (intent === 'init' || intent === 'generate') {
        // Try to find project name or idea
        const parts = text.split(' ');
        if (parts.length > 2) {
            params.value = parts.slice(2).join(' ');
        }
    }

    return params;
}
