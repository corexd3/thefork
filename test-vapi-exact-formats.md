# Exact Vapi Request Formats

This document shows the **exact** request formats that Vapi sends to your webhooks, extracted from real call logs.

## 1. Check Availability Request (Function Tool)

**When:** During a call when the assistant needs to check availability

**Endpoint:** `POST /webhooks/check-availability`

**Exact Format:**
```json
{
  "message": {
    "toolCalls": [
      {
        "id": "call_W5Li5VmfGO1r4i1gCwYxYhRP",
        "type": "function",
        "function": {
          "name": "checkAvailabilityALAKRAN",
          "arguments": "{\n  \"hora\": \"20:00\",\n  \"fecha\": \"2023-11-27\",\n  \"personas\": 4\n}"
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
        "fecha": "2023-11-27",
        "personas": 4
      }
    },
    "call": {
      "id": "019aa141-4449-7775-8d7e-006f2a64e546",
      "orgId": "6017716f-353f-428a-ae9f-103326badf6c",
      "type": "inboundPhoneCall"
    }
  }
}
```

**Key Fields:**
- `message.type`: "function-call"
- `message.functionCall.name`: Must match function name in Vapi
- `message.functionCall.parameters`: The actual parameters
- `message.functionCall.id`: Tool call ID (needed for response)
- Extra fields: `toolCalls`, `call`, `time`, `role`, `secondsFromStart`

**Expected Response:**
```json
{
  "results": [{
    "toolCallId": "call_W5Li5VmfGO1r4i1gCwYxYhRP",
    "result": "Perfecto, tenemos disponibilidad para 4 personas el 2023-11-27 a las 20:00. ¿Desea confirmar la reserva?"
  }]
}
```

---

## 2. Reservation Complete Request (End-of-Call Report)

**When:** After a call ends and structured data is collected

**Endpoint:** `POST /webhooks/reservation-complete`

**Exact Format (from Vapi docs):**
```json
{
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
      "assistantId": "15867747-f6fd-42b3-a353-63687fecc2b4",
      "phoneNumberId": "9285f1a8-b62f-4ff0-89ab-bdaa8f298d15"
    },
    "structuredData": {
      "reservation": {
        "date": "2025-11-27",
        "time": "20:00",
        "people": 4,
        "full_name": "Juan Pérez",
        "honorific": "Sr.",
        "baby": false,
        "allergies": "gluten",
        "special_requests": "mesa junto a la ventana"
      }
    },
    "transcript": "AI: Hola...\nUser: Quiero hacer una reserva...",
    "summary": "Customer made a reservation for 4 people on Nov 27.",
    "startedAt": "2025-11-20T12:33:20.740Z",
    "endedAt": "2025-11-20T12:35:28.338Z",
    "cost": 0.1931,
    "durationSeconds": 127.598
  }
}
```

**Key Fields:**
- `message.type`: "end-of-call-report"
- `message.structuredData.reservation`: Your defined schema
- `message.call`: Full call metadata
- Extra fields: `transcript`, `summary`, `startedAt`, `endedAt`, `cost`, `durationSeconds`

**Expected Response:**
```json
{
  "success": true,
  "message": "Reservation received successfully",
  "data": {
    "reservationId": "ALAKRAN-1234567890",
    "customer": "Sr. Juan Pérez",
    "dateTime": "2025-11-27 at 20:00",
    "guestCount": 4,
    "hasBaby": false,
    "allergies": "gluten",
    "specialRequests": "mesa junto a la ventana",
    "status": "pending_confirmation",
    "createdAt": "2025-11-20T15:41:00.000Z"
  }
}
```

---

## Important Notes

### Why `.passthrough()` Was Needed

Vapi sends **many extra fields** that weren't in our original schema:
- `message.toolCalls` (array)
- `message.role`
- `message.time`
- `message.secondsFromStart`
- `message.call` (full object)
- `message.transcript`
- `message.summary`
- `message.cost`
- And more...

Without `.passthrough()`, Zod rejects these extra fields → 400 error → "No result returned"

### Field Variations

Vapi may include additional fields depending on:
- Call type (inbound vs outbound)
- Assistant configuration
- Model used
- Analysis settings

Always use `.passthrough()` to handle these gracefully.

---

## Testing with Exact Formats

Use these test scripts which include the exact formats:

```bash
# Test availability check with exact Vapi format
./test-vapi-actual-request.sh

# Test reservation complete with exact Vapi format
./test-vapi-reservation-complete.sh

# Test all endpoints
./test-all-webhooks.sh
```

---

## Common Issues

### Issue: "No result returned"
**Cause:** Webhook not responding (validation fails, timeout, unreachable)
**Check:**
1. Is `.passthrough()` in schemas?
2. Is service running?
3. Is ngrok forwarding correctly?

### Issue: Validation errors
**Cause:** Schema too strict
**Fix:** Add `.passthrough()` at all levels

### Issue: Tool call ID mismatch
**Cause:** Not returning the same `toolCallId` in response
**Fix:** Use `message.functionCall.id` from request

---

## References

- Real call log: See the JSON you provided earlier
- Vapi docs: https://docs.vapi.ai/webhooks
- Function tools: https://docs.vapi.ai/tools/function
- Structured data: https://docs.vapi.ai/structured-data
