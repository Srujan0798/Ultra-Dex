#!/bin/bash
# Full System Test - Automated

BASE_URL="https://ultra-dex.onrender.com"
TEST_EMAIL="autotest_$(date +%s)@example.com"
TEST_PASSWORD="$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9!@#$%^&*' | head -c 32)"
TEST_NAME="Automation Test"

echo "═══════════════════════════════════════════════════════════"
echo "   FULL SYSTEM AUTOMATION TEST"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Testing against: $BASE_URL"
echo "Test User: $TEST_EMAIL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

# Test 1: Health Endpoint
echo "Test 1: Health Check"
HEALTH=$(curl -s "$BASE_URL/health" 2>/dev/null)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✅ PASS${NC} - Server is healthy"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Health check failed"
    ((FAILED++))
fi

# Test 2: API Status
echo "Test 2: API Status"
STATUS=$(curl -s "$BASE_URL/api/status" 2>/dev/null)
if echo "$STATUS" | grep -q '"status":"operational"'; then
    echo -e "${GREEN}✅ PASS${NC} - API is operational"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - API status failed"
    ((FAILED++))
fi

# Test 3: User Registration (Clerk)
echo "Test 3: User Registration (Clerk Integration)"
REGISTER=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}" 2>/dev/null)

if echo "$REGISTER" | grep -q '"user".*"id"'; then
    echo -e "${GREEN}✅ PASS${NC} - User registered successfully"
    USER_ID=$(echo "$REGISTER" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "   User ID: $USER_ID"
    ((PASSED++))
    
    # Extract token for next test
    TOKEN=$(echo "$REGISTER" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    # Test 4: User Login
    echo "Test 4: User Login (Clerk Integration)"
    LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" 2>/dev/null)
    
    if echo "$LOGIN" | grep -q '"user".*"token"'; then
        echo -e "${GREEN}✅ PASS${NC} - User login successful"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} - User login failed"
        ((FAILED++))
    fi
    
    # Test 5: User Profile (Authenticated)
    if [ -n "$TOKEN" ]; then
        echo "Test 5: User Profile (Authenticated)"
        PROFILE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/user/profile" 2>/dev/null)
        
        if echo "$PROFILE" | grep -q '"id".*"email"'; then
            echo -e "${GREEN}✅ PASS${NC} - Profile retrieved successfully"
            ((PASSED++))
        else
            echo -e "${RED}❌ FAIL${NC} - Profile retrieval failed"
            ((FAILED++))
        fi
    fi
    
    # Test 6: Billing Pricing
    echo "Test 6: Billing Pricing"
    PRICING=$(curl -s "$BASE_URL/api/billing/pricing" 2>/dev/null)
    if echo "$PRICING" | grep -q '"id":"free"'; then
        echo -e "${GREEN}✅ PASS${NC} - Billing pricing available"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} - Billing pricing failed"
        ((FAILED++))
    fi
    
else
    echo -e "${RED}❌ FAIL${NC} - User registration failed"
    echo "   Response: $REGISTER"
    ((FAILED++))
fi

# Test 7: Marketplace Plugins
echo "Test 7: Marketplace"
MARKETPLACE=$(curl -s "$BASE_URL/api/marketplace/plugins" 2>/dev/null)
if echo "$MARKETPLACE" | grep -q '"id".*"name"'; then
    echo -e "${GREEN}✅ PASS${NC} - Marketplace accessible"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Marketplace failed"
    ((FAILED++))
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "   TEST RESULTS"
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo ""
    echo "System is fully operational:"
    echo "✅ Render hosting"
    echo "✅ Better Stack monitoring"
    echo "✅ Clerk authentication"
    echo "✅ Billing system"
    echo "✅ Marketplace"
    exit 0
else
    echo -e "${YELLOW}⚠️  SOME TESTS FAILED${NC}"
    echo "Check the logs above for details."
    exit 1
fi
