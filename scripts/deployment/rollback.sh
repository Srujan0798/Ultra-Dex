#!/bin/bash
# Ultra-Dex Rollback Script
# Usage: ./rollback.sh [backup-file]

set -euo pipefail

BACKUP_FILE="${1:-}"
DEPLOY_DIR="/opt/ultra-dex"
BACKUP_DIR="/opt/backups/ultra-dex"
LOG_FILE="/var/log/ultra-dex-rollback.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

error() {
    log "ERROR: $*"
    exit 1
}

log "Starting rollback procedure..."

# Find latest backup if not specified
if [[ -z "$BACKUP_FILE" ]]; then
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/backup-*.tar.gz 2>/dev/null | head -1)
    if [[ -z "$BACKUP_FILE" ]]; then
        error "No backup files found in $BACKUP_DIR"
    fi
    log "Using latest backup: $(basename "$BACKUP_FILE")"
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
    BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
    error "Backup file not found: $BACKUP_FILE"
fi

# Stop current service
log "Stopping service..."
if command -v systemctl &> /dev/null; then
    sudo systemctl stop ultra-dex 2>/dev/null || true
elif command -v pm2 &> /dev/null; then
    pm2 stop ultra-dex 2>/dev/null || true
fi

# Backup current state before rollback
CURRENT_BACKUP="$BACKUP_DIR/pre-rollback-$(date +%Y%m%d-%H%M%S).tar.gz"
if [[ -d "$DEPLOY_DIR/current" ]]; then
    tar -czf "$CURRENT_BACKUP" -C "$DEPLOY_DIR" current 2>/dev/null || true
    log "Pre-rollback backup: $(basename "$CURRENT_BACKUP")"
fi

# Restore from backup
log "Restoring from backup..."
rm -rf "$DEPLOY_DIR/current"
tar -xzf "$BACKUP_FILE" -C "$DEPLOY_DIR"
mv "$DEPLOY_DIR/current" "$DEPLOY_DIR/current-restored" 2>/dev/null || true
mkdir -p "$DEPLOY_DIR/current"
cp -r "$DEPLOY_DIR/current-restored/current/"* "$DEPLOY_DIR/current/" 2>/dev/null || \
cp -r "$DEPLOY_DIR/current-restored/"* "$DEPLOY_DIR/current/" 2>/dev/null || true
rm -rf "$DEPLOY_DIR/current-restored"

# Reinstall dependencies
log "Reinstalling dependencies..."
cd "$DEPLOY_DIR/current"
npm ci --production 2>&1 | tail -10

# Restart service
log "Restarting service..."
if command -v systemctl &> /dev/null; then
    sudo systemctl start ultra-dex
elif command -v pm2 &> /dev/null; then
    pm2 start ultra-dex
fi

sleep 5

# Verify
if ./scripts/deployment/health-check.sh; then
    log "✅ Rollback successful! System restored to backup state."
else
    error "Rollback verification failed. Manual intervention required."
fi

log "Rollback complete."
