#!/bin/bash
# Test Clerk Integration for Ultra-Dex

echo "═══════════════════════════════════════════════════════════════"
echo "   🔍 Testing Ultra-Dex Clerk Integration"
echo "═══════════════════════════════════════════════════════════════"
echo ""

BASE_URL="https://ultra-dex.onrender.com"
TEST_EMAIL="testuser_$(date +%s)@example.com"
TEST_PASSWORD="TestPass123!"
TEST_NAME="Test User"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📍 Testing URL: $BASE_URL"
echo "📧 Test Email: $TEST_EMAIL"
echo ""

# Test 1: Health Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Health Endpoint"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
HEALTH_RESPONSE=$(curl -s --max-time 10 "$BASE_URL/health" 2>&1)
HEALTH_STATUS=$?

if [ $HEALTH_STATUS -eq 0 ] && echo "$HEALTH_RESPONSE" | grep -q "status.*ok"; then
    echo -e "${GREEN}✅ Health Check PASSED${NC}"
    echo "Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Health Check FAILED${NC}"
    echo "Response: $HEALTH_RESPONSE"
    echo ""
    echo "⚠️  Site may still be building or have errors"
    echo "   Check: https://dashboard.render.com/web/srv-d7avn1tm5p6s73aki250"
    exit 1
fi

echo ""

# Test 2: User Registration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: User Registration (Clerk)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Sending POST /api/auth/register..."
REGISTER_RESPONSE=$(curl -s --max-time 15 -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}" 2>&1)

if echo "$REGISTER_RESPONSE" | grep -q '"user".*"id"'; then
    echo -e "${GREEN}✅ Registration PASSED${NC}"
    echo "User created successfully!"
    echo ""
    echo "Response:"
    echo "$REGISTER_RESPONSE" | head -c 500
    
    # Extract user ID
    USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo ""
    echo "User ID: $USER_ID"
    
elif echo "$REGISTER_RESPONSE" | grep -q "error\|Error"; then
    echo -e "${RED}❌ Registration FAILED${NC}"
    echo "Error Response:"
    echo "$REGISTER_RESPONSE"
else
    echo -e "${YELLOW}⚠️  Unexpected Response${NC}"
    echo "Response:"
    echo "$REGISTER_RESPONSE"
fi

echo ""

# Test 3: User Login
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: User Login (Clerk)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Sending POST /api/auth/login..."
LOGIN_RESPONSE=$(curl -s --max-time 15 -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" 2>&1)

if echo "$LOGIN_RESPONSE" | grep -q '"user".*"token"'; then
    echo -e "${GREEN}✅ Login PASSED${NC}"
    echo "Login successful!"
    echo ""
    echo "Response:"
    echo "$LOGIN_RESPONSE" | head -c 500
    
    # Extract token
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo ""
    echo "Session Token: ${TOKEN:0:20}..."
    
    # Test 4: User Profile
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Test 4: User Profile (Authenticated)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    echo "Sending GET /api/user/profile with token..."
    PROFILE_RESPONSE=$(curl -s --max-time 10 -H "Authorization: Bearer $TOKEN" \
      "$BASE_URL/api/user/profile" 2>&1)
    
    if echo "$PROFILE_RESPONSE" | grep -q '"id".*"email"'; then
        echo -e "${GREEN}✅ Profile Fetch PASSED${NC}"
        echo "Profile retrieved successfully!"
        echo ""
        echo "Response:"
        echo "$PROFILE_RESPONSE" | head -c 500
    else
        echo -e "${RED}❌ Profile Fetch FAILED${NC}"
        echo "Response: $PROFILE_RESPONSE"
    fi
    
else
    echo -e "${RED}❌ Login FAILED${NC}"
    echo "Response: $LOGIN_RESPONSE"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "   📊 TEST SUMMARY"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "If all tests show ✅, Clerk integration is WORKING!"
echo ""
echo "Next steps:"
echo "   1. Check Clerk Dashboard: https://dashboard.clerk.com"
echo "      → You should see the test user created"
echo ""
echo "   2. Check Better Stack: https://uptime.betterstack.com"
echo "      → You should see 'user_signup' events"
echo ""
echo "═══════════════════════════════════════════════════════════════"
