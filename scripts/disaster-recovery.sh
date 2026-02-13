#!/bin/bash
# Ultra-Dex Disaster Recovery Script
# Automated recovery procedures for enterprise environments

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/ultra-dex}"
RESTORE_DIR="${RESTORE_DIR:-/opt/ultra-dex/restore}"
ENCRYPTION_KEY="${ENCRYPTION_KEY:-}"
LOG_FILE="${RESTORE_DIR}/disaster-recovery-$(date -u +%Y%m%d_%H%M%S).log"
DR_CONFIG="${DR_CONFIG:-/etc/ultra-dex/disaster-recovery.conf}"

# Logging function
log() {
    echo "[$(date -u '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Load configuration if exists
if [[ -f "$DR_CONFIG" ]]; then
    source "$DR_CONFIG"
fi

# Check prerequisites
command -v tar >/dev/null 2>&1 || error_exit "tar is required but not installed"
command -v gzip >/dev/null 2>&1 || error_exit "gzip is required but not installed"
command -v openssl >/dev/null 2>&1 || error_exit "openssl is required but not installed"

# Validate backup directory exists
if [[ ! -d "$BACKUP_DIR" ]]; then
    error_exit "Backup directory $BACKUP_DIR does not exist"
fi

# Function to list available backups
list_backups() {
    log "Available backups:"
    ls -la "$BACKUP_DIR" | grep -E "ultra-dex-enterprise-backup-.*\.tar\.gz\.enc" | sort -r
}

# Function to restore from backup
restore_backup() {
    local backup_file="$1"
    
    if [[ ! -f "$backup_file" ]]; then
        error_exit "Backup file $backup_file does not exist"
    fi
    
    log "Starting disaster recovery from: $backup_file"
    
    # Create restore directory
    mkdir -p "$RESTORE_DIR"
    
    # Decrypt backup if encrypted
    if [[ "$backup_file" == *.enc ]]; then
        if [[ -z "$ENCRYPTION_KEY" ]]; then
            error_exit "Backup is encrypted but no encryption key provided"
        fi
        
        log "Decrypting backup..."
        DECRYPTED_FILE="$RESTORE_DIR/backup.tar.gz"
        openssl enc -aes-256-gcm -pbkdf2 -d -in "$backup_file" -out "$DECRYPTED_FILE" -k "$ENCRYPTION_KEY" || error_exit "Failed to decrypt backup"
        log "Backup decrypted successfully"
    else
        DECRYPTED_FILE="$backup_file"
    fi
    
    # Verify checksum if available
    CHECKSUM_FILE="${backup_file%.enc}.sha256"
    if [[ -f "$CHECKSUM_FILE" ]]; then
        log "Verifying backup integrity..."
        ORIGINAL_CHECKSUM=$(cat "$CHECKSUM_FILE")
        CURRENT_CHECKSUM=$(sha256sum "$DECRYPTED_FILE" | cut -d' ' -f1)
        
        if [[ "$ORIGINAL_CHECKSUM" != "$CURRENT_CHECKSUM" ]]; then
            error_exit "Backup integrity check failed: checksum mismatch"
        fi
        log "Backup integrity verified"
    else
        log "No checksum file found, skipping integrity verification"
    fi
    
    # Extract backup
    log "Extracting backup to $RESTORE_DIR..."
    tar -xzf "$DECRYPTED_FILE" -C "$RESTORE_DIR" || error_exit "Failed to extract backup"
    
    # Stop Ultra-Dex services
    log "Stopping Ultra-Dex services..."
    if command -v systemctl >/dev/null 2>&1; then
        sudo systemctl stop ultra-dex || true
    elif command -v docker >/dev/null 2>&1; then
        docker-compose -f /opt/ultra-dex/docker-compose.yaml down || true
    else
        pkill -f ultra-dex || true
    fi
    
    # Backup current data before restore
    log "Backing up current data..."
    CURRENT_BACKUP="/tmp/ultra-dex-current-backup-$(date -u +%Y%m%d_%H%M%S)"
    if [[ -d "/opt/ultra-dex/data" ]]; then
        cp -r /opt/ultra-dex/data "$CURRENT_BACKUP" || log "Warning: Could not backup current data"
    fi
    
    # Restore data
    log "Restoring data to production directory..."
    if [[ -d "$RESTORE_DIR/data" ]]; then
        rsync -av "$RESTORE_DIR/data/" /opt/ultra-dex/data/ || error_exit "Failed to restore data"
    fi
    
    if [[ -d "$RESTORE_DIR/config" ]]; then
        rsync -av "$RESTORE_DIR/config/" /opt/ultra-dex/config/ || error_exit "Failed to restore config"
    fi
    
    # Start Ultra-Dex services
    log "Starting Ultra-Dex services..."
    if command -v systemctl >/dev/null 2>&1; then
        sudo systemctl start ultra-dex || error_exit "Failed to start Ultra-Dex service"
    elif command -v docker >/dev/null 2>&1; then
        docker-compose -f /opt/ultra-dex/docker-compose.yaml up -d || error_exit "Failed to start Ultra-Dex via Docker"
    else
        nohup ultra-dex serve > /var/log/ultra-dex.log 2>&1 &
    fi
    
    # Verify system health
    log "Verifying system health..."
    sleep 10  # Give system time to start
    
    if pgrep -f ultra-dex >/dev/null; then
        log "✅ Ultra-Dex services restored successfully"
    else
        error_exit "Ultra-Dex services failed to start after restore"
    fi
    
    # Cleanup
    rm -rf "$RESTORE_DIR"
    
    log "Disaster recovery completed successfully"
}

# Main execution
case "${1:-list}" in
    "list")
        list_backups
        ;;
    "restore")
        if [[ -z "${2:-}" ]]; then
            error_exit "Usage: $0 restore <backup-file>"
        fi
        restore_backup "$2"
        ;;
    *)
        echo "Usage: $0 {list|restore <backup-file>}"
        exit 1
        ;;
esac