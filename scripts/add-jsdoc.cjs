#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const dirs = [
    'cli/lib/commands',
    'cli/lib/sandbox',
    'cli/lib/context',
    'cli/lib/mcp',
    'cli/lib/agents',
    'cli/lib/utils',
    'cli/lib/providers'
];

function walkDir(dir) {
    const results = [];
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...walkDir(full));
        } else if (entry.name.endsWith('.js')) {
            results.push(full);
        }
    }
    return results;
}

let count = 0;
for (const dir of dirs) {
    const files = walkDir(dir);
    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('/**')) continue; // Already has JSDoc

        const basename = path.basename(file, '.js');
        const dirname = path.basename(path.dirname(file));
        const moduleName = dirname + '/' + basename;
        const desc = basename.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        if (content.startsWith('// Copyright')) {
            const newContent = content.replace(
                '// Copyright (c) 2026 Ultra-Dex\n',
                '// Copyright (c) 2026 Ultra-Dex\n\n/**\n * @fileoverview ' + desc + ' module\n * @module ' + moduleName + '\n */\n'
            );
            if (newContent !== content) {
                fs.writeFileSync(file, newContent, 'utf8');
                count++;
            }
        } else {
            const newContent = '/**\n * @fileoverview ' + desc + ' module\n * @module ' + moduleName + '\n */\n\n' + content;
            fs.writeFileSync(file, newContent, 'utf8');
            count++;
        }
    }
}

console.log(`Injected JSDoc into ${count} files`);
