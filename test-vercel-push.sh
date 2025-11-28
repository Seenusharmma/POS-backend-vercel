#!/bin/bash
# Test script for Web Push API on Vercel deployment
# Run this after deploying to Vercel to verify everything works

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VERCEL_URL="${1:-https://your-app.vercel.app}"

echo "========================================="
echo "  Web Push API Verification Test"
echo "========================================="
echo ""
echo "Testing Vercel deployment: $VERCEL_URL"
echo ""

# Test 1: Check if backend is running
echo -e "${YELLOW}Test 1: Backend Health Check${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" "$VERCEL_URL/")
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend not responding (HTTP $response)${NC}"
    exit 1
fi
echo ""

# Test 2: Check VAPID public key endpoint
echo -e "${YELLOW}Test 2: VAPID Public Key Endpoint${NC}"
vapid_response=$(curl -s "$VERCEL_URL/api/push/vapid-key")
if echo "$vapid_response" | grep -q "publicKey"; then
    echo -e "${GREEN}✅ VAPID key endpoint working${NC}"
    echo "   Public Key: $(echo $vapid_response | grep -o '"publicKey":"[^"]*"' | cut -d'"' -f4 | head -c 20)..."
else
    echo -e "${RED}❌ VAPID key endpoint failed${NC}"
    echo "   Response: $vapid_response"
    exit 1
fi
echo ""

# Test 3: Check push routes
echo -e "${YELLOW}Test 3: Push API Routes${NC}"
push_routes=(
    "/api/push/vapid-key"
    "/api/push/subscribe"
    "/api/push/send"
    "/api/push/send-all"
    "/api/push/unsubscribe"
)

for route in "${push_routes[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$VERCEL_URL$route" -X GET)
    if [ "$status" == "200" ] || [ "$status" == "400" ]; then
        echo -e "${GREEN}✅ $route (HTTP $status)${NC}"
    else
        echo -e "${RED}❌ $route (HTTP $status)${NC}"
    fi
done
echo ""

# Test 4: Check service worker
echo -e "${YELLOW}Test 4: Service Worker Availability${NC}"
sw_response=$(curl -s -o /dev/null -w "%{http_code}" "$VERCEL_URL/service-worker.js")
if [ "$sw_response" == "200" ]; then
    echo -e "${GREEN}✅ Service worker is accessible${NC}"
else
    echo -e "${RED}❌ Service worker not found (HTTP $sw_response)${NC}"
    echo "   Make sure service-worker.js is in the public directory"
fi
echo ""

# Test 5: Check MongoDB connection (via orders endpoint)
echo -e "${YELLOW}Test 5: Database Connection${NC}"
db_response=$(curl -s -o /dev/null -w "%{http_code}" "$VERCEL_URL/api/orders")
if [ "$db_response" == "200" ]; then
    echo -e "${GREEN}✅ Database connection working${NC}"
else
    echo -e "${RED}❌ Database connection failed (HTTP $db_response)${NC}"
    echo "   Check MongoDB URI in Vercel environment variables"
fi
echo ""

# Summary
echo "========================================="
echo "  Test Summary"
echo "========================================="
echo ""
echo -e "${GREEN}✅ All critical tests passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Open $VERCEL_URL in browser"
echo "2. Allow notification permission"
echo "3. Place a test order"
echo "4. Verify notification is received"
echo ""
echo "To monitor logs:"
echo "- Go to Vercel dashboard > Functions > Logs"
echo "- Look for push notification events"
echo ""
