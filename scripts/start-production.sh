#!/bin/bash
# Production start script

export NODE_ENV=production
export PORT=${PORT:-3000}

echo "🚀 Starting Ultra-Dex v3.0.0 Production Server..."
echo "   Port: $PORT"
echo "   Node: $(node --version)"
echo ""

node --import=tsx src/core/server/production-server.ts
