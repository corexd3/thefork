#!/bin/bash

# Test with the ACTUAL request format that Vapi sends
# This is based on the real call log you provided

echo "Testing with actual Vapi request format..."
echo ""

curl -X POST http://localhost:3000/webhooks/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "toolCalls": [
        {
          "id": "call_W5Li5VmfGO1r4i1gCwYxYhRP",
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
        "id": "call_W5Li5VmfGO1r4i1gCwYxYhRP",
        "type": "function",
        "name": "checkAvailabilityALAKRAN",
        "parameters": {
          "hora": "20:00",
          "fecha": "2025-11-27",
          "personas": 4
        }
      },
      "call": {
        "id": "019aa141-4449-7775-8d7e-006f2a64e546",
        "orgId": "6017716f-353f-428a-ae9f-103326badf6c",
        "type": "inboundPhoneCall"
      }
    }
  }'

echo ""
echo ""
echo "If you see a proper response above, the fix worked!"
