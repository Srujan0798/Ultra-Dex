#!/bin/bash
set -euo pipefail

mkdir -p dist/core
rm -rf dist/core/*

FILES=$(find src/core -type f -name '*.ts' ! -name '*.d.ts' ! -path 'src/core/coordination/agent-mesh.ts')

npx esbuild $FILES \
  --outdir=dist/core \
  --outbase=src/core \
  --format=esm \
  --platform=node \
  --target=node18 \
  --packages=external

echo "Core build completed: dist/core"
