#!/bin/bash
# One-click deployment checker

URL="https://ultra-dex.onrender.com"
MAX_RETRIES=30
RETRY_DELAY=10

echo "🚀 Auto-checking Ultra-Dex deployment..."
echo "URL: $URL"
echo ""

for i in $(seq 1 $MAX_RETRIES); do
  echo -n "Check $i/$MAX_RETRIES: "
  
  RESPONSE=$(curl -sf "$URL/health" 2>/dev/null)
  
  if [ $? -eq 0 ]; then
    echo "✅ LIVE!"
    echo ""
    echo "Response: $RESPONSE"
    echo ""
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "Your URLs:"
    echo "  Health:  $URL/health"
    echo "  Status:  $URL/api/status"
    echo "  App:     $URL"
    echo ""
    
    # Open browser (macOS)
    open "$URL/health" 2>/dev/null || true
    
    exit 0
  else
    echo "⏳ Still building..."
  fi
  
  sleep $RETRY_DELAY
done

echo ""
echo "❌ Timeout after $MAX_RETRIES attempts"
echo "Check manually: $URL/health"
exit 1
