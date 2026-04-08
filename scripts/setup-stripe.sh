#!/usr/bin/env bash
set -euo pipefail

if ! command -v stripe >/dev/null 2>&1; then
  echo "Error: stripe CLI is not installed."
  echo "Install: brew install stripe/stripe-cli/stripe"
  exit 1
fi

if ! stripe config --list >/dev/null 2>&1; then
  echo "Error: stripe CLI is not authenticated."
  echo "Run: stripe login"
  exit 1
fi

extract_id() {
  node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const obj=JSON.parse(d);console.log(obj.id);});"
}

echo "Creating Stripe products and prices for Ultra-Dex..."

PRO_PRODUCT_JSON="$(stripe products create --name 'Ultra-Dex Pro' --description 'Ultra-Dex Pro Plan')"
PRO_PRODUCT_ID="$(printf '%s' "$PRO_PRODUCT_JSON" | extract_id)"

ENT_PRODUCT_JSON="$(stripe products create --name 'Ultra-Dex Enterprise' --description 'Ultra-Dex Enterprise Plan')"
ENT_PRODUCT_ID="$(printf '%s' "$ENT_PRODUCT_JSON" | extract_id)"

PRO_PRICE_JSON="$(
  stripe prices create \
    --product "$PRO_PRODUCT_ID" \
    --currency usd \
    --unit-amount 2900 \
    --recurring interval=month
)"
PRO_PRICE_ID="$(printf '%s' "$PRO_PRICE_JSON" | extract_id)"

ENT_PRICE_JSON="$(
  stripe prices create \
    --product "$ENT_PRODUCT_ID" \
    --currency usd \
    --unit-amount 9900 \
    --recurring interval=month
)"
ENT_PRICE_ID="$(printf '%s' "$ENT_PRICE_JSON" | extract_id)"

echo
echo "Stripe setup complete. Add these to environment variables:"
echo "STRIPE_PRICE_PRO=$PRO_PRICE_ID"
echo "STRIPE_PRICE_ENTERPRISE=$ENT_PRICE_ID"
