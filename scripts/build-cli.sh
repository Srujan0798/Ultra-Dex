#!/bin/bash
set -e

mkdir -p dist

cat > dist/ultra-dex.js << 'WRAPPER_EOF'
#!/usr/bin/env node
// Built CLI wrapper - delegates to source
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const actualCli = path.resolve(__dirname, '../apps/cli/bin/ultra-dex.js');

// Import and run the actual CLI
await import(actualCli);
WRAPPER_EOF

chmod +x dist/ultra-dex.js
echo 'CLI built: dist/ultra-dex.js'
