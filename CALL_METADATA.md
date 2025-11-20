# Accessing Call Metadata from Vapi

This guide shows how to access various pieces of call metadata that Vapi includes in webhook requests.

## 📞 Customer Phone Number

### Location in Webhook Data

```javascript
message.call.customer.number
```

### Example from Actual Call Log

```json
{
  "message": {
    "call": {
      "customer": {
        "number": "+34655720245"
      }
    }
  }
}
```

### How to Access in Code

```typescript
// In reservationController.ts
const customerPhone = message.call?.customer?.number || 'Unknown';

console.log('Customer phone:', customerPhone);
// Output: Customer phone: +34655720245
```

### Use Cases
- Save to database for customer records
- Send SMS confirmations
- Contact customer if issues arise
- Link reservations to customer profile
- Send reminders before reservation

---

## 🆔 Call ID

### Location
```javascript
message.call.id
```

### Example
```json
{
  "message": {
    "call": {
      "id": "019aa141-4449-7775-8d7e-006f2a64e546"
    }
  }
}
```

### How to Access
```typescript
const callId = message.call?.id;
```

### Use Cases
- Reference for support issues
- Link reservation to specific call
- Debugging and logging
- Audit trail

---

## 🏢 Organization & Assistant Info

### Location
```javascript
message.call.orgId
message.call.assistantId
```

### Example
```json
{
  "message": {
    "call": {
      "orgId": "6017716f-353f-428a-ae9f-103326badf6c",
      "assistantId": "15867747-f6fd-42b3-a353-63687fecc2b4"
    }
  }
}
```

### How to Access
```typescript
const orgId = message.call?.orgId;
const assistantId = message.call?.assistantId;
```

### Use Cases
- Multi-tenant applications
- Track which assistant handled the call
- Routing logic based on assistant
- Analytics per assistant

---

## ⏱️ Call Timing Information

### Location
```javascript
message.startedAt    // When call started
message.endedAt      // When call ended
message.durationSeconds  // Call duration
```

### Example
```json
{
  "message": {
    "startedAt": "2025-11-20T12:33:20.740Z",
    "endedAt": "2025-11-20T12:35:28.338Z",
    "durationSeconds": 127.598
  }
}
```

### How to Access
```typescript
const startTime = new Date(message.startedAt);
const endTime = new Date(message.endedAt);
const duration = message.durationSeconds;

console.log(`Call lasted ${duration} seconds`);
```

### Use Cases
- Calculate call costs
- Analytics on call length
- Track efficiency
- Billing information

---

## 💰 Call Cost

### Location
```javascript
message.cost
message.costBreakdown
```

### Example
```json
{
  "message": {
    "cost": 0.1931,
    "costBreakdown": {
      "stt": 0.0217,
      "llm": 0.0061,
      "tts": 0.0574,
      "vapi": 0.1063,
      "transport": 0,
      "total": 0.1931
    }
  }
}
```

### How to Access
```typescript
const totalCost = message.cost;
const breakdown = message.costBreakdown;

console.log(`Call cost: $${totalCost}`);
console.log(`STT: $${breakdown.stt}, LLM: $${breakdown.llm}`);
```

### Use Cases
- Track operational costs
- Bill customers
- Cost optimization
- Analytics

---

## 📝 Transcript & Summary

### Location
```javascript
message.transcript  // Full conversation
message.summary     // AI-generated summary
```

### Example
```json
{
  "message": {
    "transcript": "AI: Hola, soy Marcos...\nUser: Quiero hacer una reserva...",
    "summary": "The customer made a reservation for November 27th at 8 PM for 4 people."
  }
}
```

### How to Access
```typescript
const transcript = message.transcript;
const summary = message.summary;
```

### Use Cases
- Quality assurance
- Training data
- Dispute resolution
- Customer service review
- Compliance records

---

## 📞 Phone Number Information

### Location
```javascript
message.call.phoneNumberId
message.phoneNumber  // Full phone number object
```

### Example
```json
{
  "message": {
    "call": {
      "phoneNumberId": "9285f1a8-b62f-4ff0-89ab-bdaa8f298d15"
    },
    "phoneNumber": {
      "id": "9285f1a8-b62f-4ff0-89ab-bdaa8f298d15",
      "number": "+34951793920",
      "name": "Dexiu Zhan Zhang",
      "provider": "twilio"
    }
  }
}
```

### How to Access
```typescript
const restaurantNumber = message.phoneNumber?.number;
const numberProvider = message.phoneNumber?.provider;
```

### Use Cases
- Track which restaurant number was called
- Multi-location handling
- Provider-specific logic

---

## 🔚 End Reason

### Location
```javascript
message.call.endedReason
```

### Possible Values
- `"customer-ended-call"` - Customer hung up
- `"assistant-ended-call"` - Assistant ended call
- `"assistant-forwarded-call"` - Call was transferred
- `"assistant-error"` - Technical error
- And more...

### Example
```json
{
  "message": {
    "call": {
      "endedReason": "customer-ended-call"
    }
  }
}
```

### How to Access
```typescript
const endReason = message.call?.endedReason;

if (endReason === 'assistant-error') {
  // Log for investigation
  console.error('Call ended due to error');
}
```

### Use Cases
- Quality monitoring
- Error tracking
- User experience analytics
- Debugging issues

---

## 🎯 Complete Example

Here's how to extract all useful metadata:

```typescript
export const completeReservation = async (req: Request, res: Response) => {
  const { message } = req.body;

  // Reservation data
  const reservationData = message.structuredData.reservation;

  // Call metadata
  const metadata = {
    // Customer info
    customerPhone: message.call?.customer?.number || 'Unknown',

    // Call info
    callId: message.call?.id,
    callDuration: message.durationSeconds,
    callCost: message.cost,

    // Timing
    startTime: message.startedAt,
    endTime: message.endedAt,

    // Context
    transcript: message.transcript,
    summary: message.summary,
    endReason: message.call?.endedReason,

    // Organization
    orgId: message.call?.orgId,
    assistantId: message.call?.assistantId,
    phoneNumberId: message.call?.phoneNumberId,

    // Restaurant number called
    restaurantNumber: message.phoneNumber?.number
  };

  console.log('Full metadata:', metadata);

  // Use in API call
  await restaurantAPI.createReservation({
    ...reservationData,
    customerPhone: metadata.customerPhone,
    callId: metadata.callId,
    // ... other fields
  });
};
```

---

## 📊 Metadata Summary Table

| Field | Location | Type | Use Case |
|-------|----------|------|----------|
| Customer Phone | `message.call.customer.number` | string | Contact customer |
| Call ID | `message.call.id` | string | Reference/tracking |
| Duration | `message.durationSeconds` | number | Analytics |
| Cost | `message.cost` | number | Billing |
| Transcript | `message.transcript` | string | Review/QA |
| Summary | `message.summary` | string | Quick overview |
| Start Time | `message.startedAt` | ISO date | Timing |
| End Time | `message.endedAt` | ISO date | Timing |
| End Reason | `message.call.endedReason` | string | Error tracking |
| Assistant ID | `message.call.assistantId` | string | Multi-assistant |
| Org ID | `message.call.orgId` | string | Multi-tenant |

---

## ⚠️ Important Notes

### Always Use Optional Chaining

Since Vapi's payload structure can vary:

```typescript
// ✅ Good - Safe access
const phone = message.call?.customer?.number || 'Unknown';

// ❌ Bad - Can throw error
const phone = message.call.customer.number;
```

### Handle Missing Data

Not all fields are guaranteed:

```typescript
const phone = message.call?.customer?.number;
if (!phone) {
  console.warn('No customer phone number available');
  // Handle gracefully
}
```

### Schema with .passthrough()

Make sure your Zod schemas use `.passthrough()` to accept all these extra fields:

```typescript
export const ReservationCompletionSchema = z.object({
  message: z.object({
    type: z.literal('end-of-call-report'),
    structuredData: z.object({ ... })
  }).passthrough()  // ← Allows call, transcript, cost, etc.
}).passthrough();
```

---

## 🧪 Testing

Test scripts now include the customer phone number:

```bash
./test-vapi-reservation-complete.sh
```

You should see in the output:
```
- Phone Number: +34655720245
- Date: 2025-11-27
- Time: 20:00
...
```

---

## 📚 Related Documentation

- [VAPI_CONCEPTS.md](VAPI_CONCEPTS.md) - Understanding Vapi basics
- [TESTING_SUMMARY.md](TESTING_SUMMARY.md) - Testing guide
- [test-vapi-exact-formats.md](test-vapi-exact-formats.md) - Exact payload formats

---

## ✅ Implementation Checklist

When integrating with your restaurant API:

- [ ] Extract customer phone number
- [ ] Save call ID for reference
- [ ] Store transcript for records
- [ ] Log call duration and cost
- [ ] Handle missing fields gracefully
- [ ] Use optional chaining (?.) everywhere
- [ ] Test with actual Vapi payloads
- [ ] Update database schema if needed
