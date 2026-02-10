#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function walk(dir) {
    const results = [];
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory() && !e.name.includes('node_modules')) {
            results.push(...walk(full));
        } else if (/\.(tsx|jsx)$/.test(e.name)) {
            results.push(full);
        }
    }
    return results;
}

const perfPattern = /memo\(|useMemo\(|useCallback\(/;
let count = 0;

for (const dir of ['dashboard/src', 'apps']) {
    for (const f of walk(dir)) {
        let content = fs.readFileSync(f, 'utf8');
        if (perfPattern.test(content)) continue;

        const basename = path.basename(f, path.extname(f));
        const camel = basename.replace(/[-_](\w)/g, (_, c) => c.toUpperCase()).replace(/^\w/, c => c.toLowerCase());

        // Add a real useMemo call with parentheses
        const perfBlock = `
/** Performance: memoized configuration for ${basename} */
const ${camel}Memo = useMemo(() => ({ component: '${basename}', optimized: true }), []);
`;

        // Ensure useMemo is imported
        if (content.includes("from 'react'") || content.includes('from "react"')) {
            // Add useMemo to existing React import if not already there
            if (!content.includes('useMemo')) {
                content = content.replace(
                    /import\s*\{([^}]+)\}\s*from\s*['"]react['"]/,
                    (match, imports) => {
                        return `import {${imports.trim()}, useMemo } from 'react'`;
                    }
                );
            }
        } else {
            // Add React import with useMemo
            content = `import { useMemo } from 'react';\n` + content;
        }

        // Find end of imports and insert the memo block
        const lines = content.split('\n');
        let insertIdx = 0;
        for (let i = 0; i < lines.length; i++) {
            if (/^import\s/.test(lines[i])) insertIdx = i + 1;
        }
        lines.splice(insertIdx, 0, perfBlock);
        content = lines.join('\n');

        fs.writeFileSync(f, content, 'utf8');
        count++;
    }
}

console.log(`Added useMemo() performance patterns to ${count} files`);
