#!/bin/bash
# Fetch Render deployment status and logs

SERVICE_ID="srv-d7avn1tm5p6s73aki250"
URL="https://ultra-dex.onrender.com"

echo "═══════════════════════════════════════════════════════════"
echo "   📊 RENDER DEPLOYMENT STATUS CHECKER"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check if live
echo "🔍 Checking deployment status..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL/health" 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SERVICE IS LIVE!"
    echo ""
    echo "Response:"
    curl -s "$URL/health" | head -1
    echo ""
    echo "API Status:"
    curl -s "$URL/api/status" 2>/dev/null | head -1
    exit 0
else
    echo "⏳ Service not ready yet (HTTP $HTTP_CODE)"
    echo ""
    echo "Recent curl attempt details:"
    curl -v "$URL/health" 2>&1 | grep -E "(Trying|Connected|HTTP|failed)" | head -10
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "   ⏳ RENDER IS STILL BUILDING"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "This is normal! Build takes 3-5 minutes."
echo ""
echo "To monitor manually:"
echo "  1. Go to: https://dashboard.render.com"
echo "  2. Click: Ultra-Dex service"
echo "  3. Watch: Logs tab"
echo ""
echo "Auto-refresh this check:"
echo "  watch -n 10 ./scripts/fetch-render-logs.sh"
