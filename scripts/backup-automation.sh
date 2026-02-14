#!/bin/bash
# Copyright (c) 2026 Ultra-Dex
# Backup Automation — automated backup & restore for Ultra-Dex data

set -euo pipefail

# Configuration
BACKUP_DIR="${ULTRA_DEX_BACKUP_DIR:-./backups}"
DATA_DIR="${ULTRA_DEX_DATA_DIR:-./data}"
MAX_BACKUPS="${ULTRA_DEX_MAX_BACKUPS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="ultra-dex-backup-${TIMESTAMP}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[Ultra-Dex Backup]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# ── Functions ────────────────────────────────────────────────────────────

backup() {
    log "Starting backup: ${BACKUP_NAME}"
    mkdir -p "${BACKUP_DIR}"

    local target="${BACKUP_DIR}/${BACKUP_NAME}"
    mkdir -p "${target}"

    # Backup SQLite databases
    if [ -d "${DATA_DIR}" ]; then
        log "Backing up data directory..."
        cp -r "${DATA_DIR}" "${target}/data"
    fi

    # Backup configuration
    if [ -f ".ultra-dex.json" ]; then
        cp ".ultra-dex.json" "${target}/"
    fi
    if [ -f "ultra-dex.config.js" ]; then
        cp "ultra-dex.config.js" "${target}/"
    fi
    if [ -d "config" ]; then
        cp -r config "${target}/config"
    fi

    # Backup environment (sanitized — no secrets)
    if [ -f ".env" ]; then
        grep -v -E '(KEY|SECRET|TOKEN|PASSWORD|PRIVATE)=' .env > "${target}/.env.sanitized" 2>/dev/null || true
    fi

    # Create manifest
    cat > "${target}/manifest.json" << EOF
{
    "name": "${BACKUP_NAME}",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "version": "6.1.0",
    "files": $(find "${target}" -type f | wc -l | tr -d ' '),
    "size": "$(du -sh "${target}" | cut -f1)",
    "hostname": "$(hostname)"
}
EOF

    # Compress
    log "Compressing backup..."
    tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"
    rm -rf "${target}"

    local size=$(du -sh "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1)
    success "Backup created: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz (${size})"

    # Rotate old backups
    rotate_backups
}

restore() {
    local backup_file="$1"

    if [ ! -f "${backup_file}" ]; then
        error "Backup file not found: ${backup_file}"
    fi

    log "Restoring from: ${backup_file}"

    # Create temp directory
    local temp_dir=$(mktemp -d)
    tar -xzf "${backup_file}" -C "${temp_dir}"

    local backup_dir=$(ls "${temp_dir}")
    local source="${temp_dir}/${backup_dir}"

    # Verify manifest
    if [ ! -f "${source}/manifest.json" ]; then
        error "Invalid backup — no manifest found"
    fi

    log "Backup info:"
    cat "${source}/manifest.json" | head -10

    # Restore data
    if [ -d "${source}/data" ]; then
        log "Restoring data directory..."
        mkdir -p "${DATA_DIR}"
        cp -r "${source}/data/"* "${DATA_DIR}/" 2>/dev/null || true
    fi

    # Restore config
    if [ -f "${source}/.ultra-dex.json" ]; then
        cp "${source}/.ultra-dex.json" ".ultra-dex.json"
    fi
    if [ -d "${source}/config" ]; then
        cp -r "${source}/config/"* config/ 2>/dev/null || true
    fi

    rm -rf "${temp_dir}"
    success "Restore complete from: ${backup_file}"
}

rotate_backups() {
    log "Rotating backups (keeping last ${MAX_BACKUPS})..."
    local count=$(ls -1 "${BACKUP_DIR}"/ultra-dex-backup-*.tar.gz 2>/dev/null | wc -l | tr -d ' ')

    if [ "${count}" -gt "${MAX_BACKUPS}" ]; then
        local to_delete=$((count - MAX_BACKUPS))
        ls -1t "${BACKUP_DIR}"/ultra-dex-backup-*.tar.gz | tail -n "${to_delete}" | xargs rm -f
        log "Removed ${to_delete} old backups"
    fi
}

list_backups() {
    log "Available backups:"
    echo ""
    if ls "${BACKUP_DIR}"/ultra-dex-backup-*.tar.gz 1>/dev/null 2>&1; then
        for f in "${BACKUP_DIR}"/ultra-dex-backup-*.tar.gz; do
            local size=$(du -sh "$f" | cut -f1)
            local name=$(basename "$f")
            echo "  📦 ${name} (${size})"
        done
        echo ""
        local total=$(ls -1 "${BACKUP_DIR}"/ultra-dex-backup-*.tar.gz | wc -l | tr -d ' ')
        log "Total: ${total} backups"
    else
        warn "No backups found in ${BACKUP_DIR}"
    fi
}

verify_backup() {
    local backup_file="$1"

    if [ ! -f "${backup_file}" ]; then
        error "Backup file not found: ${backup_file}"
    fi

    log "Verifying: ${backup_file}"

    # Test integrity
    if tar -tzf "${backup_file}" > /dev/null 2>&1; then
        success "Archive integrity: OK"
    else
        error "Archive integrity: CORRUPTED"
    fi

    # Check manifest
    local temp_dir=$(mktemp -d)
    tar -xzf "${backup_file}" -C "${temp_dir}"
    local backup_dir=$(ls "${temp_dir}")

    if [ -f "${temp_dir}/${backup_dir}/manifest.json" ]; then
        success "Manifest: Found"
        cat "${temp_dir}/${backup_dir}/manifest.json"
    else
        warn "Manifest: Missing"
    fi

    rm -rf "${temp_dir}"
    success "Verification complete"
}

# ── Main ─────────────────────────────────────────────────────────────────

usage() {
    echo "Ultra-Dex Backup Automation"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  backup              Create a new backup"
    echo "  restore <file>      Restore from a backup file"
    echo "  list                List available backups"
    echo "  verify <file>       Verify backup integrity"
    echo "  rotate              Remove old backups"
    echo ""
    echo "Environment:"
    echo "  ULTRA_DEX_BACKUP_DIR  Backup directory (default: ./backups)"
    echo "  ULTRA_DEX_DATA_DIR    Data directory (default: ./data)"
    echo "  ULTRA_DEX_MAX_BACKUPS Max backups to keep (default: 30)"
}

case "${1:-help}" in
    backup)  backup ;;
    restore) restore "${2:-}" ;;
    list)    list_backups ;;
    verify)  verify_backup "${2:-}" ;;
    rotate)  rotate_backups ;;
    help)    usage ;;
    *)       usage; exit 1 ;;
esac