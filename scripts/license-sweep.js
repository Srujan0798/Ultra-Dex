// Copyright (c) 2026 Ultra-Dex

import fs from 'fs';
import path from 'path';

const HEADER = `// Copyright (c) 2026 Ultra-Dex

`;

function addHeader(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.startsWith('// Copyright')) {
    fs.writeFileSync(filePath, HEADER + content);
    console.log(`Added header to ${filePath}`);
  }
}

function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') walk(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.ts')) {
      addHeader(fullPath);
    }
  });
}

walk('cli/lib');
walk('scripts');
console.log('License header sweep complete.');
