#!/bin/bash
# Ultra-Dex Health Check Script
# Usage: ./health-check.sh [host] [port]
# Exit 0 if healthy, 1 if any check fails

set -uo pipefail

HOST="${1:-localhost}"
PORT="${2:-3000}"
TIMEOUT=10
FAILED=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_endpoint() {
    local endpoint=$1
    local name=$2
    
    echo -n "Checking $name... "
    
    if response=$(curl -sf -m "$TIMEOUT" "http://$HOST:$PORT$endpoint" 2>/dev/null); then
        echo -e "${GREEN}✓ PASS${NC}"
        echo "  Response: $(echo "$response" | head -c 100)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        FAILED=1
        return 1
    fi
}

echo "================================"
echo "Ultra-Dex Health Check"
echo "Target: http://$HOST:$PORT"
echo "Time: $(date)"
echo "================================"
echo ""

# Basic health
check_endpoint "/health" "Basic Health"
echo ""

# Readiness check
check_endpoint "/health/ready" "Readiness"
echo ""

# Deep health (comprehensive)
check_endpoint "/health/deep" "Deep Health"
echo ""

# Application-specific checks
echo "Checking AI Provider Status..."
if curl -sf -m "$TIMEOUT" "http://$HOST:$PORT/health/ai" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ AI Providers OK${NC}"
else
    echo -e "${YELLOW}⚠ AI Providers check skipped or failed${NC}"
fi
echo ""

echo "Checking Memory System..."
if curl -sf -m "$TIMEOUT" "http://$HOST:$PORT/health/memory" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Memory System OK${NC}"
else
    echo -e "${YELLOW}⚠ Memory check skipped or failed${NC}"
fi
echo ""

# Summary
echo "================================"
if [[ $FAILED -eq 0 ]]; then
    echo -e "${GREEN}✓ ALL CHECKS PASSED${NC}"
    echo "System is healthy and ready for traffic."
    exit 0
else
    echo -e "${RED}✗ SOME CHECKS FAILED${NC}"
    echo "Please investigate the failures above."
    exit 1
fi
