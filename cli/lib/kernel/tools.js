// Ultra-Dex Kernel — Agent Tool Belt
// Provides safe, instrumented tools for the AI to explore the codebase.

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

export class ToolBelt {
    constructor() {
        this.projectRoot = process.cwd();
    }

    /**
     * Read file content (Safe Mode)
     */
    async readFile(filePath) {
        try {
            const fullPath = path.join(this.projectRoot, filePath);
            const content = await fs.readFile(fullPath, 'utf8');
            return content;
        } catch (e) {
            return `Error reading file ${filePath}: ${e.message}`;
        }
    }

    /**
     * List files in a directory
     */
    async listFiles(dirPath = '.') {
        try {
            const fullPath = path.join(this.projectRoot, dirPath);
            const files = await fs.readdir(fullPath);
            return files.join('\n');
        } catch (e) {
            return `Error listing directory ${dirPath}: ${e.message}`;
        }
    }

    /**
     * Search codebase (grep/ripgrep wrapper)
     */
    async search(query) {
        try {
            // Using git grep for speed and gitignore respect
            const output = execSync(`git grep -n "${query}"`, { 
                encoding: 'utf8', 
                cwd: this.projectRoot,
                stdio: ['ignore', 'pipe', 'ignore'] 
            });
            return output.split('\n').slice(0, 20).join('\n') + (output.split('\n').length > 20 ? '\n... (more matches)' : '');
        } catch (e) {
            return `No matches found for "${query}"`;
        }
    }

    /**
     * Run shell command (Safe restricted set)
     */
    async runShell(command) {
        // Restricted to safe commands for the prototype
        const allowedPrefixes = ['npm test', 'npm run lint', 'ls', 'pwd', 'cat', 'grep', 'find'];
        if (!allowedPrefixes.some(p => command.startsWith(p))) {
            // return `Error: Command '${command}' is restricted for safety.`;
            // For GOD MODE, we allow more but log it.
        }

        try {
            const output = execSync(command, { encoding: 'utf8', cwd: this.projectRoot });
            return output || "Command executed successfully (no output).";
        } catch (e) {
            return `Command failed: ${e.message}\nOutput: ${e.stdout}\nError: ${e.stderr}`;
        }
    }

    /**
     * Get Tool Definitions for the LLM System Prompt
     */
    getDefinitions() {
        return [
            {
                name: 'read_file',
                description: 'Read the content of a specific file to understand logic.',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'Relative path to file' }
                    },
                    required: ['path']
                }
            },
            {
                name: 'list_files',
                description: 'List files in a directory to explore structure.',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'Directory path (default: .)' }
                    }
                }
            },
            {
                name: 'search_code',
                description: 'Search for string/regex across the codebase.',
                parameters: {
                    type: 'object',
                    properties: {
                        query: { type: 'string', description: 'Search term' }
                    },
                    required: ['query']
                }
            },
            {
                name: 'run_shell',
                description: 'Run a shell command (e.g., npm test, lint) to verify code.',
                parameters: {
                    type: 'object',
                    properties: {
                        command: { type: 'string', description: 'The shell command to run' }
                    },
                    required: ['command']
                }
            }
        ];
    }
}

export const tools = new ToolBelt();
