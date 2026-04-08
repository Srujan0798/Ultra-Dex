#!/bin/bash
# Simple uptime monitoring script

URL=${1:-http://localhost:3000/health}
INTERVAL=${2:-60}
LOG_FILE="/var/log/ultra-dex-uptime.log"

while true; do
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  
  if curl -sf "$URL" > /dev/null 2>&1; then
    echo "[$TIMESTAMP] ✅ UP - $URL"
  else
    echo "[$TIMESTAMP] ❌ DOWN - $URL"
    # Could send alert here
  fi
  
  sleep "$INTERVAL"
done
