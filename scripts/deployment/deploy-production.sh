#!/bin/bash
# Ultra-Dex Production Deployment Script
# Usage: ./deploy-production.sh [version]

set -euo pipefail

VERSION="${1:-latest}"
APP_NAME="ultra-dex"
DEPLOY_DIR="/opt/ultra-dex"
BACKUP_DIR="/opt/backups/ultra-dex"
LOG_FILE="/var/log/ultra-dex-deploy.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

error() {
    log "ERROR: $*"
    exit 1
}

# Pre-deployment checks
log "Starting production deployment v$VERSION..."

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "Do not run as root. Use a service account."
fi

# Create directories
mkdir -p "$DEPLOY_DIR" "$BACKUP_DIR"

# Backup current deployment
if [[ -d "$DEPLOY_DIR/current" ]]; then
    log "Creating backup..."
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    tar -czf "$BACKUP_DIR/$BACKUP_NAME" -C "$DEPLOY_DIR" current 2>/dev/null || true
    log "Backup created: $BACKUP_NAME"
fi

# Pull latest code
log "Pulling code..."
cd "$DEPLOY_DIR"
if [[ -d "current/.git" ]]; then
    cd current
    git fetch origin
    git checkout "v$VERSION" 2>/dev/null || git checkout main
    git pull origin main
else
    git clone https://github.com/Srujan0798/Ultra-Dex.git current
fi

# Install dependencies
log "Installing dependencies..."
cd "$DEPLOY_DIR/current"
npm ci --production 2>&1 | tail -20

# Build application
log "Building application..."
npm run build 2>&1 | tail -10

# Run health check before switching
log "Running pre-deployment health check..."
if ! ./scripts/deployment/health-check.sh; then
    error "Health check failed. Aborting deployment."
fi

# Copy production config
log "Setting up production configuration..."
cp config/production.json config/active.json

# Restart service (using systemd or pm2)
log "Restarting service..."
if command -v systemctl &> /dev/null; then
    sudo systemctl restart ultra-dex || error "Failed to restart systemd service"
elif command -v pm2 &> /dev/null; then
    pm2 restart ultra-dex || pm2 start dist/index.js --name ultra-dex
else
    log "WARNING: No service manager found. Manual restart required."
fi

# Post-deployment verification
sleep 5
log "Running post-deployment verification..."
if ./scripts/deployment/health-check.sh; then
    log "✅ Deployment successful! v$VERSION is live."
else
    error "Post-deployment health check failed. Consider rollback."
fi

log "Deployment complete."
