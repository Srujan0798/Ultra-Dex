/**
 * Mock File System for Testing
 * Simulates file operations without touching real filesystem
 */

export class MockFileSystem {
    constructor() {
        this.files = new Map();
        this.directories = new Set(['/']);
        this.operations = [];
    }

    async readFile(path, encoding = 'utf8') {
        this.operations.push({ type: 'read', path, timestamp: Date.now() });

        if (!this.files.has(path)) {
            const error = new Error(`ENOENT: no such file or directory, open '${path}'`);
            error.code = 'ENOENT';
            throw error;
        }

        return this.files.get(path);
    }

    async writeFile(path, content) {
        this.operations.push({ type: 'write', path, timestamp: Date.now() });
        this.files.set(path, content);

        // Ensure parent directories exist
        const parts = path.split('/');
        let current = '';
        for (let i = 0; i < parts.length - 1; i++) {
            current += parts[i] + '/';
            this.directories.add(current.slice(0, -1) || '/');
        }
    }

    async mkdir(path, options = {}) {
        this.operations.push({ type: 'mkdir', path, timestamp: Date.now() });

        if (options.recursive) {
            const parts = path.split('/');
            let current = '';
            for (const part of parts) {
                current += part + '/';
                this.directories.add(current.slice(0, -1) || '/');
            }
        } else {
            this.directories.add(path);
        }
    }

    async readdir(path) {
        this.operations.push({ type: 'readdir', path, timestamp: Date.now() });

        const entries = [];
        const prefix = path.endsWith('/') ? path : path + '/';

        for (const filePath of this.files.keys()) {
            if (filePath.startsWith(prefix)) {
                const rest = filePath.slice(prefix.length);
                const firstPart = rest.split('/')[0];
                if (firstPart && !entries.includes(firstPart)) {
                    entries.push(firstPart);
                }
            }
        }

        return entries;
    }

    async stat(path) {
        this.operations.push({ type: 'stat', path, timestamp: Date.now() });

        if (this.files.has(path)) {
            return {
                isFile: () => true,
                isDirectory: () => false,
                size: this.files.get(path).length
            };
        }

        if (this.directories.has(path)) {
            return {
                isFile: () => false,
                isDirectory: () => true,
                size: 0
            };
        }

        const error = new Error(`ENOENT: no such file or directory, stat '${path}'`);
        error.code = 'ENOENT';
        throw error;
    }

    async access(path) {
        this.operations.push({ type: 'access', path, timestamp: Date.now() });

        if (!this.files.has(path) && !this.directories.has(path)) {
            const error = new Error(`ENOENT: no such file or directory, access '${path}'`);
            error.code = 'ENOENT';
            throw error;
        }
    }

    async rm(path, options = {}) {
        this.operations.push({ type: 'rm', path, timestamp: Date.now() });

        if (options.recursive) {
            const prefix = path.endsWith('/') ? path : path + '/';
            for (const filePath of this.files.keys()) {
                if (filePath.startsWith(prefix) || filePath === path) {
                    this.files.delete(filePath);
                }
            }
            this.directories.delete(path);
        } else {
            this.files.delete(path);
        }
    }

    async cp(src, dest, options = {}) {
        this.operations.push({ type: 'cp', src, dest, timestamp: Date.now() });

        if (this.files.has(src)) {
            this.files.set(dest, this.files.get(src));
        }
    }

    // Test helpers
    setFile(path, content) {
        this.files.set(path, content);
    }

    getFile(path) {
        return this.files.get(path);
    }

    hasFile(path) {
        return this.files.has(path);
    }

    getOperations() {
        return this.operations;
    }

    reset() {
        this.files.clear();
        this.directories.clear();
        this.directories.add('/');
        this.operations = [];
    }
}

export default MockFileSystem;
