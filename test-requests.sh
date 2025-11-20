#!/bin/bash

# Test requests for Hacienda Alakran Vapi Service
# Make this file executable: chmod +x test-requests.sh

BASE_URL="http://localhost:3000"

echo "=========================================="
echo "Testing Hacienda Alakran Vapi Service"
echo "=========================================="
echo ""

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -s "$BASE_URL/health" | jq .
echo ""
echo ""

# Test 2: Check Availability - Valid Request
echo "2. Testing Check Availability (Valid)..."
curl -s -X POST "$BASE_URL/webhooks/check-availability" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "function-call",
      "functionCall": {
        "name": "checkAvailabilityALAKRAN",
        "id": "test-123",
        "parameters": {
          "hora": "13:00",
          "fecha": "2025-09-03",
          "personas": 4
        }
      }
    }
  }' | jq .
echo ""
echo ""

# Test 3: Check Availability - Invalid Date
echo "3. Testing Check Availability (Invalid Date)..."
curl -s -X POST "$BASE_URL/webhooks/check-availability" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "function-call",
      "functionCall": {
        "name": "checkAvailabilityALAKRAN",
        "id": "test-456",
        "parameters": {
          "hora": "13:00",
          "fecha": "03/09/2025",
          "personas": 4
        }
      }
    }
  }' | jq .
echo ""
echo ""

# Test 4: Reservation Complete - Full Data
echo "4. Testing Reservation Complete (Full Data)..."
curl -s -X POST "$BASE_URL/webhooks/reservation-complete" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "end-of-call-report",
      "structuredData": {
        "reservation": {
          "date": "2025-09-03",
          "time": "13:00",
          "people": 4,
          "full_name": "Juan Pérez",
          "honorific": "Sr.",
          "baby": false,
          "allergies": "gluten",
          "special_requests": "mesa junto a la ventana"
        }
      }
    }
  }' | jq .
echo ""
echo ""

# Test 5: Reservation Complete - With Baby
echo "5. Testing Reservation Complete (With Baby)..."
curl -s -X POST "$BASE_URL/webhooks/reservation-complete" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "end-of-call-report",
      "structuredData": {
        "reservation": {
          "date": "2025-12-25",
          "time": "19:30",
          "people": 2,
          "full_name": "María García",
          "honorific": "Sra.",
          "baby": true,
          "allergies": "",
          "special_requests": "necesito silla alta para bebé"
        }
      }
    }
  }' | jq .
echo ""
echo ""

echo "=========================================="
echo "All tests completed!"
echo "=========================================="
