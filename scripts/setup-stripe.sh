#!/usr/bin/env bash
# =============================================================================
# Ultra-Dex Stripe Product Setup
# =============================================================================
# Uses the Stripe CLI to create products, prices, and webhook endpoints.
# Requires: stripe CLI installed and authenticated (stripe login).
#
# Usage:
#   ./scripts/setup-stripe.sh [--live] [--webhook-url <URL>]
#
# Flags:
#   --live             Use live mode (default is test mode)
#   --webhook-url      Override the webhook URL (default: https://<hostname>/api/stripe/webhook)
# =============================================================================

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ── Defaults ─────────────────────────────────────────────────────────────────
LIVE_MODE=false
WEBHOOK_URL=""
DEPLOYMENT_HOST="${RENDER_EXTERNAL_HOSTNAME:-localhost:3000}"
DEFAULT_WEBHOOK_URL="https://${DEPLOYMENT_HOST}/api/stripe/webhook"

# ── Parse arguments ──────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --live)
      LIVE_MODE=true
      shift
      ;;
    --webhook-url)
      WEBHOOK_URL="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [--live] [--webhook-url <URL>]"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

if [[ -z "$WEBHOOK_URL" ]]; then
  WEBHOOK_URL="$DEFAULT_WEBHOOK_URL"
fi

MODE_FLAG=""
if [[ "$LIVE_MODE" == true ]]; then
  MODE_FLAG="--live"
fi

# ── Helpers ──────────────────────────────────────────────────────────────────
info()    { echo -e "${CYAN}ℹ  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn()    { echo -e "${YELLOW}⚠️  $1${NC}"; }
error()   { echo -e "${RED}❌ $1${NC}" >&2; }
die()     { error "$1"; exit 1; }

# ── Pre-flight checks ────────────────────────────────────────────────────────
info "Ultra-Dex Stripe Setup"
echo "─────────────────────────────────────────────"

if ! command -v stripe &>/dev/null; then
  die "Stripe CLI not found. Install it: https://docs.stripe.com/stripe-cli"
fi

# Verify the CLI is authenticated
if ! stripe config --list &>/dev/null; then
  die "Stripe CLI not authenticated. Run: stripe login"
fi

ACCOUNT_MODE=$(stripe config --list 2>/dev/null | grep "mode" | awk '{print $2}' || echo "test")
if [[ "$LIVE_MODE" == true ]]; then
  info "Mode: ${BOLD}LIVE${NC} — real charges will apply!"
  read -rp "Are you sure? (y/N) " confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || die "Aborted."
else
  info "Mode: ${BOLD}TEST${NC}"
fi

echo ""
info "Products to create:"
echo "  1. Ultra-Dex Free        — \$0/mo"
echo "  2. Ultra-Dex Pro         — \$29/mo"
echo "  3. Ultra-Dex Enterprise  — \$99/mo"
echo ""
info "Webhook URL: ${BOLD}${WEBHOOK_URL}${NC}"
echo ""
read -rp "Continue? (y/N) " confirm
[[ "$confirm" =~ ^[Yy]$ ]] || die "Aborted."
echo ""

# ── Track created IDs for output ─────────────────────────────────────────────
declare -A PRODUCT_IDS
declare -A PRICE_IDS

# ── Helper: create product (idempotent by name) ──────────────────────────────
create_product() {
  local name="$1"
  local description="$2"
  local existing

  existing=$(stripe products search --query "name:'${name}'" $MODE_FLAG --json 2>/dev/null || echo "[]")
  local count
  count=$(echo "$existing" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data',[])))" 2>/dev/null || echo "0")

  if [[ "$count" -gt 0 ]]; then
    local id
    id=$(echo "$existing" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])" 2>/dev/null)
    warn "Product '${name}' already exists: ${id}"
    PRODUCT_IDS["$name"]="$id"
  else
    info "Creating product: ${name}..."
    local result
    result=$(stripe products create $MODE_FLAG \
      --name "$name" \
      --description "$description" \
      --json 2>/dev/null) || die "Failed to create product '${name}'"
    local id
    id=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
    success "Created product '${name}': ${id}"
    PRODUCT_IDS["$name"]="$id"
  fi
}

# ── Helper: create price (idempotent by product + amount) ────────────────────
create_price() {
  local product_name="$1"
  local amount="$2"   # in cents (0 = free)
  local currency="${3:-usd}"
  local product_id="${PRODUCT_IDS[$product_name]}"

  if [[ -z "$product_id" ]]; then
    die "Product '${product_name}' not found in PRODUCT_IDS"
  fi

  # Check for existing price
  local existing
  existing=$(stripe prices list --product "$product_id" $MODE_FLAG --json 2>/dev/null || echo "[]")
  local found
  found=$(echo "$existing" | python3 -c "
import sys, json
data = json.load(sys.stdin).get('data', [])
for p in data:
    if p.get('unit_amount') == ${amount} and p.get('currency') == '${currency}' and p.get('recurring',{}).get('interval') == 'month':
        print(p['id'])
        break
" 2>/dev/null || echo "")

  if [[ -n "$found" ]]; then
    warn "Price for '${product_name}' (\$$(printf '%.2f' "$((amount / 100))")) already exists: ${found}"
    PRICE_IDS["$product_name"]="$found"
  else
    info "Creating price for '${product_name}'..."
    local args=(prices create $MODE_FLAG --product "$product_id" --unit-amount "$amount" --currency "$currency" --recurring-interval month --json)
    local result
    result=$(stripe "${args[@]}" 2>/dev/null) || die "Failed to create price for '${product_name}'"
    local id
    id=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
    success "Created price for '${product_name}': ${id}"
    PRICE_IDS["$product_name"]="$id"
  fi
}

# ── Create products ──────────────────────────────────────────────────────────
echo "═══════════════════════════════════════════"
echo -e "${BOLD}  Step 1: Products${NC}"
echo "═══════════════════════════════════════════"

create_product "Ultra-Dex Free" "Free tier — community access, basic features"
create_product "Ultra-Dex Pro" "Pro tier — full AI orchestration, unlimited agents"
create_product "Ultra-Dex Enterprise" "Enterprise tier — SSO, SLA, dedicated support"

echo ""

# ── Create prices ────────────────────────────────────────────────────────────
echo "═══════════════════════════════════════════"
echo -e "${BOLD}  Step 2: Prices${NC}"
echo "═══════════════════════════════════════════"

create_price "Ultra-Dex Free" 0
create_price "Ultra-Dex Pro" 2900
create_price "Ultra-Dex Enterprise" 9900

echo ""

# ── Webhook endpoint ─────────────────────────────────────────────────────────
echo "═══════════════════════════════════════════"
echo -e "${BOLD}  Step 3: Webhook Endpoint${NC}"
echo "═══════════════════════════════════════════"

info "Checking existing webhook endpoints..."
EXISTING_WEBHOOKS=$(stripe webhook_endpoints list $MODE_FLAG --json 2>/dev/null || echo "[]")
MATCHING=$(echo "$EXISTING_WEBHOOKS" | python3 -c "
import sys, json
data = json.load(sys.stdin).get('data', [])
for w in data:
    if w.get('url') == '${WEBHOOK_URL}':
        print(w['id'])
        break
" 2>/dev/null || echo "")

if [[ -n "$MATCHING" ]]; then
  warn "Webhook endpoint already exists: ${MATCHING}"
else
  info "Creating webhook endpoint: ${WEBHOOK_URL}..."
  WEBHOOK_RESULT=$(stripe webhook_endpoints create $MODE_FLAG \
    --url "$WEBHOOK_URL" \
    --enabled-events checkout.session.completed \
    --enabled-events customer.subscription.created \
    --enabled-events customer.subscription.updated \
    --enabled-events customer.subscription.deleted \
    --enabled-events invoice.payment_succeeded \
    --enabled-events invoice.payment_failed \
    --json 2>/dev/null) || die "Failed to create webhook endpoint"

  WEBHOOK_ID=$(echo "$WEBHOOK_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
  success "Created webhook endpoint: ${WEBHOOK_ID}"
fi

echo ""

# ── Summary ──────────────────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════"
echo -e "${BOLD}  Setup Complete!${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}Add these to your .env file:${NC}"
echo ""
echo "  # Stripe Configuration"
echo "  STRIPE_SECRET_KEY=\$(stripe config --list | grep secret_key | awk '{print \$2}')"
echo "  STRIPE_PUBLISHABLE_KEY=\$(stripe config --list | grep publishable_key | awk '{print \$2}')"
echo ""
echo "  # Product Price IDs"
echo "  STRIPE_PRICE_FREE=\"${PRICE_IDS[Ultra-Dex Free]}\""
echo "  STRIPE_PRICE_PRO=\"${PRICE_IDS[Ultra-Dex Pro]}\""
echo "  STRIPE_PRICE_ENTERPRISE=\"${PRICE_IDS[Ultra-Dex Enterprise]}\""
echo ""
echo -e "${GREEN}  # Webhook URL${NC}"
echo "  STRIPE_WEBHOOK_URL=\"${WEBHOOK_URL}\""
echo ""
echo "─────────────────────────────────────────────────────────"
info "Next steps:"
echo "  1. Copy the Price IDs above into your .env file"
echo "  2. Run 'stripe listen --forward-to ${WEBHOOK_URL}' for local testing"
echo "  3. Configure the webhook signing secret in your app"
echo "─────────────────────────────────────────────────────────"
