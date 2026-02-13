#!/bin/bash
# Ultra-Dex Backup Automation Script
# Enterprise-grade backup and disaster recovery automation

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/ultra-dex}"
DATA_DIR="${DATA_DIR:-/opt/ultra-dex/data}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
ENCRYPTION_KEY="${ENCRYPTION_KEY:-}"
DATE_STAMP=$(date -u +"%Y%m%d_%H%M%S")
BACKUP_NAME="ultra-dex-backup-${DATE_STAMP}"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz.enc"
LOG_FILE="${BACKUP_DIR}/backup-${DATE_STAMP}.log"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    echo "[$(date -u '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Check prerequisites
command -v tar >/dev/null 2>&1 || error_exit "tar is required but not installed"
command -v gzip >/dev/null 2>&1 || error_exit "gzip is required but not installed"
command -v openssl >/dev/null 2>&1 || error_exit "openssl is required but not installed"

# Validate data directory exists
if [[ ! -d "$DATA_DIR" ]]; then
    error_exit "Data directory $DATA_DIR does not exist"
fi

log "Starting Ultra-Dex backup process"

# Create temporary directory for backup preparation
TEMP_DIR=$(mktemp -d)
log "Created temporary backup directory: $TEMP_DIR"

# Prepare backup
log "Preparing backup from $DATA_DIR"
tar -czf "$TEMP_DIR/backup.tar.gz" -C "$(dirname "$DATA_DIR")" "$(basename "$DATA_DIR")" || error_exit "Failed to create archive"

# Encrypt backup if encryption key is provided
if [[ -n "$ENCRYPTION_KEY" ]]; then
    log "Encrypting backup with AES-256-GCM"
    openssl enc -aes-256-gcm -pbkdf2 -in "$TEMP_DIR/backup.tar.gz" -out "$BACKUP_FILE" -k "$ENCRYPTION_KEY" || error_exit "Failed to encrypt backup"
    log "Backup encrypted successfully"
else
    log "No encryption key provided, storing backup unencrypted"
    mv "$TEMP_DIR/backup.tar.gz" "$BACKUP_FILE"
fi

# Calculate checksum
CHECKSUM=$(sha256sum "$BACKUP_FILE" | cut -d' ' -f1)
echo "$CHECKSUM" > "${BACKUP_FILE}.sha256"
log "Checksum calculated: $CHECKSUM"

# Cleanup temporary directory
rm -rf "$TEMP_DIR"

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup completed successfully: $BACKUP_FILE (size: $BACKUP_SIZE)"

# Cleanup old backups
log "Cleaning up backups older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -name "ultra-dex-backup-*" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "backup-*.log" -type f -mtime +$RETENTION_DAYS -delete

log "Backup process completed successfully"