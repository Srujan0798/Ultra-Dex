#!/bin/bash
# Ultra-Dex Cursor Rules Loader v2.0
# Usage: ./load.sh [domains...]
# Example: ./load.sh database api auth
# Example: ./load.sh all (loads all rules)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR=".cursor/rules"

echo "🚀 Ultra-Dex Cursor Rules Loader v2.0"
echo ""

# Check if Cursor is installed
if command -v cursor &> /dev/null; then
  echo "✓ Cursor detected"
elif [ -d "/Applications/Cursor.app" ] || [ -d "$HOME/Applications/Cursor.app" ]; then
  echo "✓ Cursor.app detected"
else
  echo "⚠️  Cursor not detected. Rules will still be copied."
  echo "   Install Cursor: https://cursor.com"
  echo ""
fi

# Create target directory
mkdir -p "$TARGET_DIR"

# Always copy core rules
cp "$SCRIPT_DIR/00-ultra-dex-core.mdc" "$TARGET_DIR/"
echo "✓ Loaded: 00-ultra-dex-core.mdc (core rules)"

# If "all" is specified, copy everything
if [ "$1" = "all" ]; then
  for file in "$SCRIPT_DIR"/*.mdc; do
    filename=$(basename "$file")
    if [ "$filename" != "00-ultra-dex-core.mdc" ]; then
      cp "$file" "$TARGET_DIR/"
      echo "✓ Loaded: $filename"
    fi
  done
  echo ""
  echo "📁 All rules loaded to $TARGET_DIR/"
  exit 0
fi

# If no arguments, show help
if [ $# -eq 0 ]; then
  echo ""
  echo "Usage: ./load.sh [domains...]"
  echo ""
  echo "Available domains:"
  echo "  database    - Prisma, schema, queries"
  echo "  api         - API routes, validation, responses"
  echo "  auth        - NextAuth configuration"
  echo "  frontend    - React, components, state"
  echo "  payments    - Stripe integration"
  echo "  testing     - Vitest, Playwright"
  echo "  security    - Input validation, auth, headers"
  echo "  deployment  - Vercel, CI/CD, migrations"
  echo "  error       - Error patterns, logging"
  echo "  performance - Optimization, caching"
  echo "  nextjs      - Next.js 15 App Router patterns"
  echo "  tenancy     - SaaS multi-tenancy patterns"
  echo "  all         - Load all rules"
  echo ""
  echo "Example: ./load.sh database api auth"
  exit 0
fi

# Copy requested domains
for domain in "$@"; do
  # Map short names to file numbers
  case "$domain" in
    database)    file="01-database.mdc" ;;
    api)         file="02-api.mdc" ;;
    auth)        file="03-auth.mdc" ;;
    frontend)    file="04-frontend.mdc" ;;
    payments)    file="05-payments.mdc" ;;
    testing)     file="06-testing.mdc" ;;
    security)    file="07-security.mdc" ;;
    deployment)  file="08-deployment.mdc" ;;
    error)       file="09-error-handling.mdc" ;;
    performance) file="10-performance.mdc" ;;
    nextjs)      file="11-nextjs-v15.mdc" ;;
    tenancy)     file="12-multi-tenancy.mdc" ;;
    *)
      echo "✗ Unknown domain: $domain"
      continue
      ;;
  esac
  
  if [ -f "$SCRIPT_DIR/$file" ]; then
    cp "$SCRIPT_DIR/$file" "$TARGET_DIR/"
    echo "✓ Loaded: $file"
  else
    echo "✗ File not found: $file"
  fi
done

echo ""
echo "📁 Rules loaded to $TARGET_DIR/"
echo ""
echo "💡 Tip: Restart Cursor to apply new rules"
