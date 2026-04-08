#!/bin/bash
# Check if all environment variables are set

echo "═══════════════════════════════════════════════════════════"
echo "   ENVIRONMENT VARIABLES CHECK"
echo "═══════════════════════════════════════════════════════════"
echo ""

REQUIRED_VARS=(
    "NODE_ENV"
    "PORT"
    "NVIDIA_API_KEY"
    "CLERK_PUBLISHABLE_KEY"
    "CLERK_SECRET_KEY"
    "BETTER_STACK_SOURCE_TOKEN"
    "SENTRY_DSN"
    "STRIPE_SECRET_KEY"
    "STRIPE_PUBLISHABLE_KEY"
    "STRIPE_WEBHOOK_SECRET"
)

MISSING=0

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ MISSING: $var"
        ((MISSING++))
    else
        echo "✅ SET: $var"
    fi
done

echo ""
if [ $MISSING -eq 0 ]; then
    echo "🎉 All environment variables are set!"
else
    echo "⚠️  $MISSING variables are missing!"
    echo "Add them to Render Dashboard → Environment"
fi
