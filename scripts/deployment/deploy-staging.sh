#!/bin/bash
# Ultra-Dex Staging Deployment Script
# Usage: ./deploy-staging.sh [branch]

set -euo pipefail

BRANCH="${1:-develop}"
APP_NAME="ultra-dex-staging"
DEPLOY_DIR="/opt/ultra-dex-staging"
LOG_FILE="/var/log/ultra-dex-staging-deploy.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

error() {
    log "ERROR: $*"
    exit 1
}

log "Starting staging deployment from branch: $BRANCH..."

# Create directory
mkdir -p "$DEPLOY_DIR"

# Pull code
cd "$DEPLOY_DIR"
if [[ -d "current/.git" ]]; then
    cd current
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
else
    git clone -b "$BRANCH" https://github.com/Srujan0798/Ultra-Dex.git current
fi

# Run full test suite before deploying
log "Running test suite..."
cd "$DEPLOY_DIR/current"
npm ci 2>&1 | tail -10

if ! npm test; then
    error "Tests failed. Staging deployment aborted."
fi

# Build
log "Building..."
npm run build 2>&1 | tail -10

# Setup staging config
cp config/staging.json config/active.json

# Start/Restart service
log "Starting service..."
if command -v pm2 &> /dev/null; then
    pm2 restart "$APP_NAME" 2>/dev/null || pm2 start dist/index.js --name "$APP_NAME" --env staging
else
    nohup node dist/index.js > "$DEPLOY_DIR/app.log" 2>&1 &
fi

sleep 3

# Verify
if curl -sf http://localhost:3001/health > /dev/null; then
    log "✅ Staging deployment successful!"
else
    error "Health check failed."
fi

log "Staging URL: http://localhost:3001"
