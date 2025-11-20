# Architecture Overview

## System Flow Diagram

```
┌─────────────┐
│   Customer  │
│   (Phone)   │
└──────┬──────┘
       │ Makes call
       ↓
┌─────────────────────────────────────────────────────────────┐
│                      VAPI ASSISTANT                         │
│  "Hola, soy el asistente de Hacienda Alakran..."          │
└──────┬──────────────────────────────────────────┬──────────┘
       │                                           │
       │ 1. During conversation                    │ 3. After call ends
       │    (Check availability)                   │    (Save reservation)
       ↓                                           ↓
┌──────────────────────────────┐    ┌──────────────────────────────┐
│   Webhook Endpoint #1        │    │   Webhook Endpoint #2        │
│   /check-availability        │    │   /reservation-complete      │
│                              │    │                              │
│   Receives:                  │    │   Receives:                  │
│   - fecha: "2025-09-03"     │    │   - date: "2025-09-03"      │
│   - hora: "13:00"           │    │   - time: "13:00"           │
│   - personas: 4             │    │   - people: 4               │
│                              │    │   - full_name: "Juan"       │
│   Returns:                   │    │   - honorific: "Sr."        │
│   "Disponibilidad..."       │    │   - baby: false             │
│                              │    │   - allergies: "gluten"     │
│                              │    │   - special_requests: "..." │
└──────┬───────────────────────┘    └──────┬───────────────────────┘
       │                                    │
       │ TODO: Connect                      │ TODO: Connect
       ↓                                    ↓
┌─────────────────────────────────────────────────────────────┐
│              RESTAURANT API (Future)                        │
│  - Check real-time availability                            │
│  - Create reservations                                     │
│  - Manage bookings                                         │
└─────────────────────────────────────────────────────────────┘
```

## Webhook Flow Details

### Flow 1: Availability Check (During Call)

```
1. Customer: "Quiero reservar para 4 personas el 3 de septiembre a las 13:00"

2. Vapi extracts:
   - fecha: "2025-09-03"
   - hora: "13:00"
   - personas: 4

3. Vapi calls: POST /webhooks/check-availability
   {
     "message": {
       "type": "function-call",
       "functionCall": {
         "name": "checkAvailabilityALAKRAN",
         "parameters": { "fecha": "2025-09-03", "hora": "13:00", "personas": 4 }
       }
     }
   }

4. Your service:
   ✓ Validates the data format
   ✓ Logs the request
   ✓ [TODO: Checks restaurant API]
   ✓ Returns availability message

5. Response to Vapi:
   {
     "results": [{
       "result": "Perfecto, tenemos disponibilidad para 4 personas..."
     }]
   }

6. Vapi tells customer: "Perfecto, tenemos disponibilidad..."
```

### Flow 2: Reservation Complete (After Call)

```
1. Call ends successfully with all details collected

2. Vapi sends: POST /webhooks/reservation-complete
   {
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
   }

3. Your service:
   ✓ Validates complete data
   ✓ Logs all details
   ✓ [TODO: Creates reservation in restaurant system]
   ✓ Returns success confirmation

4. Response to Vapi:
   {
     "success": true,
     "message": "Reservation received successfully",
     "data": { ... }
   }
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Express Server                          │
│                      (index.ts)                             │
└──────┬──────────────────────────────────────────────────────┘
       │
       ├─── Middleware
       │    ├─── Request Logger (logs incoming requests)
       │    ├─── Response Logger (logs outgoing responses)
       │    ├─── Body Parser (parses JSON)
       │    └─── Validator (Zod schema validation)
       │
       ├─── Routes (/webhooks)
       │    ├─── POST /check-availability
       │    └─── POST /reservation-complete
       │
       └─── Controllers
            ├─── availabilityController.ts
            │    └─── Validates → Logs → [TODO: API Call] → Responds
            │
            └─── reservationController.ts
                 └─── Validates → Logs → [TODO: API Call] → Responds
```

## Data Flow

### Type Safety with Zod

```typescript
// Incoming Request (Vapi)
CheckAvailabilitySchema
  ↓
Validated Parameters
  ↓
CheckAvailabilityParams interface
  ↓
Controller Logic
  ↓
VapiToolResponse interface
  ↓
JSON Response (back to Vapi)
```

### Request Validation Flow

```
1. Request arrives → Express
2. Logger middleware → Logs full request
3. Validator middleware → Zod schema validation
   ├─ Valid? → Continue to controller
   └─ Invalid? → Return 400 with error details
4. Controller → Process request
5. Response → Back through logger
```

## Error Handling

```
┌─────────────────┐
│  Request Arrives│
└────────┬────────┘
         │
         ↓
    ┌────────────────┐
    │ Validation     │
    └────┬───────────┘
         │
    ┌────┴─────┐
    │  Valid?  │
    └────┬─────┘
         │
    ┌────┴────────────┐
    │ Yes          No │
    ↓                 ↓
┌──────────┐    ┌─────────────┐
│Controller│    │Return 400   │
│          │    │with errors  │
└────┬─────┘    └─────────────┘
     │
     ↓
┌──────────────┐
│ Try/Catch    │
└────┬─────────┘
     │
┌────┴────────────┐
│Success      Error│
↓                  ↓
┌────────┐    ┌─────────────┐
│Return  │    │Return 500   │
│200     │    │with error   │
└────────┘    └─────────────┘
```

## Security Layers

```
1. HTTPS (in production)
   ↓
2. Optional Webhook Secret Verification
   ↓
3. Zod Schema Validation
   ↓
4. Data Format Validation
   ↓
5. Controller Logic
```

## Logging Strategy

Every request logs:
- Timestamp
- HTTP Method and Path
- Headers (for debugging authentication)
- Full request body
- Validation results
- Processing steps
- Response status and data

Example log output:
```
========================================
[2025-11-19T15:41:00.000Z] POST /webhooks/check-availability
Headers: {...}
Body: {
  "message": {
    "type": "function-call",
    "functionCall": {...}
  }
}
========================================

=== Check Availability Request ===
Received parameters:
- Fecha (Date): 2025-09-03
- Hora (Time): 13:00
- Personas (People): 4
✓ Data validation passed
✓ Simulating availability check...
Responding with: Perfecto, tenemos disponibilidad...

========================================
Response for POST /webhooks/check-availability:
Status: 200
Data: {...}
========================================
```

## Technology Stack

```
┌─────────────────────────────────────┐
│         Node.js Runtime             │
├─────────────────────────────────────┤
│         TypeScript                  │
│  (Compile-time type safety)         │
├─────────────────────────────────────┤
│         Express.js                  │
│  (HTTP server framework)            │
├─────────────────────────────────────┤
│            Zod                      │
│  (Runtime validation)               │
├─────────────────────────────────────┤
│         dotenv                      │
│  (Environment config)               │
└─────────────────────────────────────┘
```

## Future Integration Points

### When Restaurant API is Available

1. **In availabilityController.ts:**
```typescript
import { restaurantAPI } from './api/restaurant';

const availability = await restaurantAPI.checkAvailability({
  date: params.fecha,
  time: params.hora,
  numberOfGuests: params.personas
});

if (availability.available) {
  return availabilityMessage;
} else {
  return "Lo siento, no tenemos disponibilidad...";
}
```

2. **In reservationController.ts:**
```typescript
import { restaurantAPI } from './api/restaurant';

const reservation = await restaurantAPI.createReservation({
  date: reservationData.date,
  time: reservationData.time,
  numberOfGuests: reservationData.people,
  customerName: reservationData.full_name,
  // ... other fields
});

// Store reservation ID, send confirmation email, etc.
```

## Deployment Architecture

```
┌──────────────┐
│   Customer   │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│     Vapi     │
└──────┬───────┘
       │ HTTPS
       ↓
┌──────────────────────────────┐
│  Load Balancer / CDN         │
│  (CloudFlare, AWS ALB, etc)  │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│  Your Webhook Service        │
│  (Node.js + Express)         │
│  - Health checks             │
│  - Auto-scaling              │
│  - Logging/Monitoring        │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│  Restaurant API/Database     │
│  (Future integration)        │
└──────────────────────────────┘
```

## Performance Considerations

- **Response Time:** Vapi expects responses within ~10 seconds
- **Concurrent Requests:** Service can handle multiple simultaneous calls
- **Logging:** Asynchronous logging doesn't block responses
- **Validation:** Zod validation is fast (microseconds)
- **Scalability:** Stateless design allows horizontal scaling

## Monitoring Points

Track these metrics:
- Request count per endpoint
- Response time distribution
- Validation failure rate
- Error rate (4xx, 5xx)
- Availability check patterns
- Successful reservation rate
- Most requested dates/times
