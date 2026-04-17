#!/bin/bash
set -e

mkdir -p dist

npx esbuild apps/cli/bin/ultra-dex.js \
  --bundle --platform=node --target=node20 \
  --format=esm --outfile=dist/ultra-dex.mjs \
  --external:sharp --external:sqlite3 --external:node-pty \
  --external:isolated-vm --external:@xenova/transformers \
  --external:playwright --external:fsevents \
  --banner:js='#!/usr/bin/env node'

chmod +x dist/ultra-dex.mjs
echo 'CLI built: dist/ultra-dex.mjs'