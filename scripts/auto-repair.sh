#!/bin/bash
# Auto-repair common issues

echo "🔧 AUTO-REPAIR SCRIPT"
echo "═══════════════════════════════════════════════════════════"

# Fix 1: Ensure tsx is installed
echo "Checking tsx..."
if ! npm list tsx > /dev/null 2>&1; then
    echo "Installing tsx..."
    npm install tsx --save-prod
fi

# Fix 2: Ensure all dependencies installed
echo "Checking dependencies..."
npm ci

# Fix 3: Build the project
echo "Building project..."
npm run build:core && npm run build:cli

echo "✅ Auto-repair complete!"
