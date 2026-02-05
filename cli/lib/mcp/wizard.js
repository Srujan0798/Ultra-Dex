/**
 * MCP (Model Context Protocol) Configuration Wizard
 * Interactive setup for MCP server configurations
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Default MCP server templates
const MCP_TEMPLATES = {
    filesystem: {
        name: 'Filesystem',
        description: 'Access local files and directories',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '{workspacePath}'],
        env: {}
    },
    github: {
        name: 'GitHub',
        description: 'Access GitHub repositories and issues',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: {
            GITHUB_PERSONAL_ACCESS_TOKEN: '{token}'
        }
    },
    postgres: {
        name: 'PostgreSQL',
        description: 'Query PostgreSQL databases',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-postgres', '{connectionString}'],
        env: {}
    },
    sqlite: {
        name: 'SQLite',
        description: 'Query SQLite databases',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sqlite', '--db-path', '{dbPath}'],
        env: {}
    },
    brave: {
        name: 'Brave Search',
        description: 'Web search using Brave Search API',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-brave-search'],
        env: {
            BRAVE_API_KEY: '{apiKey}'
        }
    },
    puppeteer: {
        name: 'Puppeteer',
        description: 'Browser automation and web scraping',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-puppeteer'],
        env: {}
    },
    memory: {
        name: 'Memory',
        description: 'Persistent memory storage',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-memory'],
        env: {}
    },
    fetch: {
        name: 'Fetch',
        description: 'HTTP fetch for API calls',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-fetch'],
        env: {}
    },
    sequential: {
        name: 'Sequential Thinking',
        description: 'Enhanced reasoning with sequential steps',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
        env: {}
    }
};

/**
 * Create readline interface for interactive prompts
 */
function createPrompt() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

/**
 * Ask a question and get user input
 */
async function ask(rl, question, defaultValue = '') {
    return new Promise((resolve) => {
        const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
        rl.question(prompt, (answer) => {
            resolve(answer.trim() || defaultValue);
        });
    });
}

/**
 * Interactive wizard to configure MCP servers
 */
export async function runWizard(options = {}) {
    const rl = createPrompt();
    const config = {
        mcpServers: {}
    };

    console.log('\n🔧 Ultra-Dex MCP Configuration Wizard\n');
    console.log('This wizard will help you configure MCP (Model Context Protocol) servers.\n');

    // Show available templates
    console.log('Available MCP server templates:\n');
    const templateKeys = Object.keys(MCP_TEMPLATES);
    templateKeys.forEach((key, i) => {
        const t = MCP_TEMPLATES[key];
        console.log(`  ${i + 1}. ${t.name.padEnd(15)} - ${t.description}`);
    });
    console.log(`  ${templateKeys.length + 1}. Custom server`);
    console.log('');

    let addMore = true;

    while (addMore) {
        const choice = await ask(rl, 'Select server to add (number)', '1');
        const choiceNum = parseInt(choice) - 1;

        if (choiceNum >= 0 && choiceNum < templateKeys.length) {
            const templateKey = templateKeys[choiceNum];
            const template = MCP_TEMPLATES[templateKey];

            console.log(`\nConfiguring ${template.name}...\n`);

            const serverName = await ask(rl, 'Server name/alias', templateKey);
            const serverConfig = {
                command: template.command,
                args: [...template.args],
                env: { ...template.env }
            };

            // Replace placeholders in args
            for (let i = 0; i < serverConfig.args.length; i++) {
                const arg = serverConfig.args[i];
                if (arg.includes('{')) {
                    const placeholder = arg.match(/\{(\w+)\}/)?.[1];
                    if (placeholder) {
                        const value = await ask(rl, `Enter ${placeholder}`);
                        serverConfig.args[i] = arg.replace(`{${placeholder}}`, value);
                    }
                }
            }

            // Replace placeholders in env
            for (const [key, value] of Object.entries(serverConfig.env)) {
                if (typeof value === 'string' && value.includes('{')) {
                    const placeholder = value.match(/\{(\w+)\}/)?.[1];
                    if (placeholder) {
                        const envValue = await ask(rl, `Enter ${key}`);
                        serverConfig.env[key] = envValue;
                    }
                }
            }

            config.mcpServers[serverName] = serverConfig;
            console.log(`✅ Added ${serverName}\n`);

        } else if (choiceNum === templateKeys.length) {
            // Custom server
            console.log('\nConfiguring custom server...\n');

            const serverName = await ask(rl, 'Server name');
            const command = await ask(rl, 'Command (e.g., npx, node)', 'npx');
            const argsStr = await ask(rl, 'Arguments (space-separated)');

            config.mcpServers[serverName] = {
                command,
                args: argsStr.split(' ').filter(Boolean),
                env: {}
            };

            console.log(`✅ Added ${serverName}\n`);
        }

        const more = await ask(rl, 'Add another server? (y/n)', 'n');
        addMore = more.toLowerCase() === 'y';
    }

    // Save configuration
    const configPath = options.configPath || path.join(process.cwd(), 'claude_desktop_config.json');

    // Check for existing config
    let existingConfig = {};
    if (fs.existsSync(configPath)) {
        try {
            existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch {
            // Ignore parse errors
        }
    }

    // Merge with existing
    const finalConfig = {
        ...existingConfig,
        mcpServers: {
            ...existingConfig.mcpServers,
            ...config.mcpServers
        }
    };

    fs.writeFileSync(configPath, JSON.stringify(finalConfig, null, 2));
    console.log(`\n✅ Configuration saved to ${configPath}\n`);

    // Show next steps
    console.log('Next steps:');
    console.log('  1. Copy this config to your Claude Desktop or Cursor settings');
    console.log('  2. Restart your AI tool to load the new MCP servers');
    console.log('  3. The servers will be available as tools in your AI conversations\n');

    rl.close();
    return finalConfig;
}

/**
 * Generate config without interactive prompts
 */
export function generateConfig(servers = [], options = {}) {
    const config = {
        mcpServers: {}
    };

    for (const server of servers) {
        if (typeof server === 'string' && MCP_TEMPLATES[server]) {
            config.mcpServers[server] = {
                command: MCP_TEMPLATES[server].command,
                args: MCP_TEMPLATES[server].args,
                env: MCP_TEMPLATES[server].env
            };
        } else if (typeof server === 'object') {
            config.mcpServers[server.name] = {
                command: server.command,
                args: server.args || [],
                env: server.env || {}
            };
        }
    }

    if (options.outputPath) {
        fs.writeFileSync(options.outputPath, JSON.stringify(config, null, 2));
    }

    return config;
}

/**
 * Validate MCP configuration
 */
export function validateConfig(configPath) {
    if (!fs.existsSync(configPath)) {
        return { valid: false, error: 'Config file not found' };
    }

    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        if (!config.mcpServers) {
            return { valid: false, error: 'Missing mcpServers key' };
        }

        const issues = [];

        for (const [name, server] of Object.entries(config.mcpServers)) {
            if (!server.command) {
                issues.push(`${name}: Missing command`);
            }
            if (!Array.isArray(server.args)) {
                issues.push(`${name}: args must be an array`);
            }
        }

        if (issues.length > 0) {
            return { valid: false, issues };
        }

        return {
            valid: true,
            serverCount: Object.keys(config.mcpServers).length,
            servers: Object.keys(config.mcpServers)
        };
    } catch (err) {
        return { valid: false, error: `Parse error: ${err.message}` };
    }
}

/**
 * List available MCP templates
 */
export function listTemplates() {
    return Object.entries(MCP_TEMPLATES).map(([key, t]) => ({
        key,
        name: t.name,
        description: t.description
    }));
}

export default {
    runWizard,
    generateConfig,
    validateConfig,
    listTemplates,
    MCP_TEMPLATES
};
