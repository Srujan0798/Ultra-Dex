#!/bin/bash
# One-command auto-heal for Render deployment
# Usage: ./scripts/render-auto-heal.sh

echo "═══════════════════════════════════════════════════════"
echo "   🤖 RENDER AUTO-HEAL SYSTEM"
echo "═══════════════════════════════════════════════════════"
echo ""

SERVICE_URL="https://ultra-dex.onrender.com"
REPO_URL="https://github.com/Srujan0798/Ultra-Dex"

# Function to check deployment
check_deployment() {
  curl -sf "$SERVICE_URL/health" > /dev/null 2>&1
  return $?
}

# Step 1: Check current status
echo "🔍 Checking deployment status..."
if check_deployment; then
  echo "✅ Deployment is already LIVE!"
  echo "   URL: $SERVICE_URL"
  echo "   Health: $SERVICE_URL/health"
  exit 0
fi

echo "❌ Deployment is down or building"
echo ""

# Step 2: Detect and fix common errors
echo "🔧 Checking for common errors..."

# Check if vite is missing in dashboard
if ! grep -q "vite" apps/dashboard/package.json 2>/dev/null; then
  echo "   Found: vite missing in dashboard"
  echo "   Fixing: Installing vite..."
  cd apps/dashboard && npm install vite --save-dev && cd ../..
fi

# Check for type errors
echo "   Checking TypeScript..."
npm run typecheck 2>/dev/null || echo "   ⚠️  Type errors found (may need manual fix)"

# Step 3: Build locally to verify
echo ""
echo "🔨 Testing build locally..."
npm run build 2>&1 | tail -20

if [ $? -eq 0 ]; then
  echo "✅ Local build successful"
else
  echo "❌ Local build failed - fix errors before pushing"
  exit 1
fi

# Step 4: Commit and push
echo ""
echo "📤 Pushing fixes to GitHub..."
git add -A
git commit -m "fix: Auto-heal deployment issues [$(date +%H:%M)]" || echo "Nothing to commit"
git push origin main

echo ""
echo "⏳ Render will auto-deploy in 2-3 minutes..."
echo ""

# Step 5: Wait for deployment
echo "Waiting for deployment to go live..."
for i in {1..30}; do
  echo -n "."
  sleep 10
  
  if check_deployment; then
    echo ""
    echo ""
    echo "🎉 SUCCESS! Deployment is LIVE!"
    echo ""
    echo "URLs:"
    echo "  🌐 App:      $SERVICE_URL"
    echo "  💚 Health:   $SERVICE_URL/health"
    echo "  📊 Status:   $SERVICE_URL/api/status"
    echo ""
    
    # Open browser (macOS)
    open "$SERVICE_URL/health" 2>/dev/null || true
    
    exit 0
  fi
done

echo ""
echo ""
echo "⏰ Timeout - deployment is taking longer than expected"
echo "Check manually: $SERVICE_URL/health"
exit 1
