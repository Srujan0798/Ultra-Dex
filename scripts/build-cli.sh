#!/bin/bash
set -e
ROOT="$(pwd)"
mkdir -p dist

# Bundle from apps/cli so workspace node_modules are on the resolution path
# --alias:src resolves TypeScript path alias src/* → monorepo root src/*
cd apps/cli
npx esbuild bin/ultra-dex.js \
  --bundle --platform=node --target=node20 \
  --format=esm --outfile="$ROOT/dist/ultra-dex.js" \
  --alias:src="$ROOT/src" \
  --external:sharp --external:sqlite3 --external:node-pty \
  --external:isolated-vm --external:"@xenova/transformers" \
  --external:playwright --external:fsevents \
  --banner:js='#!/usr/bin/env node
import { createRequire } from "module";
const require = createRequire(import.meta.url);'

cd "$ROOT"
chmod +x dist/ultra-dex.js

# Copy CLI lib to root/lib so dynamic imports resolve from dist/
# ultra-dex-full.js uses ../lib/commands/*.js  →  from dist/ = ROOT/lib/
rm -rf lib
cp -r apps/cli/lib lib

# CJS shim — uses dynamic import so it works from both CJS and ESM contexts
cat > dist/ultra-dex.cjs << 'EOF'
#!/usr/bin/env node
const path = require('path');
const { pathToFileURL } = require('url');
const entry = pathToFileURL(path.join(__dirname, 'ultra-dex.js')).href;
import(entry).catch(err => { console.error(err.message); process.exit(1); });
EOF

chmod +x dist/ultra-dex.cjs
echo "✓ Built dist/ultra-dex.js ($(du -sh dist/ultra-dex.js | cut -f1)) + dist/ultra-dex.cjs shim"
