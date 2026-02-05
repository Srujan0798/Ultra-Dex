#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$ROOT_DIR/.ultra-dex/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

mkdir -p "$BACKUP_DIR"

if command -v pg_dump >/dev/null 2>&1 && [[ -n "${DATABASE_URL:-}" ]]; then
  echo "📦 Creating pre-migration backup..."
  pg_dump "$DATABASE_URL" > "$BACKUP_DIR/backup_${TIMESTAMP}.sql" || true
else
  echo "⚠️  pg_dump not available or DATABASE_URL not set. Skipping backup."
fi

echo "🚀 Running migrations..."
if [[ -f "$ROOT_DIR/prisma/schema.prisma" ]]; then
  npx prisma migrate deploy
elif [[ -f "$ROOT_DIR/drizzle.config.ts" ]]; then
  npx drizzle-kit push
else
  echo "❌ No Prisma or Drizzle configuration found."
  exit 1
fi

echo "✅ Migrations completed."
