#!/bin/bash
# Ultra-Dex Pro Lifecycle Script (v6.0.0)
# One command to Audit, Check, Test, and Build Extensions.

set -e

echo "🚀 Starting Ultra-Dex v6.0.0 Pro Lifecycle (Nexus Edition)..."

echo -e "\n🔍 [1/4] Running Project Audit..."
node apps/cli/bin/ultra-dex.js audit

echo -e "\n🎯 [2/4] Checking System Doctor..."
node apps/cli/bin/ultra-dex.js check doctor

echo -e "\n🧪 [3/4] Executing Core Meta-Layer Tests..."
npm run test:unit

echo -e "\n📦 [4/4] Packaging VS Code Extension..."
cd packages/extensions/vscode
npm run build
# npx --yes @vscode/vsce package --allow-missing-repository
cd ../../..

echo -e "\n✅ ALL SYSTEMS GO. Ultra-Dex v6.0.0 is ready for production."
