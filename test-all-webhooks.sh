#!/bin/bash

# Comprehensive test for all Vapi webhooks
# Tests both availability check and reservation complete endpoints

echo "========================================"
echo "Testing All Vapi Webhooks"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "1. Testing Health Check..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed${NC}"
    echo "$HEALTH_RESPONSE"
fi
echo ""

# Test 2: Check Availability Webhook
echo "2. Testing Check Availability Webhook..."
echo "   (Simulating Vapi function call)"
AVAILABILITY_RESPONSE=$(curl -s -X POST http://localhost:3000/webhooks/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "toolCalls": [
        {
          "id": "call_test_123",
          "type": "function",
          "function": {
            "name": "checkAvailabilityALAKRAN",
            "arguments": "{\n  \"hora\": \"20:00\",\n  \"fecha\": \"2025-11-27\",\n  \"personas\": 4\n}"
          }
        }
      ],
      "role": "tool_calls",
      "type": "function-call",
      "time": 1763642063200,
      "secondsFromStart": 62.46,
      "functionCall": {
        "id": "call_test_123",
        "type": "function",
        "name": "checkAvailabilityALAKRAN",
        "parameters": {
          "hora": "20:00",
          "fecha": "2025-11-27",
          "personas": 4
        }
      },
      "call": {
        "id": "test-call-id",
        "orgId": "test-org-id",
        "type": "inboundPhoneCall"
      }
    }
  }')

if echo "$AVAILABILITY_RESPONSE" | grep -q "results"; then
    echo -e "${GREEN}✓ Availability check webhook passed${NC}"
    echo "   Response: $(echo $AVAILABILITY_RESPONSE | jq -r '.results[0].result' 2>/dev/null || echo $AVAILABILITY_RESPONSE)"
else
    echo -e "${RED}✗ Availability check webhook failed${NC}"
    echo "$AVAILABILITY_RESPONSE"
fi
echo ""

# Test 3: Reservation Complete Webhook
echo "3. Testing Reservation Complete Webhook..."
echo "   (Simulating Vapi end-of-call report)"
RESERVATION_RESPONSE=$(curl -s -X POST http://localhost:3000/webhooks/reservation-complete \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "end-of-call-report",
      "call": {
        "id": "test-call-id",
        "orgId": "test-org-id",
        "createdAt": "2025-11-20T12:33:20.457Z",
        "updatedAt": "2025-11-20T12:35:28.338Z",
        "type": "inboundPhoneCall",
        "status": "ended",
        "endedReason": "customer-ended-call",
        "customer": {
          "number": "+34655720245"
        }
      },
      "structuredData": {
        "reservation": {
          "date": "2025-11-27",
          "time": "20:00",
          "people": 4,
          "full_name": "Juan Pérez García",
          "honorific": "Sr.",
          "baby": false,
          "allergies": "gluten, lactosa",
          "special_requests": "mesa junto a la ventana"
        }
      },
      "transcript": "Test transcript",
      "summary": "Test reservation",
      "startedAt": "2025-11-20T12:33:20.740Z",
      "endedAt": "2025-11-20T12:35:28.338Z",
      "cost": 0.1931,
      "durationSeconds": 127.598
    }
  }')

if echo "$RESERVATION_RESPONSE" | grep -q "success.*true"; then
    echo -e "${GREEN}✓ Reservation complete webhook passed${NC}"
    echo "   Reservation ID: $(echo $RESERVATION_RESPONSE | jq -r '.data.reservationId' 2>/dev/null || echo 'N/A')"
    echo "   Customer: $(echo $RESERVATION_RESPONSE | jq -r '.data.customer' 2>/dev/null || echo 'N/A')"
else
    echo -e "${RED}✗ Reservation complete webhook failed${NC}"
    echo "$RESERVATION_RESPONSE"
fi
echo ""

# Summary
echo "========================================"
echo "Test Summary"
echo "========================================"
echo ""
echo -e "${YELLOW}All tests completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Make sure ngrok is running: ngrok http 3000"
echo "2. Update Vapi dashboard with your ngrok URL"
echo "3. Make a test call through Vapi"
echo ""
