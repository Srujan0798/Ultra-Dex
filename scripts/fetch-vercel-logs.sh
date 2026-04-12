#!/bin/bash
# Fetch Vercel logs easily - Just run: ./scripts/fetch-vercel-logs.sh
# Or with specific deployment: ./scripts/fetch-vercel-logs.sh dep_12345

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔍 Fetching Vercel Logs...${NC}"

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI not found. Installing...${NC}"
    npm i -g vercel@latest
fi

# Check for token
if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${RED}❌ VERCEL_TOKEN not set!${NC}"
    echo "Set it with: export VERCEL_TOKEN='your-token'"
    echo "Or login manually: vercel login"
    exit 1
fi

# Get deployment ID
if [ -z "$1" ]; then
    echo -e "${YELLOW}No deployment ID provided. Fetching latest...${NC}"
    DEPLOYMENT_JSON=$(vercel list --token="$VERCEL_TOKEN" --scope="$VERCEL_ORG_ID" --json 2>/dev/null | head -1)
    if [ -z "$DEPLOYMENT_JSON" ]; then
        echo -e "${RED}❌ Failed to fetch deployments. Check your VERCEL_TOKEN.${NC}"
        exit 1
    fi
    DEPLOYMENT_ID=$(echo "$DEPLOYMENT_JSON" | jq -r '.uid')
    DEPLOYMENT_URL=$(echo "$DEPLOYMENT_JSON" | jq -r '.url')
    echo -e "${GREEN}✓ Found deployment: $DEPLOYMENT_URL${NC}"
else
    DEPLOYMENT_ID="$1"
    echo -e "${GREEN}✓ Using deployment: $DEPLOYMENT_ID${NC}"
fi

# Create logs directory
LOG_DIR="logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/vercel-$(date +%Y%m%d-%H%M%S).log"

echo -e "${YELLOW}📥 Downloading logs...${NC}"

# Fetch logs
vercel logs "$DEPLOYMENT_ID" \
    --token="$VERCEL_TOKEN" \
    --scope="$VERCEL_ORG_ID" \
    --since="1h" \
    --output="raw" > "$LOG_FILE" 2>&1 || {
    echo -e "${RED}❌ Failed to fetch logs. Error saved to $LOG_FILE${NC}"
    exit 1
}

echo -e "${GREEN}✓ Logs saved to: $LOG_FILE${NC}"
echo ""
echo -e "${YELLOW}📋 Last 50 lines:${NC}"
echo "=========================================="
tail -50 "$LOG_FILE"
echo "=========================================="
echo ""
echo -e "${GREEN}Full logs: cat $LOG_FILE${NC}"
echo -e "${GREEN}Open in editor: code $LOG_FILE${NC}"
