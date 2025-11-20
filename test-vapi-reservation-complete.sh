#!/bin/bash

# Test the reservation-complete webhook with actual Vapi end-of-call format
# This simulates what Vapi sends when a call ends with structured data

echo "Testing reservation-complete webhook with actual Vapi format..."
echo ""

curl -X POST http://localhost:3000/webhooks/reservation-complete \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "end-of-call-report",
      "call": {
        "id": "019aa141-4449-7775-8d7e-006f2a64e546",
        "orgId": "6017716f-353f-428a-ae9f-103326badf6c",
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
          "special_requests": "mesa junto a la ventana, celebración de cumpleaños"
        }
      },
      "transcript": "AI: Hola, soy Marcos...\nUser: Quiero hacer una reserva...",
      "summary": "The customer made a reservation for November 27th at 8 PM for 4 people.",
      "startedAt": "2025-11-20T12:33:20.740Z",
      "endedAt": "2025-11-20T12:35:28.338Z",
      "cost": 0.1931,
      "durationSeconds": 127.598
    }
  }'

echo ""
echo ""
echo "If you see a success response with reservation summary above, the webhook is working!"
