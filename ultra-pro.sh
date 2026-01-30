#!/bin/bash
# Ultra-Dex Pro Lifecycle Script
# One command to Audit, Align, Test, and Package.

set -e

echo "🚀 Starting Ultra-Dex Pro Lifecycle..."

echo -e "\n🔍 [1/4] Running Project Audit..."
node cli/bin/ultra-dex.js audit

echo -e "\n🎯 [2/4] Checking Architectural Alignment..."
node cli/bin/ultra-dex.js align --strict

echo -e "\n🧪 [3/4] Executing v2.4 Command Smoke Tests..."
node --test cli/test/v2-commands.test.js

echo -e "\n📦 [4/4] Packaging VS Code Extension..."
cd vscode-extension
npx --yes @vscode/vsce package --allow-missing-repository
cd ..

echo -e "\n✅ ALL SYSTEMS GO. Ultra-Dex is ready for production."
echo "Extension: vscode-extension/ultra-dex-vscode-1.0.0.vsix"
echo "Launch Kit: marketing/content.md"
