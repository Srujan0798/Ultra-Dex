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
        { intent: 'init', keywords: ['init', 'new project', 'create project', 'start project', 'setup', 'scaffold', 'bootstrap'] },
        { intent: 'generate', keywords: ['generate', 'plan', 'idea', 'blueprint', 'design', 'mapping', 'manifest'] },
        { intent: 'build', keywords: ['build', 'develop', 'implement', 'code', 'make', 'construct', 'assemble'] },
        { intent: 'agents', keywords: ['agent', 'specialist', 'who', 'list agents', 'browse', 'experts', 'team'] },
        { intent: 'swarm', keywords: ['swarm', 'pipeline', 'autonomous', 'workflow', 'auto', 'collaborate'] },
        { intent: 'status', keywords: ['status', 'how is', 'progress', 'score', 'alignment', 'condition'] },
        { intent: 'dashboard', keywords: ['dashboard', 'gui', 'web', 'monitor', 'visualize', 'interface'] },
        { intent: 'doctor', keywords: ['doctor', 'fix system', 'check system', 'diagnose', 'repair', 'heal', 'health'] },
        { intent: 'help', keywords: ['help', 'what can', 'how to', 'commands', 'usage', 'tutorial', 'guide'] },
        { intent: 'audit', keywords: ['audit', 'security', 'review', 'check code', 'inspect', 'verify code'] },
        { intent: 'serve', keywords: ['serve', 'mcp', 'server', 'connect', 'portal', 'listen', 'host'] },
        { intent: 'exit', keywords: ['exit', 'quit', 'bye', 'stop', 'close', 'shutdown', 'terminate'] },
        { intent: 'sync', keywords: ['sync', 'synchronize', 'update state', 'refresh state', 'brain'] },
        { intent: 'voice', keywords: ['voice', 'speech', 'talk', 'listen', 'audio', 'microphone'] }
    ];

    // Priority 1: Direct command names
    const directCommands = mappings.map(m => m.intent);
    const firstWord = text.split(' ')[0];
    if (directCommands.includes(firstWord)) {
        return firstWord;
    }

    // Priority 2: Fuzzy-ish matching for common phrases (Help/Guide)
    if (text.includes('how do i') || text.includes('how to')) return 'help';
    if (text.includes('is it working') || text.includes('ready')) return 'doctor';
    if (text.includes('what are you') || text.includes('who are you')) return 'help';

    // Priority 3: Keyword matching
    for (const mapping of mappings) {
        if (mapping.keywords.some(kw => text.includes(kw))) {
            return mapping.intent;
        }
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
