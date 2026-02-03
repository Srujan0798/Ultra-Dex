// Ultra-Dex Kernel — Context Awareness Module
// Matches Claude Code's ability to "instantly know" the project environment.

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

export class ContextScanner {
    constructor() {
        this.projectRoot = process.cwd();
        this.cache = {
            files: [],
            dependencies: {},
            git: {},
            stack: 'unknown'
        };
    }

    /**
     * The "God Mode" Scan
     * Instantly analyzes the current directory to build a mental model.
     */
    async scan() {
        await Promise.all([
            this.analyzeStack(),
            this.scanGit(),
            this.mapFileStructure()
        ]);
        return this.cache;
    }

    /**
     * Detects the tech stack (Next.js, Python, Rust, etc.)
     * This prevents asking "What framework is this?"
     */
    async analyzeStack() {
        try {
            const pkgPath = path.join(this.projectRoot, 'package.json');
            const pkgData = await fs.readFile(pkgPath, 'utf8');
            const pkg = JSON.parse(pkgData);
            
            this.cache.dependencies = { 
                ...pkg.dependencies, 
                ...pkg.devDependencies 
            };

            // Heuristic detection
            if (this.cache.dependencies['next']) this.cache.stack = 'Next.js';
            else if (this.cache.dependencies['react']) this.cache.stack = 'React';
            else if (this.cache.dependencies['vue']) this.cache.stack = 'Vue';
            else if (this.cache.dependencies['express']) this.cache.stack = 'Node/Express';
            else this.cache.stack = 'Node.js';
            
            // Refine with TypeScript
            if (this.cache.dependencies['typescript']) this.cache.stack += ' (TypeScript)';

        } catch (e) {
            // Not a Node.js project? Check for other markers
            if (await this.exists('requirements.txt')) this.cache.stack = 'Python';
            else if (await this.exists('Cargo.toml')) this.cache.stack = 'Rust';
            else if (await this.exists('go.mod')) this.cache.stack = 'Go';
        }
    }

    /**
     * Reads git status to know if the workspace is dirty
     */
    async scanGit() {
        try {
            const branch = execSync('git branch --show-current', { encoding: 'utf8', stdio: 'pipe' }).trim();
            const status = execSync('git status --porcelain', { encoding: 'utf8', stdio: 'pipe' });
            this.cache.git = {
                branch,
                isDirty: status.length > 0,
                modifiedFiles: status.split('\n').filter(Boolean).length
            };
        } catch (e) {
            this.cache.git = { initialized: false };
        }
    }

    /**
     * Maps the file structure (ignoring node_modules/git)
     * This allows the agent to know "where things are"
     */
    async mapFileStructure() {
        // Implementation simplified for prototype speed
        // In a full build, we'd use 'glob' or recursive readdir
        try {
            const files = await fs.readdir(this.projectRoot);
            this.cache.files = files.filter(f => !['node_modules', '.git', '.next'].includes(f));
        } catch (e) {
            this.cache.files = [];
        }
    }

    async exists(file) {
        try {
            await fs.access(path.join(this.projectRoot, file));
            return true;
        } catch {
            return false;
        }
    }
}

export const context = new ContextScanner();
