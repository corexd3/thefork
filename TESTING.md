# Testing Guide

This document provides detailed instructions for testing the Hacienda Alakran Vapi webhook service.

## Setup for Testing

1. Start the development server:
```bash
npm run dev
```

2. The server should be running on `http://localhost:3000`

## Test Scenarios

### 1. Health Check

Verify the service is running:

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "Hacienda Alakran Vapi Service",
  "timestamp": "2025-11-19T15:08:00.000Z"
}
```

### 2. Check Availability - Valid Request

Test with valid reservation parameters:

```bash
curl -X POST http://localhost:3000/webhooks/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "function-call",
      "functionCall": {
        "name": "checkAvailabilityALAKRAN",
        "id": "call-abc123",
        "parameters": {
          "hora": "13:00",
          "fecha": "2025-09-03",
          "personas": 4
        }
      }
    }
  }'
```

**Expected Response:**
```json
{
  "results": [{
    "toolCallId": "call-abc123",
    "result": "Perfecto, tenemos disponibilidad para 4 personas el 2025-09-03 a las 13:00. ¿Desea confirmar la reserva?"
  }]
}
```

**Check Console Logs:**
- Should show received parameters
- Should show validation passed
- Should show simulated availability check

### 3. Check Availability - Invalid Date Format

Test with invalid date format:

```bash
curl -X POST http://localhost:3000/webhooks/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "function-call",
      "functionCall": {
        "name": "checkAvailabilityALAKRAN",
        "id": "call-def456",
        "parameters": {
          "hora": "13:00",
          "fecha": "03/09/2025",
          "personas": 4
        }
      }
    }
  }'
```

**Expected Response:**
```json
{
  "results": [{
    "toolCallId": "call-def456",
    "result": "Lo siento, los datos de la reserva no son válidos. Por favor, intente nuevamente."
  }]
}
```

### 4. Check Availability - Invalid People Count

Test with invalid number of people:

```bash
curl -X POST http://localhost:3000/webhooks/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "function-call",
      "functionCall": {
        "name": "checkAvailabilityALAKRAN",
        "id": "call-ghi789",
        "parameters": {
          "hora": "13:00",
          "fecha": "2025-09-03",
          "personas": 0
        }
      }
    }
  }'
```

**Expected Response:**
Error message about invalid data.

### 5. Reservation Complete - Valid Request

Test with complete reservation data:

```bash
curl -X POST http://localhost:3000/webhooks/reservation-complete \
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
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Reservation received successfully",
  "data": {
    "reservationId": "ALAKRAN-1700408880000",
    "customer": "Sr. Juan Pérez",
    "dateTime": "2025-09-03 at 13:00",
    "guestCount": 4,
    "hasBaby": false,
    "allergies": "gluten",
    "specialRequests": "mesa junto a la ventana",
    "status": "pending_confirmation",
    "createdAt": "2025-11-19T15:08:00.000Z"
  }
}
```

**Check Console Logs:**
- Should show all received reservation fields
- Should show validation passed
- Should show reservation summary

### 6. Reservation Complete - With Baby

Test reservation with baby:

```bash
curl -X POST http://localhost:3000/webhooks/reservation-complete \
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
  }'
```

**Expected Response:**
Should include `"hasBaby": true` in the data.

### 7. Reservation Complete - No Allergies or Special Requests

Test minimal reservation data:

```bash
curl -X POST http://localhost:3000/webhooks/reservation-complete \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "end-of-call-report",
      "structuredData": {
        "reservation": {
          "date": "2025-10-15",
          "time": "20:00",
          "people": 6,
          "full_name": "Carlos Rodríguez",
          "honorific": "Don",
          "baby": false,
          "allergies": "",
          "special_requests": ""
        }
      }
    }
  }'
```

**Expected Response:**
Should show "None" for allergies and special requests in the summary.

### 8. Invalid Request - Wrong Schema

Test with incorrect message type:

```bash
curl -X POST http://localhost:3000/webhooks/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "wrong-type",
      "data": {}
    }
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid request data",
  "errors": [...]
}
```

### 9. Missing Required Fields

Test with missing required parameters:

```bash
curl -X POST http://localhost:3000/webhooks/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "function-call",
      "functionCall": {
        "name": "checkAvailabilityALAKRAN",
        "parameters": {
          "hora": "13:00"
        }
      }
    }
  }'
```

**Expected Response:**
Validation error with details about missing fields.

## Testing with Webhook Secret

If you have `WEBHOOK_SECRET` configured in your `.env` file:

### With Valid Secret:

```bash
curl -X POST http://localhost:3000/webhooks/check-availability \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your_webhook_secret_here" \
  -d '{
    "message": {
      "type": "function-call",
      "functionCall": {
        "name": "checkAvailabilityALAKRAN",
        "parameters": {
          "hora": "13:00",
          "fecha": "2025-09-03",
          "personas": 4
        }
      }
    }
  }'
```

### With Invalid Secret:

```bash
curl -X POST http://localhost:3000/webhooks/check-availability \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: wrong_secret" \
  -d '{...}'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

## Testing with Postman

You can also import these requests into Postman:

1. Create a new collection called "Alakran Vapi"
2. Add environment variable `BASE_URL` = `http://localhost:3000`
3. Create requests for each test case above
4. Use `{{BASE_URL}}/webhooks/check-availability` in the URL

## Monitoring Logs

When testing, monitor the console output for detailed logs:

```bash
npm run dev
```

You should see:
- Request headers and body
- Parameter validation results
- Simulated API calls
- Response data
- Any errors or warnings

## Next Steps After Testing

Once you've verified all endpoints work correctly:

1. Test with actual Vapi integration
2. Update webhook URLs in Vapi dashboard
3. Test end-to-end phone call flow
4. Implement actual restaurant API integration
5. Add database persistence if needed
6. Set up production deployment
7. Configure monitoring and alerting

## Common Issues

### Port Already in Use
```bash
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:** Change the PORT in `.env` or kill the process using port 3000.

### Validation Errors
If you get validation errors, check:
- Message type matches expected value
- All required fields are present
- Field types are correct (string vs number)
- Date/time formats match specifications

### 404 Not Found
Verify:
- Server is running
- Endpoint path is correct (`/webhooks/check-availability` not `/check-availability`)
- HTTP method is POST

## Success Criteria

Your webhooks are working correctly when:
- ✓ Health check returns 200
- ✓ Valid availability checks return proper Vapi response
- ✓ Invalid data is rejected with appropriate errors
- ✓ Reservation data is received and logged completely
- ✓ All console logs show expected data
- ✓ Response times are under 1 second
- ✓ No unhandled errors in console
