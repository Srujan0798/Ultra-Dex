#!/bin/bash
npx esbuild apps/cli/bin/ultra-dex.js \
  --bundle --platform=node --target=node20 \
  --format=cjs --outfile=dist/ultra-dex.cjs \
  --external:sharp --external:sqlite3 --external:node-pty \
  --external:isolated-vm --external:"@xenova/transformers" \
  --external:playwright --external:fsevents \
  --banner:js='#!/usr/bin/env node'

chmod +x dist/ultra-dex.cjs
